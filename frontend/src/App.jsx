import React, { useState, useEffect, useRef } from 'react'
import { Crosshair, Camera } from 'lucide-react'
import InteractiveMap from './components/InteractiveMap'
import GoogleMapsSearchBar from './components/GoogleMapsSearchBar'
import GoogleMapsDirectionsSidebar from './components/GoogleMapsDirectionsSidebar'
import GoogleMapsMenuDrawer from './components/GoogleMapsMenuDrawer'
import ReportModal from './components/ReportModal'
import MunicipalPumpDashboard from './components/MunicipalPumpDashboard'
import IncidentDetailModal from './components/IncidentDetailModal'
import GoogleApiKeyModal from './components/GoogleApiKeyModal'
import ObservabilityModal from './components/ObservabilityModal'
import AudioRadarDrawer from './components/AudioRadarDrawer'
import { 
  MULTI_CITY_INCIDENTS, 
  MULTI_CITY_POTHOLES, 
  MULTI_CITY_ROUTES,
  CITY_CONFIGS,
  calculateDynamicRoute
} from './data/mockTelemetry'
import {
  fetchStreetRoute,
  findCorridorHazard,
  calculateDetourWaypoint,
  VEHICLE_THRESHOLDS
} from './utils/roadRouter'

export default function App() {
  const [vehicle, setVehicle] = useState('BIKE') // 'BIKE' | 'SEDAN' | 'SUV'
  const [selectedCity, setSelectedCity] = useState('BLR') // 'BLR' | 'DEL' | 'BOM'
  const [allIncidents, setAllIncidents] = useState(MULTI_CITY_INCIDENTS)
  const [showPotholes, setShowPotholes] = useState(true)
  const [showTraffic, setShowTraffic] = useState(false)
  const [audioRadarActive, setAudioRadarActive] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isLiveTrackingActive, setIsLiveTrackingActive] = useState(false)
  const watchIdRef = useRef(null)

  // Google Maps Style Navigation & Sidebar Modes
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)       // Can be toggled with < / > button
  const [isMenuOpen, setIsMenuOpen] = useState(false)             // Hamburger menu drawer

  // Google Maps API Key State (from .env or localStorage)
  const [googleApiKey, setGoogleApiKey] = useState(() => {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('jalmarg_gmaps_api_key') || ''
  })
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)

  // Dynamic Navigation Origin and Destination State
  const [origin, setOrigin] = useState(() => MULTI_CITY_ROUTES.BLR.origin)
  const [destination, setDestination] = useState(() => MULTI_CITY_ROUTES.BLR.destination)
  const [pickingMode, setPickingMode] = useState(null) // 'ORIGIN' | 'DESTINATION' | null

  // Real-world street-accurate road geometry state
  const [realRoadRoute, setRealRoadRoute] = useState(null)

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isCivicDashboardOpen, setIsCivicDashboardOpen] = useState(false)
  const [isObservabilityOpen, setIsObservabilityOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Current city active telemetry
  const currentIncidents = allIncidents[selectedCity] || []
  const currentPotholes = MULTI_CITY_POTHOLES[selectedCity] || []

  // Auto-reset corridor when city changes, preserving user live GPS origin if active
  useEffect(() => {
    const cityRoute = MULTI_CITY_ROUTES[selectedCity] || MULTI_CITY_ROUTES.BLR
    setOrigin(prev => {
      if (prev && prev.name && prev.name.includes('Your location')) return prev
      return cityRoute.origin
    })
    setDestination(cityRoute.destination)
    setPickingMode(null)
    setRealRoadRoute(null)
  }, [selectedCity])

  // Resolve Real Road Network geometry when origin/destination change
  useEffect(() => {
    let isCancelled = false
    async function resolveStreets() {
      if (!origin || !destination) return

      const cityDefaults = MULTI_CITY_ROUTES[selectedCity] || MULTI_CITY_ROUTES.BLR
      const isDefault =
        cityDefaults &&
        Math.abs(origin.lat - cityDefaults.origin.lat) < 0.005 &&
        Math.abs(origin.lng - cityDefaults.origin.lng) < 0.005 &&
        Math.abs(destination.lat - cityDefaults.destination.lat) < 0.005 &&
        Math.abs(destination.lng - cityDefaults.destination.lng) < 0.005

      // For default corridor endpoints, mockTelemetry already has high-res road coordinates
      if (isDefault) {
        setRealRoadRoute(null)
        return
      }

      // Fetch authentic street road geometry from OSRM
      const direct = await fetchStreetRoute([origin, destination])
      if (isCancelled || !direct) return

      const hazard = findCorridorHazard(direct.path, currentIncidents)
      const limit = VEHICLE_THRESHOLDS[vehicle] || 20
      const isBlocked = hazard && hazard.depthCm >= limit

      let detour = null
      if (isBlocked && hazard) {
        const detourWaypoint = calculateDetourWaypoint(origin, destination, hazard)
        detour = await fetchStreetRoute([origin, detourWaypoint, destination])
      }

      if (!isCancelled) {
        setRealRoadRoute({
          directPath: direct.path,
          directDistanceKm: direct.distanceKm,
          directDurationMins: direct.durationMins,
          detourPath: detour ? detour.path : direct.path,
          detourDistanceKm: detour ? detour.distanceKm : direct.distanceKm,
          detourDurationMins: detour ? detour.durationMins : direct.durationMins,
          distanceKm: detour ? detour.distanceKm : direct.distanceKm,
          durationMins: detour ? detour.durationMins : direct.durationMins
        })
      }
    }

    resolveStreets()
    return () => { isCancelled = true }
  }, [origin, destination, selectedCity, vehicle, currentIncidents])

  // Real-time Dynamic Flood Clearance Routing Calculation (Snapped to Real Roads)
  const activeRouteData = calculateDynamicRoute(
    origin,
    destination,
    selectedCity,
    vehicle,
    currentIncidents,
    realRoadRoute
  )

  const handleSaveApiKey = (newKey) => {
    setGoogleApiKey(newKey)
    if (newKey) {
      localStorage.setItem('jalmarg_gmaps_api_key', newKey)
    } else {
      localStorage.removeItem('jalmarg_gmaps_api_key')
    }
  }

  // 1. Auto-Fetch GPS Location on Initial Site Load
  const handleAutoDetectLocation = (centerMap = true) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        const acc = Math.round(position.coords.accuracy || 5)
        const newLoc = {
          lat: userLat,
          lng: userLng,
          name: `Your location (Live GPS ±${acc}m)`,
          accuracy: acc,
          shouldFlyTo: centerMap
        }
        setUserLocation(newLoc)
        setOrigin(newLoc)

        // Calculate closest supported metro
        const distToBlr = Math.hypot(userLat - 12.9716, userLng - 77.5946)
        const distToDel = Math.hypot(userLat - 28.6139, userLng - 77.2090)
        const distToBom = Math.hypot(userLat - 19.0760, userLng - 72.8777)

        let closest = 'BLR'
        if (distToDel < distToBlr && distToDel < distToBom) closest = 'DEL'
        else if (distToBom < distToBlr && distToBom < distToDel) closest = 'BOM'

        setSelectedCity(closest)
        setIsLocating(false)
      },
      (error) => {
        console.warn("Geolocation access denied or timed out:", error.message)
        setIsLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    )
  }

  // 1b. Real-Time Continuous GPS Tracking Toggle
  const toggleLiveTracking = () => {
    if (isLiveTrackingActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setIsLiveTrackingActive(false)
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported on this device.")
        return
      }
      setIsLocating(true)
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const acc = Math.round(position.coords.accuracy || 5)
          const liveLoc = {
            lat,
            lng,
            name: `Your location (Live GPS ±${acc}m)`,
            accuracy: acc,
            shouldFlyTo: false
          }
          setUserLocation(liveLoc)
          setIsLocating(false)
          setIsLiveTrackingActive(true)

          // Keep origin dynamically pinned if user selected "Your location"
          setOrigin(prev => {
            if (prev?.name?.includes('Your location') || prev?.name?.includes('Live GPS')) {
              return liveLoc
            }
            return prev
          })
        },
        (error) => {
          console.warn("Continuous GPS watch error:", error.message)
          setIsLocating(false)
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      )
      watchIdRef.current = id
      setIsLiveTrackingActive(true)
    }
  }

  // Cleanup watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    handleAutoDetectLocation(true)
  }, [])

  // 2. Point Swap and Map Click Handlers
  const handleSwapPoints = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const handleMapClick = (latlng) => {
    const pointName = `📍 Picked Location (${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)})`
    const newPoint = { lat: latlng.lat, lng: latlng.lng, name: pointName }
    if (pickingMode === 'ORIGIN') {
      setOrigin(newPoint)
    } else if (pickingMode === 'DESTINATION') {
      setDestination(newPoint)
      setIsSidebarOpen(true)
    }
    setPickingMode(null)
  }

  // 3. User selects destination from search bar
  const handleSearchSelectDestination = (dest) => {
    setDestination(dest)
    setIsSidebarOpen(true)
  }

  // 4. Add crowdsourced incident in real time
  const handleAddIncident = (newIncident) => {
    setAllIncidents(prev => ({
      ...prev,
      [selectedCity]: [newIncident, ...(prev[selectedCity] || [])]
    }))
    // Open verification modal so commuter immediately inspects their newly uploaded real-time flood pin
    setSelectedIncident(newIncident)
  }

  // 5. Dispatch de-watering pump unit
  const handleDispatchPump = (incidentId) => {
    setAllIncidents(prev => ({
      ...prev,
      [selectedCity]: prev[selectedCity].map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            pumpDispatched: true,
            pumpStatus: 'PUMP_EN_ROUTE'
          }
        }
        return inc
      })
    }))
  }

  const activePumpTicketsCount = currentIncidents.filter(i => i.depthCm >= 25 && !i.pumpDispatched).length

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      margin: 0,
      padding: 0,
      background: '#E8EAED',
      fontFamily: 'Roboto, Arial, sans-serif'
    }}>
      {/* ============================================================== */}
      {/* 1. FULLSCREEN MAP (100% WIDTH, 100% HEIGHT, EDGE-TO-EDGE)       */}
      {/* ============================================================== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <InteractiveMap
          selectedCity={selectedCity}
          incidents={currentIncidents}
          potholes={currentPotholes}
          showPotholes={showPotholes}
          showTraffic={showTraffic}
          vehicle={vehicle}
          activeRoute={activeRouteData}
          userLocation={userLocation}
          origin={origin}
          destination={destination}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          pickingMode={pickingMode}
          onMapClick={handleMapClick}
          googleApiKey={googleApiKey}
        />
      </div>

      {/* Floating Google Maps Style Location & Report Action Controls */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {/* Floating Live Tracking HUD if active */}
        {isLiveTrackingActive && userLocation && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid #1A73E8',
            borderRadius: '24px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            fontSize: '12px',
            color: '#FFFFFF',
            pointerEvents: 'auto'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} className="pulse-radar" />
            <span style={{ fontWeight: 600 }}>Live GPS Tracking: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} (±{userLocation.accuracy || 5}m)</span>
            <button
              onClick={toggleLiveTracking}
              id="btn-hud-stop-tracking"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#E2E8F0',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Stop
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {/* Quick Report Flood Floating Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            id="btn-fab-report-flood"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#D93025',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '24px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 3px 12px rgba(217, 48, 37, 0.4)',
              cursor: 'pointer',
              transition: 'transform 0.15s, background 0.15s'
            }}
            title="Upload real-time photo of waterlogging"
          >
            <Camera size={16} />
            <span>Report Flood</span>
          </button>

          {/* Google Maps Style My Location / Live Tracking FAB */}
          <button
            onClick={toggleLiveTracking}
            id="btn-fab-my-location"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: isLiveTrackingActive ? '2px solid #1A73E8' : '1px solid rgba(0,0,0,0.15)',
              boxShadow: isLiveTrackingActive ? '0 0 16px rgba(26, 115, 232, 0.6)' : '0 2px 8px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            title={isLiveTrackingActive ? 'Live GPS Tracking Active (Click to stop)' : 'Trace Current Location & Follow Me'}
          >
            <Crosshair size={22} color={isLiveTrackingActive ? '#1A73E8' : '#5F6368'} className={isLocating ? 'spin-icon' : ''} />
            {isLiveTrackingActive && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #FFFFFF'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FLOATING TOP SEARCH BAR (When Sidebar is Collapsed)          */}
      {/* ============================================================== */}
      {!isSidebarOpen && (
        <GoogleMapsSearchBar
          selectedCity={selectedCity}
          onOpenDirections={() => setIsSidebarOpen(true)}
          onSelectDestination={handleSearchSelectDestination}
          onToggleMenu={() => setIsMenuOpen(true)}
          vehicle={vehicle}
          setVehicle={setVehicle}
          showPotholes={showPotholes}
          setShowPotholes={setShowPotholes}
          audioRadarActive={audioRadarActive}
          setAudioRadarActive={setAudioRadarActive}
          showTraffic={showTraffic}
          setShowTraffic={setShowTraffic}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onAutoDetectLocation={handleAutoDetectLocation}
        />
      )}

      {/* ============================================================== */}
      {/* 3. GOOGLE MAPS DIRECTIONS SIDEBAR (Always Mounted, Collapsible) */}
      {/* ============================================================== */}
      <GoogleMapsDirectionsSidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onCloseDirections={() => setIsSidebarOpen(false)}
        origin={origin}
        destination={destination}
        onSelectOrigin={(pt) => setOrigin(pt)}
        onSelectDestination={(pt) => setDestination(pt)}
        onSwapPoints={handleSwapPoints}
        onAutoDetectLocation={handleAutoDetectLocation}
        vehicle={vehicle}
        setVehicle={setVehicle}
        routeData={activeRouteData}
        selectedCity={selectedCity}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenCivicDashboard={() => setIsCivicDashboardOpen(true)}
        onOpenObservability={() => setIsObservabilityOpen(true)}
        activePumpTicketsCount={activePumpTicketsCount}
        showPotholes={showPotholes}
        setShowPotholes={setShowPotholes}
        showTraffic={showTraffic}
        setShowTraffic={setShowTraffic}
        audioRadarActive={audioRadarActive}
        setAudioRadarActive={setAudioRadarActive}
        onPickOnMap={(mode) => setPickingMode(mode)}
      />

      {/* ============================================================== */}
      {/* 4. HAMBURGER MENU DRAWER (Google Maps Style)                   */}
      {/* ============================================================== */}
      <GoogleMapsMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        showTraffic={showTraffic}
        setShowTraffic={setShowTraffic}
        showPotholes={showPotholes}
        setShowPotholes={setShowPotholes}
        audioRadarActive={audioRadarActive}
        setAudioRadarActive={setAudioRadarActive}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenCivicDashboard={() => setIsCivicDashboardOpen(true)}
        onOpenObservability={() => setIsObservabilityOpen(true)}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        activePumpTicketsCount={activePumpTicketsCount}
        googleApiKey={googleApiKey}
      />

      {/* ============================================================== */}
      {/* 5. MODALS & DIALOGS (Report, Civic Pumps, Key Settings)         */}
      {/* ============================================================== */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onAddIncident={handleAddIncident}
        userLocation={userLocation}
        selectedCity={selectedCity}
        onAutoDetectLocation={handleAutoDetectLocation}
      />

      <MunicipalPumpDashboard
        isOpen={isCivicDashboardOpen}
        onClose={() => setIsCivicDashboardOpen(false)}
        incidents={currentIncidents}
        onDispatchPump={handleDispatchPump}
      />

      <ObservabilityModal
        isOpen={isObservabilityOpen}
        onClose={() => setIsObservabilityOpen(false)}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onDispatchPump={handleDispatchPump}
      />

      <GoogleApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentApiKey={googleApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* 6. HANDS-FREE AUDIO RADAR DRAWER */}
      <AudioRadarDrawer
        active={audioRadarActive}
        onClose={() => setAudioRadarActive(false)}
        routeData={activeRouteData}
        isSidebarOpen={isSidebarOpen}
        selectedCity={selectedCity}
      />
    </div>
  )
}

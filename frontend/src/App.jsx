import React, { useState, useEffect } from 'react'
import TacticalHeader from './components/TacticalHeader'
import InteractiveMap from './components/InteractiveMap'
import JourneyPlanner from './components/JourneyPlanner'
import AudioRadarDrawer from './components/AudioRadarDrawer'
import ReportModal from './components/ReportModal'
import MunicipalPumpDashboard from './components/MunicipalPumpDashboard'
import IncidentDetailModal from './components/IncidentDetailModal'
import GoogleApiKeyModal from './components/GoogleApiKeyModal'
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
  const [audioRadarActive, setAudioRadarActive] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)

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
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Current city active telemetry
  const currentIncidents = allIncidents[selectedCity] || []
  const currentPotholes = MULTI_CITY_POTHOLES[selectedCity] || []

  // Auto-reset default corridor when city changes
  useEffect(() => {
    const cityRoute = MULTI_CITY_ROUTES[selectedCity] || MULTI_CITY_ROUTES.BLR
    setOrigin(cityRoute.origin)
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
          detourPath: detour ? detour.path : direct.path,
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

  // 1. Auto-Fetch GPS Location feature
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        setUserLocation({ lat: userLat, lng: userLng })

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
        // Graceful fallback to Delhi for demo
        setUserLocation({ lat: 28.6320, lng: 77.2280 })
        setSelectedCity('DEL')
        setIsLocating(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // 2. Point Swap and Map Click Handlers
  const handleSwapPoints = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const handleMapClick = (latlng) => {
    const pointName = `📍 Custom Point (${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)})`
    const newPoint = { lat: latlng.lat, lng: latlng.lng, name: pointName }
    if (pickingMode === 'ORIGIN') {
      setOrigin(newPoint)
    } else if (pickingMode === 'DESTINATION') {
      setDestination(newPoint)
    }
    setPickingMode(null)
  }

  // 3. Add crowdsourced incident
  const handleAddIncident = (newIncident) => {
    setAllIncidents(prev => ({
      ...prev,
      [selectedCity]: [newIncident, ...(prev[selectedCity] || [])]
    }))
  }

  // 4. Dispatch de-watering pump unit
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
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 1. Tactical Header with City Selector & Auto-Fetch GPS */}
      <TacticalHeader
        vehicle={vehicle}
        setVehicle={setVehicle}
        audioRadarActive={audioRadarActive}
        setAudioRadarActive={setAudioRadarActive}
        showPotholes={showPotholes}
        setShowPotholes={setShowPotholes}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenCivicDashboard={() => setIsCivicDashboardOpen(true)}
        activePumpTicketsCount={activePumpTicketsCount}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        onAutoDetectLocation={handleAutoDetectLocation}
        isLocating={isLocating}
        googleApiKey={googleApiKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* 2. Interactive Tactical Map Canvas */}
      <main style={{
        flex: 1,
        position: 'relative',
        margin: '0 16px 16px 16px',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-tactical)'
      }}>
        {/* Floating Google Navigation Journey Planner Pill */}
        <JourneyPlanner
          selectedCity={selectedCity}
          origin={origin}
          destination={destination}
          onSelectOrigin={(pt) => setOrigin(pt)}
          onSelectDestination={(pt) => setDestination(pt)}
          onSwapPoints={handleSwapPoints}
          pickingMode={pickingMode}
          setPickingMode={setPickingMode}
          vehicle={vehicle}
          routeData={activeRouteData}
          onAutoDetectLocation={handleAutoDetectLocation}
        />

        <InteractiveMap
          selectedCity={selectedCity}
          incidents={currentIncidents}
          potholes={currentPotholes}
          showPotholes={showPotholes}
          vehicle={vehicle}
          activeRoute={activeRouteData}
          userLocation={userLocation}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          pickingMode={pickingMode}
          onMapClick={handleMapClick}
          googleApiKey={googleApiKey}
        />

        {/* 3. Hands-Free Audio Radar Overlay */}
        <AudioRadarDrawer
          active={audioRadarActive}
          onClose={() => setAudioRadarActive(false)}
          routeData={activeRouteData}
        />
      </main>

      {/* 4. Incident Reporting Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onAddIncident={handleAddIncident}
      />

      {/* 5. Municipal Pump Command Center Slide-Over */}
      <MunicipalPumpDashboard
        isOpen={isCivicDashboardOpen}
        onClose={() => setIsCivicDashboardOpen(false)}
        incidents={currentIncidents}
        onDispatchPump={handleDispatchPump}
      />

      {/* 6. Incident Telemetry Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onDispatchPump={handleDispatchPump}
      />

      {/* 7. Google Maps API Key Modal */}
      <GoogleApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentApiKey={googleApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  )
}

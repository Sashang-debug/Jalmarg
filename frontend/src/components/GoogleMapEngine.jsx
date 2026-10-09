import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { Layers, TrafficCone, Compass, AlertTriangle, ShieldCheck } from 'lucide-react'
import { CITY_CONFIGS } from '../data/mockTelemetry'
import { GOOGLE_MAPS_DARK_STYLE } from '../utils/googleMapsStyles'

let hasConfiguredGoogleOptions = false

export default function GoogleMapEngine({
  apiKey,
  selectedCity,
  incidents = [],
  potholes = [],
  showPotholes = true,
  vehicle,
  activeRoute,
  userLocation,
  onSelectIncident,
  pickingMode,
  onMapClick
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const trafficLayerRef = useRef(null)
  const overlaysRef = useRef([])
  const polylinesRef = useRef([])
  const markersRef = useRef([])

  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [mapStyleType, setMapStyleType] = useState('DARK') // 'DARK' | 'DEFAULT'

  // 1. Initialize Google Maps via modern functional importLibrary API
  useEffect(() => {
    if (!apiKey || mapInstanceRef.current) return

    if (!hasConfiguredGoogleOptions) {
      setOptions({
        key: apiKey,
        v: 'weekly'
      })
      hasConfiguredGoogleOptions = true
    }

    Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('geometry')
    ])
      .then(([mapsLib]) => {
        if (!mapContainerRef.current) return

        const { Map, TrafficLayer } = mapsLib
        const cityConfig = CITY_CONFIGS[selectedCity] || CITY_CONFIGS.BLR
        const map = new Map(mapContainerRef.current, {
          center: { lat: cityConfig.center[0], lng: cityConfig.center[1] },
          zoom: cityConfig.zoom,
          styles: mapStyleType === 'DARK' ? GOOGLE_MAPS_DARK_STYLE : null,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        })

        // Setup Traffic Layer
        const trafficLayer = new TrafficLayer()
        trafficLayerRef.current = trafficLayer

        // Click handler for picking origin/destination
        map.addListener('click', (e) => {
          if (onMapClick) {
            onMapClick({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            })
          }
        })

        mapInstanceRef.current = map
        setIsLoaded(true)
      })
      .catch((err) => {
        console.error('[GoogleMapEngine] Failed to load Google Maps:', err)
        setLoadError(err.message || 'Failed to load Google Maps API')
      })

    return () => {
      // Cleanup
      polylinesRef.current.forEach((p) => p.setMap(null))
      markersRef.current.forEach((m) => m.setMap(null))
      overlaysRef.current.forEach((o) => o.setMap && o.setMap(null))
      polylinesRef.current = []
      markersRef.current = []
      overlaysRef.current = []
    }
  }, [apiKey])

  // 2. City Fly-To Transition
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return
    const cityConfig = CITY_CONFIGS[selectedCity]
    if (cityConfig) {
      mapInstanceRef.current.panTo({ lat: cityConfig.center[0], lng: cityConfig.center[1] })
      mapInstanceRef.current.setZoom(cityConfig.zoom)
    }
  }, [selectedCity])

  // 3. Traffic Layer Toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !trafficLayerRef.current) return
    if (showTraffic) {
      trafficLayerRef.current.setMap(mapInstanceRef.current)
    } else {
      trafficLayerRef.current.setMap(null)
    }
  }, [showTraffic])

  // 4. Map Style Change (Dark vs Normal)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setOptions({
      styles: mapStyleType === 'DARK' ? GOOGLE_MAPS_DARK_STYLE : null
    })
  }, [mapStyleType])

  // 5. Render Custom HTML Depth Markers & Potholes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isLoaded) return

    // Clear previous overlays and markers
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    // Helper custom overlay for HTML markers
    class CustomHtmlOverlay extends window.google.maps.OverlayView {
      constructor(position, htmlContent, onClick) {
        super()
        this.position = position
        this.htmlContent = htmlContent
        this.onClick = onClick
        this.div = null
      }

      onAdd() {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.cursor = 'pointer'
        div.innerHTML = this.htmlContent
        if (this.onClick) {
          div.addEventListener('click', (e) => {
            e.stopPropagation()
            this.onClick()
          })
        }
        this.div = div
        const panes = this.getPanes()
        panes.overlayMouseTarget.appendChild(div)
      }

      draw() {
        const overlayProjection = this.getProjection()
        if (!overlayProjection || !this.div) return
        const point = overlayProjection.fromLatLngToDivPixel(this.position)
        if (point) {
          this.div.style.left = point.x - 24 + 'px'
          this.div.style.top = point.y - 24 + 'px'
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div)
          this.div = null
        }
      }
    }

    // A. Render Flood Depth Markers
    incidents.forEach((inc) => {
      let badgeColor = '#10B981'
      let pulseColor = 'rgba(16, 185, 129, 0.4)'
      if (inc.depthCm >= 35) {
        badgeColor = '#EF4444'
        pulseColor = 'rgba(239, 68, 68, 0.5)'
      } else if (inc.depthCm >= 20) {
        badgeColor = '#F59E0B'
        pulseColor = 'rgba(245, 158, 11, 0.4)'
      }

      const html = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: ${pulseColor};
            animation: pulse-ring 2s infinite ease-out;
          "></div>
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #0D111C;
            border: 2.5px solid ${badgeColor};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.8);
            z-index: 2;
          ">
            <span style="font-size: 11px; font-weight: 900; color: #FFFFFF; line-height: 1;">${inc.depthCm}</span>
            <span style="font-size: 8px; font-weight: 700; color: ${badgeColor}; line-height: 1;">cm</span>
          </div>
        </div>
      `

      const overlay = new CustomHtmlOverlay(
        new window.google.maps.LatLng(inc.lat, inc.lng),
        html,
        () => onSelectIncident && onSelectIncident(inc)
      )
      overlay.setMap(mapInstanceRef.current)
      overlaysRef.current.push(overlay)
    })

    // B. Render Pothole Markers
    if (showPotholes) {
      potholes.forEach((poth) => {
        const html = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 6px;
              background: #0D111C;
              border: 2px solid #8B5CF6;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.8);
            ">
              <span style="font-size: 12px;">⚠️</span>
            </div>
          </div>
        `
        const overlay = new CustomHtmlOverlay(
          new window.google.maps.LatLng(poth.lat, poth.lng),
          html,
          () => {}
        )
        overlay.setMap(mapInstanceRef.current)
        overlaysRef.current.push(overlay)
      })
    }

    // C. User Location Marker
    if (userLocation && userLocation.lat && userLocation.lng) {
      const html = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #00E5FF;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 15px #00E5FF;
          "></div>
        </div>
      `
      const overlay = new CustomHtmlOverlay(
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        html,
        () => {}
      )
      overlay.setMap(mapInstanceRef.current)
      overlaysRef.current.push(overlay)
    }
  }, [incidents, potholes, showPotholes, userLocation, isLoaded])

  // 6. Render Laser Street Routes on Google Maps
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isLoaded || !activeRoute) return

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null))
    polylinesRef.current = []

    const google = window.google

    if (activeRoute.isDetourRequired) {
      // 1. Direct path shown as flooded hazard (dashed red line)
      if (activeRoute.directPath && activeRoute.directPath.length > 0) {
        const hazardCoords = activeRoute.directPath.map((p) => ({ lat: p[0], lng: p[1] }))
        const hazardLine = new google.maps.Polyline({
          path: hazardCoords,
          geodesic: true,
          strokeColor: '#EF4444',
          strokeOpacity: 0.6,
          strokeWeight: 4
        })
        hazardLine.setMap(mapInstanceRef.current)
        polylinesRef.current.push(hazardLine)
      }

      // 2. Active Detour Route (Luminous Electric Blue)
      if (activeRoute.detourPath && activeRoute.detourPath.length > 0) {
        const detourCoords = activeRoute.detourPath.map((p) => ({ lat: p[0], lng: p[1] }))

        // Outer glow
        const glowLine = new google.maps.Polyline({
          path: detourCoords,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 0.35,
          strokeWeight: 10
        })
        glowLine.setMap(mapInstanceRef.current)
        polylinesRef.current.push(glowLine)

        // Core line
        const coreLine = new google.maps.Polyline({
          path: detourCoords,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 1.0,
          strokeWeight: 5
        })
        coreLine.setMap(mapInstanceRef.current)
        polylinesRef.current.push(coreLine)
      }
    } else {
      // Safe Route (Luminous Emerald Green)
      if (activeRoute.directPath && activeRoute.directPath.length > 0) {
        const safeCoords = activeRoute.directPath.map((p) => ({ lat: p[0], lng: p[1] }))

        // Outer glow
        const glowLine = new google.maps.Polyline({
          path: safeCoords,
          geodesic: true,
          strokeColor: '#00E676',
          strokeOpacity: 0.35,
          strokeWeight: 10
        })
        glowLine.setMap(mapInstanceRef.current)
        polylinesRef.current.push(glowLine)

        // Core line
        const coreLine = new google.maps.Polyline({
          path: safeCoords,
          geodesic: true,
          strokeColor: '#00E676',
          strokeOpacity: 1.0,
          strokeWeight: 5
        })
        coreLine.setMap(mapInstanceRef.current)
        polylinesRef.current.push(coreLine)
      }
    }
  }, [activeRoute, isLoaded])

  if (loadError) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#0D111C',
        color: '#EF4444',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Google Maps Failed to Load</h3>
        <p style={{ color: '#94A3B8', maxWidth: '420px', marginTop: '8px' }}>{loadError}</p>
        <span style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '12px' }}>
          Check that your Google Maps API Key has "Maps JavaScript API" enabled in GCP.
        </span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: pickingMode ? 'crosshair' : 'grab'
        }}
      />

      {/* Bottom-Left Google Maps Layers Toggle Thumbnail (Matches Screenshot 1) */}
      <button
        onClick={() => setMapStyleType(mapStyleType === 'DARK' ? 'DEFAULT' : 'DARK')}
        title="Toggle Map Style (Night Navigation / Day Streets)"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 500,
          width: '56px',
          height: '56px',
          borderRadius: '10px',
          background: mapStyleType === 'DARK' ? '#181E29' : '#FFFFFF',
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: 0,
          transition: 'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Layers size={20} color={mapStyleType === 'DARK' ? '#00E5FF' : '#1A73E8'} />
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: mapStyleType === 'DARK' ? '#FFFFFF' : '#3C4043',
          fontFamily: 'Roboto, Arial, sans-serif'
        }}>
          Layers
        </span>
      </button>

      {/* Floating Re-Center Button */}
      <button
        onClick={() => {
          if (!mapInstanceRef.current || !activeRoute || !window.google) return
          const bounds = new window.google.maps.LatLngBounds()
          const pts = activeRoute.isDetourRequired ? activeRoute.detourPath : activeRoute.directPath
          if (pts && pts.length > 0) {
            pts.forEach(p => bounds.extend({ lat: p[0], lng: p[1] }))
            mapInstanceRef.current.fitBounds(bounds, 50)
          }
        }}
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '16px',
          zIndex: 500,
          background: '#0F172A',
          border: '2px solid #4285F4',
          color: '#FFFFFF',
          borderRadius: '999px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          fontWeight: 800,
          boxShadow: '0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(66, 133, 244, 0.4)',
          cursor: 'pointer'
        }}
        title="Snap map view back to current navigation route"
      >
        <Compass size={15} color="#4285F4" />
        <span>Re-Center Route</span>
      </button>
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Map, Moon, Layers, Navigation, Compass, AlertTriangle } from 'lucide-react'
import { CITY_CONFIGS } from '../data/mockTelemetry'
import GoogleMapEngine from './GoogleMapEngine'

export default function InteractiveMap({
  selectedCity,
  incidents,
  potholes,
  showPotholes,
  vehicle,
  activeRoute,
  userLocation,
  origin,
  destination,
  onSelectIncident,
  pickingMode,
  onMapClick,
  googleApiKey
}) {
  // If Google Maps API Key is active, delegate rendering to official Google Map engine
  if (googleApiKey) {
    return (
      <GoogleMapEngine
        apiKey={googleApiKey}
        selectedCity={selectedCity}
        incidents={incidents}
        potholes={potholes}
        showPotholes={showPotholes}
        vehicle={vehicle}
        activeRoute={activeRoute}
        userLocation={userLocation}
        origin={origin}
        destination={destination}
        onSelectIncident={onSelectIncident}
        pickingMode={pickingMode}
        onMapClick={onMapClick}
      />
    )
  }
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const tileLayerRef = useRef(null)
  const layerGroupRef = useRef(null)
  const routeLayerRef = useRef(null)
  const userLocationLayerRef = useRef(null)

  const [mapStyle, setMapStyle] = useState('DARK') // 'DARK' | 'VOYAGER' | 'ESRI'

  const cartoKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4emp_1_e367e4d808fae5493117aba4'

  // Authentic Google Maps tile endpoints with multi-subdomain acceleration
  const TILES = {
    DARK: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', // Google Roadmap with calibrated Google Dark Nav filter
    VOYAGER: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', // Crisp standard Google Streets (Day Mode)
    ESRI: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    CARTO_DARK: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`
  }

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialConfig = CITY_CONFIGS[selectedCity] || CITY_CONFIGS.BLR

    const map = L.map(mapContainerRef.current, {
      center: initialConfig.center,
      zoom: initialConfig.zoom,
      zoomControl: false,
      attributionControl: false
    })

    // Set up tile layer with Google Dark Mode styling by default
    const isDark = mapStyle === 'DARK'
    const tileUrl = TILES[mapStyle] || TILES.DARK
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: tileUrl.includes('google') ? '0123' : 'abcd',
      keepBuffer: 8,
      className: isDark ? 'google-dark-tiles' : ''
    }).addTo(map)

    tileLayerRef.current = tileLayer

    // Position Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)
    routeLayerRef.current = L.layerGroup().addTo(map)
    userLocationLayerRef.current = L.layerGroup().addTo(map)

    if (initialConfig.bounds) {
      map.fitBounds(initialConfig.bounds, { padding: [40, 40] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 2. City Fly-To Transition when selectedCity changes (only when userLocation is NOT active)
  useEffect(() => {
    if (!mapInstanceRef.current || userLocation?.lat) return

    const cityConfig = CITY_CONFIGS[selectedCity]
    if (cityConfig) {
      if (cityConfig.bounds) {
        mapInstanceRef.current.flyToBounds(cityConfig.bounds, {
          padding: [50, 50],
          duration: 1.6,
          easeLinearity: 0.25
        })
      } else {
        mapInstanceRef.current.flyTo(cityConfig.center, cityConfig.zoom, { duration: 1.5 })
      }
    }
  }, [selectedCity])

  // 3. Re-Center Helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !activeRoute) return
    const routeBounds = L.latLngBounds([
      ...activeRoute.directPath,
      ...activeRoute.detourPath
    ])
    mapInstanceRef.current.flyToBounds(routeBounds, { padding: [60, 60], duration: 1.2 })
  }

  // 4. User GPS Location Pin rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return

    const userLayer = userLocationLayerRef.current
    userLayer.clearLayers()

    if (userLocation && userLocation.lat && userLocation.lng) {
      const gpsIcon = L.divIcon({
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #00E5FF;
              border: 3px solid #FFFFFF;
              box-shadow: 0 0 20px #00E5FF, 0 0 10px #00E5FF;
            "></div>
            <div class="pulse-radar" style="
              position: absolute;
              width: 36px;
              height: 36px;
              border-radius: 50%;
            "></div>
            <div style="
              position: absolute;
              bottom: 24px;
              background: #0F172A;
              border: 2px solid #00E5FF;
              color: #00E5FF;
              font-size: 11px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 6px;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            ">
              📍 YOU ARE HERE
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })

      L.marker([userLocation.lat, userLocation.lng], { icon: gpsIcon }).addTo(userLayer)
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.8 })
    }
  }, [userLocation])

  // Map Click Listener for interactive origin/destination picking
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = pickingMode ? 'crosshair' : 'grab'
    }

    const handleMapClick = (e) => {
      if (pickingMode && onMapClick) {
        onMapClick(e.latlng)
      }
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [pickingMode, onMapClick])

  // 5. Switch Basemap (Google Dark vs Day Streets vs Esri)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    const isDark = mapStyle === 'DARK'
    const tileUrl = TILES[mapStyle] || TILES.DARK
    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: tileUrl.includes('google') ? '0123' : 'abcd',
      keepBuffer: 8,
      className: isDark ? 'google-dark-tiles' : ''
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newTileLayer
  }, [mapStyle])

  // 6. Render High-Visibility Incident & Pothole Pins
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return

    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    incidents.forEach((inc) => {
      const isCritical = inc.severity === 'CRITICAL_NO_ENTRY'
      const isModerate = inc.severity === 'MODERATE_RISK'

      const badgeBg = isCritical ? '#EF4444' : (isModerate ? '#F59E0B' : '#10B981')
      const pulseAnimation = isCritical ? 'animation: critical-pulse 1.8s infinite;' : ''

      const pinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Pin Head with Glow -->
          <div style="
            background: ${badgeBg};
            color: #FFFFFF;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.8), 0 0 16px ${badgeBg};
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            ${pulseAnimation}
          ">
            <span>${isCritical ? '🚨' : (isModerate ? '⚠️' : '🟢')}</span>
            <span class="tabular-nums" style="font-size: 13px;">${inc.depthCm} cm</span>
          </div>
          <!-- Road Name Label (Crystal Clear White Text on Dark Pill) -->
          <div style="
            background: #0F172A;
            color: #FFFFFF;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            margin-top: 3px;
            white-space: nowrap;
            border: 1.5px solid ${badgeBg};
            box-shadow: 0 4px 12px rgba(0,0,0,0.7);
          ">
            ${inc.roadName.split('(')[0].trim()}
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        className: 'flood-pin-container',
        html: pinHtml,
        iconSize: [110, 48],
        iconAnchor: [55, 24]
      })

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon })
      marker.on('click', () => onSelectIncident(inc))
      marker.addTo(layerGroup)

      // Radius halo
      L.circle([inc.lat, inc.lng], {
        color: badgeBg,
        fillColor: badgeBg,
        fillOpacity: 0.22,
        radius: Math.max(80, inc.depthCm * 3.8),
        weight: 2
      }).addTo(layerGroup)
    })

    if (showPotholes && potholes) {
      potholes.forEach((pot) => {
        const potholeIcon = L.divIcon({
          html: `
            <div style="
              background: #F59E0B;
              color: #000000;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 900;
              border: 2px solid #000000;
              box-shadow: 0 4px 14px rgba(0,0,0,0.7), 0 0 10px #F59E0B;
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span>⚠️</span>
              <span>Crater: ${pot.roadName.split(' ')[0]}</span>
            </div>
          `,
          iconSize: [120, 26],
          iconAnchor: [60, 13]
        })

        L.marker([pot.lat, pot.lng], { icon: potholeIcon })
          .bindPopup(`<b>${pot.roadName}</b><br><small>${pot.advisory}</small>`)
          .addTo(layerGroup)
      })
    }
  }, [incidents, potholes, showPotholes, onSelectIncident])

  // 7. Dynamic Google Maps Style Laser Route
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current || !activeRoute) return

    const routeLayer = routeLayerRef.current
    routeLayer.clearLayers()

    const isDetourRequired = vehicle === 'BIKE' || vehicle === 'SEDAN'

    const effectiveOrigin = origin || activeRoute.origin
    const effectiveDest = destination || activeRoute.destination

    // Google-style Start Pin
    if (effectiveOrigin?.lat && effectiveOrigin?.lng) {
      const startIcon = L.divIcon({
        html: `
          <div style="
            background: #188038;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 10px rgba(24,128,56,0.6);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#A8DAB5;"></span>
            <span>SOURCE: ${effectiveOrigin.name}</span>
          </div>
        `,
        iconSize: [180, 28],
        iconAnchor: [90, 14]
      })
      L.marker([effectiveOrigin.lat, effectiveOrigin.lng], { icon: startIcon }).addTo(routeLayer)
    }

    // Google-style Destination Pin
    if (effectiveDest?.lat && effectiveDest?.lng) {
      const endIcon = L.divIcon({
        html: `
          <div style="
            background: #D93025;
            color: #FFFFFF;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 12px rgba(217,48,37,0.6);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>📍</span>
            <span>DESTINATION: ${effectiveDest.name}</span>
          </div>
        `,
        iconSize: [190, 28],
        iconAnchor: [95, 14]
      })
      L.marker([effectiveDest.lat, effectiveDest.lng], { icon: endIcon }).addTo(routeLayer)
    }

    if (isDetourRequired) {
      // 1. Heavy Outer Casing (Deep black shadow outline for max contrast)
      L.polyline(activeRoute.detourPath, {
        color: '#000000',
        weight: 14,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayer)

      // 2. Google-Style Emerald Laser Detour (Luminous Neon Green)
      L.polyline(activeRoute.detourPath, {
        color: '#00E676',
        weight: 8,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-laser-green'
      }).bindTooltip(`<b>SAFE ELEVATED FLYOVER DETOUR</b><br>Avoids ${activeRoute.hazardName}`).addTo(routeLayer)

      // Detour Waypoint Badge at midpoint
      const detourMidIdx = Math.floor(activeRoute.detourPath.length / 2)
      const detourMid = activeRoute.detourPath[detourMidIdx]
      if (detourMid) {
        const detourBadge = L.divIcon({
          html: `
            <div style="
              background: #064E3B;
              border: 2px solid #00E676;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 999px;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(0,0,0,0.85), 0 0 12px rgba(0, 230, 118, 0.6);
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span>🛡️</span>
              <span>VIA FLYOVER BYPASS (SAFE & DRY)</span>
            </div>
          `,
          iconSize: [240, 26],
          iconAnchor: [120, 13]
        })
        L.marker(detourMid, { icon: detourBadge }).addTo(routeLayer)
      }

      // 3. Avoided Flooded Corridor (High-contrast red barrier line with black casing)
      L.polyline(activeRoute.directPath, {
        color: '#000000',
        weight: 12,
        opacity: 0.95,
        lineCap: 'round'
      }).addTo(routeLayer)

      L.polyline(activeRoute.directPath, {
        color: '#FF1744',
        weight: 6,
        opacity: 1.0,
        dashArray: '10, 10',
        className: 'route-hazard-red'
      }).bindTooltip(`<b>AVOIDED CORRIDOR:</b> ${activeRoute.hazardName} (${activeRoute.hazardDepth}cm flood)`).addTo(routeLayer)

      // Direct Hazard Warning Badge
      const directMidIdx = Math.floor(activeRoute.directPath.length / 2)
      const directMid = activeRoute.directPath[directMidIdx]
      if (directMid) {
        const hazardBadge = L.divIcon({
          html: `
            <div style="
              background: #7F1D1D;
              border: 2px solid #FF1744;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 999px;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(0,0,0,0.85), 0 0 12px rgba(255, 23, 68, 0.6);
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span>⛔</span>
              <span>AVOIDED: ${activeRoute.hazardName.split(' ')[0]} (${activeRoute.hazardDepth}cm FLOOD)</span>
            </div>
          `,
          iconSize: [250, 26],
          iconAnchor: [125, 13]
        })
        L.marker(directMid, { icon: hazardBadge }).addTo(routeLayer)
      }
    } else {
      // SUV Direct Path: Google Maps Signature Electric Blue
      L.polyline(activeRoute.directPath, {
        color: '#000000',
        weight: 14,
        opacity: 0.95,
        lineCap: 'round'
      }).addTo(routeLayer)

      L.polyline(activeRoute.directPath, {
        color: '#4285F4',
        weight: 8,
        opacity: 1.0,
        lineCap: 'round',
        className: 'route-laser-blue'
      }).bindTooltip(`<b>SUV DIRECT ROUTE (ELECTRIC BLUE):</b> ${activeRoute.hazardDepth}cm passable`).addTo(routeLayer)

      // SUV Direct Corridor Badge
      const suvMidIdx = Math.floor(activeRoute.directPath.length / 2)
      const suvMid = activeRoute.directPath[suvMidIdx]
      if (suvMid) {
        const suvBadge = L.divIcon({
          html: `
            <div style="
              background: #1E3A8A;
              border: 2px solid #4285F4;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 900;
              padding: 4px 10px;
              border-radius: 999px;
              white-space: nowrap;
              box-shadow: 0 4px 16px rgba(0,0,0,0.85), 0 0 12px rgba(66, 133, 244, 0.6);
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span>🚙</span>
              <span>SUV DIRECT PASSAGE (PASSABLE UP TO 55cm)</span>
            </div>
          `,
          iconSize: [270, 26],
          iconAnchor: [135, 13]
        })
        L.marker(suvMid, { icon: suvBadge }).addTo(routeLayer)
      }
    }
  }, [vehicle, activeRoute])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* 1. Google Maps Layers Toggle Thumbnail (Bottom-Left) */}
      <button
        onClick={() => setMapStyle(mapStyle === 'DARK' ? 'VOYAGER' : 'DARK')}
        title="Toggle Map Style (Night Navigation / Day Streets)"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 500,
          width: '56px',
          height: '56px',
          borderRadius: '10px',
          background: mapStyle === 'DARK' ? '#181E29' : '#FFFFFF',
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
        <Layers size={20} color={mapStyle === 'DARK' ? '#00E5FF' : '#1A73E8'} />
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: mapStyle === 'DARK' ? '#FFFFFF' : '#3C4043',
          fontFamily: 'Roboto, Arial, sans-serif'
        }}>
          Layers
        </span>
      </button>

      {/* 2. Floating "Re-Center on Route" Button */}
      <button
        onClick={handleRecenter}
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

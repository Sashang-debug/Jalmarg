import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CITIES } from '../utils/cities'
import { markerContent } from './MapMarkers'

export default function LeafletMap({ selectedCity, incidents, activeRoute, origin, destination, userLocation, pickingMode, onMapClick, onSelectIncident, theme = 'light', focusPoint, panelOpen = true }) {
  const container = useRef(null)
  const instance = useRef(null)
  const layers = useRef(null)
  const [tileError, setTileError] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const map = L.map(container.current, { zoomControl: false, preferCanvas: true }).setView(CITIES.GWL.center, 13)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(map)
    tiles.on('tileerror', () => setTileError(true))
    tiles.on('tileload', () => setTileError(false))
    L.control.zoom({ position: 'topright' }).addTo(map)
    instance.current = map
    layers.current = L.layerGroup().addTo(map)
    const resize = new ResizeObserver(() => map.invalidateSize())
    resize.observe(container.current)
    setReady(true)
    return () => { resize.disconnect(); map.remove(); instance.current = null }
  }, [])

  useEffect(() => {
    if (!ready) return
    const config = CITIES[selectedCity] || CITIES.GWL
    instance.current.setView(config.center, config.zoom)
  }, [selectedCity, ready])

  useEffect(() => {
    const point = focusPoint || userLocation
    if (!ready || !point) return
    instance.current.setView([point.lat, point.lng], 15)
  }, [userLocation, focusPoint, ready])

  useEffect(() => {
    if (!ready) return
    const group = layers.current
    group.clearLayers()
    const route = activeRoute?.selected
    for (const candidate of activeRoute?.candidates || []) {
      if (candidate !== route) L.polyline(candidate.path, { color: candidate.blocking?.length ? '#d93025' : '#9aa0a6', weight: 4, opacity: 0.55 }).addTo(group)
    }
    if (route) L.polyline(route.path, { color: '#1a73e8', weight: 6, opacity: 0.9 }).addTo(group)
    else if (activeRoute?.candidates?.[0]) L.polyline(activeRoute.candidates[0].path, { color: '#ea897b', weight: 4, dashArray: '7 8' }).addTo(group)
    for (const [point, kind] of [[origin, 'source'], [destination, 'destination']]) {
      if (point) L.marker([point.lat, point.lng], { title: `${kind}: ${point.name}`, icon: L.divIcon({ html: markerContent({ kind, name: point.name, label: pickingMode === 'REPORT' ? 'Report location' : undefined }), className: 'jm-map-icon', iconSize: [46, 48], iconAnchor: [23, 48] }) }).addTo(group)
    }
    incidents.forEach(incident => {
      const critical = incident.depthCm >= 35
      const marker = L.marker([incident.lat, incident.lng], { title: `Waterlogging: ${incident.roadName}`, icon: L.divIcon({ html: markerContent({ kind: 'hazard', name: incident.roadName, level: incident.waterLevelLabel, critical }), className: 'jm-map-icon', iconSize: [46, 48], iconAnchor: [23, 48] }) }).addTo(group)
      marker.on('click', () => onSelectIncident?.(incident))
      L.circle([incident.lat, incident.lng], { radius: 120, color: critical ? '#d93025' : '#ea8600', fillOpacity: 0.1, weight: 1 }).addTo(group)
    })
    if (userLocation) L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#68a9ff', fillOpacity: 1 }).addTo(group)
  }, [ready, incidents, activeRoute, origin, destination, userLocation, onSelectIncident, pickingMode])

  useEffect(() => {
    if (!ready) return
    const map = instance.current
    container.current.style.cursor = pickingMode ? 'crosshair' : ''
    const click = event => { if (pickingMode) onMapClick(event.latlng) }
    map.on('click', click)
    return () => map.off('click', click)
  }, [ready, pickingMode, onMapClick])

  useEffect(() => {
    if (!ready || !activeRoute?.selected) return
    const wide = container.current.clientWidth > 800
    instance.current.fitBounds(L.latLngBounds(activeRoute.selected.path), { paddingTopLeft: wide ? [panelOpen ? 450 : 70, 90] : [50, 110], paddingBottomRight: wide ? [100, 95] : [50, panelOpen ? 65 : 130], maxZoom: 15 })
  }, [ready, activeRoute?.selected, panelOpen])

  return <><div ref={container} className={`jm-map jm-leaflet-map ${theme === 'dark' ? 'dark-tiles' : ''}`} aria-label="Waterlogging reports and journey map" />
    {tileError && <div className="map-tile-error" role="status">Map tiles could not load. Reports and route details remain available.</div>}</>
}

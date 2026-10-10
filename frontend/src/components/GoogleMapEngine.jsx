import { useEffect, useRef, useState } from 'react'
import { CITIES } from '../utils/cities'
import { googleLibrary } from '../utils/places'
import { markerContent } from './MapMarkers'
import { GOOGLE_MAPS_DARK_STYLE } from '../utils/googleMapsStyles'


export default function GoogleMapEngine({ apiKey, selectedCity, incidents = [], activeRoute, origin, destination, userLocation, pickingMode, onMapClick, onSelectIncident, theme = 'light', layers = {}, focusPoint, panelOpen = true }) {
  const container = useRef(null)
  const map = useRef(null)
  const initial = useRef({ selectedCity, userLocation })
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    const previousAuthFailure = window.gm_authFailure
    window.gm_authFailure = () => { if (!disposed) setError('Google Maps could not authorize this key. Check its website restrictions and Maps JavaScript API access, or use the default map.') }
    googleLibrary(apiKey, 'maps').then(({ Map }) => {
      if (disposed || !container.current) return
      const config = CITIES[initial.current.selectedCity] || CITIES.GWL
      const gps = initial.current.userLocation
      map.current = new Map(container.current, {
        center: gps || { lat: config.center[0], lng: config.center[1] }, zoom: config.zoom,
        styles: [], disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        clickableIcons: false
      })
      setLoaded(true)
    }).catch(() => { if (!disposed) setError('Google Maps could not load. Check your connection, or clear the key in Map settings to use the default map.') })
    return () => { disposed = true; if (map.current) window.google?.maps.event.clearInstanceListeners(map.current); map.current = null; window.gm_authFailure = previousAuthFailure }
  }, [apiKey])

  useEffect(() => {
    if (!loaded || !map.current) return
    const config = CITIES[selectedCity] || CITIES.GWL
    map.current.setCenter({ lat: config.center[0], lng: config.center[1] }); map.current.setZoom(config.zoom)
  }, [selectedCity, loaded])

  useEffect(() => {
    const point = focusPoint || userLocation
    if (!loaded || !map.current || !point) return
    map.current.panTo({ lat: point.lat, lng: point.lng }); map.current.setZoom(15)
  }, [userLocation, focusPoint, loaded])

  useEffect(() => {
    if (!loaded || !map.current) return
    map.current.setOptions({ draggableCursor: pickingMode ? 'crosshair' : null })
    const listener = map.current.addListener('click', event => {
      if (pickingMode) onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() })
    })
    return () => listener.remove()
  }, [loaded, pickingMode, onMapClick])

  useEffect(() => {
    if (!loaded || !map.current) return
    const google = window.google
    const overlays = []
    class TextOverlay extends google.maps.OverlayView {
      constructor(point, content, onClick) {
        super(); this.point = point; this.content = content; this.onClick = onClick
      }
      onAdd() {
        const element = this.content
        element.style.position = 'absolute'
        if (this.onClick) element.addEventListener('click', event => { event.stopPropagation(); this.onClick() })
        this.element = element; this.getPanes().overlayMouseTarget.appendChild(element)
      }
      draw() {
        const point = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(this.point.lat, this.point.lng))
        if (!point || !this.element) return
        this.element.style.left = `${point.x}px`; this.element.style.top = `${point.y}px`; this.element.style.transform = 'translate(-23px,-48px)'
      }
      onRemove() { this.element?.remove() }
    }
    function add(point, kind, onClick, label) {
      const content = markerContent({ kind, name: point.name || point.roadName, level: point.waterLevelLabel, critical: point.depthCm >= 35, label })
      const overlay = new TextOverlay(point, content, onClick)
      overlay.setMap(map.current); overlays.push(overlay)
    }
    if (origin) add(origin, 'source')
    if (destination) add(destination, 'destination', null, pickingMode === 'REPORT' ? 'Report location' : undefined)
    if (userLocation && (!origin || Math.abs(origin.lat - userLocation.lat) + Math.abs(origin.lng - userLocation.lng) > 0.0001)) add(userLocation, 'gps')
    incidents.forEach(incident => add(incident, 'hazard', () => onSelectIncident?.(incident)))
    return () => overlays.forEach(overlay => overlay.setMap(null))
  }, [loaded, incidents, origin, destination, userLocation, onSelectIncident, pickingMode])

  useEffect(() => {
    if (!loaded || !map.current) return
    const points = activeRoute?.selected?.path || activeRoute?.candidates?.[0]?.path
    if (!points?.length) return
    const google = window.google
    const selected = Boolean(activeRoute.selected)
    const alternatives = (activeRoute.candidates || []).filter(candidate => candidate !== activeRoute.selected)
    const lines = alternatives.map(candidate => new google.maps.Polyline({ path: candidate.path.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: candidate.blocking?.length ? '#d93025' : '#9aa0a6', strokeOpacity: 0.55, strokeWeight: 4, zIndex: 1 }))
    lines.push(new google.maps.Polyline({ path: points.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: selected ? '#1a73e8' : '#d93025', strokeOpacity: selected ? 1 : 0.65, strokeWeight: selected ? 6 : 4, zIndex: 2 }))
    lines.forEach(line => line.setMap(map.current))
    const bounds = new google.maps.LatLngBounds()
    points.forEach(([lat, lng]) => bounds.extend({ lat, lng }))
    const width = container.current.clientWidth
    map.current.fitBounds(bounds, width > 800 ? { left: panelOpen ? 450 : 70, right: 110, top: 100, bottom: 95 } : { left: 50, right: 50, top: 110, bottom: panelOpen ? 65 : 130 })
    return () => lines.forEach(line => line.setMap(null))
  }, [loaded, activeRoute, panelOpen])

  useEffect(() => {
    if (!loaded || !map.current) return
    const type = layers.satellite ? layers.labels ? 'hybrid' : 'satellite' : layers.terrain ? 'terrain' : 'roadmap'
    map.current.setOptions({ mapTypeId: type, styles: theme === 'dark' && !layers.satellite ? GOOGLE_MAPS_DARK_STYLE : [] })
    const traffic = new window.google.maps.TrafficLayer()
    const transit = new window.google.maps.TransitLayer()
    if (layers.traffic) traffic.setMap(map.current)
    if (layers.transit) transit.setMap(map.current)
    return () => { traffic.setMap(null); transit.setMap(null) }
  }, [loaded, theme, layers.satellite, layers.labels, layers.terrain, layers.traffic, layers.transit])

  return <div className="jm-google-map"><div ref={container} className="jm-map" aria-label="Google Maps journey map" />
    {error && <div className="map-provider-error" role="alert"><strong>Google Maps unavailable</strong><p>{error}</p></div>}</div>
}

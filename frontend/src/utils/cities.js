import { CITY_CONFIGS, CITY_LANDMARKS, MULTI_CITY_ROUTES } from '../data/mockTelemetry.js'

export const CITIES = {
  GWL: { name: 'Gwalior', center: [26.231, 78.174], zoom: 13 },
  BLR: { ...CITY_CONFIGS.BLR, name: 'Bengaluru' },
  BOM: { ...CITY_CONFIGS.BOM, name: 'Mumbai' },
  DEL: { ...CITY_CONFIGS.DEL, name: 'Delhi' },
  OTHER: { name: 'Other location', center: [23.5, 79], zoom: 6 },
}
export const LANDMARKS = { ...CITY_LANDMARKS, OTHER: [], GWL: [
  { name: 'IIITM Campus, Gwalior', lat: 26.2492, lng: 78.1696 },
  { name: 'Gwalior Railway Station', lat: 26.2167, lng: 78.1808 },
  { name: 'DB City Mall, Gwalior', lat: 26.2187, lng: 78.1828 },
  { name: 'Phool Bagh, Gwalior', lat: 26.2100, lng: 78.1668 },
  { name: 'Gwalior Fort', lat: 26.2306, lng: 78.1696 },
  { name: 'Maharaj Bada, Gwalior', lat: 26.1925, lng: 78.1504 },
  { name: 'Gwalior Airport', lat: 26.2854, lng: 78.2278 },
] }
export function distanceKm(a, b) {
  const rad = Math.PI / 180
  const dlat = (b.lat - a.lat) * rad, dlng = (b.lng - a.lng) * rad
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}
export function cityForPoint(point) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return 'OTHER'
  return Object.entries(CITIES).filter(([id]) => id !== 'OTHER')
    .map(([id, city]) => ({ id, distance: distanceKm(point, { lat: city.center[0], lng: city.center[1] }) }))
    .filter(city => city.distance <= 65).sort((a, b) => a.distance - b.distance)[0]?.id || 'OTHER'
}
export function nearbyLandmarks(point, city) {
  const localCity = point ? cityForPoint(point) : city
  return (LANDMARKS[localCity] || []).map(place => ({ ...place, city: localCity }))
    .sort((a, b) => point ? distanceKm(a, point) - distanceKm(b, point) : 0)
}
export function defaultJourney(city) {
  if (MULTI_CITY_ROUTES[city]) return MULTI_CITY_ROUTES[city]
  if (city === 'GWL') return { origin: { ...LANDMARKS.GWL[0], city }, destination: { ...LANDMARKS.GWL[1], city } }
  return { origin: null, destination: null }
}
export function fallbackPlace(point) {
  const city = cityForPoint(point)
  const near = nearbyLandmarks(point, city)[0]
  const name = near && distanceKm(point, near) < 0.8 ? `Near ${near.name}` : city === 'OTHER' ? 'Selected location' : `Selected location in ${CITIES[city].name}`
  return { ...point, name, city, address: '', approximateName: true }
}

export function matchesPlace(name, query) {
  const clean = text => text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  const haystack = clean(name)
  return clean(query).split(/\s+/).every(word => haystack.includes(word))
}

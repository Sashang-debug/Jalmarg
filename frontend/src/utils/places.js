import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { cityForPoint, fallbackPlace } from './cities'
let key = ''
export async function googleLibrary(apiKey, library) {
  if (!apiKey) throw new Error('Google Maps is not configured.')
  if (key && key !== apiKey) throw new Error('Reload to use a different Google Maps key.')
  if (!key) { setOptions({ key: apiKey, v: 'weekly' }); key = apiKey }
  return importLibrary(library)
}
async function geocode(apiKey, request) {
  let timer
  try {
    return await Promise.race([
      (async () => { const { Geocoder } = await googleLibrary(apiKey, 'geocoding'); return new Geocoder().geocode(request) })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Address lookup timed out.')), 8000) }),
    ])
  } finally { clearTimeout(timer) }
}
const searchCache = new Map()
let nextLookup = 0
let lookupQueue = Promise.resolve()
// Nominatim is used only for explicit searches/location selections, never keystrokes.
// Serialize requests to honor its public endpoint's one-request-per-second limit.
function osmLookup(params) {
  const query = params.toString()
  if (searchCache.has(query)) return Promise.resolve(searchCache.get(query))
  const request = lookupQueue.then(async () => {
    const wait = Math.max(0, nextLookup - Date.now())
    if (wait) await new Promise(resolve => setTimeout(resolve, wait))
    nextLookup = Date.now() + 1100
    const response = await fetch(`${import.meta.env.VITE_GEOCODING_URL || 'https://nominatim.openstreetmap.org'}/${params.has('q') ? 'search' : 'reverse'}?${query}`, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('Place search is temporarily unavailable. Choose a point on the map.')
    const data = await response.json()
    if (searchCache.size > 100) searchCache.delete(searchCache.keys().next().value)
    searchCache.set(query, data)
    return data
  })
  lookupQueue = request.catch(() => {})
  return request
}
export async function searchPlaces(query, apiKey, bias) {
  if (!query.trim()) return []
  if (apiKey) {
    try {
      const { results } = await geocode(apiKey, { address: query, region: 'in', ...(bias ? { bounds: { south: bias.lat - .25, north: bias.lat + .25, west: bias.lng - .25, east: bias.lng + .25 } } : {}) })
      return results.slice(0, 6).map(result => {
        const point = { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() }
        return { ...point, name: result.formatted_address.split(',')[0], address: result.formatted_address, city: cityForPoint(point), provider: 'Google Maps' }
      })
    } catch { /* Explicit open-map search fallback when Geocoding API is disabled. */ }
  }
  const params = new URLSearchParams({ q: query, format: 'jsonv2', addressdetails: '1', limit: '6' })
  if (bias) params.set('viewbox', `${bias.lng - .25},${bias.lat + .25},${bias.lng + .25},${bias.lat - .25}`)
  const data = await osmLookup(params)
  return data.map(result => {
    const point = { lat: Number(result.lat), lng: Number(result.lon) }
    return { ...point, name: result.name || result.display_name.split(',')[0], address: result.display_name, city: cityForPoint(point), provider: 'OpenStreetMap' }
  })
}
export async function describePoint(point, apiKey) {
  if (apiKey) {
    try {
      const { results } = await geocode(apiKey, { location: { lat: point.lat, lng: point.lng } })
      if (results[0]) return { ...point, city: cityForPoint(point), name: results[0].formatted_address.split(',').slice(0, 2).join(', '), address: results[0].formatted_address }
    } catch { /* Keep GPS usable even when geocoding isn't enabled. */ }
  }
  // Google-derived place data is never rendered on an OSM map.
  if (!apiKey) {
    try {
      const data = await osmLookup(new URLSearchParams({ lat: point.lat, lon: point.lng, format: 'jsonv2', zoom: '17' }))
      if (data.display_name) return { ...point, city: cityForPoint(point), name: data.name || data.display_name.split(',').slice(0, 2).join(', '), address: data.display_name }
    } catch { /* A location pin does not depend on an address service. */ }
  }
  return fallbackPlace(point)
}
export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is unavailable. Search for a place or choose on the map.'))
    navigator.geolocation.getCurrentPosition(position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => reject(new Error('Could not get your location. Allow location access, or choose on the map.')), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
  })
}

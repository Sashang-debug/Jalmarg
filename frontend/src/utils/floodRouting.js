// Prototype avoidance settings, not certified vehicle wading depths.
export const AVOIDANCE_DEPTHS = { BIKE: 20, SEDAN: 30, SUV: 55 }
const cache = new Map()

export function isActiveIncident(incident, now = Date.now()) {
  return incident.status !== 'CLEARED' && Date.parse(incident.expiresAt) > now
}

export function distanceToSegmentMeters(point, start, end) {
  // Local tangent-plane projection accounts for longitude scale at this latitude.
  const latScale = 111320
  const lngScale = latScale * Math.cos(point.lat * Math.PI / 180)
  const ax = (start[1] - point.lng) * lngScale
  const ay = (start[0] - point.lat) * latScale
  const bx = (end[1] - point.lng) * lngScale
  const by = (end[0] - point.lat) * latScale
  const dx = bx - ax, dy = by - ay
  const squared = dx * dx + dy * dy
  const t = squared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / squared)) : 0
  return Math.hypot(ax + t * dx, ay + t * dy)
}

export function auditPath(path, incidents, vehicle, now = Date.now()) {
  const hazards = incidents.filter(incident => isActiveIncident(incident, now) &&
    path.some((point, index) => index > 0 && distanceToSegmentMeters(incident, path[index - 1], point) <= 120))
  const blocking = hazards.filter(incident => incident.depthCm >= (AVOIDANCE_DEPTHS[vehicle] || 20))
  return { hazards, blocking }
}

export function chooseRoute(candidates, incidents, vehicle, now = Date.now()) {
  const audited = candidates.filter(route => Array.isArray(route.path) && route.path.length > 1)
    .map(route => ({ ...route, ...auditPath(route.path, incidents, vehicle, now) }))
  audited.sort((a, b) => a.blocking.length - b.blocking.length || a.durationMins - b.durationMins || a.hazards.length - b.hazards.length)
  const selected = audited.find(route => route.blocking.length === 0) || null
  return { status: selected ? 'AVAILABLE' : audited.length ? 'NO_ALTERNATIVE' : 'UNAVAILABLE', selected, candidates: audited }
}

export async function streetRoutes(points, signal) {
  const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';')
  const key = coordinates
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < 60000) return cached.routes
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=true`,
    { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Street routing is unavailable. Please retry.')
  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No street route was found between these locations.')
  const routes = data.routes.map(route => ({ path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000, durationMins: Math.max(1, Math.round(route.duration / 60)) }))
  if (cache.size >= 100) cache.delete(cache.keys().next().value)
  cache.set(key, { at: Date.now(), routes })
  return routes
}

export async function resolveFloodRoutes(origin, destination, incidents, vehicle, signal, provider = streetRoutes) {
  const candidates = await provider([origin, destination], signal)
  let result = chooseRoute(candidates, incidents, vehicle)
  if (result.status === 'NO_ALTERNATIVE') {
    const hazard = result.candidates[0].blocking[0]
    const dx = destination.lng - origin.lng, dy = destination.lat - origin.lat
    const length = Math.hypot(dx, dy) || 1
    const alternatives = await Promise.allSettled([1, -1].map(direction => provider([origin,
      { lat: hazard.lat - direction * dx / length * 0.015, lng: hazard.lng + direction * dy / length * 0.015 }, destination], signal)))
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    result = chooseRoute([...candidates, ...alternatives.flatMap(r => r.status === 'fulfilled' ? r.value : [])], incidents, vehicle)
  }
  return result
}

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
  audited.sort((a, b) => a.blocking.length - b.blocking.length || a.durationMins - b.durationMins || a.distanceKm - b.distanceKm || a.hazards.length - b.hazards.length)
  const selected = audited.find(route => route.blocking.length === 0) || null
  return { status: selected ? 'AVAILABLE' : audited.length ? 'NO_ALTERNATIVE' : 'UNAVAILABLE', selected, candidates: audited }
}

function pointDistanceMeters(a, b) {
  const lat = ((a[0] + b[0]) / 2) * Math.PI / 180
  return Math.hypot((b[1] - a[1]) * 111320 * Math.cos(lat), (b[0] - a[0]) * 111320)
}

function walkPath(path, start, direction, distanceMeters) {
  let travelled = 0
  let index = start
  while (index + direction >= 0 && index + direction < path.length) {
    const next = index + direction
    travelled += pointDistanceMeters(path[index], path[next])
    index = next
    if (travelled >= distanceMeters) break
  }
  return path[index]
}

export function localDetourWaypoints(path, hazard, direction, offsetMeters = 280) {
  if (!Array.isArray(path) || path.length < 2) return []
  let closest = 0
  let closestDistance = Infinity
  for (let index = 1; index < path.length; index += 1) {
    const distance = distanceToSegmentMeters(hazard, path[index - 1], path[index])
    if (distance < closestDistance) { closestDistance = distance; closest = index }
  }
  const before = walkPath(path, Math.max(0, closest - 1), -1, 320)
  const after = walkPath(path, closest, 1, 320)
  const middleLat = (before[0] + after[0]) / 2
  const lngScale = 111320 * Math.cos(middleLat * Math.PI / 180)
  const dx = (after[1] - before[1]) * lngScale
  const dy = (after[0] - before[0]) * 111320
  const length = Math.hypot(dx, dy)
  if (length < 20 || !Number.isFinite(length)) return []
  const offsetX = direction * (-dy / length) * offsetMeters
  const offsetY = direction * (dx / length) * offsetMeters
  return [before, after].map(([lat, lng]) => ({
    lat: lat + offsetY / 111320,
    lng: lng + offsetX / (111320 * Math.cos(lat * Math.PI / 180)),
  }))
}

export function routeBacktrackMeters(path) {
  if (!Array.isArray(path) || path.length < 2) return 0
  const origin = path[0], destination = path.at(-1)
  const middleLat = (origin[0] + destination[0]) / 2
  const lngScale = 111320 * Math.cos(middleLat * Math.PI / 180)
  const axisX = (destination[1] - origin[1]) * lngScale
  const axisY = (destination[0] - origin[0]) * 111320
  const length = Math.hypot(axisX, axisY)
  if (length < 1) return Infinity
  let previous = 0, backtrack = 0
  for (const [lat, lng] of path.slice(1)) {
    const x = (lng - origin[1]) * lngScale
    const y = (lat - origin[0]) * 111320
    const progress = (x * axisX + y * axisY) / length
    if (progress < previous) backtrack += previous - progress
    previous = progress
  }
  return backtrack
}

export function isReasonablyDirect(route, baseline) {
  if (!route?.path?.length || !baseline?.path?.length) return false
  const straightMeters = pointDistanceMeters(route.path[0], route.path.at(-1))
  const maxDistanceKm = Math.max(baseline.distanceKm * 1.8, baseline.distanceKm + 3)
  const maxBacktrack = Math.max(350, straightMeters * 0.3)
  return route.distanceKm <= maxDistanceKm && routeBacktrackMeters(route.path) <= maxBacktrack
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
    const baseline = result.candidates[0]
    const requests = [220, 360].flatMap(offset => [1, -1].map(direction => {
      const waypoints = localDetourWaypoints(baseline.path, hazard, direction, offset)
      return waypoints.length ? provider([origin, ...waypoints, destination], signal)
        .then(routes => routes.map(route => ({ ...route, generatedDetour: true, detourOffsetMeters: offset }))) : Promise.resolve([])
    }))
    const alternatives = await Promise.allSettled(requests)
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    const directAlternatives = alternatives.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(route => isReasonablyDirect(route, baseline))
    result = chooseRoute([...candidates, ...directAlternatives], incidents, vehicle)
  }
  return result
}

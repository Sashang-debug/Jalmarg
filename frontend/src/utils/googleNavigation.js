import { distanceToSegmentMeters } from './floodRouting.js'

function validPoint(point) {
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
}

function pointText(point) {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`
}

function segmentMeters(a, b) {
  const lat = ((a[0] + b[0]) / 2) * Math.PI / 180
  return Math.hypot((b[1] - a[1]) * 111320 * Math.cos(lat), (b[0] - a[0]) * 111320)
}

export function routeCorridorWaypoints(path, count = 3) {
  if (!Array.isArray(path) || path.length < 3 || count < 1) return []
  const cumulative = [0]
  for (let index = 1; index < path.length; index += 1) cumulative.push(cumulative.at(-1) + segmentMeters(path[index - 1], path[index]))
  const total = cumulative.at(-1)
  if (!Number.isFinite(total) || total < 500) return []
  return Array.from({ length: count }, (_, index) => total * (index + 1) / (count + 1)).map(target => {
    const pathIndex = cumulative.findIndex(distance => distance >= target)
    return path[Math.max(1, Math.min(path.length - 2, pathIndex))]
  }).filter((point, index, points) => index === 0 || segmentMeters(points[index - 1], point) > 100)
    .map(([lat, lng]) => ({ lat, lng }))
}

// Mobile Maps URLs support three stops. Spend those stops on the actual bypass,
// rather than on long stretches shared with the flooded original route.
export function navigationWaypoints(route) {
  const path = route?.selected?.path
  const fastest = route?.fastest
  if (!path?.length || !fastest?.blocking?.length || route.selected.blocking?.length) return []
  const divergent = path.slice(1, -1).filter(([lat, lng]) =>
    fastest.path?.length > 1 && fastest.path.slice(1).every((end, index) =>
      distanceToSegmentMeters({ lat, lng }, fastest.path[index], end) > 120))
  if (!divergent.length) return routeCorridorWaypoints(path)
  const indices = [...new Set([0, Math.floor((divergent.length - 1) / 2), divergent.length - 1])]
  return indices.map(index => ({ lat: divergent[index][0], lng: divergent[index][1] }))
}

export function buildGoogleMapsNavigationUrl({ origin, destination, route, vehicle }) {
  if (!validPoint(origin) || !validPoint(destination) || !route?.selected?.path?.length) return ''
  const waypoints = navigationWaypoints(route)
  const query = new URLSearchParams({ api: '1', origin: pointText(origin), destination: pointText(destination),
    travelmode: vehicle === 'BIKE' ? 'two-wheeler' : 'driving' })
  // Preview the ordered bypass stops before navigation; Maps cannot import our
  // polyline or flood restrictions and may calculate different roads between stops.
  if (waypoints.length) query.set('waypoints', waypoints.map(pointText).join('|'))
  else query.set('dir_action', 'navigate')
  return `https://www.google.com/maps/dir/?${query}`
}

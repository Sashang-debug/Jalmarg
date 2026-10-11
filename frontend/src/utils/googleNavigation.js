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

export function buildGoogleMapsNavigationUrl({ origin, destination, route, vehicle }) {
  if (!validPoint(origin) || !validPoint(destination) || !route?.selected?.path?.length) return ''
  const detour = route.fastest?.blocking?.length > 0 && route.fastest !== route.selected
  const waypoints = detour ? routeCorridorWaypoints(route.selected.path) : []
  const query = new URLSearchParams({ api: '1', origin: pointText(origin), destination: pointText(destination), travelmode: 'driving', dir_action: 'navigate' })
  if (waypoints.length) query.set('waypoints', waypoints.map(pointText).join('|'))
  if (vehicle === 'BIKE') query.set('utm_content', 'jalmarg_2wheeler_safe_corridor')
  return `https://www.google.com/maps/dir/?${query}`
}

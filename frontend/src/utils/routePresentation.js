import { distanceToSegmentMeters } from './floodRouting.js'

function segmentMeters(a, b) {
  const lat = ((a[0] + b[0]) / 2) * Math.PI / 180
  return Math.hypot((b[1] - a[1]) * 111320 * Math.cos(lat), (b[0] - a[0]) * 111320)
}

function paddedIndex(path, start, direction, paddingMeters) {
  let index = start, distance = 0
  while (index + direction >= 0 && index + direction < path.length && distance < paddingMeters) {
    distance += segmentMeters(path[index], path[index + direction])
    index += direction
  }
  return index
}

export function blockedRouteSegment(route, paddingMeters = 450) {
  if (!route?.path?.length || !route.blocking?.length) return []
  const affected = []
  for (let index = 1; index < route.path.length; index += 1) {
    if (route.blocking.some(hazard => distanceToSegmentMeters(hazard, route.path[index - 1], route.path[index]) <= 120)) affected.push(index)
  }
  if (!affected.length) return []
  const start = paddedIndex(route.path, Math.max(0, affected[0] - 1), -1, paddingMeters)
  const end = paddedIndex(route.path, affected.at(-1), 1, paddingMeters)
  return route.path.slice(start, end + 1)
}

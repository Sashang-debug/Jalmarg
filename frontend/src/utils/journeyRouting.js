import { resolveFloodRoutes } from './floodRouting.js'
const unavailable = new Map()
const unavailableReasons = new Map()

async function boundedRequest(request, signal, timeoutMs) {
  let timer, abort
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        abort = () => reject(signal.reason || new DOMException('Aborted', 'AbortError'))
        timer = setTimeout(() => reject(new Error('Google routing timed out.')), timeoutMs)
        signal?.addEventListener('abort', abort, { once: true })
        if (signal?.aborted) abort()
      }),
    ])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export function createGoogleStreetProvider(computeRoutes, vehicle, timeoutMs = 12000) {
  return async (points, signal) => {
    signal?.throwIfAborted()
    const { routes = [], fallbackInfo } = await boundedRequest(computeRoutes({
      origin: { lat: points[0].lat, lng: points[0].lng },
      destination: { lat: points.at(-1).lat, lng: points.at(-1).lng },
      intermediates: points.slice(1, -1).map(point => ({ location: { lat: point.lat, lng: point.lng }, via: true })),
      travelMode: vehicle === 'BIKE' ? 'TWO_WHEELER' : 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE', departureTime: new Date(),
      computeAlternativeRoutes: points.length === 2,
      fields: ['path', 'durationMillis', 'distanceMeters', 'description'],
    }), signal, timeoutMs)
    signal?.throwIfAborted()
    if (fallbackInfo) throw new Error('Google could not supply the requested traffic-aware routing.')
    const normalized = routes.map(route => ({
      path: (route.path || []).map(point => [typeof point.lat === 'function' ? point.lat() : point.lat, typeof point.lng === 'function' ? point.lng() : point.lng]),
      durationMins: Math.max(1, Math.ceil(route.durationMillis / 60000)), distanceKm: route.distanceMeters / 1000,
      description: route.description || '', timingProvider: 'GOOGLE', travelMode: vehicle === 'BIKE' ? 'TWO_WHEELER' : 'DRIVING',
    })).filter(route => route.path.length > 1 && route.path.every(point => point.every(Number.isFinite)) && Number.isFinite(route.durationMins) && Number.isFinite(route.distanceKm))
    if (!normalized.length) throw new Error('Google returned no usable street route.')
    return normalized
  }
}

export async function resolveJourney(origin, destination, incidents, vehicle, signal, apiKey, forceRetry = false) {
  const modeKey = `${apiKey}:${vehicle === 'BIKE' ? 'bike' : 'drive'}`
  let reason = apiKey ? 'Google Routes unavailable. Enable Routes API and check key restrictions/billing for traffic-aware timings.' : 'Add a Google Maps key with Routes API enabled for traffic-aware timings.'
  if (apiKey && (forceRetry || Date.now() - (unavailable.get(modeKey) || 0) > 60000)) {
    try {
      const { googleLibrary } = await import('./places.js')
      const { Route } = await boundedRequest(googleLibrary(apiKey, 'routes'), signal, 12000)
      const provider = createGoogleStreetProvider(request => Route.computeRoutes(request), vehicle)
      const result = await resolveFloodRoutes(origin, destination, incidents, vehicle, signal, provider)
      unavailable.delete(modeKey)
      unavailableReasons.delete(modeKey)
      return { ...result, timingProvider: 'GOOGLE', timingNote: 'Google traffic-aware estimate · departing now', computedAt: Date.now(), vehicle }
    } catch (error) {
      if (signal?.aborted) throw error
      if (/Routes API.*disabled|Routes API has not been used/i.test(error.message)) reason = 'Google Routes API is disabled for this key’s project. Enable it for traffic-aware timings, then reload.'
      unavailableReasons.set(modeKey, reason)
      unavailable.set(modeKey, Date.now())
    }
  }
  const result = await resolveFloodRoutes(origin, destination, incidents, vehicle, signal)
  return { ...result, timingProvider: 'OSRM', timingNote: 'OSRM road estimate · live traffic unavailable', providerNotice: unavailableReasons.get(modeKey) || reason, computedAt: Date.now(), vehicle }
}

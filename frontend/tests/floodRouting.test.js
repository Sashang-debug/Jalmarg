import test from 'node:test'
import assert from 'node:assert/strict'
import { auditPath, chooseRoute, distanceToSegmentMeters, resolveFloodRoutes } from '../src/utils/floodRouting.js'

const now = Date.now()
const incident = (overrides = {}) => ({ id: 'one', lat: 12.93, lng: 77.62, depthCm: 30, status: 'NEEDS_REVIEW', expiresAt: new Date(now + 3600000).toISOString(), ...overrides })
const route = (path, durationMins = 10) => ({ path, durationMins, distanceKm: 3 })

test('detects hazards between sparse waypoints, not only at waypoints', () => {
  const result = auditPath([[12.92, 77.62], [12.94, 77.62]], [incident()], 'BIKE', now)
  assert.equal(result.blocking.length, 1)
})
test('checks actual curved road geometry rather than endpoint chord', () => {
  const hazard = incident({ lat: 12.94, lng: 77.64 })
  const result = auditPath([[12.92, 77.62], [12.94, 77.64], [12.92, 77.66]], [hazard], 'BIKE', now)
  assert.equal(result.blocking.length, 1)
})
test('does not block an unaffected curved road based on its endpoint chord', () => {
  const hazard = incident({ lat: 12.92, lng: 77.64 })
  assert.equal(auditPath([[12.92, 77.62], [12.94, 77.64], [12.92, 77.66]], [hazard], 'BIKE', now).blocking.length, 0)
})
test('expired and cleared observations never affect route selection', () => {
  const path = [[12.92, 77.62], [12.94, 77.62]]
  assert.equal(auditPath(path, [incident({ expiresAt: new Date(now).toISOString() }), incident({ status: 'CLEARED' })], 'BIKE', now).hazards.length, 0)
})
test('threshold boundaries are consistent and inclusive', () => {
  const path = [[12.92, 77.62], [12.94, 77.62]]
  for (const [vehicle, boundary] of [['BIKE', 20], ['SEDAN', 30], ['SUV', 55]]) {
    assert.equal(auditPath(path, [incident({ depthCm: boundary })], vehicle, now).blocking.length, 1)
    assert.equal(auditPath(path, [incident({ depthCm: boundary - 1 })], vehicle, now).blocking.length, 0)
  }
})
test('selects an alternative only after checking its own geometry', () => {
  const direct = route([[12.92, 77.62], [12.94, 77.62]], 8)
  const detour = route([[12.92, 77.62], [12.93, 77.65], [12.94, 77.62]], 12)
  const result = chooseRoute([direct, detour], [incident()], 'BIKE', now)
  assert.equal(result.selected.durationMins, 12)
  assert.equal(result.selected.blocking.length, 0)
})
test('returns no alternative when every candidate is blocked', () => {
  const result = chooseRoute([route([[12.92, 77.62], [12.94, 77.62]])], [incident()], 'BIKE', now)
  assert.equal(result.status, 'NO_ALTERNATIVE')
  assert.equal(result.selected, null)
})
test('empty geometry does not turn into an invented route', () => {
  assert.equal(chooseRoute([route([])], [], 'BIKE', now).status, 'UNAVAILABLE')
})
test('segment distance handles repeated points', () => {
  assert.ok(distanceToSegmentMeters({ lat: 0, lng: 0 }, [0, 0], [0, 0]) === 0)
})
test('routing failure propagates instead of substituting a straight line', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('offline') }
  try {
    await assert.rejects(resolveFloodRoutes({ lat: 11, lng: 70 }, { lat: 12, lng: 71 }, [], 'BIKE'), /offline/)
  } finally { globalThis.fetch = original }
})
test('failed detour requests cannot reuse the blocked direct route as selected', async () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    if (calls++ > 0) throw new Error('detour offline')
    return { ok: true, json: async () => ({ code: 'Ok', routes: [{ geometry: { coordinates: [[77.62, 12.92], [77.62, 12.94]] }, distance: 2000, duration: 500 }] }) }
  }
  try {
    const result = await resolveFloodRoutes({ lat: 12.92, lng: 77.62 }, { lat: 12.94, lng: 77.62 }, [incident()], 'BIKE')
    assert.equal(result.status, 'NO_ALTERNATIVE')
    assert.equal(result.selected, null)
    assert.equal(calls, 3)
  } finally { globalThis.fetch = original }
})

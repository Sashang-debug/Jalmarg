import test from 'node:test'
import assert from 'node:assert/strict'
import { cityForPoint, matchesPlace, nearbyLandmarks, defaultJourney, fallbackPlace } from '../src/utils/cities.js'
import { sampleReports, checkTestOutcome } from '../src/utils/testScenarios.js'
import { chooseRoute } from '../src/utils/floodRouting.js'

const gwalior = { lat: 26.24994883, lng: 78.16930248 }
const now = Date.now()
const direct = { id: 'direct', path: [[26.24,78.17],[26.23,78.17],[26.22,78.17]], durationMins: 8, distanceKm: 3 }
const detour = { id: 'detour', path: [[26.24,78.17],[26.24,78.19],[26.22,78.19],[26.22,78.17]], durationMins: 12, distanceKm: 5 }

test('Gwalior GPS overrides stale Mumbai landmark context', () => {
  assert.equal(cityForPoint(gwalior), 'GWL')
  const suggestions = nearbyLandmarks(gwalior, 'BOM')
  assert.ok(suggestions.length)
  assert.ok(suggestions.every(place => place.city === 'GWL' && !place.name.includes('Bandra')))
  assert.match(suggestions[0].name, /IIITM/)
})
test('unsupported GPS locations do not fall back to Mumbai', () => {
  const point = { lat: 22.57, lng: 88.36 }
  assert.equal(cityForPoint(point), 'OTHER')
  assert.deepEqual(nearbyLandmarks(point, 'BOM'), [])
  assert.equal(fallbackPlace(point).name, 'Selected location')
  assert.deepEqual(defaultJourney('OTHER'), { origin: null, destination: null })
  for (const point of [null, { lat: NaN, lng: 78 }, { lat: 26, lng: undefined }, { lat: 386, lng: 78 }]) assert.equal(cityForPoint(point), 'OTHER')
})
test('other supported cities and Gwalior defaults retain correct geography', () => {
  assert.equal(cityForPoint({lat:19.08,lng:72.84}), 'BOM')
  assert.equal(cityForPoint({lat:12.93,lng:77.63}), 'BLR')
  assert.equal(cityForPoint({lat:28.63,lng:77.23}), 'DEL')
  assert.equal(cityForPoint(defaultJourney('GWL').destination), 'GWL')
})
test('dummy flood is placed on the fastest actual route, independent of input order', () => {
  const reports = sampleReports('flooded', [detour, direct], 'GWL', now)
  assert.equal(reports[0].lat, 26.23)
  assert.equal(reports[0].lng, 78.17)
  assert.match(reports[0].notes, /Not a real flood/)
  assert.deepEqual(sampleReports('clear', [direct], 'GWL', now), [])
  assert.deepEqual(sampleReports('flooded', [], 'GWL', now), [])
})
test('flooded scenario selects an unaffected detour for bikes/cars and permits SUV profile', () => {
  const reports = sampleReports('flooded', [direct, detour], 'GWL', now)
  for (const vehicle of ['BIKE','SEDAN']) {
    const result = chooseRoute([direct, detour], reports, vehicle, now)
    assert.equal(result.selected.id, 'detour')
    assert.equal(result.candidates.find(c => c.id === 'direct').blocking.length, 1)
    assert.equal(checkTestOutcome('flooded', result, vehicle).pass, true)
  }
  assert.equal(chooseRoute([direct], reports, 'SUV', now).selected.id, 'direct')
})
test('all-exits dummy blocks every candidate for every vehicle', () => {
  const reports = sampleReports('blocked', [direct, detour], 'GWL', now)
  for (const vehicle of ['BIKE','SEDAN','SUV']) {
    const result = chooseRoute([direct, detour], reports, vehicle, now)
    assert.equal(result.selected, null)
    assert.equal(result.status, 'NO_ALTERNATIVE')
    assert.equal(checkTestOutcome('blocked', result, vehicle).pass, true)
  }
})
test('clearance restores fastest route and unavailable provider never falsely passes', () => {
  const result = chooseRoute([direct, detour], sampleReports('cleared', [direct], 'GWL', now), 'BIKE', now)
  assert.equal(result.selected.id, 'direct')
  assert.equal(checkTestOutcome('cleared', result, 'BIKE').pass, true)
  assert.equal(checkTestOutcome('clear', {status:'UNAVAILABLE'}, 'BIKE').pass, false)
  assert.equal(checkTestOutcome('blocked', {status:'LOADING'}, 'BIKE'), null)
})

test('landmark search tolerates commas, case and word order', () => {
  assert.equal(matchesPlace('Phool Bagh, Gwalior', 'phool bagh gwalior'), true)
  assert.equal(matchesPlace('Gwalior Railway Station', 'railway gwalior'), true)
  assert.equal(matchesPlace('IIITM Campus, Gwalior', 'Bandra'), false)
})

test('a below-threshold report does not force a slower SUV route', () => {
  const result = chooseRoute([direct,detour], sampleReports('flooded',[direct,detour],'GWL',now),'SUV',now)
  assert.equal(result.selected.id,'direct')
  assert.equal(result.selected.hazards.length,1)
})

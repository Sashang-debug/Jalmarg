export const TEST_SCENARIOS = [
  { id: 'clear', name: 'Clear roads', expected: 'A street route should be selected.' },
  { id: 'flooded', name: 'Flooded fastest road', expected: '2-wheelers/cars must avoid the sample flood or show no alternative.' },
  { id: 'blocked', name: 'All exits flooded', expected: 'No route should be selected for any vehicle.' },
  { id: 'cleared', name: 'Flood cleared', expected: 'A cleared report must not block the original route.' },
]
export function sampleReports(scenario, candidates, city, now = Date.now()) {
  if (scenario === 'clear' || !candidates.length) return []
  const fastest = [...candidates].sort((a, b) => a.durationMins - b.durationMins)[0]
  const point = scenario === 'blocked' ? fastest.path[0] : fastest.path[Math.floor(fastest.path.length * 0.5)]
  const deep = scenario === 'blocked'
  const status = scenario === 'cleared' ? 'CLEARED' : 'NEEDS_REVIEW'
  const createdAt = new Date(now - 120000).toISOString()
  return [{ id: `sample-${city}-${scenario}`, city, lat: point[0], lng: point[1],
    roadName: deep ? 'Sample flood at the starting road' : 'Sample waterlogging on fastest road',
    depthCm: deep ? 75 : 50, waterLevel: deep ? 'DEEP' : 'KNEE', waterLevelLabel: deep ? 'Deep water' : 'Knee-level',
    status, createdAt, updatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 4 * 3600000).toISOString(),
    photoUrl: '', notes: 'Dummy observation for route testing. Not a real flood report.',
    stillFloodedCount: 0, recededCount: 0, depthSource: 'TEST_SCENARIO',
    timeline: [{ at: createdAt, kind: 'REPORTED', status: 'NEEDS_REVIEW', message: 'Dummy observation placed on actual returned street geometry.' },
      ...(status === 'CLEARED' ? [{ at: new Date(now).toISOString(), kind: 'CLEAR', status, message: 'Dummy clearance. This report should no longer affect routing.' }] : [])] }]
}
export function checkTestOutcome(scenario, route, vehicle) {
  if (!route || route.status === 'LOADING') return null
  if (route.status === 'UNAVAILABLE') return { pass: false, label: 'Not evaluated: street service unavailable' }
  const pass = scenario === 'blocked' ? !route.selected
    : scenario === 'clear' || scenario === 'cleared' ? Boolean(route.selected)
    : !route.selected || route.selected.blocking.length === 0
  return { pass, label: pass ? `Passed for ${vehicle === 'BIKE' ? '2-wheeler' : vehicle === 'SEDAN' ? 'car' : 'SUV'}` : 'Unexpected outcome. Check route details.' }
}

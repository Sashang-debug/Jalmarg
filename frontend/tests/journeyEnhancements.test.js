import test from 'node:test'
import assert from 'node:assert/strict'
import { createGoogleStreetProvider } from '../src/utils/journeyRouting.js'
import { routeAdvisory } from '../src/utils/routeAdvisory.js'
import { assessVehicle, photoDepth } from '../src/utils/vehicleAssessment.js'
const now = Date.now()
const report = {roadName:'Station road',depthCm:50,status:'NEEDS_REVIEW',expiresAt:new Date(now+3600000).toISOString()}
const origin={lat:26.24,lng:78.17,name:'Campus'}, destination={lat:26.22,lng:78.18,name:'Station'}

test('Google routing requests real two-wheeler vs driving modes with traffic and fresh departure',async () => {
  const requests=[]
  const compute=async request => {requests.push(request);return {routes:[{path:[{lat:26.24,lng:78.17},{lat:26.22,lng:78.18}],durationMillis:601000,distanceMeters:5000,description:'AB Road'}]}}
  for (const vehicle of ['BIKE','SEDAN','SUV']) {
    const routes=await createGoogleStreetProvider(compute,vehicle)([origin,destination])
    assert.equal(routes[0].durationMins,11)
    assert.equal(routes[0].distanceKm,5)
    assert.equal(routes[0].timingProvider,'GOOGLE')
  }
  assert.deepEqual(requests.map(r=>r.travelMode),['TWO_WHEELER','DRIVING','DRIVING'])
  assert.ok(requests.every(r=>r.routingPreference==='TRAFFIC_AWARE' && r.departureTime instanceof Date))
})
test('detour requests carry via points and invalid Google geometry is rejected',async () => {
  let request
  const provider=createGoogleStreetProvider(async r=>{request=r;return {routes:[]}},'BIKE')
  await assert.rejects(provider([origin,{lat:26.23,lng:78.19},destination]),/no usable/)
  assert.equal(request.intermediates[0].via,true)
  assert.equal(request.computeAlternativeRoutes,false)
  const fallback=createGoogleStreetProvider(async()=>({fallbackInfo:{reason:'SERVER_ERROR'},routes:[]}), 'SEDAN')
  await assert.rejects(fallback([origin,destination]),/traffic-aware/)
})
test('cancelled route requests cannot publish an estimate',async () => {
  const controller=new AbortController();controller.abort()
  await assert.rejects(createGoogleStreetProvider(async()=>{throw Error('should not run')},'BIKE')([origin,destination],controller.signal),/abort/i)
})
test('audio explains the avoided flood and time/distance change, not just the selected path',()=>{
  const route={timingProvider:'OSRM',selected:{durationMins:15,distanceKm:8,hazards:[],blocking:[]},fastest:{durationMins:10,distanceKm:5,blocking:[report]}}
  const script=routeAdvisory({route,vehicle:'BIKE',origin,destination,demo:true})
  for(const fragment of ['dummy','Station road','50 cm','changed the route','+5 minutes','+3.0 kilometres','OSRM']) assert.ok(script.includes(fragment),fragment)
  assert.ok(routeAdvisory({route,vehicle:'BIKE'},'hi-IN').includes('मार्ग बदला गया'))
})
test('audio names remaining hazards and does not invent a detour',()=>{
  const route={timingProvider:'GOOGLE',selected:{durationMins:10,distanceKm:5,hazards:[report]},fastest:{durationMins:10,distanceKm:5,blocking:[]}}
  const script=routeAdvisory({route,vehicle:'SUV'})
  assert.match(script,/no flood detour/)
  assert.match(script,/1 reported waterlogged point remains/)
  assert.match(script,/Google traffic-aware/)
})
test('vehicle assessments handle inclusive thresholds and expired/unknown evidence',()=>{
  assert.equal(assessVehicle(report,'BIKE',now).state,'avoid')
  assert.equal(assessVehicle(report,'SEDAN',now).state,'avoid')
  assert.equal(assessVehicle(report,'SUV',now).state,'review')
  assert.equal(assessVehicle({...report,depthCm:55},'SUV',now).state,'avoid')
  assert.equal(assessVehicle({...report,status:'CLEARED'},'SUV',now).state,'unknown')
  assert.equal(assessVehicle({...report,depthCm:null},'BIKE',now).state,'unknown')
})
test('photo depth uses confirmed image geometry rather than captions or fixed dummy values',()=>{
  const reference={topY:.2,baseY:.8,waterY:.5,referenceHeightCm:60,confirmed:true}
  assert.equal(photoDepth(reference),30)
  assert.equal(photoDepth({...reference,waterY:.4}),40)
  for(const bad of [{confirmed:false},{baseY:.21},{waterY:.9},{waterY:.1},{referenceHeightCm:NaN},{topY:-1}]) assert.equal(photoDepth({...reference,...bad}),null)
})

 test('a stalled Google request times out and an in-flight request can be cancelled', async () => {
  const never = () => new Promise(() => {})
  await assert.rejects(createGoogleStreetProvider(never, 'BIKE', 10)([origin,destination]), /timed out/)
  const controller = new AbortController()
  const request = createGoogleStreetProvider(never, 'SEDAN')([origin,destination], controller.signal)
  controller.abort()
  await assert.rejects(request, /abort/i)
})

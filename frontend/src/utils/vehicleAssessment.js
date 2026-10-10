import { AVOIDANCE_DEPTHS, isActiveIncident } from './floodRouting.js'
export const VEHICLES = [{id:'BIKE',label:'2-wheeler'}, {id:'SEDAN',label:'Sedan / hatchback'}, {id:'SUV',label:'SUV'}]
export function assessVehicle(incident, vehicle, now = Date.now()) {
  if (!isActiveIncident(incident, now)) return { state: 'unknown', label: 'Current conditions unknown' }
  if (!Number.isFinite(incident.depthCm) || incident.depthCm < 0) return { state: 'unknown', label: 'Depth unknown' }
  return incident.depthCm >= AVOIDANCE_DEPTHS[vehicle]
    ? { state: 'avoid', label: 'Avoid this reported depth' }
    : { state: 'review', label: 'Below setting · review conditions' }
}
export function photoDepth(reference) {
  if (!reference || reference.confirmed !== true) return null
  const {topY,baseY,waterY,referenceHeightCm} = reference
  if (![topY,baseY,waterY,referenceHeightCm].every(Number.isFinite) ||
      [topY,baseY,waterY].some(value => value < 0 || value > 1) || baseY - topY < .05 || waterY > baseY || waterY < topY || referenceHeightCm < 1 || referenceHeightCm > 300) return null
  const depthCm = Math.round(referenceHeightCm * (baseY - waterY) / (baseY - topY))
  return depthCm <= 300 ? depthCm : null
}

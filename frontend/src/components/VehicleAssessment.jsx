import { Bike, Car, Truck, AlertTriangle, Eye, HelpCircle } from 'lucide-react'
import { AVOIDANCE_DEPTHS } from '../utils/floodRouting'
import { VEHICLES, assessVehicle } from '../utils/vehicleAssessment'
const icons = { BIKE: Bike, SEDAN: Car, SUV: Truck }
export default function VehicleAssessment({ incident, vehicle }) {
  return <section className="vehicle-assessment" aria-label="Vehicle assessment"><h3>Vehicle assessment</h3>
    <p>Based on ~{incident.depthCm} cm routing depth. These prototype settings do not establish that a vehicle can cross.</p>
    <div>{VEHICLES.map(item => { const Icon = icons[item.id]; const assessment = assessVehicle(incident, item.id); const Status = assessment.state === 'avoid' ? AlertTriangle : assessment.state === 'review' ? Eye : HelpCircle
      return <article key={item.id} className={`vehicle-assessment-row ${assessment.state} ${vehicle === item.id ? 'current' : ''}`}><Icon size={21} /><div><strong>{item.label}{vehicle === item.id ? ' · your vehicle' : ''}</strong><span><Status size={14} />{assessment.label}</span></div><small>{AVOIDANCE_DEPTHS[item.id]} cm<br />avoidance setting</small></article>
    })}</div><p className="help-text">Water movement, hidden road damage, vehicle specifications and changing levels are not measured here.</p>
  </section>
}

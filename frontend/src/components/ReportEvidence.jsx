import { useState } from 'react'
import { Camera, Clock, MapPin, ShieldCheck, History, Waves, Check } from 'lucide-react'
import Dialog from './Dialog'
import VehicleAssessment from './VehicleAssessment'
import { WORK_LABELS } from '../utils/municipalPolicy'
import { apiRequest, evidenceUrl, STATUS_LABELS, timeAgo } from '../utils/incidentsApi'
import { isActiveIncident } from '../utils/floodRouting'

export default function ReportEvidence({ incident, onClose, onChanged, demo, vehicle, session }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function observe(action) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await apiRequest(`/incidents/${incident.id}/observations`, { token: session?.token, body: { city: incident.city, action } })
      onChanged(result.incident); setMessage('Your observation was saved. An operator reviews changes in road conditions.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <Dialog title={incident.roadName} subtitle="Evidence behind this report" onClose={onClose}>
    <div className="evidence-meta"><span className={`status-badge ${incident.status.toLowerCase()}`}>{STATUS_LABELS[incident.status]}</span>
      <span><Clock size={14} />{timeAgo(incident.createdAt)}</span></div>
    <div className="water-observation"><Waves size={28} /><div><h3>{incident.waterLevelLabel}</h3><p>{incident.depthSource === 'PHOTO_REFERENCE' ? 'Photo reference + citizen observation · approximate' : incident.depthSource === 'TEST_SCENARIO' ? 'Dummy observation · test only' : 'Citizen observation · approximate water level'}</p></div></div>
    {incident.photoEstimate && <div className="info-box">Photo reference estimate: <strong>~{incident.photoEstimate.depthCm} cm</strong>. Based on a user-marked reference of {incident.photoEstimate.referenceHeightCm} cm. Perspective and reference accuracy are unverified. Routing uses the higher of this estimate and the reported level.</div>}
    {incident.workStatus && <div className="info-box"><strong>Municipal progress: {WORK_LABELS[incident.workStatus]}</strong>{incident.workTicket?.assigneeName && <p>Assigned to {incident.workTicket.assigneeName}</p>}{incident.duplicateOf && <p>Linked to incident {incident.duplicateOf.slice(0,8)}</p>}</div>}
    {incident.resolution && <section className="resolution-evidence"><h3>{['RESOLUTION_SUBMITTED','RESOLVED'].includes(incident.workStatus)?'Completion evidence':'Previous completion evidence'}</h3>{incident.resolution.photoUrl && <img src={evidenceUrl(incident.resolution.photoUrl)} alt={`Municipal completion evidence at ${incident.roadName}`} />}<p>{incident.resolution.note}</p><p>Submitted by {incident.resolution.submittedByName} · {new Date(incident.resolution.submittedAt).toLocaleString()}</p>{incident.resolution.reviewedAt ? <p>Reviewed by {incident.resolution.reviewedByName}: {incident.resolution.reviewNote}</p> : <p>Awaiting independent municipal review. This does not clear the road observation.</p>}</section>}
    {incident.resolutionHistory?.length>0 && <details className="resolution-evidence"><summary>Earlier completion attempts ({incident.resolutionHistory.length})</summary>{incident.resolutionHistory.map((previous,index)=><section key={`${previous.submittedAt}-${index}`}><h3>{new Date(previous.submittedAt).toLocaleString()}</h3>{previous.photoUrl&&<img src={evidenceUrl(previous.photoUrl)} alt="Earlier municipal completion evidence"/>}<p>{previous.submittedByName}: {previous.note}</p>{previous.reviewNote&&<p>Reviewed by {previous.reviewedByName}: {previous.reviewNote}</p>}</section>)}</details>}
    <VehicleAssessment incident={incident} vehicle={vehicle} />
    <div className="evidence-facts"><p><MapPin size={16} /><span>Reported location<br /><strong>{incident.roadName}</strong></span></p>
      <p><ShieldCheck size={16} /><span>{incident.workStatus === 'RESOLVED' ? 'Completion reviewed by an approved municipal worker' : incident.status === 'CONFIRMED' ? 'Reviewed by an authenticated operator' : 'Independent verification is pending'}<br />
        <strong>{incident.stillFloodedCount || 0} still-flooded · {incident.recededCount || 0} receded observations</strong></span></p></div>
    {incident.photoUrl ? <figure><img className="evidence-photo" src={evidenceUrl(incident.photoUrl)} alt={`Citizen evidence at ${incident.roadName}`} /><figcaption><Camera size={13} />Submitted photo; authenticity has not been automatically established.</figcaption></figure>
      : <div className="empty-evidence"><Camera size={22} /><span>No photo was attached to this report.</span></div>}
    {incident.notes && <p className="report-notes">{incident.notes}</p>}
    <div className="info-box">Valid for active routing until {new Date(incident.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Missing or old reports do not establish that a road is safe.</div>
    <h3 className="timeline-heading"><History size={17} />Report history</h3>
    <ol className="audit-timeline">{incident.timeline.map((event, index) => <li key={`${event.at}-${index}`}><time>{new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
      <div><strong>{STATUS_LABELS[event.status]}</strong>{event.workStatus&&<span className="timeline-work">{WORK_LABELS[event.workStatus]}{event.actor?` · ${event.actor}`:""}</span>}<p>{event.message}</p>{event.note && <p className="muted">{event.note}</p>}</div></li>)}</ol>
    {incident.workTicket && <div className="info-box">Ticket {incident.workTicket.id || 'pending'} · {WORK_LABELS[incident.workStatus] || 'Awaiting assignment'}. No automatic pump dispatch is connected.</div>}
    {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    <div className="observation-actions"><button className="secondary-button" disabled={busy || demo || !session || (!incident.workStatus && !isActiveIncident(incident))} onClick={() => observe('STILL_FLOODED')}><Waves size={16} />Still flooded</button>
      <button className="secondary-button" disabled={busy || demo || !session || (!incident.workStatus && !isActiveIncident(incident))} onClick={() => observe('RECEDED')}><Check size={16} />Water receded</button></div>
    <p className="help-text">{!session ? "Sign in to add an observation. " : ""}Updates request a review. They cannot clear a report automatically.{demo ? ' Dummy scenarios are read-only.' : ''}</p>
  </Dialog>
}

import { useState } from 'react'
import { ShieldCheck, LogIn, LogOut, ExternalLink, Check, ClipboardList } from 'lucide-react'
import Dialog from './Dialog'
import { apiRequest, STATUS_LABELS, timeAgo } from '../utils/incidentsApi'
import { beginOperatorLogin, cloudAuthConfigured } from '../utils/operatorAuth'
import { isActiveIncident } from '../utils/floodRouting'

export default function OperatorWorkspace({ incidents, mode, token, onToken, onClose, onChanged, onViewEvidence, demo }) {
  const [localToken, setLocalToken] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  async function review(incident, action) {
    setError(''); setBusy(incident.id)
    try {
      const result = await apiRequest(`/incidents/${incident.id}/review`, { token, body: { city: incident.city, action, note } })
      onChanged(result.incident)
    } catch (err) { setError(err.message) }
    finally { setBusy('') }
  }
  const pending = incidents.filter(i => isActiveIncident(i))
  return <Dialog wide title="Operator review" subtitle="Review evidence before changing an incident's status." onClose={onClose}>
    <div className="operator-auth"><ShieldCheck size={22} /><div><strong>{token ? 'Operator session active' : 'Operator sign-in required'}</strong><p>{mode === 'local' ? 'Local development workspace · not a municipal integration' : 'Cognito authentication · civic-operators group required'}</p></div>
      {token && <button className="icon-button" aria-label="Sign out of operator workspace" onClick={() => onToken('')}><LogOut size={18} /></button>}</div>
    {!token && !demo && (mode === 'local' ? <form className="local-login" onSubmit={event => { event.preventDefault(); onToken(localToken); setLocalToken('') }}>
      <label>Development token from the backend terminal<input type="password" autoComplete="off" required value={localToken} onChange={e => setLocalToken(e.target.value)} /></label>
      <button className="primary-button"><LogIn size={17} />Use development token</button></form>
      : <button className="primary-button" disabled={!cloudAuthConfigured} onClick={() => beginOperatorLogin().catch(err => setError(err.message))}><LogIn size={17} />Sign in with Cognito</button>)}
    {demo && <div className="info-box">Recorded scenario. Review actions are disabled; use Live reports for the real workflow.</div>}
    {token && <label className="review-note">Review note <span className="muted">Optional</span><input maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder="What evidence supports your decision?" /></label>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="operator-list">{pending.length ? pending.map(incident => <article key={incident.id} className="operator-report">
      <div><span className={`status-badge ${incident.status.toLowerCase()}`}>{STATUS_LABELS[incident.status]}</span><h3>{incident.roadName}</h3><p>{incident.waterLevelLabel} · {timeAgo(incident.createdAt)}</p></div>
      <button className="text-button" onClick={() => onViewEvidence(incident)}>Evidence<ExternalLink size={14} /></button>
      <div className="operator-actions">
        <button className="secondary-button" disabled={!token || demo || busy === incident.id || incident.status === 'CONFIRMED'} onClick={() => review(incident, 'CONFIRM')}><ShieldCheck size={15} />Confirm report</button>
        <button className="secondary-button" disabled={!token || demo || busy === incident.id} onClick={() => review(incident, 'CLEAR')}><Check size={15} />Mark cleared</button>
        <button className="secondary-button" disabled={!token || demo || busy === incident.id || incident.status !== 'CONFIRMED' || Boolean(incident.workTicket)} onClick={() => review(incident, 'CREATE_TICKET')}><ClipboardList size={15} />{incident.workTicket ? incident.workTicket.id : 'Create review ticket'}</button>
      </div></article>) : <div className="empty-state"><ShieldCheck size={30} /><h3>No active reports to review</h3><p>New citizen observations appear here after submission.</p></div>}</div>
    <p className="help-text">Review tickets await assignment. This prototype does not dispatch municipal equipment.</p>
  </Dialog>
}

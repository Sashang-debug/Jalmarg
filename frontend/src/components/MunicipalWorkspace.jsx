import { useEffect, useState } from 'react'
import {
  ArrowLeft, Building2, Camera, CheckCircle2, ChevronDown, ClipboardList,
  Clock3, Droplets, History, Image, MapPin, MapPinned, RefreshCw, Search,
  ShieldCheck, Users, Wrench
} from 'lucide-react'
import { apiRequest, timeAgo } from '../utils/incidentsApi'
import { CITIES } from '../utils/cities'
import { isActiveIncident } from '../utils/floodRouting'
import { WORK_LABELS, workActions, priority } from '../utils/municipalPolicy'
import InteractiveMap from './InteractiveMap'
import ReportEvidence from './ReportEvidence'
import { preparePhoto } from './ReportComposer'

const DEFAULT_NOTES = {
  TAKE_AND_START: 'Worker accepted this location and started field work.',
  REOPEN: 'Water is still present. Further field work is required.',
  APPROVE_RESOLUTION: 'Completion evidence independently reviewed and accepted.',
  ASSIGN: 'Location assigned to an approved worker.',
  REJECT: 'Report reviewed and marked as not actionable.',
  DUPLICATE: 'Report linked to an existing affected location.'
}

const FILTERS = [
  { value: 'OPEN', label: 'Needs action', icon: Droplets },
  { value: 'MINE', label: 'My locations', icon: Wrench },
  { value: 'RESOLUTION_SUBMITTED', label: 'Verify completion', icon: ShieldCheck },
  { value: 'ALL', label: 'History', icon: History }
]

function matchesFilter(item, filter, userId) {
  if (filter === 'ALL') return true
  if (filter === 'MINE') return item.workTicket?.assigneeSub === userId && !['RESOLVED', 'REJECTED'].includes(item.workStatus)
  if (filter === 'RESOLUTION_SUBMITTED') return item.workStatus === filter
  return !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(item.workStatus)
}

function sortQueue(list) {
  return [...list].sort((a, b) => priority(a).rank - priority(b).rank || Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

function StatusChoice({ icon: Icon, label, detail, active, disabled, onClick, tone = '' }) {
  const className = `field-status-choice ${active ? 'active' : ''} ${tone}`
  const content = <><span className="field-status-icon"><Icon size={21}/></span><span><strong>{label}</strong><small>{detail}</small></span>{active && <CheckCircle2 className="field-status-check" size={18}/>}</>
  return onClick ? <button type="button" className={className} disabled={disabled} onClick={onClick}>{content}</button> : <div className={className} aria-current={active ? 'step' : undefined}>{content}</div>
}

function TaskEditor({ item, items, workers, session, profile, onAction, onEvidence, evidenceReviewed, busy }) {
  const [note, setNote] = useState('')
  const [assignee, setAssignee] = useState(item.workTicket?.assigneeSub || profile.id)
  const [duplicate, setDuplicate] = useState('')
  const [photo, setPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [error, setError] = useState('')
  const actions = workActions(item, profile.id)
  const mine = item.workTicket?.assigneeSub === profile.id
  const newOrFlooded = ['REPORTED', 'REOPENED', 'UNDER_REVIEW'].includes(item.workStatus)
  const ongoing = ['ASSIGNED', 'IN_PROGRESS'].includes(item.workStatus)
  const completionPending = item.workStatus === 'RESOLUTION_SUBMITTED'
  const completed = item.workStatus === 'RESOLVED'

  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true); setPhoto(null); setError('')
    try {
      const prepared = await preparePhoto(file)
      const result = await apiRequest('/evidence', { token: session.token, body: { data: prepared.data, contentType: prepared.contentType } })
      setPhoto({ ...result, preview: prepared.preview })
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  function update(action, fields = {}) {
    onAction(action, { note: note.trim() || DEFAULT_NOTES[action], ...fields })
  }

  function completedAction() {
    if (actions.includes('SUBMIT_RESOLUTION')) return setCompletionOpen(true)
    if (!actions.includes('APPROVE_RESOLUTION')) return
    if (!evidenceReviewed) return onEvidence()
    update('APPROVE_RESOLUTION')
  }

  const completedDetail = completed
    ? 'Verified by another municipal worker.'
    : completionPending && mine
      ? 'Waiting for another worker to verify your proof.'
      : completionPending && !evidenceReviewed
        ? 'Open the photos, then confirm the result.'
        : completionPending
          ? 'Evidence reviewed. Confirm this location is clear.'
          : item.workStatus === 'IN_PROGRESS'
            ? 'Add an after-photo and a completion note.'
            : 'Available after work has started.'

  return <div className="task-editor">
    <div className="task-editor-heading">
      <div><h3>Update field status</h3><p>Choose the status that matches what you see at this location.</p></div>
      <span className="save-note"><Clock3 size={15}/>Saved to history</span>
    </div>

    <div className="field-status-grid" aria-label="Field status">
      <StatusChoice
        icon={Droplets}
        label="Still flooded"
        detail={newOrFlooded ? 'The location still needs attention.' : 'Reopen this location if water remains.'}
        active={newOrFlooded}
        disabled={busy || !actions.includes('REOPEN')}
        onClick={actions.includes('REOPEN') ? () => update('REOPEN') : null}
        tone="water-status"
      />
      <StatusChoice
        icon={Wrench}
        label="Work ongoing"
        detail={item.workStatus === 'IN_PROGRESS' ? 'You are working on this location.' : item.workStatus === 'ASSIGNED' && !mine ? `Assigned to ${item.workTicket?.assigneeName}.` : 'Take this location and start work.'}
        active={ongoing}
        disabled={busy || !actions.includes('TAKE_AND_START')}
        onClick={actions.includes('TAKE_AND_START') ? () => update('TAKE_AND_START') : null}
        tone="work-status"
      />
      <StatusChoice
        icon={CheckCircle2}
        label={completionPending && !mine ? 'Verify completed' : 'Completed'}
        detail={completedDetail}
        active={completionPending || completed}
        disabled={busy || completed || completionPending && mine || !actions.includes('SUBMIT_RESOLUTION') && !actions.includes('APPROVE_RESOLUTION')}
        onClick={actions.includes('SUBMIT_RESOLUTION') || actions.includes('APPROVE_RESOLUTION') ? completedAction : null}
        tone="complete-status"
      />
    </div>

    {completionPending && !mine && !evidenceReviewed && <button type="button" className="evidence-reminder" onClick={onEvidence}><Image size={18}/>Open citizen and completion photos before verifying</button>}

    {(completionOpen || photo) && actions.includes('SUBMIT_RESOLUTION') && <section className="completion-panel" aria-label="Completion evidence">
      <div className="completion-panel-copy"><Camera size={22}/><div><h4>Show the completed work</h4><p>Upload a recent after-photo. Another approved worker will verify it.</p></div></div>
      <label className="photo-upload-control">
        <Camera size={18}/><span>{uploading ? 'Uploading photo...' : photo ? 'Replace after-photo' : 'Choose after-photo'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading || busy}/>
      </label>
      {photo && <img src={photo.preview} alt="After-photo ready for completion review"/>}
      <label className="field-note-label">Completion note<textarea required maxLength={300} value={note} onChange={event => setNote(event.target.value)} placeholder="What work was completed?"/></label>
      <button type="button" className="primary-button submit-completion" disabled={busy || uploading || !photo || !note.trim()} onClick={() => update('SUBMIT_RESOLUTION', { evidenceKey: photo?.evidenceKey })}>{busy ? 'Saving...' : 'Send for verification'}</button>
    </section>}

    {!completionOpen && <label className="field-note-label">Field note <span>optional</span><textarea maxLength={300} value={note} onChange={event => setNote(event.target.value)} placeholder="Add what you saw or did at this location"/></label>}

    {(actions.includes('ASSIGN') || actions.includes('REJECT') || actions.includes('DUPLICATE')) && <details className="advanced-actions">
      <summary><ChevronDown size={17}/>Assignment and report options</summary>
      <div className="advanced-actions-body">
        {actions.includes('ASSIGN') && <label>Assign worker<select value={assignee} onChange={event => setAssignee(event.target.value)}><option value="">Choose approved worker</option>{workers.map(worker => <option key={worker.id} value={worker.id}>{worker.id === profile.id ? `${worker.name} (me)` : worker.name}</option>)}</select></label>}
        {actions.includes('DUPLICATE') && <label>Link to existing location<select value={duplicate} onChange={event => setDuplicate(event.target.value)}><option value="">Choose an open location</option>{items.filter(candidate => candidate.id !== item.id && !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(candidate.workStatus)).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.roadName}</option>)}</select></label>}
        <div className="advanced-action-buttons">
          {actions.includes('ASSIGN') && <button type="button" className="secondary-button" disabled={busy || !assignee} onClick={() => update('ASSIGN', { assigneeSub: assignee })}><Users size={16}/>Assign</button>}
          {actions.includes('DUPLICATE') && <button type="button" className="secondary-button" disabled={busy || !duplicate} onClick={() => update('DUPLICATE', { duplicateOf: duplicate })}>Link report</button>}
          {actions.includes('REJECT') && <button type="button" className="secondary-button danger-action" disabled={busy} onClick={() => update('REJECT')}>Not actionable</button>}
        </div>
      </div>
    </details>}

    {error && <p role="alert" className="error-message">{error}</p>}
    <p className="task-safety-note"><ShieldCheck size={15}/>A different approved worker must verify completion before the road is marked clear.</p>
  </div>
}

export default function MunicipalWorkspace({ session, profile, navigate, logout }) {
  const city = profile.membership.city
  const [items, setItems] = useState([])
  const [workers, setWorkers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('OPEN')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reload, setReload] = useState(0)
  const [evidence, setEvidence] = useState(false)
  const [reviewedEvidenceId, setReviewedEvidenceId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      apiRequest(`/municipal/incidents?city=${city}`, { token: session.token, signal: controller.signal }),
      apiRequest(`/municipal/workers?city=${city}`, { token: session.token, signal: controller.signal })
    ]).then(([reports, people]) => {
      setItems(reports.incidents)
      setWorkers(people.workers)
      setSelectedId(current => current && reports.incidents.some(item => item.id === current) ? current : sortQueue(reports.incidents)[0]?.id || null)
      setError('')
    }).catch(requestError => {
      if (!controller.signal.aborted) setError(requestError.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [city, session.token, reload])

  useEffect(() => {
    const timer = setInterval(() => setReload(value => value + 1), 15000)
    return () => clearInterval(timer)
  }, [])

  const selected = items.find(item => item.id === selectedId)
  const searched = items.filter(item => item.roadName.toLowerCase().includes(query.toLowerCase()))
  const queue = sortQueue(searched.filter(item => matchesFilter(item, filter, profile.id)))
  const counts = {
    OPEN: items.filter(item => matchesFilter(item, 'OPEN', profile.id)).length,
    MINE: items.filter(item => matchesFilter(item, 'MINE', profile.id)).length,
    RESOLUTION_SUBMITTED: items.filter(item => matchesFilter(item, 'RESOLUTION_SUBMITTED', profile.id)).length,
    ALL: items.length
  }

  function chooseFilter(nextFilter) {
    setFilter(nextFilter)
    const first = sortQueue(items.filter(item => matchesFilter(item, nextFilter, profile.id)))[0]
    if (first && !items.some(item => item.id === selectedId && matchesFilter(item, nextFilter, profile.id))) setSelectedId(first.id)
  }

  function openEvidence() {
    setReviewedEvidenceId(selected.id)
    setEvidence(true)
  }

  async function action(kind, fields) {
    setBusy(true); setActionError('')
    try {
      const data = await apiRequest(`/municipal/incidents/${selected.id}/work`, { token: session.token, body: { city, version: selected.version, action: kind, ...fields } })
      setItems(previous => previous.map(item => item.id === data.incident.id ? data.incident : item))
      if (kind === 'APPROVE_RESOLUTION') setFilter('ALL')
      setReviewedEvidenceId(null)
      setReload(value => value + 1)
    } catch (requestError) {
      setActionError(requestError.message)
      setReload(value => value + 1)
    } finally {
      setBusy(false)
    }
  }

  const theme = document.documentElement.dataset.theme || 'light'
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('jalmarg_gmaps_api_key') || ''

  return <div className="portal municipal-page">
    <header className="portal-header">
      <a className="portal-brand" href="#/"><MapPinned size={27}/><strong>JalMarg</strong></a>
      <nav aria-label="Municipal navigation"><button onClick={() => navigate('map')}><ArrowLeft size={17}/>Journey map</button><button onClick={() => navigate('account')}>{profile.name}</button><button className="portal-login" onClick={logout}>Sign out</button></nav>
    </header>
    <main className="municipal-main">
      <div className="municipal-title">
        <span className="municipal-title-icon"><Building2 size={25}/></span>
        <div><h1>Municipal workspace</h1><p>{profile.membership.corporation}</p><small>{CITIES[city]?.name} / {profile.membership.ward}</small></div>
        <button className="icon-button" aria-label="Refresh affected locations" onClick={() => { setLoading(true); setReload(value => value + 1) }}><RefreshCw size={20}/></button>
      </div>

      <div className="workspace-filters" aria-label="Workspace views">
        {FILTERS.map(({ value, label, icon: Icon }) => <button type="button" key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => chooseFilter(value)}><Icon size={19}/><span><strong>{counts[value]}</strong><small>{label}</small></span></button>)}
      </div>

      {(actionError || error) && <p role="alert" className="error-message workspace-error">{actionError || error}</p>}

      <div className="municipal-grid">
        <aside className="incident-queue" aria-label="Affected locations">
          <div className="queue-controls">
            <div className="queue-heading"><div><h2>Affected locations</h2><p>{queue.length} shown</p></div><MapPin size={20}/></div>
            <label className="queue-search"><Search size={17}/><span className="sr-only">Search affected locations</span><input aria-label="Search affected locations" placeholder="Search road or landmark" value={query} onChange={event => setQuery(event.target.value)}/></label>
          </div>
          <div className="queue-list">
            {loading ? <div className="queue-loading" role="status"><span/><span/><span/></div> : queue.length ? queue.map(item => <button className={`queue-item ${selectedId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { setSelectedId(item.id); setEvidence(false); setReviewedEvidenceId(null) }}><span className={`queue-priority priority-${priority(item).rank}`}>{priority(item).label}</span><h3>{item.roadName}</h3><div className="queue-item-meta"><span><Droplets size={14}/>{item.waterLevelLabel}</span><span><Clock3 size={14}/>{timeAgo(item.createdAt)}</span></div><small>{WORK_LABELS[item.workStatus] || 'New report'}{item.workTicket?.assigneeName ? ` / ${item.workTicket.assigneeName}` : ''}</small></button>) : <div className="queue-empty"><ClipboardList size={30}/><h2>No locations here</h2><p>Choose another view or clear the search.</p></div>}
          </div>
        </aside>

        <section className="municipal-detail" aria-label="Selected affected location">
          <div className="municipal-map"><InteractiveMap selectedCity={city} incidents={items.filter(item => isActiveIncident(item))} activeRoute={null} origin={null} destination={null} focusPoint={selected} onSelectIncident={item => { setSelectedId(item.id); setEvidence(false); setReviewedEvidenceId(null) }} googleApiKey={googleKey} theme={theme}/></div>
          {selected ? <div className="task-detail">
            <div className="task-heading">
              <div><span className="current-status">{WORK_LABELS[selected.workStatus] || 'New report'}</span><h2>{selected.roadName}</h2><p><Droplets size={16}/>{selected.waterLevelLabel}, about {selected.depthCm} cm reported</p></div>
              <button className="evidence-button" onClick={openEvidence}><ShieldCheck size={18}/><span>View photos and history</span></button>
            </div>
            <div className="location-context"><MapPin size={17}/><p>{selected.workStatus === 'RESOLVED' ? 'Completion was independently reviewed. This location is marked complete.' : isActiveIncident(selected) ? 'This citizen observation is current and can inform routing.' : 'The observation is old, but the municipal task stays open until it is reviewed.'}</p></div>
            <TaskEditor key={`${selected.id}:${selected.version}`} item={selected} items={items} workers={workers} session={session} profile={profile} onAction={action} onEvidence={openEvidence} evidenceReviewed={reviewedEvidenceId === selected.id} busy={busy}/>
          </div> : <div className="queue-empty detail-empty"><MapPinned size={30}/><h2>Select an affected location</h2><p>Choose a road from the list or select a water marker on the map.</p></div>}
        </section>
      </div>
    </main>
    {evidence && selected && <ReportEvidence incident={selected} session={session} onClose={() => setEvidence(false)} onChanged={() => setReload(value => value + 1)} vehicle="BIKE"/>}
  </div>
}

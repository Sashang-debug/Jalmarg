import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, ArrowUpRight, Bike, Car, Truck, MapPin, LocateFixed, ChevronDown, ChevronUp, Droplets, Clock, Info, Volume2, X, Navigation, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react'
import { CITIES } from '../utils/cities'
import { STATUS_LABELS, timeAgo } from '../utils/incidentsApi'
import { TEST_SCENARIOS, checkTestOutcome } from '../utils/testScenarios'
import PlaceSearch from './PlaceSearch'

export default function JourneyPanel({ city, origin, destination, onOrigin, onDestination, onSwap, onPick, vehicle, onVehicle, route, locating, onLocate, incidents, onReport, onViewEvidence, onAudio, demo, now, apiKey, scenario, onScenario, onClose }) {
  const [expanded, setExpanded] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const panelRef = useRef(null)
  useEffect(() => { if (panelRef.current) panelRef.current.scrollTop = 0 }, [expanded])
  const dragStart = useRef(null), dragged = useRef(false)
  const selected = route.selected
  const affected = route.fastest?.blocking || []
  const hazards = selected?.hazards || route.candidates?.[0]?.hazards || []
  const detour = selected && route.fastest && selected.durationMins > route.fastest.durationMins
  const outcome = demo && checkTestOutcome(scenario, route, vehicle)
  return <aside ref={panelRef} className={`journey-panel ${expanded ? 'expanded' : ''}`} aria-label="Directions" onFocusCapture={event => { if (event.target.tagName === 'INPUT' && innerWidth < 768) setExpanded(true) }}>
    <button className="sheet-handle" onPointerDown={event => { dragStart.current = event.clientY; dragged.current = false; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerUp={event => {
      if (Math.abs(event.clientY - dragStart.current) > 25) { dragged.current = true; setExpanded(event.clientY < dragStart.current) }
    }} onClick={() => { if (dragged.current) { dragged.current = false; return } setExpanded(value => !value) }} aria-expanded={expanded} aria-label={expanded ? 'Collapse directions' : 'Expand directions'}><span /></button>
    <header className="directions-heading"><div><Navigation size={21} /><h1>Directions</h1></div>{selected && <span className="mobile-route-glance">{selected.durationMins} min · {selected.distanceKm.toFixed(1)} km</span>}<button className="icon-button close-directions" aria-label="Close directions" onClick={onClose}><X size={21} /></button></header>
    <div className="journey-points">
      {[['source', origin, onOrigin, 'Starting point', 'ORIGIN'], ['destination', destination, onDestination, 'Destination', 'DESTINATION']].map(([kind, point, onChange, label, mode]) => <div className="direction-field" key={`${kind}-${city}`}>
        <span className={`direction-symbol ${kind}`}><MapPin size={19} /></span><PlaceSearch label={label} placeholder={label === 'Destination' ? 'Choose destination' : 'Choose starting point'} value={point} city={city} bias={point || origin} apiKey={apiKey} onSelect={onChange} onDirty={() => onChange(null)} compact />
        <button className="icon-button pick-point" title={`Choose ${label.toLowerCase()} on map`} aria-label={`Choose ${label.toLowerCase()} on map`} onClick={() => onPick(mode)}><MapPin size={17} /></button></div>)}
      <button className="swap-button" disabled={!origin || !destination} onClick={onSwap} aria-label="Swap starting point and destination"><ArrowDownUp size={18} /></button>
    </div>
    <button className="text-button locate-button" onClick={onLocate} disabled={locating}><LocateFixed size={16} />{locating ? 'Finding your location…' : 'Use my current location'}</button>
    <div className="vehicle-switch" role="group" aria-label="Choose your vehicle">{[['BIKE', Bike, '2-wheeler'], ['SEDAN', Car, 'Car'], ['SUV', Truck, 'SUV']].map(([id, Icon, label]) => <button key={id} aria-pressed={vehicle === id} className={vehicle === id ? 'active' : ''} onClick={() => onVehicle(id)}><Icon size={20} />{label}</button>)}</div>
    {demo && <section className="test-scenario"><div><FlaskConical size={18} /><strong>Route test lab</strong></div><label>Dummy scenario<select value={scenario} onChange={event => onScenario(event.target.value)}>{TEST_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <p>{TEST_SCENARIOS.find(s => s.id === scenario).expected}</p>{outcome && <span className={`test-outcome ${outcome.pass ? 'pass' : ''}`}>{outcome.pass ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{outcome.label}</span>}
      <small>Real street geometry. Dummy floods stay in this session.</small></section>}
    <section className="route-summary" aria-live="polite">
      {route.status === 'LOADING' ? <div className="route-loading"><span /><span /><p>Finding roads and checking reports…</p></div>
        : selected ? <><div className="route-summary-title"><Navigation size={21} /><span>{detour ? 'Alternative around reported water' : 'Suggested route'}</span><span className="route-city">{CITIES[city]?.name}</span></div>
          <div className="route-numbers"><strong>{selected.durationMins}<small>min</small></strong><span>({selected.distanceKm.toFixed(1)} km)</span>{detour && <span className="detour-time">+{selected.durationMins - route.fastest.durationMins} min</span>}</div>
          <p>{hazards.length ? 'Reports are close to this route. Review conditions before travelling.' : 'No active reports intersect this route. Conditions may be unreported.'}</p><small>{route.timingNote}</small>{route.providerNotice && <p className="provider-notice">{route.providerNotice}</p>}<p className="vehicle-timing-note">{vehicle === 'BIKE' ? route.timingProvider === 'GOOGLE' ? '2-wheeler travel mode' : 'Driving fallback; a 2-wheeler-specific ETA is unavailable.' : 'Sedan and SUV share driving timings; flood avoidance may select different roads.'}</p></>
          : <><div className="route-warning"><AlertTriangle size={22} /><h2>{route.status === 'NO_ALTERNATIVE' ? 'No available alternative' : 'Choose your journey'}</h2></div><p>{route.error || (route.status === 'NO_ALTERNATIVE' ? 'All returned routes meet a reported flood above this vehicle’s avoidance setting.' : 'Search for a starting point and destination.')}</p></>}
    </section>
    <div className="journey-details"><button className="explanation-toggle" onClick={() => setWhyOpen(!whyOpen)} aria-expanded={whyOpen}><span><Info size={16} />Why this route?</span>{whyOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
      {whyOpen && <div className="route-explanation"><p>Each road segment is checked against active reports within 120 m. Alternatives go through the same check.</p>
        {(affected.length ? affected : hazards).map(incident => <button className="route-evidence-link" key={incident.id} onClick={() => onViewEvidence(incident)}><Droplets size={19} /><span><strong>{incident.roadName}</strong><small>{incident.waterLevelLabel} · {STATUS_LABELS[incident.status]}</small></span><ArrowUpRight size={16} /></button>)}
        <p className="help-text">Vehicle avoidance settings are prototype estimates. A route without reports is not a safety guarantee.</p></div>}
      <div className="reports-heading"><h2>{demo ? 'Dummy reports' : 'Nearby waterlogging'}</h2><span>{incidents.length} active</span></div>
      {incidents.length ? <div className="report-list">{incidents.map(incident => <button key={incident.id} className="report-row" onClick={() => onViewEvidence(incident)}><span className={`report-symbol ${incident.depthCm >= 35 ? 'critical' : ''}`}><AlertTriangle size={21} /></span><span><strong>{incident.roadName}</strong><small>{incident.waterLevelLabel} · {timeAgo(incident.createdAt, now)}</small></span><ArrowUpRight size={17} /></button>)}</div>
        : <div className="empty-reports"><Droplets size={22} /><p>No active reports in this area.<br /><span>Share waterlogging when you see it.</span></p></div>}
      <button className="secondary-button audio-button" disabled={!selected} onClick={onAudio}><Volume2 size={18} />Listen to route advisory</button>
      <p className="freshness-note"><Clock size={13} />Reports stay active for four hours.</p>
    </div>
    <footer className="journey-footer"><md-filled-button onClick={onReport}><Droplets slot="icon" size={18} />Report waterlogging</md-filled-button></footer>
  </aside>
}

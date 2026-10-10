import { useEffect, useRef, useState } from 'react'
import { Camera, Check, LocateFixed, MapPin, ArrowRight } from 'lucide-react'
import Dialog from './Dialog'
import { CITIES, cityForPoint } from '../utils/cities'
import { currentPosition, describePoint } from '../utils/places'
import PlaceSearch from './PlaceSearch'
import PhotoDepthTool from './PhotoDepthTool'
import { photoDepth } from '../utils/vehicleAssessment'
import InteractiveMap from './InteractiveMap'
import { apiRequest, browserReporterId } from '../utils/incidentsApi'

const LEVELS = [ ['ANKLE', 'Ankle-level', 'Shallow standing water'], ['WHEEL', 'Wheel-level', 'Water around vehicle wheels'],
  ['KNEE', 'Knee-level', 'Deep standing water'], ['DEEP', 'Deep water', 'Vehicles partly submerged'] ]

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP photo.')
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose a photo smaller than 12 MB.')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  // Re-encoding reduces upload size and removes original photo EXIF metadata.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return { data: dataUrl.split(',')[1], contentType: 'image/jpeg', preview: dataUrl }
}

export default function ReportComposer({ city, userLocation, onClose, onSaved, demo, apiKey, theme, onLocated }) {
  const [step, setStep] = useState(1)
  const [point, setPoint] = useState(userLocation || null)
  const [roadName, setRoadName] = useState(userLocation?.name || '')
  const [level, setLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoReference, setPhotoReference] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [photoConsent, setPhotoConsent] = useState(false)
  const [saved, setSaved] = useState(null)
  const [locating, setLocating] = useState(false)
  const [evidenceKey, setEvidenceKey] = useState('')

  const [locationArea, setLocationArea] = useState(userLocation ? cityForPoint(userLocation) : city)
  const [address, setAddress] = useState(userLocation?.address || '')
  const [mapPicker, setMapPicker] = useState(!userLocation)
  const [resolving, setResolving] = useState(false)
  const [locationHint, setLocationHint] = useState('')
  const locationRequest = useRef(0)
  useEffect(() => () => { locationRequest.current++ }, [])
  function selectPlace(place) {
    locationRequest.current++
    setPoint(place); setRoadName(place.name); setAddress(place.address || '')
    setLocationArea(cityForPoint(place)); setLocationHint('Location selected. Check the pin before continuing.')
    setError(''); setResolving(false); setLocating(false)
  }
  async function selectMapPoint(value) {
    setLocating(false); setError('')
    const request = ++locationRequest.current
    setPoint({ ...value, name: 'Selected map location' }); setLocationArea(cityForPoint(value)); setRoadName('Selected map location'); setAddress(''); setResolving(true)
    const described = await describePoint(value, apiKey)
    if (request !== locationRequest.current) return
    setPoint(described); setRoadName(described.name); setAddress(described.address); setResolving(false)
    setLocationHint(described.approximateName ? 'Pin selected. Add the road name if you know it.' : 'Pin selected. Confirm this is where you saw the waterlogging.')
  }

  async function selectPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(''); setPreparing(true); setEvidenceKey(''); setPhotoReference(null)
    try { setPhoto(await preparePhoto(file)); setPhotoConsent(false) }
    catch (err) { setError(err.message) }
    finally { setPreparing(false) }
  }

  async function locate() {
    const request = ++locationRequest.current
    setLocating(true); setError('')
    try {
      const gps = await currentPosition()
      if (request !== locationRequest.current) return
      setPoint(gps); setLocationArea(cityForPoint(gps)); setRoadName('Your current location'); setAddress(''); setMapPicker(true)
      const place = await describePoint(gps, apiKey)
      if (request !== locationRequest.current) return
      setPoint(place); setRoadName(place.name); setAddress(place.address)
      setLocationHint(`GPS location selected${gps.accuracy ? ` (accuracy about ${Math.round(gps.accuracy)} m)` : ''}. Move the pin if needed.`)
      onLocated?.(place)
    } catch (err) { if (request === locationRequest.current) setError(err.message) }
    finally { if (request === locationRequest.current) setLocating(false) }
  }

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      if (demo) throw new Error('Switch to Live reports to submit a persistent observation.')
      let key = evidenceKey
      if (photo && !key) { key = (await apiRequest('/evidence', { body: { data: photo.data, contentType: photo.contentType } })).evidenceKey; setEvidenceKey(key) }
      const result = await apiRequest('/incidents', { body: { city: cityForPoint(point), roadName, lat: Number(point.lat), lng: Number(point.lng),
        waterLevel: level, notes, evidenceKey: key, photoReference, reporterId: browserReporterId() } })
      setSaved(result.incident); onSaved(result.incident)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <Dialog title={saved ? 'Your observation is on the map' : 'Report waterlogging'}
    subtitle={saved ? 'Shared with other commuters. Operator review is still pending.' : 'A recent observation helps someone choose their next turn.'} onClose={onClose}>
    {saved ? <div className="success-content"><span className="success-mark"><Check size={32} /></span>
      <h3>{saved.roadName}</h3><p>{saved.waterLevelLabel} · {saved.status === 'REPORTED' ? 'Reported' : 'Needs review'}</p>
      <div className="info-box">Report ID <code>{saved.id}</code><br />Saved to the shared incident service. Refreshing will preserve it.</div>
      <button className="primary-button" onClick={onClose}>View on map</button></div>
      : <form onSubmit={submit}>
        <ol className="report-steps">{['Location', 'Observation', 'Review'].map((label, i) => <li key={label} className={step >= i + 1 ? 'active' : ''}><span>{i + 1}</span>{label}</li>)}</ol>
        {step === 1 && <div className="form-stack">
          <button type="button" className="secondary-button" onClick={locate} disabled={locating}><LocateFixed size={17} />{locating ? 'Finding your location…' : 'Use my current location'}</button>
          <PlaceSearch label="Report location" placeholder="Search a road, area or landmark" value={point?.name ? point : null} city={locationArea} bias={point} apiKey={apiKey} onSelect={selectPlace} onDirty={() => { locationRequest.current++; setPoint(null); setAddress(''); setRoadName(''); setResolving(false); setLocating(false) }} />
          <div className="report-location-card"><MapPin size={22} /><div><strong>{point ? CITIES[locationArea]?.name === 'Other location' ? 'Selected area' : CITIES[locationArea]?.name : 'Choose where you saw the water'}</strong><p>{point ? address || roadName : 'Use your location, search for a place, or tap the map.'}</p></div></div>
          <button type="button" className="text-button" onClick={() => setMapPicker(value => !value)}><MapPin size={17} />{mapPicker ? 'Hide location map' : 'Choose or adjust on map'}</button>
          {mapPicker && <div className="report-map-picker"><InteractiveMap selectedCity={locationArea} googleApiKey={apiKey} theme={theme} incidents={[]} activeRoute={null} origin={null} destination={point} focusPoint={point}
            pickingMode="REPORT" onMapClick={selectMapPoint} /><span className="picker-caption">Tap the road where you saw waterlogging</span></div>}
          {point && <label>Road or landmark name<input required maxLength={160} value={roadName} onChange={event => setRoadName(event.target.value)} placeholder="Add a recognizable road or landmark" /></label>}
          <p className="help-text" role="status">{resolving ? 'Finding the address…' : locationHint || 'No coordinates needed. Check the selected place and map pin.'}</p>
        </div>}
        {step === 2 && <div className="form-stack">
          <fieldset><legend>What did you observe?</legend><div className="level-grid">{LEVELS.map(([id, label, description]) => <label key={id} className={`level-choice ${level === id ? 'selected' : ''}`}>
            <input type="radio" name="waterLevel" value={id} checked={level === id} onChange={() => setLevel(id)} /><strong>{label}</strong><span>{description}</span></label>)}</div></fieldset>
          <p className="help-text">Choose what you saw from a secure location. These are approximate observations, not measured depths.</p>
          <label className="photo-upload"><Camera size={20} /><span>{preparing ? 'Preparing photo…' : photo ? 'Replace photo' : 'Add a recent photo (optional)'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={selectPhoto} disabled={preparing} /></label>
          {photo && <><PhotoDepthTool key={photo.preview} src={photo.preview} onEstimate={setPhotoReference} />{photoReference && <p className="success-message" role="status">Photo reference estimate attached. It will be checked when you submit.</p>}<label className="check-label"><input type="checkbox" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)} />This is my recent photo, and I agree to share it with report viewers.</label></>}
          <label>Anything else? <span className="muted">Optional</span><textarea maxLength={600} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Which direction or part of the road is affected?" /></label>
        </div>}
        {step === 3 && <div className="form-stack"><div className="report-summary"><span className="eyebrow">YOUR OBSERVATION</span><h3>{roadName}</h3>
          <p>{LEVELS.find(l => l[0] === level)?.[1]} · {photo ? 'Photo attached' : 'No photo attached'}</p><p className="muted">{address || CITIES[locationArea]?.name}</p>{photoReference && <p>Photo reference estimate: ~{photoDepth(photoReference)} cm · approximate</p>}</div>
          <div className="info-box">Your report will be marked <strong>Needs review</strong>, not automatically verified. Public reports expire from active routing after four hours.</div>
          <p className="help-text">The selected place and photo are shared with commuters. Original photo metadata is removed before upload.</p></div>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <footer className="form-footer">{step > 1 && <button type="button" className="secondary-button" disabled={busy} onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 ? <button type="button" className="primary-button" disabled={preparing || locating || resolving || (step === 1 && (!point || !roadName.trim())) || (step === 2 && (!level || (photo && !photoConsent)))} onClick={() => { setError(''); setStep(step + 1) }}>Continue<ArrowRight size={16} /></button>
            : <button key="submit" type="submit" className="primary-button" disabled={busy || demo}>{busy ? 'Saving observation…' : 'Submit observation'}</button>}</footer>
        {demo && <p className="help-text">You are testing dummy waterlogging. Switch to Live reports to submit.</p>}
      </form>}
  </Dialog>
}

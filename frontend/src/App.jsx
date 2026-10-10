import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPinned, Menu, Navigation, Droplets, ShieldCheck, Settings2, FlaskConical, X, Info, RefreshCw, Sun, Moon, Car } from 'lucide-react'
import InteractiveMap from './components/InteractiveMap'
import JourneyPanel from './components/JourneyPanel'
import ReportComposer from './components/ReportComposer'
import ReportEvidence from './components/ReportEvidence'
import RouteAudio from './components/RouteAudio'
import Dialog from './components/Dialog'
import { CITIES, defaultJourney, cityForPoint } from './utils/cities'
import { currentPosition, describePoint } from './utils/places'
import { sampleReports } from './utils/testScenarios'
import { resolveJourney } from './utils/journeyRouting'
import CityPicker from './components/CityPicker'
import MapControls from './components/MapControls'
import PlaceSearch from './components/PlaceSearch'
import { isActiveIncident } from './utils/floodRouting'
import { apiRequest } from './utils/incidentsApi'
import './jalmarg.css'
import './maps-ui.css'

export default function App({ session, profile, navigate }) {
  function report() { if (!session) { navigate("signin"); return }; setModal("report") }
  const [city, setCity] = useState('GWL')
  const [vehicle, setVehicle] = useState('BIKE')
  const [origin, setOrigin] = useState(defaultJourney('GWL').origin)
  const [destination, setDestination] = useState(defaultJourney('GWL').destination)
  const [incidents, setIncidents] = useState([])
  const [connection, setConnection] = useState('CONNECTING')
  const [backend, setBackend] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [route, setRoute] = useState({ status: 'LOADING', candidates: [], selected: null })
  const [routeRetry, setRouteRetry] = useState(0)
  const [modal, setModal] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState('')
  const [pickingMode, setPickingMode] = useState(null)
  const [googleKey, setGoogleKey] = useState(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('jalmarg_gmaps_api_key') || '')
  const [keyDraft, setKeyDraft] = useState(googleKey)
  const [demo, setDemo] = useState(false)
  const [testScenario, setTestScenario] = useState('flooded')
  const [testIncidents, setTestIncidents] = useState([])
  const [panelOpen, setPanelOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => { if (menuOpen) menuRef.current?.showModal() }, [menuOpen])
  const [layersOpen, setLayersOpen] = useState(false)
  const [showReports, setShowReports] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('jalmarg_theme') || 'system')
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  const [layers, setLayers] = useState({ traffic: false, transit: false, terrain: false, satellite: false, labels: true })
  const effectiveTheme = theme === 'system' ? systemDark ? 'dark' : 'light' : theme
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const change = event => setSystemDark(event.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme
    localStorage.setItem('jalmarg_theme', theme)
  }, [theme, effectiveTheme])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])


  useEffect(() => {
    if (demo) return
    const controller = new AbortController()
    let active = true
    let timer
    async function poll() {
      try {
        const [health, result] = await Promise.all([
          apiRequest('/health', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) }),
          apiRequest(`/incidents?city=${city}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
        ])
        if (!active) return
        setBackend(health); setConnection('ONLINE'); setLastSync(Date.now())
        setIncidents(previous => JSON.stringify(previous) === JSON.stringify(result.incidents) ? previous : result.incidents)
      } catch {
        if (active) setConnection('OFFLINE')
      } finally {
        if (active) timer = setTimeout(poll, 5000)
      }
    }
    poll()
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [city, demo])

  const visibleIncidents = demo ? testIncidents : incidents
  const activeIds = visibleIncidents.filter(i => isActiveIncident(i, now)).map(i => i.id).join(',')
  const activeIncidents = useMemo(() => {
    const ids = new Set(activeIds.split(','))
    return visibleIncidents.filter(i => ids.has(i.id))
  }, [visibleIncidents, activeIds])
  // Include only routing-relevant fields so polling and time ticks don't refetch geometry.
  const incidentSignature = JSON.stringify((demo ? [] : activeIncidents).map(i => [i.id, i.lat, i.lng, i.depthCm, i.status, i.expiresAt]))

  useEffect(() => {
    const controller = new AbortController()
    if (!demo && connection !== 'ONLINE') {
      setRoute({ status: 'UNAVAILABLE', candidates: [], selected: null,
        error: connection === 'CONNECTING' ? 'Connecting to the shared report service…' : 'The report service is offline. Current road observations cannot be checked.' })
      return () => controller.abort()
    }
    if (!origin || !destination) { setRoute({ status: 'UNAVAILABLE', candidates: [], selected: null, error: 'Choose a starting point and destination.' }); return () => controller.abort() }
    setRoute({ status: 'LOADING', candidates: [], selected: null })
    const currentReports = JSON.parse(incidentSignature).map(([id, lat, lng, depthCm, status, expiresAt]) => {
      const original = incidents.find(i => i.id === id)
      return { ...original, id, lat, lng, depthCm, status, expiresAt }
    })
    async function resolve() {
      try {
        let result
        if (demo) {
          const baseline = await resolveJourney(origin, destination, [], vehicle, controller.signal, googleKey)
          const dummy = sampleReports(testScenario, baseline.candidates, city)
          if (controller.signal.aborted) return
          setTestIncidents(dummy)
          result = testScenario === 'clear' || testScenario === 'cleared' ? baseline : await resolveJourney(origin, destination, dummy, vehicle, controller.signal, googleKey)
        } else result = await resolveJourney(origin, destination, currentReports, vehicle, controller.signal, googleKey)
        if (!controller.signal.aborted) {
          const fastest = [...result.candidates].sort((a, b) => a.durationMins - b.durationMins)[0]
          setRoute({ ...result, fastest })
        }
      } catch (err) {
        if (!controller.signal.aborted) setRoute({ status: 'UNAVAILABLE', candidates: [], selected: null, error: err.message })
      }
    }
    resolve()
    return () => controller.abort()
    // Reports are represented by incidentSignature; geometry is fetched only when
    // endpoints, vehicle, connectivity, or active observations actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, city, vehicle, incidentSignature, connection, demo, routeRetry, testScenario, googleKey])

  function changeCity(value) {
    const journey = defaultJourney(value)
    setCity(value); setOrigin(journey.origin); setDestination(journey.destination)
    setIncidents([]); setTestIncidents([]); setConnection('CONNECTING'); setSelectedId(null); setPickingMode(null); setUserLocation(null)
  }
  function toggleDemo(value) {
    setDemo(value); setSelectedId(null); setTestIncidents([]); setPickingMode(null); setPanelOpen(true)
    if (!value) setConnection('CONNECTING')
  }
  function applyLocated(place, changeOrigin = true) {
    const localCity = cityForPoint(place)
    if (localCity !== city) {
      setCity(localCity); setIncidents([]); setConnection('CONNECTING')
      setDestination(defaultJourney(localCity).destination)
    }
    setUserLocation(place)
    if (changeOrigin) setOrigin({ ...place, name: 'Your current location', address: place.address || place.name })
  }
  async function locate() {
    if (demo) { setNotice('Switch to live reports to use your current location.'); return }
    setLocating(true)
    try {
      const gps = await currentPosition()
      const place = await describePoint(gps, googleKey)
      applyLocated(place)
      setNotice(`Location set in ${CITIES[cityForPoint(place)].name}. Choose your destination.`)
    } catch (err) { setNotice(err.message) }
    finally { setLocating(false) }
  }
  const handleMapClick = useCallback(async point => {
    const mode = pickingMode
    setPickingMode(null)
    const localCity = cityForPoint(point)
    if (mode === 'ORIGIN' && localCity !== city) { setCity(localCity); setIncidents([]); setConnection('CONNECTING'); setDestination(defaultJourney(localCity).destination) }
    const selected = { ...point, city: localCity, name: mode === 'ORIGIN' ? 'Selected starting point' : 'Selected destination' }
    if (mode === 'ORIGIN') setOrigin(selected)
    if (mode === 'DESTINATION') setDestination(selected)
    setPanelOpen(true)
    // Keep selection immediately usable; address lookup is optional.
  }, [pickingMode, city])
  function selectOrigin(point) {
    if (!point) { setOrigin(null); return }
    const localCity = cityForPoint(point)
    if (localCity !== city) { setCity(localCity); setIncidents([]); setConnection('CONNECTING'); setDestination(defaultJourney(localCity).destination) }
    setOrigin(point)
  }
  const viewIncident = useCallback(incident => setSelectedId(incident.id), [])
  function updateIncident(item) {
    setIncidents(previous => [item, ...previous.filter(i => i.id !== item.id)])
  }
  const selectedIncident = visibleIncidents.find(i => i.id === selectedId)
  const mapRoute = useMemo(() => ({ ...route, directPath: route.selected?.path || route.candidates?.[0]?.path || [],
    detourPath: route.selected?.path || [], isDetourRequired: false, avoidedHazardPath: [] }), [route])

  return <main className={`jalmarg-app maps-app ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
    <nav className="map-rail" aria-label="Main navigation"><a className="maps-brand" href="#/" aria-label="JalMarg home"><MapPinned size={29} /><strong>JalMarg</strong></a>
      <button aria-label="Open main menu" onClick={() => setMenuOpen(true)}><Menu size={23} /><span>Menu</span></button>
      <button className={panelOpen ? 'active' : ''} aria-pressed={panelOpen} onClick={() => setPanelOpen(value => !value)}><Navigation size={23} /><span>Directions</span></button>
      <button aria-pressed={demo} className={demo ? 'active' : ''} onClick={() => toggleDemo(!demo)}><FlaskConical size={23} /><span>Test routes</span></button>
      <button onClick={() => navigate(profile?.role === "MUNICIPAL" ? "municipal" : session ? "account" : "signin")}><ShieldCheck size={23} /><span>{profile?.role === "MUNICIPAL" ? "Municipal" : "Account"}</span></button>
      <div className="rail-bottom"><button aria-label={effectiveTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}>{effectiveTheme === 'light' ? <Moon size={23} /> : <Sun size={23} />}<span>Theme</span></button>
        <button aria-label="Map and connection settings" onClick={() => { setKeyDraft(googleKey); setModal('settings') }}><Settings2 size={22} /><span>Settings</span></button></div>
    </nav>
    <div className="workspace">
      <section className="map-workspace" aria-label="Journey map"><InteractiveMap selectedCity={city} incidents={showReports ? activeIncidents : []} activeRoute={mapRoute}
        origin={origin} destination={destination} vehicle={vehicle} userLocation={userLocation} pickingMode={pickingMode} onMapClick={handleMapClick}
        onSelectIncident={viewIncident} googleApiKey={googleKey} theme={effectiveTheme} layers={layers} panelOpen={panelOpen} />
        <div className="map-topbar"><button className="mobile-menu icon-button" aria-label="Open main menu" onClick={() => setMenuOpen(true)}><Menu size={23} /></button>
          {!panelOpen && <div className="map-explore-search"><MapPinned size={24} /><PlaceSearch label="Search places" placeholder="Search JalMarg" city={city} bias={userLocation || origin} apiKey={googleKey} onSelect={point => { setDestination(point); if (!origin || cityForPoint(point) !== city) selectOrigin(defaultJourney(cityForPoint(point)).origin || point); setDestination(point); setPanelOpen(true) }} />
            <button className="icon-button" aria-label="Open directions" onClick={() => setPanelOpen(true)}><Navigation size={23} /></button></div>}
          <div className="map-chips"><button aria-pressed={showReports} className={showReports ? 'selected' : ''} onClick={() => setShowReports(value => !value)}><Droplets size={17} />Waterlogging</button>
            <button aria-pressed={layers.traffic} disabled={!googleKey} onClick={() => setLayers(previous => ({ ...previous, traffic: !previous.traffic }))}><Car size={17} />Traffic</button>
            <button aria-pressed={demo} className={demo ? 'test-active' : ''} onClick={() => toggleDemo(!demo)}><FlaskConical size={17} />{demo ? 'Exit test lab' : 'Test routes'}</button></div>
          <CityPicker value={city} onChange={changeCity} /></div>
        <div className={`connection-pill ${demo ? 'recorded' : connection.toLowerCase()}`} role="status"><span />{demo ? 'TEST MODE: dummy waterlogging, real streets' : connection === 'ONLINE' ? `Live reports connected${backend?.mode === 'aws' ? ' to AWS' : ''}` : connection === 'CONNECTING' ? 'Connecting to reports…' : 'Report service offline'}
          <button aria-label="About the report service" onClick={() => setModal('about')}><Info size={15} /></button></div>
        {pickingMode && <div className="map-pick-prompt" role="status">Tap the road to choose your {pickingMode === 'ORIGIN' ? 'starting point' : 'destination'}<button className="icon-button" aria-label="Cancel map picking" onClick={() => setPickingMode(null)}><X size={19} /></button></div>}
        <MapControls open={layersOpen} onOpen={setLayersOpen} theme={theme} onTheme={setTheme} layers={layers} onLayers={setLayers} google={Boolean(googleKey)} onLocate={locate} locating={locating} />
        {route.status === 'UNAVAILABLE' && connection === 'ONLINE' && origin && destination && <button className="retry-routing secondary-button" onClick={() => setRouteRetry(v => v + 1)}><RefreshCw size={16} />Retry routing</button>}
      </section>
      {panelOpen && <JourneyPanel city={city} origin={origin} destination={destination} onOrigin={selectOrigin} onDestination={setDestination}
        onSwap={() => { setOrigin(destination); setDestination(origin) }} onPick={mode => { setPickingMode(mode); if (innerWidth < 768) setPanelOpen(false) }}
        vehicle={vehicle} onVehicle={setVehicle} route={route} locating={locating} onLocate={locate} incidents={activeIncidents}
        onReport={report} onViewEvidence={viewIncident} onAudio={() => setModal('audio')} demo={demo} now={now}
        apiKey={googleKey} scenario={testScenario} onScenario={setTestScenario} onClose={() => setPanelOpen(false)} />}
      {!panelOpen && <md-filled-button className="floating-report" onClick={report}><Droplets slot="icon" size={18} />Report waterlogging</md-filled-button>}
    </div>
    {menuOpen && <dialog ref={menuRef} className="menu-backdrop" aria-label="Navigation menu" onCancel={() => setMenuOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMenuOpen(false) }}><aside className="maps-menu" aria-label="Main menu" onClick={event => event.stopPropagation()}><header><a className="menu-brand" href="/"><MapPinned size={28} />JalMarg</a><button className="icon-button" aria-label="Close main menu" onClick={() => setMenuOpen(false)}><X size={23} /></button></header>
      <p>Waterlogging-aware journeys</p><button onClick={() => { setPanelOpen(value => !value); setMenuOpen(false) }}><Navigation size={20} />{panelOpen ? 'Hide directions' : 'Show directions'}</button>
      <button onClick={() => { toggleDemo(!demo); setMenuOpen(false) }}><FlaskConical size={20} />{demo ? 'Return to live reports' : 'Try dummy route scenarios'}</button>
      <button onClick={() => { navigate(profile?.role === 'MUNICIPAL' ? 'municipal' : session ? 'account' : 'signin'); setMenuOpen(false) }}><ShieldCheck size={20} />Account and municipal workspace</button>
      <button onClick={() => { setLayersOpen(true); setMenuOpen(false) }}><Sun size={20} />Layers and appearance</button>
      <button onClick={() => { setKeyDraft(googleKey); setModal('settings'); setMenuOpen(false) }}><Settings2 size={20} />Connection settings</button>
      <button onClick={() => { setModal('about'); setMenuOpen(false) }}><Info size={20} />About JalMarg</button></aside></dialog>}
    {notice && <div className="app-notice" role="status"><span>{notice}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={17} /></button></div>}
    {modal === 'report' && <ReportComposer session={session} city={city} userLocation={userLocation} demo={demo} apiKey={googleKey} theme={effectiveTheme} onLocated={applyLocated} onClose={() => setModal(null)} onSaved={item => { if (item.city !== city) { setCity(item.city); setIncidents([]); setConnection('CONNECTING') }; updateIncident(item) }} />}
    {selectedIncident && <ReportEvidence session={session} incident={selectedIncident} demo={demo} onClose={() => setSelectedId(null)} onChanged={updateIncident} vehicle={vehicle} />}
    {modal === 'audio' && <RouteAudio route={route} vehicle={vehicle} origin={origin} destination={destination} demo={demo} onClose={() => setModal(null)} />}
    {modal === 'settings' && <Dialog title="Map settings" subtitle="The map provider does not change the report data source." onClose={() => setModal(null)}>
      <form onSubmit={event => { event.preventDefault(); setGoogleKey(keyDraft.trim()); localStorage.setItem('jalmarg_gmaps_api_key', keyDraft.trim()); setModal(null) }}>
        <label>Google Maps browser API key <span className="muted">Optional</span><input value={keyDraft} onChange={e => setKeyDraft(e.target.value)} autoComplete="off" placeholder="Leave empty to use the default map" /></label>
        <p className="help-text">Use a key restricted to this website and the Maps JavaScript API. Changing an already-loaded Google key requires a page reload.</p><button className="primary-button">Save map settings</button></form>
    </Dialog>}
    {modal === 'about' && <Dialog title="Behind the reports" subtitle="What this session is actually connected to." onClose={() => setModal(null)}>
      <dl className="system-facts"><div><dt>Data mode</dt><dd>{demo ? 'Dummy reports on real street routes' : 'Shared live observations'}</dd></div><div><dt>Backend</dt><dd>{backend?.storage || 'No backend connection established'}</dd></div><div><dt>Last successful sync</dt><dd>{lastSync ? `${Math.floor((now - lastSync) / 1000)} seconds ago` : 'Not yet connected'}</dd></div><div><dt>Update interval</dt><dd>5 seconds after each completed request</dd></div><div><dt>Verification</dt><dd>Authenticated operator review; citizen levels are approximate</dd></div></dl>
      <p className="info-box">This prototype does not measure depth from image pixels, predict floods, or dispatch municipal equipment. The route engine compares street geometry with reported observations.</p>
    </Dialog>}
  </main>
}

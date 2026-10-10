import { useEffect, useRef } from 'react'
import { Layers, X, Car, TrainFront, Mountain, Map, Satellite, LocateFixed, Sun, Moon, Monitor } from 'lucide-react'
import '@material/web/button/filled-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/switch/switch.js'

export default function MapControls({ open, onOpen, theme, onTheme, layers, onLayers, google, onLocate, locating }) {
  const root = useRef(null)
  useEffect(() => {
    if (!open) return
    function close(event) { if (!root.current?.contains(event.target)) onOpen(false) }
    const escape = event => { if (event.key === 'Escape') { event.stopPropagation(); onOpen(false) } }
    document.addEventListener('pointerdown', close, true); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', close, true); document.removeEventListener('keydown', escape) }
  }, [open, onOpen])
  return <>
    <div className={`map-layer-control ${open ? 'is-open' : ''}`} ref={root}>
      {open && <section className="layers-popover" aria-label="Map details"><header><h2>Map details</h2><button className="icon-button" aria-label="Close map details" onClick={() => onOpen(false)}><X size={20} /></button></header>
        <div className="layer-options">{[['traffic', Car, 'Traffic'], ['transit', TrainFront, 'Transit'], ['terrain', Mountain, 'Terrain']].map(([id, Icon, label]) => <button key={id} aria-pressed={Boolean(layers[id])} disabled={!google} onClick={() => onLayers({ ...layers, [id]: !layers[id], ...(id === 'terrain' ? { satellite: false } : {}) })}>
          <span className={`layer-preview ${id}`}><Icon size={27} /></span>{label}</button>)}</div>
        {!google && <p className="help-text">Traffic, transit and satellite require Google Maps. Standard map and themes are available here.</p>}
        <h3>Map type</h3><div className="map-type-options"><button aria-pressed={!layers.satellite} onClick={() => onLayers({ ...layers, satellite: false, terrain: false })}><span className="layer-preview standard"><Map size={28} /></span>Default</button>
          <button aria-pressed={layers.satellite} disabled={!google} onClick={() => onLayers({ ...layers, satellite: true, terrain: false })}><span className="layer-preview satellite"><Satellite size={28} /></span>Satellite</button></div>
        <label className="layer-switch"><span>Satellite labels</span><md-switch aria-label="Satellite labels" selected={layers.labels} disabled={!google || !layers.satellite} onChange={event => onLayers({ ...layers, labels: event.target.selected })} /></label>
        <h3>Appearance</h3><div className="theme-options">{[['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']].map(([id, Icon, label]) => <button key={id} aria-pressed={theme === id} onClick={() => onTheme(id)}><Icon size={18} />{label}</button>)}</div>
        {layers.traffic && google && <p className="traffic-key"><i />Fast<span /><i />Slow <small>Google traffic layer; route ETA is an OSRM estimate.</small></p>}
      </section>}
      <button className={`layers-trigger ${open ? 'active' : ''}`} aria-label="Layers and appearance" aria-expanded={open} onClick={() => onOpen(!open)}><span><Layers size={25} /></span>Layers</button>
    </div>
    <button className="map-recenter" aria-label="Recenter on my location" onClick={onLocate} disabled={locating}><LocateFixed size={23} /></button>
  </>
}

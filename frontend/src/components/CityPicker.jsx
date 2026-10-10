import { useEffect, useRef, useState } from 'react'
import { MapPin, ChevronDown, Search, Check, X } from 'lucide-react'
import { CITIES } from '../utils/cities'
export default function CityPicker({ value, onChange }) {
  const [open,setOpen] = useState(false), [query,setQuery] = useState('')
  const root = useRef(null), trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown',outside,true)
    return () => document.removeEventListener('pointerdown',outside,true)
  },[open])
  const entries = Object.entries(CITIES).filter(([,city]) => city.name.toLowerCase().includes(query.toLowerCase()))
  function close() { setOpen(false); trigger.current?.focus() }
  function keys(event) {
    if (event.key === 'Escape') { event.stopPropagation(); close() }
    if (!open && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); setQuery(''); return }
    if (event.target.tagName === 'INPUT' && ['Home','End'].includes(event.key)) return
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault(); const options = [...root.current.querySelectorAll('[role=option]')]; const index = options.indexOf(document.activeElement)
      options[event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus()
    }
  }
  return <div className="city-picker" ref={root} onKeyDown={keys}><button ref={trigger} className="city-trigger" aria-label={`Choose area: ${CITIES[value].name}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen(!open); setQuery('') }}><MapPin size={17} /><span>{CITIES[value].name}</span><ChevronDown size={16} /></button>
    {open && <section className="city-popover" aria-label="Choose map area"><header><div><strong>Explore an area</strong><p>Your GPS location updates this automatically.</p></div><button className="icon-button" aria-label="Close area picker" onClick={close}><X size={18} /></button></header><label className="city-search"><Search size={17} /><input autoFocus aria-label="Find a city" placeholder="Find a city" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div role="listbox" aria-label="Map areas">{entries.map(([id,city]) => <button key={id} role="option" aria-selected={id===value} onClick={() => { onChange(id); close() }}><span className="city-symbol"><MapPin size={19} /></span><span><strong>{city.name}</strong><small>{id==='OTHER' ? 'Search anywhere or choose on the map' : 'Local reports and nearby landmarks'}</small></span>{id===value && <Check size={18} />}</button>)}{!entries.length && <p>No matching city. Choose Other location to search anywhere.</p>}</div></section>}
  </div>
}

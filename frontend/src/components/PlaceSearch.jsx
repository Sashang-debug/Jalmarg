import { useId, useRef, useState, useEffect } from 'react'
import { Search, MapPin, X, CornerDownLeft } from 'lucide-react'
import { CITIES, matchesPlace, nearbyLandmarks } from '../utils/cities'
import { searchPlaces } from '../utils/places'

export default function PlaceSearch({ label, value, city, bias, apiKey, onSelect, onDirty, placeholder = 'Search for a place', compact = false }) {
  const [query, setQuery] = useState(value?.name || '')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [highlight, setHighlight] = useState(-1)
  const root = useRef(null), sequence = useRef(0)
  const id = useId()
  const selectedName = value?.name || ''
  useEffect(() => { if (selectedName) setQuery(selectedName); setResults(null) }, [selectedName])
  useEffect(() => {
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside, true)
    return () => { sequence.current++; document.removeEventListener('pointerdown', outside, true) }
  }, [])
  const local = nearbyLandmarks(bias, city).filter(place => !query || matchesPlace(place.name, query) || query === selectedName)
  const suggestions = results || local.slice(0, 6)
  async function search() {
    if (!query.trim()) { setResults(null); return }
    if (local.length) { setResults(local); setOpen(true); setHighlight(-1); setError(''); return }
    const request = ++sequence.current
    setBusy(true); setError(''); setOpen(true)
    try {
      const found = await searchPlaces(query, apiKey, bias || { lat: CITIES[city].center[0], lng: CITIES[city].center[1] })
      if (request === sequence.current) { setResults(found); setHighlight(-1); if (!found.length) setError('No places found. Try a nearby road name or choose on the map.') }
    } catch (err) { if (request === sequence.current) setError(err.message) }
    finally { if (request === sequence.current) setBusy(false) }
  }
  function select(place) { sequence.current++; setQuery(place.name); setOpen(false); setResults(null); setBusy(false); onSelect(place) }
  return <div className={`place-search ${compact ? 'compact' : ''}`} ref={root}>
    <label htmlFor={id} className="sr-only">{label}</label>
    <div className="place-input-row"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-results`}
      aria-activedescendant={highlight >= 0 && open ? `${id}-option-${highlight}` : undefined}
      autoComplete="off" placeholder={placeholder} value={query} onFocus={() => setOpen(true)}
      onChange={event => { sequence.current++; setBusy(false); setQuery(event.target.value); setResults(null); setError(''); setOpen(true); setHighlight(-1); onDirty?.() }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) }
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setHighlight(index => Math.min(index + 1, suggestions.length - 1)) }
        if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight(index => Math.max(0, index - 1)) }
        if (event.key === 'Enter') { event.preventDefault(); if (open && highlight >= 0 && suggestions[highlight]) select(suggestions[highlight]); else search() }
      }} />
      {query && <button type="button" className="icon-button clear-place" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { sequence.current++; setBusy(false); setQuery(''); setResults(null); setOpen(true); onDirty?.() }}><X size={15} /></button>}
      <button type="button" className="icon-button search-place" aria-label={`Search ${label.toLowerCase()}`} onClick={search} disabled={busy}><Search size={19} /></button></div>
    {open && <div className="place-results" id={`${id}-results`} role="listbox" aria-label={`${label} suggestions`}>
      <div className="search-hint">{busy ? 'Searching places…' : results ? 'Search results' : 'Nearby places'}<button type="button" aria-label={`Close ${label.toLowerCase()} suggestions`} className="icon-button" onClick={() => setOpen(false)}><X size={14} /></button></div>
      {!busy && suggestions.map((place, index) => <button type="button" role="option" aria-selected={highlight === index} id={`${id}-option-${index}`} key={`${place.lat}-${place.lng}-${place.name}`}
        onClick={() => select(place)} onMouseEnter={() => setHighlight(index)}><MapPin size={19} /><span><strong>{place.name}</strong><small>{place.address || 'Suggested landmark. Check the pin on the map.'}</small></span></button>)}
      {error && <p className="search-error" role="status">{error}</p>}
      {!results && !busy && <button type="button" className="search-world" onClick={search}><Search size={16} /><span>Search for “{query || 'a place'}”</span><CornerDownLeft size={14} /></button>}
      {results?.[0]?.provider && <p className="search-attribution">Results from {results[0].provider}</p>}
    </div>}
  </div>
}

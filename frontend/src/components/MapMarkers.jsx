import destinationIcon from '../assets/markers/destination.svg?raw'
import sourceIcon from '../assets/markers/source.svg?raw'
import hazardIcon from '../assets/markers/hazard.svg?raw'
import waterIcon from '../assets/markers/water.svg?raw'

// Only library-authored icon markup is inserted; all user content uses textContent.
export function markerContent({ kind, name, level, critical, label }) {
  const root = document.createElement(kind === 'hazard' ? 'button' : 'div')
  root.className = `map-marker ${kind} ${critical ? 'critical' : ''}`
  const glyph = document.createElement('span')
  glyph.className = 'marker-glyph'
  glyph.innerHTML = kind === 'hazard' ? hazardIcon : kind === 'destination' ? destinationIcon : sourceIcon
  root.appendChild(glyph)
  if (kind !== 'gps') {
    const caption = document.createElement('span'); caption.className = 'marker-caption'
    const title = document.createElement('strong'); title.textContent = kind === 'hazard' ? level || 'Waterlogging' : kind === 'destination' ? label || 'Destination' : 'Starting point'
    const detail = document.createElement('small'); detail.textContent = name
    caption.append(title, detail); root.appendChild(caption)
    if (kind === 'hazard') {
      const drop = document.createElement('span'); drop.className = 'marker-water'
      drop.innerHTML = waterIcon
      glyph.appendChild(drop)
    }
  }
  root.title = `${kind === 'hazard' ? 'Waterlogging report' : kind === 'gps' ? 'Your location' : kind === 'destination' ? label || 'Destination' : 'Starting point'}: ${name || ''}`
  root.setAttribute('aria-label', root.title)
  return root
}

import { useState } from 'react'
import { RotateCcw, Ruler } from 'lucide-react'
import { photoDepth } from '../utils/vehicleAssessment'
const STEPS = ['Top of the known reference', 'Base at road level', 'Waterline on that same reference']
export default function PhotoDepthTool({ src, onEstimate }) {
  const [marks, setMarks] = useState([])
  const [height, setHeight] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const reference = { topY: marks[0], baseY: marks[1], waterY: marks[2], referenceHeightCm: Number(height), confirmed }
  const estimate = photoDepth(reference)
  function reset() { setMarks([]); setConfirmed(false); onEstimate(null) }
  function mark(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    setMarks(previous => [...previous.slice(0, 2), y].slice(0, 3)); onEstimate(null)
  }
  return <section className="photo-depth-tool"><header><Ruler size={18} /><h3>Estimate depth from this photo</h3><button type="button" className="icon-button" aria-label="Reset photo reference" onClick={reset}><RotateCcw size={17} /></button></header>
    <p>Use a vertical object of known height at the waterline. Mark its top, road-level base and waterline. Do not guess hidden reference points.</p>
    <div className="photo-reference-image" onClick={mark} role="img" aria-label="Photo for reference measurement. Use the sliders below as a keyboard alternative."><img src={src} alt="Uploaded flood photo for reference measurement" />{marks.map((y,index) => <span key={index} style={{top:`${y*100}%`}}>{index+1} · {['Top','Base','Water'][index]}</span>)}</div>
    <p className="reference-instruction">{marks.length < 3 ? `Tap: ${STEPS[marks.length]}` : 'Check all three lines. Adjust with the sliders if needed.'}</p>
    <div className="reference-sliders">{STEPS.map((label,index) => <label key={label}>{index+1}. {label}<input type="range" min="0" max="1000" value={Math.round((marks[index] ?? 0)*1000)} onChange={event => { setMarks(previous => { const copy = [...previous]; for (let i=0;i<=index;i++) if (copy[i] === undefined) copy[i] = 0; copy[index] = Number(event.target.value)/1000; return copy }); onEstimate(null) }} /></label>)}</div>
    <label>Known reference height (cm)<input type="number" inputMode="decimal" min="1" max="300" value={height} onChange={event => { setHeight(event.target.value); onEstimate(null) }} placeholder="Enter its actual height" /></label>
    <label className="check-label"><input type="checkbox" checked={confirmed} onChange={event => { setConfirmed(event.target.checked); onEstimate(null) }} />I know the reference height and can identify its road-level base.</label>
    <button type="button" className="secondary-button" disabled={estimate === null} onClick={() => onEstimate(reference)}>Use approximate photo estimate{estimate !== null ? `: ${estimate} cm` : ''}</button>
    <p className="help-text">Reference-based estimate, not automatic AI or a measured depth. Perspective, a hidden base or an incorrect height can change the result. You can submit without an estimate.</p>
  </section>
}

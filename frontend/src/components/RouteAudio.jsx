import { useEffect, useState } from 'react'
import { Play, Square, Volume2 } from 'lucide-react'
import Dialog from './Dialog'
import { routeAdvisory } from '../utils/routeAdvisory'

export default function RouteAudio({ route, vehicle, origin, destination, demo, onClose }) {
  const [language, setLanguage] = useState('en-IN')
  const [playingScript, setPlayingScript] = useState(null)
  const [error, setError] = useState('')
  const script = routeAdvisory({ route, vehicle, origin, destination, demo }, language)
  const playing = playingScript === script
  useEffect(() => { window.speechSynthesis?.cancel() }, [script])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  function play() {
    setError('')
    if (!window.speechSynthesis) { setError('Speech playback is unavailable in this browser. Read the advisory below.'); return }
    window.speechSynthesis.cancel()
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(language.slice(0, 2)))
    if (!voice) { setError('A voice for this language is unavailable on this device. Read the advisory below.'); return }
    const utterance = new SpeechSynthesisUtterance(script)
    utterance.lang = language; utterance.voice = voice
    utterance.onstart = () => setPlayingScript(script)
    utterance.onend = () => setPlayingScript(null)
    utterance.onerror = () => { setPlayingScript(null); setError('Audio could not play. Please try again.') }
    window.speechSynthesis.speak(utterance)
  }
  return <Dialog title="Listen to the route advisory" subtitle="Device speech · language availability depends on your browser." onClose={onClose}>
    <label>Language<select value={language} onChange={e => { window.speechSynthesis?.cancel(); setPlayingScript(null); setLanguage(e.target.value) }}><option value="en-IN">English</option><option value="hi-IN">हिन्दी</option></select></label>
    <div className={`voice-wave ${playing ? 'playing' : ''}`} aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ '--bar': `${12 + (i % 5) * 7}px`, '--delay': `${i * 0.06}s` }} />)}</div>
    <p className="audio-script">{script}</p>{error && <p className="error-message" role="alert">{error}</p>}
    <button className="primary-button" onClick={playing ? () => { window.speechSynthesis.cancel(); setPlayingScript(null) } : play}>{playing ? <Square size={17} /> : <Play size={17} />}{playing ? 'Stop playback' : 'Play advisory'}<Volume2 size={17} /></button>
  </Dialog>
}

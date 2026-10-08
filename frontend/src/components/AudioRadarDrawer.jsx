import React, { useState } from 'react'
import { Volume2, VolumeX, Play, Pause, Radio, Sparkles, X } from 'lucide-react'

export default function AudioRadarDrawer({ active, onClose, routeData }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedLang, setSelectedLang] = useState('HI') // 'HI' | 'EN'

  const HINDI_SCRIPT = routeData?.speechHindi || "सावधान! 200 मीटर आगे सिल्क बोर्ड पर 48 सेंटीमीटर पानी भरा है। कृपया तुरंत फ्लाईओवर वाला रास्ता लें।"
  const ENGLISH_SCRIPT = routeData?.speechEnglish || "Caution! In 200 meters, Silk Board underpass has 48 centimeters of standing water. Diverting via elevated flyover."

  const handlePlayVoice = (lang) => {
    setSelectedLang(lang)
    const textToSpeak = lang === 'HI' ? HINDI_SCRIPT : ENGLISH_SCRIPT

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = lang === 'HI' ? 'hi-IN' : 'en-IN'
      utterance.rate = 1.05
      utterance.pitch = 1.0

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      window.speechSynthesis.speak(utterance)
    } else {
      // Fallback state toggle
      setIsPlaying(true)
      setTimeout(() => setIsPlaying(false), 4500)
    }
  }

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  if (!active) return null

  return (
    <aside aria-label="Audio Radar" className="glass-panel-elevated" style={{
      position: 'absolute',
      bottom: '24px',
      left: '20px',
      zIndex: 600,
      width: '360px',
      padding: '16px',
      border: '1px solid rgba(6, 182, 212, 0.4)',
      boxShadow: 'var(--shadow-glow-cyan)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} className={isPlaying ? "pulse-radar" : ""}>
            <Radio size={16} color="var(--brand-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Amazon Polly Audio Radar
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--brand-cyan)', fontWeight: 600 }}>
              HANDS-FREE GIG RIDER PROTOCOL
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Visualizer Soundwave Animation */}
      <div style={{
        height: '42px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '0 12px',
        marginBottom: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        {[14, 24, 38, 18, 30, 40, 22, 16, 32, 26, 36, 20].map((h, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: isPlaying ? `${Math.max(8, h * (0.6 + Math.random() * 0.7))}px` : '6px',
              borderRadius: '2px',
              background: isPlaying ? 'var(--brand-cyan)' : 'rgba(255, 255, 255, 0.2)',
              transition: 'height 120ms ease',
              boxShadow: isPlaying ? '0 0 6px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Voice Script & Telemetry Display */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '12px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
        borderLeft: '3px solid var(--brand-cyan)'
      }}>
        {selectedLang === 'HI' ? HINDI_SCRIPT : ENGLISH_SCRIPT}
      </div>

      {/* Play Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => isPlaying ? handleStop() : handlePlayVoice('HI')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isPlaying && selectedLang === 'HI' ? <Pause size={14} /> : <Play size={14} />}
          <span>Hindi (Aditi)</span>
        </button>

        <button
          onClick={() => isPlaying ? handleStop() : handlePlayVoice('EN')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-strong)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isPlaying && selectedLang === 'EN' ? <Pause size={14} /> : <Play size={14} />}
          <span>English (Kajal)</span>
        </button>
      </div>
    </aside>
  )
}

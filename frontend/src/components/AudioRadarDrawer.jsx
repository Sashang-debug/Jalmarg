import React, { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Play, Pause, Radio, Sparkles, X, ShieldAlert, Waves } from 'lucide-react'

// Web Audio API high-tech Sonar Chime
function playSonarPing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.warn('[AudioRadar] AudioContext autoplay blocked or unsupported', e)
  }
}

export default function AudioRadarDrawer({
  active,
  onClose,
  routeData,
  isSidebarOpen = true,
  selectedCity = 'DEL'
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedLang, setSelectedLang] = useState('HI') // 'HI' | 'EN'
  const animFrameRef = useRef(null)
  const [waveHeights, setWaveHeights] = useState([12, 24, 38, 18, 30, 42, 22, 16, 32, 26, 36, 20])

  const HINDI_SCRIPT = routeData?.speechHindi || (
    routeData?.hazardName
      ? `सावधान! ${routeData.hazardName} पर ${routeData.hazardDepth || 45} सेंटीमीटर जलभराव है। तुरंत सुरक्षित वैकल्पिक मार्ग लें।`
      : "सावधान! आगे जलभराव है। कृपया सुरक्षित फ्लाईओवर वाला रास्ता चुनें।"
  )

  const ENGLISH_SCRIPT = routeData?.speechEnglish || (
    routeData?.hazardName
      ? `Caution! Severe waterlogging of ${routeData.hazardDepth || 45} centimeters detected at ${routeData.hazardName}. Diverting via safe elevated bypass.`
      : "Caution! Road waterlogging ahead. Please follow the safe detour corridor."
  )

  // Animated soundwave bars while audio is playing
  useEffect(() => {
    if (!isPlaying) {
      setWaveHeights([10, 14, 18, 12, 16, 20, 14, 10, 18, 14, 16, 12])
      return
    }

    const interval = setInterval(() => {
      setWaveHeights(prev =>
        prev.map(() => Math.floor(Math.random() * 32) + 10)
      )
    }, 110)

    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayVoice = (lang = selectedLang) => {
    setSelectedLang(lang)
    const textToSpeak = lang === 'HI' ? HINDI_SCRIPT : ENGLISH_SCRIPT

    // Play high-tech radar chime first
    playSonarPing()

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 1.0
      utterance.pitch = 1.05

      // Resolve best matching Hindi / Indian English voices
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        if (lang === 'HI') {
          const hiVoice = voices.find(v => v.lang.startsWith('hi')) ||
                          voices.find(v => v.name.toLowerCase().includes('hindi')) ||
                          voices.find(v => v.name.toLowerCase().includes('aditi')) ||
                          voices.find(v => v.lang.includes('IN'))
          if (hiVoice) utterance.voice = hiVoice
          utterance.lang = hiVoice ? hiVoice.lang : 'hi-IN'
        } else {
          const enVoice = voices.find(v => v.lang === 'en-IN') ||
                          voices.find(v => v.name.toLowerCase().includes('kajal')) ||
                          voices.find(v => v.name.toLowerCase().includes('india')) ||
                          voices.find(v => v.lang.startsWith('en'))
          if (enVoice) utterance.voice = enVoice
          utterance.lang = enVoice ? enVoice.lang : 'en-IN'
        }
      } else {
        utterance.lang = lang === 'HI' ? 'hi-IN' : 'en-IN'
      }

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      // Slight timeout after sonar ping for crisp cinematic sound
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 250)
    } else {
      setIsPlaying(true)
      setTimeout(() => setIsPlaying(false), 5000)
    }
  }

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  // Auto-play announcement whenever Audio Radar is activated
  useEffect(() => {
    if (active) {
      handlePlayVoice('HI')
    } else {
      handleStop()
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [active])

  if (!active) return null

  return (
    <aside
      aria-label="Hands-Free Audio Radar"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: isSidebarOpen ? '424px' : '20px',
        maxWidth: 'calc(100vw - 48px)',
        width: '380px',
        zIndex: 1100,
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8EAED',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.22)',
        padding: '16px',
        fontFamily: 'Roboto, Arial, sans-serif',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isPlaying ? '#E8F0FE' : '#F1F3F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPlaying ? '0 0 10px rgba(26,115,232,0.4)' : 'none',
            transition: 'all 0.2s'
          }}>
            <Radio size={18} color={isPlaying ? '#1A73E8' : '#5F6368'} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#202124' }}>
              Amazon Polly Audio Radar
            </div>
            <div style={{ fontSize: '10px', color: '#1A73E8', fontWeight: 800, letterSpacing: '0.05em' }}>
              HANDS-FREE GIG RIDER PROTOCOL
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close Audio Radar"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5F6368',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Hazard Status Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '8px',
        background: routeData?.isDetourRequired ? '#FEF7E0' : '#E6F4EA',
        border: routeData?.isDetourRequired ? '1px solid #FEEFC3' : '1px solid #CEEAD6',
        fontSize: '11px',
        fontWeight: 700,
        color: routeData?.isDetourRequired ? '#B06000' : '#137333',
        marginBottom: '10px'
      }}>
        <Waves size={14} />
        <span>
          {routeData?.isDetourRequired
            ? `FLOOD ADVISORY ACTIVE: ${routeData?.hazardDepth || 48} CM SUBMERGED`
            : 'NORMAL ROUTE CORRIDOR VERIFIED'}
        </span>
      </div>

      {/* Equalizer Visualizer Soundwave Animation */}
      <div style={{
        height: '42px',
        background: '#0D1117',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        padding: '0 14px',
        marginBottom: '12px',
        border: '1px solid #21262D'
      }}>
        {waveHeights.map((h, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${h}px`,
              borderRadius: '2px',
              background: isPlaying ? '#00E676' : '#4B5563',
              transition: 'height 100ms ease',
              boxShadow: isPlaying ? '0 0 8px rgba(0, 230, 118, 0.6)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Live Speech Script Display */}
      <div style={{
        background: '#F8F9FA',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '14px',
        fontSize: '12px',
        color: '#3C4043',
        lineHeight: 1.5,
        borderLeft: '3px solid #1A73E8',
        fontWeight: 500
      }}>
        {selectedLang === 'HI' ? HINDI_SCRIPT : ENGLISH_SCRIPT}
      </div>

      {/* Voice Controls: Hindi (Aditi) vs English (Kajal) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => isPlaying && selectedLang === 'HI' ? handleStop() : handlePlayVoice('HI')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: selectedLang === 'HI' && isPlaying ? '#137333' : '#1A73E8',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(26,115,232,0.3)',
            transition: 'background 0.15s'
          }}
        >
          {isPlaying && selectedLang === 'HI' ? <Pause size={14} /> : <Play size={14} />}
          <span>Hindi (Aditi)</span>
        </button>

        <button
          onClick={() => isPlaying && selectedLang === 'EN' ? handleStop() : handlePlayVoice('EN')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #DADCE0',
            background: selectedLang === 'EN' && isPlaying ? '#E8F0FE' : '#FFFFFF',
            color: selectedLang === 'EN' && isPlaying ? '#1A73E8' : '#3C4043',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          {isPlaying && selectedLang === 'EN' ? <Pause size={14} /> : <Play size={14} />}
          <span>English (Kajal)</span>
        </button>
      </div>
    </aside>
  )
}

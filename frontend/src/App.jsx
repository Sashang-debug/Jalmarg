import React, { useState } from 'react'
import { 
  Navigation, 
  Bike, 
  Car, 
  Truck, 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  Volume2,
  Droplets,
  Layers,
  Sparkles
} from 'lucide-react'

export default function App() {
  const [vehicle, setVehicle] = useState('bike') // 'bike' | 'car' | 'suv'
  const [audioRadarActive, setAudioRadarActive] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-primary)' }}>
      {/* Top Tactical Navigation Header */}
      <header className="glass-panel" style={{
        margin: '12px 16px 8px 16px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Droplets size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>JalMarg</h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--brand-cyan)', fontWeight: 600 }}>जलमार्ग</span>
              <span style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--brand-cyan)',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>LIVE TELEMETRY</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Autonomous Flood-Depth & Monsoon Navigation Protocol
            </p>
          </div>
        </div>

        {/* Center: Vehicle Clearance Selector */}
        <div className="glass-panel" style={{
          display: 'flex',
          padding: '4px',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.35)'
        }}>
          <button 
            onClick={() => setVehicle('bike')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: vehicle === 'bike' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: vehicle === 'bike' ? 'var(--brand-cyan)' : 'var(--text-muted)',
              borderBottom: vehicle === 'bike' ? '2px solid var(--brand-cyan)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'var(--transition-fast)'
            }}
          >
            <Bike size={16} />
            <span>2-Wheeler</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }} className="tabular-nums">(&lt;25cm)</span>
          </button>

          <button 
            onClick={() => setVehicle('car')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: vehicle === 'car' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: vehicle === 'car' ? 'var(--brand-cyan)' : 'var(--text-muted)',
              borderBottom: vehicle === 'car' ? '2px solid var(--brand-cyan)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'var(--transition-fast)'
            }}
          >
            <Car size={16} />
            <span>Sedan / Hatch</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }} className="tabular-nums">(&lt;35cm)</span>
          </button>

          <button 
            onClick={() => setVehicle('suv')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: vehicle === 'suv' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: vehicle === 'suv' ? 'var(--brand-cyan)' : 'var(--text-muted)',
              borderBottom: vehicle === 'suv' ? '2px solid var(--brand-cyan)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'var(--transition-fast)'
            }}
          >
            <Truck size={16} />
            <span>SUV / Bus</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }} className="tabular-nums">(&lt;60cm)</span>
          </button>
        </div>

        {/* Right: Audio Radar Toggle & City Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setAudioRadarActive(!audioRadarActive)}
            className={audioRadarActive ? "pulse-radar" : ""}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid ' + (audioRadarActive ? 'var(--brand-cyan)' : 'var(--border-subtle)'),
              background: audioRadarActive ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface-subtle)',
              color: audioRadarActive ? 'var(--brand-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            <Volume2 size={16} />
            <span>Audio Radar</span>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: audioRadarActive ? 'var(--status-safe)' : 'var(--text-muted)' 
            }}></span>
          </button>
        </div>
      </header>

      {/* Main Map & Workspace Canvas */}
      <main style={{ flex: 1, position: 'relative', margin: '0 16px 16px 16px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div id="map-placeholder" style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, #0F172A 0%, #080C14 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }} className="pulse-radar">
            <Radio size={32} color="var(--brand-cyan)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            JalMarg Live Spatial Grid Initialized
          </h2>
          <p style={{ maxWidth: '520px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Phase 1 Scaffolding Complete. Ready to mount Leaflet MapLibre vector layers, active flood polygons, and real-time AWS Step Functions telemetry.
          </p>
        </div>
      </main>
    </div>
  )
}

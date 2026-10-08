import React from 'react'
import { 
  Bike, 
  Car, 
  Truck, 
  Volume2, 
  PlusCircle, 
  Droplets,
  Layers,
  MapPin,
  Building2,
  Navigation,
  Loader2
} from 'lucide-react'

export default function TacticalHeader({
  vehicle,
  setVehicle,
  audioRadarActive,
  setAudioRadarActive,
  showPotholes,
  setShowPotholes,
  onOpenReportModal,
  onOpenCivicDashboard,
  activePumpTicketsCount,
  selectedCity,
  setSelectedCity,
  onAutoDetectLocation,
  isLocating
}) {
  return (
    <header className="glass-panel" style={{
      margin: '12px 16px 8px 16px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 1000,
      flexWrap: 'wrap'
    }}>
      {/* 1. Brand & City Selector + Auto-Detect GPS Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-cyan)'
        }}>
          <Droplets size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              JalMarg
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--brand-cyan)', fontWeight: 600 }}>
              जलमार्ग
            </span>
            <span style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--brand-cyan)',
              fontSize: '0.62rem',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              LIVE TELEMETRY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} color="var(--text-muted)" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="BLR" style={{ background: '#0D121F' }}>Bengaluru (Outer Ring Rd)</option>
                <option value="DEL" style={{ background: '#0D121F' }}>Delhi NCR (Minto Bridge)</option>
                <option value="BOM" style={{ background: '#0D121F' }}>Mumbai (Western Suburbs)</option>
              </select>
            </div>

            {/* Auto-Fetch GPS Location Button */}
            <button
              onClick={onAutoDetectLocation}
              disabled={isLocating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '6px',
                padding: '2px 8px',
                color: 'var(--brand-cyan)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              title="Auto-detect current GPS location and switch to local city"
            >
              {isLocating ? (
                <Loader2 size={11} className="spin" />
              ) : (
                <Navigation size={11} />
              )}
              <span>{isLocating ? 'Locating...' : 'Auto-Detect GPS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Vehicle Clearance Switcher */}
      <div className="glass-panel" style={{
        display: 'flex',
        padding: '3px',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => setVehicle('BIKE')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: vehicle === 'BIKE' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: vehicle === 'BIKE' ? 'var(--brand-cyan)' : 'var(--text-muted)',
            boxShadow: vehicle === 'BIKE' ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            transition: 'var(--transition-fast)'
          }}
        >
          <Bike size={16} />
          <span>2-Wheeler</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }} className="tabular-nums">(&lt;20cm)</span>
        </button>

        <button
          onClick={() => setVehicle('SEDAN')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: vehicle === 'SEDAN' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: vehicle === 'SEDAN' ? 'var(--brand-cyan)' : 'var(--text-muted)',
            boxShadow: vehicle === 'SEDAN' ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            transition: 'var(--transition-fast)'
          }}
        >
          <Car size={16} />
          <span>Sedan / Hatch</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }} className="tabular-nums">(&lt;30cm)</span>
        </button>

        <button
          onClick={() => setVehicle('SUV')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: vehicle === 'SUV' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: vehicle === 'SUV' ? 'var(--brand-cyan)' : 'var(--text-muted)',
            boxShadow: vehicle === 'SUV' ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            transition: 'var(--transition-fast)'
          }}
        >
          <Truck size={16} />
          <span>SUV / Bus</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }} className="tabular-nums">(&lt;55cm)</span>
        </button>
      </div>

      {/* 3. Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Pothole Hazard Layer Toggle */}
        <button
          onClick={() => setShowPotholes(!showPotholes)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid ' + (showPotholes ? 'var(--status-pothole)' : 'var(--border-subtle)'),
            background: showPotholes ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-surface-subtle)',
            color: showPotholes ? 'var(--status-pothole)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            transition: 'var(--transition-fast)'
          }}
          title="Toggle 48-Hour Post-Flood Pothole & Road Crater Risk Layer"
        >
          <Layers size={14} />
          <span>Potholes</span>
        </button>

        {/* Audio Radar Toggle */}
        <button
          onClick={() => setAudioRadarActive(!audioRadarActive)}
          className={audioRadarActive ? "pulse-radar" : ""}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid ' + (audioRadarActive ? 'var(--brand-cyan)' : 'var(--border-subtle)'),
            background: audioRadarActive ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface-subtle)',
            color: audioRadarActive ? 'var(--brand-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          <Volume2 size={15} />
          <span>Audio Radar</span>
        </button>

        {/* Civic Command Center (BBMP/BMC Dashboard) */}
        <button
          onClick={onOpenCivicDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--status-critical)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          <Building2 size={14} />
          <span>Pumps</span>
          <span style={{
            background: 'var(--status-critical)',
            color: '#fff',
            borderRadius: '999px',
            padding: '1px 6px',
            fontSize: '0.65rem'
          }} className="tabular-nums">
            {activePumpTicketsCount}
          </span>
        </button>

        {/* Report Flood Incident Button */}
        <button
          onClick={onOpenReportModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            boxShadow: 'var(--shadow-glow-cyan)'
          }}
        >
          <PlusCircle size={15} />
          <span>Report Flood</span>
        </button>
      </div>
    </header>
  )
}

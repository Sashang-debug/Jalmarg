import React from 'react'
import { X, AlertTriangle, ShieldCheck, Bike, Car, Truck, Camera, CheckCircle2, Clock, Send } from 'lucide-react'

export default function IncidentDetailModal({ incident, onClose, onDispatchPump }) {
  if (!incident) return null

  const isBikeSafe = incident.depthCm < 20
  const isSedanSafe = incident.depthCm < 30
  const isSuvSafe = incident.depthCm < 55

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '24px',
        border: '1px solid var(--border-strong)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: incident.severity === 'CRITICAL_NO_ENTRY' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: incident.severity === 'CRITICAL_NO_ENTRY' ? 'var(--status-critical)' : 'var(--status-caution)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {incident.severity.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Source: {incident.source} ({incident.reportedAt})
            </span>
          </div>

          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
            {incident.roadName}
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {incident.ward} • Reported by {incident.author}
          </p>
        </div>

        {/* Photo Evidence if available */}
        {incident.photoUrl && (
          <div style={{
            height: '160px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
            border: '1px solid var(--border-subtle)'
          }}>
            <img
              src={incident.photoUrl}
              alt={incident.roadName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Camera size={12} />
              <span>SageMaker Anchor Verification</span>
            </div>
          </div>
        )}

        {/* Depth Telemetry Gauge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WATER DEPTH METRIC</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: incident.severity === 'CRITICAL_NO_ENTRY' ? 'var(--status-critical)' : 'var(--status-caution)' }} className="tabular-nums">
              {incident.depthCm} cm
            </span>
          </div>

          {/* Depth Progress Bar */}
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${Math.min(100, (incident.depthCm / 80) * 100)}%`,
              height: '100%',
              background: incident.severity === 'CRITICAL_NO_ENTRY' ? 'var(--status-critical)' : 'var(--status-caution)',
              borderRadius: '4px'
            }} />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
            {incident.riskDescription}
          </p>
        </div>

        {/* Vehicle Suitability Matrix */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
            VEHICLE CLEARANCE AUDIT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: isBikeSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isBikeSafe ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              textAlign: 'center'
            }}>
              <Bike size={18} color={isBikeSafe ? 'var(--status-safe)' : 'var(--status-critical)'} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isBikeSafe ? 'var(--status-safe)' : 'var(--status-critical)' }}>
                {isBikeSafe ? 'PASSABLE' : 'DANGER'}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>2-Wheeler</div>
            </div>

            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: isSedanSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isSedanSafe ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              textAlign: 'center'
            }}>
              <Car size={18} color={isSedanSafe ? 'var(--status-safe)' : 'var(--status-critical)'} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSedanSafe ? 'var(--status-safe)' : 'var(--status-critical)' }}>
                {isSedanSafe ? 'PASSABLE' : 'DANGER'}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Sedan / Hatch</div>
            </div>

            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: isSuvSafe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isSuvSafe ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              textAlign: 'center'
            }}>
              <Truck size={18} color={isSuvSafe ? 'var(--status-safe)' : 'var(--status-critical)'} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSuvSafe ? 'var(--status-safe)' : 'var(--status-critical)' }}>
                {isSuvSafe ? 'PASSABLE' : 'DANGER'}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>SUV / Bus</div>
            </div>
          </div>
        </div>

        {/* Action Button: Dispatch Civic Pump */}
        {!incident.pumpDispatched ? (
          <button
            onClick={() => {
              onDispatchPump(incident.id)
              onClose()
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-glow-critical)'
            }}
          >
            <Send size={14} />
            <span>Dispatch De-Watering Pump Unit</span>
          </button>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: 'var(--status-safe)',
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <CheckCircle2 size={16} />
            <span>Civic Pump Unit Deployed & Active</span>
          </div>
        )}
      </div>
    </div>
  )
}

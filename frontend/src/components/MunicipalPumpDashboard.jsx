import React from 'react'
import { X, Building2, Droplets, CheckCircle, Clock, AlertOctagon, Send } from 'lucide-react'

export default function MunicipalPumpDashboard({
  isOpen,
  onClose,
  incidents,
  onDispatchPump,
  onResolveIncident
}) {
  if (!isOpen) return null

  const criticalIncidents = incidents.filter(i => i.depthCm >= 25)

  return (
    <aside aria-label="Municipal De-Watering Command Center" className="glass-panel-elevated" style={{
      position: 'fixed',
      top: '12px',
      right: '16px',
      bottom: '16px',
      width: '420px',
      zIndex: 1500,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      boxShadow: 'var(--shadow-glow-critical)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={18} color="var(--status-critical)" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              BBMP / Civic Pump Command
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Automated Ward Pump Dispatch Protocol
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Critical Queue Stat Banner */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertOctagon size={16} color="var(--status-critical)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-critical)' }}>
            High-Priority SQS Queue:
          </span>
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }} className="tabular-nums">
          {criticalIncidents.length} Active Hotspots
        </span>
      </div>

      {/* Incident List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {criticalIncidents.map((inc) => (
          <div
            key={inc.id}
            className="glass-panel"
            style={{
              padding: '12px',
              border: inc.pumpDispatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(15, 22, 36, 0.65)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {inc.roadName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {inc.ward} • {inc.reportedAt}
                </div>
              </div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--status-critical)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800
              }} className="tabular-nums">
                {inc.depthCm} cm
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: '10px' }}>
              {inc.riskDescription}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: inc.pumpDispatched ? 'var(--status-safe)' : 'var(--status-critical)'
                }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: inc.pumpDispatched ? 'var(--status-safe)' : 'var(--text-muted)' }}>
                  {inc.pumpStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {!inc.pumpDispatched ? (
                <button
                  onClick={() => onDispatchPump(inc.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Send size={12} />
                  <span>Dispatch Pump</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-safe)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle size={12} /> Unit Deployed
                  </span>
                  {onResolveIncident && (
                    <button
                      onClick={() => onResolveIncident(inc.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#10B981',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="De-watering complete, open road"
                    >
                      Complete & Open
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

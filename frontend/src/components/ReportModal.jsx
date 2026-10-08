import React, { useState } from 'react'
import { X, Camera, Mic, MapPin, AlertTriangle, CheckCircle2, Sparkles, Send } from 'lucide-react'

export default function ReportModal({ isOpen, onClose, onAddIncident }) {
  const [tab, setTab] = useState('FORM') // 'FORM' | 'VOICE_SIMULATOR'
  const [roadName, setRoadName] = useState('Indiranagar 100ft Road Underpass')
  const [anchor, setAnchor] = useState('BIKE_EXHAUST_SILENCER')
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80')
  const [voiceTranscript, setVoiceTranscript] = useState('Bhaiya, Marathahalli bridge ke neeche car ke bonnet tak paani aa gaya hai!')

  const ANCHOR_MAP = {
    'TIRE_RIM_PARTIAL': { depth: 14, severity: 'PASSABLE', label: 'Tire Rim Partial (~14 cm - Passable)' },
    'TIRE_RIM_FULL': { depth: 22, severity: 'MODERATE_RISK', label: 'Tire Rim Full (~22 cm - Caution)' },
    'BIKE_EXHAUST_SILENCER': { depth: 32, severity: 'MODERATE_RISK', label: 'Bike Silencer (~32 cm - Scooter Danger)' },
    'CAR_BUMPER_MID': { depth: 48, severity: 'CRITICAL_NO_ENTRY', label: 'Car Grille / Bumper (~48 cm - Critical)' },
    'CAR_BONNET_HEADLIGHTS': { depth: 72, severity: 'CRITICAL_NO_ENTRY', label: 'Car Bonnet Submerged (~72 cm - Complete Block)' }
  }

  if (!isOpen) return null

  const handleSubmitForm = (e) => {
    e.preventDefault()
    const anchorData = ANCHOR_MAP[anchor]

    const newInc = {
      id: `INC_USER_${Date.now()}`,
      roadName: roadName,
      city: 'BLR',
      ward: 'Ward 82 (Crowdsourced)',
      lat: 12.9719 + (Math.random() - 0.5) * 0.01,
      lng: 77.6412 + (Math.random() - 0.5) * 0.01,
      depthCm: anchorData.depth,
      severity: anchorData.severity,
      source: 'CITIZEN_PWA',
      author: 'Live_Commuter',
      riskDescription: `Visual anchor detected: ${anchorData.label}`,
      reportedAt: 'Just now',
      photoUrl: photoUrl,
      pumpDispatched: anchorData.depth >= 35,
      pumpStatus: anchorData.depth >= 35 ? 'QUEUE_PENDING' : 'MONITORING'
    }

    onAddIncident(newInc)
    onClose()
  }

  const handleSimulateVoice = () => {
    // Simulates WhatsApp Voice Pipeline
    const newInc = {
      id: `INC_WHATSAPP_${Date.now()}`,
      roadName: 'Marathahalli Multiplex Underpass',
      city: 'BLR',
      ward: 'Ward 85 (WhatsApp Auto-NER)',
      lat: 12.9569,
      lng: 77.7011,
      depthCm: 72,
      severity: 'CRITICAL_NO_ENTRY',
      source: 'WHATSAPP_VOICE',
      author: '+91 99887 XXXXX',
      riskDescription: `Transcribe Audio: "${voiceTranscript}"`,
      reportedAt: 'Just now',
      photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      pumpDispatched: true,
      pumpStatus: 'PUMP_EN_ROUTE'
    }

    onAddIncident(newInc)
    onClose()
  }

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
        maxWidth: '480px',
        padding: '24px',
        border: '1px solid var(--border-strong)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={20} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Report Waterlogging Incident
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Cedar Policy Enforced: Verified crowdsourcing protocol
            </p>
          </div>
        </div>

        {/* Tabs: Photo Form vs WhatsApp Voice Simulator */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.4)',
          padding: '3px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setTab('FORM')}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'FORM' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: tab === 'FORM' ? 'var(--brand-cyan)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Photo & Anchor Form
          </button>
          <button
            onClick={() => setTab('VOICE_SIMULATOR')}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'VOICE_SIMULATOR' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: tab === 'VOICE_SIMULATOR' ? 'var(--brand-cyan)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            WhatsApp Voice Simulator
          </button>
        </div>

        {tab === 'FORM' ? (
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Road / Landmark Name
              </label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Visual Submersion Reference Object (SageMaker Anchor)
              </label>
              <select
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0D121F',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
              >
                {Object.entries(ANCHOR_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Depth Preview Badge */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated Water Depth:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: ANCHOR_MAP[anchor].severity === 'CRITICAL_NO_ENTRY' ? 'var(--status-critical)' : 'var(--status-caution)' }} className="tabular-nums">
                {ANCHOR_MAP[anchor].depth} cm
              </span>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow-cyan)',
                marginTop: '6px'
              }}
            >
              <Send size={15} />
              <span>Submit & Update Spatial Index</span>
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Mic size={16} color="var(--brand-cyan)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                  Inbound WhatsApp Audio Note
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                "{voiceTranscript}"
              </p>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              Simulates Amazon Transcribe converting speech to text $\rightarrow$ Bedrock extracting "Marathahalli Multiplex" $\rightarrow$ CV Depth Estimator detecting "bonnet" $\rightarrow$ 72 cm Critical Hazard.
            </p>

            <button
              onClick={handleSimulateVoice}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              <span>Process Voice Note & Publish Incident</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

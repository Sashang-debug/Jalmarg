import React, { useState } from 'react'
import { Key, Check, X, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react'

export default function GoogleApiKeyModal({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey
}) {
  const [inputKey, setInputKey] = useState(currentApiKey || '')
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    onSaveApiKey(inputKey.trim())
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  const handleClear = () => {
    setInputKey('')
    onSaveApiKey('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        background: '#0D111C',
        border: '1.5px solid rgba(66, 133, 244, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(66, 133, 244, 0.25)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(66, 133, 244, 0.5)'
          }}>
            <Key size={22} color="#FFFFFF" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Google Maps API Engine
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Connect your Google Cloud Maps JavaScript API key
            </span>
          </div>
        </div>

        {/* Features Unlocked Badge */}
        <div style={{
          background: 'rgba(66, 133, 244, 0.1)',
          border: '1px solid rgba(66, 133, 244, 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Sparkles size={14} color="#4285F4" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#93C5FD' }}>
              Features Unlocked with Google Maps API:
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.74rem', color: '#CBD5E1', lineHeight: '1.6' }}>
            <li>Native Google Maps Vector engine with 3D buildings</li>
            <li>Real-time Google Traffic Layer overlay</li>
            <li>Google Places Autocomplete for Indian addresses</li>
            <li>Google Directions road snapping with flyover bypasses</li>
          </ul>
        </div>

        <form onSubmit={handleSave}>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#E2E8F0',
            marginBottom: '8px'
          }}>
            Google Maps API Key:
          </label>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#070A12',
                border: '1.5px solid #334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '20px'
          }}>
            {currentApiKey && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: 'transparent',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Disconnect Key
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#1E293B',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: savedSuccess ? '#10B981' : '#4285F4',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(66, 133, 244, 0.4)'
                }}
              >
                {savedSuccess ? (
                  <>
                    <Check size={16} /> Connected!
                  </>
                ) : (
                  'Connect Google Maps'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* GCP Note */}
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.72rem',
          color: '#64748B',
          lineHeight: '1.5'
        }}>
          💡 Make sure <strong>Maps JavaScript API</strong> and <strong>Places API</strong> are enabled in your Google Cloud Console project. Key is securely stored in your browser session.
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Navigation, ArrowUpDown, MapPin, Compass, ShieldCheck, AlertTriangle, Crosshair, ChevronDown, Check } from 'lucide-react'
import { CITY_LANDMARKS } from '../data/mockTelemetry'

export default function JourneyPlanner({
  selectedCity,
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwapPoints,
  pickingMode,
  setPickingMode,
  vehicle,
  routeData,
  onAutoDetectLocation
}) {
  const [activeDropdown, setActiveDropdown] = useState(null) // 'ORIGIN' | 'DESTINATION' | null

  const landmarks = CITY_LANDMARKS[selectedCity] || []

  const handlePickOnMap = (mode) => {
    setActiveDropdown(null)
    setPickingMode(mode)
  }

  const handleSelectLandmark = (lm, type) => {
    if (type === 'ORIGIN') {
      onSelectOrigin(lm)
    } else {
      onSelectDestination(lm)
    }
    setActiveDropdown(null)
  }

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 500,
      width: '330px',
      maxWidth: 'calc(100vw - 32px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* 1. Main Navigation Pill (Google Maps Navigation Style) */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
        borderRadius: '12px',
        position: 'relative'
      }}>
        {/* Header Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={14} color="#00E5FF" />
            <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.06em', color: '#94A3B8' }}>
              JALMARG MONSOON NAVIGATOR
            </span>
          </div>

          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: routeData?.isDetourRequired ? 'rgba(16, 185, 129, 0.2)' : 'rgba(66, 133, 244, 0.2)',
            color: routeData?.isDetourRequired ? '#10B981' : '#4285F4',
            border: `1px solid ${routeData?.isDetourRequired ? '#10B981' : '#4285F4'}`
          }}>
            {routeData?.isDetourRequired ? 'FLYOVER DETOUR' : (routeData?.hazardDepth > 0 ? 'SUV PASSABLE' : 'DRY TRANSIT')}
          </span>
        </div>

        {/* Inputs Container with Swap Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Origin Input */}
            <div
              onClick={() => setActiveDropdown(activeDropdown === 'ORIGIN' ? null : 'ORIGIN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#090D16',
                border: activeDropdown === 'ORIGIN' ? '1.5px solid #10B981' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 10px',
                cursor: 'pointer',
                transition: 'border 0.2s'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>START POINT</div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {origin?.name || 'Choose Start Location'}
                </div>
              </div>
              <ChevronDown size={14} color="#64748B" />
            </div>

            {/* Destination Input */}
            <div
              onClick={() => setActiveDropdown(activeDropdown === 'DESTINATION' ? null : 'DESTINATION')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#090D16',
                border: activeDropdown === 'DESTINATION' ? '1.5px solid #4285F4' : '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 10px',
                cursor: 'pointer',
                transition: 'border 0.2s'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4285F4', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800 }}>DESTINATION</div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {destination?.name || 'Choose Destination'}
                </div>
              </div>
              <ChevronDown size={14} color="#64748B" />
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={onSwapPoints}
            title="Swap Start and Destination"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1E293B',
              border: '1.5px solid #475569',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              flexShrink: 0,
              transition: 'transform 0.15s, background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1E293B'}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Dropdown Menu for Landmark / GPS Selection */}
        {activeDropdown && (
          <div style={{
            marginTop: '10px',
            background: '#0B0F19',
            border: '1.5px solid #334155',
            borderRadius: '10px',
            padding: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.9)'
          }}>
            {/* Action 1: Use Current GPS (for origin) */}
            {activeDropdown === 'ORIGIN' && (
              <button
                onClick={() => {
                  onAutoDetectLocation()
                  setActiveDropdown(null)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid #00E5FF',
                  color: '#00E5FF',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Crosshair size={14} />
                <span>📍 Use My Live GPS Location</span>
              </button>
            )}

            {/* Action 2: Click to Pick on Map */}
            <button
              onClick={() => handlePickOnMap(activeDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1E293B',
                border: '1px dashed #64748B',
                color: '#F8FAFC',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <MapPin size={14} color="#F59E0B" />
              <span>🗺️ Click Anywhere on Map to Set {activeDropdown === 'ORIGIN' ? 'Start' : 'Dest'}</span>
            </button>

            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 900, margin: '6px 4px 2px 4px', letterSpacing: '0.05em' }}>
              POPULAR HUBS ({selectedCity})
            </div>

            {/* Landmark List */}
            {landmarks.map((lm) => {
              const isSelected = activeDropdown === 'ORIGIN' ? origin?.name === lm.name : destination?.name === lm.name
              return (
                <div
                  key={lm.name}
                  onClick={() => handleSelectLandmark(lm, activeDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid #4285F4' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1E293B' }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={13} color={isSelected ? '#4285F4' : '#64748B'} />
                    <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: isSelected ? 900 : 700 }}>
                      {lm.name}
                    </span>
                  </div>
                  {isSelected && <Check size={14} color="#4285F4" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Landmark Chips */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, marginBottom: '6px' }}>
            QUICK DESTINATIONS:
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {landmarks.slice(0, 5).map((lm) => {
              const isSelected = destination?.name === lm.name
              return (
                <button
                  key={lm.name}
                  onClick={() => onSelectDestination(lm)}
                  style={{
                    background: isSelected ? '#4285F4' : '#0B0F19',
                    border: `1px solid ${isSelected ? '#4285F4' : '#334155'}`,
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    borderRadius: '999px',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {lm.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Route Clearance Advisory Summary */}
        {routeData && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #1E293B'
          }}>
            <p style={{
              fontSize: '0.74rem',
              color: '#CBD5E1',
              lineHeight: 1.3,
              margin: '0 0 6px 0',
              fontWeight: 600
            }}>
              {routeData.advisoryText}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              background: '#090D16',
              padding: '6px 8px',
              borderRadius: '8px',
              border: '1px solid #1E293B',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 800 }}>DISTANCE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FFFFFF' }} className="tabular-nums">
                  {routeData.distanceKm} km
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 800 }}>EST. TIME</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FFFFFF' }} className="tabular-nums">
                  {routeData.estTimeMins} mins
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 800 }}>AVOIDED</div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: routeData.avoidedDepth > 0 ? '#EF4444' : '#10B981'
                }} className="tabular-nums">
                  {routeData.avoidedDepth > 0 ? `${routeData.avoidedDepth} cm` : '0 cm'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive "Pick on Map" Banner Indicator */}
      {pickingMode && (
        <div style={{
          background: '#F59E0B',
          color: '#000000',
          padding: '8px 12px',
          borderRadius: '8px',
          fontWeight: 900,
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
          animation: 'critical-pulse 1.8s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair size={16} />
            <span>Click map to set {pickingMode === 'ORIGIN' ? 'START' : 'DESTINATION'} point</span>
          </div>
          <button
            onClick={() => setPickingMode(null)}
            style={{
              background: '#000000',
              color: '#FFFFFF',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

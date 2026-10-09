import React, { useState, useRef, useEffect } from 'react'
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Car, 
  Bike, 
  Truck, 
  Footprints, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MapPin, 
  Crosshair, 
  AlertTriangle, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Share2, 
  Smartphone, 
  Layers, 
  TrafficCone, 
  Building2, 
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import { CITY_LANDMARKS } from '../data/mockTelemetry'

export default function GoogleMapsDirectionsSidebar({
  isOpen,
  onToggleSidebar,
  onCloseDirections,
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwapPoints,
  onAutoDetectLocation,
  vehicle,
  setVehicle,
  routeData,
  selectedCity,
  onOpenReportModal,
  onOpenCivicDashboard,
  activePumpTicketsCount,
  showPotholes,
  setShowPotholes,
  showTraffic,
  setShowTraffic,
  audioRadarActive,
  setAudioRadarActive,
  onPickOnMap
}) {
  const [activeInput, setActiveInput] = useState(null) // 'ORIGIN' | 'DESTINATION' | null
  const [originSearch, setOriginSearch] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [showSteps, setShowSteps] = useState(false)
  const inputsSectionRef = useRef(null)

  const landmarks = CITY_LANDMARKS[selectedCity] || []

  // Close origin/destination dropdown when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inputsSectionRef.current && !inputsSectionRef.current.contains(e.target)) {
        setActiveInput(null)
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActiveInput(null)
      }
    }

    if (activeInput) {
      window.addEventListener('mousedown', handleClickOutside, true)
      window.addEventListener('pointerdown', handleClickOutside, true)
      window.addEventListener('touchstart', handleClickOutside, true)
      window.addEventListener('click', handleClickOutside, true)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('pointerdown', handleClickOutside, true)
      window.removeEventListener('touchstart', handleClickOutside, true)
      window.removeEventListener('click', handleClickOutside, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeInput])

  // Clearance limits
  const CLEARANCE_LIMITS = {
    BIKE: 20,
    SEDAN: 30,
    SUV: 55
  }

  const currentLimit = CLEARANCE_LIMITS[vehicle] || 20

  const handleSelectLandmark = (lm, type) => {
    if (type === 'ORIGIN') {
      onSelectOrigin({ name: lm.name, lat: lm.lat, lng: lm.lng })
      setOriginSearch('')
    } else {
      onSelectDestination({ name: lm.name, lat: lm.lat, lng: lm.lng })
      setDestSearch('')
    }
    setActiveInput(null)
  }

  return (
    <>
      {/* 1. Main Directions Sidebar Container */}
      <aside
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '408px',
          maxWidth: 'calc(100vw - 48px)',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '2px 0 12px rgba(0,0,0,0.18)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'auto',
          fontFamily: 'Roboto, Arial, sans-serif'
        }}
      >
        {/* Top Header: Navigation Modes & Close */}
        <div style={{
          padding: '12px 16px 8px 16px',
          borderBottom: '1px solid #E8EAED',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#FFFFFF'
        }}>
          {/* Top Row: Travel Mode Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Car / Sedan Tab */}
              <button
                onClick={() => setVehicle('SEDAN')}
                title="Driving (Sedan / Hatchback: <30cm clearance)"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: vehicle === 'SEDAN' ? '#E8F0FE' : 'transparent',
                  color: vehicle === 'SEDAN' ? '#1A73E8' : '#5F6368',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                  transition: 'background 0.15s'
                }}
              >
                <Car size={18} />
                <span>{routeData?.estTimeMins ? `${routeData.estTimeMins} min` : '14 min'}</span>
              </button>

              {/* 2-Wheeler Tab */}
              <button
                onClick={() => setVehicle('BIKE')}
                title="Two-wheeler (Motorcycle / Scooter: <20cm clearance)"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: vehicle === 'BIKE' ? '#E8F0FE' : 'transparent',
                  color: vehicle === 'BIKE' ? '#1A73E8' : '#5F6368',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <Bike size={18} />
                <span>{routeData?.estTimeMins ? `${routeData.estTimeMins + 2} min` : '18 min'}</span>
              </button>

              {/* SUV / Bus Tab */}
              <button
                onClick={() => setVehicle('SUV')}
                title="SUV / Commercial Bus (<55cm clearance)"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: vehicle === 'SUV' ? '#E8F0FE' : 'transparent',
                  color: vehicle === 'SUV' ? '#1A73E8' : '#5F6368',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <Truck size={18} />
                <span>{routeData?.estTimeMins ? `${Math.max(8, routeData.estTimeMins - 2)} min` : '12 min'}</span>
              </button>

              {/* Walking Tab */}
              <button
                title="Walking (Flood caution)"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#70757A',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <Footprints size={18} />
                <span>1h 10m</span>
              </button>
            </div>

            {/* Close Directions Button */}
            <button
              onClick={onCloseDirections}
              title="Close Directions"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: '#5F6368',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Input Cards Section (Google Maps Dotted Flow) */}
          <div ref={inputsSectionRef} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              gap: '8px'
            }}>
            {/* Visual Dotted Timeline Connector */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '18px',
              paddingTop: '8px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '2px solid #5F6368',
                background: '#FFFFFF'
              }} />
              <div style={{
                width: '2px',
                height: '24px',
                borderLeft: '2px dotted #BDC1C6',
                margin: '2px 0'
              }} />
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#D93025'
              }} />
            </div>

            {/* Origin & Destination Input Boxes */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Origin Input */}
              <div
                onClick={() => setActiveInput(activeInput === 'ORIGIN' ? null : 'ORIGIN')}
                style={{
                  background: activeInput === 'ORIGIN' ? '#E8F0FE' : '#F1F3F4',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: activeInput === 'ORIGIN' ? '1.5px solid #1A73E8' : '1px solid transparent'
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#70757A', fontWeight: 600 }}>CHOOSE STARTING POINT</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#202124', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {origin?.name || 'Your location'}
                  </div>
                </div>
                <Crosshair size={14} color="#1A73E8" onClick={(e) => { e.stopPropagation(); onAutoDetectLocation(); }} title="Use Live GPS" />
              </div>

              {/* Destination Input */}
              <div
                onClick={() => setActiveInput(activeInput === 'DESTINATION' ? null : 'DESTINATION')}
                style={{
                  background: activeInput === 'DESTINATION' ? '#E8F0FE' : '#F1F3F4',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: activeInput === 'DESTINATION' ? '1.5px solid #1A73E8' : '1px solid transparent'
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#70757A', fontWeight: 600 }}>DESTINATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#202124', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {destination?.name || 'Choose destination'}
                  </div>
                </div>
                <MapPin size={14} color="#D93025" />
              </div>
            </div>

            {/* Reverse / Swap Points Button */}
            <button
              onClick={onSwapPoints}
              title="Reverse starting point and destination"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #DADCE0',
                background: '#FFFFFF',
                color: '#5F6368',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'background 0.15s, transform 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>

          {/* Quick Dropdown for picking starting point or destination */}
          {activeInput && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #DADCE0',
              borderRadius: '8px',
              padding: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {/* Option 1: Live GPS */}
              <div
                onClick={() => { onAutoDetectLocation(); setActiveInput(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#1A73E8',
                  fontSize: '13px',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Crosshair size={16} />
                <span>Use current GPS location</span>
              </div>

              {/* Option 2: Click on Map */}
              <div
                onClick={() => { onPickOnMap(activeInput); setActiveInput(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#202124',
                  fontSize: '13px',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MapPin size={16} color="#F59E0B" />
                <span>Choose on map</span>
              </div>

              <div style={{ fontSize: '11px', fontWeight: 700, color: '#70757A', padding: '6px 12px' }}>
                LOCAL HUBS ({selectedCity})
              </div>

              {landmarks.map((lm) => (
                <div
                  key={lm.name}
                  onClick={() => handleSelectLandmark(lm, activeInput)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#202124'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {lm.name}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* 2. Scrollable Body: Route Options & Flood Advisory Cards */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* JalMarg Flood Clearance Status Banner */}
          <div style={{
            borderRadius: '8px',
            padding: '12px',
            background: routeData?.isDetourRequired ? '#FEF7E0' : '#E6F4EA',
            border: routeData?.isDetourRequired ? '1px solid #FEEFC3' : '1px solid #CEEAD6',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            {routeData?.isDetourRequired ? (
              <AlertTriangle size={18} color="#B06000" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <ShieldCheck size={18} color="#137333" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: routeData?.isDetourRequired ? '#B06000' : '#137333',
                marginBottom: '2px'
              }}>
                {routeData?.isDetourRequired
                  ? `WATERLOGGING HAZARD DETECTED (${routeData?.hazardDepth || 48} cm)`
                  : 'SAFE PASSAGE VERIFIED'}
              </div>
              <div style={{ fontSize: '12px', color: '#3C4043', lineHeight: '1.4' }}>
                {routeData?.advisoryText}
              </div>
            </div>
          </div>

          {/* Route Option 1 (Primary / Recommended) */}
          <div
            onClick={() => setSelectedRouteIndex(0)}
            style={{
              borderRadius: '8px',
              border: selectedRouteIndex === 0 ? '2px solid #1A73E8' : '1px solid #DADCE0',
              padding: '14px',
              cursor: 'pointer',
              background: selectedRouteIndex === 0 ? '#F8F9FA' : '#FFFFFF',
              boxShadow: selectedRouteIndex === 0 ? '0 2px 6px rgba(26,115,232,0.15)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#202124' }}>
                  {routeData?.isDetourRequired ? 'via Sarjapur Flyover Bypass' : 'via Direct Arterial Road'}
                </div>
                <div style={{ fontSize: '12px', color: '#137333', fontWeight: 600, marginTop: '2px' }}>
                  {routeData?.isDetourRequired ? 'Recommended: Avoids submerged choke-point' : 'Fastest route, normal water level'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: routeData?.isDetourRequired ? '#1A73E8' : '#137333' }}>
                  {routeData?.estTimeMins || 14} min
                </div>
                <div style={{ fontSize: '12px', color: '#70757A' }}>
                  {routeData?.distanceKm || 5.2} km
                </div>
              </div>
            </div>

            {/* Details & Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #E8EAED'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSteps(!showSteps); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1A73E8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showSteps ? 'Hide steps' : 'Details'}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setAudioRadarActive(!audioRadarActive); }}
                style={{
                  background: audioRadarActive ? '#E8F0FE' : 'none',
                  border: '1px solid #DADCE0',
                  color: audioRadarActive ? '#1A73E8' : '#5F6368',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Volume2 size={13} />
                <span>{audioRadarActive ? 'Audio Radar Active' : 'Start Audio'}</span>
              </button>
            </div>

            {/* Step-by-Step details preview */}
            {showSteps && (
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px dashed #DADCE0',
                fontSize: '12px',
                color: '#3C4043',
                lineHeight: '1.6'
              }}>
                <div>1. Head southwest on {origin?.name || 'Starting Point'}</div>
                <div>2. Turn onto elevated bypass to avoid {routeData?.hazardName || 'Silk Board'} ({routeData?.hazardDepth || 48} cm depth)</div>
                <div>3. Continue along flyover for 3.2 km</div>
                <div>4. Arrive at {destination?.name || 'Destination'}</div>
              </div>
            )}
          </div>

          {/* Route Option 2 (Alternate Road Corridor) */}
          <div
            onClick={() => setSelectedRouteIndex(1)}
            style={{
              borderRadius: '8px',
              border: selectedRouteIndex === 1 ? '2px solid #1A73E8' : '1px solid #DADCE0',
              padding: '14px',
              cursor: 'pointer',
              background: selectedRouteIndex === 1 ? '#F8F9FA' : '#FFFFFF',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#202124' }}>
                  via Inner Ring Road
                </div>
                <div style={{ fontSize: '12px', color: '#70757A', marginTop: '2px' }}>
                  Alternate route, moderate traffic
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#5F6368' }}>
                  {(routeData?.estTimeMins || 14) + 6} min
                </div>
                <div style={{ fontSize: '12px', color: '#70757A' }}>
                  {((routeData?.distanceKm || 5.2) + 1.8).toFixed(1)} km
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tools & Shortcuts Panel */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid #E8EAED',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#70757A', letterSpacing: '0.05em' }}>
              MONSOON CIVIC TOOLS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Report Waterlogging */}
              <button
                onClick={onOpenReportModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DADCE0',
                  background: '#FFFFFF',
                  color: '#D93025',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={14} />
                <span>Report Flood</span>
              </button>

              {/* Civic Pump Tickets */}
              <button
                onClick={onOpenCivicDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DADCE0',
                  background: '#FFFFFF',
                  color: '#1A73E8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Building2 size={14} />
                <span>Pumps ({activePumpTicketsCount})</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Floating Sidebar Toggle Handle Button (< / >) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleSidebar()
        }}
        title={isOpen ? "Collapse side bar" : "Show side bar"}
        style={{
          position: 'absolute',
          top: '50%',
          left: isOpen ? '408px' : '0px',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '48px',
          background: '#FFFFFF',
          border: '1px solid #DADCE0',
          borderLeft: isOpen ? 'none' : '1px solid #DADCE0',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          boxShadow: '2px 0 6px rgba(0,0,0,0.12)',
          zIndex: 1001,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#5F6368',
          transition: 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </>
  )
}

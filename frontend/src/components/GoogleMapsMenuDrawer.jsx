import React from 'react'
import { 
  X, 
  MapPin, 
  Layers, 
  TrafficCone, 
  Volume2, 
  PlusCircle, 
  Building2, 
  Key, 
  Droplets, 
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

export default function GoogleMapsMenuDrawer({
  isOpen,
  onClose,
  isSidebarOpen,
  onToggleSidebar,
  selectedCity,
  setSelectedCity,
  showTraffic,
  setShowTraffic,
  showPotholes,
  setShowPotholes,
  audioRadarActive,
  setAudioRadarActive,
  onOpenReportModal,
  onOpenCivicDashboard,
  onOpenKeyModal,
  activePumpTicketsCount,
  googleApiKey
}) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      pointerEvents: 'auto',
      fontFamily: 'Roboto, Arial, sans-serif'
    }}>
      {/* Click outside to close */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Drawer Panel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '320px',
        maxWidth: '85vw',
        height: '100vh',
        background: '#FFFFFF',
        boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInLeft 0.22s ease-out'
      }}>
        {/* Drawer Header (Google Maps Branding) */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E8EAED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(26,115,232,0.3)'
            }}>
              <Droplets size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#202124', lineHeight: 1.1 }}>
                JalMarg
              </div>
              <div style={{ fontSize: '12px', color: '#1A73E8', fontWeight: 600 }}>
                जलमार्ग Flood Radar
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5F6368',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {/* Item 1: "Show side bar" toggle switch (Matches Screenshot 3!) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid #F1F3F4'
          }}>
            <span style={{ fontSize: '14px', color: '#202124', fontWeight: 500 }}>
              Show side bar
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
              <input
                type="checkbox"
                checked={isSidebarOpen}
                onChange={onToggleSidebar}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                inset: 0,
                backgroundColor: isSidebarOpen ? '#1A73E8' : '#BDC1C6',
                borderRadius: '22px',
                transition: '0.2s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px',
                  width: '16px',
                  left: isSidebarOpen ? '21px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </span>
            </label>
          </div>

          {/* Item 2: Metro City Selector */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F3F4' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#70757A', marginBottom: '8px' }}>
              METRO CITY
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #DADCE0',
                background: '#F8F9FA',
                fontSize: '13px',
                color: '#202124',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="BLR">Bengaluru (Outer Ring Rd)</option>
              <option value="DEL">Delhi NCR (Minto Bridge)</option>
              <option value="BOM">Mumbai (Western Suburbs)</option>
            </select>
          </div>

          {/* Item 3: Layers & Overlays */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F3F4' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#70757A', marginBottom: '10px' }}>
              LAYERS & TRAFFIC
            </div>

            {/* Traffic Toggle */}
            <div
              onClick={() => setShowTraffic(!showTraffic)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrafficCone size={18} color="#EA8600" />
                <span style={{ fontSize: '14px', color: '#202124' }}>Google Live Traffic</span>
              </div>
              <input type="checkbox" checked={showTraffic} onChange={() => {}} style={{ cursor: 'pointer' }} />
            </div>

            {/* Potholes Toggle */}
            <div
              onClick={() => setShowPotholes(!showPotholes)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={18} color="#673AB7" />
                <span style={{ fontSize: '14px', color: '#202124' }}>Post-Flood Potholes</span>
              </div>
              <input type="checkbox" checked={showPotholes} onChange={() => {}} style={{ cursor: 'pointer' }} />
            </div>

            {/* Audio Radar Toggle */}
            <div
              onClick={() => setAudioRadarActive(!audioRadarActive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={18} color="#137333" />
                <span style={{ fontSize: '14px', color: '#202124' }}>Hands-Free Audio Radar</span>
              </div>
              <input type="checkbox" checked={audioRadarActive} onChange={() => {}} style={{ cursor: 'pointer' }} />
            </div>
          </div>

          {/* Item 4: Actions & Tools */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F3F4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#70757A', marginBottom: '4px' }}>
              CIVIC DISPATCH & REPORTING
            </div>

            {/* Report Waterlogging */}
            <div
              onClick={() => { onClose(); onOpenReportModal(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                cursor: 'pointer',
                color: '#D93025'
              }}
            >
              <PlusCircle size={18} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Report Waterlogged Road</span>
            </div>

            {/* BBMP / BMC Pump Dashboard */}
            <div
              onClick={() => { onClose(); onOpenCivicDashboard(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                cursor: 'pointer',
                color: '#1A73E8'
              }}
            >
              <Building2 size={18} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Municipal Pump Queue ({activePumpTicketsCount})
              </span>
            </div>

            {/* Google API Key */}
            <div
              onClick={() => { onClose(); onOpenKeyModal(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                cursor: 'pointer',
                color: '#3C4043'
              }}
            >
              <Key size={18} color="#F59E0B" />
              <span style={{ fontSize: '14px' }}>
                Google Maps API {googleApiKey ? '(Connected)' : '(Setup)'}
              </span>
            </div>
          </div>

          {/* Hackathon Badge */}
          <div style={{ padding: '16px 20px', fontSize: '12px', color: '#70757A', lineHeight: 1.5 }}>
            <div><strong>JalMarg (जलमार्ग)</strong> v1.2</div>
            <div>Build for Bharat — AWS x WeMakeDevs Hackathon</div>
            <div style={{ color: '#137333', marginTop: '4px' }}>● Live Telemetry Active</div>
          </div>
        </div>
      </div>
    </div>
  )
}

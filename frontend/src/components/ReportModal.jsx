import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Mic,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Send,
  Upload,
  RefreshCw,
  Crosshair,
  Cpu,
  Image as ImageIcon,
  Check,
  Radio,
  FileImage
} from 'lucide-react'
import { CITY_LANDMARKS, calculateHaversineDistance, CITY_CONFIGS } from '../data/mockTelemetry'

export default function ReportModal({
  isOpen,
  onClose,
  onAddIncident,
  userLocation,
  selectedCity = 'BLR',
  onAutoDetectLocation
}) {
  const [tab, setTab] = useState('FORM') // 'FORM' | 'VOICE_SIMULATOR'
  const [roadName, setRoadName] = useState('Indiranagar 100ft Road Underpass')
  const [anchor, setAnchor] = useState('BIKE_EXHAUST_SILENCER')
  const [uploadedPhoto, setUploadedPhoto] = useState(
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80'
  )
  const [photoFileName, setPhotoFileName] = useState('scooter_waterline_sample.jpg')
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false)
  const [cvResult, setCvResult] = useState({
    detectedAnchor: 'BIKE_EXHAUST_SILENCER',
    confidence: 98.4,
    label: 'Bike Silencer (~32 cm)'
  })

  // Real-time GPS Location Tracing State
  const [isLocating, setIsLocating] = useState(false)
  const [gpsCoordinates, setGpsCoordinates] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('IDLE') // 'IDLE' | 'LOCATING' | 'SUCCESS' | 'ERROR'
  const [gpsAccuracy, setGpsAccuracy] = useState(null)

  const [voiceTranscript, setVoiceTranscript] = useState(
    'Bhaiya, Marathahalli bridge ke neeche car ke bonnet tak paani aa gaya hai!'
  )

  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const ANCHOR_MAP = {
    'TIRE_RIM_PARTIAL': { depth: 14, severity: 'PASSABLE', label: 'Tire Rim Partial (~14 cm - Passable)' },
    'TIRE_RIM_FULL': { depth: 22, severity: 'MODERATE_RISK', label: 'Tire Rim Full (~22 cm - Caution)' },
    'BIKE_EXHAUST_SILENCER': { depth: 32, severity: 'MODERATE_RISK', label: 'Bike Silencer (~32 cm - Scooter Danger)' },
    'CAR_BUMPER_MID': { depth: 48, severity: 'CRITICAL_NO_ENTRY', label: 'Car Grille / Bumper (~48 cm - Critical)' },
    'CAR_BONNET_HEADLIGHTS': { depth: 72, severity: 'CRITICAL_NO_ENTRY', label: 'Car Bonnet Submerged (~72 cm - Complete Block)' }
  }

  // Pre-configured realistic photo samples for instant testing
  const PHOTO_PRESETS = [
    {
      id: 'scooter',
      label: '🛵 Scooter Silencer (~32cm)',
      anchorKey: 'BIKE_EXHAUST_SILENCER',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      name: 'scooter_submerged_road.jpg'
    },
    {
      id: 'car_bonnet',
      label: '🌊 Car Bonnet Submerged (~72cm)',
      anchorKey: 'CAR_BONNET_HEADLIGHTS',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      name: 'deep_water_underpass.jpg'
    },
    {
      id: 'car_grille',
      label: '🚗 Car Grille Submerged (~48cm)',
      anchorKey: 'CAR_BUMPER_MID',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
      name: 'car_grille_waterline.jpg'
    },
    {
      id: 'tire_shallow',
      label: '🌧️ Tire Rim Partial (~14cm)',
      anchorKey: 'TIRE_RIM_PARTIAL',
      url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80',
      name: 'shallow_street_runoff.jpg'
    }
  ]

  // Real-time GPS Location Tracer Function
  const traceCurrentLocation = () => {
    if (!navigator.geolocation) {
      fallbackToExistingLocation()
      return
    }

    setIsLocating(true)
    setGpsStatus('LOCATING')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const acc = Math.round(position.coords.accuracy || 5)

        setGpsCoordinates({ lat, lng, accuracy: acc })
        setGpsAccuracy(acc)
        setGpsStatus('SUCCESS')
        setIsLocating(false)

        // Find nearest known landmark in the current city
        const landmarks = CITY_LANDMARKS[selectedCity] || []
        let nearest = null
        let minDistance = Infinity

        landmarks.forEach(lm => {
          const d = calculateHaversineDistance(lat, lng, lm.lat, lm.lng)
          if (d < minDistance) {
            minDistance = d
            nearest = lm
          }
        })

        if (nearest && minDistance < 6) {
          setRoadName(`Near ${nearest.name} (Live GPS ±${acc}m)`)
        } else {
          setRoadName(`Live Commuter Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
        }
      },
      (error) => {
        console.warn('Live location trace error:', error.message)
        fallbackToExistingLocation()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const fallbackToExistingLocation = () => {
    setIsLocating(false)
    if (userLocation && userLocation.lat && userLocation.lng) {
      setGpsCoordinates({
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy || 10
      })
      setGpsAccuracy(userLocation.accuracy || 10)
      setGpsStatus('SUCCESS')
      setRoadName(userLocation.name || `Live GPS Point (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`)
    } else {
      const cityCenter = CITY_CONFIGS[selectedCity]?.center || [12.9280, 77.6350]
      setGpsCoordinates({ lat: cityCenter[0], lng: cityCenter[1], accuracy: 25 })
      setGpsAccuracy(25)
      setGpsStatus('ERROR')
      const landmarks = CITY_LANDMARKS[selectedCity] || []
      if (landmarks.length > 0) {
        setRoadName(`${landmarks[0].name} (Estimated)`)
      }
    }
  }

  // Auto-trace location immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      traceCurrentLocation()
    }
  }, [isOpen, selectedCity])

  // Real-time Photo File Upload Handler
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') {
        setUploadedPhoto(dataUrl)
        triggerComputerVisionScan('BIKE_EXHAUST_SILENCER')
      }
    }
    reader.readAsDataURL(file)
  }

  // Simulated Real-Time AWS SageMaker / Bedrock Computer Vision Waterline Analyzer
  const triggerComputerVisionScan = (suggestedAnchorKey) => {
    setIsAnalyzingCV(true)
    setTimeout(() => {
      setIsAnalyzingCV(false)
      const anchorInfo = ANCHOR_MAP[suggestedAnchorKey] || ANCHOR_MAP['BIKE_EXHAUST_SILENCER']
      setAnchor(suggestedAnchorKey)
      setCvResult({
        detectedAnchor: suggestedAnchorKey,
        confidence: Number((96.5 + Math.random() * 3).toFixed(1)),
        label: anchorInfo.label
      })
    }, 1100)
  }

  const handleApplyPreset = (preset) => {
    setUploadedPhoto(preset.url)
    setPhotoFileName(preset.name)
    triggerComputerVisionScan(preset.anchorKey)
  }

  if (!isOpen) return null

  const handleSubmitForm = (e) => {
    e.preventDefault()
    const anchorData = ANCHOR_MAP[anchor]

    const lat = gpsCoordinates?.lat || (CITY_CONFIGS[selectedCity]?.center[0] || 12.9280)
    const lng = gpsCoordinates?.lng || (CITY_CONFIGS[selectedCity]?.center[1] || 77.6350)

    const newInc = {
      id: `INC_LIVE_${Date.now()}`,
      roadName: roadName || 'Live Citizen Waterlogging Report',
      city: selectedCity,
      ward: `Ward ${Math.floor(Math.random() * 80 + 10)} (GPS Crowdsourced)`,
      lat: lat,
      lng: lng,
      accuracyM: gpsAccuracy || 5,
      depthCm: anchorData.depth,
      severity: anchorData.severity,
      source: uploadedPhoto?.startsWith('data:') ? 'CITIZEN_LIVE_CAMERA' : 'CITIZEN_PWA',
      author: 'Live Commuter (Verified)',
      riskDescription: `Real-time photo verified via CV Anchor: ${anchorData.label}.`,
      reportedAt: 'Just now',
      photoUrl: uploadedPhoto,
      pumpDispatched: anchorData.depth >= 35,
      pumpStatus: anchorData.depth >= 35 ? 'QUEUE_PENDING' : 'MONITORING',
      isLiveReport: true
    }

    onAddIncident(newInc)
    onClose()
  }

  const handleSimulateVoice = () => {
    const lat = gpsCoordinates?.lat || 12.9569
    const lng = gpsCoordinates?.lng || 77.7011

    const newInc = {
      id: `INC_WHATSAPP_${Date.now()}`,
      roadName: roadName || 'Marathahalli Multiplex Underpass',
      city: selectedCity,
      ward: 'Ward 85 (WhatsApp Auto-NER)',
      lat: lat,
      lng: lng,
      depthCm: 72,
      severity: 'CRITICAL_NO_ENTRY',
      source: 'WHATSAPP_VOICE',
      author: '+91 99887 XXXXX',
      riskDescription: `Transcribe Audio: "${voiceTranscript}"`,
      reportedAt: 'Just now',
      photoUrl: uploadedPhoto,
      pumpDispatched: true,
      pumpStatus: 'PUMP_EN_ROUTE',
      isLiveReport: true
    }

    onAddIncident(newInc)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="glass-panel-elevated"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '22px',
          border: '1px solid var(--border-strong)',
          position: 'relative',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          id="btn-close-report-modal"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          title="Close Dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)'
            }}
          >
            <Camera size={22} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
              Report Live Waterlogging
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--brand-cyan)', margin: 0, fontWeight: 600 }}>
              Real-Time Photo Submersion & GPS Tracing Protocol
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.45)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '16px'
          }}
        >
          <button
            onClick={() => setTab('FORM')}
            id="tab-btn-photo-form"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'FORM' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
              color: tab === 'FORM' ? '#38BDF8' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Camera size={14} />
            <span>Live Photo & GPS Trace</span>
          </button>
          <button
            onClick={() => setTab('VOICE_SIMULATOR')}
            id="tab-btn-voice-sim"
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'VOICE_SIMULATOR' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
              color: tab === 'VOICE_SIMULATOR' ? '#38BDF8' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Mic size={14} />
            <span>WhatsApp Voice AI</span>
          </button>
        </div>

        {tab === 'FORM' ? (
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. LIVE GPS LOCATION TRACING CARD */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crosshair size={15} color="#06B6D4" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                    REAL-TIME GPS TELEMETRY
                  </span>
                </div>

                <button
                  type="button"
                  onClick={traceCurrentLocation}
                  id="btn-trace-location-modal"
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: '#38BDF8',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Re-query GPS satellite coordinates"
                >
                  <RefreshCw size={11} className={isLocating ? 'spin-icon' : ''} />
                  <span>{isLocating ? 'Tracing...' : 'Re-Trace GPS'}</span>
                </button>
              </div>

              {/* Coordinates Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: gpsStatus === 'SUCCESS' ? '#10B981' : gpsStatus === 'LOCATING' ? '#F59E0B' : '#EF4444',
                      boxShadow: gpsStatus === 'SUCCESS' ? '0 0 8px #10B981' : 'none'
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isLocating
                      ? '🛰️ Acquiring precision GPS fix...'
                      : gpsCoordinates
                      ? `Lat: ${gpsCoordinates.lat.toFixed(5)}, Lng: ${gpsCoordinates.lng.toFixed(5)}`
                      : '🛰️ GPS coordinates pending'}
                  </span>
                </div>

                {gpsAccuracy && (
                  <span style={{ color: '#10B981', fontWeight: 700 }}>
                    ±{gpsAccuracy}m precision
                  </span>
                )}
              </div>

              {/* Road / Landmark Field */}
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Road / Landmark Name (Auto-resolved from GPS)
                </label>
                <input
                  type="text"
                  id="input-report-roadname"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. Indiranagar 100ft Road Underpass"
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                  required
                />
              </div>
            </div>

            {/* 2. REAL-TIME PHOTO CAPTURE & UPLOAD SECTION */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="#38BDF8" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    REAL-TIME FLOOD PHOTO
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--brand-cyan)', fontWeight: 600 }}>
                  SageMaker CV Model Active
                </span>
              </div>

              {/* Hidden File and Camera Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                id="input-camera-capture"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                id="input-gallery-upload"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Photo Preview Container with CV Scanning Laser Overlay */}
              <div
                style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  background: '#0B0F19'
                }}
              >
                <img
                  src={uploadedPhoto}
                  alt="Real-time waterlogging evidence"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Laser Waterline Scanning Effect */}
                {isAnalyzingCV && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: '#06B6D4',
                      boxShadow: '0 0 15px #06B6D4, 0 0 30px #06B6D4',
                      animation: 'scanWaterline 1.1s ease-in-out infinite',
                      zIndex: 10
                    }}
                  />
                )}

                {/* Analyzing Badge */}
                {isAnalyzingCV && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(6, 182, 212, 0.25)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      zIndex: 11
                    }}
                  >
                    <Cpu size={24} color="#FFFFFF" className="spin-icon" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                      AI ESTIMATING WATER DEPTH...
                    </span>
                  </div>
                )}

                {/* Bottom Photo Telemetry HUD */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 5
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(6px)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      color: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={12} color="#10B981" />
                    <span>{photoFileName}</span>
                  </div>

                  {cvResult && !isAnalyzingCV && (
                    <div
                      style={{
                        background: 'rgba(6, 182, 212, 0.9)',
                        color: '#080C14',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      CV Match: {cvResult.confidence}%
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Camera Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-take-live-photo"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#38BDF8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={14} />
                  <span>Take Live Photo</span>
                </button>

                <button
                  type="button"
                  id="btn-upload-gallery-photo"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} />
                  <span>Upload from Files</span>
                </button>
              </div>

              {/* Quick Preset Buttons for Instant Desktop Testing */}
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  Quick Test Presets (Desktop Simulation):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      id={`btn-preset-${preset.id}`}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        background: uploadedPhoto === preset.url ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: uploadedPhoto === preset.url ? '1px solid #06B6D4' : '1px solid var(--border-subtle)',
                        color: uploadedPhoto === preset.url ? '#38BDF8' : 'var(--text-secondary)',
                        fontSize: '0.68rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. VISUAL SUBMERSION ANCHOR DROPDOWN */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Visual Submersion Reference Object (SageMaker Anchor)
              </label>
              <select
                id="select-anchor-object"
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0D121F',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(ANCHOR_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculated Depth Preview Badge */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Water Depth:</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                  Status: {ANCHOR_MAP[anchor].severity.replace(/_/g, ' ')}
                </div>
              </div>
              <span
                id="badge-calculated-water-depth"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color:
                    ANCHOR_MAP[anchor].severity === 'CRITICAL_NO_ENTRY'
                      ? 'var(--status-critical)'
                      : ANCHOR_MAP[anchor].severity === 'MODERATE_RISK'
                      ? 'var(--status-caution)'
                      : 'var(--status-safe)'
                }}
                className="tabular-nums"
              >
                {ANCHOR_MAP[anchor].depth} cm
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-live-report"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow-cyan)',
                marginTop: '4px'
              }}
            >
              <Send size={16} />
              <span>Submit Live Photo & Pin to Map</span>
            </button>
          </form>
        ) : (
          /* WHATSAPP VOICE SIMULATOR TAB */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mic size={16} color="var(--brand-cyan)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                  Inbound WhatsApp Audio Note
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                "{voiceTranscript}"
              </p>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              Simulates Amazon Transcribe converting speech to text → Bedrock extracting location & depth anchor
              → CV Depth Estimator detecting "bonnet" → 72 cm Critical Hazard.
            </p>

            <button
              onClick={handleSimulateVoice}
              id="btn-process-voice-note"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
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

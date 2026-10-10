import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  MapPin,
  RefreshCw,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  ShieldCheck,
  Info
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
  // Live GPS Tracking State (strictly locked to commuter's current position)
  const [isLocating, setIsLocating] = useState(false)
  const [gpsCoords, setGpsCoords] = useState(null)
  const [roadName, setRoadName] = useState('')
  const [note, setNote] = useState('')

  // Live Camera State (strictly live photo from camera only)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [photoTimestamp, setPhotoTimestamp] = useState(null)
  const cameraInputRef = useRef(null)

  // Simple, intuitive water depth levels
  const WATER_LEVELS = [
    {
      id: 'SHALLOW',
      depth: 15,
      severity: 'PASSABLE',
      title: 'Shallow (~15 cm)',
      desc: 'Passable for all vehicles (tire rim)',
      color: '#188038',
      bg: '#E6F4EA'
    },
    {
      id: 'MEDIUM',
      depth: 30,
      severity: 'MODERATE_RISK',
      title: 'Medium (~30 cm)',
      desc: 'Dangerous for 2-wheelers & bikes (silencer)',
      color: '#B06000',
      bg: '#FEF7E0'
    },
    {
      id: 'HIGH',
      depth: 50,
      severity: 'CRITICAL_NO_ENTRY',
      title: 'High (~50 cm)',
      desc: 'Dangerous for cars & sedans (grille level)',
      color: '#C5221F',
      bg: '#FCE8E6'
    },
    {
      id: 'DEEP',
      depth: 75,
      severity: 'CRITICAL_NO_ENTRY',
      title: 'Submerged (~75+ cm)',
      desc: 'Road closed / impassable (bonnet level)',
      color: '#A50E0E',
      bg: '#FCE8E6'
    }
  ]

  const [selectedLevelId, setSelectedLevelId] = useState('MEDIUM')

  // Auto-trace live GPS coordinates whenever modal opens
  const traceCurrentGps = () => {
    if (!navigator.geolocation) {
      applyFallbackGps()
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy || 6)

        setGpsCoords({ lat, lng, accuracy: acc })
        setIsLocating(false)

        // Find nearest landmark to give commuter a friendly road label
        const landmarks = CITY_LANDMARKS[selectedCity] || []
        let nearest = null
        let minDistance = Infinity

        landmarks.forEach((lm) => {
          const d = calculateHaversineDistance(lat, lng, lm.lat, lm.lng)
          if (d < minDistance) {
            minDistance = d
            nearest = lm
          }
        })

        if (nearest && minDistance < 5) {
          setRoadName(`Near ${nearest.name}`)
        } else {
          setRoadName(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
        }
      },
      (err) => {
        console.warn('GPS trace error:', err.message)
        applyFallbackGps()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const applyFallbackGps = () => {
    setIsLocating(false)
    if (userLocation?.lat && userLocation?.lng) {
      setGpsCoords({
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy || 10
      })
      setRoadName(userLocation.name || `Current Location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`)
    } else {
      const cityCenter = CITY_CONFIGS[selectedCity]?.center || [12.9280, 77.6350]
      setGpsCoords({ lat: cityCenter[0], lng: cityCenter[1], accuracy: 25 })
      const landmarks = CITY_LANDMARKS[selectedCity] || []
      setRoadName(landmarks[0]?.name || 'Current Location')
    }
  }

  useEffect(() => {
    if (isOpen) {
      traceCurrentGps()
    }
  }, [isOpen, selectedCity])

  // Handle direct camera photo capture
  const handleCapturePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') {
        setCapturedPhoto(dataUrl)
        setPhotoTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRetakePhoto = () => {
    setCapturedPhoto(null)
    setPhotoTimestamp(null)
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  const selectedLevel = WATER_LEVELS.find((l) => l.id === selectedLevelId) || WATER_LEVELS[1]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!capturedPhoto) {
      alert('Please click a live photo from your camera before submitting.')
      return
    }

    const lat = gpsCoords?.lat || (CITY_CONFIGS[selectedCity]?.center[0] || 12.9280)
    const lng = gpsCoords?.lng || (CITY_CONFIGS[selectedCity]?.center[1] || 77.6350)

    const newInc = {
      id: `INC_LIVE_${Date.now()}`,
      roadName: roadName || 'Current Location',
      city: selectedCity,
      ward: 'Verified Live Citizen',
      lat: lat,
      lng: lng,
      accuracyM: gpsCoords?.accuracy || 6,
      depthCm: selectedLevel.depth,
      severity: selectedLevel.severity,
      source: 'CITIZEN_LIVE_CAMERA',
      author: 'Live Commuter (Verified GPS + Camera)',
      riskDescription: note ? `${selectedLevel.desc}. Note: ${note}` : selectedLevel.desc,
      reportedAt: 'Just now',
      photoUrl: capturedPhoto,
      pumpDispatched: selectedLevel.depth >= 35,
      pumpStatus: selectedLevel.depth >= 35 ? 'QUEUE_PENDING' : 'MONITORING',
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
        background: 'rgba(32, 33, 36, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
        fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header (Clean Google Maps Style) */}
        <div
          style={{
            padding: '18px 20px 14px 20px',
            borderBottom: '1px solid #E8EAED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#E8F0FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Camera size={20} color="#1A73E8" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#202124', margin: 0, lineHeight: 1.2 }}>
                Report Waterlogging
              </h2>
              <p style={{ fontSize: '12px', color: '#5F6368', margin: '2px 0 0 0' }}>
                Live camera photo & GPS verified report
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-report-modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5F6368',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable if needed) */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 20px 20px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* STEP 1: CURRENT LOCATION (GPS LOCKED) */}
          <div
            style={{
              background: '#F8F9FA',
              border: '1px solid #DADCE0',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#188038',
                    boxShadow: '0 0 6px rgba(24, 128, 56, 0.6)'
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#188038', letterSpacing: '0.02em' }}>
                  YOUR CURRENT LOCATION (GPS)
                </span>
              </div>

              <button
                type="button"
                onClick={traceCurrentGps}
                id="btn-refresh-gps-report"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #DADCE0',
                  color: '#1A73E8',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Refresh GPS"
              >
                <RefreshCw size={11} className={isLocating ? 'spin-icon' : ''} />
                <span>{isLocating ? 'Locating...' : 'Refresh'}</span>
              </button>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: '#202124', marginBottom: '2px' }}>
              {roadName || 'Detecting nearest road...'}
            </div>

            <div style={{ fontSize: '11.5px', color: '#5F6368', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {gpsCoords
                  ? `${gpsCoords.lat.toFixed(5)}° N, ${gpsCoords.lng.toFixed(5)}° E`
                  : 'Acquiring GPS fix...'}
              </span>
              {gpsCoords?.accuracy && (
                <span style={{ color: '#188038', fontWeight: 600 }}>
                  (±{gpsCoords.accuracy}m accuracy)
                </span>
              )}
            </div>

            <div style={{ marginTop: '8px' }}>
              <input
                type="text"
                id="input-report-roadname"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Add road details (e.g. Underpass exit, near flyover)"
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #DADCE0',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  color: '#202124',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* STEP 2: REAL-TIME CAMERA PHOTO (CAMERA ONLY) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#202124', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Camera size={14} color="#1A73E8" />
                <span>Real-Time Camera Photo</span>
                <span style={{ color: '#D93025' }}>*</span>
              </label>

              <span style={{ fontSize: '11px', color: '#188038', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ShieldCheck size={12} />
                <span>Camera Only (Verified)</span>
              </span>
            </div>

            {/* Hidden native camera capture input */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              id="input-camera-only"
              style={{ display: 'none' }}
              onChange={handleCapturePhoto}
            />

            {!capturedPhoto ? (
              /* Camera Trigger Card */
              <div
                onClick={() => cameraInputRef.current?.click()}
                id="btn-trigger-camera"
                style={{
                  border: '2px dashed #1A73E8',
                  borderRadius: '12px',
                  background: '#F8FAFD',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#E8F0FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera size={24} color="#1A73E8" />
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A73E8' }}>
                  Tap to Take Live Photo
                </div>

                <div style={{ fontSize: '11.5px', color: '#5F6368', maxWidth: '280px', lineHeight: 1.4 }}>
                  Only live photos from your device camera are accepted to ensure verified, reliable reports.
                </div>
              </div>
            ) : (
              /* Captured Photo Preview Card */
              <div
                style={{
                  border: '1px solid #DADCE0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#000000',
                  position: 'relative'
                }}
              >
                <img
                  src={capturedPhoto}
                  alt="Live flood evidence"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

                {/* Overlaid Verified Tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(24, 128, 56, 0.9)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>Verified Camera Photo ({photoTimestamp || 'Just now'})</span>
                </div>

                {/* Retake Button */}
                <button
                  type="button"
                  id="btn-retake-photo"
                  onClick={handleRetakePhoto}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(32, 33, 36, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Retake</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: WATER LEVEL SELECTION (4 SIMPLE TAP CARDS) */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#202124', display: 'block', marginBottom: '8px' }}>
              Water Level on Road
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {WATER_LEVELS.map((level) => {
                const isSelected = selectedLevelId === level.id
                return (
                  <div
                    key={level.id}
                    id={`card-level-${level.id}`}
                    onClick={() => setSelectedLevelId(level.id)}
                    style={{
                      border: isSelected ? `2px solid ${level.color}` : '1px solid #DADCE0',
                      background: isSelected ? level.bg : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '10px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? level.color : '#202124' }}>
                        {level.title}
                      </span>
                      {isSelected && <CheckCircle2 size={14} color={level.color} />}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5F6368', lineHeight: 1.3 }}>
                      {level.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* STEP 4: QUICK NOTE (OPTIONAL) */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5F6368', display: 'block', marginBottom: '4px' }}>
              Additional Details (Optional)
            </label>
            <input
              type="text"
              id="input-report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Underpass entrance blocked, 1 auto stalled"
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid #DADCE0',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12.5px',
                color: '#202124',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div style={{ marginTop: '4px' }}>
            <button
              type="submit"
              id="btn-submit-live-report"
              disabled={!capturedPhoto}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '24px',
                border: 'none',
                background: capturedPhoto ? '#1A73E8' : '#DADCE0',
                color: capturedPhoto ? '#FFFFFF' : '#80868B',
                fontWeight: 700,
                fontSize: '14px',
                cursor: capturedPhoto ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: capturedPhoto ? '0 2px 8px rgba(26, 115, 232, 0.35)' : 'none',
                transition: 'background 0.2s'
              }}
            >
              <Send size={15} />
              <span>{capturedPhoto ? 'Submit Verified Flood Report' : 'Take Camera Photo to Submit'}</span>
            </button>

            {!capturedPhoto && (
              <p style={{ fontSize: '11px', color: '#D93025', textAlign: 'center', margin: '6px 0 0 0' }}>
                * A live camera photo is required to ensure trusted crowd reporting
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

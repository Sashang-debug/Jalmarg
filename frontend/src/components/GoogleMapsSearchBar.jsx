import React, { useState, useRef, useEffect } from 'react'
import { Menu, Search, Navigation2, X, Bike, Car, Truck, Droplets, AlertTriangle, Volume2, TrafficCone } from 'lucide-react'
import { CITY_LANDMARKS, MULTI_CITY_INCIDENTS } from '../data/mockTelemetry'

export default function GoogleMapsSearchBar({
  selectedCity,
  onOpenDirections,
  onSelectDestination,
  onToggleMenu,
  vehicle,
  setVehicle,
  showPotholes,
  setShowPotholes,
  audioRadarActive,
  setAudioRadarActive,
  showTraffic,
  setShowTraffic,
  onOpenReportModal
}) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const landmarks = CITY_LANDMARKS[selectedCity] || []
  const incidents = MULTI_CITY_INCIDENTS[selectedCity] || []

  // Close suggestions dropdown when clicking anywhere outside (using capture phase so Google Maps canvas cannot swallow event)
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
        if (inputRef.current) {
          inputRef.current.blur()
        }
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsFocused(false)
        if (inputRef.current) {
          inputRef.current.blur()
        }
      }
    }

    // Capture phase (true) intercepts events before Google Maps / Leaflet can call stopPropagation()
    window.addEventListener('mousedown', handleClickOutside, true)
    window.addEventListener('pointerdown', handleClickOutside, true)
    window.addEventListener('touchstart', handleClickOutside, true)
    window.addEventListener('click', handleClickOutside, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('pointerdown', handleClickOutside, true)
      window.removeEventListener('touchstart', handleClickOutside, true)
      window.removeEventListener('click', handleClickOutside, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Filter landmarks and incidents as user types
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    const q = query.toLowerCase()
    const matchedLandmarks = landmarks.filter(l => l.name.toLowerCase().includes(q))
    const matchedIncidents = incidents.filter(i => i.roadName.toLowerCase().includes(q))
    setSuggestions([...matchedLandmarks, ...matchedIncidents.map(i => ({ name: i.roadName, lat: i.lat, lng: i.lng, isHazard: true, depthCm: i.depthCm }))])
  }, [query, selectedCity])

  const handleSelect = (item) => {
    setQuery(item.name)
    setIsFocused(false)
    onSelectDestination({
      name: item.name,
      lat: item.lat,
      lng: item.lng
    })
    onOpenDirections()
  }

  const handleDirectionsClick = () => {
    setIsFocused(false)
    if (query.trim() && suggestions.length > 0) {
      handleSelect(suggestions[0])
    } else {
      onOpenDirections()
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto'
      }}
    >
      {/* 1. Google Maps Search Pill */}
      <div style={{
        width: '392px',
        maxWidth: 'calc(100vw - 32px)',
        height: '48px',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.22), 0 0 1px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px 0 12px',
        position: 'relative',
        transition: 'box-shadow 0.2s',
        border: isFocused ? '1px solid #1A73E8' : '1px solid rgba(0,0,0,0.06)'
      }}>
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleMenu}
          title="Menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5F6368',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={`Search ${selectedCity === 'BLR' ? 'Bengaluru' : selectedCity === 'DEL' ? 'Delhi' : 'Mumbai'}, hazards...`}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: '#202124',
            background: 'transparent',
            marginLeft: '8px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#70757A',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        )}

        <div style={{ width: '1px', height: '24px', background: '#DADCE0', margin: '0 6px' }} />

        {/* Search Icon */}
        <button
          onClick={handleDirectionsClick}
          title="Search"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5F6368',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F1F3F4'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Search size={18} />
        </button>

        {/* Circular Google Blue Directions Button */}
        <button
          onClick={handleDirectionsClick}
          title="Directions"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#1A73E8',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'background 0.15s, transform 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#155724'; e.currentTarget.style.background = '#1558D6'; }}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1A73E8'}
        >
          <Navigation2 size={18} style={{ transform: 'rotate(45deg)' }} />
        </button>

        {/* Auto-complete Dropdown */}
        {isFocused && (suggestions.length > 0 || landmarks.length > 0) && (
          <div style={{
            position: 'absolute',
            top: '54px',
            left: 0,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            padding: '8px 0',
            maxHeight: '320px',
            overflowY: 'auto',
            border: '1px solid #E8EAED',
            zIndex: 1000
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#70757A',
              padding: '6px 16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {query ? 'Matching Locations' : `Popular Destinations (${selectedCity})`}
            </div>

            {(query ? suggestions : landmarks.slice(0, 6)).map((item, idx) => (
              <div
                key={idx}
                onMouseDown={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #F1F3F4'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: item.isHazard ? '#FCE8E6' : '#E8F0FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.isHazard ? (
                    <Droplets size={15} color="#D93025" />
                  ) : (
                    <Navigation2 size={15} color="#1A73E8" />
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#202124', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: item.isHazard ? '#D93025' : '#70757A' }}>
                    {item.isHazard ? `⚠️ Waterlogged: ${item.depthCm} cm flood depth` : 'Popular Landmark'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Floating Quick Category Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        maxWidth: 'calc(100vw - 32px)',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {/* 2-Wheeler Mode */}
        <button
          onClick={() => { setVehicle('BIKE'); onOpenDirections(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: vehicle === 'BIKE' ? '#1A73E8' : '#FFFFFF',
            color: vehicle === 'BIKE' ? '#FFFFFF' : '#3C4043',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s'
          }}
        >
          <Bike size={13} />
          <span>2-Wheeler (&lt;20cm)</span>
        </button>

        {/* Sedan / Car */}
        <button
          onClick={() => { setVehicle('SEDAN'); onOpenDirections(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: vehicle === 'SEDAN' ? '#1A73E8' : '#FFFFFF',
            color: vehicle === 'SEDAN' ? '#FFFFFF' : '#3C4043',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap'
          }}
        >
          <Car size={13} />
          <span>Car (&lt;30cm)</span>
        </button>

        {/* SUV */}
        <button
          onClick={() => { setVehicle('SUV'); onOpenDirections(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: vehicle === 'SUV' ? '#1A73E8' : '#FFFFFF',
            color: vehicle === 'SUV' ? '#FFFFFF' : '#3C4043',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap'
          }}
        >
          <Truck size={13} />
          <span>SUV (&lt;55cm)</span>
        </button>

        {/* Potholes toggle chip */}
        <button
          onClick={() => setShowPotholes(!showPotholes)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: showPotholes ? '#EDE7F6' : '#FFFFFF',
            color: showPotholes ? '#673AB7' : '#3C4043',
            border: showPotholes ? '1px solid #B39DDB' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap'
          }}
        >
          <AlertTriangle size={13} color={showPotholes ? '#673AB7' : '#5F6368'} />
          <span>Potholes</span>
        </button>

        {/* Audio Radar chip */}
        <button
          onClick={() => setAudioRadarActive(!audioRadarActive)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: audioRadarActive ? '#E6F4EA' : '#FFFFFF',
            color: audioRadarActive ? '#137333' : '#3C4043',
            border: audioRadarActive ? '1px solid #CEEAD6' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap'
          }}
        >
          <Volume2 size={13} color={audioRadarActive ? '#137333' : '#5F6368'} />
          <span>Audio Radar</span>
        </button>

        {/* Google Traffic chip */}
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: showTraffic ? '#FEF7E0' : '#FFFFFF',
            color: showTraffic ? '#B06000' : '#3C4043',
            border: showTraffic ? '1px solid #FEEFC3' : '1px solid rgba(0,0,0,0.12)',
            borderRadius: '16px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap'
          }}
        >
          <TrafficCone size={13} color={showTraffic ? '#B06000' : '#5F6368'} />
          <span>Traffic</span>
        </button>
      </div>
    </div>
  )
}

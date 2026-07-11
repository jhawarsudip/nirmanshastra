'use client'

import { useState } from 'react'
import RegistrationForm from './components/RegistrationForm'
import FloorPlanCanvas from './components/FloorPlanCanvas'
import RoomPanel from './components/RoomPanel'
import AnalysisResults from './components/AnalysisResults'
import CompassWheel from './components/CompassWheel'
import {
  getZoneIndex,
  getSeverity,
  buildMarkerKey,
  analyseLayout,
  ROOMS,
  type PlacedMarker,
  type VastuAnalysis,
} from './vastu-engine'
import VastuBackground from '@/components/backgrounds/VastuBackground'

type Step = 'register' | 'plan' | 'results'

type RegData = {
  name: string
  email: string
  city: string
  state: string
  propertyType: string
  plotSize: string
}

type ContactData = RegData & { contactId: string }

const CANVAS_SIZE = 480

function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'register', label: 'REGISTER' },
    { key: 'plan',     label: 'PLAN' },
    { key: 'results',  label: 'RESULTS' },
  ]
  const idx = { register: 0, plan: 1, results: 2 }[current]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done   = i < idx
        const active = i === idx
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                style={{
                  background:   active ? '#1F4E79' : done ? '#14532D' : 'transparent',
                  borderColor:  active ? '#1F4E79' : done ? '#14532D' : 'rgba(30,34,39,0.22)',
                  color:        active || done ? '#fff' : 'rgba(30,34,39,0.35)',
                  fontFamily:   'var(--font-plex-mono)',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="text-[11px] uppercase tracking-widest whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  color: active ? '#1F4E79' : done ? '#14532D' : 'rgba(30,34,39,0.32)',
                }}
              >
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className="w-6 h-px mx-2" style={{ background: 'rgba(30,34,39,0.14)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function VastuProPage() {
  const [step,               setStep]               = useState<Step>('register')
  const [contact,            setContact]            = useState<ContactData | null>(null)
  const [northDeg,           setNorthDeg]           = useState(0)
  const [markers,            setMarkers]            = useState<PlacedMarker[]>([])
  const [roomCounts,         setRoomCounts]         = useState<Record<string, number>>({})
  const [selectedRoomKey,    setSelectedRoomKey]    = useState<string | null>(null)
  const [selectedMarkerKey,  setSelectedMarkerKey]  = useState<string | null>(null)
  const [analysis,           setAnalysis]           = useState<VastuAnalysis | null>(null)
  const [analyseError,       setAnalyseError]       = useState('')

  function handleRegistration(data: RegData, contactId: string) {
    setContact({ ...data, contactId })
    setStep('plan')
  }

  function handlePlace(x: number, y: number) {
    if (!selectedRoomKey) return
    const room = ROOMS.find(r => r.key === selectedRoomKey)
    if (!room) return
    const count = roomCounts[selectedRoomKey] ?? 0
    if (!room.multiInstance && count >= 1) return

    const zoneIndex = getZoneIndex(x, y, CANVAS_SIZE / 2, CANVAS_SIZE / 2, northDeg)
    const severity  = getSeverity(selectedRoomKey, zoneIndex)
    const key       = buildMarkerKey(selectedRoomKey, roomCounts)

    setMarkers(prev => [...prev, { key, roomKey: selectedRoomKey, x, y, zoneIndex, severity }])
    setRoomCounts(prev => ({ ...prev, [selectedRoomKey]: count + 1 }))
    if (!room.multiInstance) setSelectedRoomKey(null)
  }

  function handleRemoveMarker(key: string) {
    const marker = markers.find(m => m.key === key)
    if (!marker) return
    setMarkers(prev => prev.filter(m => m.key !== key))
    setRoomCounts(prev => ({
      ...prev,
      [marker.roomKey]: Math.max(0, (prev[marker.roomKey] ?? 1) - 1),
    }))
    if (selectedMarkerKey === key) setSelectedMarkerKey(null)
  }

  function handleAnalyse() {
    if (markers.length === 0) {
      setAnalyseError('Place at least one room marker before analysing.')
      return
    }
    setAnalyseError('')
    const result = analyseLayout(markers)
    setAnalysis(result)
    setStep('results')
    if (contact) {
      fetch('/api/vastu-pro/update-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contactId: contact.contactId, status: 'analysed' }),
      }).catch(console.error)
    }
  }

  function handleStartOver() {
    setStep('plan')
    setMarkers([])
    setRoomCounts({})
    setSelectedRoomKey(null)
    setSelectedMarkerKey(null)
    setAnalysis(null)
    setNorthDeg(0)
  }

  // ── Step: Register ───────────────────────────────────────────────────────────
  if (step === 'register') {
    return <RegistrationForm onSubmit={handleRegistration} />
  }

  // ── Step: Results ────────────────────────────────────────────────────────────
  if (step === 'results' && analysis) {
    return (
      <AnalysisResults
        analysis={analysis}
        contactName={contact?.name ?? ''}
        northDeg={northDeg}
        markerCount={markers.length}
        onStartOver={handleStartOver}
      />
    )
  }

  // ── Step: Plan ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#1E2227', position: 'relative' }}>
      <VastuBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Page header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'var(--font-plex-mono)' }}
            >
              NIRMANSHASTRA · VASTUPRO
            </p>
            <h1
              className="font-bold"
              style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,28px)' }}
            >
              Mark Your Rooms
            </h1>
          </div>
          <StepBar current="plan" />
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <p
          className="text-[13px]"
          style={{ color: 'rgba(244,244,240,0.45)', fontFamily: 'var(--font-plex-sans)' }}
        >
          Select a room from the panel → click on the floor plan to place it. Set North direction with the compass wheel before placing rooms.
        </p>
      </div>

      {/* Main layout: room panel | canvas | compass + analyse */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Desktop: 3-column grid. Mobile: stacked. */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_220px] gap-4 items-start">

          {/* ── Room panel ─────────────────────────────────────────────────── */}
          <div className="lg:h-[560px] order-3 lg:order-1">
            <RoomPanel
              selectedRoomKey={selectedRoomKey}
              onSelectRoom={key => {
                setSelectedRoomKey(key)
                setSelectedMarkerKey(null)
              }}
              roomCounts={roomCounts}
              selectedMarkerKey={selectedMarkerKey}
              markers={markers}
              onRemoveMarker={handleRemoveMarker}
            />
          </div>

          {/* ── Canvas ─────────────────────────────────────────────────────── */}
          <div className="order-1 lg:order-2">
            <FloorPlanCanvas
              northDeg={northDeg}
              markers={markers}
              selectedMarkerKey={selectedMarkerKey}
              selectedRoomKey={selectedRoomKey}
              onPlace={handlePlace}
              onSelectMarker={key => {
                setSelectedMarkerKey(key)
                if (key) setSelectedRoomKey(null)
              }}
            />
          </div>

          {/* ── Compass + Analyse ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 order-2 lg:order-3">
            {/* Compass card */}
            <div
              className="rounded-[2px] p-4"
              style={{ background: '#1E2227', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <p
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-plex-mono)' }}
              >
                NORTH DIRECTION
              </p>
              <div className="flex justify-center mb-3">
                <CompassWheel northDeg={northDeg} onChange={setNorthDeg} />
              </div>
              <div className="text-center mb-3">
                <span
                  style={{ color: '#C9A84C', fontFamily: 'var(--font-plex-mono)', fontSize: 20, fontWeight: 500 }}
                >
                  {Math.round(northDeg)}°
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: 'rgba(244,244,240,0.5)', fontFamily: 'var(--font-plex-sans)' }}
              >
                Stand at the exact centre of your house (the Brahmasthan — marked in gold).
                Open your phone compass app while standing there and note the direction.
                Rotate this wheel to match that reading.
              </p>
              <p
                className="text-[10px] mt-2"
                style={{ color: 'rgba(201,168,76,0.35)', fontFamily: 'var(--font-plex-mono)' }}
              >
                ✦ Degree measured from the Brahmasthan (centre).
              </p>
            </div>

            {/* Rooms placed count */}
            {markers.length > 0 && (
              <div
                className="rounded-[2px] px-4 py-3"
                style={{ background: '#1E2227', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                <p
                  className="text-[9px] uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  PLACED
                </p>
                <p
                  style={{ color: '#C9A84C', fontFamily: 'var(--font-plex-mono)', fontSize: 22, fontWeight: 500 }}
                >
                  {markers.length}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: 'rgba(244,244,240,0.45)', fontFamily: 'var(--font-plex-sans)' }}
                >
                  room{markers.length !== 1 ? 's' : ''} marked
                </p>
              </div>
            )}

            {/* Analyse button */}
            <div>
              {analyseError && (
                <p
                  className="text-[11px] mb-2"
                  style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}
                >
                  ⚠ {analyseError}
                </p>
              )}
              <button
                onClick={handleAnalyse}
                disabled={markers.length === 0}
                className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
              >
                Analyse My Floor Plan →
              </button>
              <p
                className="text-[11px] mt-2 text-center"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}
              >
                Place at least 1 room · More rooms = better accuracy
              </p>
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  )
}

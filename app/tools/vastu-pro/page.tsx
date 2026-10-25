'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RegistrationForm, { type RegistrationData } from './components/RegistrationForm'
import FloorPlanCanvas, { CANVAS_SIZE } from './components/FloorPlanCanvas'
import RoomPanel from './components/RoomPanel'
import AnalysisResults from './components/AnalysisResults'
import NorthCard from './components/NorthCard'
import {
  getZoneIndex,
  getSeverity,
  buildMarkerKey,
  analyseLayout,
  ROOMS,
  type PlacedMarker,
  type VastuAnalysis,
} from './vastu-engine'
import { ToolHead, StepBar, Note, IcArrow } from '@/components/v2/inner/kit'
import { TOOLS } from '@/lib/v2/content'
import { useCalm } from '@/lib/v2/store'
import '@/styles/v2/vastu.css'

type Step = 'register' | 'plan' | 'results'
type ContactData = RegistrationData & { contactId: string }

const STEPS = ['About you', 'Your plan', 'Your reading']
const STEP_IX: Record<Step, number> = { register: 0, plan: 1, results: 2 }

const stepVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: -18, transition: { duration: 0.18, ease: 'easeIn' as const } },
}
const calmVariants = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0, transition: { duration: 0 } },
  exit:    { opacity: 1, x: 0, transition: { duration: 0 } },
}

export default function VastuProPage() {
  const tool = TOOLS.find(t => t.key === 'vastu')!
  const calm = useCalm()
  const v = calm ? calmVariants : stepVariants

  const [step,               setStep]               = useState<Step>('register')
  const [contact,            setContact]            = useState<ContactData | null>(null)
  const [northDeg,           setNorthDeg]           = useState(0)
  const [markers,            setMarkers]            = useState<PlacedMarker[]>([])
  const [roomCounts,         setRoomCounts]         = useState<Record<string, number>>({})
  const [selectedRoomKey,    setSelectedRoomKey]    = useState<string | null>(null)
  const [selectedMarkerKey,  setSelectedMarkerKey]  = useState<string | null>(null)
  const [analysis,           setAnalysis]           = useState<VastuAnalysis | null>(null)
  const [analyseError,       setAnalyseError]       = useState('')
  const sheetRef = useRef<HTMLDivElement>(null)

  // a fresh screen always starts at the top
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  function handleRegistration(data: RegistrationData, contactId: string) {
    setContact({ ...data, contactId })
    setStep('plan')
  }

  function handleSelectRoom(key: string | null) {
    setSelectedRoomKey(key)
    setSelectedMarkerKey(null)
    // On a phone the plan sits below the list: bring it into view so the next tap lands on it.
    if (key && typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      sheetRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
    }
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
    setAnalyseError('')
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

  // Turning the dial changes which zone each placed room falls in, so every marker is worked out again from where it was tapped.
  function handleNorthChange(deg: number) {
    setNorthDeg(deg)
    setMarkers(prev => prev.map(m => {
      const zoneIndex = getZoneIndex(m.x, m.y, CANVAS_SIZE / 2, CANVAS_SIZE / 2, deg)
      return { ...m, zoneIndex, severity: getSeverity(m.roomKey, zoneIndex) }
    }))
  }

  function handleAnalyse() {
    if (markers.length === 0) {
      setAnalyseError('Place at least one room on the plan first.')
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

  // Back to the plan with everything still on it, so a room can be moved and the plan read again.
  function handleBackToPlan() {
    setStep('plan')
    setSelectedRoomKey(null)
    setSelectedMarkerKey(null)
    setAnalysis(null)
  }

  return (
    <div className="ns-i-wrap ns-i-page ns-v" style={{ ['--tc' as string]: 'var(--ns-t-vastu)' }}>
      {step !== 'results' && (
        <ToolHead
          eyebrow="Before you build · Layout"
          name={tool.name}
          price="Free"
          blurb="Set where North is, mark each room on your plan, and see how the Vastu tradition rates its place among the 16 zones. Free, with a PDF of your findings."
          art={tool.plate}
          artAlt={tool.plateAlt}
        />
      )}
      <StepBar steps={STEPS} current={STEP_IX[step]} />

      <AnimatePresence mode="wait">
        {step === 'register' && (
          <motion.div key="register" variants={v} initial="initial" animate="animate" exit="exit" className="ns-v-narrow">
            <RegistrationForm onSubmit={handleRegistration} />
          </motion.div>
        )}

        {step === 'plan' && (
          <motion.div key="plan" variants={v} initial="initial" animate="animate" exit="exit">
            <ol className="ns-v-how">
              <li><span><b>Set North.</b> Tell us which way North lies on your drawing.</span></li>
              <li><span><b>Pick a room</b> from the list.</span></li>
              <li><span><b>Tap the plan</b> where that room is. Do this for every room.</span></li>
            </ol>

            <div className="ns-v-plan">
              <div className="ns-v-area-compass">
                <NorthCard northDeg={northDeg} onChange={handleNorthChange} />
              </div>

              <div className="ns-v-area-rooms">
                <RoomPanel
                  selectedRoomKey={selectedRoomKey}
                  onSelectRoom={handleSelectRoom}
                  roomCounts={roomCounts}
                  selectedMarkerKey={selectedMarkerKey}
                  markers={markers}
                  onRemoveMarker={handleRemoveMarker}
                  onCloseMarker={() => setSelectedMarkerKey(null)}
                />
              </div>

              <div className="ns-v-area-sheet" ref={sheetRef}>
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

              <div className="ns-v-area-go">
                <div className="ns-plate ns-v-go">
                  <p className="ns-v-go__count"><b>{markers.length}</b> room{markers.length !== 1 ? 's' : ''} placed</p>
                  {analyseError && <Note kind="err">{analyseError}</Note>}
                  <div className="ns-i-btn--block">
                    <button type="button" className="ns-btn" onClick={handleAnalyse} disabled={markers.length === 0}>
                      Read my plan
                      <IcArrow width={22} height={11} />
                    </button>
                  </div>
                  <p className="ns-i-fine">Place at least one room. The more rooms you mark, the fuller the reading.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && analysis && (
          <motion.div key="results" variants={v} initial="initial" animate="animate" exit="exit">
            <AnalysisResults
              analysis={analysis}
              contactName={contact?.name ?? ''}
              northDeg={northDeg}
              markers={markers}
              onBackToPlan={handleBackToPlan}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

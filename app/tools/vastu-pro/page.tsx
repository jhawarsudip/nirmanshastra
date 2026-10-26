'use client'

import { trackCalculatorUsed } from '@/lib/analytics/events'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PlanEditor, { bearingOfDoor, placementOf, type EditorMode } from './components/PlanEditor'
import HouseControls from './components/HouseControls'
import DoorPanel from './components/DoorPanel'
import RoomPicker, { type PlacementNote } from './components/RoomPicker'
import NorthCard from './components/NorthCard'
import AnalysisResults from './components/AnalysisResults'
import { CATALOGUE, DOOR_KINDS } from './vastu-catalogue'
import { SHEET_UNITS, newItemId, rectangleOutline, type DoorMark, type PlacedItem, type PlanImage } from './vastu-model'
import { minAreaRect, zoneOfBearing, type Poly } from './vastu-geometry'
import { ZONES } from './vastu-rules'
import { ringSides, readPlan } from './vastu-reading'
import type { Reading } from './vastu-types'
import { ToolHead, StepBar, Note, IcArrow } from '@/components/v2/inner/kit'
import { TOOLS } from '@/lib/v2/content'
import { useCalm } from '@/lib/v2/store'
import '@/styles/v2/vastu.css'

// The plan comes first and the reading second. No name or email is asked before the reading; the email is asked only
// on the results screen, to send the PDF.
type Step = 'plan' | 'results'

const STEPS = ['Your plan', 'Your reading']
const STEP_IX: Record<Step, number> = { plan: 0, results: 1 }

const MODES: { key: Exclude<EditorMode, 'view'>; label: string }[] = [
  { key: 'outline', label: 'House outline' },
  { key: 'door', label: 'Doors' },
  { key: 'rooms', label: 'Rooms' },
]

const ZONE_NAMES = ZONES.map(z => z.short)

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

const catalogueForEditor = CATALOGUE

export default function VastuProPage() {
  const tool = TOOLS.find(t => t.key === 'vastu')!
  const calm = useCalm()
  const v = calm ? calmVariants : stepVariants

  const [step,            setStep]            = useState<Step>('plan')
  const [mode,            setMode]            = useState<Exclude<EditorMode, 'view'>>('outline')
  const [northDeg,        setNorthDeg]        = useState(0)
  const [house,           setHouse]           = useState<Poly>(() => rectangleOutline(40, 30))
  const [items,           setItems]           = useState<PlacedItem[]>([])
  const [doors,           setDoors]           = useState<DoorMark[]>([])
  const [image,           setImage]           = useState<PlanImage | null>(null)
  const [selectedId,      setSelectedId]      = useState<string | null>(null)
  const [selectedVertex,  setSelectedVertex]  = useState<number | null>(null)
  const [activeDoor,      setActiveDoor]      = useState('main_door')
  const [reading,         setReading]         = useState<Reading | null>(null)
  const [error,           setError]           = useState('')
  const sheetRef = useRef<HTMLDivElement>(null)

  // a fresh screen always starts at the top
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  // Free the picture's temporary address when the page goes away.
  const imageRef = useRef<PlanImage | null>(null)
  imageRef.current = image
  useEffect(() => () => { if (imageRef.current) URL.revokeObjectURL(imageRef.current.src) }, [])

  function changeMode(next: Exclude<EditorMode, 'view'>) {
    setMode(next)
    setSelectedId(null)
    setSelectedVertex(null)
    setError('')
  }

  function bringSheetIntoView() {
    // On a phone the sheet sits below the list: bring it into view so the next drag lands on it.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches) {
      sheetRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
    }
  }

  function addItem(kind: string) {
    const c = CATALOGUE[kind]
    if (!c) return
    const n = items.length % 5
    const id = newItemId(kind, items)
    const next: PlacedItem = {
      id,
      kind,
      x: SHEET_UNITS / 2 - c.w / 2 + (n - 2) * 16,
      y: SHEET_UNITS / 2 - c.h / 2 + (n - 2) * 16,
      w: c.w,
      h: c.h,
    }
    setItems(prev => [...prev, next])
    setSelectedId(id)
    setError('')
    bringSheetIntoView()
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function nudgeSize(id: string, dw: number, dh: number) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, w: Math.max(18, Math.min(SHEET_UNITS, i.w + dw)), h: Math.max(18, Math.min(SHEET_UNITS, i.h + dh)) } : i)))
  }

  function removeDoor(kind: string) {
    setDoors(prev => prev.filter(d => d.kind !== kind))
    if (selectedId === kind) setSelectedId(null)
  }

  // Where each item sits against the completed rectangle of the house, for the short notes in the lists.
  const itemNotes = useMemo(() => {
    const out: Record<string, PlacementNote> = {}
    for (const it of items) {
      const p = placementOf(it, house, northDeg)
      const where = p.primaryZone < 0 ? 'Brahmasthan (centre)' : `${ZONES[p.primaryZone].full} (${ZONES[p.primaryZone].short})`
      const also = p.alsoIn.length ? `also ${p.alsoIn.map(z => ZONES[z].short).join(', ')}` : undefined
      out[it.id] = { where, also, centre: p.centreShare >= 0.25 && p.primaryZone >= 0, borderline: p.borderline }
    }
    return out
  }, [items, house, northDeg])

  const doorNotes = useMemo(() => {
    const out: Record<string, string> = {}
    for (const d of doors) out[d.kind] = ZONES[zoneOfBearing(bearingOfDoor(d, house, northDeg))].short
    return out
  }, [doors, house, northDeg])

  const chipOf = (id: string): string | undefined => {
    const n = itemNotes[id]
    if (n) {
      const m = /\(([A-Z]+)\)$/.exec(n.where)
      return m ? m[1] : n.where.startsWith('Brahma') ? 'Centre' : undefined
    }
    return doorNotes[id]
  }

  const diagonal = useMemo(() => ringSides(minAreaRect(house), northDeg) === null, [house, northDeg])

  const hasMain = doors.some(d => d.kind === 'main_door')
  const placedCount = items.length + doors.length

  function handleRead() {
    if (placedCount === 0) {
      setError('Mark at least one door or room on the plan first.')
      return
    }
    setError('')
    setReading(readPlan({ house, northDeg, items, doors }))
    setStep('results')
    trackCalculatorUsed('vastupro') // a free tool produced a result
  }

  // Back to the plan with everything still on it, so a room can be moved and the plan read again.
  function handleBackToPlan() {
    setStep('plan')
    setSelectedId(null)
    setReading(null)
  }

  const sheetTitle = mode === 'outline' ? 'Outline of the house' : mode === 'door' ? 'Doors' : 'Rooms'
  const sheetStatus =
    mode === 'outline'
      ? 'Drag the green corners to match your plan. Tap a + on an edge to add a corner.'
      : mode === 'door'
        ? diagonal
          ? 'The plot sits about 45° to the compass, so the position along each side is not read. The door is still read by its direction.'
          : `Choose a door in the list, then tap the outline where it is. The coloured bars are the old positions along each side.`
        : items.length === 0
          ? 'Add a room from the list, then drag it to where it sits on your plan.'
          : 'Drag a room to move it. Drag the dot at its corner to resize it.'

  return (
    <div className="ns-i-wrap ns-i-page ns-v" style={{ ['--tc' as string]: 'var(--ns-t-vastu)' }}>
      {step !== 'results' && (
        <ToolHead
          eyebrow="Before you build · Layout"
          name={tool.name}
          price="Free"
          blurb="Set where North is, draw the outline of your house, mark the doors and rooms, and see how the Vastu texts and teachers read each place. Free. You see the reading first; an email is asked only if you want the PDF."
          art={tool.plate}
          artAlt={tool.plateAlt}
        />
      )}
      <StepBar steps={STEPS} current={STEP_IX[step]} />

      <AnimatePresence mode="wait">
        {step === 'plan' && (
          <motion.div key="plan" variants={v} initial="initial" animate="animate" exit="exit">
            <ol className="ns-v-how">
              <li><span><b>Set North and draw the house.</b> Match the outline to your plan.</span></li>
              <li><span><b>Tap where the doors are.</b> The main door matters most.</span></li>
              <li><span><b>Add each room</b> and drag it to where it sits.</span></li>
            </ol>

            <div className="ns-v-modes" role="group" aria-label="What you are marking">
              {MODES.map((m, i) => (
                <button key={m.key} type="button" className="ns-v-seg__b" aria-pressed={mode === m.key} onClick={() => changeMode(m.key)}>
                  <span className="ns-v-modes__n" aria-hidden="true">{i + 1}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="ns-v-plan" data-mode={mode}>
              <div className="ns-v-area-compass">
                <NorthCard northDeg={northDeg} onChange={setNorthDeg} />
              </div>

              <div className="ns-v-area-rooms">
                {mode === 'outline' && (
                  <HouseControls
                    house={house}
                    onHouse={setHouse}
                    selectedVertex={selectedVertex}
                    onSelectVertex={setSelectedVertex}
                    image={image}
                    onImage={setImage}
                  />
                )}
                {mode === 'door' && (
                  <DoorPanel
                    doors={doors}
                    active={activeDoor}
                    onActive={k => { setActiveDoor(k); bringSheetIntoView() }}
                    onRemove={removeDoor}
                    notes={doorNotes}
                    diagonal={diagonal}
                  />
                )}
                {mode === 'rooms' && (
                  <RoomPicker
                    items={items}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onAdd={addItem}
                    onRemove={removeItem}
                    onNudgeSize={nudgeSize}
                    notes={itemNotes}
                  />
                )}
              </div>

              <div className="ns-v-area-sheet" ref={sheetRef}>
                <div className="ns-plate ns-v-sheet">
                  <div className="ns-v-sheet__head">
                    <h2>{sheetTitle}</h2>
                    {mode === 'door' && (
                      <span className="ns-v-placing">Placing the {(DOOR_KINDS.find(k => k.key === activeDoor)?.label ?? 'door').toLowerCase()}</span>
                    )}
                  </div>
                  <div className="ns-v-canvaswrap">
                    <PlanEditor
                      mode={mode}
                      house={house}
                      onHouse={setHouse}
                      northDeg={northDeg}
                      items={items}
                      onItems={setItems}
                      doors={doors}
                      onDoors={setDoors}
                      catalogue={catalogueForEditor}
                      activeDoorKind={activeDoor}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      image={image}
                      zoneNames={ZONE_NAMES}
                      chipOf={chipOf}
                      selectedVertex={selectedVertex}
                      onSelectVertex={setSelectedVertex}
                    />
                  </div>
                  <div className="ns-v-sheet__foot">
                    <p className="ns-v-sheet__status">{sheetStatus}</p>
                  </div>
                </div>
              </div>

              <div className="ns-v-area-go">
                <div className="ns-plate ns-v-go">
                  <p className="ns-v-go__count">
                    <b>{placedCount}</b>
                    <span>{items.length} room{items.length !== 1 ? 's' : ''}, {doors.length} door{doors.length !== 1 ? 's' : ''}</span>
                  </p>
                  {error && <Note kind="err">{error}</Note>}
                  <div className="ns-i-btn--block">
                    <button type="button" className="ns-btn" onClick={handleRead} disabled={placedCount === 0}>
                      Read my plan
                      <IcArrow width={22} height={11} />
                    </button>
                  </div>
                  <p className="ns-i-fine">
                    {hasMain ? 'The more rooms you mark, the fuller the reading.' : 'Mark the main door too: it carries the most weight in the reading.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && reading && (
          <motion.div key="results" variants={v} initial="initial" animate="animate" exit="exit">
            <AnalysisResults
              reading={reading}
              house={house}
              northDeg={northDeg}
              items={items}
              doors={doors}
              image={image}
              onBackToPlan={handleBackToPlan}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  EXTERNAL_WALL_SPECS,
  INTERNAL_WALL_SPECS,
  seismicZoneFromState,
  type ExternalWallType,
  type InternalWallType,
  type WaterproofingMethod,
  type BathroomWpMethod,
  type MasonInput,
  type RoofType,
  type SlopedRoofCovering,
} from '../masonpro-engine'

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

const SQM_PER_SQFT = 0.0929

const DOOR_PRESETS = [
  { key: 'main',     label: 'Main Door',     widthMm: 1200, heightMm: 2100, areaSqm: 2.52,  defaultCount: '1' },
  { key: 'room',     label: 'Room Door',     widthMm: 900,  heightMm: 2100, areaSqm: 1.89,  defaultCount: '' },
  { key: 'bathroom', label: 'Bathroom Door', widthMm: 750,  heightMm: 2100, areaSqm: 1.575, defaultCount: '' },
  { key: 'toilet',   label: 'Toilet Door',   widthMm: 600,  heightMm: 2100, areaSqm: 1.26,  defaultCount: '' },
]

const WINDOW_PRESETS = [
  { key: '600x600',   widthMm: 600,  heightMm: 600,  areaSqm: 0.36, label: '600×600 mm — Ventilation' },
  { key: '900x1200',  widthMm: 900,  heightMm: 1200, areaSqm: 1.08, label: '900×1200 mm — Bathroom / Staircase' },
  { key: '1200x1200', widthMm: 1200, heightMm: 1200, areaSqm: 1.44, label: '1200×1200 mm — Standard Bedroom' },
  { key: '1500x1200', widthMm: 1500, heightMm: 1200, areaSqm: 1.80, label: '1500×1200 mm — Living Room' },
  { key: '1800x1200', widthMm: 1800, heightMm: 1200, areaSqm: 2.16, label: '1800×1200 mm — Wide Living / Balcony' },
]

interface LabourTrade {
  id: string; name: string; workers: number; ratePerDay: number
  indiaAvgRate: number; basisText: string; active: boolean
}
interface CustomTrade { id: string; name: string; workers: string; ratePerDay: string; days: string }
interface RoomFormRow { id: string; name: string; lengthFt: string; widthFt: string; heightFt: string }
interface ExteriorFloorRow { floorIdx: number; wallLengthFt: string }
interface InteriorFloorRow { floorIdx: number; wallLengthFt: string }
interface CustomDoor { id: string; count: string; widthMm: string; heightMm: string }
interface CustomWindow { id: string; count: string; widthMm: string; heightMm: string }
interface BalconyFormRow { id: string; name: string; perimeterM: string; parapetHeightMm: string; thicknessMm: 115 | 230 }
interface BalconyFloorRow { floorIdx: number; perimeterM: string; parapetHeightMm: string; thicknessMm: 115 | 230 }

type MortarGrade = '1:4' | '1:6'
type BrickClass = '7.5' | '10' | '15'

const INDIA_AVG_RATES = {
  clayBrick: 9500, flyAshBrick: 7000, aacBlock: 55,
  cement: 410, sand: 28, wpCompound: 230,
}

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1',  name: 'Brick Layer (Raj Mistri)',   workers: 3, ratePerDay: 850,  indiaAvgRate: 850,  basisText: '120 sqft/day', active: true },
  { id: 't2',  name: 'Mason Helper',               workers: 3, ratePerDay: 560,  indiaAvgRate: 560,  basisText: 'Ratio',        active: true },
  { id: 't3',  name: 'Plaster Mason',              workers: 2, ratePerDay: 800,  indiaAvgRate: 800,  basisText: '100 sqft/day', active: true },
  { id: 't4',  name: 'Plaster Helper',             workers: 2, ratePerDay: 540,  indiaAvgRate: 540,  basisText: 'Ratio',        active: true },
  { id: 't5',  name: 'Waterproofing Specialist',   workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: '80 sqft/day',  active: true },
  { id: 't6',  name: 'Scaffolding Erector',        workers: 1, ratePerDay: 750,  indiaAvgRate: 750,  basisText: 'Per day',      active: true },
  { id: 't7',  name: 'Material Mixer',             workers: 1, ratePerDay: 650,  indiaAvgRate: 650,  basisText: 'Per day',      active: true },
  { id: 't8',  name: 'Curing / Water Man',         workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',      active: true },
  { id: 't9',  name: 'Site Foreman',               workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',      active: true },
  { id: 't10', name: 'Night Watchman',             workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',      active: true },
]

const MASON_REGIONAL_NOTES: Record<string, string> = {
  clayBrick:   'Jharkhand & WB ₹7,000–8,500/1000. Coastal Karnataka ₹11,000–13,000/1000. Transport adds ₹1,000–2,500 beyond 100km.',
  flyAshBrick: '₹5,500–6,000 near thermal plants (Korba, Mundra). ₹8,000–9,000 in metros far from source.',
  aacBlock:    '₹45–50/cft near AAC plants (Ahmedabad, Hyderabad). ₹65–75/cft in remote NE India.',
  cement:      '₹380–420 coastal Maharashtra. ₹440–460 remote NE India (transport adds 15–25%).',
  sand:        '₹18–22 in river-belt zones. ₹35–45 coastal/metro. M-sand ₹20–28 nationwide.',
  wpCompound:  '₹200–210 in Tier-2 cities. ₹250–280 in metros. Crystalline brands (Xypex) cost 2× more but last longer.',
}

// ─── Small UI components ──────────────────────────────────────────────────────

function TipBtn({ id, open, onToggle, children }: {
  id: string; open: string | null; onToggle: (id: string) => void; children: ReactNode
}) {
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => onToggle(id)}
        className="w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center ml-1 flex-shrink-0"
        style={{ background: 'rgba(31,78,121,0.15)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', verticalAlign: 'middle', cursor: 'pointer' }}>
        i
      </button>
      {open === id && (
        <span className="absolute z-50 left-0 top-5 p-3 rounded-[2px] w-72 block"
          style={{ background: '#fff', border: '1px solid rgba(31,78,121,0.3)', color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)', fontSize: 12, lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {children}
        </span>
      )}
    </span>
  )
}

type AlertVariant = 'info' | 'caution' | 'error' | 'tip'
function AlertBox({ variant, children }: { variant: AlertVariant; children: ReactNode }) {
  const styles: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
    info:    { bg: '#1F4E7908', border: '#1F4E79', icon: 'ⓘ', iconColor: '#1F4E79' },
    caution: { bg: '#D99A0610', border: '#D99A06', icon: '⚠', iconColor: '#D99A06' },
    error:   { bg: '#8C3A2208', border: '#8C3A22', icon: '✕', iconColor: '#8C3A22' },
    tip:     { bg: '#14532D08', border: '#14532D', icon: '✓', iconColor: '#14532D' },
  }
  const s = styles[variant]
  return (
    <div className="flex gap-2.5 p-3" style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      <span className="text-[13px] shrink-0 mt-0.5 font-bold" style={{ color: s.iconColor }}>{s.icon}</span>
      <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{children}</div>
    </div>
  )
}

function ISBadge({ code }: { code: string }) {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] rounded-[2px] inline-block"
      style={{ background: 'rgba(31,78,121,0.1)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', verticalAlign: 'middle' }}>
      {code}
    </span>
  )
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] uppercase tracking-widest"
        style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
        {num} — {title}
      </p>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange}
      className="w-10 h-6 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
      style={{ background: checked ? '#1F4E79' : 'rgba(255,255,255,0.15)' }}>
      <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
    </div>
  )
}

function monoVal(v: string | number) {
  return <span style={{ fontFamily: 'var(--font-plex-mono)' }}>{v}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProjectInitData {
  projectId:        string
  projectName:      string
  city:             string
  state:            string
  numFloors:        number | null   // normalized: total floors (G=1, G+1=2 …)
  perFloorAreas:    number[] | null
  slabThicknessMm?: number         // from StructoPro continuity data, if available
}

interface Props {
  state:           string
  city:            string
  initialProject?: ProjectInitData
  onSubmit:        (input: MasonInput) => void
  onFormChange?:   (data: Record<string, unknown>) => void
  onBack?:         () => void
}

export default function BuildDetails({ state, city, initialProject, onSubmit, onFormChange, onBack }: Props) {

  const initFloorCount: number = (() => {
    const count = initialProject?.perFloorAreas?.length ?? initialProject?.numFloors ?? 1
    return Math.max(1, Math.min(10, count))
  })()

  // S1 — Project Details
  const [projectName, setProjectName]   = useState(initialProject?.projectName ?? '')
  const [floorCount, setFloorCount] = useState<number>(initFloorCount)
  const [floorHeightFt, setFloorHeightFt]   = useState('10')
  const [slabDepthMm, setSlabDepthMm]       = useState<number>(initialProject?.slabThicknessMm ?? 125)
  const [localState, setLocalState]     = useState(initialProject?.state ?? state)
  const [localCity, setLocalCity]       = useState(initialProject?.city ?? city)

  // S2 — Wall type (global + per-floor)
  const [extWallType, setExtWallType]         = useState<ExternalWallType>('clay_modular_9')
  const [sameWallAllFloors, setSameWallAllFloors] = useState(true)
  const [perFloorWallTypes, setPerFloorWallTypes] = useState<ExternalWallType[]>([])

  // S2b — Staircase wall (only for multi-floor)
  const [includeStaircaseWall, setIncludeStaircaseWall] = useState(false)
  const [staircaseLengthFt, setStaircaseLengthFt]       = useState('')
  const [staircaseHeightOverrideFt, setStaircaseHeightOverrideFt] = useState('')

  // S3 — Exterior wall lengths per floor (Table A)
  const [exteriorFloorRows, setExteriorFloorRows] = useState<ExteriorFloorRow[]>(
    Array.from({ length: initFloorCount }, (_, i) => ({ floorIdx: i + 1, wallLengthFt: '' }))
  )

  // S4 — Door schedule
  const [doorCounts, setDoorCounts] = useState<Record<string, string>>({
    main: '1', room: '', bathroom: '', toilet: '',
  })
  const [customDoors, setCustomDoors] = useState<CustomDoor[]>([])
  // CHANGE 1: editable preset sizes
  const [doorSizeOverrides, setDoorSizeOverrides] = useState<Record<string, { widthMm: string; heightMm: string }>>(
    Object.fromEntries(DOOR_PRESETS.map(p => [p.key, { widthMm: String(p.widthMm), heightMm: String(p.heightMm) }]))
  )

  // S5 — Window schedule
  const [windowCounts, setWindowCounts] = useState<Record<string, string>>(
    Object.fromEntries(WINDOW_PRESETS.map(w => [w.key, '']))
  )
  // CHANGE 1: editable preset sizes + custom windows
  const [windowSizeOverrides, setWindowSizeOverrides] = useState<Record<string, { widthMm: string; heightMm: string }>>(
    Object.fromEntries(WINDOW_PRESETS.map(w => [w.key, { widthMm: String(w.widthMm), heightMm: String(w.heightMm) }]))
  )
  const [customWindows, setCustomWindows] = useState<CustomWindow[]>([])

  // S6 — Internal partitions (wall type + per-floor lengths Table B)
  const [includeInternal, setIncludeInt] = useState(false)
  const [intWallType, setIntWallType]    = useState<InternalWallType>('clay_4_5')
  const [interiorFloorRows, setInteriorFloorRows] = useState<InteriorFloorRow[]>(
    Array.from({ length: initFloorCount }, (_, i) => ({ floorIdx: i + 1, wallLengthFt: '' }))
  )

  // S7 — Balcony
  const [includeBalcony, setIncludeBalcony] = useState(false)
  const [balconies, setBalconies]           = useState<BalconyFormRow[]>([])
  // CHANGE 2: per-floor balcony rows for multi-floor buildings
  const [balconyFloorRows, setBalconyFloorRows] = useState<BalconyFloorRow[]>(
    Array.from({ length: initFloorCount }, (_, i) => ({ floorIdx: i + 1, perimeterM: '', parapetHeightMm: '900', thicknessMm: 115 as const }))
  )

  // S8 — Compound wall
  const [includeCompound, setIncludeCompound] = useState(false)
  const [compPerimeterM, setCompPerimeterM]   = useState('')
  const [compHeightM, setCompHeightM]         = useState('1.5')
  const [compThicknessMm, setCompThicknessMm] = useState<230 | 115>(230)
  const [compGateWidthM, setCompGateWidthM]   = useState('')
  const [compPillarOverride, setCompPillarOverride] = useState('')

  // S9 — Roof type
  const [includeRoofSection, setIncludeRoofSection] = useState(true)   // CHANGE 3
  const [roofType, setRoofType]                     = useState<RoofType>('flat')
  const [slopedRoofCovering, setSlopedRoofCovering] = useState<SlopedRoofCovering>('mangalore_tiles')
  const [gableWallAreaSqm, setGableWallAreaSqm]     = useState('')
  const [ridgeLengthM, setRidgeLengthM]             = useState('')
  const [terraceParapetCoping, setTerraceParapetCoping] = useState(false)

  // S10 — Plaster
  const [includePlasterSection, setIncludePlasterSection] = useState(true) // CHANGE 3
  const [plastering, setPlastering] = useState({ internal: true, external: true, ceiling: false })

  // S11 — Waterproofing
  const [includeWPSection, setIncludeWPSection] = useState(true)       // CHANGE 3
  const [includeTerWP, setTerraceWP]           = useState(false)
  const [terraceArea, setTerraceArea]           = useState('')
  const [terraceWPMethod, setTerraceWPMethod]   = useState<WaterproofingMethod>('bbc')
  const [includeBathWP, setBathWP]              = useState(false)
  const [bathroomCount, setBathroomCount]       = useState('2')
  const [bathroomWPMethod, setBathroomWPMethod] = useState<BathroomWpMethod>('cementitious')

  // Advanced
  const [showTechSpecs, setShowTechSpecs] = useState(false)
  const [mortarGrade, setMortarGrade]     = useState<MortarGrade>('1:6')
  const [brickClass, setBrickClass]       = useState<BrickClass>('7.5')
  const [showRates, setShowRates]         = useState(false)
  const [rates, setRates]                 = useState({ ...INDIA_AVG_RATES })
  const [subStep, setSubStep] = useState<'3a' | '3b' | '3c'>('3a')

  // Contractor + Labour
  const [contractorName, setCtName]       = useState('')
  const [contractorTotal, setCtTotal]     = useState('')
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]               = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades]   = useState<CustomTrade[]>([])

  const [openTip, setOpenTip] = useState<string | null>(null)
  const [errors, setErrors]   = useState<Record<string, string>>({})

  // ── Derived ──────────────────────────────────────────────────────────────────

  const szInfo        = seismicZoneFromState(localState)
  const extSpec       = EXTERNAL_WALL_SPECS[extWallType]
  const isHighSeismic = szInfo.zone === 'IV' || szInfo.zone === 'V'
  const showAacWarn   = extWallType === 'aac_200' && isHighSeismic
  const isMultiFloor  = floorCount > 1

  const floorHFt = parseFloat(floorHeightFt) || 10
  const slabDepthFt = slabDepthMm / 304.8
  const netFloorHFt = Math.max(0.1, floorHFt - slabDepthFt)
  const slabFromContinuity = !!(initialProject?.slabThicknessMm && initialProject.slabThicknessMm > 0)

  // Per-floor gross exterior areas (length × net height; slab depth subtracted per IS 2212)
  const perFloorGrossExtArea: number[] = exteriorFloorRows.map(r => {
    const l = parseFloat(r.wallLengthFt) || 0
    return l * netFloorHFt * SQM_PER_SQFT
  })
  const grossExtSqm = perFloorGrossExtArea.reduce((a, b) => a + b, 0)

  // Staircase height
  const totalFloorCount = floorCount
  const autoStaircaseHeightFt = floorHFt * totalFloorCount
  const effectiveStaircaseHeightFt = staircaseHeightOverrideFt
    ? (parseFloat(staircaseHeightOverrideFt) || autoStaircaseHeightFt)
    : autoStaircaseHeightFt
  const effectiveStaircaseHeightM = effectiveStaircaseHeightFt * 0.3048

  const doorDeductSqm = (() => {
    let total = 0
    for (const preset of DOOR_PRESETS) {
      const c = parseInt(doorCounts[preset.key] || '0') || 0
      const ov = doorSizeOverrides[preset.key]
      const w = parseInt(ov?.widthMm || '') || preset.widthMm
      const h = parseInt(ov?.heightMm || '') || preset.heightMm
      const area = (w * h) / 1_000_000
      if (c > 0 && area >= 0.1) total += c * area
    }
    for (const cd of customDoors) {
      const w = parseInt(cd.widthMm) || 0
      const h = parseInt(cd.heightMm) || 0
      const area = (w * h) / 1_000_000
      const c = parseInt(cd.count) || 0
      if (c > 0 && area >= 0.1) total += c * area
    }
    return total
  })()

  const windowDeductSqm = (() => {
    let total = 0
    for (const wp of WINDOW_PRESETS) {
      const c = parseInt(windowCounts[wp.key] || '0') || 0
      const ov = windowSizeOverrides[wp.key]
      const w = parseInt(ov?.widthMm || '') || wp.widthMm
      const h = parseInt(ov?.heightMm || '') || wp.heightMm
      const area = (w * h) / 1_000_000
      if (c > 0 && area >= 0.1) total += c * area
    }
    for (const cw of customWindows) {
      const w = parseInt(cw.widthMm) || 0
      const h = parseInt(cw.heightMm) || 0
      const area = (w * h) / 1_000_000
      const c = parseInt(cw.count) || 0
      if (c > 0 && area >= 0.1) total += c * area
    }
    return total
  })()

  const netExtSqm = Math.max(0, grossExtSqm - doorDeductSqm - windowDeductSqm)

  // Per-floor net exterior areas (proportional deduction)
  const perFloorNetExtArea: number[] = perFloorGrossExtArea.map(a =>
    grossExtSqm > 0 ? a * (netExtSqm / grossExtSqm) : 0
  )

  // Total interior partition area
  const totalIntSqm = interiorFloorRows.reduce((sum, r) => {
    const l = parseFloat(r.wallLengthFt) || 0
    return sum + l * netFloorHFt * SQM_PER_SQFT
  }, 0)

  const totalBalconyParapetSqm = isMultiFloor
    ? balconyFloorRows.reduce((sum, r) => {
      const p = parseFloat(r.perimeterM) || 0
      const h = (parseInt(r.parapetHeightMm) || 900) / 1000
      return sum + p * h
    }, 0)
    : balconies.reduce((sum, b) => {
      const p = parseFloat(b.perimeterM) || 0
      const h = (parseInt(b.parapetHeightMm) || 900) / 1000
      return sum + p * h
    }, 0)

  const compPerimF = parseFloat(compPerimeterM) || 0
  const compGateF  = parseFloat(compGateWidthM) || 0
  const compHF     = parseFloat(compHeightM) || 1.5
  const compNetArea = includeCompound ? Math.max(0, (compPerimF - compGateF) * compHF) : 0
  const autoPillarCount = compPerimF > 0 ? Math.ceil(compPerimF / 3) : 0
  const effectivePillarCount = compPillarOverride ? parseInt(compPillarOverride) || autoPillarCount : autoPillarCount

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!onFormChange) return
    const floorLabel = floorCount === 1 ? '1 floor' : `${floorCount} floors`
    onFormChange({ wallType: extWallType, floors: floorLabel, labourEnabled: includeLabour })
  }, [extWallType, floorCount, includeLabour, onFormChange])

  useEffect(() => {
    setMortarGrade(extWallType.includes('4_5') || intWallType.includes('4_5') ? '1:4' : '1:6')
  }, [extWallType, intWallType])

  // Sync perFloorWallTypes length with floorCount when per-floor mode is on
  useEffect(() => {
    if (sameWallAllFloors) return
    setPerFloorWallTypes(prev => {
      if (prev.length === floorCount) return prev
      const next = [...prev]
      while (next.length < floorCount) next.push(extWallType)
      return next.slice(0, floorCount)
    })
  }, [floorCount, sameWallAllFloors, extWallType])

  // Sync exteriorFloorRows with floorCount (preserve existing values)
  useEffect(() => {
    setExteriorFloorRows(prev => {
      const prevMap = new Map(prev.map(r => [r.floorIdx, r]))
      return Array.from({ length: floorCount }, (_, i) => {
        const f = i + 1
        return prevMap.get(f) ?? { floorIdx: f, wallLengthFt: '' }
      })
    })
  }, [floorCount])

  // Sync interiorFloorRows with floorCount (preserve existing values)
  useEffect(() => {
    setInteriorFloorRows(prev => {
      const prevMap = new Map(prev.map(r => [r.floorIdx, r]))
      return Array.from({ length: floorCount }, (_, i) => {
        const f = i + 1
        return prevMap.get(f) ?? { floorIdx: f, wallLengthFt: '' }
      })
    })
  }, [floorCount])

  // CHANGE 2: sync balconyFloorRows with floorCount
  useEffect(() => {
    setBalconyFloorRows(prev => {
      const prevMap = new Map(prev.map(r => [r.floorIdx, r]))
      return Array.from({ length: floorCount }, (_, i) => {
        const f = i + 1
        return prevMap.get(f) ?? { floorIdx: f, perimeterM: '', parapetHeightMm: '900', thicknessMm: 115 as const }
      })
    })
  }, [floorCount])

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function floorLabel(floorIdx: number) {
    return `Floor ${floorIdx}`
  }

  function updateExteriorRow(floorIdx: number, val: string) {
    setExteriorFloorRows(prev => prev.map(r => r.floorIdx === floorIdx ? { ...r, wallLengthFt: val } : r))
  }

  function updateInteriorRow(floorIdx: number, val: string) {
    setInteriorFloorRows(prev => prev.map(r => r.floorIdx === floorIdx ? { ...r, wallLengthFt: val } : r))
  }

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function addBalcony() {
    setBalconies(prev => [...prev, { id: `b${Date.now()}`, name: `Balcony ${prev.length + 1}`, perimeterM: '', parapetHeightMm: '900', thicknessMm: 115 }])
  }

  function updateBalcony(id: string, key: keyof BalconyFormRow, val: string | number) {
    setBalconies(prev => prev.map(b => b.id === id ? { ...b, [key]: val } : b))
  }

  function removeBalcony(id: string) { setBalconies(prev => prev.filter(b => b.id !== id)) }

  function addCustomDoor() {
    setCustomDoors(prev => [...prev, { id: `cd${Date.now()}`, count: '1', widthMm: '', heightMm: '' }])
  }

  function addCustomWindow() {
    setCustomWindows(prev => [...prev, { id: `cw${Date.now()}`, count: '1', widthMm: '', heightMm: '' }])
  }
  function updateCustomWindow(id: string, key: keyof CustomWindow, val: string) {
    setCustomWindows(prev => prev.map(w => w.id === id ? { ...w, [key]: val } : w))
  }
  function removeCustomWindow(id: string) { setCustomWindows(prev => prev.filter(w => w.id !== id)) }

  function updateBalconyFloorRow(floorIdx: number, key: keyof BalconyFloorRow, val: string | number) {
    setBalconyFloorRows(prev => prev.map(r => r.floorIdx === floorIdx ? { ...r, [key]: val } : r))
  }

  function updateCustomDoor(id: string, key: keyof CustomDoor, val: string) {
    setCustomDoors(prev => prev.map(d => d.id === id ? { ...d, [key]: val } : d))
  }

  function removeCustomDoor(id: string) { setCustomDoors(prev => prev.filter(d => d.id !== id)) }

  function updateTrade(id: string, key: keyof LabourTrade, val: unknown) {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }

  function addCustomTrade() {
    setCustomTrades(prev => [...prev, { id: `c${Date.now()}`, name: '', workers: '', ratePerDay: '', days: '' }])
  }

  function updateCustomTrade(id: string, key: keyof CustomTrade, val: string) {
    setCustomTrades(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }

  function validate3a(): boolean {
    const e: Record<string, string> = {}
    if (grossExtSqm <= 0) {
      e.floors = 'Enter exterior wall length for at least one floor'
    }
    if (!floorHeightFt || parseFloat(floorHeightFt) <= 0) {
      e.floorHeight = 'Enter a valid floor height'
    }
    if (includeInternal && totalIntSqm <= 0) {
      e.intWallArea = 'Enter interior partition length for at least one floor'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate3a()) {
      setSubStep('3a')
      return
    }

    const doorsForEngine = [
      ...DOOR_PRESETS.map(p => {
        const ov = doorSizeOverrides[p.key]
        const w = parseInt(ov?.widthMm || '') || p.widthMm
        const h = parseInt(ov?.heightMm || '') || p.heightMm
        return { id: p.key, label: p.label, widthMm: w, heightMm: h, count: parseInt(doorCounts[p.key] || '0') || 0 }
      }),
      ...customDoors.map(cd => ({
        id: cd.id, label: 'Custom Door',
        widthMm: parseInt(cd.widthMm) || 0,
        heightMm: parseInt(cd.heightMm) || 0,
        count: parseInt(cd.count) || 0,
        isCustom: true as const,
      })),
    ]

    const windowsForEngine = [
      ...WINDOW_PRESETS.map(wp => {
        const ov = windowSizeOverrides[wp.key]
        const w = parseInt(ov?.widthMm || '') || wp.widthMm
        const h = parseInt(ov?.heightMm || '') || wp.heightMm
        return { id: wp.key, label: wp.label, widthMm: w, heightMm: h, count: parseInt(windowCounts[wp.key] || '0') || 0 }
      }),
      ...customWindows.map(cw => ({
        id: cw.id, label: 'Custom Window',
        widthMm: parseInt(cw.widthMm) || 0,
        heightMm: parseInt(cw.heightMm) || 0,
        count: parseInt(cw.count) || 0,
        isCustom: true as const,
      })),
    ]

    // CHANGE 2: per-floor balcony or single-floor list
    const balconiesForEngine = isMultiFloor
      ? balconyFloorRows
        .filter(r => (parseFloat(r.perimeterM) || 0) > 0)
        .map(r => ({
          id: `floor-${r.floorIdx}`,
          name: `Floor ${r.floorIdx} Balcony`,
          lengthM: parseFloat(r.perimeterM) || 0,
          heightMm: parseInt(r.parapetHeightMm) || 900,
          thicknessMm: r.thicknessMm,
        }))
      : balconies.map(b => ({
        id: b.id, name: b.name,
        lengthM: parseFloat(b.perimeterM) || 0,
        heightMm: parseInt(b.parapetHeightMm) || 900,
        thicknessMm: b.thicknessMm,
      }))

    onSubmit({
      state: localState,
      city: localCity,
      externalWallType: extWallType,
      externalWallAreaSqm: Math.round(netExtSqm * 100) / 100,
      grossExternalWallAreaSqm: Math.round(grossExtSqm * 100) / 100,
      totalDoorDeductionSqm: Math.round(doorDeductSqm * 1000) / 1000,
      totalWindowDeductionSqm: Math.round(windowDeductSqm * 1000) / 1000,
      // Direct wall-length model
      selectedFloors: Array.from({ length: floorCount }, (_, i) => i + 1),
      floorHeightFt: floorHFt,
      exteriorWallLengthsFt: exteriorFloorRows.map(r => parseFloat(r.wallLengthFt) || 0),
      perFloorExteriorAreaSqm: perFloorNetExtArea.map(a => Math.round(a * 100) / 100),
      interiorWallLengthsFt: includeInternal ? interiorFloorRows.map(r => parseFloat(r.wallLengthFt) || 0) : [],
      includeInternal,
      internalWallType: includeInternal ? intWallType : undefined,
      internalWallAreaSqm: includeInternal ? Math.round(totalIntSqm * 100) / 100 : 0,
      // CHANGE 3: conditional section inclusion
      includePlaster: includePlasterSection && (plastering.internal || plastering.external || plastering.ceiling),
      plasterInternal: includePlasterSection && plastering.internal,
      plasterExternal: includePlasterSection && plastering.external,
      plasterCeiling: includePlasterSection && plastering.ceiling,
      includeWaterproofing: includeWPSection && (includeTerWP || includeBathWP),
      terraceAreaSqft: (includeWPSection && includeTerWP) ? (parseFloat(terraceArea) || 0) : 0,
      bathroomCount: (includeWPSection && includeBathWP) ? (parseInt(bathroomCount) || 0) : 0,
      terraceWpMethod: terraceWPMethod,
      bathroomWpMethod: bathroomWPMethod,
      numFloors: floorCount,
      doors: doorsForEngine,
      windows: windowsForEngine,
      // Per-floor wall type
      sameWallAllFloors: isMultiFloor ? sameWallAllFloors : true,
      perFloorWallTypes: isMultiFloor && !sameWallAllFloors ? perFloorWallTypes : undefined,
      // Staircase wall
      includeStaircaseWall: isMultiFloor ? includeStaircaseWall : false,
      staircaseWallLengthFt: isMultiFloor && includeStaircaseWall ? (parseFloat(staircaseLengthFt) || 0) : 0,
      staircaseWallHeightM: isMultiFloor && includeStaircaseWall ? effectiveStaircaseHeightM : 0,
      includeBalcony,
      balconies: includeBalcony ? balconiesForEngine : [],
      totalBalconyParapetAreaSqm: includeBalcony ? Math.round(totalBalconyParapetSqm * 100) / 100 : 0,
      includeCompoundWall: includeCompound,
      compoundWallAreaSqm: Math.round(compNetArea * 100) / 100,
      compoundPerimeterM: compPerimF,
      compoundHeightM: compHF,
      compoundThicknessMm: compThicknessMm,
      compoundGateWidthM: compGateF,
      compoundPillarCount: effectivePillarCount,
      // CHANGE 3: roof section optional
      roofType: includeRoofSection ? roofType : 'flat',
      slopedRoofCovering: (includeRoofSection && roofType !== 'flat') ? slopedRoofCovering : undefined,
      gableWallAreaSqm: (includeRoofSection && roofType !== 'flat') ? (parseFloat(gableWallAreaSqm) || 0) : 0,
      ridgeLengthM: (includeRoofSection && roofType !== 'flat') ? (parseFloat(ridgeLengthM) || 0) : 0,
      terraceParapetCoping: (includeRoofSection && roofType !== 'sloped') ? terraceParapetCoping : false,
      contractorQuote: contractorTotal ? parseFloat(contractorTotal) : undefined,
      includeLabour,
    })
  }

  // ── Area summary bar ──────────────────────────────────────────────────────────

  const AreaSummaryBar = () => (
    <div className="grid grid-cols-3 gap-2 p-3 rounded-[2px]"
      style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.15)' }}>
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>GROSS WALL</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{grossExtSqm.toFixed(1)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
      <div className="text-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>OPENINGS</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>−{(doorDeductSqm + windowDeductSqm).toFixed(2)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>NET AREA</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>{netExtSqm.toFixed(1)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen  pb-12">
      <div className="py-8 px-6 md:px-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          02 · MASONRY + PLASTER
        </p>
        <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Build Details
        </h1>
      </div>

      <div className="px-6 md:px-10 pt-6 space-y-6">

        {/* Progress Indicator */}
        <div className="flex items-center flex-wrap gap-x-0.5 gap-y-2 pb-4 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            { label: '1 REG',        done: true,                                 active: false },
            { label: '2 METHOD',     done: true,                                 active: false },
            { label: '3a STRUCTURE', done: subStep === '3b' || subStep === '3c', active: subStep === '3a' },
            { label: '3b MATERIALS', done: subStep === '3c',                     active: subStep === '3b' },
            { label: '3c LABOUR',    done: false,                                active: subStep === '3c' },
            { label: '4 RESULTS',    done: false,                                active: false },
          ] as { label: string; done: boolean; active: boolean }[]).map((step, i, arr) => (
            <div key={step.label} className="flex items-center">
              <span className="text-[10px] px-2 py-0.5 rounded-[2px]" style={{
                fontFamily: 'var(--font-plex-mono)',
                background: step.active ? '#1F4E79' : step.done ? 'rgba(20,83,45,0.08)' : 'rgba(30,34,39,0.05)',
                color: step.active ? '#fff' : step.done ? '#14532D' : 'rgba(255,255,255,0.30)',
                border: `1px solid ${step.active ? 'transparent' : step.done ? 'rgba(20,83,45,0.2)' : 'rgba(255,255,255,0.06)'}`,
                whiteSpace: 'nowrap',
              }}>
                {step.done ? '✓ ' : ''}{step.label}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: 'rgba(255,255,255,0.20)', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '0 3px' }}>—</span>
              )}
            </div>
          ))}
        </div>

        {subStep === '3a' && (<>
        {onBack && (
          <button type="button" onClick={onBack}
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(255,255,255,0.50)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Change Method
          </button>
        )}
        {/* Location chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)' }}>
          <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>
            📍 {localCity}, {localState}
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px]"
            style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
            SEISMIC ZONE {szInfo.zone} · Z={szInfo.zFactor}
          </span>
        </div>

        {/* ── 01 PROJECT DETAILS ─────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <SectionHeader num="01" title="PROJECT DETAILS" />
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Project Name</label>
              <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Sharma Residence"
                className="w-full border rounded-[6px] px-3 py-2 text-[14px]  outline-none"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }} />
            </div>

            {/* How many floors? — direct count input */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                  How many floors?
                </label>
                <TipBtn id="floorcount" open={openTip} onToggle={toggleTip}>
                  Total number of floors in your building. Each floor gets its own wall length row below. If continuing from StructoPro, this is pre-filled from your project.
                </TipBtn>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="1" max="10" value={floorCount}
                  onChange={e => {
                    const v = Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    setFloorCount(v)
                    setErrors(prev => ({ ...prev, floors: '' }))
                  }}
                  className="w-24 border rounded-[6px] px-3 py-2 text-[14px]  outline-none text-center"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.floors ? '#8C3A22' : 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }}
                />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  {floorCount === 1 ? 'floor — Floor 1 only' : `floors — Floor 1 to Floor ${floorCount}`}
                </span>
              </div>
              {errors.floors && (
                <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.floors}</p>
              )}
            </div>

            {/* Global floor height */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                  Floor Height (ft)
                </label>
                <TipBtn id="floorht" open={openTip} onToggle={toggleTip}>
                  Floor-to-floor height for all selected floors. NBC 2016 minimum is 2.75m (9.02 ft). Standard residential is 10 ft (3.05m). Used to calculate wall area = Wall Length × Height.
                </TipBtn>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={floorHeightFt}
                  onChange={e => { setFloorHeightFt(e.target.value); setErrors(prev => ({ ...prev, floorHeight: '' })) }}
                  placeholder="10"
                  className="w-28 border rounded-[6px] px-3 py-2 text-[14px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.floorHeight ? '#8C3A22' : 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  = {(parseFloat(floorHeightFt) * 0.3048).toFixed(2)} m
                </span>
                {parseFloat(floorHeightFt) < 9.02 && parseFloat(floorHeightFt) > 0 && (
                  <span className="text-[10px]" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                    ⚠ Below NBC 2016 min (9.02 ft / 2.75m)
                  </span>
                )}
              </div>
              {errors.floorHeight && (
                <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.floorHeight}</p>
              )}
            </div>

            {/* Slab Depth */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                  Slab Depth (subtracted from wall height)
                </label>
                <TipBtn id="slabdepth" open={openTip} onToggle={toggleTip}>
                  RCC slab thickness is deducted from floor-to-floor height to get net masonry wall height. Standard residential slab: 100–150mm. Default: 125mm (IS 456:2000 Table 5). If continuing from StructoPro, enter your actual slab thickness here.
                </TipBtn>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input type="number" min="50" max="300" value={slabDepthMm}
                    onChange={e => setSlabDepthMm(Math.max(0, parseFloat(e.target.value) || 125))}
                    className="w-24 border rounded-[6px] px-3 py-2 text-[14px]  outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }} />
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>mm</span>
                </div>
                {slabFromContinuity ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-[2px]"
                    style={{ background: 'rgba(20,83,45,0.08)', color: '#14532D', fontFamily: 'var(--font-plex-mono)', border: '1px solid rgba(20,83,45,0.2)' }}>
                    ✓ from StructoPro data
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                    ⓘ Standard 125mm assumption — override if known
                  </span>
                )}
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                Net wall height = {floorHFt.toFixed(2)} ft − {slabDepthMm}mm = {(netFloorHFt * 0.3048).toFixed(2)} m ({netFloorHFt.toFixed(2)} ft)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>State</label>
                <select value={localState} onChange={e => setLocalState(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }}>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>City</label>
                <input type="text" value={localCity} onChange={e => setLocalCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 02 EXTERNAL WALL TYPE ──────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <SectionHeader num="02" title="EXTERNAL WALL TYPE" />
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(EXTERNAL_WALL_SPECS) as ExternalWallType[]).map(type => {
                const spec = EXTERNAL_WALL_SPECS[type]
                const selected = extWallType === type
                const aacRisk = type === 'aac_200' && isHighSeismic
                return (
                  <button key={type} type="button"
                    onClick={() => setExtWallType(type)}
                    className="text-left p-3 rounded-[2px] transition-all"
                    style={{
                      border: `1.5px solid ${selected ? '#1F4E79' : aacRisk ? 'rgba(217,154,6,0.5)' : 'rgba(255,255,255,0.10)'}`,
                      background: selected ? 'rgba(31,78,121,0.06)' : 'transparent',
                    }}>
                    <p className="text-[12px] font-medium leading-tight mb-0.5"
                      style={{ color: selected ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                      {spec.shortLabel}
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                      {spec.unitsPerSqm} {spec.unitLabel}/sqm · {spec.mortarRatio}
                    </p>
                    {aacRisk && (
                      <p className="text-[9px] mt-1" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                        ⚠ Zone {szInfo.zone}: Infill only per IS 4326:1993
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            {showAacWarn && (
              <div className="mt-3">
                <AlertBox variant="caution">
                  <strong>IS 4326:1993 — Zone {szInfo.zone}:</strong> AAC blocks NOT permitted as load-bearing masonry. Approved for infill/partition only. Ensure your structural engineer specifies clay brick or hollow concrete block for load-bearing walls.
                </AlertBox>
              </div>
            )}

            {/* ── Same wall type on all floors? (only when multi-floor) ─── */}
            {isMultiFloor && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                      Same wall type on all floors?
                    </p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-sans)' }}>
                      {floorCount === 1 ? 'Floor 1' : `Floor 1 – Floor ${floorCount}`} — applies only to external walls
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px]" style={{ color: sameWallAllFloors ? '#1F4E79' : 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                      {sameWallAllFloors ? 'YES' : 'NO'}
                    </span>
                    <Toggle checked={sameWallAllFloors} onChange={() => {
                      const next = !sameWallAllFloors
                      setSameWallAllFloors(next)
                      if (!next) {
                        setPerFloorWallTypes(Array.from({ length: floorCount }, () => extWallType))
                      }
                    }} />
                  </label>
                </div>

                {/* Per-floor wall type selector */}
                {!sameWallAllFloors && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Floor', 'Wall Type'].map(h => (
                            <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                              style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: floorCount }, (_, i) => {
                          const floorIdx = i + 1
                          const current = perFloorWallTypes[i] ?? extWallType
                          return (
                            <tr key={floorIdx} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                              <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79', whiteSpace: 'nowrap' }}>
                                {`Floor ${floorIdx}`}
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={current}
                                  onChange={e => setPerFloorWallTypes(prev => {
                                    const next = [...prev]
                                    next[i] = e.target.value as ExternalWallType
                                    return next
                                  })}
                                  className="w-full border rounded-[6px] px-2 py-1.5 text-[12px]  outline-none"
                                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }}>
                                  {(Object.keys(EXTERNAL_WALL_SPECS) as ExternalWallType[]).map(type => (
                                    <option key={type} value={type}>{EXTERNAL_WALL_SPECS[type].label}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                      ⓘ Wall area per floor is calculated from the exterior wall lengths you enter below
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 03 WALL LENGTH SCHEDULE ───────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <SectionHeader num="03" title="WALL LENGTH SCHEDULE — GROSS WALL AREA" />
          <div className="p-4 space-y-5">

            {/* Table A — Exterior Walls */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  TABLE A — TOTAL EXTERIOR WALLS (PER FLOOR)
                </p>
                <TipBtn id="extlen" open={openTip} onToggle={toggleTip}>
                  Enter the total perimeter length of the exterior walls for each floor. For irregular or L-shaped plans, measure the actual wall perimeter — do NOT use 2×(Length+Width) unless the plan is a simple rectangle. Area = Wall Length × (Floor Height − Slab Depth). Slab depth is set in Section 01.
                </TipBtn>
              </div>
              <AlertBox variant="info">
                Measure the actual wall perimeter in feet. For irregular layouts, trace the exterior wall and sum all segments. Floor height is set in Section 01 and applied to all floors.
              </AlertBox>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 380 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Floor', 'Exterior Wall Length (ft)', 'Wall Area (auto)', 'Est. Units'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exteriorFloorRows.map((row, i) => {
                      const l = parseFloat(row.wallLengthFt) || 0
                      const areaSqm = l * netFloorHFt * SQM_PER_SQFT
                      const bricksEst = areaSqm > 0 ? Math.round(extSpec.unitsPerSqm * areaSqm) : 0
                      return (
                        <tr key={row.floorIdx} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                          <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                            {floorLabel(row.floorIdx)}
                          </td>
                          <td className="py-2 px-2" style={{ verticalAlign: 'top' }}>
                            <input type="number" value={row.wallLengthFt}
                              onChange={e => { updateExteriorRow(row.floorIdx, e.target.value); setErrors(prev => ({ ...prev, floors: '' })) }}
                              placeholder="e.g. 200"
                              className="w-28 border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                          </td>
                          <td className="py-2 px-2" style={{ verticalAlign: 'top' }}>
                            <div className="text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: areaSqm > 0 ? '#1F4E79' : 'rgba(255,255,255,0.25)' }}>
                              {areaSqm > 0 ? `${areaSqm.toFixed(1)} sqm` : '—'}
                            </div>
                            {areaSqm > 0 && (
                              <div className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(30,34,39,0.38)', fontFamily: 'var(--font-plex-mono)' }}>
                                {l.toFixed(0)} ft × {(netFloorHFt * 0.3048).toFixed(2)} m{slabFromContinuity ? ' (StructoPro slab)' : ` (−${slabDepthMm}mm slab)`}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2" style={{ verticalAlign: 'top' }}>
                            <div className="text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.40)' }}>
                              {bricksEst > 0 ? `≈ ${bricksEst.toLocaleString('en-IN')} ${extSpec.unitLabel}` : '—'}
                            </div>
                            {bricksEst > 0 && (
                              <div className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-plex-mono)' }}>
                                {extSpec.unitsPerSqm}/{String(extSpec.unitLabel).replace(/s$/, '')} per sqm · mortar incl.
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Total row */}
                    {grossExtSqm > 0 && (
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)' }}>
                        <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>TOTAL</td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                          {exteriorFloorRows.reduce((s, r) => s + (parseFloat(r.wallLengthFt) || 0), 0).toFixed(0)} ft
                        </td>
                        <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                          {grossExtSqm.toFixed(1)} sqm
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.40)' }}>
                          ≈ {Math.round(extSpec.unitsPerSqm * grossExtSqm).toLocaleString('en-IN')} {extSpec.unitLabel}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {errors.floors && (
                <p className="text-[11px] mt-1.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.floors}</p>
              )}
            </div>

          </div>
        </div>

        {/* ── 04 DOOR SCHEDULE ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <SectionHeader num="04" title="DOOR SCHEDULE — OPENING DEDUCTIONS" />
          <div className="p-4 space-y-3">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              ⓘ Sizes are pre-filled with standard dimensions — edit for non-standard openings. Openings below 0.1 sqm not deducted.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Door Type', 'Width (mm)', 'Height (mm)', 'Area/door', 'Count', 'Deduction'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOOR_PRESETS.map(preset => {
                    const ov = doorSizeOverrides[preset.key]
                    const wVal = ov?.widthMm ?? String(preset.widthMm)
                    const hVal = ov?.heightMm ?? String(preset.heightMm)
                    const w = parseInt(wVal) || preset.widthMm
                    const h = parseInt(hVal) || preset.heightMm
                    const area = (w * h) / 1_000_000
                    const c = parseInt(doorCounts[preset.key] || '0') || 0
                    const deduct = c > 0 && area >= 0.1 ? c * area : 0
                    return (
                      <tr key={preset.key} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-2 px-2 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>{preset.label}</td>
                        <td className="py-2 px-2">
                          <input type="number" value={wVal}
                            onChange={e => setDoorSizeOverrides(prev => ({ ...prev, [preset.key]: { ...prev[preset.key], widthMm: e.target.value } }))}
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" value={hVal}
                            onChange={e => setDoorSizeOverrides(prev => ({ ...prev, [preset.key]: { ...prev[preset.key], heightMm: e.target.value } }))}
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.50)' }}>
                          {area >= 0.1 ? `${area.toFixed(3)} sqm` : <span style={{ color: '#D99A06' }}>{'< 0.1'}</span>}
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" min="0"
                            value={doorCounts[preset.key] ?? ''}
                            onChange={e => setDoorCounts(prev => ({ ...prev, [preset.key]: e.target.value }))}
                            placeholder="0"
                            className="w-16 border rounded-[6px] px-2 py-1 text-[13px]  outline-none text-center"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(255,255,255,0.25)' }}>
                          {deduct > 0 ? `−${deduct.toFixed(3)} sqm` : '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Custom doors */}
                  {customDoors.map(cd => {
                    const w = parseInt(cd.widthMm) || 0
                    const h = parseInt(cd.heightMm) || 0
                    const area = (w * h) / 1_000_000
                    const c = parseInt(cd.count) || 0
                    const deduct = area >= 0.1 ? c * area : 0
                    return (
                      <tr key={cd.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: 'rgba(31,78,121,0.02)' }}>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.50)' }}>Custom Opening</td>
                        <td className="py-2 px-2">
                          <input type="number" value={cd.widthMm}
                            onChange={e => updateCustomDoor(cd.id, 'widthMm', e.target.value)}
                            placeholder="e.g. 1000"
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" value={cd.heightMm}
                            onChange={e => updateCustomDoor(cd.id, 'heightMm', e.target.value)}
                            placeholder="e.g. 2100"
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.40)' }}>
                          {area > 0 ? `${area.toFixed(3)} sqm` : '—'}
                          {area > 0 && area < 0.1 && <span className="text-[9px] ml-1" style={{ color: '#D99A06' }}>not deducted</span>}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={cd.count}
                              onChange={e => updateCustomDoor(cd.id, 'count', e.target.value)}
                              className="w-14 border rounded-[6px] px-2 py-1 text-[13px]  outline-none text-center"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                            <button type="button" onClick={() => removeCustomDoor(cd.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-[12px]"
                              style={{ color: '#8C3A22', border: '1px solid rgba(140,58,34,0.2)', background: 'rgba(140,58,34,0.04)' }}>
                              ×
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(255,255,255,0.25)' }}>
                          {deduct > 0 ? `−${deduct.toFixed(3)} sqm` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={addCustomDoor}
                className="text-[11px] px-3 py-1.5 rounded-[2px]"
                style={{ border: '1px dashed rgba(31,78,121,0.35)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                + Custom Door
              </button>
              {doorDeductSqm > 0 && (
                <p className="text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>
                  Total door deduction: {doorDeductSqm.toFixed(3)} sqm
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 05 WINDOW SCHEDULE ────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <SectionHeader num="05" title="WINDOW SCHEDULE — OPENING DEDUCTIONS" />
          <div className="p-4 space-y-3">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              ⓘ Sizes pre-filled from standard presets — edit for non-standard openings. Openings below 0.1 sqm not deducted.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Window Type', 'Width (mm)', 'Height (mm)', 'Area/window', 'Count', 'Deduction'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WINDOW_PRESETS.map(wp => {
                    const ov = windowSizeOverrides[wp.key]
                    const wVal = ov?.widthMm ?? String(wp.widthMm)
                    const hVal = ov?.heightMm ?? String(wp.heightMm)
                    const w = parseInt(wVal) || wp.widthMm
                    const h = parseInt(hVal) || wp.heightMm
                    const area = (w * h) / 1_000_000
                    const c = parseInt(windowCounts[wp.key] || '0') || 0
                    const deduct = c > 0 && area >= 0.1 ? c * area : 0
                    return (
                      <tr key={wp.key} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)' }}>{wp.label}</td>
                        <td className="py-2 px-2">
                          <input type="number" value={wVal}
                            onChange={e => setWindowSizeOverrides(prev => ({ ...prev, [wp.key]: { ...prev[wp.key], widthMm: e.target.value } }))}
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" value={hVal}
                            onChange={e => setWindowSizeOverrides(prev => ({ ...prev, [wp.key]: { ...prev[wp.key], heightMm: e.target.value } }))}
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.50)' }}>
                          {area >= 0.1 ? `${area.toFixed(3)} sqm` : <span style={{ color: '#D99A06' }}>{'< 0.1'}</span>}
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" min="0"
                            value={windowCounts[wp.key] ?? ''}
                            onChange={e => setWindowCounts(prev => ({ ...prev, [wp.key]: e.target.value }))}
                            placeholder="0"
                            className="w-16 border rounded-[6px] px-2 py-1 text-[13px]  outline-none text-center"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(255,255,255,0.25)' }}>
                          {deduct > 0 ? `−${deduct.toFixed(3)} sqm` : '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Custom windows */}
                  {customWindows.map(cw => {
                    const w = parseInt(cw.widthMm) || 0
                    const h = parseInt(cw.heightMm) || 0
                    const area = (w * h) / 1_000_000
                    const c = parseInt(cw.count) || 0
                    const deduct = area >= 0.1 ? c * area : 0
                    return (
                      <tr key={cw.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: 'rgba(31,78,121,0.02)' }}>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(255,255,255,0.50)' }}>Custom Opening</td>
                        <td className="py-2 px-2">
                          <input type="number" value={cw.widthMm}
                            onChange={e => updateCustomWindow(cw.id, 'widthMm', e.target.value)}
                            placeholder="e.g. 1200"
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" value={cw.heightMm}
                            onChange={e => updateCustomWindow(cw.id, 'heightMm', e.target.value)}
                            placeholder="e.g. 1500"
                            className="w-16 border rounded-[6px] px-1.5 py-1 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.40)' }}>
                          {area > 0 ? `${area.toFixed(3)} sqm` : '—'}
                          {area > 0 && area < 0.1 && <span className="text-[9px] ml-1" style={{ color: '#D99A06' }}>not deducted</span>}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={cw.count}
                              onChange={e => updateCustomWindow(cw.id, 'count', e.target.value)}
                              className="w-14 border rounded-[6px] px-2 py-1 text-[13px]  outline-none text-center"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                            <button type="button" onClick={() => removeCustomWindow(cw.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-[12px]"
                              style={{ color: '#8C3A22', border: '1px solid rgba(140,58,34,0.2)', background: 'rgba(140,58,34,0.04)' }}>
                              ×
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(255,255,255,0.25)' }}>
                          {deduct > 0 ? `−${deduct.toFixed(3)} sqm` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={addCustomWindow}
                className="text-[11px] px-3 py-1.5 rounded-[2px]"
                style={{ border: '1px dashed rgba(31,78,121,0.35)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                + Custom Window
              </button>
              {windowDeductSqm > 0 && (
                <p className="text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>
                  Total window deduction: {windowDeductSqm.toFixed(3)} sqm
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── AREA SUMMARY ──────────────────────────────────────────────────── */}
        {grossExtSqm > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
              WALL AREA SUMMARY
            </p>
            <AreaSummaryBar />
            {netExtSqm > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[11px]" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ {Math.round(extSpec.unitsPerSqm * netExtSqm).toLocaleString('en-IN')} {extSpec.unitLabel} required for net wall area
                </p>
                <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Wall area = Total length × (floor ht − slab depth) = Total length × ({floorHFt.toFixed(2)} ft − {slabDepthMm}mm = {(netFloorHFt * 0.3048).toFixed(2)} m net ht) = {grossExtSqm.toFixed(1)} sqm gross
                  {slabFromContinuity ? ' · slab from StructoPro' : ' · 125mm standard assumption'}
                </p>
                <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Bricks = {netExtSqm.toFixed(1)} sqm × {extSpec.unitsPerSqm} {extSpec.unitLabel}/sqm (IS 2212:1991, {extSpec.shortLabel}) = {Math.round(extSpec.unitsPerSqm * netExtSqm).toLocaleString('en-IN')} {extSpec.unitLabel}. Mortar joint spacing already included in this IS rate.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 06 INTERNAL PARTITIONS ────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeInternal ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeInternal} onChange={() => setIncludeInt(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  06 — INTERNAL PARTITION WALLS
                </p>
                {!includeInternal && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeInternal && (
            <div className="p-4 space-y-4">
              {/* Wall type selection */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Internal Wall Type
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(INTERNAL_WALL_SPECS) as InternalWallType[]).map(type => {
                    const spec = INTERNAL_WALL_SPECS[type]
                    const selected = intWallType === type
                    return (
                      <button key={type} type="button" onClick={() => setIntWallType(type)}
                        className="text-left p-3 rounded-[2px] transition-all"
                        style={{
                          border: `1.5px solid ${selected ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`,
                          background: selected ? 'rgba(31,78,121,0.06)' : 'transparent',
                        }}>
                        <p className="text-[11px] font-medium leading-tight"
                          style={{ color: selected ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                          {spec.shortLabel}
                        </p>
                        {spec.unitsPerSqm > 0 && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                            {spec.unitsPerSqm.toFixed(0)} {spec.unitLabel}/sqm
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Table B — Interior Partition Lengths per floor */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[11px] font-medium uppercase tracking-widest"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    TABLE B — INTERIOR PARTITION WALLS (per floor)
                  </p>
                  <TipBtn id="intlen" open={openTip} onToggle={toggleTip}>
                    Enter the total length of all interior partition walls on each floor in feet. Include all room dividers, bathroom walls, and corridor walls. Area = Length × Floor Height (same height as Section 01).
                  </TipBtn>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 340 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Floor', 'Partition Wall Length (ft)', 'Wall Area (auto)'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                            style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {interiorFloorRows.map((row, i) => {
                        const l = parseFloat(row.wallLengthFt) || 0
                        const areaSqm = l * netFloorHFt * SQM_PER_SQFT
                        return (
                          <tr key={row.floorIdx} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                            <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79', whiteSpace: 'nowrap' }}>
                              {floorLabel(row.floorIdx)}
                            </td>
                            <td className="py-2 px-2">
                              <input type="number" value={row.wallLengthFt}
                                onChange={e => { updateInteriorRow(row.floorIdx, e.target.value); setErrors(prev => ({ ...prev, intWallArea: '' })) }}
                                placeholder="e.g. 150"
                                className="w-28 border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                            </td>
                            <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: areaSqm > 0 ? '#1F4E79' : 'rgba(255,255,255,0.25)' }}>
                              {areaSqm > 0 ? `${areaSqm.toFixed(1)} sqm` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                      {/* Total row */}
                      {totalIntSqm > 0 && (
                        <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)' }}>
                          <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>TOTAL</td>
                          <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(255,255,255,0.45)' }}>
                            {interiorFloorRows.reduce((s, r) => s + (parseFloat(r.wallLengthFt) || 0), 0).toFixed(0)} ft
                          </td>
                          <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                            {totalIntSqm.toFixed(1)} sqm
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {errors.intWallArea && (
                  <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.intWallArea}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 07 BALCONY PARAPET ────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeBalcony ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeBalcony} onChange={() => setIncludeBalcony(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  07 — BALCONY PARAPET WALLS
                </p>
                {!includeBalcony && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeBalcony && (
            <div className="p-4 space-y-4">
              <AlertBox variant="info">
                NBC 2016 minimum parapet height: 900mm. Calculated separately from main wall area — bricks/blocks listed as line item in report.
              </AlertBox>

              {/* CHANGE 2: per-floor table for multi-floor, list for single floor */}
              {isMultiFloor ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    TABLE C — BALCONY PARAPET WALLS (per floor)
                  </p>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                    Enter perimeter for each floor that has a balcony. Leave blank for floors with no balcony.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 440 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          {['Floor', 'Perimeter (m)', 'Parapet Ht (mm)', 'Thickness', 'Area'].map(h => (
                            <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                              style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {balconyFloorRows.map((row, i) => {
                          const p = parseFloat(row.perimeterM) || 0
                          const h = (parseInt(row.parapetHeightMm) || 900) / 1000
                          const areaSqm = p * h
                          const htNum = parseInt(row.parapetHeightMm) || 900
                          return (
                            <tr key={row.floorIdx} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                              <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79', whiteSpace: 'nowrap' }}>
                                Floor {row.floorIdx}
                              </td>
                              <td className="py-2 px-2">
                                <input type="number" value={row.perimeterM}
                                  onChange={e => updateBalconyFloorRow(row.floorIdx, 'perimeterM', e.target.value)}
                                  placeholder="e.g. 10"
                                  className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                              </td>
                              <td className="py-2 px-2">
                                <input type="number" value={row.parapetHeightMm}
                                  onChange={e => updateBalconyFloorRow(row.floorIdx, 'parapetHeightMm', e.target.value)}
                                  placeholder="900"
                                  className="w-20 border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: htNum < 900 ? '#8C3A22' : 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                                {htNum < 900 && <p className="text-[9px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>Below NBC min</p>}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex gap-1">
                                  {([115, 230] as const).map(t => (
                                    <button key={t} type="button" onClick={() => updateBalconyFloorRow(row.floorIdx, 'thicknessMm', t)}
                                      className="px-2 py-1 rounded-[2px] text-[10px]"
                                      style={{
                                        border: `1px solid ${row.thicknessMm === t ? '#1F4E79' : 'rgba(255,255,255,0.15)'}`,
                                        background: row.thicknessMm === t ? 'rgba(31,78,121,0.1)' : 'transparent',
                                        color: row.thicknessMm === t ? '#1F4E79' : 'var(--text-primary)',
                                        fontFamily: 'var(--font-plex-mono)',
                                      }}>
                                      {t === 115 ? '4.5"' : '9"'}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: areaSqm > 0 ? '#1F4E79' : 'rgba(255,255,255,0.25)' }}>
                                {areaSqm > 0 ? `${areaSqm.toFixed(2)} sqm` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                        {totalBalconyParapetSqm > 0 && (
                          <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)' }}>
                            <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>TOTAL</td>
                            <td colSpan={3} />
                            <td className="py-2 px-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                              {totalBalconyParapetSqm.toFixed(2)} sqm
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  {balconies.length > 0 && (
                    <div className="space-y-3">
                      {balconies.map((b, idx) => {
                        const p = parseFloat(b.perimeterM) || 0
                        const h = (parseInt(b.parapetHeightMm) || 900) / 1000
                        const areaSqm = p * h
                        return (
                          <div key={b.id} className="p-3 rounded-[2px]"
                            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(30,34,39,0.01)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <input type="text" value={b.name}
                                onChange={e => updateBalcony(b.id, 'name', e.target.value)}
                                placeholder={`Balcony ${idx + 1}`}
                                className="border-b outline-none text-[13px] bg-transparent flex-1"
                                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                              <button type="button" onClick={() => removeBalcony(b.id)}
                                className="ml-3 w-6 h-6 rounded flex items-center justify-center text-[13px]"
                                style={{ color: '#8C3A22', border: '1px solid rgba(140,58,34,0.2)' }}>×</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest block mb-1"
                                  style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Perimeter (m)</label>
                                <input type="number" value={b.perimeterM}
                                  onChange={e => updateBalcony(b.id, 'perimeterM', e.target.value)}
                                  placeholder="e.g. 12"
                                  className="w-full border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest block mb-1"
                                  style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Parapet Ht (mm)</label>
                                <input type="number" value={b.parapetHeightMm}
                                  onChange={e => updateBalcony(b.id, 'parapetHeightMm', e.target.value)}
                                  placeholder="900"
                                  className="w-full border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: (parseInt(b.parapetHeightMm) || 900) < 900 ? '#8C3A22' : 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                                {(parseInt(b.parapetHeightMm) || 900) < 900 && (
                                  <p className="text-[10px] mt-0.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>Below NBC 2016 min (900mm)</p>
                                )}
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest block mb-1"
                                  style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Thickness</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {([115, 230] as const).map(t => (
                                    <button key={t} type="button" onClick={() => updateBalcony(b.id, 'thicknessMm', t)}
                                      className="py-1.5 rounded-[2px] text-center text-[11px]"
                                      style={{
                                        border: `1px solid ${b.thicknessMm === t ? '#1F4E79' : 'rgba(255,255,255,0.15)'}`,
                                        background: b.thicknessMm === t ? 'rgba(31,78,121,0.08)' : 'transparent',
                                        color: b.thicknessMm === t ? '#1F4E79' : 'var(--text-primary)',
                                        fontFamily: 'var(--font-plex-mono)',
                                      }}>
                                      {t}mm {t === 115 ? '(4.5")' : '(9")'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {areaSqm > 0 && (
                              <p className="text-[10px] mt-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                                Parapet wall area: {areaSqm.toFixed(2)} sqm · ≈ {Math.round(extSpec.unitsPerSqm * (b.thicknessMm >= 200 ? 1 : 0.5) * areaSqm).toLocaleString('en-IN')} {extSpec.unitLabel}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button type="button" onClick={addBalcony}
                    className="w-full py-2.5 rounded-[2px] text-[12px]"
                    style={{ border: '1px dashed rgba(31,78,121,0.4)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'rgba(31,78,121,0.02)' }}>
                    + Add Balcony
                  </button>
                  {totalBalconyParapetSqm > 0 && (
                    <p className="text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      Total balcony parapet area: {totalBalconyParapetSqm.toFixed(2)} sqm
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── 08 COMPOUND WALL ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeCompound ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeCompound} onChange={() => setIncludeCompound(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  08 — COMPOUND / BOUNDARY WALL
                </p>
                {!includeCompound && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeCompound && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Total Perimeter (m)
                  </label>
                  <input type="number" value={compPerimeterM}
                    onChange={e => setCompPerimeterM(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Height (m)
                  </label>
                  <input type="number" value={compHeightM}
                    onChange={e => setCompHeightM(e.target.value)}
                    placeholder="1.5"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Gate Width (m)
                    <TipBtn id="gate" open={openTip} onToggle={toggleTip}>
                      Gate opening is deducted automatically from the compound wall area. Typical gate width: 3–4.5m for single/double gate.
                    </TipBtn>
                  </label>
                  <input type="number" value={compGateWidthM}
                    onChange={e => setCompGateWidthM(e.target.value)}
                    placeholder="e.g. 3.6"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-2"
                  style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Wall Thickness
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([230, 115] as const).map(t => (
                    <button key={t} type="button" onClick={() => setCompThicknessMm(t)}
                      className="py-2 rounded-[2px] text-center text-[12px]"
                      style={{
                        border: `1.5px solid ${compThicknessMm === t ? '#1F4E79' : 'rgba(255,255,255,0.15)'}`,
                        background: compThicknessMm === t ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: compThicknessMm === t ? '#1F4E79' : 'var(--text-primary)',
                        fontFamily: 'var(--font-plex-mono)',
                      }}>
                      {t}mm ({t === 230 ? '9" Full Brick' : '4.5" One Brick'})
                    </button>
                  ))}
                </div>
              </div>

              {/* Pillar count */}
              {compPerimF > 0 && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    Pillar Count
                    <TipBtn id="pillar" open={openTip} onToggle={toggleTip}>
                      Standard: 1 pillar every 3m of compound wall. Pillars add stability — IS 2212:1991 requires cross-walls/buttresses at max 6m intervals. Auto-calculated from perimeter, but you can override.
                    </TipBtn>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-[6px] text-[13px] flex-1"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      Auto: {autoPillarCount} pillars (1 per 3m)
                    </div>
                    <input type="number" value={compPillarOverride}
                      onChange={e => setCompPillarOverride(e.target.value)}
                      placeholder="Override"
                      className="w-28 border rounded-[6px] px-2 py-2 text-[13px]  outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                  </div>
                  {compPillarOverride && (
                    <p className="text-[10px] mt-1" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                      ⚠ Using {effectivePillarCount} pillars (overridden from auto {autoPillarCount})
                    </p>
                  )}
                </div>
              )}

              {compNetArea > 0 && (
                <div className="p-3 rounded-[2px]"
                  style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.15)' }}>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Gross Perim</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{compPerimF.toFixed(1)} m</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Gate −</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>−{compGateF.toFixed(1)} m</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Wall Area</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>{compNetArea.toFixed(1)} sqm</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 09 STAIRCASE WALL (only for multi-floor buildings) ───────────── */}
        {isMultiFloor && (
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="px-4 py-3" style={{ borderBottom: includeStaircaseWall ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <Toggle checked={includeStaircaseWall} onChange={() => setIncludeStaircaseWall(v => !v)} />
                <div>
                  <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    09 — STAIRCASE WALL (shared across all floors)
                  </p>
                  {!includeStaircaseWall && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
                      Toggle to include — runs full building height, calculated as one separate line item
                    </p>
                  )}
                </div>
              </label>
            </div>

            {includeStaircaseWall && (
              <div className="p-4 space-y-4">
                <AlertBox variant="info">
                  A shared staircase wall runs continuously from ground to top floor. It is calculated as one line item (length × full building height), independent of the per-floor room schedule.
                </AlertBox>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                      Staircase Wall Length (ft)
                      <TipBtn id="stairlen" open={openTip} onToggle={toggleTip}>
                        Enter the total perimeter length of the staircase enclosure in feet. For a typical open-well stair, measure the length of the masonry walls that enclose the staircase.
                      </TipBtn>
                    </label>
                    <input type="number" value={staircaseLengthFt}
                      onChange={e => setStaircaseLengthFt(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full border rounded-[6px] px-3 py-2 text-[14px]  outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }} />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                      Total Building Height (ft)
                      <TipBtn id="stairht" open={openTip} onToggle={toggleTip}>
                        Auto-calculated as average floor height × number of floors. Override if your staircase runs a different height than the floors entered above.
                      </TipBtn>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-[6px] text-[12px]"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                        Auto: {autoStaircaseHeightFt.toFixed(1)} ft ({totalFloorCount} floor{totalFloorCount !== 1 ? 's' : ''} × {floorHFt.toFixed(1)} ft)
                      </div>
                      <input type="number" value={staircaseHeightOverrideFt}
                        onChange={e => setStaircaseHeightOverrideFt(e.target.value)}
                        placeholder="Override"
                        className="w-28 border rounded-[6px] px-2 py-2 text-[13px]  outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                    </div>
                    {staircaseHeightOverrideFt && (
                      <p className="text-[10px] mt-1" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                        ⚠ Using override: {effectiveStaircaseHeightFt.toFixed(1)} ft
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {(parseFloat(staircaseLengthFt) || 0) > 0 && (
                  <div className="p-3 rounded-[2px]"
                    style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.15)' }}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Length</p>
                        <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{parseFloat(staircaseLengthFt).toFixed(1)} ft</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Height</p>
                        <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'var(--text-primary)' }}>{effectiveStaircaseHeightFt.toFixed(1)} ft</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Wall Area</p>
                        <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>
                          {((parseFloat(staircaseLengthFt) || 0) * effectiveStaircaseHeightFt * 0.0929).toFixed(1)} sqm
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>
                      Wall type: {extSpec.shortLabel} · ≈ {Math.round(extSpec.unitsPerSqm * (parseFloat(staircaseLengthFt) || 0) * effectiveStaircaseHeightFt * 0.0929).toLocaleString('en-IN')} {extSpec.unitLabel}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 10 ROOF TYPE ──────────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeRoofSection ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeRoofSection} onChange={() => setIncludeRoofSection(v => !v)} />
              <div className="flex items-center gap-1">
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  10 — ROOF TYPE
                </p>
                <ISBadge code="NBC 2016" />
              </div>
            </label>
            {!includeRoofSection && (
              <p className="text-[11px] mt-1 ml-13" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)', paddingLeft: 52 }}>
                Excluded — roof masonry not included in cost
              </p>
            )}
          </div>
          {includeRoofSection && <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['flat',   'Full Flat Terrace', 'RCC slab with parapet'],
                ['sloped', 'Full Sloped Roof',  'Mangalore/GI/Poly/Truss'],
                ['mixed',  'Mixed',             'Partial terrace + partial slope'],
              ] as [RoofType, string, string][]).map(([val, label, sub]) => (
                <button key={val} type="button" onClick={() => setRoofType(val)}
                  className="p-3 rounded-[2px] text-left"
                  style={{
                    border: `1.5px solid ${roofType === val ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`,
                    background: roofType === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                  }}>
                  <p className="text-[13px] font-medium" style={{ color: roofType === val ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-sans)' }}>{sub}</p>
                </button>
              ))}
            </div>

            {/* Flat / Mixed: terrace parapet coping */}
            {(roofType === 'flat' || roofType === 'mixed') && (
              <div>
                <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  NBC 2016 Cl 3.6.2: Parapet min height 900mm above roof. Parapet brickwork auto-calculated from terrace area perimeter.
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={terraceParapetCoping}
                    onChange={() => setTerraceParapetCoping(v => !v)}
                    className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
                  />
                  <span className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
                    Include terrace parapet coping (stone/PCC — protects parapet top from water ingress)
                  </span>
                </label>
              </div>
            )}

            {/* Sloped / Mixed: roof covering + gable wall + ridge */}
            {(roofType === 'sloped' || roofType === 'mixed') && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest block mb-2"
                    style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                    Roof Covering Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['mangalore_tiles', 'Mangalore Clay Tiles',  'IS 654:1992 · 10–14 tiles/sqm'],
                      ['gi_sheet',        'GI Corrugated Sheet',   'Galvanised iron — 0.63mm min'],
                      ['polycarbonate',   'Polycarbonate Sheet',   '6mm twin-wall — light + heat'],
                      ['ms_truss',        'MS Truss (open frame)', 'Structural steel — specify cladding'],
                    ] as [SlopedRoofCovering, string, string][]).map(([val, label, sub]) => (
                      <button key={val} type="button" onClick={() => setSlopedRoofCovering(val)}
                        className="p-2.5 rounded-[2px] text-left"
                        style={{
                          border: `1.5px solid ${slopedRoofCovering === val ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`,
                          background: slopedRoofCovering === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                        }}>
                        <p className="text-[12px] font-medium" style={{ color: slopedRoofCovering === val ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>{sub}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <AlertBox variant="error">
                      ⛔ Asbestos is banned in India under Environment Protection Act 1986. Cannot estimate asbestos roofing.
                    </AlertBox>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                      Gable Wall Area (sqm)
                    </label>
                    <input type="number" value={gableWallAreaSqm}
                      onChange={e => setGableWallAreaSqm(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                      Triangular wall area at each end of sloped roof
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>
                      Ridge Length (m)
                    </label>
                    <input type="number" value={ridgeLengthM}
                      onChange={e => setRidgeLengthM(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.35)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                      Length of the ridge beam at roof apex
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>}
        </div>

        {/* ── 11 PLASTERING ─────────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includePlasterSection ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includePlasterSection} onChange={() => setIncludePlasterSection(v => !v)} />
              <div className="flex items-center gap-1">
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  11 — PLASTERING
                </p>
                <ISBadge code="IS 1661:1972" />
              </div>
            </label>
            {!includePlasterSection && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)', paddingLeft: 52 }}>
                Excluded — plastering cost not included
              </p>
            )}
          </div>
          {includePlasterSection && (
            <div className="p-4">
              <div className="space-y-2">
                {([
                  ['internal', 'Internal 12mm (1:4)'],
                  ['external', 'External 15mm (1:4)'],
                  ['ceiling',  'Ceiling 6mm (1:3)'],
                ] as [keyof typeof plastering, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={plastering[key]}
                      onChange={() => setPlastering(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }} />
                    <span className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 12 WATERPROOFING ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeWPSection ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeWPSection} onChange={() => setIncludeWPSection(v => !v)} />
              <div className="flex items-center gap-1">
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  12 — WATERPROOFING
                </p>
                <ISBadge code="IS 2645:2003" />
              </div>
            </label>
            {!includeWPSection && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)', paddingLeft: 52 }}>
                Excluded — waterproofing cost not included
              </p>
            )}
          </div>
          {includeWPSection && <div className="p-4 space-y-3">
            {/* Terrace */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={includeTerWP} onChange={() => setTerraceWP(v => !v)}
                className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }} />
              <span className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Terrace waterproofing</span>
            </label>
            {includeTerWP && (
              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" value={terraceArea} onChange={e => setTerraceArea(e.target.value)}
                  placeholder="Terrace area (sqft)"
                  className="border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                <select value={terraceWPMethod} onChange={e => setTerraceWPMethod(e.target.value as WaterproofingMethod)}
                  className="border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }}>
                  <option value="bbc">Brick Bat Coba — ₹155–225/sqft</option>
                  <option value="membrane">APP Bitumen Membrane — ₹120–175/sqft</option>
                  <option value="liquid">Liquid Applied — ₹85–130/sqft</option>
                  <option value="ips">IPS Screed — ₹110–155/sqft</option>
                  <option value="none">Skip terrace WP</option>
                </select>
              </div>
            )}
            {/* Bathroom */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={includeBathWP} onChange={() => setBathWP(v => !v)}
                className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }} />
              <span className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Sunken bathroom waterproofing</span>
            </label>
            {includeBathWP && (
              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={bathroomCount} onChange={e => setBathroomCount(e.target.value)}
                  className="border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }}>
                  {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} bathroom{n !== 1 ? 's' : ''}</option>)}
                </select>
                <select value={bathroomWPMethod} onChange={e => setBathroomWPMethod(e.target.value as BathroomWpMethod)}
                  className="border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }}>
                  <option value="cementitious">Cementitious Slurry — ₹88–145/sqft</option>
                  <option value="crystalline">Crystalline (Xypex) — ₹145–220/sqft</option>
                  <option value="pu">PU (DrFixit 2K) — ₹180–250/sqft</option>
                  <option value="none">Skip bathroom WP</option>
                </select>
              </div>
            )}
          </div>}
        </div>

        {/* ── ADVANCED: TECHNICAL SPECS ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <button type="button" onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ADVANCED — TECHNICAL SPECIFICATIONS
            </p>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>
          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="pt-3">
                <AlertBox variant="info">
                  Auto-set per IS codes for your wall type. Change only if your structural engineer has specified different values in writing.
                </AlertBox>
              </div>
              {/* Mortar grade */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Mortar Grade</label>
                  <ISBadge code="IS 2250:1981" />
                  <TipBtn id="mortar" open={openTip} onToggle={toggleTip}>
                    1:6 (M4) for 9-inch load-bearing walls. 1:4 (M2) for 4.5-inch partition walls. Never use 1:8 for structural masonry.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['1:6', '1:4'] as MortarGrade[]).map(m => (
                    <button key={m} type="button" onClick={() => setMortarGrade(m)}
                      className="py-2 rounded-[2px] text-center transition-all"
                      style={{
                        border: `1.5px solid ${mortarGrade === m ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`,
                        background: mortarGrade === m ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: mortarGrade === m ? '#1F4E79' : 'var(--text-primary)',
                        fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                      }}>
                      {m === '1:6' ? '1:6 (M4) — 9" load-bearing' : '1:4 (M2) — 4.5" partitions'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Seismic zone */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Seismic Zone</label>
                  <ISBadge code="IS 4326:1993" />
                </div>
                <div className="px-3 py-2 rounded-[6px] text-[13px]"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                  Zone {szInfo.zone} · Z-Factor {szInfo.zFactor} · {isHighSeismic ? 'Seismic bands MANDATORY' : 'Seismic bands recommended'}
                </div>
              </div>
              {/* Brick class */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Brick Class</label>
                  <ISBadge code="IS 1077:1992" />
                  <TipBtn id="brickclass" open={openTip} onToggle={toggleTip}>
                    Class 7.5 = 7.5 N/mm² (minimum for load-bearing). Class 10 = standard. Class 15 = high-load. Always ask supplier for test certificates.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['7.5', '10', '15'] as BrickClass[]).map(c => (
                    <button key={c} type="button" onClick={() => setBrickClass(c)}
                      className="py-2 rounded-[2px] text-center transition-all"
                      style={{
                        border: `1.5px solid ${brickClass === c ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`,
                        background: brickClass === c ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: brickClass === c ? '#1F4E79' : 'var(--text-primary)',
                        fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                      }}>
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => { if (validate3a()) setSubStep('3b') }}
              className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
              style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
              Continue to Material Rates →
            </button>
          </div>
        </>)}

        {subStep === '3b' && (<>
          <button type="button" onClick={() => setSubStep('3a')}
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(255,255,255,0.50)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to Structure Details
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3b · MATERIAL RATES</p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Enter Your Local Material Rates</h3>
          </div>
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
              <strong>Why local rates matter:</strong> We calculate exact quantities using IS codes — quantities are universal. But material prices vary by 20–40% between cities. Enter your local rates to get an accurate cost estimate for your location.
            </p>
          </div>
          <AlertBox variant="tip">
            <strong>India Average 2026</strong> rates pre-loaded. Get 3 supplier quotes before finalising — brick rates vary 30–40% across states.
          </AlertBox>
          <AlertBox variant="caution">
            Contractor-supplied brick is typically 10–20% above market. Always ask for supply bill separately.
          </AlertBox>
          <div className="space-y-3">
            {([
              ['clayBrick',   'Clay modular brick',     '₹/1000', 9500],
              ['flyAshBrick', 'Fly ash brick',          '₹/1000', 7000],
              ['aacBlock',    'AAC block',              '₹/cft',     55],
              ['cement',      'Cement (OPC)',           '₹/bag',    410],
              ['sand',        'Sand',                   '₹/cft',     28],
              ['wpCompound',  'Waterproofing compound', '₹/kg',     230],
            ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
              <div key={key} className="p-3 rounded-[2px] border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-3">
                  <label className="text-[13px] flex-1 font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px]  outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · India Avg ₹{avg.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                {MASON_REGIONAL_NOTES[key] && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-sans)' }}>
                    {MASON_REGIONAL_NOTES[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setRates({ ...INDIA_AVG_RATES })}
            className="text-[11px] px-3 py-1.5 rounded-[2px] transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
            Reset to India Average
          </button>

          {/* Contractor Quote */}
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            <SectionHeader num="13" title="CONTRACTOR QUOTE (OPTIONAL)" />
          <div className="p-4 space-y-3">
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
              Have a contractor quote? Enter it to compare after unlocking your report.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Contractor Name (optional)</label>
                <input type="text" value={contractorName} onChange={e => setCtName(e.target.value)}
                  placeholder="e.g. Ramesh Constructions"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-mono)' }}>Total Quoted Amount (₹)</label>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>₹</span>
                  <input type="number" value={contractorTotal} onChange={e => setCtTotal(e.target.value)}
                    placeholder="e.g. 350000"
                    className="flex-1 border rounded-[6px] px-3 py-2 text-[13px]  outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>
            {contractorTotal && (
              <p className="text-[11px]" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                ✓ Quote saved. Comparison available after unlocking report.
              </p>
            )}
          </div>
        </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setSubStep('3c')}
              className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
              style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
              Continue to Labour →
            </button>
            <button type="button" onClick={handleSubmit}
              className="flex-1 py-3 rounded-[6px] font-semibold text-[15px] transition-all"
              style={{ background: 'transparent', color: '#8C3A22', border: '1.5px solid #8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
              Skip Labour — Calculate Now →
            </button>
          </div>
        </>)}

        {subStep === '3c' && (<>
          <button type="button" onClick={() => setSubStep('3b')}
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(255,255,255,0.50)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to Material Rates
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3c · LABOUR ESTIMATION</p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Include Labour Cost? (Optional)</h3>
          </div>
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>
              Labour costs vary significantly with season (monsoon shutdowns, festival breaks), location, and site conditions. CPWD DSR 2023 rates are government benchmarks — actual rates typically differ by ±20–30%.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIncludeLabour(true)}
              className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${includeLabour ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`, background: includeLabour ? 'rgba(31,78,121,0.06)' : 'var(--bg-surface)' }}
            >
              <p className="text-[15px] font-semibold mb-1" style={{ color: includeLabour ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Include Labour Cost</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-sans)' }}>Use CPWD DSR 2023 rates. Edit workers, rates, and productivity per trade. Labour appears only in paid PDF report.</p>
            </button>
            <button
              type="button"
              onClick={() => setIncludeLabour(false)}
              className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${!includeLabour ? '#1F4E79' : 'rgba(255,255,255,0.10)'}`, background: !includeLabour ? 'rgba(31,78,121,0.06)' : 'var(--bg-surface)' }}
            >
              <p className="text-[15px] font-semibold mb-1" style={{ color: !includeLabour ? '#1F4E79' : 'var(--text-primary)', fontFamily: 'var(--font-plex-sans)' }}>Skip — Material Cost Only</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour later from your contractor quote.</p>
            </button>
          </div>

          {includeLabour && (
            <div className="space-y-4">
              <AlertBox variant="caution">
                <strong>CPWD DSR 2023 rates.</strong> Curing intervals (IS 2212:1991: minimum 7 days), monsoon shutdowns, festival breaks, sand bans — no software can predict these. Masonry starts 60–90 days after RCC pour.
              </AlertBox>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Trade', 'Workers', 'Rate/day ₹', 'India Avg', 'CPWD Basis', 'Days'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', opacity: trade.active ? 1 : 0.35 }}>
                        <td className="py-1.5 px-2" style={{ fontFamily: 'var(--font-plex-sans)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{trade.name}</td>
                        <td className="py-1 px-2">
                          <div className="flex items-center gap-1">
                            <button type="button"
                              onClick={() => updateTrade(trade.id, 'active', !trade.active)}
                              className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
                              style={{ border: '1px solid rgba(255,255,255,0.15)', background: trade.active ? 'rgba(140,58,34,0.1)' : 'rgba(20,83,45,0.1)', color: trade.active ? '#8C3A22' : '#14532D' }}>
                              {trade.active ? '−' : '+'}
                            </button>
                            <input type="number" value={trade.workers} disabled={!trade.active}
                              onChange={e => updateTrade(trade.id, 'workers', parseInt(e.target.value) || 0)}
                              className="w-10 border rounded px-1 py-0.5 text-center text-[11px]  outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={trade.ratePerDay} disabled={!trade.active}
                            onChange={e => updateTrade(trade.id, 'ratePerDay', parseInt(e.target.value) || 0)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-mono)' }}>₹{trade.indiaAvgRate}</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-plex-sans)' }}>{trade.basisText}</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>auto</td>
                      </tr>
                    ))}
                    {customTrades.map(ct => (
                      <tr key={ct.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-1 px-2">
                          <input type="text" value={ct.name} onChange={e => updateCustomTrade(ct.id, 'name', e.target.value)}
                            placeholder="Trade name" className="w-32 border rounded px-1 py-0.5 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.workers} onChange={e => updateCustomTrade(ct.id, 'workers', e.target.value)}
                            className="w-10 border rounded px-1 py-0.5 text-center text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.ratePerDay} onChange={e => updateCustomTrade(ct.id, 'ratePerDay', e.target.value)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>—</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-plex-sans)', fontSize: 10 }}>Custom</td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.days} onChange={e => updateCustomTrade(ct.id, 'days', e.target.value)}
                            placeholder="days" className="w-14 border rounded px-1 py-0.5 text-[11px]  outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addCustomTrade}
                className="text-[11px] px-3 py-1.5 rounded-[2px]"
                style={{ border: '1px dashed rgba(255,255,255,0.20)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                + Add Your Own Labour
              </button>
            </div>
          )}

          <button type="button" onClick={handleSubmit}
            className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
            style={{ background: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}>
            Calculate My Estimate →
          </button>
        </>)}
      </div>
    </div>
  )
}

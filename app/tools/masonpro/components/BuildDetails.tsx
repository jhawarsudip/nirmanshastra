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

type AreaUnit = 'sqm' | 'sqft'
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
interface CustomDoor { id: string; count: string; widthMm: string; heightMm: string }
interface BalconyFormRow { id: string; name: string; perimeterM: string; parapetHeightMm: string; thicknessMm: 115 | 230 }

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
          style={{ background: '#fff', border: '1px solid rgba(31,78,121,0.3)', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 12, lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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
      <div className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{children}</div>
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
    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
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
      style={{ background: checked ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
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
  projectId:     string
  projectName:   string
  city:          string
  state:         string
  numFloors:     number | null   // normalized: total floors (G=1, G+1=2 …)
  perFloorAreas: number[] | null
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

  // S1 — Project Details
  // MasonPro numFloors: 0=G, 1=G+1 → from DB total floors: G+ = totalFloors-1
  const initNumFloors = initialProject?.numFloors != null ? Math.max(0, initialProject.numFloors - 1) : 1

  const [projectName, setProjectName] = useState(initialProject?.projectName ?? '')
  const [numFloors, setNumFloors]     = useState(initNumFloors)
  const [localState, setLocalState]   = useState(initialProject?.state ?? state)
  const [localCity, setLocalCity]     = useState(initialProject?.city ?? city)

  // S2 — Wall type (global)
  const [extWallType, setExtWallType] = useState<ExternalWallType>('clay_modular_9')

  // S3 — Room schedule
  const [rooms, setRooms] = useState<RoomFormRow[]>([])

  // S4 — Door schedule
  const [doorCounts, setDoorCounts] = useState<Record<string, string>>({
    main: '1', room: '', bathroom: '', toilet: '',
  })
  const [customDoors, setCustomDoors] = useState<CustomDoor[]>([])

  // S5 — Window schedule
  const [windowCounts, setWindowCounts] = useState<Record<string, string>>(
    Object.fromEntries(WINDOW_PRESETS.map(w => [w.key, '']))
  )

  // S6 — Internal
  const [includeInternal, setIncludeInt] = useState(false)
  const [intWallType, setIntWallType]    = useState<InternalWallType>('clay_4_5')
  const [intWallArea, setIntWallArea]    = useState('')
  const [intAreaUnit, setIntAreaUnit]    = useState<AreaUnit>('sqm')

  // S7 — Balcony
  const [includeBalcony, setIncludeBalcony] = useState(false)
  const [balconies, setBalconies] = useState<BalconyFormRow[]>([])

  // S8 — Compound wall
  const [includeCompound, setIncludeCompound] = useState(false)
  const [compPerimeterM, setCompPerimeterM]   = useState('')
  const [compHeightM, setCompHeightM]         = useState('1.5')
  const [compThicknessMm, setCompThicknessMm] = useState<230 | 115>(230)
  const [compGateWidthM, setCompGateWidthM]   = useState('')
  const [compPillarOverride, setCompPillarOverride] = useState('')

  // S9 — Roof type
  const [roofType, setRoofType]                   = useState<RoofType>('flat')
  const [slopedRoofCovering, setSlopedRoofCovering] = useState<SlopedRoofCovering>('mangalore_tiles')
  const [gableWallAreaSqm, setGableWallAreaSqm]   = useState('')
  const [ridgeLengthM, setRidgeLengthM]           = useState('')
  const [terraceParapetCoping, setTerraceParapetCoping] = useState(false)

  // S10 — Plaster
  const [plastering, setPlastering] = useState({ internal: true, external: true, ceiling: false })

  // S11 — Waterproofing
  const [includeTerWP, setTerraceWP]       = useState(false)
  const [terraceArea, setTerraceArea]       = useState('')
  const [terraceWPMethod, setTerraceWPMethod] = useState<WaterproofingMethod>('bbc')
  const [includeBathWP, setBathWP]          = useState(false)
  const [bathroomCount, setBathroomCount]   = useState('2')
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

  const szInfo       = seismicZoneFromState(localState)
  const extSpec      = EXTERNAL_WALL_SPECS[extWallType]
  const isHighSeismic = szInfo.zone === 'IV' || szInfo.zone === 'V'
  const showAacWarn   = extWallType === 'aac_200' && isHighSeismic

  const grossExtSqm = rooms.reduce((sum, r) => {
    const l = parseFloat(r.lengthFt) || 0
    const w = parseFloat(r.widthFt) || 0
    const h = parseFloat(r.heightFt) || 0
    return sum + 2 * (l + w) * h * SQM_PER_SQFT
  }, 0)

  const doorDeductSqm = (() => {
    let total = 0
    for (const preset of DOOR_PRESETS) {
      const c = parseInt(doorCounts[preset.key] || '0') || 0
      if (c > 0 && preset.areaSqm >= 0.1) total += c * preset.areaSqm
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

  const windowDeductSqm = WINDOW_PRESETS.reduce((sum, wp) => {
    const c = parseInt(windowCounts[wp.key] || '0') || 0
    return sum + (c > 0 && wp.areaSqm >= 0.1 ? c * wp.areaSqm : 0)
  }, 0)

  const netExtSqm = Math.max(0, grossExtSqm - doorDeductSqm - windowDeductSqm)

  const totalBalconyParapetSqm = balconies.reduce((sum, b) => {
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
    onFormChange({ wallType: extWallType, floors: `G+${numFloors - 1}`, labourEnabled: includeLabour })
  }, [extWallType, numFloors, includeLabour, onFormChange])

  useEffect(() => {
    setMortarGrade(extWallType.includes('4_5') || intWallType.includes('4_5') ? '1:4' : '1:6')
  }, [extWallType, intWallType])

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function toSqm(area: string, unit: AreaUnit) {
    const v = parseFloat(area)
    return (!v || v <= 0) ? 0 : unit === 'sqft' ? v * SQM_PER_SQFT : v
  }

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function addRoom() {
    setRooms(prev => [...prev, { id: `r${Date.now()}`, name: '', lengthFt: '', widthFt: '', heightFt: '10' }])
  }

  function updateRoom(id: string, key: keyof RoomFormRow, val: string) {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  function removeRoom(id: string) { setRooms(prev => prev.filter(r => r.id !== id)) }

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
    if (rooms.length === 0) e.rooms = 'Add at least one room / floor area'
    else if (grossExtSqm <= 0) e.rooms = 'Enter valid dimensions for at least one room'
    if (includeInternal && (!intWallArea || parseFloat(intWallArea) <= 0)) e.intWallArea = 'Enter internal wall area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate3a()) {
      setSubStep('3a')
      return
    }

    const doorsForEngine = [
      ...DOOR_PRESETS.map(p => ({
        id: p.key, label: p.label, widthMm: p.widthMm, heightMm: p.heightMm,
        count: parseInt(doorCounts[p.key] || '0') || 0,
      })),
      ...customDoors.map(cd => ({
        id: cd.id, label: 'Custom Door',
        widthMm: parseInt(cd.widthMm) || 0,
        heightMm: parseInt(cd.heightMm) || 0,
        count: parseInt(cd.count) || 0,
        isCustom: true as const,
      })),
    ]

    const windowsForEngine = WINDOW_PRESETS.map(wp => ({
      id: wp.key, label: wp.label, widthMm: wp.widthMm, heightMm: wp.heightMm,
      count: parseInt(windowCounts[wp.key] || '0') || 0,
    }))

    const roomsForEngine = rooms.map(r => ({
      id: r.id, name: r.name || 'Room',
      lengthFt: parseFloat(r.lengthFt) || 0,
      widthFt: parseFloat(r.widthFt) || 0,
      wallHeightM: (parseFloat(r.heightFt) || 0) * 0.3048,
      wallType: 'external' as const,
    }))

    const balconiesForEngine = balconies.map(b => ({
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
      includeInternal,
      internalWallType: includeInternal ? intWallType : undefined,
      internalWallAreaSqm: includeInternal ? toSqm(intWallArea, intAreaUnit) : 0,
      includePlaster: plastering.internal || plastering.external || plastering.ceiling,
      plasterInternal: plastering.internal,
      plasterExternal: plastering.external,
      plasterCeiling: plastering.ceiling,
      includeWaterproofing: includeTerWP || includeBathWP,
      terraceAreaSqft: includeTerWP ? (parseFloat(terraceArea) || 0) : 0,
      bathroomCount: includeBathWP ? (parseInt(bathroomCount) || 0) : 0,
      terraceWpMethod: terraceWPMethod,
      bathroomWpMethod: bathroomWPMethod,
      numFloors,
      rooms: roomsForEngine,
      doors: doorsForEngine,
      windows: windowsForEngine,
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
      roofType,
      slopedRoofCovering: roofType !== 'flat' ? slopedRoofCovering : undefined,
      gableWallAreaSqm: roofType !== 'flat' ? (parseFloat(gableWallAreaSqm) || 0) : 0,
      ridgeLengthM: roofType !== 'flat' ? (parseFloat(ridgeLengthM) || 0) : 0,
      terraceParapetCoping: roofType !== 'sloped' ? terraceParapetCoping : false,
      contractorQuote: contractorTotal ? parseFloat(contractorTotal) : undefined,
      includeLabour,
    })
  }

  // ── Area summary bar ──────────────────────────────────────────────────────────

  const AreaSummaryBar = () => (
    <div className="grid grid-cols-3 gap-2 p-3 rounded-[2px]"
      style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.15)' }}>
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>GROSS WALL</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>{grossExtSqm.toFixed(1)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
      <div className="text-center" style={{ borderLeft: '1px solid rgba(30,34,39,0.1)', borderRight: '1px solid rgba(30,34,39,0.1)' }}>
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>OPENINGS</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>−{(doorDeductSqm + windowDeductSqm).toFixed(2)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>NET AREA</p>
        <p className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>{netExtSqm.toFixed(1)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>sqm</p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
      <div className="py-8 px-6 md:px-10" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          02 · MASONRY + PLASTER
        </p>
        <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 600, color: '#1E2227', lineHeight: 1.2 }}>
          Build Details
        </h1>
      </div>

      <div className="px-6 md:px-10 pt-6 space-y-6">

        {/* Progress Indicator */}
        <div className="flex items-center flex-wrap gap-x-0.5 gap-y-2 pb-4 overflow-x-auto" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
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
                color: step.active ? '#fff' : step.done ? '#14532D' : 'rgba(30,34,39,0.35)',
                border: `1px solid ${step.active ? 'transparent' : step.done ? 'rgba(20,83,45,0.2)' : 'rgba(30,34,39,0.12)'}`,
                whiteSpace: 'nowrap',
              }}>
                {step.done ? '✓ ' : ''}{step.label}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: 'rgba(30,34,39,0.25)', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '0 3px' }}>—</span>
              )}
            </div>
          ))}
        </div>

        {subStep === '3a' && (<>
        {onBack && (
          <button type="button" onClick={onBack}
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.55)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Change Method
          </button>
        )}
        {/* Location chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)' }}>
          <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>
            📍 {localCity}, {localState}
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px]"
            style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
            SEISMIC ZONE {szInfo.zone} · Z={szInfo.zFactor}
          </span>
        </div>

        {/* ── 01 PROJECT DETAILS ─────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="01" title="PROJECT DETAILS" />
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Project Name</label>
              <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Sharma Residence"
                className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Number of Floors</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[0,1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setNumFloors(n)}
                    className="py-2 rounded-[2px] text-center transition-all"
                    style={{
                      border: `1px solid ${numFloors === n ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                      background: numFloors === n ? '#1F4E79' : 'transparent',
                      color: numFloors === n ? '#fff' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                    }}>{n === 0 ? 'G' : `G+${n}`}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>State</label>
                <select value={localState} onChange={e => setLocalState(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>City</label>
                <input type="text" value={localCity} onChange={e => setLocalCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 02 EXTERNAL WALL TYPE ──────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
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
                      border: `1.5px solid ${selected ? '#1F4E79' : aacRisk ? 'rgba(217,154,6,0.5)' : 'rgba(30,34,39,0.18)'}`,
                      background: selected ? 'rgba(31,78,121,0.06)' : 'transparent',
                    }}>
                    <p className="text-[12px] font-medium leading-tight mb-0.5"
                      style={{ color: selected ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                      {spec.shortLabel}
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
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
          </div>
        </div>

        {/* ── 03 ROOM / FLOOR SCHEDULE ──────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="03" title="ROOM / FLOOR SCHEDULE — GROSS WALL AREA" />
          <div className="p-4 space-y-4">
            <AlertBox variant="info">
              Add each floor or wing separately. Perimeter = 2 × (Length + Width). Gross wall area = Perimeter × Height. Openings are deducted in sections 04 and 05.
            </AlertBox>

            {rooms.length > 0 && (
              <div className="space-y-2">
                {/* Table header */}
                <div className="hidden sm:grid text-[9px] uppercase tracking-widest px-2"
                  style={{ gridTemplateColumns: '1fr 80px 80px 80px 28px', gap: 8, color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  <span>Name</span><span>Length ft</span><span>Width ft</span><span>Height ft</span><span></span>
                </div>

                {rooms.map((r, idx) => {
                  const l = parseFloat(r.lengthFt) || 0
                  const w = parseFloat(r.widthFt) || 0
                  const h = parseFloat(r.heightFt) || 0
                  const areaSqm = 2 * (l + w) * h * SQM_PER_SQFT
                  const bricksEst = areaSqm > 0 ? Math.round(extSpec.unitsPerSqm * areaSqm) : 0
                  return (
                    <div key={r.id} className="p-3 rounded-[2px]"
                      style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.01)' }}>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
                        <input type="text" value={r.name}
                          onChange={e => updateRoom(r.id, 'name', e.target.value)}
                          placeholder={`Floor / Wing ${idx + 1}`}
                          className="flex-1 min-w-0 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                          style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        <input type="number" value={r.lengthFt}
                          onChange={e => updateRoom(r.id, 'lengthFt', e.target.value)}
                          placeholder="Length"
                          className="w-20 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                          style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        <input type="number" value={r.widthFt}
                          onChange={e => updateRoom(r.id, 'widthFt', e.target.value)}
                          placeholder="Width"
                          className="w-20 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                          style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        <input type="number" value={r.heightFt}
                          onChange={e => updateRoom(r.id, 'heightFt', e.target.value)}
                          placeholder="Ht"
                          className="w-16 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                          style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        <button type="button" onClick={() => removeRoom(r.id)}
                          className="w-7 h-7 rounded-[2px] flex items-center justify-center flex-shrink-0 text-[14px]"
                          style={{ border: '1px solid rgba(140,58,34,0.3)', color: '#8C3A22', background: 'rgba(140,58,34,0.05)' }}>
                          ×
                        </button>
                      </div>
                      {areaSqm > 0 && (
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                            Perimeter: {monoVal(`${(2 * (l + w)).toFixed(1)} ft`)}
                          </span>
                          <span className="text-[10px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                            Wall area: {monoVal(`${areaSqm.toFixed(1)} sqm`)}
                          </span>
                          <span className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                            ≈ {monoVal(bricksEst.toLocaleString('en-IN'))} {extSpec.unitLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <button type="button" onClick={addRoom}
              className="w-full py-2.5 rounded-[2px] text-[12px] transition-all"
              style={{ border: '1px dashed rgba(31,78,121,0.4)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'rgba(31,78,121,0.02)' }}>
              + Add Room / Area
            </button>

            {errors.rooms && (
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.rooms}</p>
            )}

            {grossExtSqm > 0 && (
              <div className="pt-1">
                <p className="text-[10px] mb-2 uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Running Total
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(31,78,121,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: '100%', background: '#1F4E79' }} />
                  </div>
                  <span className="text-[15px] font-medium flex-shrink-0" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>
                    {grossExtSqm.toFixed(1)} sqm
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  Gross wall area before door/window deductions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 04 DOOR SCHEDULE ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="04" title="DOOR SCHEDULE — OPENING DEDUCTIONS" />
          <div className="p-4 space-y-3">
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
              ⓘ Openings below 0.1 sqm not deducted per standard practice
            </p>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                    {['Door Type', 'Size (mm)', 'Area/door', 'Count', 'Deduction'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOOR_PRESETS.map(preset => {
                    const c = parseInt(doorCounts[preset.key] || '0') || 0
                    const deduct = c * preset.areaSqm
                    return (
                      <tr key={preset.key} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-2 px-2 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>{preset.label}</td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.55)' }}>
                          {preset.widthMm}×{preset.heightMm}
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.55)' }}>
                          {preset.areaSqm} sqm
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" min="0"
                            value={doorCounts[preset.key] ?? ''}
                            onChange={e => setDoorCounts(prev => ({ ...prev, [preset.key]: e.target.value }))}
                            placeholder="0"
                            className="w-16 border rounded-[6px] px-2 py-1 text-[13px] bg-sheet-white outline-none text-center"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(30,34,39,0.3)' }}>
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
                      <tr key={cd.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-2 px-2">
                          <span className="text-[11px]" style={{ fontFamily: 'var(--font-plex-sans)', color: 'rgba(30,34,39,0.55)' }}>Custom</span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" value={cd.widthMm}
                              onChange={e => updateCustomDoor(cd.id, 'widthMm', e.target.value)}
                              placeholder="W"
                              className="w-14 border rounded-[6px] px-1.5 py-1 text-[11px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                            <span className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)' }}>×</span>
                            <input type="number" value={cd.heightMm}
                              onChange={e => updateCustomDoor(cd.id, 'heightMm', e.target.value)}
                              placeholder="H"
                              className="w-14 border rounded-[6px] px-1.5 py-1 text-[11px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.45)' }}>
                          {area > 0 ? `${area.toFixed(3)} sqm` : '—'}
                          {area > 0 && area < 0.1 && <span className="text-[9px] ml-1" style={{ color: '#D99A06' }}>not deducted</span>}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" value={cd.count}
                              onChange={e => updateCustomDoor(cd.id, 'count', e.target.value)}
                              className="w-16 border rounded-[6px] px-2 py-1 text-[13px] bg-sheet-white outline-none text-center"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                            <button type="button" onClick={() => removeCustomDoor(cd.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-[12px]"
                              style={{ color: '#8C3A22', border: '1px solid rgba(140,58,34,0.2)', background: 'rgba(140,58,34,0.04)' }}>
                              ×
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(30,34,39,0.3)' }}>
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
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="05" title="WINDOW SCHEDULE — OPENING DEDUCTIONS" />
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                    {['Window Type', 'Area/window', 'Count', 'Deduction'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WINDOW_PRESETS.map(wp => {
                    const c = parseInt(windowCounts[wp.key] || '0') || 0
                    const deduct = c * wp.areaSqm
                    return (
                      <tr key={wp.key} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-2 px-2 text-[12px]" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227' }}>{wp.label}</td>
                        <td className="py-2 px-2 text-[11px]" style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.55)' }}>
                          {wp.areaSqm} sqm
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" min="0"
                            value={windowCounts[wp.key] ?? ''}
                            onChange={e => setWindowCounts(prev => ({ ...prev, [wp.key]: e.target.value }))}
                            placeholder="0"
                            className="w-16 border rounded-[6px] px-2 py-1 text-[13px] bg-sheet-white outline-none text-center"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                        </td>
                        <td className="py-2 px-2 text-[11px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: deduct > 0 ? '#8C3A22' : 'rgba(30,34,39,0.3)' }}>
                          {deduct > 0 ? `−${deduct.toFixed(2)} sqm` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {windowDeductSqm > 0 && (
              <p className="text-[12px] font-medium text-right" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>
                Total window deduction: {windowDeductSqm.toFixed(2)} sqm
              </p>
            )}
          </div>
        </div>

        {/* ── AREA SUMMARY ──────────────────────────────────────────────────── */}
        {grossExtSqm > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              WALL AREA SUMMARY
            </p>
            <AreaSummaryBar />
            {netExtSqm > 0 && (
              <p className="text-[11px] mt-2" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                ✓ {Math.round(extSpec.unitsPerSqm * netExtSqm).toLocaleString('en-IN')} {extSpec.unitLabel} required for net wall area
              </p>
            )}
          </div>
        )}

        {/* ── 06 INTERNAL PARTITIONS ────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeInternal ? '1px solid rgba(30,34,39,0.12)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeInternal} onChange={() => setIncludeInt(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  06 — INTERNAL PARTITION WALLS
                </p>
                {!includeInternal && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeInternal && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(INTERNAL_WALL_SPECS) as InternalWallType[]).map(type => {
                  const spec = INTERNAL_WALL_SPECS[type]
                  const selected = intWallType === type
                  return (
                    <button key={type} type="button" onClick={() => setIntWallType(type)}
                      className="text-left p-3 rounded-[2px] transition-all"
                      style={{
                        border: `1.5px solid ${selected ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                        background: selected ? 'rgba(31,78,121,0.06)' : 'transparent',
                      }}>
                      <p className="text-[11px] font-medium leading-tight"
                        style={{ color: selected ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                        {spec.shortLabel}
                      </p>
                      {spec.unitsPerSqm > 0 && (
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                          {spec.unitsPerSqm.toFixed(0)} {spec.unitLabel}/sqm
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input type="number" value={intWallArea}
                  onChange={e => { setIntWallArea(e.target.value); setErrors(prev => ({ ...prev, intWallArea: '' })) }}
                  placeholder="Internal wall area"
                  className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.intWallArea ? '#8C3A22' : 'rgba(30,34,39,0.4)', color: '#1E2227' }} />
                <select value={intAreaUnit} onChange={e => setIntAreaUnit(e.target.value as AreaUnit)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                  <option value="sqm">sqm</option>
                  <option value="sqft">sqft</option>
                </select>
              </div>
              {errors.intWallArea && (
                <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.intWallArea}</p>
              )}
            </div>
          )}
        </div>

        {/* ── 07 BALCONY PARAPET ────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeBalcony ? '1px solid rgba(30,34,39,0.12)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeBalcony} onChange={() => setIncludeBalcony(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  07 — BALCONY PARAPET WALLS
                </p>
                {!includeBalcony && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeBalcony && (
            <div className="p-4 space-y-4">
              <AlertBox variant="info">
                NBC 2016 minimum parapet height: 900mm. Calculated separately from main wall area — bricks/blocks listed as line item in report.
              </AlertBox>

              {balconies.length > 0 && (
                <div className="space-y-3">
                  {balconies.map((b, idx) => {
                    const p = parseFloat(b.perimeterM) || 0
                    const h = (parseInt(b.parapetHeightMm) || 900) / 1000
                    const areaSqm = p * h
                    return (
                      <div key={b.id} className="p-3 rounded-[2px]"
                        style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.01)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <input type="text" value={b.name}
                            onChange={e => updateBalcony(b.id, 'name', e.target.value)}
                            placeholder={`Balcony ${idx + 1}`}
                            className="border-b outline-none text-[13px] bg-transparent flex-1"
                            style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                          <button type="button" onClick={() => removeBalcony(b.id)}
                            className="ml-3 w-6 h-6 rounded flex items-center justify-center text-[13px]"
                            style={{ color: '#8C3A22', border: '1px solid rgba(140,58,34,0.2)' }}>×</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest block mb-1"
                              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                              Perimeter (m)
                            </label>
                            <input type="number" value={b.perimeterM}
                              onChange={e => updateBalcony(b.id, 'perimeterM', e.target.value)}
                              placeholder="e.g. 12"
                              className="w-full border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest block mb-1"
                              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                              Parapet Ht (mm)
                              <TipBtn id={`bhtip-${b.id}`} open={openTip} onToggle={toggleTip}>
                                NBC 2016 minimum parapet height: 900mm. Typical residential: 900–1050mm. Do not go below 900mm — it is a safety hazard.
                              </TipBtn>
                            </label>
                            <input type="number" value={b.parapetHeightMm}
                              onChange={e => updateBalcony(b.id, 'parapetHeightMm', e.target.value)}
                              placeholder="900"
                              className="w-full border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: (parseInt(b.parapetHeightMm) || 900) < 900 ? '#8C3A22' : 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                            {(parseInt(b.parapetHeightMm) || 900) < 900 && (
                              <p className="text-[10px] mt-0.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                                Below NBC 2016 minimum (900mm)
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest block mb-1"
                              style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                              Thickness
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {([115, 230] as const).map(t => (
                                <button key={t} type="button" onClick={() => updateBalcony(b.id, 'thicknessMm', t)}
                                  className="py-1.5 rounded-[2px] text-center text-[11px]"
                                  style={{
                                    border: `1px solid ${b.thicknessMm === t ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                                    background: b.thicknessMm === t ? 'rgba(31,78,121,0.08)' : 'transparent',
                                    color: b.thicknessMm === t ? '#1F4E79' : '#1E2227',
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
                            Parapet wall area: {areaSqm.toFixed(2)} sqm ·{' '}
                            ≈ {Math.round(extSpec.unitsPerSqm * (b.thicknessMm >= 200 ? 1 : 0.5) * areaSqm).toLocaleString('en-IN')} {extSpec.unitLabel}
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
            </div>
          )}
        </div>

        {/* ── 08 COMPOUND WALL ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeCompound ? '1px solid rgba(30,34,39,0.12)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle checked={includeCompound} onChange={() => setIncludeCompound(v => !v)} />
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  08 — COMPOUND / BOUNDARY WALL
                </p>
                {!includeCompound && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include</p>
                )}
              </div>
            </label>
          </div>
          {includeCompound && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    Total Perimeter (m)
                  </label>
                  <input type="number" value={compPerimeterM}
                    onChange={e => setCompPerimeterM(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    Height (m)
                  </label>
                  <input type="number" value={compHeightM}
                    onChange={e => setCompHeightM(e.target.value)}
                    placeholder="1.5"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    Gate Width (m)
                    <TipBtn id="gate" open={openTip} onToggle={toggleTip}>
                      Gate opening is deducted automatically from the compound wall area. Typical gate width: 3–4.5m for single/double gate.
                    </TipBtn>
                  </label>
                  <input type="number" value={compGateWidthM}
                    onChange={e => setCompGateWidthM(e.target.value)}
                    placeholder="e.g. 3.6"
                    className="w-full border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-2"
                  style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  Wall Thickness
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([230, 115] as const).map(t => (
                    <button key={t} type="button" onClick={() => setCompThicknessMm(t)}
                      className="py-2 rounded-[2px] text-center text-[12px]"
                      style={{
                        border: `1.5px solid ${compThicknessMm === t ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                        background: compThicknessMm === t ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: compThicknessMm === t ? '#1F4E79' : '#1E2227',
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
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    Pillar Count
                    <TipBtn id="pillar" open={openTip} onToggle={toggleTip}>
                      Standard: 1 pillar every 3m of compound wall. Pillars add stability — IS 2212:1991 requires cross-walls/buttresses at max 6m intervals. Auto-calculated from perimeter, but you can override.
                    </TipBtn>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-[6px] text-[13px] flex-1"
                      style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                      Auto: {autoPillarCount} pillars (1 per 3m)
                    </div>
                    <input type="number" value={compPillarOverride}
                      onChange={e => setCompPillarOverride(e.target.value)}
                      placeholder="Override"
                      className="w-28 border rounded-[6px] px-2 py-2 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
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
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Gross Perim</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>{compPerimF.toFixed(1)} m</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Gate −</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#8C3A22' }}>−{compGateF.toFixed(1)} m</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Wall Area</p>
                      <p className="text-[15px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#14532D' }}>{compNetArea.toFixed(1)} sqm</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 09 ROOF TYPE ──────────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                09 — ROOF TYPE
              </p>
              <ISBadge code="NBC 2016" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['flat',   'Full Flat Terrace', 'RCC slab with parapet'],
                ['sloped', 'Full Sloped Roof',  'Mangalore/GI/Poly/Truss'],
                ['mixed',  'Mixed',             'Partial terrace + partial slope'],
              ] as [RoofType, string, string][]).map(([val, label, sub]) => (
                <button key={val} type="button" onClick={() => setRoofType(val)}
                  className="p-3 rounded-[2px] text-left"
                  style={{
                    border: `1.5px solid ${roofType === val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: roofType === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                  }}>
                  <p className="text-[13px] font-medium" style={{ color: roofType === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>{sub}</p>
                </button>
              ))}
            </div>

            {/* Flat / Mixed: terrace parapet coping */}
            {(roofType === 'flat' || roofType === 'mixed') && (
              <div>
                <p className="text-[11px] mb-2" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  NBC 2016 Cl 3.6.2: Parapet min height 900mm above roof. Parapet brickwork auto-calculated from terrace area perimeter.
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={terraceParapetCoping}
                    onChange={() => setTerraceParapetCoping(v => !v)}
                    className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
                  />
                  <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
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
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
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
                          border: `1.5px solid ${slopedRoofCovering === val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                          background: slopedRoofCovering === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                        }}>
                        <p className="text-[12px] font-medium" style={{ color: slopedRoofCovering === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{sub}</p>
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
                      style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                      Gable Wall Area (sqm)
                    </label>
                    <input type="number" value={gableWallAreaSqm}
                      onChange={e => setGableWallAreaSqm(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                    />
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      Triangular wall area at each end of sloped roof
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                      Ridge Length (m)
                    </label>
                    <input type="number" value={ridgeLengthM}
                      onChange={e => setRidgeLengthM(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                    />
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      Length of the ridge beam at roof apex
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 10 PLASTERING ─────────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="10" title={`PLASTERING (IS 1661:1972)`} />
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
                  <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── 10 WATERPROOFING ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <SectionHeader num="11" title={`WATERPROOFING (IS 2645:2003)`} />
          <div className="p-4 space-y-3">
            {/* Terrace */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={includeTerWP} onChange={() => setTerraceWP(v => !v)}
                className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }} />
              <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Terrace waterproofing</span>
            </label>
            {includeTerWP && (
              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" value={terraceArea} onChange={e => setTerraceArea(e.target.value)}
                  placeholder="Terrace area (sqft)"
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                <select value={terraceWPMethod} onChange={e => setTerraceWPMethod(e.target.value as WaterproofingMethod)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}>
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
              <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Sunken bathroom waterproofing</span>
            </label>
            {includeBathWP && (
              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={bathroomCount} onChange={e => setBathroomCount(e.target.value)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}>
                  {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} bathroom{n !== 1 ? 's' : ''}</option>)}
                </select>
                <select value={bathroomWPMethod} onChange={e => setBathroomWPMethod(e.target.value as BathroomWpMethod)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}>
                  <option value="cementitious">Cementitious Slurry — ₹88–145/sqft</option>
                  <option value="crystalline">Crystalline (Xypex) — ₹145–220/sqft</option>
                  <option value="pu">PU (DrFixit 2K) — ₹180–250/sqft</option>
                  <option value="none">Skip bathroom WP</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── ADVANCED: TECHNICAL SPECS ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button" onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ADVANCED — TECHNICAL SPECIFICATIONS
            </p>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>
          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div className="pt-3">
                <AlertBox variant="info">
                  Auto-set per IS codes for your wall type. Change only if your structural engineer has specified different values in writing.
                </AlertBox>
              </div>
              {/* Mortar grade */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Mortar Grade</label>
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
                        border: `1.5px solid ${mortarGrade === m ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                        background: mortarGrade === m ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: mortarGrade === m ? '#1F4E79' : '#1E2227',
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
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Seismic Zone</label>
                  <ISBadge code="IS 4326:1993" />
                </div>
                <div className="px-3 py-2 rounded-[6px] text-[13px]"
                  style={{ border: '1px solid rgba(30,34,39,0.2)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                  Zone {szInfo.zone} · Z-Factor {szInfo.zFactor} · {isHighSeismic ? 'Seismic bands MANDATORY' : 'Seismic bands recommended'}
                </div>
              </div>
              {/* Brick class */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Brick Class</label>
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
                        border: `1.5px solid ${brickClass === c ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                        background: brickClass === c ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color: brickClass === c ? '#1F4E79' : '#1E2227',
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
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.55)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to Structure Details
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3b · MATERIAL RATES</p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>Enter Your Local Material Rates</h3>
          </div>
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
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
              <div key={key} className="p-3 rounded-[2px] border" style={{ borderColor: 'rgba(30,34,39,0.15)', background: '#fff' }}>
                <div className="flex items-center gap-3">
                  <label className="text-[13px] flex-1 font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · India Avg ₹{avg.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                {MASON_REGIONAL_NOTES[key] && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
                    {MASON_REGIONAL_NOTES[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setRates({ ...INDIA_AVG_RATES })}
            className="text-[11px] px-3 py-1.5 rounded-[2px] transition-all"
            style={{ border: '1px solid rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
            Reset to India Average
          </button>

          {/* Contractor Quote */}
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
            <SectionHeader num="12" title="CONTRACTOR QUOTE (OPTIONAL)" />
          <div className="p-4 space-y-3">
            <p className="text-[13px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Have a contractor quote? Enter it to compare after unlocking your report.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Contractor Name (optional)</label>
                <input type="text" value={contractorName} onChange={e => setCtName(e.target.value)}
                  placeholder="e.g. Ramesh Constructions"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Total Quoted Amount (₹)</label>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>₹</span>
                  <input type="number" value={contractorTotal} onChange={e => setCtTotal(e.target.value)}
                    placeholder="e.g. 350000"
                    className="flex-1 border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }} />
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
            style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.55)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to Material Rates
          </button>
          <div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3c · LABOUR ESTIMATION</p>
            <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>Include Labour Cost? (Optional)</h3>
          </div>
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              Labour costs vary significantly with season (monsoon shutdowns, festival breaks), location, and site conditions. CPWD DSR 2023 rates are government benchmarks — actual rates typically differ by ±20–30%.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIncludeLabour(true)}
              className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}
            >
              <p className="text-[15px] font-semibold mb-1" style={{ color: includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Include Labour Cost</p>
              <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Use CPWD DSR 2023 rates. Edit workers, rates, and productivity per trade. Labour appears only in paid PDF report.</p>
            </button>
            <button
              type="button"
              onClick={() => setIncludeLabour(false)}
              className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${!includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: !includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}
            >
              <p className="text-[15px] font-semibold mb-1" style={{ color: !includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Skip — Material Cost Only</p>
              <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour later from your contractor quote.</p>
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
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      {['Trade', 'Workers', 'Rate/day ₹', 'India Avg', 'CPWD Basis', 'Days'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', opacity: trade.active ? 1 : 0.35 }}>
                        <td className="py-1.5 px-2" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', whiteSpace: 'nowrap' }}>{trade.name}</td>
                        <td className="py-1 px-2">
                          <div className="flex items-center gap-1">
                            <button type="button"
                              onClick={() => updateTrade(trade.id, 'active', !trade.active)}
                              className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
                              style={{ border: '1px solid rgba(30,34,39,0.2)', background: trade.active ? 'rgba(140,58,34,0.1)' : 'rgba(20,83,45,0.1)', color: trade.active ? '#8C3A22' : '#14532D' }}>
                              {trade.active ? '−' : '+'}
                            </button>
                            <input type="number" value={trade.workers} disabled={!trade.active}
                              onChange={e => updateTrade(trade.id, 'workers', parseInt(e.target.value) || 0)}
                              className="w-10 border rounded px-1 py-0.5 text-center text-[11px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={trade.ratePerDay} disabled={!trade.active}
                            onChange={e => updateTrade(trade.id, 'ratePerDay', parseInt(e.target.value) || 0)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹{trade.indiaAvgRate}</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>{trade.basisText}</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>auto</td>
                      </tr>
                    ))}
                    {customTrades.map(ct => (
                      <tr key={ct.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-1 px-2">
                          <input type="text" value={ct.name} onChange={e => updateCustomTrade(ct.id, 'name', e.target.value)}
                            placeholder="Trade name" className="w-32 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.workers} onChange={e => updateCustomTrade(ct.id, 'workers', e.target.value)}
                            className="w-10 border rounded px-1 py-0.5 text-center text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.ratePerDay} onChange={e => updateCustomTrade(ct.id, 'ratePerDay', e.target.value)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>—</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-sans)', fontSize: 10 }}>Custom</td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.days} onChange={e => updateCustomTrade(ct.id, 'days', e.target.value)}
                            placeholder="days" className="w-14 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addCustomTrade}
                className="text-[11px] px-3 py-1.5 rounded-[2px]"
                style={{ border: '1px dashed rgba(30,34,39,0.25)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
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

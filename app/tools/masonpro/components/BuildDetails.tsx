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

interface LabourTrade {
  id: string
  name: string
  workers: number
  ratePerDay: number
  indiaAvgRate: number
  basisText: string
  active: boolean
}

interface CustomTrade {
  id: string; name: string; workers: string; ratePerDay: string; days: string
}

const INDIA_AVG_RATES = {
  clayBrick: 9500, flyAshBrick: 7000, aacBlock: 55,
  cement: 410, sand: 28, wpCompound: 230,
}

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1',  name: 'Brick Layer (Raj Mistri)',       workers: 3, ratePerDay: 850,  indiaAvgRate: 850,  basisText: '120 sqft/day',   active: true },
  { id: 't2',  name: 'Mason Helper',                   workers: 3, ratePerDay: 560,  indiaAvgRate: 560,  basisText: 'Ratio',          active: true },
  { id: 't3',  name: 'Plaster Mason',                  workers: 2, ratePerDay: 800,  indiaAvgRate: 800,  basisText: '100 sqft/day',   active: true },
  { id: 't4',  name: 'Plaster Helper',                 workers: 2, ratePerDay: 540,  indiaAvgRate: 540,  basisText: 'Ratio',          active: true },
  { id: 't5',  name: 'Waterproofing Specialist',       workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: '80 sqft/day',    active: true },
  { id: 't6',  name: 'Scaffolding Erector',            workers: 1, ratePerDay: 750,  indiaAvgRate: 750,  basisText: 'Per day',        active: true },
  { id: 't7',  name: 'Material Mixer',                 workers: 1, ratePerDay: 650,  indiaAvgRate: 650,  basisText: 'Per day',        active: true },
  { id: 't8',  name: 'Curing / Water Man',             workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',        active: true },
  { id: 't9',  name: 'Site Foreman',                   workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',        active: true },
  { id: 't10', name: 'Night Watchman',                 workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',        active: true },
]

type MortarGrade = '1:4' | '1:6'
type BrickClass = '7.5' | '10' | '15'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const MASON_REGIONAL_NOTES: Record<string, string> = {
  clayBrick:   'Jharkhand & WB ₹7,000–8,500/1000. Coastal Karnataka ₹11,000–13,000/1000. Transport adds ₹1,000–2,500 beyond 100km.',
  flyAshBrick: '₹5,500–6,000 near thermal plants (Korba, Mundra). ₹8,000–9,000 in metros far from source.',
  aacBlock:    '₹45–50/cft near AAC plants (Ahmedabad, Hyderabad). ₹65–75/cft in remote NE India.',
  cement:      '₹380–420 coastal Maharashtra. ₹440–460 remote NE India (transport adds 15–25%).',
  sand:        '₹18–22 in river-belt zones. ₹35–45 coastal/metro. M-sand ₹20–28 nationwide.',
  wpCompound:  '₹200–210 in Tier-2 cities. ₹250–280 in metros. Crystalline brands (Xypex) cost 2× more but last longer.',
}

function ISBadge({ code }: { code: string }) {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] rounded-[2px] inline-block"
      style={{ background: 'rgba(31,78,121,0.1)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', verticalAlign: 'middle' }}>
      {code}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  state: string
  city: string
  onSubmit: (input: MasonInput) => void
  onFormChange?: (data: Record<string, unknown>) => void
}

export default function BuildDetails({ state, city, onSubmit, onFormChange }: Props) {
  // S1 — Project Details
  const [projectName, setProjectName]   = useState('')
  const [numFloors, setNumFloors]       = useState(1)
  const [localState, setLocalState]     = useState(state)
  const [localCity, setLocalCity]       = useState(city)

  // S2 — Wall Specification
  const [extWallType, setExtWallType]   = useState<ExternalWallType>('clay_modular_9')
  const [extWallArea, setExtWallArea]   = useState('')
  const [extAreaUnit, setExtAreaUnit]   = useState<AreaUnit>('sqm')
  const [openingArea, setOpeningArea]   = useState('')
  const [includeInternal, setIncludeInt] = useState(false)
  const [intWallType, setIntWallType]   = useState<InternalWallType>('clay_4_5')
  const [intWallArea, setIntWallArea]   = useState('')
  const [intAreaUnit, setIntAreaUnit]   = useState<AreaUnit>('sqm')
  const [plastering, setPlastering]     = useState({ internal: true, external: true, ceiling: false })
  const [includeTerWP, setTerraceWP]    = useState(false)
  const [terraceArea, setTerraceArea]   = useState('')
  const [terraceWPMethod, setTerraceWPMethod] = useState<WaterproofingMethod>('bbc')
  const [includeBathWP, setBathWP]      = useState(false)
  const [bathroomCount, setBathroomCount] = useState('2')
  const [bathroomWPMethod, setBathroomWPMethod] = useState<BathroomWpMethod>('cementitious')

  // S3 — Technical Specs (collapsed by default)
  const [showTechSpecs, setShowTechSpecs] = useState(false)
  const [mortarGrade, setMortarGrade]   = useState<MortarGrade>('1:6')
  const [brickClass, setBrickClass]     = useState<BrickClass>('7.5')

  // S4 — Material Rates (collapsed)
  const [showRates, setShowRates]       = useState(false)
  const [rates, setRates]               = useState({ ...INDIA_AVG_RATES })

  // S5 — Contractor Quote
  const [contractorName, setCtName]     = useState('')
  const [contractorTotal, setCtTotal]   = useState('')

  // S6 — Labour
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]             = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades] = useState<CustomTrade[]>([])

  const [openTip, setOpenTip]           = useState<string | null>(null)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo     = seismicZoneFromState(localState)
  const extSpec    = EXTERNAL_WALL_SPECS[extWallType]
  const isHighSeismic = szInfo.zone === 'IV' || szInfo.zone === 'V'
  const showAacWarn   = extWallType === 'aac_200' && isHighSeismic

  // Live summary panel update
  useEffect(() => {
    if (!onFormChange) return
    onFormChange({ wallType: extWallType, floors: `G+${numFloors - 1}`, labourEnabled: includeLabour })
  }, [extWallType, numFloors, includeLabour, onFormChange])

  // Auto mortar grade from wall type
  useEffect(() => {
    setMortarGrade(extWallType.includes('4_5') || intWallType.includes('4_5') ? '1:4' : '1:6')
  }, [extWallType, intWallType])

  function toSqm(area: string, unit: AreaUnit) {
    const v = parseFloat(area)
    return (!v || v <= 0) ? 0 : unit === 'sqft' ? v * SQM_PER_SQFT : v
  }

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function updateTrade(id: string, key: keyof LabourTrade, val: unknown) {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }

  function addCustomTrade() {
    setCustomTrades(prev => [...prev, { id: `c${Date.now()}`, name: '', workers: '', ratePerDay: '', days: '' }])
  }

  function updateCustomTrade(id: string, key: keyof CustomTrade, val: string) {
    setCustomTrades(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!extWallArea || parseFloat(extWallArea) <= 0) e.extWallArea = 'Enter external wall area'
    if (includeInternal && (!intWallArea || parseFloat(intWallArea) <= 0)) e.intWallArea = 'Enter internal wall area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const extSqm = toSqm(extWallArea, extAreaUnit)
    const intSqm = includeInternal ? toSqm(intWallArea, intAreaUnit) : 0
    const openSqm = openingArea ? toSqm(openingArea, extAreaUnit) : 0
    onSubmit({
      state:                   localState,
      city:                    localCity,
      externalWallType:        extWallType,
      externalWallAreaSqm:     Math.round((extSqm - openSqm) * 100) / 100,
      includeInternal,
      internalWallType:        includeInternal ? intWallType : undefined,
      internalWallAreaSqm:     intSqm,
      includePlaster:          plastering.internal || plastering.external || plastering.ceiling,
      includeWaterproofing:    includeTerWP || includeBathWP,
      terraceAreaSqft:         includeTerWP ? (parseFloat(terraceArea) || 0) : 0,
      bathroomCount:           includeBathWP ? (parseInt(bathroomCount) || 0) : 0,
      terraceWpMethod:         terraceWPMethod,
      bathroomWpMethod:        bathroomWPMethod,
      contractorQuote:         contractorTotal ? parseFloat(contractorTotal) : undefined,
    })
  }

  const extSqmPreview = toSqm(extWallArea, extAreaUnit)

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

        {/* ── SECTION 1: PROJECT DETAILS ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — PROJECT DETAILS
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Project Name
              </label>
              <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Sharma Residence"
                className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Number of Floors
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[0,1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setNumFloors(n)}
                    className="py-2 rounded-[2px] text-center transition-all"
                    style={{
                      border: `1px solid ${numFloors === n ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                      background: numFloors === n ? '#1F4E79' : 'transparent',
                      color: numFloors === n ? '#fff' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                    }}>
                    {n === 0 ? 'G' : `G+${n}`}
                  </button>
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
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: WALL SPECIFICATION ───────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — WALL SPECIFICATION
            </p>
          </div>
          <div className="p-4 space-y-5">

            {/* External wall type */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                External Wall Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(EXTERNAL_WALL_SPECS) as ExternalWallType[]).map(type => {
                  const spec = EXTERNAL_WALL_SPECS[type]
                  const selected = extWallType === type
                  const aacRisk = type === 'aac_200' && isHighSeismic
                  return (
                    <button key={type} type="button"
                      onClick={() => { setExtWallType(type); setErrors(prev => ({ ...prev, extWallType: '' })) }}
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
                        {spec.unitsPerSqm} {spec.unitLabel}/sqm · {spec.mortarRatio} · {spec.isCode.split('+')[0].trim()}
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
                <div className="mt-3 p-3 rounded-[2px]"
                  style={{ border: '1px solid rgba(217,154,6,0.5)', background: 'rgba(217,154,6,0.08)' }}>
                  <div className="flex gap-2">
                    <span style={{ color: '#D99A06' }}>⚠</span>
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                        IS 4326:1993 — AAC RESTRICTION IN ZONE {szInfo.zone}
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                        AAC blocks NOT permitted as load-bearing masonry in Zones IV and V. Approved for infill/partition only.
                        Ensure your structural engineer specifies clay brick or hollow concrete block for load-bearing walls.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* External wall area */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                External Wall Area (gross — before deducting openings)
              </label>
              <p className="text-[11px] mb-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                Tip: Perimeter (m) × floor height (3m) × number of floors. E.g. (4+10)×2 × 3 × 2 = 168 sqm for G+1
              </p>
              <div className="flex gap-2">
                <input type="number" value={extWallArea}
                  onChange={e => { setExtWallArea(e.target.value); setErrors(prev => ({ ...prev, extWallArea: '' })) }}
                  placeholder="e.g. 150"
                  className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.extWallArea ? '#8C3A22' : 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
                <select value={extAreaUnit} onChange={e => setExtAreaUnit(e.target.value as AreaUnit)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                  <option value="sqm">sqm</option>
                  <option value="sqft">sqft</option>
                </select>
              </div>
              {errors.extWallArea && <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.extWallArea}</p>}
              {extSqmPreview > 0 && (
                <p className="text-[12px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  ≈ {Math.round(extSpec.unitsPerSqm * extSqmPreview).toLocaleString('en-IN')} {extSpec.unitLabel} required
                </p>
              )}
            </div>

            {/* Opening area */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Opening Area — Doors + Windows (sqm, deducted automatically)
              </label>
              <input type="number" value={openingArea} onChange={e => setOpeningArea(e.target.value)}
                placeholder="e.g. 18"
                className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
              />
            </div>

            {/* Internal partition */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <div onClick={() => setIncludeInt(v => !v)}
                  className="w-10 h-6 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
                  style={{ background: includeInternal ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                    style={{ transform: includeInternal ? 'translateX(18px)' : 'translateX(2px)' }} />
                </div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include internal partition walls
                </p>
              </label>
              {includeInternal && (
                <div className="space-y-3 pl-2">
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
                      placeholder="Internal wall area (sqm)"
                      className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.intWallArea ? '#8C3A22' : 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                    />
                    <select value={intAreaUnit} onChange={e => setIntAreaUnit(e.target.value as AreaUnit)}
                      className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                      <option value="sqm">sqm</option>
                      <option value="sqft">sqft</option>
                    </select>
                  </div>
                  {errors.intWallArea && <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.intWallArea}</p>}
                </div>
              )}
            </div>

            {/* Plaster checkboxes */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Plastering (IS 1661:1972)
              </label>
              <div className="space-y-2">
                {([
                  ['internal', 'Internal 12mm (1:4)'],
                  ['external', 'External 15mm (1:4)'],
                  ['ceiling',  'Ceiling 6mm (1:3)'],
                ] as [keyof typeof plastering, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={plastering[key]}
                      onChange={() => setPlastering(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
                    />
                    <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Waterproofing */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Waterproofing (IS 2645:2003)
              </label>
              <div className="space-y-3">
                {/* Terrace */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includeTerWP} onChange={() => setTerraceWP(v => !v)}
                    className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
                  />
                  <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Terrace waterproofing</span>
                </label>
                {includeTerWP && (
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="number" value={terraceArea} onChange={e => setTerraceArea(e.target.value)}
                      placeholder="Terrace area (sqft)"
                      className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                    />
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
                {/* Sunken bathroom */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includeBathWP} onChange={() => setBathWP(v => !v)}
                    className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
                  />
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
          </div>
        </div>

        {/* ── SECTION 3: TECHNICAL SPECS ──────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button" onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ADVANCED SETTINGS ▼ — TECHNICAL SPECIFICATIONS
            </p>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>
          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div className="pt-3">
                <AlertBox variant="info">
                  These values are auto-set per IS codes for your wall type and seismic zone. Change only if your structural engineer has specified different values in writing.
                </AlertBox>
              </div>

              {/* Mortar grade */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Mortar Grade
                  </label>
                  <ISBadge code="IS 2250:1981" />
                  <TipBtn id="mortar" open={openTip} onToggle={toggleTip}>
                    IS 2250:1981 mortar grades. 1:6 (M4) for 9-inch load-bearing walls. 1:4 (M2) for 4.5-inch partition walls. Richer mortar (lower ratio) = stronger bond but more cement. Never use 1:8 or weaker for structural masonry.
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
                      {m === '1:6' ? '1:6 (M4) — Load-bearing 9" walls' : '1:4 (M2) — Partition 4.5" walls'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  Auto-set from wall type · 1:6 for 9&quot; walls, 1:4 for 4.5&quot; partitions
                </p>
              </div>

              {/* Seismic zone */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Seismic Zone
                  </label>
                  <ISBadge code="IS 4326:1993" />
                  <TipBtn id="seismic" open={openTip} onToggle={toggleTip}>
                    Seismic bands (plinth + sill + lintel + roof) are mandatory for masonry in Zones III–V per IS 4326:1993. Bands are 75mm thick RCC with 2 bars of 8mm + 6mm stirrups at 150mm. Maximum unreinforced wall length 6 metres.
                  </TipBtn>
                </div>
                <div className="px-3 py-2 rounded-[6px] text-[13px]"
                  style={{ border: '1px solid rgba(30,34,39,0.2)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                  Zone {szInfo.zone} · Z-Factor {szInfo.zFactor} · {isHighSeismic ? 'Seismic bands MANDATORY (IS 4326:1993)' : 'Seismic bands recommended'}
                </div>
              </div>

              {/* Brick class */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Brick Class
                  </label>
                  <ISBadge code="IS 1077:1992" />
                  <TipBtn id="brickclass" open={openTip} onToggle={toggleTip}>
                    IS 1077:1992 brick strength classes: Class 7.5 = 7.5 N/mm² (minimum for load-bearing). Class 10 = 10 N/mm² (standard). Class 15 = 15 N/mm² (high-load areas). Always ask your brick supplier for test certificates — market bricks vary widely in actual strength.
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
                <p className="text-[10px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1077:1992 minimum: Class 7.5 (7.5 N/mm²) for load-bearing masonry
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: MATERIAL RATES ───────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <button type="button" onClick={() => setShowRates(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                ADVANCED SETTINGS ▼ — MATERIAL RATES
              </p>
              {!showRates && (
                <p className="text-[11px] text-left mt-0.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ India Average 2026 rates · Edit if you have local quotes
                </p>
              )}
            </div>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showRates ? '▲' : '▼'}
            </span>
          </button>
          {showRates && (
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div className="pt-3 space-y-2">
                <AlertBox variant="tip">
                  <strong>India Average 2026</strong> rates are pre-loaded. Get 3 supplier quotes before finalising — brick rates vary by 30–40% across states.
                </AlertBox>
                <AlertBox variant="caution">
                  Contractor-supplied brick is typically 10–20% above market rate. Always ask for the supply bill separately.
                </AlertBox>
              </div>
              {([
                ['clayBrick',   'Clay modular brick',       '₹/1000',  9500],
                ['flyAshBrick', 'Fly ash brick',            '₹/1000',  7000],
                ['aacBlock',    'AAC block',                '₹/cft',     55],
                ['cement',      'Cement (OPC)',             '₹/bag',    410],
                ['sand',        'Sand',                     '₹/cft',     28],
                ['wpCompound',  'Waterproofing compound',   '₹/kg',     230],
              ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
                <div key={key}>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] flex-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                      <input type="number" value={rates[key]}
                        onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                      />
                      <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                        {unit} · India Avg: ₹{avg.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  {MASON_REGIONAL_NOTES[key] && (
                    <p className="text-[11px] mt-0.5 ml-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>{MASON_REGIONAL_NOTES[key]}</p>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setRates({ ...INDIA_AVG_RATES })}
                className="text-[11px] px-3 py-1.5 rounded-[2px] transition-all"
                style={{ border: '1px solid rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                Reset to India Average
              </button>
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                IS 456:2000 mandates specific material grades. Changing rates does not change quantities — only cost totals.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 5: CONTRACTOR QUOTE ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              05 — CONTRACTOR QUOTE (OPTIONAL)
            </p>
          </div>
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
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Total Quoted Amount (₹)</label>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>₹</span>
                  <input type="number" value={contractorTotal} onChange={e => setCtTotal(e.target.value)}
                    placeholder="e.g. 350000"
                    className="flex-1 border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                  />
                </div>
              </div>
            </div>
            {contractorTotal && (
              <p className="text-[11px]" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                ✓ Quote saved. Comparison with IS-code quantities available after unlocking report.
              </p>
            )}
          </div>
        </div>

        {/* ── SECTION 6: LABOUR ───────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={includeLabour} onChange={() => setIncludeLabour(v => !v)}
                className="w-4 h-4 rounded" style={{ accentColor: '#1F4E79' }}
              />
              <div>
                <p className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  ADVANCED SETTINGS ▼ — INCLUDE LABOUR COST IN ESTIMATE
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                  Add CPWD-based labour cost to your total
                </p>
              </div>
            </label>
          </div>
          {includeLabour && (
            <div className="p-4 space-y-4">
              <AlertBox variant="caution">
                <strong>CPWD DSR 2023 rates.</strong> Curing intervals (IS 2212:1991: minimum 7 days wet gunny), monsoon shutdowns, festival breaks, sand bans, local political situations — no software can predict these. CPWD productivity rates calculate man-days of work. You set workers; days calculate automatically. <em>IS 2212:1991: Masonry starts 60–90 days after RCC pour.</em>
              </AlertBox>
              <AlertBox variant="tip">
                <strong>Enter 0 workers</strong> to exclude any trade entirely — same as the − toggle button.
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
                      <tr key={trade.id}
                        style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', opacity: trade.active ? 1 : 0.35, background: trade.active ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
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
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                            />
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={trade.ratePerDay} disabled={!trade.active}
                            onChange={e => updateTrade(trade.id, 'ratePerDay', parseInt(e.target.value) || 0)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
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
                            style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.workers} onChange={e => updateCustomTrade(ct.id, 'workers', e.target.value)}
                            className="w-10 border rounded px-1 py-0.5 text-center text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.ratePerDay} onChange={e => updateCustomTrade(ct.id, 'ratePerDay', e.target.value)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>—</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>Custom</td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.days} onChange={e => updateCustomTrade(ct.id, 'days', e.target.value)}
                            placeholder="days" className="w-14 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
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
              <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                Labour total shown only in report after unlocking. Not displayed on this form.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="button" onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Calculate My Masonry Cost →
        </button>
      </div>
    </div>
  )
}

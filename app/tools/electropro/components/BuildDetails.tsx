'use client'

import { useState, type ReactNode } from 'react'
import { seismicZoneFromState, MATERIAL_RATES, type ElectroInput } from '../electropro-engine'

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

type AreaUnit = 'sqft' | 'sqm'
const SQFT_PER_SQM = 10.764

interface LabourTrade {
  id: string
  name: string
  workers: number
  ratePerDay: number
  indiaAvgRate: number
  basisText: string
  active: boolean
  daysManual: string
}

interface CustomTrade {
  id: string; name: string; workers: string; ratePerDay: string; days: string
}

const INDIA_AVG_RATES_DISPLAY = {
  wire_1_5:    MATERIAL_RATES.wire_1_5,
  wire_2_5:    MATERIAL_RATES.wire_2_5,
  wire_4_0:    MATERIAL_RATES.wire_4_0,
  wire_6_0:    MATERIAL_RATES.wire_6_0,
  conduit_25:  MATERIAL_RATES.conduit_25mm,
  mcb_6A:      MATERIAL_RATES.mcb_6A,
  mcb_16A:     MATERIAL_RATES.mcb_16A,
  mcb_20A:     MATERIAL_RATES.mcb_20A,
  rccb_25A:    MATERIAL_RATES.rccb_25A,
  db_8way:     MATERIAL_RATES.db_8way,
  db_12way:    MATERIAL_RATES.db_12way,
  earthingKit: MATERIAL_RATES.earthingKit,
}

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1', name: 'Licensed Electrician',        workers: 2, ratePerDay: 1200, indiaAvgRate: 1200, basisText: '8–10 points/day',    active: true,  daysManual: '' },
  { id: 't2', name: 'Wireman',                     workers: 2, ratePerDay: 750,  indiaAvgRate: 750,  basisText: 'Ratio to electrician', active: true,  daysManual: '' },
  { id: 't3', name: 'Conduit Fixer',               workers: 1, ratePerDay: 700,  indiaAvgRate: 700,  basisText: '50 running ft/day',   active: true,  daysManual: '' },
  { id: 't4', name: 'DB Panel Installer',          workers: 1, ratePerDay: 1500, indiaAvgRate: 1500, basisText: '1 panel/day',         active: true,  daysManual: '' },
  { id: 't5', name: 'Helper / Wall Chase',         workers: 2, ratePerDay: 560,  indiaAvgRate: 560,  basisText: 'Per day',             active: true,  daysManual: '' },
  { id: 't6', name: 'Earthing Specialist',         workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: 'Per pit',             active: false, daysManual: '' },
  { id: 't7', name: 'Testing & Commissioning',     workers: 1, ratePerDay: 1400, indiaAvgRate: 1400, basisText: 'Per day',             active: true,  daysManual: '' },
  { id: 't8', name: 'Night Watchman',              workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',             active: true,  daysManual: '' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'caution' | 'error' | 'tip'
function AlertBox({ variant, children }: { variant: AlertVariant; children: ReactNode }) {
  const styles: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
    info:    { bg: '#1F4E7908', border: '#1F4E7940', icon: 'ⓘ', iconColor: '#1F4E79' },
    caution: { bg: '#D99A0610', border: '#D99A0650', icon: '⚠', iconColor: '#D99A06' },
    error:   { bg: '#8C3A2208', border: '#8C3A2240', icon: '✕', iconColor: '#8C3A22' },
    tip:     { bg: '#14532D08', border: '#14532D40', icon: '✓', iconColor: '#14532D' },
  }
  const s = styles[variant]
  return (
    <div className="flex gap-2.5 p-3 rounded-[2px]" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-[13px] shrink-0 mt-0.5 font-bold" style={{ color: s.iconColor }}>{s.icon}</span>
      <div className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{children}</div>
    </div>
  )
}

function TipBtn({ id, open, onToggle, children }: {
  id: string; open: string | null; onToggle: (id: string) => void; children: string
}) {
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-4 h-4 rounded-full text-[9px] font-bold inline-flex items-center justify-center ml-1 flex-shrink-0"
        style={{ background: 'rgba(31,78,121,0.15)', color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', verticalAlign: 'middle', cursor: 'pointer' }}
        aria-label="More information"
      >
        i
      </button>
      {open === id && (
        <span
          className="absolute z-50 left-0 top-5 p-3 rounded-[2px] w-72 block"
          style={{ background: '#fff', border: '1px solid rgba(31,78,121,0.3)', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', fontSize: 12, lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {children}
        </span>
      )}
    </span>
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

function StepBar() {
  return (
    <div className="flex items-center">
      {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
              style={{
                background:  i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'transparent',
                borderColor: i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                color:       i <= 2 ? '#fff' : 'rgba(30,34,39,0.35)',
                fontFamily:  'var(--font-plex-mono)',
              }}>
              {i < 2 ? '✓' : i + 1}
            </div>
            <span className="text-[10px] uppercase tracking-widest hidden sm:inline"
              style={{ fontFamily: 'var(--font-plex-mono)', color: i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'rgba(30,34,39,0.3)' }}>
              {step}
            </span>
          </div>
          {i < 3 && <div className="w-5 h-px mx-1.5" style={{ background: 'rgba(30,34,39,0.14)' }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  state:    string
  city:     string
  onSubmit: (input: ElectroInput) => void
}

export default function BuildDetails({ state, city, onSubmit }: Props) {
  // S1 — Project Details
  const [projectName, setProjectName]   = useState('')
  const [localState, setLocalState]     = useState(state)
  const [localCity, setLocalCity]       = useState(city)

  // S2 — Floor Area
  const [buaPerFloor, setBuaPerFloor]   = useState('')
  const [buaUnit, setBuaUnit]           = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]       = useState('1')

  // S3 — Load Requirements
  const [numBathrooms, setNumBathrooms] = useState('2')
  const [numAC, setNumAC]               = useState('2')

  // S4 — Earthing
  const [includeEarthing, setEarthing]  = useState(true)
  const [numPits, setNumPits]           = useState('2')

  // S5 — Tech specs (collapsible)
  const [showTechSpecs, setShowTechSpecs] = useState(false)

  // S6 — Material Rates (collapsed)
  const [showRates, setShowRates]       = useState(false)
  const [rates, setRates]               = useState({ ...INDIA_AVG_RATES_DISPLAY })

  // S7 — Contractor Quote
  const [contractorQuote, setContractorQuote] = useState('')

  // S8 — Labour
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]             = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades] = useState<CustomTrade[]>([])

  const [openTip, setOpenTip]           = useState<string | null>(null)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(localState)

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview   = toBuaSqft(buaPerFloor, buaUnit)
  const totalBuaPreview  = buaSqftPreview * (parseInt(numFloors) || 1)
  const totalPointsEst   = Math.round(totalBuaPreview / 100) * 8  // ~8 points per 100 sqft

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
    if (!buaPerFloor || parseFloat(buaPerFloor) <= 0) e.buaPerFloor = 'Enter floor area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      state:            localState,
      city:             localCity,
      buaPerFloorSqft:  Math.round(toBuaSqft(buaPerFloor, buaUnit)),
      numFloors:        Math.max(1, parseInt(numFloors) || 1),
      numBathrooms:     Math.max(0, parseInt(numBathrooms) || 0),
      numAC:            Math.max(0, parseInt(numAC) || 0),
      includeEarthing,
      numEarthingPits:  includeEarthing ? (parseInt(numPits) || 2) : 0,
      contractorQuote:  contractorQuote ? parseFloat(contractorQuote) : undefined,
      includeLabour,
    })
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">

      {/* Page header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · ELECTROPRO
            </p>
            <h1 className="text-[22px] font-bold"
              style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}>
              Build Details
            </h1>
          </div>
          <StepBar />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Location + seismic chip */}
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
                placeholder="e.g. Sharma Residence, Pune"
                className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  State
                </label>
                <select value={localState} onChange={e => setLocalState(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  City
                </label>
                <input type="text" value={localCity} onChange={e => setLocalCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: FLOOR AREA ───────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                02 — FLOOR AREA (BUA PER FLOOR)
              </p>
              <TipBtn id="bua" open={openTip} onToggle={toggleTip}>
                BUA = Built-Up Area. Measure the total area of each floor slab including walls. For a 20ft × 40ft house = 800 sqft per floor. IS 732:2019 bases circuit counts on BUA — larger BUA = more lighting and power circuits required.
              </TipBtn>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-[14px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is the built-up area of one floor?
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Tip: Measure length × width of your floor slab. For 20ft × 40ft = 800 sqft per floor.
            </p>
            <div className="flex gap-2">
              <input type="number" value={buaPerFloor}
                onChange={e => { setBuaPerFloor(e.target.value); setErrors(prev => ({ ...prev, buaPerFloor: '' })) }}
                placeholder="e.g. 900"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.buaPerFloor ? '#8C3A22' : 'rgba(30,34,39,0.4)', color: '#1E2227' }}
              />
              <select value={buaUnit} onChange={e => setBuaUnit(e.target.value as AreaUnit)}
                className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                <option value="sqft">sqft</option>
                <option value="sqm">sqm</option>
              </select>
            </div>
            {errors.buaPerFloor && (
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.buaPerFloor}</p>
            )}
            {buaSqftPreview > 0 && (
              <p className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                = {buaSqftPreview.toFixed(0)} sqft per floor
              </p>
            )}

            {/* Number of floors inline */}
            <div className="pt-2" style={{ borderTop: '1px solid rgba(30,34,39,0.08)' }}>
              <div className="flex items-center gap-1 mb-2">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Number of Floors
                </label>
                <TipBtn id="floors" open={openTip} onToggle={toggleTip}>
                  Include all floors including ground floor. A G+1 building has 2 floors. IS 732:2019 requires a sub-distribution board (SDB) on each floor above ground — this affects DB panel count and sub-panel feed wire size (6.0 sqmm minimum).
                </TipBtn>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['1','2','3','4','5','6'].map(f => (
                  <button key={f} type="button" onClick={() => setNumFloors(f)}
                    className="py-2 rounded-[2px] text-[14px] font-medium transition-all"
                    style={{
                      border:     `1.5px solid ${numFloors === f ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                      background: numFloors === f ? 'rgba(31,78,121,0.08)' : 'transparent',
                      color:      numFloors === f ? '#1F4E79' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)',
                    }}>
                    G+{parseInt(f) - 1}
                  </button>
                ))}
              </div>
              {totalBuaPreview > 0 && (
                <p className="text-[12px] mt-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  Total BUA: {totalBuaPreview.toFixed(0)} sqft · Estimated ~{totalPointsEst} electrical points
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: LOAD REQUIREMENTS ────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — LOAD REQUIREMENTS
            </p>
          </div>
          <div className="p-4 space-y-5">

            {/* Bathrooms */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Bathrooms / Toilets
                </label>
                <ISBadge code="IS 3043:2018" />
                <TipBtn id="bathrooms" open={openTip} onToggle={toggleTip}>
                  IS 3043:2018 Cl 10.4: Every bathroom circuit MUST have a 30mA RCCB (Residual Current Circuit Breaker). This protects against electrocution from water contact. Each bathroom also needs a dedicated geyser circuit (4.0 sqmm wire, 20A MCB). Never share geyser with other loads.
                </TipBtn>
              </div>
              <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                IS 3043:2018: 30mA RCCB is MANDATORY for all bathroom circuits.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {['0','1','2','3','4','5','6'].map(n => (
                  <button key={n} type="button" onClick={() => setNumBathrooms(n)}
                    className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                    style={{
                      border:     `1.5px solid ${numBathrooms === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                      background: numBathrooms === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                      color:      numBathrooms === n ? '#1F4E79' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              {parseInt(numBathrooms) > 0 && (
                <div className="mt-3 p-3 rounded-[2px]"
                  style={{ border: '1px solid rgba(217,154,6,0.4)', background: 'rgba(217,154,6,0.06)' }}>
                  <p className="text-[11px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                    ⚠ IS 3043:2018 Cl 10.4 — RCCB 30mA included for {numBathrooms} bathroom circuit(s). Verify license with your electrician.
                  </p>
                </div>
              )}
            </div>

            {/* AC Units */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Air Conditioners (AC units)
                </label>
                <ISBadge code="IS 732:2019" />
                <TipBtn id="ac" open={openTip} onToggle={toggleTip}>
                  IS 732:2019: Each AC unit requires a SEPARATE dedicated circuit — 4.0 sqmm wire minimum, 20A MCB. Never share an AC circuit with other loads. 1.5 ton AC draws ~8A, so 20A MCB provides adequate headroom. Plan AC points during construction — adding them later requires wall chasing, which is expensive.
                </TipBtn>
              </div>
              <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                IS 732:2019: Each AC unit requires a separate 20A MCB circuit with 4.0 sqmm wire minimum.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {['0','1','2','3','4','5','6','8'].map(n => (
                  <button key={n} type="button" onClick={() => setNumAC(n)}
                    className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                    style={{
                      border:     `1.5px solid ${numAC === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                      background: numAC === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                      color:      numAC === n ? '#1F4E79' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: EARTHING ─────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                04 — EARTHING SYSTEM
              </p>
              <ISBadge code="IS 3043:2018" />
              <TipBtn id="earthing" open={openTip} onToggle={toggleTip}>
                IS 3043:2018: Earthing is mandatory for all buildings. Maximum earth resistance = 1 ohm. Standard installation: GI pipe 2.5m × 40mm diameter, buried vertically, filled with charcoal + salt. Minimum 2 pits for residential buildings — one for neutral earth, one for equipment earth. Unlicensed earthing work voids insurance.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => setEarthing(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeEarthing ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeEarthing ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include earthing system
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  Mandatory per IS 3043:2018 — max resistance 1 ohm, GI pipe earth 2.5m × 40mm
                </p>
              </div>
            </label>

            {includeEarthing && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Number of Earthing Pits
                  </label>
                  <TipBtn id="earthpits" open={openTip} onToggle={toggleTip}>
                    IS 3043:2018: Minimum 2 earthing pits for residential buildings. One for neutral (TN-S system) and one for equipment/safety earth. Add a third pit for large buildings or areas with high soil resistivity. Cost per pit includes GI pipe, charcoal, salt, and chamber.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['1','2','3','4'].map(n => (
                    <button key={n} type="button" onClick={() => setNumPits(n)}
                      className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                      style={{
                        border:     `1.5px solid ${numPits === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                        background: numPits === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color:      numPits === n ? '#1F4E79' : '#1E2227',
                        fontFamily: 'var(--font-plex-mono)',
                      }}>
                      {n} pit{parseInt(n) > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 3043:2018: Minimum 2 earthing pits for residential. One neutral, one equipment earth.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 5: TECHNICAL SPECIFICATIONS (collapsible) ───────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button"
            onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                05 — TECHNICAL SPECIFICATIONS
              </p>
              {!showTechSpecs && (
                <p className="text-[11px] text-left mt-0.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ IS 732:2019 wire sizes applied · Lighting 1.5 sqmm · Power 2.5 sqmm · AC 4.0 sqmm
                </p>
              )}
            </div>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>

          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <p className="text-[11px] pt-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                IS 732:2019 wire sizes are applied automatically. These values are locked per IS code.
              </p>

              {/* Wire sizes reference */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Wire Sizes (IS 732:2019 — Locked)
                  </label>
                  <ISBadge code="IS 732:2019" />
                  <TipBtn id="wiresizes" open={openTip} onToggle={toggleTip}>
                    IS 732:2019 mandates minimum wire sizes: 1.5 sqmm for lighting (max 800W per circuit), 2.5 sqmm for power sockets (max 3,000W), 4.0 sqmm for AC/geyser, 6.0 sqmm for sub-panel feeds, 10.0 sqmm for main incomer. Using undersized wire causes overheating and fire risk. These are minimums — upgrade if load is high.
                  </TipBtn>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 420 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                        {['Circuit Use', 'Wire Size', 'MCB Rating', 'Max Load'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Lighting',        '1.5 sqmm', '6A',  '800W'],
                        ['Power sockets',   '2.5 sqmm', '16A', '3,000W'],
                        ['AC / Geyser',     '4.0 sqmm', '20A', '3,500W'],
                        ['Sub-panel feed',  '6.0 sqmm', '32A', 'Per SDB'],
                        ['Main incomer',    '10.0 sqmm','63A', 'Per load'],
                      ].map(([use, size, mcb, load], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                          <td className="py-1.5 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{use}</td>
                          <td className="py-1.5 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontWeight: 600 }}>{size}</td>
                          <td className="py-1.5 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{mcb}</td>
                          <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>{load}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 732:2019 Table 1 — Wire size is a minimum. Never downsize. Wastage factor: 1.15 applied.
                </p>
              </div>

              {/* Circuit maximums */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Circuit Load Limits (IS 732:2019 — Locked)
                  </label>
                  <TipBtn id="circuits" open={openTip} onToggle={toggleTip}>
                    IS 732:2019: A lighting circuit must not carry more than 800W — so a typical room with 4×20W LED lights + 2 fans uses about 250W, comfortably within limit. A power circuit must not carry more than 3,000W. Do NOT plug a geyser or AC into a standard power circuit — they need their own dedicated circuit.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'LIGHTING CIRCUIT MAX', value: '800W', sub: 'IS 732:2019' },
                    { label: 'POWER CIRCUIT MAX',    value: '3,000W', sub: 'IS 732:2019' },
                  ].map(item => (
                    <div key={item.label} className="px-3 py-2 rounded-[2px]"
                      style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.03)' }}>
                      <p className="text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{item.label}</p>
                      <p className="text-[18px] font-bold mt-0.5"
                        style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{item.value}</p>
                      <p className="text-[10px]"
                        style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DB Panel preview note */}
              <div className="p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  DB PANEL SCHEDULE
                </p>
                <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                  Your complete DB panel schedule — number of ways, MCB ratings per circuit, RCCB placement — is generated automatically and visible free in your results. Quantities are unlocked with the full report.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 6: MATERIAL RATES ───────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <button type="button"
            onClick={() => setShowRates(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                ADVANCED SETTINGS ▼ — MATERIAL RATES
              </p>
              {!showRates && (
                <p className="text-[11px] text-left mt-0.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ India Average 2026 rates · Wire 1.5 sqmm ₹{rates.wire_1_5}/m · 2.5 sqmm ₹{rates.wire_2_5}/m · 4.0 sqmm ₹{rates.wire_4_0}/m
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
                  <strong>India Average 2026</strong> rates (Finolex / Havells / Polycab pricing). Edit if your electrician has quoted specific brand rates — unbranded wire can be 20–30% cheaper but may not meet IS 694:2010.
                </AlertBox>
                <AlertBox variant="caution">
                  <strong>IS 732:2019:</strong> Wire must be FR-LSH (flame retardant low smoke halogen free) for concealed wiring. Do NOT accept PVC wire from electrician for savings — it is a fire risk.
                </AlertBox>
                <AlertBox variant="info">
                  NE India / J&amp;K: Finolex/Havells wire ₹15–25% more due to transport. Use branded wire regardless — unbranded wire is a leading cause of residential fires in these regions.
                </AlertBox>
              </div>

              <p className="text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                WIRE RATES (IS 694:2010 FR-LSH grade)
              </p>
              {([
                ['wire_1_5',  'Wire 1.5 sqmm (lighting)',  '₹/metre', INDIA_AVG_RATES_DISPLAY.wire_1_5],
                ['wire_2_5',  'Wire 2.5 sqmm (power)',     '₹/metre', INDIA_AVG_RATES_DISPLAY.wire_2_5],
                ['wire_4_0',  'Wire 4.0 sqmm (AC/geyser)', '₹/metre', INDIA_AVG_RATES_DISPLAY.wire_4_0],
                ['wire_6_0',  'Wire 6.0 sqmm (sub-panel)', '₹/metre', INDIA_AVG_RATES_DISPLAY.wire_6_0],
              ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-[12px] flex-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                    />
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · Avg: ₹{avg}
                    </span>
                  </div>
                </div>
              ))}

              <p className="text-[10px] uppercase tracking-widest pt-2"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                CONDUIT &amp; MCB RATES
              </p>
              {([
                ['conduit_25', 'PVC conduit 25mm (IS 9537)', '₹/metre', INDIA_AVG_RATES_DISPLAY.conduit_25],
                ['mcb_6A',     'MCB 6A (lighting)',          '₹/piece', INDIA_AVG_RATES_DISPLAY.mcb_6A],
                ['mcb_16A',    'MCB 16A (power sockets)',    '₹/piece', INDIA_AVG_RATES_DISPLAY.mcb_16A],
                ['mcb_20A',    'MCB 20A (AC/geyser)',        '₹/piece', INDIA_AVG_RATES_DISPLAY.mcb_20A],
                ['rccb_25A',   'RCCB 30mA / 25A (bathroom IS 3043)', '₹/piece', INDIA_AVG_RATES_DISPLAY.rccb_25A],
              ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-[12px] flex-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                    />
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · Avg: ₹{avg}
                    </span>
                  </div>
                </div>
              ))}

              <p className="text-[10px] uppercase tracking-widest pt-2"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                DB PANEL &amp; EARTHING
              </p>
              {([
                ['db_8way',     'DB panel 8-way (incl. busbars)', '₹/panel', INDIA_AVG_RATES_DISPLAY.db_8way],
                ['db_12way',    'DB panel 12-way',                '₹/panel', INDIA_AVG_RATES_DISPLAY.db_12way],
                ['earthingKit', 'Earthing pit kit (GI 2.5m×40mm)', '₹/pit', INDIA_AVG_RATES_DISPLAY.earthingKit],
              ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-[12px] flex-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                    />
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · Avg: ₹{avg}
                    </span>
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => setRates({ ...INDIA_AVG_RATES_DISPLAY })}
                className="text-[11px] px-3 py-1.5 rounded-[2px] transition-all"
                style={{ border: '1px solid rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                Reset to India Average
              </button>
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                IS 732:2019 mandates specific wire grades (FR-LSH). Changing rates does not change quantities — only cost totals.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 7: CONTRACTOR QUOTE ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              07 — CONTRACTOR QUOTE (OPTIONAL)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Have an electrician&apos;s quote? Enter it to compare against IS-code quantities after unlocking.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[14px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
              <input type="number" value={contractorQuote}
                onChange={e => setContractorQuote(e.target.value)}
                placeholder="e.g. 85000"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
              />
            </div>
            {contractorQuote && (
              <p className="text-[11px] mt-1" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                ✓ Quote saved. Comparison ready after unlock.
              </p>
            )}
          </div>
        </div>

        {/* ── SECTION 8: LABOUR ───────────────────────────────────────────────── */}
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
                  Add CPWD-based electrical labour cost to your total
                </p>
              </div>
            </label>
          </div>

          {includeLabour && (
            <div className="p-4 space-y-4">
              <AlertBox variant="caution">
                <strong>CPWD DSR 2023.</strong> Labour days depend on factors no software can predict — conduit must be laid before plastering, DB installation after masonry, testing only after all circuits complete, monsoon shutdowns, festival breaks. CPWD productivity rates calculate man-days. You set workers; days calculate automatically.
              </AlertBox>
              <AlertBox variant="error">
                <strong>IS 732:2019 MANDATORY:</strong> Verify Class B electrical contractor license before starting work. Unlicensed electrical work voids home insurance and creates personal liability.
              </AlertBox>
              <AlertBox variant="tip">
                <strong>Enter 0 workers</strong> to exclude any trade entirely — same effect as the − toggle button.
              </AlertBox>
              {/* Trades table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
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
                            placeholder="Trade name"
                            className="w-32 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
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
                            placeholder="days"
                            className="w-14 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
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
          Calculate My Electrical Cost →
        </button>
      </div>
    </div>
  )
}

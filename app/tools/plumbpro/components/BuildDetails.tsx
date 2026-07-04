'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  seismicZoneFromState,
  MATERIAL_RATES,
  WATER_DEMAND_LPCD,
  PIPE_SIZES,
  DRAINAGE_SLOPES,
  calcWaterDemand,
  type PlumbInput,
  type BathroomSpec,
  type WCType,
  type WashBasinType,
  type GeyserCapacity,
} from '../plumbpro-engine'

// ─── Alert + Regional helpers ─────────────────────────────────────────────────

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

function RegionalNote({ note }: { note: string }) {
  return (
    <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
      {note}
    </p>
  )
}

const PLUMB_REGIONAL_NOTES: Record<string, string> = {
  cpvc_25:     'Astral/Supreme CPVC ₹55–65/m in Tier-2 cities. Mumbai/Chennai ₹70–80/m. Remote NE India ₹85–95/m.',
  cpvc_32:     'Astral CPVC 32mm ₹90–100/m nationally. NE India transport adds ₹15–20/m.',
  cpvc_40:     'CPVC 40mm ₹140–160/m near manufacturing hubs. Remote sites ₹180–200/m.',
  swr_75:      'SWR 75mm ₹28–35/m in metros. ₹22–28/m in Tier-2 cities. Kerala and NE pay 10% more.',
  swr_110:     'SWR 110mm ₹45–55/m nationwide. Near Ahmedabad (plastic belt) ₹38–42/m.',
  upvc_110:    'uPVC 110mm underground ₹55–65/m. Coastal areas pay ₹70–80/m for UV-resistant grade.',
  pTrap100:    'P-trap 100mm ₹80–110/pc at hardware stores. Online/bulk buying saves 15–20%.',
  sumpTankPerL:'HDPE sump ₹3.5–4.5/L in Tier-2. Mumbai/Bangalore ₹5–6/L. NE India ₹6–8/L (transport).',
  ohtPerL:     'Sintex/Penguin OHT ₹4–5/L nationally. Coastal areas prefer SS (₹8–12/L) for longer life.',
  pumpHalfHP:  'Kirloskar/CRI 0.5HP ₹3,500–4,500 Tier-2 cities. Mumbai/Bangalore ₹4,500–6,000.',
}

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

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1', name: 'Plumber (CPVC joints)',   workers: 2, ratePerDay: 1100, indiaAvgRate: 1100, basisText: '6–8 CPVC joints/day',    active: true,  daysManual: '' },
  { id: 't2', name: 'Plumber Helper',          workers: 2, ratePerDay: 600,  indiaAvgRate: 600,  basisText: 'Ratio to plumber',         active: true,  daysManual: '' },
  { id: 't3', name: 'Sanitary Fitter',         workers: 1, ratePerDay: 1000, indiaAvgRate: 1000, basisText: '3–4 fixtures/day',          active: true,  daysManual: '' },
  { id: 't4', name: 'Excavation Labour',       workers: 1, ratePerDay: 750,  indiaAvgRate: 750,  basisText: '5 metres/day',              active: true,  daysManual: '' },
  { id: 't5', name: 'Tank Installer',          workers: 1, ratePerDay: 2000, indiaAvgRate: 2000, basisText: 'Per tank',                  active: false, daysManual: '' },
  { id: 't6', name: 'Pump Installer',          workers: 1, ratePerDay: 1500, indiaAvgRate: 1500, basisText: 'Per pump',                  active: false, daysManual: '' },
  { id: 't7', name: 'Testing & Flushing',      workers: 1, ratePerDay: 1000, indiaAvgRate: 1000, basisText: 'Hydrostatic test per day',  active: true,  daysManual: '' },
  { id: 't8', name: 'Night Watchman',          workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',                   active: true,  daysManual: '' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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
  onSubmit:        (input: PlumbInput) => void
  onFormChange?:   (data: Record<string, unknown>) => void
  onBack?:         () => void
}

export default function BuildDetails({ state, city, initialProject, onSubmit, onFormChange, onBack }: Props) {
  // PlumbPro numFloors string: '1'=G, '2'=G+1 … same as normalized total floors
  const initNumFloors   = initialProject?.numFloors != null ? String(initialProject.numFloors) : '1'
  const initBuaPerFloor = initialProject?.perFloorAreas?.length
    ? String(initialProject.perFloorAreas[0])
    : ''

  const [projectName, setProjectName]     = useState(initialProject?.projectName ?? '')
  const [localState, setLocalState]       = useState(initialProject?.state ?? state)
  const [localCity, setLocalCity]         = useState(initialProject?.city ?? city)

  const [buaPerFloor, setBuaPerFloor]     = useState(initBuaPerFloor)
  const [buaUnit, setBuaUnit]             = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]         = useState(initNumFloors)

  const [numBedrooms, setNumBedrooms]     = useState('2')
  const [numBathrooms, setNumBathrooms]   = useState('2')

  const [waterSource, setWaterSource]     = useState<'municipal' | 'borewell'>('municipal')
  const [includeSump, setIncludeSump]     = useState(true)

  // Per-bathroom specs
  const [bathroomSpecs, setBathroomSpecs] = useState<BathroomSpec[]>([])

  // Building-level outdoor/utility
  const [hasUtilityArea, setHasUtilityArea]   = useState(false)
  const [gardenTapCount, setGardenTapCount]   = useState('0')
  const [hasCarWash, setHasCarWash]           = useState(false)
  const [hasOutdoorShower, setHasOutdoorShower] = useState(false)
  const [hasROPoint, setHasROPoint]           = useState(false)

  const [showTechSpecs, setShowTechSpecs] = useState(false)
  const [showRates, setShowRates]         = useState(false)
  const [rates, setRates]                 = useState({ ...MATERIAL_RATES })
  const [subStep, setSubStep] = useState<'3a' | '3b' | '3c'>('3a')

  const [contractorQuote, setContractorQuote] = useState('')
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]               = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades]   = useState<CustomTrade[]>([])

  const [openTip, setOpenTip]             = useState<string | null>(null)
  const [errors, setErrors]               = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(localState)

  // Live summary panel update
  useEffect(() => {
    if (!onFormChange) return
    const v = parseFloat(buaPerFloor)
    const sqft = (!v || v <= 0) ? 0 : buaUnit === 'sqm' ? v * SQFT_PER_SQM : v
    const bua = Math.round(sqft * (parseInt(numFloors) || 1))
    onFormChange({ bua, labourEnabled: includeLabour })
  }, [buaPerFloor, buaUnit, numFloors, includeLabour, onFormChange])

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview  = toBuaSqft(buaPerFloor, buaUnit)
  const numBedsInt      = parseInt(numBedrooms) || 0
  const numBathsInt     = parseInt(numBathrooms) || 0

  // Keep bathroomSpecs length in sync with numBathsInt
  useEffect(() => {
    setBathroomSpecs(prev => {
      if (prev.length === numBathsInt) return prev
      if (numBathsInt > prev.length) {
        const extras: BathroomSpec[] = Array.from({ length: numBathsInt - prev.length }, () => ({
          wcType: 'western_flush_tank' as WCType,
          washBasinType: 'pedestal' as WashBasinType,
          hasShower: true,
          hasBathtub: false,
          geyserCapacity: '15L' as GeyserCapacity,
        }))
        return [...prev, ...extras]
      }
      return prev.slice(0, numBathsInt)
    })
  }, [numBathsInt])
  const numFloorsInt    = parseInt(numFloors) || 1
  const occupants       = numBedsInt * 2 + 1
  const lpcdRate        = WATER_DEMAND_LPCD[waterSource]
  const dailyWaterLpd   = occupants * lpcdRate
  const sumpCapLitres   = Math.round(dailyWaterLpd * 2)
  const ohtCapLitres    = Math.round(dailyWaterLpd * 0.67)

  // calcWaterDemand is imported and available for the engine call on submit
  void calcWaterDemand

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
    if (!buaPerFloor || parseFloat(buaPerFloor) <= 0) e.buaPerFloor = 'Enter floor area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate3a()) {
      setSubStep('3a')
      return
    }
    onSubmit({
      state:              localState,
      city:               localCity,
      numBedrooms:        numBedsInt,
      numBathrooms:       numBathsInt,
      numFloors:          numFloorsInt,
      buaPerFloorSqft:    Math.round(toBuaSqft(buaPerFloor, buaUnit)),
      waterSource,
      includeSump,
      bathroomSpecs:      bathroomSpecs.length > 0 ? bathroomSpecs : undefined,
      hasUtilityArea,
      gardenTapCount:     parseInt(gardenTapCount) || 0,
      hasCarWash,
      hasOutdoorShower,
      hasROPoint,
      contractorQuote:    contractorQuote ? parseFloat(contractorQuote) : undefined,
      includeLabour,
    })
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">

      {/* Page header */}
      <div className="py-8 px-6 md:px-10" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          04 · PLUMBING
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

        {/* FREE LIVE: IS 1172:1993 Water Demand Calculator */}
        <div className="border rounded-[2px] overflow-hidden"
          style={{ borderColor: 'rgba(31,78,121,0.35)', background: 'rgba(31,78,121,0.03)' }}>
          <div className="px-4 py-2" style={{ background: 'rgba(31,78,121,0.08)', borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[9px] rounded"
                  style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>FREE LIVE</span>
                <p className="text-[11px] uppercase tracking-widest"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1172:1993 — DAILY WATER DEMAND PREVIEW
                </p>
              </div>
              <ISBadge code="IS 1172:1993" />
            </div>
          </div>
          <div className="p-4">
            {numBedsInt > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'OCCUPANTS',     value: `${occupants}`,      unit: 'persons',      tipId: 'occupants' },
                    { label: 'LPCD RATE',     value: `${lpcdRate}`,       unit: 'L/person/day', tipId: 'lpcd' },
                    { label: 'DAILY DEMAND',  value: `${dailyWaterLpd}`,  unit: 'litres/day',   tipId: 'demand' },
                    { label: 'SUMP CAPACITY', value: `${sumpCapLitres}`,  unit: 'litres (2-day)',tipId: 'sump_cap' },
                  ].map(item => (
                    <div key={item.label} className="text-center px-2 py-2 rounded-[2px]"
                      style={{ background: 'rgba(31,78,121,0.06)', border: '1px solid rgba(31,78,121,0.14)' }}>
                      <div className="flex items-center justify-center gap-0.5">
                        <p className="text-[8px] uppercase tracking-widest"
                          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{item.label}</p>
                        <TipBtn id={item.tipId} open={openTip} onToggle={toggleTip}>
                          {item.tipId === 'occupants' ? 'IS 1172:1993: Occupancy estimate = (bedrooms × 2) + 1. Actual occupancy may differ — adjust if you know actual household size.'
                           : item.tipId === 'lpcd' ? `IS 1172:1993 Table 1: Municipal supply = 135 LPCD minimum. Borewell/tanker areas = 150 LPCD — stored supply needs buffer. These are minimum design values. Actual usage is typically 110–160 LPCD in Indian cities.`
                           : item.tipId === 'demand' ? 'IS 1172:1993: Total daily demand = occupants × LPCD rate. Drives sump size, OHT size, and pump selection. Add 15% safety factor in hot climates.'
                           : 'IS 1172:1993: Sump capacity = 2 days × daily demand. Buffer for supply disruptions. Final sump volume in report — this is the free preview.'}
                        </TipBtn>
                      </div>
                      <p className="text-[20px] font-bold"
                        style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{item.value}</p>
                      <p className="text-[9px]"
                        style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{item.unit}</p>
                    </div>
                  ))}
                </div>
                {ohtCapLitres > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-[2px]"
                    style={{ background: 'rgba(20,83,45,0.07)', border: '1px solid rgba(20,83,45,0.2)' }}>
                    <span style={{ color: '#14532D', fontSize: 14 }}>✓</span>
                    <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                      OHT: {ohtCapLitres}L · Sump: {sumpCapLitres}L · Source: {waterSource}
                    </p>
                    <span className="ml-auto text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Free preview</span>
                  </div>
                )}
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                  IS 1172:1993 — Tank capacities and pipe quantities visible free above. Full BOQ unlocked with paid report.
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-center py-2" style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
                Fill in bedrooms below to see live water demand calculation →
              </p>
            )}
          </div>
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
                className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
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
                BUA = Built-Up Area. Used to calculate total pipe run lengths — supply risers, horizontal distribution, and drainage stacks are estimated from floor plate size. IS 1742:1983 specifies pipe routing geometry for multi-storey buildings.
              </TipBtn>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input type="number" value={buaPerFloor}
                onChange={e => { setBuaPerFloor(e.target.value); setErrors(prev => ({ ...prev, buaPerFloor: '' })) }}
                placeholder="e.g. 900"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
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

            <div className="pt-2" style={{ borderTop: '1px solid rgba(30,34,39,0.08)' }}>
              <div className="flex items-center gap-1 mb-2">
                <label className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Number of Floors
                </label>
                <TipBtn id="floors" open={openTip} onToggle={toggleTip}>
                  IS 1742:1983: Each floor above ground requires a separate branch connection on the main stack. Soil stack and vent stack must rise one floor above the highest branch. Multi-storey buildings need intermediate slab-level vents. This affects stack height and vent pipe quantities.
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
            </div>
          </div>
        </div>

        {/* ── SECTION 3: BEDROOMS ─────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                03 — BEDROOMS
              </p>
              <TipBtn id="bedrooms" open={openTip} onToggle={toggleTip}>
                IS 1172:1993: Occupancy is calculated as (bedrooms × 2) + 1. This drives daily water demand (LPCD × occupants). More occupants = larger sump and OHT required. Studio / 1-room = select 1 bedroom.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              Used to estimate occupancy for IS 1172:1993 water demand calculation.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['1','2','3','4','5','6'].map(n => (
                <button key={n} type="button" onClick={() => setNumBedrooms(n)}
                  className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                  style={{
                    border:     `1.5px solid ${numBedrooms === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: numBedrooms === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                    color:      numBedrooms === n ? '#1F4E79' : '#1E2227',
                    fontFamily: 'var(--font-plex-mono)',
                  }}>
                  {n}BHK
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: BATHROOMS ────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                04 — BATHROOMS / TOILETS
              </p>
              <ISBadge code="IS 1742:1983" />
              <TipBtn id="baths" open={openTip} onToggle={toggleTip}>
                IS 1742:1983: Each WC / toilet requires a 110mm SWR soil stack branch. Each bathroom waste (basin, shower) uses 75mm SWR waste pipe. Fixture count sets: P-traps, floor traps, soil stack branches, and waste pipe runs.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1742:1983: Each bathroom = 1× soil stack branch (110mm), 1× waste pipe (75mm), 1× P-trap, 1× floor trap.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['1','2','3','4','5','6'].map(n => (
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
          </div>
        </div>

        {/* ── SECTION 4b: PER-BATHROOM SPECIFICATION ────────────────────────── */}
        {numBathsInt > 0 && (
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                04b — PER-BATHROOM SPECIFICATION
              </p>
            </div>
            <div className="p-4 space-y-5">
              {bathroomSpecs.map((spec, idx) => (
                <div key={idx} className="p-3 rounded-[2px]" style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.02)' }}>
                  <p className="text-[11px] font-medium mb-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    BATHROOM {idx + 1}
                  </p>
                  <div className="space-y-3">
                    {/* WC Type */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>WC Type</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          ['indian_orissa',       'Indian Orissa Pan', 'IS 2556:1994'],
                          ['western_flush_tank',  'Western + Flush Tank', 'IS 2556:1994'],
                          ['western_flush_valve', 'Western + Flush Valve', 'High-pressure flush'],
                        ] as [WCType, string, string][]).map(([val, label, sub]) => (
                          <button key={val} type="button"
                            onClick={() => setBathroomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, wcType: val } : s))}
                            className="p-1.5 rounded-[2px] text-left"
                            style={{
                              border: `1.5px solid ${spec.wcType === val ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`,
                              background: spec.wcType === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                            }}>
                            <p className="text-[11px] font-medium" style={{ color: spec.wcType === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Wash Basin */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Wash Basin</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          ['wall_hung',   'Wall-Hung'],
                          ['pedestal',    'Pedestal'],
                          ['counter_top', 'Counter-Top'],
                          ['none',        'None'],
                        ] as [WashBasinType, string][]).map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => setBathroomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, washBasinType: val } : s))}
                            className="py-1.5 rounded-[2px] text-[11px] text-center"
                            style={{
                              border: `1.5px solid ${spec.washBasinType === val ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`,
                              background: spec.washBasinType === val ? 'rgba(31,78,121,0.07)' : 'transparent',
                              color: spec.washBasinType === val ? '#1F4E79' : '#1E2227',
                              fontFamily: 'var(--font-plex-sans)',
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Shower / Bathtub / Geyser */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Shower</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={spec.hasShower}
                            onChange={() => setBathroomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, hasShower: !s.hasShower } : s))}
                            className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                          />
                          <span className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Yes</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Bathtub</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={spec.hasBathtub}
                            onChange={() => setBathroomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, hasBathtub: !s.hasBathtub } : s))}
                            className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                          />
                          <span className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Yes</span>
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>Geyser</label>
                        <div className="flex gap-1">
                          {(['15L', '25L', 'none'] as GeyserCapacity[]).map(cap => (
                            <button key={cap} type="button"
                              onClick={() => setBathroomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, geyserCapacity: cap } : s))}
                              className="px-2 py-1 rounded-[2px] text-[11px]"
                              style={{
                                border: `1.5px solid ${spec.geyserCapacity === cap ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`,
                                background: spec.geyserCapacity === cap ? 'rgba(31,78,121,0.07)' : 'transparent',
                                color: spec.geyserCapacity === cap ? '#1F4E79' : '#1E2227',
                                fontFamily: 'var(--font-plex-mono)',
                              }}>
                              {cap}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 4c: OUTDOOR + UTILITY WATER POINTS ────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              04c — OUTDOOR &amp; UTILITY WATER POINTS
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Utility area */}
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-[2px]"
                style={{ border: `1.5px solid ${hasUtilityArea ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: hasUtilityArea ? 'rgba(31,78,121,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={hasUtilityArea} onChange={() => setHasUtilityArea(v => !v)}
                  className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Utility Area</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Washing machine inlet + drain</p>
                </div>
              </label>
              {/* Car wash */}
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-[2px]"
                style={{ border: `1.5px solid ${hasCarWash ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: hasCarWash ? 'rgba(31,78,121,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={hasCarWash} onChange={() => setHasCarWash(v => !v)}
                  className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Car Wash Point</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>External hose bib tap</p>
                </div>
              </label>
              {/* Outdoor shower */}
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-[2px]"
                style={{ border: `1.5px solid ${hasOutdoorShower ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: hasOutdoorShower ? 'rgba(31,78,121,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={hasOutdoorShower} onChange={() => setHasOutdoorShower(v => !v)}
                  className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Outdoor Shower</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Garden / terrace shower</p>
                </div>
              </label>
              {/* RO point */}
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-[2px]"
                style={{ border: `1.5px solid ${hasROPoint ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: hasROPoint ? 'rgba(31,78,121,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={hasROPoint} onChange={() => setHasROPoint(v => !v)}
                  className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>RO / Water Purifier</p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Dedicated inlet + drain</p>
                </div>
              </label>
            </div>
            {/* Garden taps */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Garden Taps
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['0','1','2','3'].map(n => (
                  <button key={n} type="button" onClick={() => setGardenTapCount(n)}
                    className="py-2 rounded-[2px] text-[13px] font-medium"
                    style={{
                      border: `1.5px solid ${gardenTapCount === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                      background: gardenTapCount === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                      color: gardenTapCount === n ? '#1F4E79' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {/* Pump head advisory */}
            {numFloorsInt > 0 && (
              <div className="p-3 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.2)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  PUMP HEAD ESTIMATE
                </p>
                {(() => {
                  const head = numFloorsInt * 3 + 5  // floors × floor height + 5m safety
                  const hp   = head <= 20 ? '0.5 HP' : head <= 35 ? '1 HP' : '1.5 HP'
                  return (
                    <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)' }}>
                      {numFloorsInt} floors × 3m + 5m safety = <strong>{head}m</strong> head → <strong>{hp}</strong> pump recommended
                    </p>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 5: WATER SOURCE ─────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                05 — WATER SOURCE
              </p>
              <ISBadge code="IS 1172:1993" />
              <TipBtn id="watersource" open={openTip} onToggle={toggleTip}>
                IS 1172:1993 Table 1: Municipal supply = 135 LPCD (water twice/day). Borewell or tanker = 150 LPCD — stored supply needs larger buffer. Affects sump sizing: borewell sump = 3-day storage; municipal sump = 2-day storage.
              </TipBtn>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {([
                { val: 'municipal', label: 'Municipal Supply',   desc: '135 LPCD · IS 1172:1993 Table 1', sub: 'Piped municipal supply (twice/day)' },
                { val: 'borewell',  label: 'Borewell / Tanker',  desc: '150 LPCD · IS 1172:1993 Table 1', sub: 'Stored supply (intermittent)' },
              ] as const).map(opt => (
                <button key={opt.val} type="button" onClick={() => setWaterSource(opt.val)}
                  className="p-3 rounded-[2px] text-left transition-all"
                  style={{
                    border:     `1.5px solid ${waterSource === opt.val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: waterSource === opt.val ? 'rgba(31,78,121,0.07)' : 'transparent',
                  }}>
                  <p className="text-[13px] font-medium mb-0.5"
                    style={{ color: waterSource === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px]"
                    style={{ color: waterSource === opt.val ? '#1F4E79' : 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    {opt.desc}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                    {opt.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 6: SUMP / OHT ───────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                06 — SUMP TANK &amp; OHT
              </p>
              <ISBadge code="IS 12701" />
              <TipBtn id="sump" open={openTip} onToggle={toggleTip}>
                IS 12701:1989: Tanks must be HDPE food-grade. Sump tank = underground storage (2× daily demand). OHT = overhead tank (0.67× daily demand, IS 1172:1993). Sump feeds pump to OHT; OHT feeds all fixtures by gravity. Never use PVC tanks for drinking water — HDPE IS 12701 only.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div
                onClick={() => setIncludeSump(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeSump ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeSump ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include sump tank &amp; OHT in estimate
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 12701: HDPE food-grade · Sump = 2-day storage · OHT = 0.67-day storage
                </p>
              </div>
            </label>
            {includeSump && numBedsInt > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2 rounded-[2px]"
                  style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>SUMP CAPACITY</p>
                  <p className="text-[18px] font-bold mt-0.5"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{sumpCapLitres}L</p>
                  <p className="text-[10px]"
                    style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Underground · IS 12701</p>
                </div>
                <div className="px-3 py-2 rounded-[2px]"
                  style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>OHT CAPACITY</p>
                  <p className="text-[18px] font-bold mt-0.5"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{ohtCapLitres}L</p>
                  <p className="text-[10px]"
                    style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Overhead · IS 12701</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 7: TECHNICAL SPECIFICATIONS (collapsible) ───────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button"
            onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                07 — ADVANCED SETTINGS ▼ — TECHNICAL SPECIFICATIONS
              </p>
              {!showTechSpecs && (
                <p className="text-[11px] text-left mt-0.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ IS 1742:1983 applied · CPVC {PIPE_SIZES.supplyMin.diameter}mm supply · SWR {PIPE_SIZES.soilStack.diameter}mm soil stack
                </p>
              )}
            </div>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>

          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div className="pt-3">
                <AlertBox variant="info">
                  IS 1742:1983 pipe sizes and IS 1172:1993 water demand values are applied automatically and locked. These are minimum IS code values — your contractor must not deviate below these diameters. Changing rates in Section 8 affects cost totals only, not pipe quantities.
                </AlertBox>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Pipe Sizes (IS 1742:1983 — Locked)
                  </label>
                  <ISBadge code="IS 1742:1983" />
                  <TipBtn id="pipesizes" open={openTip} onToggle={toggleTip}>
                    IS 1742:1983 specifies minimum pipe diameters. CPVC 25mm for branch supply; CPVC 32mm for main risers in 2+ storey. SWR 75mm for waste; SWR 110mm for WC soil stacks. Never reduce below IS minimums — hydraulic failure risk. CPVC preferred over GI for drinking water supply.
                  </TipBtn>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 400 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                        {['Use', 'Key', 'Diameter', 'Material'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(PIPE_SIZES).map(([key, p], i) => (
                        <tr key={key} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                          <td className="py-1.5 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{p.use}</td>
                          <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{key}</td>
                          <td className="py-1.5 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontWeight: 600 }}>{p.diameter}mm</td>
                          <td className="py-1.5 px-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{p.material}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Drainage Slopes (IS 1742:1983 — Locked)
                  </label>
                  <TipBtn id="slopes" open={openTip} onToggle={toggleTip}>
                    IS 1742:1983: 75mm waste pipes slope at minimum 1:48 (2%). 110mm soil stacks at 1:80 (1.25%). Steeper is NOT always better — fast flow can leave solids. Self-cleansing velocity requires specific gradient. Plumber must verify at site with spirit level.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DRAINAGE_SLOPES).map(([key, s]) => (
                    <div key={key} className="px-3 py-2 rounded-[2px]"
                      style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.03)' }}>
                      <p className="text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{s.size}</p>
                      <p className="text-[18px] font-bold mt-0.5"
                        style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{s.ratio}</p>
                      <p className="text-[10px]"
                        style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{s.percent}% gradient</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1742:1983 — Slopes are minimum. Verify at site. Fittings add 0.35× pipe cost.
                </p>
              </div>

              <div className="p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1172:1993 WATER DEMAND REFERENCE
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Municipal</p>
                    <p className="text-[16px] font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                      {WATER_DEMAND_LPCD.municipal} LPCD
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Borewell</p>
                    <p className="text-[16px] font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                      {WATER_DEMAND_LPCD.borewell} LPCD
                    </p>
                  </div>
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
              <strong>Why local rates matter:</strong> We calculate exact quantities using IS codes — quantities are universal. But material prices vary by 20–40% between cities. Enter your local rates to get an accurate cost estimate.
            </p>
          </div>
          <div className="space-y-3">
            <div className="pt-1 space-y-2">
              <div className="pt-3 space-y-2">
                <AlertBox variant="tip">
                  These are India Average 2026 rates (Pune / Astral / Supreme pricing). Adjust to your local market — plumbing material prices vary 30–40% between metro and remote NE India.
                </AlertBox>
                <AlertBox variant="caution">
                  IS 1742:1983 mandates CPVC (not GI) for drinking water supply. Never use GI pipes for CPVC branches — galvanic corrosion leaches zinc into water. Changing rates here affects cost totals only, not pipe quantities.
                </AlertBox>
              </div>

              <p className="text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                SUPPLY PIPE RATES (CPVC — IS 15778)
              </p>
              {([
                ['cpvc_25', 'CPVC 25mm (branch supply)',    '₹/metre', MATERIAL_RATES.cpvc_25],
                ['cpvc_32', 'CPVC 32mm (main riser)',       '₹/metre', MATERIAL_RATES.cpvc_32],
                ['cpvc_40', 'CPVC 40mm (main, large bldg)', '₹/metre', MATERIAL_RATES.cpvc_40],
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
                        {unit} · Avg: ₹{avg}
                      </span>
                    </div>
                  </div>
                  {PLUMB_REGIONAL_NOTES[key] && <RegionalNote note={PLUMB_REGIONAL_NOTES[key]} />}
                </div>
              ))}

              <p className="text-[10px] uppercase tracking-widest pt-2"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                DRAINAGE PIPE RATES (SWR/UPVC — IS 14735)
              </p>
              {([
                ['swr_75',   'SWR 75mm (waste pipe)',          '₹/metre', MATERIAL_RATES.swr_75],
                ['swr_110',  'SWR 110mm (soil stack)',         '₹/metre', MATERIAL_RATES.swr_110],
                ['upvc_110', 'uPVC 110mm (underground drain)', '₹/metre', MATERIAL_RATES.upvc_110],
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
                        {unit} · Avg: ₹{avg}
                      </span>
                    </div>
                  </div>
                  {PLUMB_REGIONAL_NOTES[key] && <RegionalNote note={PLUMB_REGIONAL_NOTES[key]} />}
                </div>
              ))}

              <p className="text-[10px] uppercase tracking-widest pt-2"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                FIXTURES &amp; VALVES
              </p>
              {([
                ['pTrap100',   'P-trap 100mm',            '₹/piece', MATERIAL_RATES.pTrap100],
                ['floorTrap',  'Floor trap 100mm',        '₹/piece', MATERIAL_RATES.floorTrap],
                ['ballValve25','Ball valve 25mm',         '₹/piece', MATERIAL_RATES.ballValve25],
                ['gateValve40','Gate valve 40mm (main)',  '₹/piece', MATERIAL_RATES.gateValve40],
                ['waterMeter', 'Water meter',             '₹/piece', MATERIAL_RATES.waterMeter],
                ['prv',        'Pressure reducing valve', '₹/piece', MATERIAL_RATES.prv],
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
                        {unit} · Avg: ₹{avg}
                      </span>
                    </div>
                  </div>
                  {PLUMB_REGIONAL_NOTES[key] && <RegionalNote note={PLUMB_REGIONAL_NOTES[key]} />}
                </div>
              ))}

              <p className="text-[10px] uppercase tracking-widest pt-2"
                style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                TANKS &amp; PUMPS
              </p>
              {([
                ['sumpTankPerL', 'Sump tank (HDPE IS 12701)',  '₹/litre', MATERIAL_RATES.sumpTankPerL],
                ['ohtPerL',     'OHT tank (HDPE IS 12701)',   '₹/litre', MATERIAL_RATES.ohtPerL],
                ['pumpHalfHP',  'Pump 0.5 HP',                '₹/piece', MATERIAL_RATES.pumpHalfHP],
                ['pump1HP',     'Pump 1.0 HP',                '₹/piece', MATERIAL_RATES.pump1HP],
                ['pump1_5HP',   'Pump 1.5 HP',                '₹/piece', MATERIAL_RATES.pump1_5HP],
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
                        {unit} · Avg: ₹{avg}
                      </span>
                    </div>
                  </div>
                  {PLUMB_REGIONAL_NOTES[key] && <RegionalNote note={PLUMB_REGIONAL_NOTES[key]} />}
                </div>
              ))}

              <button type="button" onClick={() => setRates({ ...MATERIAL_RATES })}
                className="text-[11px] px-3 py-1.5 rounded-[2px] transition-all"
                style={{ border: '1px solid rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                Reset to India Average
              </button>
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                IS 1742:1983 mandates CPVC (not GI) for supply. Changing rates affects cost totals, not pipe quantities.
              </p>
            </div>
          </div>

          {/* Contractor Quote */}
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                09 — CONTRACTOR QUOTE (OPTIONAL)
              </p>
            </div>
            <div className="p-4">
              <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                Have a plumber&apos;s quote? Enter it to compare against IS-code quantities after unlocking.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[14px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input type="number" value={contractorQuote}
                  onChange={e => setContractorQuote(e.target.value)}
                  placeholder="e.g. 65000"
                  className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
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
              Labour costs vary significantly with season, location, and site conditions. CPWD DSR 2023 rates are government benchmarks — actual rates typically differ by ±20–30%.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => setIncludeLabour(true)} className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}>
              <p className="text-[15px] font-semibold mb-1" style={{ color: includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Include Labour Cost</p>
              <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Use CPWD DSR 2023 rates. Edit workers and rates per trade. Labour appears only in paid PDF report.</p>
            </button>
            <button type="button" onClick={() => setIncludeLabour(false)} className="p-4 rounded-[2px] text-left transition-all"
              style={{ border: `2px solid ${!includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: !includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}>
              <p className="text-[15px] font-semibold mb-1" style={{ color: !includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Skip — Material Cost Only</p>
              <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour later from your plumber&apos;s quote.</p>
            </button>
          </div>

          {includeLabour && (
            <div className="space-y-4">
              <AlertBox variant="caution">
                Plumbing labour is done in two phases — rough-in (before plastering) and finishing (after). Days between phases depend on mason schedule, inspection clearances, and slab curing. CPWD rates calculate joints/fixtures per day. You set workers; days auto-calculate from productivity.
              </AlertBox>
              <AlertBox variant="error">
                IS 1742:1983: Hydrostatic pressure test at 1.5× working pressure is mandatory before handing over. Budget 1 day for testing + flushing. Do not skip this — leaks discovered post-plastering cost 5–10× more to fix.
              </AlertBox>
              <AlertBox variant="tip">
                To exclude a trade from your estimate, enter 0 in the Workers column (or use the − button). Excluded trades show at 35% opacity and are not included in the labour total.
              </AlertBox>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      {['Trade', 'Workers (0 = exclude)', 'Rate/day ₹', 'India Avg', 'CPWD Basis', 'Days'].map(h => (
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

'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  calcGradeComparison,
  seismicZoneFromState,
  FLOORING_RATES,
  KITCHEN_RATES,
  FALSE_CEILING_RATES,
  TILE_WASTAGE_FACTOR,
  PAINT_LITRES_PER_SQFT_BUA,
  PAINT_COVERAGE_SQFT_PER_LITRE,
  LABOUR,
  type InteriorInput,
  type InteriorGrade,
  type InteriorMethod,
  type StaircaseRiserMaterial,
  type StaircaseTreadMaterial,
  type StaircaseRailingType,
  type WindowFrameMaterial,
  type GrillMaterial,
  type BalconyTileType,
} from '../interiorpro-engine'

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

const INTERIOR_REGIONAL_NOTES: Record<string, string> = {
  basic:    'Ceramic tile ₹28–38/sqft near Morbi (Gujarat tile belt). Remote NE India ₹50–65/sqft (transport adds 25–35%).',
  standard: 'Kajaria/Orient vitrified ₹55–75/sqft in Tier-2 cities. Mumbai/Bangalore showrooms ₹80–110/sqft.',
  premium:  'Full-body vitrified/imported ₹120–180/sqft nationally. Design tiles from Italy/Spain ₹200–400/sqft.',
  luxury:   'Marble/large-format ₹200–600/sqft. Statuario marble ₹800+ in metros. Regional granite ₹150–250/sqft.',
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

const GRADE_META: Record<InteriorGrade, { label: string; desc: string; tile: string; kitchen: string }> = {
  basic:    { label: 'Basic',    desc: 'Affordable, functional finish',     tile: 'Ceramic / vitrified 30×30', kitchen: 'Plain laminate, PB shutters' },
  standard: { label: 'Standard', desc: 'Popular mid-range finish',          tile: 'Vitrified 60×60, ISI mark',  kitchen: 'Designer laminate, MDF shutters' },
  premium:  { label: 'Premium',  desc: 'High finish, long life',            tile: 'Full-body vitrified 80×80',  kitchen: 'Acrylic / PU finish, marine ply' },
  luxury:   { label: 'Luxury',   desc: 'Best materials and craftsmanship',  tile: 'Large format 120×120 / marble', kitchen: 'Italian or solid wood, SS hardware' },
}

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
  { id: 't1',  name: 'Tile Mason (floor)',      workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  basisText: '80–100 sqft/day',   active: true,  daysManual: '' },
  { id: 't2',  name: 'Tile Mason (wall)',        workers: 1, ratePerDay: 950,  indiaAvgRate: 950,  basisText: '60 sqft/day',        active: true,  daysManual: '' },
  { id: 't3',  name: 'Tile Helper',             workers: 2, ratePerDay: 560,  indiaAvgRate: 560,  basisText: 'Ratio to mason',      active: true,  daysManual: '' },
  { id: 't4',  name: 'Carpenter',               workers: 2, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',             active: true,  daysManual: '' },
  { id: 't5',  name: 'Painter',                 workers: 2, ratePerDay: 700,  indiaAvgRate: 700,  basisText: '400 sqft/day (2 coats)', active: true, daysManual: '' },
  { id: 't6',  name: 'False Ceiling Installer', workers: 1, ratePerDay: 1000, indiaAvgRate: 1000, basisText: '150 sqft/day',        active: true,  daysManual: '' },
  { id: 't7',  name: 'Polishing / Buffing',     workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: '200 sqft/day',        active: false, daysManual: '' },
  { id: 't8',  name: 'Electrician (fixtures)',  workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: 'Per day',             active: true,  daysManual: '' },
  { id: 't9',  name: 'Interior Helper',         workers: 2, ratePerDay: 540,  indiaAvgRate: 540,  basisText: 'Per day',             active: true,  daysManual: '' },
  { id: 't10', name: 'Supervisor',              workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',             active: true,  daysManual: '' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TipBtn({ id, open, onToggle, children }: {
  id: string; open: string | null; onToggle: (id: string) => void; children: ReactNode
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

interface Props {
  state:    string
  city:     string
  onSubmit: (input: InteriorInput) => void
  onFormChange?: (data: Record<string, unknown>) => void
  onBack?: () => void
}

export default function BuildDetails({ state, city, onSubmit, onFormChange, onBack }: Props) {
  const method: InteriorMethod = 'quick'
  const [projectName, setProjectName]         = useState('')
  const [localState, setLocalState]           = useState(state)
  const [localCity, setLocalCity]             = useState(city)

  const [grade, setGrade]                     = useState<InteriorGrade>('standard')
  const [buaPerFloor, setBuaPerFloor]         = useState('')
  const [buaUnit, setBuaUnit]                 = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]             = useState('1')
  const [numBedrooms, setNumBedrooms]         = useState('2')
  const [numBathrooms, setNumBathrooms]       = useState('2')
  const [kitchenRft, setKitchenRft]           = useState('12')
  const [includeFalseCeiling, setFalseCeiling]= useState(true)
  const [falseCeilingSqft, setFalseCeilingSqft] = useState('')
  const [numDoors, setNumDoors]               = useState('5')

  const [showTechSpecs, setShowTechSpecs]     = useState(false)
  const [showRates, setShowRates]             = useState(false)
  const [subStep, setSubStep] = useState<'3a' | '3b' | '3c'>('3a')
  const [flooringRates, setFlooringRates]     = useState({ ...FLOORING_RATES })
  const [kitchenRates, setKitchenRates]       = useState({ ...KITCHEN_RATES })
  const [fcRates, setFcRates]                 = useState({ ...FALSE_CEILING_RATES })

  const [contractorQuote, setContractorQuote] = useState('')
  const [includeLabour, setIncludeLabour]     = useState(false)
  const [trades, setTrades]                   = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades]       = useState<CustomTrade[]>([])

  const [openTip, setOpenTip]                 = useState<string | null>(null)
  const [errors, setErrors]                   = useState<Record<string, string>>({})

  // New sections
  const [bathroomTilingHeightFt, setBathTilingHt]    = useState('7')
  const [bathroomWallTileRate, setBathWallRate]       = useState('')
  const [bathroomFloorAntiSkid, setBathAntiSkid]     = useState(true)

  const [kitchenDadoHeightM, setKitchenDadoHt]       = useState('0.6')
  const [kitchenLengthFt, setKitchenLenFt]           = useState('')
  const [kitchenDadoRate, setKitchenDadoRate]        = useState('')

  const [includeStaircase, setIncludeStaircase]      = useState(false)
  const [staircaseFlights, setStaircaseFlights]      = useState('1')
  const [stepsPerFlight, setStepsPerFlight]          = useState('13')
  const [riserMaterial, setRiserMaterial]            = useState<StaircaseRiserMaterial>('granite')
  const [treadMaterial, setTreadMaterial]            = useState<StaircaseTreadMaterial>('granite')
  const [railingType, setRailingType]                = useState<StaircaseRailingType>('ms_painted')

  const [balconyAreaSqft, setBalconyAreaSqft]        = useState('')
  const [balconyTileType, setBalconyTileType]        = useState<BalconyTileType>('antiskid_ceramic')
  const [balconyTileRate, setBalconyTileRate]        = useState('')

  const [externalWallAreaSqft, setExtWallArea]       = useState('')
  const [externalPaintCoats, setExtPaintCoats]       = useState('2')
  const [externalPaintRate, setExtPaintRate]         = useState('28')

  const [numWindows, setNumWindows]                  = useState('')
  const [windowFrameMaterial, setWindowFrameMat]     = useState<WindowFrameMaterial>('aluminium')
  const [windowMosquitoMesh, setWindowMesh]          = useState(false)
  const [windowRatePerUnit, setWindowRate]           = useState('')

  const [numGrillWindows, setNumGrillWindows]        = useState('')
  const [grillMaterial, setGrillMaterial]            = useState<GrillMaterial>('ms_painted')
  const [grillRatePerSqft, setGrillRate]             = useState('')
  const [grillAreaPerWindow, setGrillAreaPerWindow]  = useState('9')

  const szInfo = seismicZoneFromState(localState)

  // Live summary panel update
  useEffect(() => {
    if (!onFormChange) return
    const v = parseFloat(buaPerFloor)
    const sqft = (!v || v <= 0) ? 0 : buaUnit === 'sqm' ? v * SQFT_PER_SQM : v
    const bua = Math.round(sqft * (parseInt(numFloors) || 1))
    onFormChange({ bua, grade, labourEnabled: includeLabour })
  }, [buaPerFloor, buaUnit, numFloors, grade, includeLabour, onFormChange])

  function toggleTip(id: string) { setOpenTip(prev => prev === id ? null : id) }

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview  = toBuaSqft(buaPerFloor, buaUnit)
  const numFloorsInt    = parseInt(numFloors) || 1
  const totalBuaPreview = buaSqftPreview * numFloorsInt

  // Grade comparison (free live preview)
  const gradeComparison = totalBuaPreview > 0
    ? calcGradeComparison({
        state:              localState,
        city:               localCity,
        method:             'quick',
        grade:              grade,
        numFloors:          numFloorsInt,
        buaPerFloorSqft:    Math.round(buaSqftPreview),
        numBedrooms:        parseInt(numBedrooms) || 0,
        numBathrooms:       parseInt(numBathrooms) || 0,
        kitchenRft:         parseFloat(kitchenRft) || 12,
        includeFalseCeiling,
        falseCeilingSqft:   includeFalseCeiling ? (parseFloat(falseCeilingSqft) || Math.round(totalBuaPreview * 0.2)) : 0,
        numDoors:           parseInt(numDoors) || 0,
      })
    : []

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
    const buaSqft = Math.round(toBuaSqft(buaPerFloor, buaUnit))
    onSubmit({
      state:              localState,
      city:               localCity,
      method,
      grade,
      numFloors:          numFloorsInt,
      buaPerFloorSqft:    buaSqft,
      numBedrooms:        parseInt(numBedrooms) || 0,
      numBathrooms:       parseInt(numBathrooms) || 0,
      kitchenRft:         parseFloat(kitchenRft) || 12,
      includeFalseCeiling,
      falseCeilingSqft:   includeFalseCeiling ? (parseFloat(falseCeilingSqft) || Math.round(buaSqft * numFloorsInt * 0.2)) : 0,
      numDoors:           parseInt(numDoors) || 0,
      contractorQuote:    contractorQuote ? parseFloat(contractorQuote) : undefined,
      includeLabour,
      bathroomTilingHeightFt: parseFloat(bathroomTilingHeightFt) || 7,
      bathroomWallTileRatePerSqft: bathroomWallTileRate ? parseFloat(bathroomWallTileRate) : undefined,
      bathroomFloorAntiSkid,
      kitchenDadoHeightM: parseFloat(kitchenDadoHeightM) || 0.6,
      kitchenLengthFt:    kitchenLengthFt ? parseFloat(kitchenLengthFt) : undefined,
      kitchenDadoRatePerSqft: kitchenDadoRate ? parseFloat(kitchenDadoRate) : undefined,
      includeStaircase,
      staircaseFlights:   parseInt(staircaseFlights) || 1,
      stepsPerFlight:     parseInt(stepsPerFlight) || 13,
      riserMaterial,
      treadMaterial,
      railingType,
      balconyAreaSqft:    balconyAreaSqft ? parseFloat(balconyAreaSqft) : undefined,
      balconyTileType,
      balconyTileRatePerSqft: balconyTileRate ? parseFloat(balconyTileRate) : undefined,
      externalWallAreaSqft: externalWallAreaSqft ? parseFloat(externalWallAreaSqft) : undefined,
      externalPaintCoats:   parseInt(externalPaintCoats) || 2,
      externalPaintRatePerSqft: parseFloat(externalPaintRate) || 28,
      numWindows:           numWindows ? parseInt(numWindows) : undefined,
      windowFrameMaterial,
      windowMosquitoMesh,
      windowRatePerUnit:    windowRatePerUnit ? parseFloat(windowRatePerUnit) : undefined,
      numGrillWindows:      numGrillWindows ? parseInt(numGrillWindows) : undefined,
      grillMaterial,
      grillRatePerSqft:     grillRatePerSqft ? parseFloat(grillRatePerSqft) : undefined,
      grillAreaPerWindowSqft: parseFloat(grillAreaPerWindow) || 9,
    })
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">

      {/* Page header */}
      <div className="py-8 px-6 md:px-10" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          05 · INTERIORS
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

        {/* FREE LIVE: Grade Comparison Table */}
        <div className="border rounded-[2px] overflow-hidden"
          style={{ borderColor: 'rgba(31,78,121,0.35)', background: 'rgba(31,78,121,0.03)' }}>
          <div className="px-4 py-2" style={{ background: 'rgba(31,78,121,0.08)', borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[9px] rounded"
                style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>FREE LIVE</span>
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                GRADE COMPARISON — ALL 4 GRADES SIDE BY SIDE
              </p>
            </div>
          </div>
          <div className="p-4">
            {gradeComparison.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      <th className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>Grade</th>
                      {(['flooring', 'kitchen', 'paint', 'total', 'per sqft'] as const).map(h => (
                        <th key={h} className="text-right py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gradeComparison.map((g, i) => (
                      <tr key={g.grade}
                        onClick={() => setGrade(g.grade)}
                        style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: grade === g.grade ? 'rgba(31,78,121,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.01)', cursor: 'pointer' }}>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: grade === g.grade ? '#1F4E79' : 'rgba(30,34,39,0.15)' }} />
                            <span style={{ color: grade === g.grade ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)', fontWeight: grade === g.grade ? 600 : 400 }}>
                              {GRADE_META[g.grade].label}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{g.flooringCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{g.kitchenCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-right" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{g.paintCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-right font-bold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{g.totalMaterial.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-right" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{g.perSqft}/sf
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] mt-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                  Click a row to select that grade. IS 15477:2004 tile wastage {((TILE_WASTAGE_FACTOR - 1) * 100).toFixed(0)}% applied. Labour excluded. Full BOQ unlocked with paid report.
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-center py-2" style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-sans)' }}>
                Fill in floor area below to see live grade comparison →
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

        {/* ── SECTION 2: GRADE SELECTION ───────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                02 — INTERIOR GRADE
              </p>
              <TipBtn id="grade" open={openTip} onToggle={toggleTip}>
                Grade sets material quality for flooring, kitchen, paint, and doors. Basic = ceramic tile, laminate kitchen. Standard = vitrified tile, designer laminate. Premium = full-body vitrified, acrylic/PU kitchen. Luxury = marble/large format tile, Italian or solid wood kitchen. You can see all four cost ranges in the free comparison table above.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(GRADE_META) as InteriorGrade[]).map(g => (
                <button key={g} type="button" onClick={() => setGrade(g)}
                  className="p-3 rounded-[2px] text-left transition-all"
                  style={{
                    border:     `1.5px solid ${grade === g ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: grade === g ? 'rgba(31,78,121,0.07)' : 'transparent',
                  }}>
                  <p className="text-[13px] font-medium"
                    style={{ color: grade === g ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {GRADE_META[g].label}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                    {GRADE_META[g].tile}
                  </p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: grade === g ? '#1F4E79' : 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)' }}>
                    ₹{FLOORING_RATES[g]}/sqft floor
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: FLOOR AREA ───────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                03 — FLOOR AREA (BUA PER FLOOR)
              </p>
              <TipBtn id="bua" open={openTip} onToggle={toggleTip}>
                BUA = Built-Up Area. The engine uses BUA to calculate: tile quantity (with IS 15477:2004 wastage factor {((TILE_WASTAGE_FACTOR-1)*100).toFixed(0)}%), paint litres ({PAINT_LITRES_PER_SQFT_BUA}L per sqft BUA, coverage {PAINT_COVERAGE_SQFT_PER_LITRE} sqft/litre), and false ceiling area (20% of BUA if not specified).
              </TipBtn>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input type="number" value={buaPerFloor}
                onChange={e => { setBuaPerFloor(e.target.value); setErrors(prev => ({ ...prev, buaPerFloor: '' })) }}
                placeholder="e.g. 1000"
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
                <TipBtn id="floors_i" open={openTip} onToggle={toggleTip}>
                  Total floors for interior work. All BUA × floors = total interior area. Ground + 1 upper = 2 floors. Interior quantities (tile, paint, false ceiling, doors) scale with total BUA.
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
                  Total BUA: {totalBuaPreview.toFixed(0)} sqft · With wastage: {(totalBuaPreview * TILE_WASTAGE_FACTOR).toFixed(0)} sqft (IS 15477:2004)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: BEDROOMS ─────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                04 — BEDROOMS
              </p>
              <ISBadge code="NBC 2016" />
              <TipBtn id="bedrooms_i" open={openTip} onToggle={toggleTip}>
                NBC 2016 (National Building Code): Minimum bedroom area = 9.5 sqm (≈102 sqft). Minimum width = 2.4m. Each bedroom contributes to wardrobe / door count. If your room count exceeds your BUA ÷ 102 sqft per room, check your floor area input.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NBC 2016: Min bedroom = 9.5 sqm (102 sqft). Used to estimate door count.
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

        {/* ── SECTION 5: BATHROOMS ────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                05 — BATHROOMS
              </p>
              <ISBadge code="IS 2645:2003" />
              <TipBtn id="baths_i" open={openTip} onToggle={toggleTip}>
                IS 2645:2003 (Waterproofing): Bathroom walls and floor must have 2-coat waterproof treatment up to 300mm above floor level on all walls. Failure to waterproof causes seepage damage to adjoining walls. This is a mandatory IS clause — skipping it voids structural warranty. Waterproofing cost is included in bathroom tile work estimate.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 2645:2003: Waterproofing mandatory in all wet areas. Included in tile estimate.
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

        {/* ── SECTION 6: KITCHEN ──────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                06 — KITCHEN (RUNNING FEET)
              </p>
              <TipBtn id="kitchen" open={openTip} onToggle={toggleTip}>
                Kitchen is estimated in running feet (rft) of total cabinet — upper + lower combined. A standard Indian kitchen with 3m lower + 3m upper = 20 rft. L-shaped kitchen with 4m + 2m each side = 24 rft. Includes counter/slab cost. Does not include appliances (chimney, hob, refrigerator).
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[12px] mb-2" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              Total running feet = upper + lower cabinets combined. Standard 3m kitchen ≈ 20 rft.
            </p>
            <div className="flex items-center gap-3">
              <input type="number" value={kitchenRft}
                onChange={e => setKitchenRft(e.target.value)}
                placeholder="e.g. 12"
                className="w-28 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
              />
              <span className="text-[13px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                rft
              </span>
              {kitchenRft && parseFloat(kitchenRft) > 0 && (
                <span className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  = ₹{(parseFloat(kitchenRft) * KITCHEN_RATES[grade]).toLocaleString('en-IN')} ({grade})
                </span>
              )}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="text-[10px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
                    {['Grade', 'Rate/rft'].map(h => (
                      <th key={h} className="text-left px-3 py-1 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(KITCHEN_RATES) as InteriorGrade[]).map(g => (
                    <tr key={g} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                      <td className="px-3 py-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{GRADE_META[g].label}</td>
                      <td className="px-3 py-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>₹{KITCHEN_RATES[g].toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── SECTION 7: FALSE CEILING ─────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                07 — FALSE CEILING
              </p>
              <ISBadge code="IS 277:2003" />
              <TipBtn id="falseceil" open={openTip} onToggle={toggleTip}>
                IS 277:2003: False ceiling must use MS (mild steel) frame, minimum 0.5mm thickness. The Indian standard prohibits non-galvanised frames in humid areas. False ceiling is typically installed in living room and master bedroom — about 20% of BUA. Gypsum board requires MS frame grid. POP can be on GI frame. Specify exact area if you know it.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => setFalseCeiling(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeFalseCeiling ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeFalseCeiling ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include false ceiling
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 277:2003: MS frame mandatory · {grade} grade = ₹{FALSE_CEILING_RATES[grade]}/sqft
                </p>
              </div>
            </label>
            {includeFalseCeiling && (
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-2"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  False Ceiling Area (sqft) — Leave blank for auto (20% of total BUA)
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" value={falseCeilingSqft}
                    onChange={e => setFalseCeilingSqft(e.target.value)}
                    placeholder={totalBuaPreview > 0 ? `Auto: ${(totalBuaPreview * 0.2).toFixed(0)} sqft` : 'e.g. 200'}
                    className="w-36 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                  />
                  <span className="text-[13px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>sqft</span>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 277:2003: Living room + master bedroom typically 20–25% of BUA.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 8: DOORS ────────────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                08 — DOORS
              </p>
              <ISBadge code="NBC 2016" />
              <TipBtn id="doors" open={openTip} onToggle={toggleTip}>
                NBC 2016: Minimum door height = 2.0m (6.5ft), minimum width = 0.9m (3ft) for main door, 0.8m (2.5ft) for bedroom doors. Count all internal doors including main, bedroom, bathroom, and kitchen. Include: frame + shutter + hardware. Exclude windows from door count.
              </TipBtn>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NBC 2016: Min door 2.0m × 0.9m. Count all internal doors (main + bedroom + bathroom + kitchen).
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['0','2','3','4','5','6','7','8','10'].slice(0,8).map(n => (
                <button key={n} type="button" onClick={() => setNumDoors(n)}
                  className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                  style={{
                    border:     `1.5px solid ${numDoors === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: numDoors === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                    color:      numDoors === n ? '#1F4E79' : '#1E2227',
                    fontFamily: 'var(--font-plex-mono)',
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 9: TECHNICAL SPECIFICATIONS (collapsible) ───────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button"
            onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                09 — ADVANCED SETTINGS ▼ — TECHNICAL SPECIFICATIONS
              </p>
              {!showTechSpecs && (
                <p className="text-[11px] text-left mt-0.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                  ✓ IS 15477:2004 tile wastage {((TILE_WASTAGE_FACTOR-1)*100).toFixed(0)}% · IS 2395:1994 paint {PAINT_LITRES_PER_SQFT_BUA}L/sqft · IS 277:2003 MS frame
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
                  IS code values (tile wastage, paint coverage, MS frame spec) are applied automatically and locked. Ask your tile contractor to provide IS 15477:2004 compliant material with test certificate. Waterproofing in bathrooms is IS 2645:2003 mandatory — not optional.
                </AlertBox>
              </div>

              {/* Tile wastage */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Tile Wastage Factor (IS 15477:2004 — Locked)
                  </label>
                  <ISBadge code="IS 15477:2004" />
                  <TipBtn id="wastage" open={openTip} onToggle={toggleTip}>
                    IS 15477:2004: Minimum 10% wastage must be ordered extra. This covers: cutting at walls and corners, breakage during handling, pattern alignment, replacement stock. Never order exactly your area measurement — you will run short. For diagonal tile patterns, add 15% instead of 10%. Locked at minimum 10% per IS code.
                  </TipBtn>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-[2px]"
                    style={{ border: '1px solid rgba(31,78,121,0.2)', background: 'rgba(31,78,121,0.04)' }}>
                    <p className="text-[9px] uppercase tracking-widest"
                      style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>WASTAGE FACTOR</p>
                    <p className="text-[20px] font-bold"
                      style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{((TILE_WASTAGE_FACTOR-1)*100).toFixed(0)}%</p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      IS 15477:2004 · Minimum
                    </p>
                  </div>
                  <p className="text-[12px] flex-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
                    For {totalBuaPreview.toFixed(0)} sqft area, order minimum {(totalBuaPreview * TILE_WASTAGE_FACTOR).toFixed(0)} sqft of tiles.
                  </p>
                </div>
              </div>

              {/* Paint coverage */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Paint Coverage (IS 2395:1994 — Locked)
                  </label>
                  <ISBadge code="IS 2395:1994" />
                  <TipBtn id="paint" open={openTip} onToggle={toggleTip}>
                    IS 2395:1994: Coverage = 40–50 sqft per litre per 2 coats. We use 45 sqft/litre (midpoint). 1 coat primer + 2 coats emulsion is standard. Primer quantity = 25% of emulsion. Wall area estimated at {PAINT_LITRES_PER_SQFT_BUA}L per sqft of BUA. Premium/luxury grades use 3 coats — engine adjusts automatically.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'PAINT DEMAND', value: `${PAINT_LITRES_PER_SQFT_BUA}L/sqft`, sub: 'of BUA — IS 2395' },
                    { label: 'COVERAGE',     value: `${PAINT_COVERAGE_SQFT_PER_LITRE} sqft/L`, sub: '2 coats — IS 2395' },
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
                {totalBuaPreview > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    Estimated paint: {(totalBuaPreview * PAINT_LITRES_PER_SQFT_BUA).toFixed(1)}L emulsion + {(totalBuaPreview * PAINT_LITRES_PER_SQFT_BUA * 0.25).toFixed(1)}L primer
                  </p>
                )}
              </div>

              {/* IS 277 false ceiling note */}
              <div className="p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.25)', background: 'rgba(31,78,121,0.03)' }}>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] uppercase tracking-widest"
                    style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 277:2003 — FALSE CEILING FRAME
                  </p>
                  <ISBadge code="IS 277:2003" />
                </div>
                <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                  MS frame mandatory, minimum 0.5mm thickness. GI (galvanised iron) frame required for humid areas (bathrooms, kitchens). Contractor must use IS 277:2003 certified material — ask for test certificate. Non-certified frames corrode and collapse within 3–5 years in humid climates.
                </p>
              </div>

              {/* IS 2645 waterproofing */}
              <div className="p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(217,154,6,0.3)', background: 'rgba(217,154,6,0.04)' }}>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] uppercase tracking-widest"
                    style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 2645:2003 — WATERPROOFING (BATHROOMS)
                  </p>
                  <ISBadge code="IS 2645:2003" />
                </div>
                <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                  2-coat waterproofing treatment mandatory on bathroom floors and walls up to 300mm above floor. Crystalline waterproofing (Pidilite DR-Fix, Fosroc Nitoseal) preferred over polymer coating. Must cure 48 hours before tiling. Included in tile cost estimate.
                </p>
              </div>
            </div>
          )}
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
          <div className="space-y-4">
            <div className="pt-1 space-y-2">
              <div className="pt-3 space-y-2">
                <AlertBox variant="tip">
                  India Average 2026 rates (Pune / Kajaria / Orient pricing). Tile prices vary 30–40% between Morbi (Gujarat tile belt) and remote NE India. Ask your dealer for current lot pricing before locking budget.
                </AlertBox>
                <AlertBox variant="caution">
                  IS 15477:2004: Always order 10% extra tile for wastage — engine already adds this. Kitchen/bathroom tile prices include IS 2645:2003 waterproofing cost. Rates are for supply + lay (labour included in tile rate here, separate from the Labour section below).
                </AlertBox>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  FLOORING RATES (₹/sqft supply + lay)
                </p>
                {(Object.keys(flooringRates) as InteriorGrade[]).map(g => (
                  <div key={g} className="mb-2">
                    <div className="flex items-center gap-3">
                      <label className="text-[12px] w-24" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{GRADE_META[g].label}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                        <input type="number" value={flooringRates[g]}
                          onChange={e => setFlooringRates(prev => ({ ...prev, [g]: parseFloat(e.target.value) || 0 }))}
                          className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                          style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                        />
                        <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                          /sqft · Avg: ₹{FLOORING_RATES[g]}
                        </span>
                      </div>
                    </div>
                    {INTERIOR_REGIONAL_NOTES[g] && <RegionalNote note={INTERIOR_REGIONAL_NOTES[g]} />}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  KITCHEN RATES (₹/rft upper + lower)
                </p>
                {(Object.keys(kitchenRates) as InteriorGrade[]).map(g => (
                  <div key={g} className="flex items-center gap-3 mb-2">
                    <label className="text-[12px] w-24" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{GRADE_META[g].label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                      <input type="number" value={kitchenRates[g]}
                        onChange={e => setKitchenRates(prev => ({ ...prev, [g]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                      />
                      <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                        /rft · Avg: ₹{KITCHEN_RATES[g].toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  FALSE CEILING RATES (₹/sqft — IS 277:2003 MS frame)
                </p>
                {(Object.keys(fcRates) as InteriorGrade[]).map(g => (
                  <div key={g} className="flex items-center gap-3 mb-2">
                    <label className="text-[12px] w-24" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{GRADE_META[g].label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                      <input type="number" value={fcRates[g]}
                        onChange={e => setFcRates(prev => ({ ...prev, [g]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                      />
                      <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                        /sqft · Avg: ₹{FALSE_CEILING_RATES[g]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => { setFlooringRates({ ...FLOORING_RATES }); setKitchenRates({ ...KITCHEN_RATES }); setFcRates({ ...FALSE_CEILING_RATES }) }}
                  className="text-[11px] px-3 py-1.5 rounded-[2px]"
                  style={{ border: '1px solid rgba(30,34,39,0.2)', color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-mono)', background: 'transparent' }}>
                  Reset All to India Average
                </button>
              </div>
              <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                Changing rates affects cost totals only. IS 15477:2004 wastage factor and IS 2395:1994 paint quantities are LOCKED.
              </p>
            </div>
          </div>

          {/* Contractor Quote */}
          <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              <p className="text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                11 — CONTRACTOR QUOTE (OPTIONAL)
              </p>
            </div>
            <div className="p-4">
              <p className="text-[13px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                Have an interior contractor&apos;s quote? Enter it to compare against IS-code quantities after unlocking.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[14px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input type="number" value={contractorQuote}
                  onChange={e => setContractorQuote(e.target.value)}
                  placeholder="e.g. 350000"
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
              <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour later from your contractor&apos;s quote.</p>
            </button>
          </div>

          {includeLabour && (
            <div className="space-y-4">
              <AlertBox variant="caution">
                Interior trades have strict sequencing — tile must cure 3 days before carpentry; false ceiling before paint; doors after paint; electrical fixtures last. CPWD rates: {LABOUR.tileMasonFloor.sqftPerDay} sqft/day tile mason, {LABOUR.painter.sqftPerDay} sqft/day painter. You set workers; days auto-calculate.
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

        {subStep === '3a' && (<>
        {/* ── SECTION 13: BATHROOM WALL TILING ─────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                13 — BATHROOM WALL TILING
              </p>
              <ISBadge code="IS 2645:2003" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Tiling Height (ft)
                </label>
                <input type="number" value={bathroomTilingHeightFt}
                  onChange={e => setBathTilingHt(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Default 7ft (2.1m)</p>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Tile Rate (₹/sqft) — optional
                </label>
                <input type="number" value={bathroomWallTileRate}
                  onChange={e => setBathWallRate(e.target.value)}
                  placeholder={`Auto (₹${FLOORING_RATES[grade]}/sqft for ${grade})`}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={bathroomFloorAntiSkid} onChange={() => setBathAntiSkid(v => !v)}
                className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
              />
              <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                Anti-skid floor tile for bathroom — IS 13630:2006 (coefficient of friction ≥ 0.6 for wet areas)
              </span>
            </label>
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              Ceramic 300×600mm standard for walls. IS 2645:2003: Waterproofing mandatory behind all bathroom wall tiles.
            </p>
          </div>
        </div>

        {/* ── SECTION 14: KITCHEN WALL DADO ──────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              14 — KITCHEN WALL DADO
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Dado Height (m)
                </label>
                <input type="number" value={kitchenDadoHeightM} onChange={e => setKitchenDadoHt(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>Default 0.6m (2ft)</p>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Kitchen Length (ft)
                </label>
                <input type="number" value={kitchenLengthFt} onChange={e => setKitchenLenFt(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Dado Rate (₹/sqft)
                </label>
                <input type="number" value={kitchenDadoRate} onChange={e => setKitchenDadoRate(e.target.value)}
                  placeholder={`Auto (₹${FLOORING_RATES[grade]}/sqft)`}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
            {kitchenLengthFt && parseFloat(kitchenLengthFt) > 0 && (
              <p className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                Area: {Math.round(parseFloat(kitchenLengthFt) * parseFloat(kitchenDadoHeightM) * 10.764)} sqft dado area
              </p>
            )}
          </div>
        </div>

        {/* ── SECTION 15: STAIRCASE ─────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: includeStaircase ? '1px solid rgba(30,34,39,0.12)' : 'none' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setIncludeStaircase(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeStaircase ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeStaircase ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  15 — STAIRCASE FINISHING
                </p>
                {!includeStaircase && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>Toggle to include staircase</p>}
              </div>
            </label>
          </div>
          {includeStaircase && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Flights</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1','2','3'].map(n => (
                      <button key={n} type="button" onClick={() => setStaircaseFlights(n)}
                        className="py-2 rounded-[2px] text-[13px]"
                        style={{ border: `1.5px solid ${staircaseFlights === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: staircaseFlights === n ? 'rgba(31,78,121,0.08)' : 'transparent', color: staircaseFlights === n ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Steps per Flight</label>
                  <input type="number" value={stepsPerFlight} onChange={e => setStepsPerFlight(e.target.value)}
                    className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Riser Material</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    ['granite',      'Granite',     '₹280/sqft'],
                    ['marble',       'Marble',      '₹420/sqft'],
                    ['ceramic',      'Ceramic',     '₹95/sqft'],
                    ['ms_chequered', 'MS Chequered','₹180/sqft'],
                    ['hardwood',     'Hardwood',    '₹350/sqft'],
                  ] as [StaircaseRiserMaterial, string, string][]).map(([val, label, rate]) => (
                    <button key={val} type="button" onClick={() => setRiserMaterial(val)}
                      className="p-2 rounded-[2px] text-left"
                      style={{ border: `1.5px solid ${riserMaterial === val ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: riserMaterial === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                      <p className="text-[12px]" style={{ color: riserMaterial === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Tread Material</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    ['granite',      'Granite',     '₹320/sqft'],
                    ['marble',       'Marble',      '₹480/sqft'],
                    ['ceramic',      'Ceramic',     '₹110/sqft'],
                    ['ms_chequered', 'MS Chequered','₹200/sqft'],
                    ['hardwood',     'Hardwood',    '₹400/sqft'],
                  ] as [StaircaseTreadMaterial, string, string][]).map(([val, label, rate]) => (
                    <button key={val} type="button" onClick={() => setTreadMaterial(val)}
                      className="p-2 rounded-[2px] text-left"
                      style={{ border: `1.5px solid ${treadMaterial === val ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: treadMaterial === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                      <p className="text-[12px]" style={{ color: treadMaterial === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Railing Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    ['ms_painted', 'MS Painted', '₹2,500/step'],
                    ['ss',         'SS',         '₹4,500/step'],
                    ['glass',      'Glass',      '₹6,500/step'],
                    ['wooden',     'Wooden',     '₹3,500/step'],
                  ] as [StaircaseRailingType, string, string][]).map(([val, label, rate]) => (
                    <button key={val} type="button" onClick={() => setRailingType(val)}
                      className="p-2 rounded-[2px] text-left"
                      style={{ border: `1.5px solid ${railingType === val ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`, background: railingType === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                      <p className="text-[12px]" style={{ color: railingType === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 16: BALCONY FLOORING ──────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              16 — BALCONY FLOORING
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Tile Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['antiskid_ceramic', 'Anti-Skid Ceramic', '₹65/sqft — IS 13630:2006'],
                  ['vitrified',        'Vitrified',          '₹120/sqft'],
                  ['natural_stone',    'Natural Stone',      '₹220/sqft (granite/slate)'],
                ] as [BalconyTileType, string, string][]).map(([val, label, rate]) => (
                  <button key={val} type="button" onClick={() => setBalconyTileType(val)}
                    className="p-2.5 rounded-[2px] text-left"
                    style={{ border: `1.5px solid ${balconyTileType === val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: balconyTileType === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                    <p className="text-[12px] font-medium" style={{ color: balconyTileType === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Balcony Area (sqft)
                </label>
                <input type="number" value={balconyAreaSqft} onChange={e => setBalconyAreaSqft(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Rate Override (₹/sqft)
                </label>
                <input type="number" value={balconyTileRate} onChange={e => setBalconyTileRate(e.target.value)}
                  placeholder="Leave blank for default"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 17: EXTERNAL PAINT ────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                17 — EXTERNAL PAINT
              </p>
              <ISBadge code="IS 2395:1994" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  External Wall Area (sqft)
                </label>
                <input type="number" value={externalWallAreaSqft} onChange={e => setExtWallArea(e.target.value)}
                  placeholder="From MasonryPro or manual"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Coats
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['1','2','3'].map(n => (
                    <button key={n} type="button" onClick={() => setExtPaintCoats(n)}
                      className="py-2 rounded-[2px] text-[13px]"
                      style={{ border: `1.5px solid ${externalPaintCoats === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: externalPaintCoats === n ? 'rgba(31,78,121,0.08)' : 'transparent', color: externalPaintCoats === n ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Rate (₹/sqft)
                </label>
                <input type="number" value={externalPaintRate} onChange={e => setExtPaintRate(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 2395:1994: Use exterior-grade emulsion for outside walls. Alkali-resistant primer mandatory. Minimum 2 coats exterior emulsion.
            </p>
          </div>
        </div>

        {/* ── SECTION 18: WINDOW FRAMES ─────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              18 — WINDOW FRAMES
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Frame Material</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['aluminium', 'Aluminium', '~₹8,500/win'],
                  ['upvc',      'UPVC',      '~₹12,000/win'],
                  ['wood',      'Wood',      '~₹18,000/win'],
                  ['ms',        'MS',        '~₹6,000/win'],
                ] as [WindowFrameMaterial, string, string][]).map(([val, label, rate]) => (
                  <button key={val} type="button" onClick={() => setWindowFrameMat(val)}
                    className="p-2 rounded-[2px] text-left"
                    style={{ border: `1.5px solid ${windowFrameMaterial === val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: windowFrameMaterial === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                    <p className="text-[12px]" style={{ color: windowFrameMaterial === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>No. of Windows</label>
                <input type="number" value={numWindows} onChange={e => setNumWindows(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Rate per Window (₹)</label>
                <input type="number" value={windowRatePerUnit} onChange={e => setWindowRate(e.target.value)}
                  placeholder="Auto by material"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={windowMosquitoMesh} onChange={() => setWindowMesh(v => !v)}
                    className="w-4 h-4" style={{ accentColor: '#1F4E79' }}
                  />
                  <span className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Mosquito mesh (+₹1,200/win)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 19: GRILLWORK ─────────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              19 — GRILLWORK (WINDOW SAFETY GRILLS)
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Grill Material</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['ms_painted', 'MS Painted', '~₹180/sqft — most common'],
                  ['ss',         'SS',          '~₹280/sqft — corrosion-resistant'],
                ] as [GrillMaterial, string, string][]).map(([val, label, rate]) => (
                  <button key={val} type="button" onClick={() => setGrillMaterial(val)}
                    className="p-2.5 rounded-[2px] text-left"
                    style={{ border: `1.5px solid ${grillMaterial === val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: grillMaterial === val ? 'rgba(31,78,121,0.07)' : 'transparent' }}>
                    <p className="text-[12px]" style={{ color: grillMaterial === val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{rate}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Windows with Grills</label>
                <input type="number" value={numGrillWindows} onChange={e => setNumGrillWindows(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Area/Window (sqft)</label>
                <input type="number" value={grillAreaPerWindow} onChange={e => setGrillAreaPerWindow(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>Rate (₹/sqft)</label>
                <input type="number" value={grillRatePerSqft} onChange={e => setGrillRate(e.target.value)}
                  placeholder={grillMaterial === 'ms_painted' ? '180' : '280'}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
              </div>
            </div>
          </div>
        </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => { if (validate3a()) setSubStep('3b') }}
              className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
              style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
              Continue to Material Rates →
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}

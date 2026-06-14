'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  seismicZoneFromState,
  exposureFromSiteCondition,
  foundationFromSiteCondition,
  type SiteCondition,
  type ConcreteGrade,
  type SteelGrade,
  type ExposureClass,
  type StructoInput,
} from '../structopro-engine'

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

type AreaUnit = 'sqft' | 'sqm' | 'sqyard'
const UNIT_TO_SQFT: Record<AreaUnit, number> = { sqft: 1, sqm: 10.764, sqyard: 9 }

type UseType = 'Residential' | 'Commercial' | 'Parking'
interface FloorRow {
  label: string
  length: string
  width: string
  height: string
  useType: UseType
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
  id: string
  name: string
  workers: string
  ratePerDay: string
  days: string
}

const INDIA_AVG_RATES = {
  cement: 410, steel: 66, sand: 28, aggregate: 45, formwork: 12, antiTermite: 18,
}

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1',  name: 'Bar Bender (Sariya Mistri)',  workers: 2, ratePerDay: 950,  indiaAvgRate: 950,  basisText: '600 kg steel/day',         active: true,  daysManual: '' },
  { id: 't2',  name: 'Shuttering Carpenter',        workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  basisText: '100 sqft formwork/day',     active: true,  daysManual: '' },
  { id: 't3',  name: 'Concreting Mason (RCC)',       workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  basisText: '2.5 m³ concrete/day',       active: true,  daysManual: '' },
  { id: 't4',  name: 'Vibrator Operator',            workers: 1, ratePerDay: 800,  indiaAvgRate: 800,  basisText: 'Per pour',                   active: true,  daysManual: '' },
  { id: 't5',  name: 'Excavation Mason',             workers: 1, ratePerDay: 750,  indiaAvgRate: 750,  basisText: 'Volume/day',                 active: true,  daysManual: '' },
  { id: 't6',  name: 'Rock Cutting Crew',            workers: 0, ratePerDay: 3000, indiaAvgRate: 3000, basisText: 'Manual',                     active: false, daysManual: '' },
  { id: 't7',  name: 'Crane / Hoist Operator',       workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, basisText: 'Per day',                    active: true,  daysManual: '' },
  { id: 't8',  name: 'Concrete Pump Operator',       workers: 0, ratePerDay: 1100, indiaAvgRate: 1100, basisText: 'Per day',                    active: false, daysManual: '' },
  { id: 't9',  name: 'General Helper / Beldar',      workers: 4, ratePerDay: 580,  indiaAvgRate: 580,  basisText: 'Ratio to masons',            active: true,  daysManual: '' },
  { id: 't10', name: 'Curing / Water Man',           workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',                    active: true,  daysManual: '' },
  { id: 't11', name: 'Night Watchman',               workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  basisText: 'Per day',                    active: true,  daysManual: '' },
  { id: 't12', name: 'Junior Site Engineer',         workers: 1, ratePerDay: 1500, indiaAvgRate: 1500, basisText: 'Per day',                    active: true,  daysManual: '' },
  { id: 't13', name: 'Site Foreman',                 workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',                    active: true,  daysManual: '' },
  { id: 't14', name: 'Safety Officer',               workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, basisText: 'Per day',                    active: true,  daysManual: '' },
]

type SiteCard = { value: SiteCondition; label: string; icon: string; note: string }
const SITE_CARDS: SiteCard[] = [
  { value: 'flat',         label: 'Flat',              icon: '▬',  note: 'Ideal condition' },
  { value: 'sloped_mild',  label: 'Sloped — Mild',     icon: '↗',  note: '1:5 gradient' },
  { value: 'sloped_steep', label: 'Sloped — Steep',    icon: '↗↗', note: '1:3 or steeper' },
  { value: 'rocky',        label: 'Rocky Ground',      icon: '◈',  note: 'Hard rock visible' },
  { value: 'bcs',          label: 'Black Cotton Soil', icon: '◉',  note: 'Expansive clay' },
  { value: 'soft_marshy',  label: 'Soft / Marshy',     icon: '≋',  note: 'Low bearing capacity' },
  { value: 'waterlogged',  label: 'Waterlogged',       icon: '~',  note: 'High water table' },
  { value: 'coastal',      label: 'Coastal',           icon: '◌',  note: 'Within 1km of sea' },
]

function makeFloorRow(idx: number): FloorRow {
  const labels = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor']
  return { label: labels[idx] ?? `Floor ${idx + 1}`, length: '', width: '', height: '10', useType: 'Residential' }
}

function autoFoundationDepth(cond: SiteCondition): number {
  if (cond === 'rocky') return 500
  if (cond === 'bcs' || cond === 'soft_marshy' || cond === 'waterlogged') return 1500
  if (cond === 'coastal') return 1200
  return 900
}

function exposureMinGrade(exp: ExposureClass): string {
  const map: Record<ExposureClass, string> = {
    mild: 'M20', moderate: 'M25', severe: 'M30', very_severe: 'M35', extreme: 'M40',
  }
  return map[exp]
}

function exposureDisplayLabel(exp: ExposureClass): string {
  const map: Record<ExposureClass, string> = {
    mild: 'Mild', moderate: 'Moderate', severe: 'Severe',
    very_severe: 'Very Severe', extreme: 'Extreme',
  }
  return map[exp]
}

function columnMinByFloors(n: number): string {
  if (n === 0) return '230×230mm'
  if (n === 1) return '300×300mm'
  if (n === 2) return '350×350mm'
  return '400×400mm'
}

// ─── ⓘ Tip Button ────────────────────────────────────────────────────────────

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

// ─── Step Bar ────────────────────────────────────────────────────────────────

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
  state: string
  city: string
  onSubmit: (input: StructoInput) => void
}

export default function BuildDetails({ state, city, onSubmit }: Props) {
  // S1 — Project Details
  const [projectName, setProjectName]   = useState('')
  const [numFloors, setNumFloors]       = useState(1)
  const [area, setArea]                 = useState('')
  const [areaUnit, setAreaUnit]         = useState<AreaUnit>('sqft')
  const [floorRows, setFloorRows]       = useState<FloorRow[]>(() => [makeFloorRow(0), makeFloorRow(1)])
  const [localState, setLocalState]     = useState(state)
  const [localCity, setLocalCity]       = useState(city)
  const [scope, setScope]               = useState({ staircase: false, ohtSlab: false, parapet: false, parkingSlab: false })

  // S2 — Site Conditions
  const [siteCondition, setSite]        = useState<SiteCondition | null>(null)
  const [foundationOverride, setFndOverride] = useState('')

  // S3 — Technical Specs (open by default)
  const [showTechSpecs, setShowTechSpecs] = useState(true)
  const [concreteGrade, setConcrete]    = useState<ConcreteGrade>('M20')
  const [steelGrade, setSteel]          = useState<SteelGrade>('Fe500D')
  const [exposureClass, setExposure]    = useState<ExposureClass>('mild')
  const [columnSize, setColumnSize]     = useState('300×300mm')
  const [slabThickness, setSlabThickness] = useState(125)
  const [foundationDepth, setFndDepth]  = useState(900)

  // S4 — Material Rates (collapsed)
  const [showRates, setShowRates]       = useState(false)
  const [rates, setRates]               = useState({ ...INDIA_AVG_RATES })

  // S5 — Contractor Quote
  const [contractorName, setCtName]     = useState('')
  const [contractorTotal, setCtTotal]   = useState('')
  const [ctConcreteRate, setCtConcrete] = useState('')
  const [ctSteelRate, setCtSteel]       = useState('')
  const [ctFormworkRate, setCtFormwork] = useState('')

  // S6 — Labour
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]             = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades] = useState<CustomTrade[]>([])

  const [openTip, setOpenTip]           = useState<string | null>(null)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(localState)

  // Sync floor rows when numFloors changes
  useEffect(() => {
    const count = numFloors + 1
    setFloorRows(prev => {
      if (prev.length === count) return prev
      if (prev.length < count) {
        return [...prev, ...Array.from({ length: count - prev.length }, (_, i) => makeFloorRow(prev.length + i))]
      }
      return prev.slice(0, count)
    })
  }, [numFloors])

  // Auto-set steel from seismic zone
  useEffect(() => {
    const { zone } = seismicZoneFromState(localState)
    setSteel(zone === 'III' || zone === 'IV' || zone === 'V' ? 'Fe500D' : 'Fe500')
  }, [localState])

  // Auto-set concrete + exposure from site condition
  useEffect(() => {
    if (!siteCondition) return
    const exp = exposureFromSiteCondition(siteCondition)
    setExposure(exp)
    const minGrades: Record<string, ConcreteGrade> = {
      mild: 'M20', moderate: 'M25', severe: 'M30', very_severe: 'M35', extreme: 'M40',
    }
    setConcrete(prev => {
      const required = minGrades[exp] ?? 'M20'
      return parseInt(required.replace('M', '')) > parseInt(prev.replace('M', '')) ? required : prev
    })
    setFndDepth(autoFoundationDepth(siteCondition))
    setColumnSize(columnMinByFloors(numFloors))
  }, [siteCondition, numFloors])

  const foundation = siteCondition ? foundationFromSiteCondition(siteCondition, numFloors) : null
  const areaSqft   = area ? parseFloat(area) * UNIT_TO_SQFT[areaUnit] : 0

  function toggleTip(id: string) {
    setOpenTip(prev => prev === id ? null : id)
  }

  function updateFloorRow(idx: number, key: keyof FloorRow, val: string) {
    setFloorRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }

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
    if (!area || parseFloat(area) <= 0)  e.area = 'Enter a valid area'
    if (!siteCondition)                  e.site = 'Select a site condition'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !siteCondition) return
    onSubmit({
      state:                localState,
      city:                 localCity,
      numFloors,
      groundFloorAreaSqft:  Math.round(areaSqft),
      siteCondition,
      concreteGrade,
      steelGrade,
      seismicZoneOverride:  undefined,
      projectName,
      contractorQuote:      contractorTotal ? parseFloat(contractorTotal) : undefined,
      contractorName:       contractorName || undefined,
      contractorConcreteRate: ctConcreteRate ? parseFloat(ctConcreteRate) : undefined,
      contractorSteelRate:  ctSteelRate ? parseFloat(ctSteelRate) : undefined,
      contractorFormworkRate: ctFormworkRate ? parseFloat(ctFormworkRate) : undefined,
      includeLabour,
      columnSize,
      slabThickness,
      foundationDepth,
    })
  }

  // Cover requirements auto from exposure
  const covers = {
    footing: 50,
    column:  40,
    beam:    exposureClass === 'mild' ? 25 : 40,
    slab:    exposureClass === 'mild' ? 20 : 30,
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">

      {/* Page header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · STRUCTOPRO
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

            {/* Project name */}
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

            {/* Number of floors */}
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
                      border:     `1px solid ${numFloors === n ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                      background: numFloors === n ? '#1F4E79' : 'transparent',
                      color:      numFloors === n ? '#fff' : '#1E2227',
                      fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                    }}>
                    {n === 0 ? 'G' : `G+${n}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Ground floor area */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Ground Floor Area
              </label>
              <div className="flex gap-2">
                <input type="number" value={area}
                  onChange={e => { setArea(e.target.value); setErrors(prev => ({ ...prev, area: '' })) }}
                  placeholder="e.g. 1200"
                  className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.area ? '#8C3A22' : 'rgba(30,34,39,0.4)', color: '#1E2227' }}
                />
                <select value={areaUnit} onChange={e => setAreaUnit(e.target.value as AreaUnit)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)', color: '#1E2227' }}>
                  <option value="sqft">sqft</option>
                  <option value="sqm">sqm</option>
                  <option value="sqyard">sq yard</option>
                </select>
              </div>
              {errors.area && <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.area}</p>}
              {areaSqft > 0 && (
                <p className="text-[12px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  Total BUA: {Math.round(areaSqft * (numFloors + 1)).toLocaleString('en-IN')} sqft across {numFloors + 1} floor{numFloors > 0 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Per-floor table */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Per-Floor Details (optional — for detailed report)
              </label>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      {['Floor', 'Length (ft)', 'Width (ft)', 'Area (sqft)', 'Height (ft)', 'Use Type'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {floorRows.map((row, idx) => {
                      const calcArea = row.length && row.width
                        ? Math.round(parseFloat(row.length) * parseFloat(row.width))
                        : '—'
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                          <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)', whiteSpace: 'nowrap' }}>{row.label}</td>
                          {(['length', 'width'] as const).map(key => (
                            <td key={key} className="py-1 px-1">
                              <input type="number" value={row[key]}
                                onChange={e => updateFloorRow(idx, key, e.target.value)}
                                placeholder="—"
                                className="w-20 border rounded px-2 py-1 text-[12px] bg-sheet-white outline-none"
                                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                              />
                            </td>
                          ))}
                          <td className="py-1.5 px-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{calcArea}</td>
                          <td className="py-1 px-1">
                            <input type="number" value={row.height}
                              onChange={e => updateFloorRow(idx, 'height', e.target.value)}
                              className="w-16 border rounded px-2 py-1 text-[12px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                            />
                          </td>
                          <td className="py-1 px-1">
                            <select value={row.useType}
                              onChange={e => updateFloorRow(idx, 'useType', e.target.value)}
                              className="border rounded px-2 py-1 text-[11px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}>
                              <option>Residential</option>
                              <option>Commercial</option>
                              <option>Parking</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plot location */}
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

            {/* Scope checkboxes */}
            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-2"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Scope — What to Include
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  ['staircase', 'Include staircase structure'],
                  ['ohtSlab', 'Include overhead water tank slab'],
                  ['parapet', 'Include parapet walls'],
                  ['parkingSlab', 'Include car parking slab'],
                ] as [keyof typeof scope, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={scope[key]}
                      onChange={() => setScope(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#1F4E79' }}
                    />
                    <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SITE CONDITIONS ──────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — SITE CONDITIONS
            </p>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-[14px]" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What best describes your plot&apos;s ground condition?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SITE_CARDS.map(card => (
                <button key={card.value} type="button"
                  onClick={() => { setSite(card.value); setErrors(prev => ({ ...prev, site: '' })) }}
                  className="text-left p-3 rounded-[2px] transition-all"
                  style={{
                    border:     `1.5px solid ${siteCondition === card.value ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: siteCondition === card.value ? 'rgba(31,78,121,0.06)' : 'transparent',
                  }}>
                  <div className="text-[18px] mb-1"
                    style={{ fontFamily: 'var(--font-plex-mono)', color: siteCondition === card.value ? '#1F4E79' : 'rgba(30,34,39,0.4)' }}>
                    {card.icon}
                  </div>
                  <p className="text-[12px] font-medium leading-tight mb-0.5"
                    style={{ color: siteCondition === card.value ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {card.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    {card.note}
                  </p>
                </button>
              ))}
            </div>
            {errors.site && <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.site}</p>}

            {foundation && (
              <div className="p-3 rounded-[2px]"
                style={{ border: foundation.warning ? '1px solid rgba(217,154,6,0.5)' : '1px solid rgba(31,78,121,0.3)', background: foundation.warning ? 'rgba(217,154,6,0.05)' : 'rgba(31,78,121,0.04)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: foundation.warning ? '#D99A06' : '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  RECOMMENDED: {foundation.label}
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  {foundation.isCode} · ₹{foundation.minCostPerSqft}–{foundation.maxCostPerSqft}/sqft GFA
                </p>
                {foundation.warning && (
                  <div className="mt-2 flex gap-2" style={{ borderTop: '1px solid rgba(217,154,6,0.2)', paddingTop: 8 }}>
                    <span style={{ color: '#D99A06' }}>⚠</span>
                    <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{foundation.warning}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-widest block mb-1"
                style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                Foundation Type Override (if you want to change)
              </label>
              <select value={foundationOverride} onChange={e => setFndOverride(e.target.value)}
                className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}>
                <option value="">Use recommended</option>
                <option>Isolated Footing</option>
                <option>Strip Footing</option>
                <option>Raft / Mat Foundation</option>
                <option>Under-Reamed Pile (IS 2911:2010)</option>
                <option>Pile Foundation (IS 2911:2010)</option>
                <option>Rock-Cut Footing</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: TECHNICAL SPECIFICATIONS ────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <button type="button"
            onClick={() => setShowTechSpecs(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — TECHNICAL SPECIFICATIONS
            </p>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showTechSpecs ? '▲' : '▼'}
            </span>
          </button>

          {showTechSpecs && (
            <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <p className="text-[11px] pt-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                All values are auto-set per IS codes. Click <strong>i</strong> for plain English explanation.
              </p>

              {/* Concrete grade */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Concrete Grade
                  </label>
                  <ISBadge code="IS 456:2000" />
                  <TipBtn id="concrete" open={openTip} onToggle={toggleTip}>
                    M20 = 1:1.5:3 mix, 8.07 bags/m³. Minimum for mild exposure per IS 456:2000 Table 5. M25 = 1:1:2, 11 bags/m³ — mandatory for moderate/coastal areas. Higher grade = more cement = stronger but costlier concrete.
                  </TipBtn>
                </div>
                <select value={concreteGrade} onChange={e => setConcrete(e.target.value as ConcreteGrade)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)', color: '#1E2227' }}>
                  <option value="M20">M20 — 1:1.5:3 mix · Mild exposure minimum</option>
                  <option value="M25">M25 — 1:1:2 mix · Moderate/BCS/slope minimum</option>
                  <option value="M30">M30 — Design mix · Severe/marshy minimum</option>
                  <option value="M35">M35 — Design mix · Very severe minimum</option>
                  <option value="M40">M40 — Design mix · Extreme/coastal minimum</option>
                </select>
                {siteCondition && (
                  <p className="text-[10px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 456:2000 minimum for your exposure class: {exposureMinGrade(exposureClass)}
                  </p>
                )}
              </div>

              {/* Steel grade */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Steel Grade
                  </label>
                  <ISBadge code="IS 1786:2008" />
                  <TipBtn id="steel" open={openTip} onToggle={toggleTip}>
                    Fe500D has higher ductility (16% elongation vs 12%) — mandatory for Seismic Zones III-V per IS 13920:2016. In Zone II, Fe500 is sufficient. Never use Fe415 for new construction — old standard, lower ductility.
                  </TipBtn>
                </div>
                <select value={steelGrade} onChange={e => setSteel(e.target.value as SteelGrade)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)', color: '#1E2227' }}>
                  <option value="Fe415">Fe415 — Old standard, not recommended</option>
                  <option value="Fe500">Fe500 — Standard residential Zone II</option>
                  <option value="Fe500D">Fe500D — Mandatory Zones III–V (IS 13920)</option>
                  <option value="Fe550D">Fe550D — High-rise seismic</option>
                </select>
                <p className="text-[10px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 13920:2016 recommends Fe500D for Zone {szInfo.zone}
                </p>
              </div>

              {/* Exposure class */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Exposure Class
                  </label>
                  <ISBadge code="IS 456:2000 Table 5" />
                  <TipBtn id="exposure" open={openTip} onToggle={toggleTip}>
                    Mild = protected from weather (indoor columns). Moderate = normal outdoor exposure. Severe = coastal within 50km / industrial. Very Severe = aggressive chemical environment. Extreme = tidal zones, chemical plants. Exposure class sets minimum concrete grade and cover requirements.
                  </TipBtn>
                </div>
                <select value={exposureClass} onChange={e => setExposure(e.target.value as ExposureClass)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)', color: '#1E2227' }}>
                  <option value="mild">Mild — Indoor / protected</option>
                  <option value="moderate">Moderate — Normal outdoor, no direct rain</option>
                  <option value="severe">Severe — Coastal / industrial areas</option>
                  <option value="very_severe">Very Severe — Aggressive environment</option>
                  <option value="extreme">Extreme — Tidal / chemical zones</option>
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  Auto-set from site condition · Minimum grade: {exposureMinGrade(exposureClass)}
                </p>
              </div>

              {/* Column size */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Column Size
                  </label>
                  <ISBadge code="IS 456:2000" />
                  <TipBtn id="column" open={openTip} onToggle={toggleTip}>
                    Column size determines how many floors the structure can safely support. A 230×230mm column is minimum for G+0. For G+1 use 300×300mm. For G+2 use 350×350mm. For G+3 and above, use 400×400mm or consult a structural engineer for custom sizes.
                  </TipBtn>
                </div>
                <select value={columnSize} onChange={e => setColumnSize(e.target.value)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)', color: '#1E2227' }}>
                  <option>230×230mm</option>
                  <option>300×300mm</option>
                  <option>350×350mm</option>
                  <option>400×400mm</option>
                  <option>Custom</option>
                </select>
                <p className="text-[10px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 456:2000: minimum {columnMinByFloors(numFloors)} for {numFloors === 0 ? 'G+0' : `G+${numFloors}`}
                </p>
              </div>

              {/* Slab thickness */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Slab Thickness
                  </label>
                  <ISBadge code="IS 456:2000" />
                  <TipBtn id="slab" open={openTip} onToggle={toggleTip}>
                    Standard RCC slab thickness. 125mm for spans up to 4m per IS 456:2000 span/depth ratios (L/d ≥ 20 for two-way slab). For spans above 4m, increase to 150mm. Thicker slab = more concrete and steel, better sound insulation.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 125, 150, 175].map(t => (
                    <button key={t} type="button" onClick={() => setSlabThickness(t)}
                      className="py-2 rounded-[2px] text-center transition-all"
                      style={{
                        border:     `1.5px solid ${slabThickness === t ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                        background: slabThickness === t ? 'rgba(31,78,121,0.08)' : 'transparent',
                        color:      slabThickness === t ? '#1F4E79' : '#1E2227',
                        fontFamily: 'var(--font-plex-mono)', fontSize: 13,
                      }}>
                      {t}mm
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  Default 125mm · IS 456:2000 Table 22 span/depth ratios
                </p>
              </div>

              {/* Foundation depth */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Foundation Depth (mm)
                  </label>
                  <ISBadge code="IS 1904:2016" />
                  <TipBtn id="fndepth" open={openTip} onToggle={toggleTip}>
                    Minimum 500mm below natural ground level per IS 1904:2016. Typical residential foundations go 900–1200mm. Black Cotton Soil needs 1500mm minimum. Rocky soil can be 500mm. Deeper foundation = more excavation cost but better stability.
                  </TipBtn>
                </div>
                <input type="number" value={foundationDepth} onChange={e => setFndDepth(parseInt(e.target.value) || 900)}
                  className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)', color: '#1E2227' }}
                />
                <p className="text-[10px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1904:2016 minimum: 500mm · Auto-set from soil type
                </p>
              </div>

              {/* Cover requirements — read-only */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Cover Requirements (auto from exposure class — read-only)
                  </label>
                  <ISBadge code="IS 456 Cl 26.4" />
                  <TipBtn id="cover" open={openTip} onToggle={toggleTip}>
                    Concrete cover protects steel from corrosion. IS 456:2000 Cl 26.4.2.2: Footing always 50mm. Column minimum 40mm. Beam minimum 25mm for mild, 40mm for moderate and above. Slab minimum 20mm for mild, 30mm for moderate and above.
                  </TipBtn>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([['Footing', covers.footing], ['Column', covers.column], ['Beam', covers.beam], ['Slab', covers.slab]] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="px-3 py-2 rounded-[2px] text-center"
                      style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.02)' }}>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>{label}</p>
                      <p className="text-[16px] font-bold mt-0.5" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{val}mm</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 456:2000 Cl 26.4.2.2 · Exposure class: {exposureDisplayLabel(exposureClass)}
                </p>
              </div>

              {/* Seismic zone */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[11px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Seismic Zone
                  </label>
                  <ISBadge code="IS 1893:2016" />
                  <TipBtn id="seismic" open={openTip} onToggle={toggleTip}>
                    Your state falls in Zone {szInfo.zone} (Z-factor {szInfo.zFactor}) per IS 1893:2016. This affects steel grade requirements (Fe500D mandatory for Zone III–V) and tie spacing at column hinge zones (max 100mm). Higher zone = stricter requirements.
                  </TipBtn>
                </div>
                <div className="px-3 py-2 rounded-[6px] text-[13px]"
                  style={{ border: '1px solid rgba(30,34,39,0.2)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}>
                  Zone {szInfo.zone} · Z-Factor {szInfo.zFactor} · Auto-determined from {localState}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 1893:2016 — your state: Zone {szInfo.zone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: MATERIAL RATES ───────────────────────────────────────── */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <button type="button"
            onClick={() => setShowRates(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-left"
                style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                04 — MATERIAL RATES
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
              <p className="text-[12px] pt-3" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
                Material Rates — India Average 2026 (edit if you have local quotes)
              </p>
              {([
                ['cement',      'Cement (OPC 43/53 grade)', '₹/bag', 410],
                ['steel',       'Steel TMT Fe500',          '₹/kg',  66],
                ['sand',        'River Sand / M-Sand',      '₹/cft', 28],
                ['aggregate',   'Aggregate 20mm',           '₹/cft', 45],
                ['formwork',    'Formwork (timber)',        '₹/sqft',12],
                ['antiTermite', 'Anti-termite treatment',  '₹/sqft',18],
              ] as [keyof typeof rates, string, string, number][]).map(([key, label, unit, avg]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-[12px] flex-1"
                    style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input type="number" value={rates[key]}
                      onChange={e => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 border rounded-[6px] px-2 py-1.5 text-[13px] bg-sheet-white outline-none"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                    />
                    <span className="text-[10px] whitespace-nowrap"
                      style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                      {unit} · India Avg: ₹{avg}
                    </span>
                  </div>
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
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Contractor Name (optional)
                </label>
                <input type="text" value={contractorName} onChange={e => setCtName(e.target.value)}
                  placeholder="e.g. Ramesh Constructions"
                  className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                  style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-widest block mb-1"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Total Quoted Amount (₹)
                </label>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>₹</span>
                  <input type="number" value={contractorTotal} onChange={e => setCtTotal(e.target.value)}
                    placeholder="e.g. 1500000"
                    className="flex-1 border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              Itemwise (optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                ['ctConcreteRate', 'Concrete rate (₹/m³)', ctConcreteRate, setCtConcrete],
                ['ctSteelRate',    'Steel rate (₹/kg)',     ctSteelRate,    setCtSteel],
                ['ctFormworkRate', 'Formwork rate (₹/sqft)', ctFormworkRate, setCtFormwork],
              ] as [string, string, string, (v: string) => void][]).map(([key, label, val, setter]) => (
                <div key={key}>
                  <label className="text-[11px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    {label}
                  </label>
                  <input type="number" value={val} onChange={e => setter(e.target.value)}
                    placeholder="—"
                    className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227' }}
                  />
                </div>
              ))}
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
                  06 — INCLUDE LABOUR COST IN ESTIMATE
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                  Add CPWD-based labour cost to your total
                </p>
              </div>
            </label>
          </div>

          {includeLabour && (
            <div className="p-4 space-y-4">
              {/* CPWD warning */}
              <div className="p-3 rounded-[2px]"
                style={{ background: 'rgba(217,154,6,0.12)', border: '1px solid rgba(217,154,6,0.4)' }}>
                <div className="flex gap-2">
                  <span style={{ color: '#D99A06' }}>⚠</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-1"
                      style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                      WHY WE CANNOT AUTO-CALCULATE WORKING DAYS
                    </p>
                    <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}>
                      Curing intervals, monsoon shutdowns, festival breaks, sand bans, local political situations —
                      no software can predict these. CPWD productivity rates calculate man-days of work required.
                      You set workers; days calculate automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trades table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse', minWidth: 580 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      {['Trade', 'Workers', 'Rate/day ₹', 'India Avg', 'CPWD Basis', 'Days'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[9px] uppercase tracking-widest"
                          style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id}
                        style={{
                          borderBottom: '1px solid rgba(30,34,39,0.06)',
                          opacity: trade.active ? 1 : 0.35,
                          background: trade.active ? 'transparent' : 'rgba(30,34,39,0.02)',
                        }}>
                        <td className="py-1.5 px-2" style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', whiteSpace: 'nowrap' }}>
                          {trade.name}
                        </td>
                        <td className="py-1 px-2">
                          <div className="flex items-center gap-1">
                            <button type="button"
                              onClick={() => updateTrade(trade.id, 'active', !trade.active)}
                              className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center"
                              style={{ border: '1px solid rgba(30,34,39,0.2)', background: trade.active ? 'rgba(140,58,34,0.1)' : 'rgba(20,83,45,0.1)', color: trade.active ? '#8C3A22' : '#14532D' }}>
                              {trade.active ? '−' : '+'}
                            </button>
                            <input type="number" value={trade.workers}
                              disabled={!trade.active}
                              onChange={e => updateTrade(trade.id, 'workers', parseInt(e.target.value) || 0)}
                              className="w-10 border rounded px-1 py-0.5 text-center text-[11px] bg-sheet-white outline-none"
                              style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                            />
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={trade.ratePerDay}
                            disabled={!trade.active}
                            onChange={e => updateTrade(trade.id, 'ratePerDay', parseInt(e.target.value) || 0)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                          ₹{trade.indiaAvgRate}
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
                          {trade.basisText}
                        </td>
                        <td className="py-1 px-2" style={{ color: 'rgba(30,34,39,0.35)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>
                          auto
                        </td>
                      </tr>
                    ))}
                    {customTrades.map(ct => (
                      <tr key={ct.id} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)' }}>
                        <td className="py-1 px-2">
                          <input type="text" value={ct.name}
                            onChange={e => updateCustomTrade(ct.id, 'name', e.target.value)}
                            placeholder="Trade name"
                            className="w-36 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-sans)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.workers}
                            onChange={e => updateCustomTrade(ct.id, 'workers', e.target.value)}
                            className="w-10 border rounded px-1 py-0.5 text-center text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.ratePerDay}
                            onChange={e => updateCustomTrade(ct.id, 'ratePerDay', e.target.value)}
                            className="w-20 border rounded px-1 py-0.5 text-[11px] bg-sheet-white outline-none"
                            style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.2)', color: '#1E2227' }}
                          />
                        </td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>—</td>
                        <td className="py-1.5 px-2" style={{ color: 'rgba(30,34,39,0.3)', fontFamily: 'var(--font-plex-mono)', fontSize: 10 }}>Custom</td>
                        <td className="py-1 px-2">
                          <input type="number" value={ct.days}
                            onChange={e => updateCustomTrade(ct.id, 'days', e.target.value)}
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
          Calculate My Structure Cost →
        </button>
      </div>
    </div>
  )
}

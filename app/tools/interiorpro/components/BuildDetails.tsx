'use client'

import { useState } from 'react'
import {
  calcGradeComparison,
  seismicZoneFromState,
  formatLakhs,
  FLOORING_RATES,
  KITCHEN_RATES,
  FALSE_CEILING_RATES,
  type InteriorInput,
  type InteriorGrade,
} from '../interiorpro-engine'

interface Props {
  state:    string
  city:     string
  onSubmit: (input: InteriorInput) => void
}

type AreaUnit = 'sqft' | 'sqm'
const SQFT_PER_SQM = 10.764

const GRADE_LABELS: Record<InteriorGrade, string> = {
  basic:    'Basic',
  standard: 'Standard',
  premium:  'Premium',
  luxury:   'Luxury',
}

const GRADE_DESCRIPTIONS: Record<InteriorGrade, string> = {
  basic:    'Minimum spec. Local market materials. Economy emulsion, basic tiles.',
  standard: 'Mid-range. Vitrified flooring, modular kitchen, standard emulsion, PVC doors.',
  premium:  'Premium vitrified / natural stone, semi-modular kitchen, washable emulsion, wood doors.',
  luxury:   'Marble / hardwood, bespoke kitchen, luxury paint, solid wood doors, false ceiling throughout.',
}

const GRADES: InteriorGrade[] = ['basic', 'standard', 'premium', 'luxury']

export default function BuildDetails({ state, city, onSubmit }: Props) {
  const [buaPerFloor, setBuaPerFloor]   = useState('')
  const [buaUnit, setBuaUnit]           = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]       = useState('1')
  const [grade, setGrade]               = useState<InteriorGrade>('standard')
  const [numBedrooms, setNumBedrooms]   = useState('2')
  const [numBathrooms, setNumBathrooms] = useState('2')
  const [kitchenRft, setKitchenRft]     = useState('10')
  const [includeFalseCeiling, setIncludeFalseCeiling] = useState(false)
  const [falseCeilingSqft, setFalseCeilingSqft] = useState('')
  const [numDoors, setNumDoors]         = useState('6')
  const [contractorQuote, setContractorQuote] = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(state)

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview  = toBuaSqft(buaPerFloor, buaUnit)
  const totalBuaPreview = buaSqftPreview * (parseInt(numFloors) || 1)

  // Live grade comparison (FREE — all 4 grades, updates live)
  const liveInput: InteriorInput = {
    state, city,
    method:              'quick',
    grade,
    numFloors:           parseInt(numFloors) || 1,
    buaPerFloorSqft:     Math.round(buaSqftPreview) || 500,
    numBedrooms:         parseInt(numBedrooms) || 2,
    numBathrooms:        parseInt(numBathrooms) || 2,
    kitchenRft:          parseFloat(kitchenRft) || 10,
    includeFalseCeiling,
    falseCeilingSqft:    parseFloat(falseCeilingSqft) || 0,
    numDoors:            parseInt(numDoors) || 6,
  }
  const gradeComparison = calcGradeComparison(liveInput)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!buaPerFloor || parseFloat(buaPerFloor) <= 0) e.buaPerFloor = 'Enter floor area'
    if (!kitchenRft || parseFloat(kitchenRft) <= 0) e.kitchenRft = 'Enter kitchen running feet'
    if (includeFalseCeiling && (!falseCeilingSqft || parseFloat(falseCeilingSqft) <= 0)) {
      e.falseCeilingSqft = 'Enter false ceiling area'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      state, city,
      method:              'quick',
      grade,
      numFloors:           Math.max(1, parseInt(numFloors) || 1),
      buaPerFloorSqft:     Math.round(toBuaSqft(buaPerFloor, buaUnit)),
      numBedrooms:         Math.max(1, parseInt(numBedrooms) || 2),
      numBathrooms:        Math.max(1, parseInt(numBathrooms) || 2),
      kitchenRft:          Math.max(1, parseFloat(kitchenRft) || 10),
      includeFalseCeiling,
      falseCeilingSqft:    includeFalseCeiling ? (parseFloat(falseCeilingSqft) || 0) : 0,
      numDoors:            Math.max(1, parseInt(numDoors) || 6),
      contractorQuote:     contractorQuote ? parseFloat(contractorQuote) : undefined,
    })
  }

  const selectedGradeData = gradeComparison.find(g => g.grade === grade)

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
      {/* Header + step bar */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · INTERIORPRO
            </p>
            <h1 className="text-[22px] font-bold"
              style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}>
              Build Details
            </h1>
          </div>
          <div className="flex items-center">
            {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((s, i) => (
              <div key={s} className="flex items-center">
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
                    {s}
                  </span>
                </div>
                {i < 3 && <div className="w-5 h-px mx-1.5" style={{ background: 'rgba(30,34,39,0.14)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Location badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)' }}>
          <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>
            📍 {city}, {state}
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px]"
            style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
            SEISMIC ZONE {szInfo.zone}
          </span>
        </div>

        {/* GRADE COMPARISON TABLE — FREE, ALWAYS VISIBLE, UPDATES LIVE */}
        <div className="border rounded-[2px]"
          style={{ borderColor: 'rgba(31,78,121,0.35)', background: 'rgba(31,78,121,0.02)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              ✦ GRADE COMPARISON — ALL 4 TIERS (FREE, UPDATES LIVE)
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              Interior grade affects your total project cost more than any other phase. Basic 1.0× → Luxury 3.5×
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
                  <th className="text-left py-2 px-3 text-[9px] uppercase tracking-widest"
                    style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)', width: 120 }}>
                    Item
                  </th>
                  {GRADES.map(g => (
                    <th key={g} className="text-right py-2 px-3 text-[9px] uppercase tracking-widest"
                      style={{
                        color:      g === grade ? '#1F4E79' : 'rgba(30,34,39,0.45)',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g === grade ? 'rgba(31,78,121,0.06)' : 'transparent',
                      }}>
                      {GRADE_LABELS[g]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: `Flooring (₹/sqft)`, vals: GRADES.map(g => `₹${FLOORING_RATES[g]}`) },
                  { label: `Kitchen (₹/rft)`, vals: GRADES.map(g => `₹${KITCHEN_RATES[g].toLocaleString('en-IN')}`) },
                  { label: `False ceiling (₹/sqft)`, vals: GRADES.map(g => FALSE_CEILING_RATES[g] ? `₹${FALSE_CEILING_RATES[g]}` : '—') },
                  { label: `Flooring total`, vals: gradeComparison.map(g => formatLakhs(g.flooringCost)) },
                  { label: `Kitchen total`, vals: gradeComparison.map(g => formatLakhs(g.kitchenCost)) },
                  { label: `Paint total`, vals: gradeComparison.map(g => formatLakhs(g.paintCost)) },
                  { label: `Doors total`, vals: gradeComparison.map(g => formatLakhs(g.doorsCost)) },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.015)' }}>
                    <td className="py-2 px-3 text-[11px]"
                      style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
                      {row.label}
                    </td>
                    {row.vals.map((v, j) => (
                      <td key={j} className="py-2 px-3 text-right text-[11px]"
                        style={{
                          color:      GRADES[j] === grade ? '#1F4E79' : '#1E2227',
                          fontFamily: 'var(--font-plex-mono)',
                          fontWeight: GRADES[j] === grade ? 700 : 400,
                          background: GRADES[j] === grade ? 'rgba(31,78,121,0.04)' : 'transparent',
                        }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Grand total row */}
                <tr style={{ borderTop: '2px solid #1E2227', background: 'rgba(30,34,39,0.03)' }}>
                  <td className="py-2 px-3 text-[11px] font-semibold"
                    style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    TOTAL (APPROX)
                  </td>
                  {gradeComparison.map(g => (
                    <td key={g.grade} className="py-2 px-3 text-right text-[12px] font-bold"
                      style={{
                        color:      g.grade === grade ? '#1F4E79' : '#1E2227',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g.grade === grade ? 'rgba(31,78,121,0.08)' : 'transparent',
                      }}>
                      {formatLakhs(g.totalWithLabour)}
                    </td>
                  ))}
                </tr>
                {/* Per sqft row */}
                <tr style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
                  <td className="py-1.5 px-3 text-[10px]"
                    style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                    per sqft BUA
                  </td>
                  {gradeComparison.map(g => (
                    <td key={g.grade} className="py-1.5 px-3 text-right text-[10px]"
                      style={{
                        color:      g.grade === grade ? '#1F4E79' : 'rgba(30,34,39,0.5)',
                        fontFamily: 'var(--font-plex-mono)',
                        background: g.grade === grade ? 'rgba(31,78,121,0.04)' : 'transparent',
                      }}>
                      ₹{g.perSqft}/sqft
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-[10px]"
            style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', borderTop: '1px solid rgba(31,78,121,0.12)' }}>
            Grade multipliers: Basic 1.0× · Standard 1.6× · Premium 2.4× · Luxury 3.5×
            {totalBuaPreview > 0 && ` · Based on ${totalBuaPreview.toFixed(0)} sqft BUA`}
          </div>
        </div>

        {/* 01 — Grade Selection */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — GRADE SELECTION
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Which finish grade matches your budget and expectations?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADES.map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className="text-left p-3 rounded-[2px] transition-all"
                  style={{
                    border:     `2px solid ${grade === g ? '#1F4E79' : 'rgba(30,34,39,0.15)'}`,
                    background: grade === g ? 'rgba(31,78,121,0.06)' : 'transparent',
                  }}>
                  <p className="text-[12px] font-semibold uppercase mb-1"
                    style={{ color: grade === g ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                    {GRADE_LABELS[g]}
                  </p>
                  <p className="text-[10px] leading-tight"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
                    {GRADE_DESCRIPTIONS[g]}
                  </p>
                  {selectedGradeData && grade === g && (
                    <p className="text-[11px] mt-1.5 font-bold"
                      style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                      ~{formatLakhs(selectedGradeData.totalWithLabour)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 02 — Floor area */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — FLOOR AREA (BUA PER FLOOR)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is the built-up area of one floor?
            </p>
            <div className="flex gap-2">
              <input type="number" value={buaPerFloor}
                onChange={e => { setBuaPerFloor(e.target.value); setErrors(prev => ({ ...prev, buaPerFloor: '' })) }}
                placeholder="e.g. 1200"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.buaPerFloor ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
              />
              <select value={buaUnit} onChange={e => setBuaUnit(e.target.value as AreaUnit)}
                className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                <option value="sqft">sqft</option>
                <option value="sqm">sqm</option>
              </select>
            </div>
            {errors.buaPerFloor && (
              <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.buaPerFloor}</p>
            )}
            {buaSqftPreview > 0 && (
              <p className="text-[12px] mt-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                = {buaSqftPreview.toFixed(0)} sqft per floor · Total: {totalBuaPreview.toFixed(0)} sqft
              </p>
            )}
          </div>
        </div>

        {/* 03 — Number of floors */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — NUMBER OF FLOORS
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              How many floors to estimate interior for?
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['1','2','3','4','5','6'].map(f => (
                <button key={f} onClick={() => setNumFloors(f)}
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

        {/* 04 — Bedrooms */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              04 — BEDROOMS (NBC 2016 ROOM MINIMUMS)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Total number of bedrooms?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NBC 2016: Bedroom minimum 9.5 sqm. Affects flooring and door quantities.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {['1','2','3','4','5','6'].map(n => (
                <button key={n} onClick={() => setNumBedrooms(n)}
                  className="py-2 rounded-[2px] text-[13px] font-medium transition-all"
                  style={{
                    border:     `1.5px solid ${numBedrooms === n ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: numBedrooms === n ? 'rgba(31,78,121,0.08)' : 'transparent',
                    color:      numBedrooms === n ? '#1F4E79' : '#1E2227',
                    fontFamily: 'var(--font-plex-mono)',
                  }}>
                  {n} BHK
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 05 — Bathrooms */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              05 — BATHROOMS / TOILETS (IS 2645:2003 WET AREA WP)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Total number of bathrooms and toilets?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 2645:2003: Waterproofing minimum 2 coats in all wet areas before tiling.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {['1','2','3','4','5','6'].map(n => (
                <button key={n} onClick={() => setNumBathrooms(n)}
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

        {/* 06 — Kitchen running feet */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              06 — KITCHEN RUNNING FEET (MODULAR / CARPENTER)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              How many running feet of kitchen cabinets? (Total of upper + lower units combined)
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              Typical 10×10 ft kitchen = 10 rft lower + 10 rft upper = 20 rft total
            </p>
            <div className="flex gap-2 items-center">
              <input type="number" value={kitchenRft}
                onChange={e => { setKitchenRft(e.target.value); setErrors(prev => ({ ...prev, kitchenRft: '' })) }}
                placeholder="e.g. 20"
                className="w-32 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.kitchenRft ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
              />
              <span className="text-[13px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                running feet
              </span>
            </div>
            {errors.kitchenRft && (
              <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.kitchenRft}</p>
            )}
            {kitchenRft && parseFloat(kitchenRft) > 0 && (
              <p className="text-[12px] mt-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                {grade.toUpperCase()} grade kitchen: ₹{(parseFloat(kitchenRft) * (KITCHEN_RATES[grade])).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {/* 07 — False ceiling */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              07 — FALSE CEILING (IS 277:2003 MS FRAME)
            </p>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => setIncludeFalseCeiling(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeFalseCeiling ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeFalseCeiling ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include false ceiling estimate
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 277:2003: MS frame mandatory, minimum 0.5mm thickness. Not applicable for Basic grade.
                </p>
              </div>
            </label>
            {includeFalseCeiling && (
              <>
                <p className="text-[13px] mb-2" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
                  Total false ceiling area (sqft)?
                </p>
                <div className="flex gap-2 items-center">
                  <input type="number" value={falseCeilingSqft}
                    onChange={e => { setFalseCeilingSqft(e.target.value); setErrors(prev => ({ ...prev, falseCeilingSqft: '' })) }}
                    placeholder="e.g. 800"
                    className="w-32 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                    style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.falseCeilingSqft ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
                  />
                  <span className="text-[13px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>sqft</span>
                </div>
                {errors.falseCeilingSqft && (
                  <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>{errors.falseCeilingSqft}</p>
                )}
                {grade === 'basic' && (
                  <p className="text-[11px] mt-2" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                    ⚠ Basic grade typically does not include false ceiling. Upgrade to Standard or above for IS 277:2003 MS frame false ceiling estimate.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* 08 — Number of doors */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              08 — DOORS (NBC 2016 PART 3)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Approximate number of doors (all rooms including bathrooms)?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NBC 2016: Main + bedrooms + bathrooms + kitchen. Typical 3BHK = 8–10 doors.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {['4','5','6','7','8','10'].map(n => (
                <button key={n} onClick={() => setNumDoors(n)}
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

        {/* 09 — Contractor quote */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              09 — CONTRACTOR QUOTE (OPTIONAL)
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
                placeholder="e.g. 450000"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}
              />
            </div>
            {contractorQuote && (
              <p className="text-[11px] mt-1" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>
                ✓ Quote saved. Comparison ready after unlock.
              </p>
            )}
          </div>
        </div>

        {/* Rates note */}
        <div className="px-4 py-3 rounded-[2px] flex items-center gap-3"
          style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.02)' }}>
          <span style={{ color: '#14532D', fontSize: 14 }}>✓</span>
          <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
            Using Pune avg 2026 rates · Flooring Basic ₹65/sqft – Luxury ₹650/sqft · Kitchen Basic ₹1,200/rft – Luxury ₹7,500/rft
          </p>
        </div>

        {/* CPWD warning box */}
        <div className="p-4 rounded-[2px]"
          style={{ background: 'rgba(217,154,6,0.12)', border: '1px solid rgba(217,154,6,0.4)' }}>
          <div className="flex gap-2">
            <span style={{ color: '#D99A06', fontSize: 12 }}>⚠</span>
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1"
                style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                CPWD PRODUCTIVITY NOTE
              </p>
              <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', lineHeight: 1.6 }}>
                Why we cannot auto-calculate labour days: Interior timelines depend on factors no software can predict —
                coordination sequences (doors before plaster, plumbing before wall tiles, painting after electrical fixtures),
                material delivery delays, monsoon shutdowns, trade overlap, curing intervals between coats, and
                carpenter-vs-modular kitchen decision. CPWD rates calculate man-days; actual duration depends on site conditions.
              </p>
              <p className="text-[11px] mt-2" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                IS 2395:1994 note: Never paint before plaster is cured (minimum 28 days for cement plaster, 7 days for gypsum).
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Calculate My Interior Cost →
        </button>
      </div>
    </div>
  )
}

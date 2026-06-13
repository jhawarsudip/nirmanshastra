'use client'

import { useState } from 'react'
import { calcWaterDemand, seismicZoneFromState, type PlumbInput } from '../plumbpro-engine'

interface Props {
  state:    string
  city:     string
  onSubmit: (input: PlumbInput) => void
}

type AreaUnit = 'sqft' | 'sqm'
const SQFT_PER_SQM = 10.764

export default function BuildDetails({ state, city, onSubmit }: Props) {
  const [buaPerFloor, setBuaPerFloor]   = useState('')
  const [buaUnit, setBuaUnit]           = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]       = useState('1')
  const [numBedrooms, setNumBedrooms]   = useState('2')
  const [numBathrooms, setNumBathrooms] = useState('2')
  const [waterSource, setWaterSource]   = useState<'municipal' | 'borewell'>('municipal')
  const [includeSump, setIncludeSump]   = useState(true)
  const [contractorQuote, setContractorQuote] = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(state)

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview   = toBuaSqft(buaPerFloor, buaUnit)
  const totalBuaPreview  = buaSqftPreview * (parseInt(numFloors) || 1)

  // Live water demand preview (IS 1172:1993 — always visible free)
  const previewDemand = calcWaterDemand({
    state, city,
    numBedrooms:     parseInt(numBedrooms) || 2,
    numBathrooms:    parseInt(numBathrooms) || 2,
    numFloors:       parseInt(numFloors) || 1,
    buaPerFloorSqft: Math.round(buaSqftPreview) || 500,
    waterSource,
    includeSump,
  })

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!buaPerFloor || parseFloat(buaPerFloor) <= 0) e.buaPerFloor = 'Enter floor area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      state,
      city,
      numBedrooms:     Math.max(1, parseInt(numBedrooms) || 2),
      numBathrooms:    Math.max(1, parseInt(numBathrooms) || 2),
      numFloors:       Math.max(1, parseInt(numFloors) || 1),
      buaPerFloorSqft: Math.round(toBuaSqft(buaPerFloor, buaUnit)),
      waterSource,
      includeSump,
      contractorQuote: contractorQuote ? parseFloat(contractorQuote) : undefined,
    })
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · PLUMBPRO
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

        {/* IS 1172:1993 Water Demand Calculator — FREE, always visible */}
        <div className="border rounded-[2px]"
          style={{ borderColor: 'rgba(31,78,121,0.35)', background: 'rgba(31,78,121,0.02)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(31,78,121,0.2)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1172:1993 WATER DEMAND CALCULATOR — FREE PREVIEW (UPDATES LIVE)
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>
              Tank undersizing is dangerous. Verify your contractor&apos;s proposed size against IS requirements.
            </p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'DAILY DEMAND',  value: `${previewDemand.dailyDemandL.toLocaleString('en-IN')} L`, sub: `${previewDemand.lpcd} LPCD × ${previewDemand.occupants} occ.` },
              { label: 'OHT SIZE',      value: `${previewDemand.ohtL.toLocaleString('en-IN')} L`,          sub: `${previewDemand.ohtM3} m³ recommended` },
              { label: 'SUMP SIZE',     value: includeSump ? `${previewDemand.sumpL.toLocaleString('en-IN')} L` : 'Not included', sub: includeSump ? `${previewDemand.sumpM3} m³` : '—' },
              { label: 'PUMP HP',       value: previewDemand.pumpHPStandard, sub: `${previewDemand.pumpFlowLPH} LPH flow` },
            ].map(item => (
              <div key={item.label} className="px-3 py-2 rounded-[2px]"
                style={{ border: '1px solid rgba(31,78,121,0.2)', background: '#F4F4F0' }}>
                <p className="text-[9px] uppercase tracking-widest"
                  style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  {item.label}
                </p>
                <p className="text-[16px] font-bold mt-1"
                  style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  {item.value}
                </p>
                <p className="text-[10px] mt-0.5"
                  style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-sans)' }}>
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1172:1993: Municipal supply = 135 LPCD · Borewell = 150 LPCD · Tank size = daily demand × 0.67
            </p>
          </div>
        </div>

        {/* 01 — Floor area */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — FLOOR AREA (BUA PER FLOOR)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is the built-up area of one floor?
            </p>
            <div className="flex gap-2">
              <input type="number" value={buaPerFloor}
                onChange={e => { setBuaPerFloor(e.target.value); setErrors(prev => ({ ...prev, buaPerFloor: '' })) }}
                placeholder="e.g. 900"
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
              <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                {errors.buaPerFloor}
              </p>
            )}
            {buaSqftPreview > 0 && (
              <p className="text-[12px] mt-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                = {buaSqftPreview.toFixed(0)} sqft per floor · Total: {totalBuaPreview.toFixed(0)} sqft
              </p>
            )}
          </div>
        </div>

        {/* 02 — Number of floors */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — NUMBER OF FLOORS
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              How many floors does your building have? (Include ground floor)
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

        {/* 03 — Bedrooms */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — BEDROOMS (IS 1172:1993 OCCUPANCY)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Total number of bedrooms in the building?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1172:1993: Occupancy estimated at 2 persons/bedroom + 2 common = {parseInt(numBedrooms) * 2 + 2} occupants
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

        {/* 04 — Bathrooms */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              04 — BATHROOMS / TOILETS (IS 1742:1983 SOIL STACK)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Total number of bathrooms and toilets?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1742:1983: Each WC requires 110mm SWR soil stack at 1:80 slope. Each bath/kitchen needs 75mm SWR at 1:48.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
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

        {/* 05 — Water source */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              05 — WATER SOURCE (IS 1172:1993 LPCD)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is your primary water source?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'municipal', label: 'Municipal Supply', sub: '135 LPCD (IS 1172:1993)' },
                { val: 'borewell',  label: 'Borewell / Tanker', sub: '150 LPCD (IS 1172:1993)' },
              ].map(opt => (
                <button key={opt.val} onClick={() => setWaterSource(opt.val as 'municipal' | 'borewell')}
                  className="text-left p-4 rounded-[2px] transition-all"
                  style={{
                    border:     `2px solid ${waterSource === opt.val ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: waterSource === opt.val ? 'rgba(31,78,121,0.06)' : 'transparent',
                  }}>
                  <p className="text-[13px] font-medium"
                    style={{ color: waterSource === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] mt-1"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    {opt.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 06 — Sump tank */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              06 — UNDERGROUND SUMP TANK (IS 12701)
            </p>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIncludeSump(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeSump ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeSump ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include underground sump tank
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  IS 12701: food-grade HDPE, covered, insect-proof. Strongly recommended for borewell/tanker supply.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 07 — Contractor quote */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              07 — CONTRACTOR QUOTE (OPTIONAL)
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
                placeholder="e.g. 95000"
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
            Using Pune avg 2026 rates · CPVC 25mm ₹120/m · SWR 75mm ₹95/m · SWR 110mm ₹145/m
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
                Why we cannot auto-calculate labour days: Plumbing timelines depend on factors no software can
                predict — curing intervals between pours, coordination with electrician conduit, tile schedule
                (plumbing must precede wall tiles), monsoon shutdowns, local labour availability, and flush-test
                scheduling before wall closure. CPWD rates calculate man-days of work; actual duration depends
                on site conditions.
              </p>
              <p className="text-[11px] mt-2" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                IS 1742:1983 note: Hydraulic test at 1.5× working pressure for 1 hour before closing walls.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Calculate My Plumbing Cost →
        </button>
      </div>
    </div>
  )
}

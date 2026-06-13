'use client'

import { useState } from 'react'
import { seismicZoneFromState, type ElectroInput } from '../electropro-engine'

interface Props {
  state:    string
  city:     string
  onSubmit: (input: ElectroInput) => void
}

type AreaUnit = 'sqft' | 'sqm'
const SQFT_PER_SQM = 10.764

export default function BuildDetails({ state, city, onSubmit }: Props) {
  const [buaPerFloor, setBuaPerFloor]   = useState('')
  const [buaUnit, setBuaUnit]           = useState<AreaUnit>('sqft')
  const [numFloors, setNumFloors]       = useState('1')
  const [numBathrooms, setNumBathrooms] = useState('2')
  const [numAC, setNumAC]               = useState('2')
  const [includeEarthing, setEarthing]  = useState(true)
  const [numPits, setNumPits]           = useState('2')
  const [contractorQuote, setContractorQuote] = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(state)

  function toBuaSqft(val: string, unit: AreaUnit): number {
    const v = parseFloat(val)
    if (!v || v <= 0) return 0
    return unit === 'sqm' ? v * SQFT_PER_SQM : v
  }

  const buaSqftPreview = toBuaSqft(buaPerFloor, buaUnit)
  const totalBuaPreview = buaSqftPreview * (parseInt(numFloors) || 1)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!buaPerFloor || parseFloat(buaPerFloor) <= 0)
      e.buaPerFloor = 'Enter floor area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      state,
      city,
      buaPerFloorSqft: Math.round(toBuaSqft(buaPerFloor, buaUnit)),
      numFloors:        Math.max(1, parseInt(numFloors) || 1),
      numBathrooms:     Math.max(0, parseInt(numBathrooms) || 0),
      numAC:            Math.max(0, parseInt(numAC) || 0),
      includeEarthing,
      numEarthingPits:  includeEarthing ? (parseInt(numPits) || 2) : 0,
      contractorQuote:  contractorQuote ? parseFloat(contractorQuote) : undefined,
    })
  }

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
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

        {/* 01 — Floor area */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — FLOOR AREA (BUA PER FLOOR)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is the built-up area of one floor?
            </p>
            <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Tip: Measure length × width of your floor slab. For 20ft × 40ft = 800 sqft per floor.
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
                = {buaSqftPreview.toFixed(0)} sqft per floor
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
            {totalBuaPreview > 0 && (
              <p className="text-[12px] mt-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                Total BUA: {totalBuaPreview.toFixed(0)} sqft ({(totalBuaPreview / 10.764).toFixed(0)} sqm)
              </p>
            )}
          </div>
        </div>

        {/* 03 — Bathrooms */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — BATHROOMS / TOILETS (IS 3043:2018 RCCB)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              Total number of bathrooms and toilets in the building?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 3043:2018: 30mA RCCB is MANDATORY for all bathroom circuits. Each bathroom also needs a dedicated geyser circuit.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {['0','1','2','3','4','5','6'].map(n => (
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
            {parseInt(numBathrooms) > 0 && (
              <div className="mt-3 p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(217,154,6,0.4)', background: 'rgba(217,154,6,0.06)' }}>
                <p className="text-[11px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                  ⚠ IS 3043:2018 Cl 10.4 — RCCB 30mA included in this estimate for {numBathrooms} bathroom circuit(s). Verify with your electrician.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 04 — AC Units */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              04 — AIR CONDITIONERS (4.0 SQMM DEDICATED CIRCUITS)
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              How many AC units will you install?
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              IS 732:2019: Each AC unit requires a separate 20A MCB circuit with 4.0 sqmm wire minimum.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['0','1','2','3','4','5','6','8'].map(n => (
                <button key={n} onClick={() => setNumAC(n)}
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

        {/* 05 — Earthing */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              05 — EARTHING (IS 3043:2018)
            </p>
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
                <label className="text-[11px] uppercase tracking-widest block mb-2"
                  style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Number of earthing pits
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1','2','3','4'].map(n => (
                    <button key={n} onClick={() => setNumPits(n)}
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
                  IS 3043:2018: Minimum 2 earthing pits for residential buildings. One for neutral, one for equipment earth.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 06 — Contractor quote */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
              06 — CONTRACTOR QUOTE (OPTIONAL)
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
            Using Pune avg 2026 rates · Wire 1.5 sqmm ₹22/m · 2.5 sqmm ₹35/m · 4.0 sqmm ₹55/m · MCB 6A ₹120
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
                Why we cannot auto-calculate number of days: Labour days depend on factors no software can predict —
                curing intervals, monsoon shutdowns, festival breaks, sand bans, local site conditions, and
                plaster schedule coordination (conduit must be laid before plastering).
                CPWD productivity rates calculate man-days of work. You set workers; days calculate automatically after unlocking.
              </p>
              <p className="text-[11px] mt-2" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                IS 732:2019 note: Verify Class B license. Unlicensed electrical work voids insurance.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Calculate My Electrical Cost →
        </button>
      </div>
    </div>
  )
}

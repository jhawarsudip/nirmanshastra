'use client'

import { useState } from 'react'
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

interface Props {
  state: string
  city: string
  onSubmit: (input: MasonInput) => void
}

type AreaUnit = 'sqm' | 'sqft'
const SQM_PER_SQFT = 0.0929

export default function BuildDetails({ state, city, onSubmit }: Props) {
  const [extWallType, setExtWallType]       = useState<ExternalWallType>('clay_modular_9')
  const [extWallArea, setExtWallArea]       = useState('')
  const [extAreaUnit, setExtAreaUnit]       = useState<AreaUnit>('sqm')
  const [includeInternal, setIncludeInt]    = useState(false)
  const [intWallType, setIntWallType]       = useState<InternalWallType>('clay_4_5')
  const [intWallArea, setIntWallArea]       = useState('')
  const [intAreaUnit, setIntAreaUnit]       = useState<AreaUnit>('sqm')
  const [includePlaster, setIncludePlaster] = useState(true)
  const [includeWP, setIncludeWP]           = useState(false)
  const [terraceArea, setTerraceArea]       = useState('')
  const [bathroomCount, setBathroomCount]   = useState('2')
  const [terraceWP, setTerraceWP]           = useState<WaterproofingMethod>('bbc')
  const [bathroomWP, setBathroomWP]         = useState<BathroomWpMethod>('cementitious')
  const [contractorQuote, setContractorQuote] = useState('')
  const [errors, setErrors]                 = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(state)
  const extSpec = EXTERNAL_WALL_SPECS[extWallType]
  const isHighSeismic = szInfo.zone === 'IV' || szInfo.zone === 'V'
  const showAacWarning = extWallType === 'aac_200' && isHighSeismic

  function toSqm(area: string, unit: AreaUnit): number {
    const v = parseFloat(area)
    if (!v || v <= 0) return 0
    return unit === 'sqft' ? v * SQM_PER_SQFT : v
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!extWallArea || parseFloat(extWallArea) <= 0) e.extWallArea = 'Enter external wall area'
    if (includeInternal && (!intWallArea || parseFloat(intWallArea) <= 0)) {
      e.intWallArea = 'Enter internal wall area or uncheck the option'
    }
    if (includeWP && !terraceArea && parseInt(bathroomCount) < 1) {
      e.wp = 'Enter terrace area or bathroom count'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const extSqm = toSqm(extWallArea, extAreaUnit)
    const intSqm = includeInternal ? toSqm(intWallArea, intAreaUnit) : 0
    onSubmit({
      state,
      city,
      externalWallType: extWallType,
      externalWallAreaSqm: Math.round(extSqm * 100) / 100,
      includeInternal,
      internalWallType: includeInternal ? intWallType : undefined,
      internalWallAreaSqm: intSqm,
      includePlaster,
      includeWaterproofing: includeWP,
      terraceAreaSqft: includeWP ? (parseFloat(terraceArea) || 0) : 0,
      bathroomCount: includeWP ? (parseInt(bathroomCount) || 0) : 0,
      terraceWpMethod: terraceWP,
      bathroomWpMethod: bathroomWP,
      contractorQuote: contractorQuote ? parseFloat(contractorQuote) : undefined,
    })
  }

  const extSqmPreview = toSqm(extWallArea, extAreaUnit)

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
      {/* Page header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
              NIRMANSHASTRA · MASONPRO
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

        {/* Location + seismic */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)' }}>
          <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>
            📍 {city}, {state}
          </span>
          <span className="px-2 py-0.5 rounded-[2px] text-[10px]"
            style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}>
            SEISMIC ZONE {szInfo.zone} · Z={szInfo.zFactor}
          </span>
        </div>

        {/* 01 — External wall type */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — EXTERNAL WALL TYPE
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-4" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What material will your external walls be built with?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(EXTERNAL_WALL_SPECS) as ExternalWallType[]).map(type => {
                const spec = EXTERNAL_WALL_SPECS[type]
                const selected = extWallType === type
                const aacRisk = type === 'aac_200' && isHighSeismic
                return (
                  <button key={type}
                    onClick={() => { setExtWallType(type); setErrors(prev => ({ ...prev, extWallType: '' })) }}
                    className="text-left p-3 rounded-[2px] transition-all"
                    style={{
                      border: `1.5px solid ${selected ? '#1F4E79' : aacRisk ? 'rgba(217,154,6,0.5)' : 'rgba(30,34,39,0.18)'}`,
                      background: selected ? 'rgba(31,78,121,0.06)' : aacRisk ? 'rgba(217,154,6,0.04)' : 'transparent',
                    }}>
                    <p className="text-[12px] font-medium leading-tight mb-0.5"
                      style={{ color: selected ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                      {spec.shortLabel}
                    </p>
                    <p className="text-[10px]"
                      style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                      {spec.unitsPerSqm} {spec.unitLabel}/sqm · {spec.mortarRatio} · {spec.isCode.split('+')[0].trim()}
                    </p>
                    {aacRisk && (
                      <p className="text-[9px] mt-1" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)' }}>
                        ⚠ Zone {szInfo.zone}: Infill only
                      </p>
                    )}
                  </button>
                )
              })}
            </div>

            {/* AAC Warning */}
            {showAacWarning && (
              <div className="mt-4 p-3 rounded-[2px]"
                style={{ border: '1px solid rgba(217,154,6,0.5)', background: 'rgba(217,154,6,0.08)' }}>
                <div className="flex gap-2">
                  <span style={{ color: '#D99A06' }}>⚠</span>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>
                      IS 4326:1993 — AAC RESTRICTION IN ZONE {szInfo.zone}
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                      AAC blocks are NOT permitted as load-bearing masonry in Seismic Zones IV and V.
                      Approved for infill/partition use only. Ensure your structural engineer has specified
                      clay brick or hollow concrete block for load-bearing walls.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 02 — External wall area */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — EXTERNAL WALL AREA
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-1" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is your total external wall area?
            </p>
            <p className="text-[12px] mb-3" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              Tip: Total external wall area ≈ your perimeter (m) × 3m per floor × number of floors.
              For a 4m × 10m house, G+1: (4+10) × 2 × 3 × 2 = 168 sqm.
            </p>
            <div className="flex gap-2">
              <input type="number" value={extWallArea}
                onChange={e => { setExtWallArea(e.target.value); setErrors(prev => ({ ...prev, extWallArea: '' })) }}
                placeholder="e.g. 150"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.extWallArea ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
              />
              <select value={extAreaUnit} onChange={e => setExtAreaUnit(e.target.value as AreaUnit)}
                className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                <option value="sqm">sqm</option>
                <option value="sqft">sqft</option>
              </select>
            </div>
            {errors.extWallArea && (
              <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                {errors.extWallArea}
              </p>
            )}
            {extSqmPreview > 0 && (
              <div className="mt-2 flex gap-4">
                <p className="text-[12px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                  = {extSqmPreview.toFixed(1)} sqm
                </p>
                <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  ≈ {Math.round(extSpec.unitsPerSqm * extSqmPreview).toLocaleString('en-IN')} {extSpec.unitLabel} required
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 03 — Internal partitions */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — INTERNAL PARTITIONS (OPTIONAL)
            </p>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => setIncludeInt(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeInternal ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeInternal ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                Include internal partition walls
              </p>
            </label>

            {includeInternal && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(INTERNAL_WALL_SPECS) as InternalWallType[]).map(type => {
                    const spec = INTERNAL_WALL_SPECS[type]
                    const selected = intWallType === type
                    return (
                      <button key={type} onClick={() => setIntWallType(type)}
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
                          <p className="text-[10px] mt-0.5"
                            style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                            {spec.unitsPerSqm.toFixed(0)} {spec.unitLabel}/sqm
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest block mb-1"
                    style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                    Internal wall area
                  </label>
                  <div className="flex gap-2">
                    <input type="number" value={intWallArea}
                      onChange={e => { setIntWallArea(e.target.value); setErrors(prev => ({ ...prev, intWallArea: '' })) }}
                      placeholder="e.g. 80"
                      className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: errors.intWallArea ? '#8C3A22' : 'rgba(30,34,39,0.4)' }}
                    />
                    <select value={intAreaUnit} onChange={e => setIntAreaUnit(e.target.value as AreaUnit)}
                      className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none focus:border-blueprint"
                      style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                      <option value="sqm">sqm</option>
                      <option value="sqft">sqft</option>
                    </select>
                  </div>
                  {errors.intWallArea && (
                    <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                      {errors.intWallArea}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 04 — Plastering */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              04 — PLASTERING (IS 1661:1972)
            </p>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIncludePlaster(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includePlaster ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includePlaster ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <div>
                <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                  Include plastering quantities
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                  External 15mm (1:4) + Internal 12mm (1:4) · +5% wastage per IS 1661
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 05 — Waterproofing */}
        <div className="border rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest"
              style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              05 — WATERPROOFING (IS 2645:2003)
            </p>
          </div>
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => setIncludeWP(v => !v)}
                className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
                style={{ background: includeWP ? '#1F4E79' : 'rgba(30,34,39,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                  style={{ transform: includeWP ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <p className="text-[14px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                Include waterproofing (terrace + bathrooms)
              </p>
            </label>

            {includeWP && (
              <div className="space-y-4">
                {/* Terrace */}
                <div className="p-3 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.02)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    TERRACE WATERPROOFING
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest block mb-1"
                        style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                        Terrace area (sqft)
                      </label>
                      <input type="number" value={terraceArea} onChange={e => setTerraceArea(e.target.value)}
                        placeholder="e.g. 1200"
                        className="w-full border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white outline-none focus:border-blueprint"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-widest block mb-1"
                        style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                        Method
                      </label>
                      <select value={terraceWP} onChange={e => setTerraceWP(e.target.value as WaterproofingMethod)}
                        className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                        <option value="bbc">Brick Bat Coba (BBC) — ₹155–225/sqft</option>
                        <option value="membrane">APP Bitumen Membrane — ₹120–175/sqft</option>
                        <option value="liquid">Liquid Applied — ₹85–130/sqft</option>
                        <option value="ips">IPS Screed — ₹110–155/sqft</option>
                        <option value="none">Skip terrace WP</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="p-3 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.02)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                    SUNKEN BATHROOM WATERPROOFING (IS 2645:2003)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest block mb-1"
                        style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                        Number of bathrooms
                      </label>
                      <select value={bathroomCount} onChange={e => setBathroomCount(e.target.value)}
                        className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                        {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} bathroom{n !== 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-widest block mb-1"
                        style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                        Method
                      </label>
                      <select value={bathroomWP} onChange={e => setBathroomWP(e.target.value as BathroomWpMethod)}
                        className="w-full border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white outline-none"
                        style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}>
                        <option value="cementitious">Cementitious Slurry — ₹88–145/sqft</option>
                        <option value="crystalline">Crystalline (Xypex) — ₹145–220/sqft</option>
                        <option value="pu">PU (DrFixit 2K) — ₹180–250/sqft</option>
                        <option value="none">Skip bathroom WP</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                    IS 2645:2003: Pond test mandatory — 50mm water for 24-48 hours before backfill.
                  </p>
                </div>

                {errors.wp && (
                  <p className="text-[11px]" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                    {errors.wp}
                  </p>
                )}
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
              Have a contractor quote? Enter it to compare against IS-code quantities after unlocking.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[14px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
              <input type="number" value={contractorQuote}
                onChange={e => setContractorQuote(e.target.value)}
                placeholder="e.g. 350000"
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
            Using Pune avg 2026 material rates · Clay brick ₹11 each · Cement ₹495/bag · Sand ₹24/cft
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
                Labour days depend on factors no software can predict — curing intervals, monsoon shutdowns,
                festival breaks, local labour conditions, and site access. CPWD productivity rates calculate
                man-days of work. You set the number of workers; days calculate automatically after unlocking.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
          Calculate My Masonry Cost →
        </button>
      </div>
    </div>
  )
}

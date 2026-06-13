'use client'

import { useState, useEffect } from 'react'
import {
  seismicZoneFromState,
  exposureFromSiteCondition,
  foundationFromSiteCondition,
  type SiteCondition,
  type ConcreteGrade,
  type SteelGrade,
  type StructoInput,
} from '../structopro-engine'

interface Props {
  state: string
  city: string
  onSubmit: (input: StructoInput) => void
}

const FLOOR_OPTIONS = [
  { value: 0, label: 'G (Ground Floor Only)' },
  { value: 1, label: 'G+1 (2 Floors)' },
  { value: 2, label: 'G+2 (3 Floors)' },
  { value: 3, label: 'G+3 (4 Floors)' },
  { value: 4, label: 'G+4 (5 Floors)' },
  { value: 5, label: 'G+5 (6 Floors)' },
]

type AreaUnit = 'sqft' | 'sqm' | 'sqyard'

const UNIT_CONVERSIONS: Record<AreaUnit, number> = {
  sqft:   1,
  sqm:    10.764,
  sqyard: 9,
}

type SiteCard = { value: SiteCondition; label: string; icon: string; note: string }

const SITE_CARDS: SiteCard[] = [
  { value: 'flat',        label: 'Flat',            icon: '▬',  note: 'Ideal condition' },
  { value: 'sloped_mild', label: 'Sloped — Mild',   icon: '↗',  note: '1:5 gradient' },
  { value: 'sloped_steep',label: 'Sloped — Steep',  icon: '↗↗', note: '1:3 or steeper' },
  { value: 'rocky',       label: 'Rocky Ground',    icon: '◈',  note: 'Hard rock visible' },
  { value: 'bcs',         label: 'Black Cotton Soil',icon: '◉', note: 'Expansive clay' },
  { value: 'soft_marshy', label: 'Soft / Marshy',   icon: '≋',  note: 'Low bearing capacity' },
  { value: 'waterlogged', label: 'Waterlogged',      icon: '~',  note: 'High water table' },
  { value: 'coastal',     label: 'Coastal',          icon: '◌',  note: 'Within 1km of sea' },
]

export default function BuildDetails({ state, city, onSubmit }: Props) {
  const [numFloors, setNumFloors]     = useState(1)
  const [area, setArea]               = useState('')
  const [areaUnit, setAreaUnit]       = useState<AreaUnit>('sqft')
  const [siteCondition, setSite]      = useState<SiteCondition | null>(null)
  const [concreteGrade, setConcrete]  = useState<ConcreteGrade>('M20')
  const [steelGrade, setSteel]        = useState<SteelGrade>('Fe500D')
  const [showAdvanced, setAdvanced]   = useState(false)
  const [errors, setErrors]           = useState<Record<string, string>>({})

  const szInfo = seismicZoneFromState(state)

  // Auto-set steel grade based on seismic zone
  useEffect(() => {
    const { zone } = seismicZoneFromState(state)
    if (zone === 'III' || zone === 'IV' || zone === 'V') {
      setSteel('Fe500D')
    } else {
      setSteel('Fe500')
    }
  }, [state])

  // Auto-set concrete grade based on exposure class
  useEffect(() => {
    if (!siteCondition) return
    const exp = exposureFromSiteCondition(siteCondition)
    const minGrades: Record<string, ConcreteGrade> = {
      mild: 'M20', moderate: 'M25', severe: 'M30', very_severe: 'M35', extreme: 'M35',
    }
    setConcrete(prev => {
      const required = minGrades[exp] ?? 'M20'
      const reqNum = parseInt(required.replace('M', ''))
      const prevNum = parseInt(prev.replace('M', ''))
      return prevNum < reqNum ? required : prev
    })
  }, [siteCondition])

  const foundation = siteCondition
    ? foundationFromSiteCondition(siteCondition, numFloors)
    : null

  const areaSqft = siteCondition && area
    ? parseFloat(area) * UNIT_CONVERSIONS[areaUnit]
    : 0

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
      state,
      city,
      numFloors,
      groundFloorAreaSqft: Math.round(areaSqft),
      siteCondition,
      concreteGrade,
      steelGrade,
    })
  }

  const compactLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="min-h-screen bg-sheet-white pb-12">
      {/* Page header */}
      <div
        className="px-4 py-4"
        style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}
            >
              NIRMANSHASTRA · STRUCTOPRO
            </p>
            <h1
              className="text-[22px] font-bold"
              style={{ color: '#1E2227', fontFamily: 'var(--font-plex-serif)' }}
            >
              Build Details
            </h1>
          </div>
          {/* Step bar */}
          <div className="flex items-center">
            {(['REG', 'METHOD', 'DETAILS', 'RESULTS'] as const).map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border"
                    style={{
                      background:  i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'transparent',
                      borderColor: i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'rgba(30,34,39,0.22)',
                      color:       i <= 2 ? '#fff' : 'rgba(30,34,39,0.35)',
                      fontFamily:  'var(--font-plex-mono)',
                    }}
                  >
                    {i < 2 ? '✓' : i + 1}
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-widest hidden sm:inline"
                    style={{
                      fontFamily: 'var(--font-plex-mono)',
                      color: i < 2 ? '#14532D' : i === 2 ? '#1F4E79' : 'rgba(30,34,39,0.3)',
                    }}
                  >
                    {step}
                  </span>
                </div>
                {i < 3 && <div className="w-5 h-px mx-1.5" style={{ background: 'rgba(30,34,39,0.14)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Location chip */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(30,34,39,0.15)', background: 'rgba(31,78,121,0.04)' }}
        >
          <span style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}>
            📍 {city}, {state}
          </span>
          <span
            className="px-2 py-0.5 rounded-[2px] text-[10px]"
            style={{ background: '#1F4E79', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
          >
            SEISMIC ZONE {szInfo.zone} · Z={szInfo.zFactor}
          </span>
        </div>

        {/* Number of floors */}
        <div className="border border-iron-ink rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              01 — NUMBER OF FLOORS
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              How many floors is your building?
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FLOOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNumFloors(opt.value)}
                  className="py-2 px-1 rounded-[2px] text-center transition-all"
                  style={{
                    border: `1px solid ${numFloors === opt.value ? '#1F4E79' : 'rgba(30,34,39,0.2)'}`,
                    background: numFloors === opt.value ? '#1F4E79' : 'transparent',
                    color: numFloors === opt.value ? '#fff' : '#1E2227',
                    fontFamily: 'var(--font-plex-mono)',
                    fontSize: 13,
                    fontWeight: numFloors === opt.value ? 600 : 400,
                  }}
                >
                  {opt.value === 0 ? 'G' : `G+${opt.value}`}
                </button>
              ))}
            </div>
            <p className="text-[12px] mt-2" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-sans)' }}>
              {FLOOR_OPTIONS.find(o => o.value === numFloors)?.label}
            </p>
          </div>
        </div>

        {/* Ground floor area */}
        <div className="border border-iron-ink rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              02 — GROUND FLOOR AREA
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-3" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What is the built-up area of your ground floor?
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={area}
                onChange={e => { setArea(e.target.value); setErrors(prev => ({ ...prev, area: '' })) }}
                placeholder="e.g. 1200"
                className="flex-1 border rounded-[6px] px-3 py-2 text-[14px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{
                  fontFamily: 'var(--font-plex-mono)',
                  borderColor: errors.area ? '#8C3A22' : 'rgba(30,34,39,0.4)',
                }}
              />
              <select
                value={areaUnit}
                onChange={e => setAreaUnit(e.target.value as AreaUnit)}
                className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.4)' }}
              >
                <option value="sqft">sqft</option>
                <option value="sqm">sqm</option>
                <option value="sqyard">sq yard</option>
              </select>
            </div>
            {errors.area && (
              <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                {errors.area}
              </p>
            )}
            {area && parseFloat(area) > 0 && areaUnit !== 'sqft' && (
              <p className="text-[12px] mt-1" style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}>
                = {Math.round(parseFloat(area) * UNIT_CONVERSIONS[areaUnit])} sqft
              </p>
            )}
            {area && parseFloat(area) > 0 && (
              <p className="text-[12px] mt-1" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                Total BUA: {Math.round(parseFloat(area) * UNIT_CONVERSIONS[areaUnit] * (numFloors + 1)).toLocaleString('en-IN')} sqft
              </p>
            )}
          </div>
        </div>

        {/* Site condition cards */}
        <div className="border border-iron-ink rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.2)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,34,39,0.12)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              03 — SITE CONDITION
            </p>
          </div>
          <div className="p-4">
            <p className="text-[14px] mb-4" style={{ color: 'rgba(30,34,39,0.6)', fontFamily: 'var(--font-plex-sans)' }}>
              What best describes your plot's ground condition?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SITE_CARDS.map(card => (
                <button
                  key={card.value}
                  onClick={() => { setSite(card.value); setErrors(prev => ({ ...prev, site: '' })) }}
                  className="text-left p-3 rounded-[2px] transition-all"
                  style={{
                    border: `1.5px solid ${siteCondition === card.value ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`,
                    background: siteCondition === card.value ? 'rgba(31,78,121,0.06)' : 'transparent',
                  }}
                >
                  <div
                    className="text-[20px] mb-1"
                    style={{ fontFamily: 'var(--font-plex-mono)', color: siteCondition === card.value ? '#1F4E79' : 'rgba(30,34,39,0.4)' }}
                  >
                    {card.icon}
                  </div>
                  <p
                    className="text-[12px] font-medium leading-tight mb-0.5"
                    style={{ color: siteCondition === card.value ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
                  >
                    {card.note}
                  </p>
                </button>
              ))}
            </div>
            {errors.site && (
              <p className="text-[11px] mt-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
                {errors.site}
              </p>
            )}

            {/* Foundation auto-recommendation */}
            {foundation && (
              <div
                className="mt-4 p-3 rounded-[2px]"
                style={{
                  border: foundation.warning ? '1px solid rgba(217,154,6,0.5)' : '1px solid rgba(31,78,121,0.3)',
                  background: foundation.warning ? 'rgba(217,154,6,0.05)' : 'rgba(31,78,121,0.04)',
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: foundation.warning ? '#D99A06' : '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}
                >
                  AUTO-RECOMMENDED FOUNDATION
                </p>
                <p
                  className="text-[13px] font-medium"
                  style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}
                >
                  {foundation.label}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'rgba(30,34,39,0.45)', fontFamily: 'var(--font-plex-mono)' }}
                >
                  {foundation.isCode} · ₹{foundation.minCostPerSqft}–{foundation.maxCostPerSqft}/sqft GFA
                </p>
                {foundation.warning && (
                  <div
                    className="mt-2 flex gap-2"
                    style={{ borderTop: '1px solid rgba(217,154,6,0.2)', paddingTop: 8 }}
                  >
                    <span style={{ color: '#D99A06' }}>⚠</span>
                    <p className="text-[12px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                      {foundation.warning}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border border-iron-ink rounded-[2px]" style={{ borderColor: 'rgba(30,34,39,0.18)' }}>
          <button
            onClick={() => setAdvanced(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
              ADVANCED SETTINGS (OPTIONAL)
            </p>
            <span style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)', fontSize: 12 }}>
              {showAdvanced ? '▲' : '▼'}
            </span>
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              {/* Concrete grade */}
              <div className="flex flex-col gap-1 pt-4">
                <label className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Concrete Grade
                </label>
                <select
                  value={concreteGrade}
                  onChange={e => setConcrete(e.target.value as ConcreteGrade)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)' }}
                >
                  <option value="M20">M20 — Min mild exposure (IS 456 default)</option>
                  <option value="M25">M25 — Min moderate/BCS/slope</option>
                  <option value="M30">M30 — Min severe/marshy/waterlogged</option>
                  <option value="M35">M35 — Min coastal/very severe</option>
                </select>
                {siteCondition && (
                  <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                    Auto: min {(() => {
                      const exp = exposureFromSiteCondition(siteCondition)
                      const m = { mild: 'M20', moderate: 'M25', severe: 'M30', very_severe: 'M35', extreme: 'M35' }
                      return m[exp]
                    })()} for {compactLabel(siteCondition)} site
                  </p>
                )}
              </div>

              {/* Steel grade */}
              <div className="flex flex-col gap-1 pt-4">
                <label className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Steel Grade
                </label>
                <select
                  value={steelGrade}
                  onChange={e => setSteel(e.target.value as SteelGrade)}
                  className="border rounded-[6px] px-3 py-2 text-[13px] bg-sheet-white text-iron-ink outline-none focus:border-blueprint"
                  style={{ fontFamily: 'var(--font-plex-mono)', borderColor: 'rgba(30,34,39,0.35)' }}
                >
                  <option value="Fe415">Fe415 — Old standard (not recommended)</option>
                  <option value="Fe500">Fe500 — Standard residential Zone II</option>
                  <option value="Fe500D">Fe500D — Zone III-V mandatory (IS 13920)</option>
                  <option value="Fe550D">Fe550D — High-rise seismic</option>
                </select>
                <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>
                  Auto: Fe500D for Zone III-V per IS 13920:2016
                </p>
              </div>

              {/* Seismic zone display */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-mono)' }}>
                  Seismic Zone (IS 1893:2016)
                </label>
                <div
                  className="px-3 py-2 rounded-[6px] text-[13px]"
                  style={{ border: '1px solid rgba(30,34,39,0.2)', background: 'rgba(31,78,121,0.04)', fontFamily: 'var(--font-plex-mono)', color: '#1F4E79' }}
                >
                  Zone {szInfo.zone} · Z-Factor {szInfo.zFactor} · Auto-determined from {state}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rates note */}
        <div
          className="px-4 py-3 rounded-[2px] flex items-center gap-3"
          style={{ border: '1px solid rgba(30,34,39,0.12)', background: 'rgba(30,34,39,0.02)' }}
        >
          <span style={{ color: '#14532D', fontSize: 14 }}>✓</span>
          <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>
            Using Pune avg 2026 material rates · Steel ₹68/kg · Cement ₹495/bag · Sand ₹24/cft
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-[6px] text-[14px] font-semibold text-white"
          style={{ background: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}
        >
          Calculate My Structure Cost →
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  type VEInput, type VERates,
  type BuildingAge, type ExistingColumnSize, type ExistingConcreteGrade, type AuditStatus,
} from '../structopro-ve-engine'
import {
  type ConcreteGrade, type SteelGrade,
  seismicZoneFromState, INDIAN_STATES,
} from '../structopro-engine'

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_AVG: VERates = {
  cement: 410, steel: 66, sand: 28, aggregate: 45,
  formwork: 12, antiTermite: 18, bindingWire: 80, pccM10: 3200,
}

interface LabourTrade {
  id: string; name: string; workers: number; ratePerDay: number
  indiaAvgRate: number; stdProductivity: string; active: boolean; daysManual: string
}

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1',  name: 'Bar Bender (Sariya Mistri)',  workers: 2, ratePerDay: 950,  indiaAvgRate: 950,  stdProductivity: '600 kg steel/day',           active: true,  daysManual: '' },
  { id: 't2',  name: 'Shuttering Carpenter',         workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  stdProductivity: '100 sqft/day',               active: true,  daysManual: '' },
  { id: 't3',  name: 'Concreting Mason (RCC)',        workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  stdProductivity: '2.5 m³/day',                 active: true,  daysManual: '' },
  { id: 't4',  name: 'Vibrator Operator',             workers: 1, ratePerDay: 800,  indiaAvgRate: 800,  stdProductivity: 'same days as concreting',    active: true,  daysManual: '' },
  { id: 't5',  name: 'Crane / Hoist Operator',        workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, stdProductivity: 'per day — hoisting materials', active: true,  daysManual: '' },
  { id: 't6',  name: 'General Helper / Beldar',       workers: 4, ratePerDay: 580,  indiaAvgRate: 580,  stdProductivity: 'ratio to masons',            active: true,  daysManual: '' },
  { id: 't7',  name: 'Curing / Water Man',            workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  stdProductivity: '14 days per floor (IS 456)',  active: true,  daysManual: '' },
  { id: 't8',  name: 'Night Watchman',                workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  stdProductivity: 'per day',                    active: true,  daysManual: '' },
  { id: 't9',  name: 'Junior Site Engineer',          workers: 1, ratePerDay: 1500, indiaAvgRate: 1500, stdProductivity: 'per day',                    active: true,  daysManual: '' },
  { id: 't10', name: 'Site Foreman',                  workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, stdProductivity: 'per day',                    active: true,  daysManual: '' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sect({ title, badge, defaultOpen = true, children }: {
  title: string; badge?: string; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.12)', borderLeft: '3px solid #1F4E79' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        style={{ background: 'rgba(31,78,121,0.04)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 15, fontWeight: 600, color: '#1F4E79' }}>{title}</span>
          {badge && <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', background: 'rgba(31,78,121,0.12)', color: '#1F4E79' }}>{badge}</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.4)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-6 py-6 space-y-5">{children}</div>}
    </div>
  )
}

type AlertVariant = 'info' | 'caution' | 'error' | 'tip'
function AlertBox({ variant, children }: { variant: AlertVariant; children: ReactNode }) {
  const styles: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
    info:    { bg: 'rgba(31,78,121,0.05)',  border: '#1F4E79', icon: 'ⓘ', iconColor: '#1F4E79' },
    caution: { bg: 'rgba(217,154,6,0.07)', border: '#D99A06', icon: '⚠', iconColor: '#D99A06' },
    error:   { bg: 'rgba(140,58,34,0.06)', border: '#8C3A22', icon: '✕', iconColor: '#8C3A22' },
    tip:     { bg: 'rgba(20,83,45,0.06)',  border: '#14532D', icon: '✓', iconColor: '#14532D' },
  }
  const s = styles[variant]
  return (
    <div className="flex gap-3 p-4" style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      <span className="text-[15px] shrink-0 mt-0.5 font-bold" style={{ color: s.iconColor }}>{s.icon}</span>
      <div className="text-[13px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{children}</div>
    </div>
  )
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="text-left p-3 rounded-[2px] border transition-all"
      style={{ borderColor: selected ? '#1F4E79' : 'rgba(30,34,39,0.18)', background: selected ? 'rgba(31,78,121,0.07)' : '#fff' }}>
      {children}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  state:    string
  city:     string
  onSubmit: (input: VEInput) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerticalExtensionDetails({ state: initState, city: initCity, onSubmit }: Props) {
  type SubStep = '3a_existing' | '3a_new' | '3b' | '3c'
  const [subStep, setSubStep] = useState<SubStep>('3a_existing')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  const iCls = 'w-full px-4 rounded-[6px] border text-[14px] bg-white'
  const iStyle = { borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', minHeight: 48 }
  const monoStyle = { fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }
  const lCls = 'block text-[13px] font-medium mb-2'
  const lStyle = { color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }

  // ── Location ──
  const [localState, setLocalState] = useState(initState || '')
  const [localCity, setLocalCity]   = useState(initCity || '')
  const [projectName, setProjectName] = useState('')

  // ── Existing structure ──
  const [existingUpperFloors, setExistingUpperFloors] = useState<number>(1)
  const [buildingAge, setBuildingAge]                 = useState<BuildingAge>('0-5')
  const [existingColumnSize, setExistingColumnSize]   = useState<ExistingColumnSize>('300×300')
  const [existingConcreteGrade, setExistingConcreteGrade] = useState<ExistingConcreteGrade>('M20')
  const [hasStructuralDrawings, setHasStructuralDrawings] = useState<'yes' | 'no'>('no')
  const [hasStructuralAudit, setHasStructuralAudit]   = useState<AuditStatus>('no')
  const [existingFloorAreaSqft, setExistingFloorAreaSqft] = useState('')

  // ── New floors ──
  const [floorsToAdd, setFloorsToAdd]                 = useState<1 | 2 | 3>(1)
  const [newAreaSameAsExisting, setNewAreaSameAsExisting] = useState(true)
  const [newFloorAreaSqft, setNewFloorAreaSqft]       = useState('')
  const [floorHeightFt, setFloorHeightFt]             = useState('10')
  const [newConcreteGrade, setNewConcreteGrade]        = useState<ConcreteGrade>('M20')
  const [newSteelGrade, setNewSteelGrade]              = useState<SteelGrade>('Fe500')

  // ── Material rates ──
  const [rates, setRates] = useState<VERates>({ ...INDIA_AVG })

  // ── Labour ──
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]               = useState<LabourTrade[]>(INITIAL_TRADES)

  const szInfo = seismicZoneFromState(localState)

  // Contractor quote (optional)
  const [contractorQuote, setContractorQuote] = useState('')

  function updateTrade(id: string, field: keyof LabourTrade, val: string | number | boolean) {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  function validate3aExisting(): boolean {
    const errs: Record<string, string> = {}
    if (!localState) errs.state = 'Select your state'
    if (!existingFloorAreaSqft || parseFloat(existingFloorAreaSqft) < 100) errs.area = 'Enter existing floor area (min 100 sqft)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validate3aNew(): boolean {
    const errs: Record<string, string> = {}
    if (!newAreaSameAsExisting && (!newFloorAreaSqft || parseFloat(newFloorAreaSqft) < 50)) {
      errs.newArea = 'Enter area per new floor (min 50 sqft)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    const veInput: VEInput = {
      state:        localState,
      city:         localCity,
      projectName,
      existingUpperFloors,
      buildingAge,
      existingColumnSize,
      existingConcreteGrade,
      hasStructuralDrawings,
      hasStructuralAudit,
      existingFloorAreaSqft: parseFloat(existingFloorAreaSqft) || 0,
      floorsToAdd,
      newAreaSameAsExisting,
      newFloorAreaSqft:      parseFloat(newFloorAreaSqft) || parseFloat(existingFloorAreaSqft) || 0,
      floorHeightFt:         parseFloat(floorHeightFt) || 10,
      newConcreteGrade,
      newSteelGrade,
      rates,
      includeLabour,
      contractorQuote:       contractorQuote ? parseFloat(contractorQuote) : undefined,
    }
    onSubmit(veInput)
  }

  // Sub-step labels
  const SUB_STEPS: { key: SubStep; label: string }[] = [
    { key: '3a_existing', label: '3a EXISTING BLDG' },
    { key: '3a_new',      label: '3a NEW FLOORS' },
    { key: '3b',          label: '3b MATERIALS' },
    { key: '3c',          label: '3c LABOUR' },
  ]
  const currentIdx = SUB_STEPS.findIndex(s => s.key === subStep)

  // Report live form change to parent (optional — no-op here, VE doesn't use LiveSummary)
  useEffect(() => {}, [])

  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-4 py-8 px-6 md:px-10">

      {/* Header */}
      <div className="mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-[2px]"
          style={{ background: 'rgba(217,154,6,0.10)', border: '1px solid rgba(217,154,6,0.4)' }}>
          <span style={{ color: '#D99A06', fontFamily: 'var(--font-plex-mono)', fontSize: 10, letterSpacing: '0.06em' }}>
            ⚠ STRUCTURAL CERTIFICATE MANDATORY
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          P1 · VERTICAL EXTENSION — ADD FLOORS
        </p>
        <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.15 }}>
          Add Floors to Existing Building
        </h2>
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.55)', marginTop: 6 }}>
          Estimates cost of new floors only. Foundation and excavation excluded.
        </p>
      </div>

      {/* Sub-step progress bar */}
      <div className="flex items-center flex-wrap gap-x-0.5 gap-y-2 pb-4 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        {([
          { label: '1 REG',        done: true,                  active: false },
          { label: '2 METHOD',     done: true,                  active: false },
          ...SUB_STEPS.map((s, i) => ({
            label:  s.label,
            done:   i < currentIdx,
            active: i === currentIdx,
          })),
          { label: '4 RESULTS',    done: false,                 active: false },
        ] as { label: string; done: boolean; active: boolean }[]).map((s, i, arr) => (
          <div key={s.label} className="flex items-center">
            <span className="text-[10px] px-2 py-0.5 rounded-[2px]" style={{
              fontFamily: 'var(--font-plex-mono)',
              background: s.active ? '#1F4E79' : s.done ? 'rgba(20,83,45,0.08)' : 'rgba(30,34,39,0.05)',
              color: s.active ? '#fff' : s.done ? '#14532D' : 'rgba(30,34,39,0.35)',
              border: `1px solid ${s.active ? 'transparent' : s.done ? 'rgba(20,83,45,0.2)' : 'rgba(30,34,39,0.12)'}`,
              whiteSpace: 'nowrap',
            }}>
              {s.done ? '✓ ' : ''}{s.label}
            </span>
            {i < arr.length - 1 && (
              <span style={{ color: 'rgba(30,34,39,0.25)', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '0 3px' }}>—</span>
            )}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          STEP 3a — PART 1: EXISTING STRUCTURE DETAILS
         ════════════════════════════════════════════════════════════════ */}
      {subStep === '3a_existing' && (<>

        {/* IS 1893:2016 Safety Warning */}
        <div className="p-5 rounded-[2px]" style={{ background: 'rgba(140,58,34,0.05)', border: '2px solid #8C3A2240' }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)', letterSpacing: '0.04em' }}>
            ⚠️ IS 1893:2016 + IS 456:2000 — MANDATORY SAFETY ADVISORY
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Adding floors to an existing building increases loads on existing foundations and columns. A structural audit by a licensed engineer is{' '}
            <strong>MANDATORY</strong> before adding floors. NirmanShastra calculates the additional material cost only — suitability of the existing structure must be certified by a structural engineer.
          </p>
          <p className="text-[11px] mt-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
            Ref: IS 1893:2016 Cl 7.3 · IS 456:2000 · IS 13920:2016 · SP 34
          </p>
        </div>

        {/* Location */}
        <Sect title="1 — Project location">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lCls} style={lStyle}>Project Name (optional)</label>
              <input className={iCls} style={iStyle} placeholder="e.g. Sharma Residence — VE Phase" value={projectName} onChange={e => setProjectName(e.target.value)} />
            </div>
            <div>
              <label className={lCls} style={lStyle}>State *</label>
              <select className={iCls} style={iStyle} value={localState} onChange={e => setLocalState(e.target.value)}>
                <option value="">— Select State / UT —</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-[11px] mt-1" style={{ color: '#8C3A22' }}>{errors.state}</p>}
            </div>
            <div>
              <label className={lCls} style={lStyle}>City</label>
              <input className={iCls} style={iStyle} placeholder="e.g. Pune" value={localCity} onChange={e => setLocalCity(e.target.value)} />
            </div>
          </div>
          {localState && (
            <div className="p-3 rounded-[2px]" style={{ background: '#1F4E7910', border: '1px solid #1F4E7930' }}>
              <span className="text-[11px] font-medium" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
                IS 1893:2016 — Auto-detected: Seismic Zone {szInfo.zone} (Z = {szInfo.zFactor})
              </span>
            </div>
          )}
        </Sect>

        {/* Existing structure fields */}
        <Sect title="2 — Existing structure details">
          <div className="grid grid-cols-2 gap-4">

            {/* How many floors does the existing building have? */}
            <div className="col-span-2 sm:col-span-1">
              <label className={lCls} style={lStyle}>How many floors does the existing building have?</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { label: 'G', val: 0, note: 'Ground only' },
                  { label: 'G+1', val: 1, note: '2 floors total' },
                  { label: 'G+2', val: 2, note: '3 floors total' },
                  { label: 'G+3', val: 3, note: '4 floors total' },
                ] as { label: string; val: number; note: string }[]).map(opt => (
                  <OptionCard key={opt.val} selected={existingUpperFloors === opt.val} onClick={() => setExistingUpperFloors(opt.val)}>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold" style={{ color: existingUpperFloors === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{opt.label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>{opt.note}</p>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* How old is the existing building? */}
            <div className="col-span-2 sm:col-span-1">
              <label className={lCls} style={lStyle}>How old is the existing building?</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: '0 – 5 yrs',   val: '0-5' },
                  { label: '5 – 10 yrs',  val: '5-10' },
                  { label: '10 – 20 yrs', val: '10-20' },
                  { label: '20+ yrs',     val: '20+' },
                ] as { label: string; val: BuildingAge }[]).map(opt => (
                  <OptionCard key={opt.val} selected={buildingAge === opt.val} onClick={() => setBuildingAge(opt.val)}>
                    <p className="text-[12px] font-medium text-center" style={{ color: buildingAge === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{opt.label}</p>
                  </OptionCard>
                ))}
              </div>
              {buildingAge === '20+' && (
                <p className="text-[11px] mt-1.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                  ⚠ Buildings over 20 years require a thorough structural audit before any vertical extension. Carbonation of concrete and corrosion of steel may have reduced capacity.
                </p>
              )}
            </div>

            {/* Existing column size */}
            <div className="col-span-2 sm:col-span-1">
              <label className={lCls} style={lStyle}>What is the existing column size?</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { label: '230×230mm', val: '230×230', note: 'Rated G only' },
                  { label: '300×300mm', val: '300×300', note: 'Rated G+1' },
                  { label: '350×350mm', val: '350×350', note: 'Rated G+2' },
                  { label: '400×400mm', val: '400×400', note: 'Rated G+3+' },
                ] as { label: string; val: ExistingColumnSize; note: string }[]).map(opt => (
                  <OptionCard key={opt.val} selected={existingColumnSize === opt.val} onClick={() => setExistingColumnSize(opt.val)}>
                    <p className="text-[12px] font-semibold" style={{ color: existingColumnSize === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{opt.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>{opt.note}</p>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* Existing concrete grade */}
            <div className="col-span-2 sm:col-span-1">
              <label className={lCls} style={lStyle}>What is the existing concrete grade?</label>
              <div className="grid grid-cols-2 gap-2">
                {(['M15', 'M20', 'M25', 'Unknown'] as ExistingConcreteGrade[]).map(g => (
                  <OptionCard key={g} selected={existingConcreteGrade === g} onClick={() => setExistingConcreteGrade(g)}>
                    <p className="text-[12px] font-semibold text-center" style={{ color: existingConcreteGrade === g ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{g}</p>
                  </OptionCard>
                ))}
              </div>
              {existingConcreteGrade === 'M15' && (
                <p className="text-[11px] mt-1.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                  ⚠ M15 is below IS 456:2000 minimum for RCC (M20). This structure requires evaluation before loading.
                </p>
              )}
              {existingConcreteGrade === 'Unknown' && (
                <p className="text-[11px] mt-1.5" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-sans)' }}>
                  A non-destructive core test (rebound hammer / carbonation test) by a structural engineer is recommended.
                </p>
              )}
            </div>

            {/* Structural drawings */}
            <div>
              <label className={lCls} style={lStyle}>Do you have the original structural drawings?</label>
              <div className="flex gap-3 mt-2">
                {(['yes', 'no'] as const).map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hasDrg" checked={hasStructuralDrawings === opt} onChange={() => setHasStructuralDrawings(opt)} style={{ accentColor: '#1F4E79' }} />
                    <span className="text-[13px] capitalize" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{opt}</span>
                  </label>
                ))}
              </div>
              {hasStructuralDrawings === 'yes' && (
                <p className="text-[11px] mt-1.5" style={{ color: '#14532D', fontFamily: 'var(--font-plex-sans)' }}>
                  ✓ Structural drawings significantly reduce the risk of incorrect column load assumptions.
                </p>
              )}
            </div>

            {/* Structural audit */}
            <div>
              <label className={lCls} style={lStyle}>Has a structural audit been done?</label>
              <div className="flex flex-col gap-2 mt-2">
                {([
                  { val: 'yes',      label: 'Yes — have the audit report' },
                  { val: 'no',       label: 'No' },
                  { val: 'planning', label: 'Planning to get one' },
                ] as { val: AuditStatus; label: string }[]).map(opt => (
                  <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hasAudit" checked={hasStructuralAudit === opt.val} onChange={() => setHasStructuralAudit(opt.val)} style={{ accentColor: '#1F4E79' }} />
                    <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {hasStructuralAudit === 'no' && (
                <AlertBox variant="caution">
                  <strong>Structural audit strongly recommended.</strong> An audit costs ₹15,000–₹50,000 and can prevent ₹10–₹50 lakh in remediation costs if hidden defects are found after construction.
                </AlertBox>
              )}
            </div>

            {/* Existing floor area */}
            <div className="col-span-2">
              <label className={lCls} style={lStyle}>Existing floor area (sqft) *</label>
              <input
                className={iCls}
                style={{ ...iStyle, ...monoStyle }}
                type="number" min="100" placeholder="e.g. 1200"
                value={existingFloorAreaSqft}
                onChange={e => setExistingFloorAreaSqft(e.target.value)}
              />
              <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
                Area of a single floor of the existing building. Used to estimate column count and splice bar quantities.
              </p>
              {errors.area && <p className="text-[11px] mt-1" style={{ color: '#8C3A22' }}>{errors.area}</p>}
            </div>
          </div>
        </Sect>

        <div className="pt-2">
          <button type="button"
            onClick={() => { if (validate3aExisting()) setSubStep('3a_new') }}
            className="w-full py-3 rounded-[6px] font-semibold text-[15px]"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
            Continue — New Floors →
          </button>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════
          STEP 3a — PART 2: NEW FLOORS TO ADD
         ════════════════════════════════════════════════════════════════ */}
      {subStep === '3a_new' && (<>

        <AlertBox variant="caution">
          <strong>Foundation not included.</strong> This estimate covers new floor materials only. Your structural engineer must separately certify existing foundation adequacy for the additional load.
        </AlertBox>

        <Sect title="3 — New floors to add">
          <div className="grid grid-cols-2 gap-4">

            {/* Number of floors to add */}
            <div className="col-span-2">
              <label className={lCls} style={lStyle}>How many floors to add?</label>
              <div className="flex gap-3">
                {([1, 2, 3] as const).map(n => (
                  <OptionCard key={n} selected={floorsToAdd === n} onClick={() => setFloorsToAdd(n)}>
                    <div className="w-16 text-center">
                      <p className="text-[22px] font-bold" style={{ color: floorsToAdd === n ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{n}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>{n === 1 ? 'floor' : 'floors'}</p>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* Same area or different */}
            <div className="col-span-2">
              <label className={lCls} style={lStyle}>Same area as existing or different?</label>
              <div className="flex gap-4 mt-2">
                {([
                  { val: true,  label: 'Same area as existing', note: `${existingFloorAreaSqft || '—'} sqft per floor` },
                  { val: false, label: 'Different area', note: 'Enter area per new floor' },
                ] as { val: boolean; label: string; note: string }[]).map(opt => (
                  <label key={String(opt.val)} className="flex-1 flex items-start gap-2 cursor-pointer p-3 rounded-[2px] border transition-all"
                    style={{ borderColor: newAreaSameAsExisting === opt.val ? '#1F4E79' : 'rgba(30,34,39,0.18)', background: newAreaSameAsExisting === opt.val ? 'rgba(31,78,121,0.06)' : '#fff' }}>
                    <input type="radio" name="sameArea" checked={newAreaSameAsExisting === opt.val} onChange={() => setNewAreaSameAsExisting(opt.val)} style={{ accentColor: '#1F4E79', marginTop: 2 }} />
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{opt.label}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>{opt.note}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {!newAreaSameAsExisting && (
              <div className="col-span-2">
                <label className={lCls} style={lStyle}>Area per new floor (sqft) *</label>
                <input
                  className={iCls}
                  style={{ ...iStyle, ...monoStyle }}
                  type="number" min="50" placeholder="e.g. 1000"
                  value={newFloorAreaSqft}
                  onChange={e => setNewFloorAreaSqft(e.target.value)}
                />
                {errors.newArea && <p className="text-[11px] mt-1" style={{ color: '#8C3A22' }}>{errors.newArea}</p>}
              </div>
            )}

            {/* Floor-to-floor height */}
            <div>
              <label className={lCls} style={lStyle}>Floor-to-floor height (ft)</label>
              <input
                className={iCls}
                style={{ ...iStyle, ...monoStyle }}
                type="number" min="8" max="20" step="0.5"
                value={floorHeightFt}
                onChange={e => setFloorHeightFt(e.target.value)}
              />
              <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>
                NBC 2016 min: 9 ft (2.75m) · default 10 ft
              </p>
            </div>

            {/* Concrete grade for new floors */}
            <div>
              <label className={lCls} style={lStyle}>Concrete grade for new floors</label>
              <select className={iCls} style={{ ...iStyle, ...monoStyle }}
                value={newConcreteGrade} onChange={e => setNewConcreteGrade(e.target.value as ConcreteGrade)}>
                <option value="M20">M20 — IS 456 minimum</option>
                <option value="M25">M25 — recommended (Zone III+)</option>
                <option value="M30">M30 — severe exposure</option>
                <option value="M35">M35 — coastal / very severe</option>
              </select>
              {existingConcreteGrade !== 'Unknown' && existingConcreteGrade !== newConcreteGrade && (
                <p className="text-[11px] mt-1" style={{ color: '#D99A06', fontFamily: 'var(--font-plex-sans)' }}>
                  ⚠ New floor grade ({newConcreteGrade}) differs from existing ({existingConcreteGrade}). Structural engineer must approve grade transitions at the junction.
                </p>
              )}
            </div>

            {/* Steel grade */}
            <div className="col-span-2">
              <label className={lCls} style={lStyle}>Steel grade for new floors</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { val: 'Fe500',  label: 'Fe500',  note: 'Standard residential' },
                  { val: 'Fe500D', label: 'Fe500D', note: 'Zone III–V (ductile)' },
                  { val: 'Fe550D', label: 'Fe550D', note: 'High-rise seismic' },
                  { val: 'Fe415',  label: 'Fe415',  note: 'Old standard' },
                ] as { val: SteelGrade; label: string; note: string }[]).map(opt => (
                  <OptionCard key={opt.val} selected={newSteelGrade === opt.val} onClick={() => setNewSteelGrade(opt.val)}>
                    <p className="text-[12px] font-semibold" style={{ color: newSteelGrade === opt.val ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-mono)' }}>{opt.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>{opt.note}</p>
                  </OptionCard>
                ))}
              </div>
              {localState && ['III','IV','V'].includes(szInfo.zone) && newSteelGrade === 'Fe500' && (
                <p className="text-[11px] mt-1.5" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
                  ⚠ Seismic Zone {szInfo.zone}: IS 13920:2016 mandates Fe500D or Fe550D for ductile detailing.
                </p>
              )}
            </div>
          </div>

          {/* Summary of VE scope */}
          <div className="mt-2 p-4 rounded-[2px]" style={{ background: '#1E22270A', border: '1px solid #1E222720' }}>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              VERTICAL EXTENSION SCOPE SUMMARY
            </p>
            <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }}>
              <span>Existing:</span>
              <span>{existingUpperFloors === 0 ? 'G' : `G+${existingUpperFloors}`} ({existingFloorAreaSqft || '—'} sqft)</span>
              <span>Adding:</span>
              <span>{floorsToAdd} floor{floorsToAdd > 1 ? 's' : ''} ({newAreaSameAsExisting ? `${existingFloorAreaSqft || '—'}` : `${newFloorAreaSqft || '—'}`} sqft each)</span>
              <span>Resulting height:</span>
              <span>{existingUpperFloors + floorsToAdd === 0 ? 'G' : `G+${existingUpperFloors + floorsToAdd}`}</span>
              <span>New BUA:</span>
              <span>
                {(() => {
                  const area = newAreaSameAsExisting ? (parseFloat(existingFloorAreaSqft) || 0) : (parseFloat(newFloorAreaSqft) || 0)
                  return `${(area * floorsToAdd).toFixed(0)} sqft`
                })()}
              </span>
              <span>Foundation:</span>
              <span style={{ color: '#8C3A22' }}>EXCLUDED (engineer review required)</span>
              <span>Excavation:</span>
              <span style={{ color: '#8C3A22' }}>EXCLUDED</span>
              <span>Splice bars:</span>
              <span style={{ color: '#14532D' }}>+8% steel (IS 456 Cl 26.2.5)</span>
            </div>
          </div>
        </Sect>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setSubStep('3a_existing')}
            className="flex-none px-5 py-3 rounded-[6px] text-[14px]"
            style={{ border: '1.5px solid #1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            ← Back
          </button>
          <button type="button"
            onClick={() => { if (validate3aNew()) setSubStep('3b') }}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
            Continue to Material Rates →
          </button>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════
          STEP 3b: MATERIAL RATES
         ════════════════════════════════════════════════════════════════ */}
      {subStep === '3b' && (<>
        <div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            3b · MATERIAL RATES
          </p>
          <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
            Enter Your Local Material Rates
          </h3>
        </div>

        <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            <strong>Why local rates matter:</strong> IS codes give exact quantities — but material prices vary 20–40% between cities. India averages are pre-filled as a starting point.
          </p>
        </div>

        <AlertBox variant="caution">
          Get quotes from <strong>at least 3 suppliers</strong>. Contractor-supplied material is typically 8–15% above market rate.
        </AlertBox>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'cement',      label: 'Cement (OPC/PPC)',    unit: '₹/50kg bag', avg: INDIA_AVG.cement      },
            { key: 'steel',       label: 'Steel TMT Fe500',     unit: '₹/kg',       avg: INDIA_AVG.steel       },
            { key: 'sand',        label: 'Sand (M-sand)',        unit: '₹/cft',      avg: INDIA_AVG.sand        },
            { key: 'aggregate',   label: 'Aggregate 20mm',       unit: '₹/cft',      avg: INDIA_AVG.aggregate   },
            { key: 'formwork',    label: 'Formwork',             unit: '₹/sqft BUA', avg: INDIA_AVG.formwork    },
            { key: 'bindingWire', label: 'Binding Wire',         unit: '₹/kg',       avg: INDIA_AVG.bindingWire },
          ] as { key: keyof VERates; label: string; unit: string; avg: number }[]).map(({ key, label, unit, avg }) => (
            <div key={key} className="p-3 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.15)', background: '#fff' }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{unit}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[2px] whitespace-nowrap" style={{ background: 'rgba(30,34,39,0.05)', color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  Avg: ₹{avg}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input
                  type="number" min="0"
                  className="w-full pl-7 pr-3 py-2 rounded-[6px] border text-[13px]"
                  style={{ borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227', fontFamily: 'var(--font-plex-mono)', background: '#fff' }}
                  value={rates[key]}
                  onChange={e => setRates(r => ({ ...r, [key]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => setRates({ ...INDIA_AVG })}
            className="px-4 py-2 rounded-[6px] text-[12px]"
            style={{ color: '#1E222780', border: '1px solid #1E222730', fontFamily: 'var(--font-plex-sans)' }}>
            Reset to India Average
          </button>
        </div>

        {/* Optional contractor quote */}
        <Sect title="Contractor Quote (Optional)" defaultOpen={false}>
          <AlertBox variant="info">
            Enter your contractor&apos;s total quote now. We&apos;ll compare it against our IS-code calculated quantities after payment and flag inflated items.
          </AlertBox>
          <div>
            <label className={lCls} style={lStyle}>Contractor total quote (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
              <input className="w-full pl-7 pr-3 py-2 rounded-[2px] border text-[13px]"
                style={{ ...iStyle, ...monoStyle }}
                type="number" min="0" placeholder="0"
                value={contractorQuote} onChange={e => setContractorQuote(e.target.value)} />
            </div>
          </div>
        </Sect>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="button" onClick={() => setSubStep('3a_new')}
            className="flex-none px-5 py-3 rounded-[6px] text-[14px]"
            style={{ border: '1.5px solid #1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            ← Back
          </button>
          <button type="button" onClick={() => setSubStep('3c')}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
            Continue to Labour →
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
            style={{ background: 'transparent', color: '#8C3A22', border: '1.5px solid #8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
            Skip Labour — Calculate Now →
          </button>
        </div>
      </>)}

      {/* ════════════════════════════════════════════════════════════════
          STEP 3c: LABOUR
         ════════════════════════════════════════════════════════════════ */}
      {subStep === '3c' && (<>
        <div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            3c · LABOUR ESTIMATION
          </p>
          <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
            Include Labour Cost? (Optional)
          </h3>
        </div>

        <AlertBox variant="caution">
          <strong>VE labour premium:</strong> Vertical extension work typically costs 10–20% more than equivalent new construction per sqft due to hoisting, access restrictions, and smaller concrete batches per pour. CPWD DSR 2023 rates are pre-loaded as a starting point.
        </AlertBox>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={() => setIncludeLabour(true)}
            className="p-4 rounded-[2px] text-left transition-all"
            style={{ border: `2px solid ${includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Include Labour Cost</p>
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>CPWD DSR 2023 rates. Edit workers and rate per trade. Labour appears only in paid PDF report.</p>
          </button>
          <button type="button" onClick={() => setIncludeLabour(false)}
            className="p-4 rounded-[2px] text-left transition-all"
            style={{ border: `2px solid ${!includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: !includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: !includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Skip — Material Cost Only</p>
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour from your contractor quote.</p>
          </button>
        </div>

        {includeLabour && (
          <div className="overflow-x-auto">
            <AlertBox variant="tip">
              <strong>Enter 0 workers</strong> to exclude any trade. Labour subtotals appear only in your paid PDF report.
            </AlertBox>
            <table className="w-full text-[12px] border-collapse mt-3">
              <thead>
                <tr style={{ background: '#1E22270A' }}>
                  {['Active', 'Trade', 'Workers', 'Rate/Day (₹)', 'CPWD Productivity', 'Days (manual)'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', borderBottom: '1px solid #1E222720' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1E222710', opacity: t.active ? 1 : 0.45 }}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={t.active} onChange={e => updateTrade(t.id, 'active', e.target.checked)} style={{ accentColor: '#1F4E79' }} />
                    </td>
                    <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{t.name}</td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateTrade(t.id, 'workers', Math.max(0, t.workers - 1))} className="w-6 h-6 rounded-[2px] border text-[12px] flex items-center justify-center" style={{ borderColor: '#1E222730' }}>−</button>
                        <input className="w-10 text-center px-1 py-0.5 rounded-[2px] border text-[12px]"
                          style={{ borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
                          type="number" min="0" value={t.workers}
                          onChange={e => updateTrade(t.id, 'workers', parseInt(e.target.value) || 0)} />
                        <button type="button" onClick={() => updateTrade(t.id, 'workers', t.workers + 1)} className="w-6 h-6 rounded-[2px] border text-[12px] flex items-center justify-center" style={{ borderColor: '#1E222730' }}>+</button>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <input className="w-20 px-2 py-1 rounded-[2px] border text-[12px]"
                          style={{ borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
                          type="number" value={t.ratePerDay}
                          onChange={e => updateTrade(t.id, 'ratePerDay', parseInt(e.target.value) || 0)} />
                        <span className="text-[10px] whitespace-nowrap" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>avg: {t.indiaAvgRate}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px]" style={{ color: '#1E222770', fontFamily: 'var(--font-plex-mono)', whiteSpace: 'nowrap' }}>{t.stdProductivity}</td>
                    <td className="px-2 py-1">
                      <input className="w-16 px-2 py-1 rounded-[2px] border text-[12px]"
                        style={{ borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-mono)' }}
                        placeholder="auto" value={t.daysManual}
                        onChange={e => updateTrade(t.id, 'daysManual', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setSubStep('3b')}
            className="flex-none px-5 py-3 rounded-[6px] text-[14px]"
            style={{ border: '1.5px solid #1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            ← Back
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px]"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}>
            Calculate My Estimate →
          </button>
        </div>

        <p className="text-[11px] text-center" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
          Free: grand total range + IS compliance checks. Itemised BOQ requires ₹499 unlock.
        </p>
      </>)}
    </form>
  )
}

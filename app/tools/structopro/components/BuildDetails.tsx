'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { INDIAN_STATES } from '@/lib/structopro-qty/states'
import { seismicZoneFor } from '@/lib/structopro-qty/zones'
import { SITE } from '@/lib/structopro-qty/sites'
import type { QtyInput, SiteCondition, WallType } from '@/lib/structopro-qty/types'
import { buildingLabelStilt } from '@/lib/structopro-qty/labels'
import { Field, Input, Select, Note, IcArrow, IcAlert, IcCheck } from '@/components/v2/inner/kit'
import { Tip, type TipInfo } from '@/components/v2/inner/Tip'
import Disclosure from '@/components/v2/inner/Disclosure'
import { TOOLS } from '@/lib/v2/content'

/*
  Build details: a short form that only asks what a layman can answer.
  City, floors and the area of each floor, an open parking level (stilt), balconies, the ground, the wall material,
  the roof use, and (optional) the plot size.
  Concrete grade, steel grade, bar sizes, column sizes, slab thickness, foundation type and depth are worked out
  on the server from IS 456, IS 875, IS 1893 and IS 13920 and are stated in the report.
  No rates and no labour are asked: this tool reports quantities.
*/

const TOOL = TOOLS.find(t => t.key === 'struct')!

const FLOOR_LABELS = ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor', 'Fifth floor']
const MAX_G = 5 // G+5 is the tallest the form offers: beyond it a structural engineer is needed from day one
const MAX_G_STILT = 4 // an open parking level plus 5 floors is the same six storeys as G+5, so 5 floors above it is the most

// ─── Site cards ───────────────────────────────────────────────────────────────

const SITE_CARDS: { value: SiteCondition; label: string; note: string }[] = [
  { value: 'flat',         label: 'Flat ground',       note: 'Level site, no cutting needed' },
  { value: 'sloped_mild',  label: 'Mild slope',        note: 'Up to 10°, minor earthwork' },
  { value: 'sloped_steep', label: 'Steep slope',       note: 'Over 10°, retaining walls likely' },
  { value: 'rocky',        label: 'Rocky',             note: 'Hard rock, good bearing' },
  { value: 'bcs',          label: 'Black cotton soil', note: 'Expansive clay that swells and shrinks' },
  { value: 'soft_marshy',  label: 'Soft or marshy',    note: 'Low bearing, ground gives under foot' },
  { value: 'waterlogged',  label: 'Waterlogged',       note: 'Water table near the surface' },
  { value: 'coastal',      label: 'Coastal',           note: 'Salt-laden air near the sea' },
]

// Small line drawings for the cards. Decorative only.
const SITE_ICON: Record<string, ReactNode> = {
  flat:         <><path d="M3 11h18" /><path d="M6 15h12M9 19h6" /></>,
  sloped_mild:  <><path d="M3 16l18-6" /><path d="M3 20h18" /></>,
  sloped_steep: <><path d="M3 19L19 5" /><path d="M3 21h18" /></>,
  rocky:        <><path d="M12 3.5l7 4v8l-7 4-7-4v-8z" /><path d="M12 11.5l7-4M12 11.5v8M12 11.5l-7-4" /></>,
  bcs:          <><path d="M3 8h18" /><path d="M8 8l-1.5 4 2 3-1 5M15 8l1.5 3.5-1.5 3 1 5.5" /></>,
  soft_marshy:  <><path d="M3 14q3-3 6 0t6 0 6 0" /><path d="M3 19q3-3 6 0t6 0 6 0" /><path d="M7 11V5M12 11V3M17 11V6" /></>,
  waterlogged:  <><path d="M3 8h18" /><path d="M3 13q3-3 6 0t6 0 6 0" /><path d="M3 18q3-3 6 0t6 0 6 0" /></>,
  coastal:      <><path d="M3 17q3-5 6 0t6 0 6 0" /><circle cx="17" cy="7" r="2.5" /></>,
}

const WALLS: { value: WallType; label: string; note: string }[] = [
  { value: 'brick', label: 'Burnt clay brick', note: '230 mm outer walls, 115 mm inner walls' },
  { value: 'block', label: 'Concrete or AAC block', note: 'Lighter walls, so a lighter frame' },
]

const INFO: Record<string, TipInfo> = {
  seismic: { title: 'Earthquake zone', body: 'Worked out from your town. Higher zones need closer stirrups, more steel at joints and stronger columns. You do not need to choose anything here.', is: 'IS 1893 (Part 1)' },
  terrace: { title: 'Roof as a terrace', body: 'A roof people walk on, dry clothes on or put a tank on carries about twice the live load of a roof that is only reached for repairs. It changes the beam and column sizes.', is: 'IS 875 (Part 2) Table 1' },
  plot: { title: 'Plot size', body: 'Only the shape of the plot is used (long and thin, or squarish) to pick a sensible column grid. It does not change the area you entered above.' },
  stilt: { title: 'Open parking level (stilt)', body: 'The ground level has columns and a roof slab but no walls, so cars can park under the house. An open level is the weak storey in an earthquake, so the columns there are made larger and the design force there is raised. List only the floors above it.', is: 'IS 1893 (Part 1) cl 7.1 and Table 6' },
  balcony: { title: 'Balconies', body: 'Count a balcony only if it sticks out beyond the walls of the floor below. It hangs from the floor slab like a shelf, so it needs its own thick slab and extra top bars. A balcony set inside the floor outline is already part of the floor area.', is: 'IS 456 cl 23.2.1 (cantilever), IS 875 (Part 2)' },
  site: { title: 'Ground', body: 'Pick the closest match. The report states the safe bearing capacity it assumed for your choice. A soil test report replaces that assumption and should come before any foundation work.', is: 'IS 1904; IS 6403' },
}

const HIMALAYAN = ['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura','Jammu and Kashmir','Ladakh','Uttarakhand','Himachal Pradesh']

// ─── Small pieces ─────────────────────────────────────────────────────────────

interface ISBadge { variant: 'green' | 'amber' | 'red'; text: string }

function IsBadge({ variant, text }: ISBadge) {
  const Icon = variant === 'green' ? IcCheck : IcAlert
  const lead = variant === 'red' ? 'Problem: ' : variant === 'amber' ? 'Warning: ' : 'OK: '
  return (
    <p className={`ns-i-isb ns-i-isb--${variant}`}>
      <Icon />
      <span><span className="ns-sr">{lead}</span>{text}</span>
    </p>
  )
}

// Elevation sketch: ground floor at the bottom, floors stack upward, bar width = area
function ElevationDiagram({ floors, stilt }: { floors: { label: string; area: number }[]; stilt: boolean }) {
  if (!floors.some(f => f.area > 0)) return null
  const maxArea = Math.max(...floors.map(f => f.area), 1)
  const svgH = 160, svgW = 280, maxBarW = 220, baseY = svgH - 16
  const barH = Math.max(14, Math.min(34, (svgH - 30) / (floors.length + (stilt ? 1 : 0))))
  // the open parking level is drawn as columns under the first floor
  const openH = stilt ? barH : 0
  const firstW = (floors[0].area / maxArea) * maxBarW
  let curY = baseY - openH
  const rects = floors.map(f => {
    const w = (f.area / maxArea) * maxBarW
    const r = { x: (svgW - w) / 2, y: curY - barH, w, h: barH, label: f.label, area: f.area }
    curY -= barH
    return r
  })
  const summary = floors.map(f => `${f.label} ${f.area.toFixed(0)} sq ft`).join(', ')
  return (
    <figure className="ns-i-elev">
      <figcaption className="ns-i-elev__t">Your building from the side</figcaption>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label={`Side sketch, ${stilt ? 'open parking level' : 'ground floor'} at the bottom. ${summary}.`}>
        <line x1={10} y1={baseY} x2={svgW - 10} y2={baseY} strokeWidth={1} />
        {stilt && firstW > 0 && (
          <g>
            {[0, 0.5, 1].map(t => <line key={t} x1={(svgW - firstW) / 2 + t * firstW} y1={baseY} x2={(svgW - firstW) / 2 + t * firstW} y2={baseY - openH} strokeWidth={2} />)}
            <text x={svgW / 2} y={baseY - openH / 2 + 3.5} textAnchor="middle">Open parking level</text>
          </g>
        )}
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} style={{ fillOpacity: 0.16 + i * 0.08 }} />
            <text x={svgW / 2} y={r.y + r.h / 2 + 3.5} textAnchor="middle">{r.label} {r.area > 0 ? `${r.area.toFixed(0)} sqft` : ''}</text>
          </g>
        ))}
        <text className="ns-i-elev__gl" x={svgW - 5} y={baseY + 12} textAnchor="end">G.L.</text>
      </svg>
      <p className="ns-i-fine">{stilt ? 'The open parking level is at the bottom. ' : 'Ground floor at the bottom. '}Bar width shows the floor area.</p>
    </figure>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectInitData {
  projectId:     string
  projectName:   string
  city:          string
  state:         string
  numFloors:     number | null   // total floors (G=1, G+1=2 …)
  perFloorAreas: number[] | null
}

interface Props {
  state:           string
  city:            string
  projectName?:    string
  initialProject?: ProjectInitData
  onSubmit:        (input: QtyInput) => void
  onFormChange?:   (data: Record<string, unknown>) => void
  onBack?:         () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BuildDetails({ state: initState, city: initCity, initialProject, onSubmit, onFormChange, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [localState, setLocalState] = useState(initState || '')
  const [localCity, setLocalCity]   = useState(initCity || '')

  // floors: the project stores the total number of floors (G = 1), the form talks in G+n
  const initG = initialProject?.numFloors != null ? Math.min(MAX_G, Math.max(0, initialProject.numFloors - 1)) : 1
  const initAreas = initialProject?.perFloorAreas ?? null
  const [stilt, setStilt] = useState(false)
  const [balconies, setBalconies] = useState(0)
  const [balconyDepth, setBalconyDepth] = useState<1 | 1.2 | 1.5>(1.2)
  const [numFloors, setNumFloors] = useState(initG)
  const [sameArea, setSameArea]   = useState(!initAreas || initAreas.length <= 1)
  const [groundArea, setGroundArea] = useState(initAreas?.length === 1 && initAreas[0] > 0 ? String(initAreas[0]) : '')
  const [areas, setAreas] = useState<string[]>(() =>
    initAreas && initAreas.length > 1 ? initAreas.map(a => (a > 0 ? String(a) : '')) : Array(initG + 1).fill(''),
  )

  const [site, setSite] = useState<SiteCondition | null>(null)
  const [wall, setWall] = useState<WallType>('brick')
  const [terrace, setTerrace] = useState(true)
  const [plotL, setPlotL] = useState('')
  const [plotW, setPlotW] = useState('')

  // keep one area box per floor
  useEffect(() => {
    const count = numFloors + 1
    setAreas(prev => (prev.length === count ? prev : [...prev, ...Array(Math.max(0, count - prev.length)).fill('')].slice(0, count)))
  }, [numFloors])

  // with an open parking level, the floors you list sit above it, so the first one is the "first floor"
  const floorLabel = (i: number) => (stilt ? FLOOR_LABELS[i + 1] : FLOOR_LABELS[i]) ?? `Floor ${i + (stilt ? 1 : 0)}`
  function toggleStilt(on: boolean) {
    setStilt(on)
    if (on && numFloors > MAX_G_STILT) setNumFloors(MAX_G_STILT)
  }

  const zone = useMemo(() => (localState ? seismicZoneFor(localState, localCity) : null), [localState, localCity])

  const floorAreas: number[] = useMemo(
    () => (sameArea ? Array(numFloors + 1).fill(parseFloat(groundArea) || 0) : areas.slice(0, numFloors + 1).map(a => parseFloat(a) || 0)),
    [sameArea, numFloors, groundArea, areas],
  )

  // ── IS 1893:2016 Table 6 and IS 456 cl 23.2.1: does the shape stack up? (only when floors differ) ──
  const checks = useMemo(() => {
    const perFloor: ISBadge[][] = floorAreas.map(() => [])
    let block = false
    let irregular = false
    if (!sameArea) {
      for (let i = 1; i < floorAreas.length; i++) {
        const lower = floorAreas[i - 1], upper = floorAreas[i]
        if (lower <= 0 || upper <= 0) continue
        const lowerSide = Math.sqrt(lower * 0.0929), upperSide = Math.sqrt(upper * 0.0929)
        const dimRatio = upperSide / lowerSide
        const cantM = Math.max(0, (upperSide - lowerSide) / 2)
        const areaRatio = upper / lower
        const dimPct = Math.round((dimRatio - 1) * 100)
        const areaPct = Math.round((areaRatio - 1) * 100)
        const cant = cantM.toFixed(2)
        const beamDepth = Math.ceil(cantM * 142)
        const row: ISBadge[] = []
        if (dimRatio > 1.5) { row.push({ variant: 'red', text: `This floor is ${dimPct}% wider than the one below. That needs a transfer structure and a dynamic analysis (IS 1893 Table 6).` }); irregular = true }
        else if (dimRatio > 1.25) { row.push({ variant: 'amber', text: `This floor is ${dimPct}% wider than the one below. In Zones III to V a dynamic analysis is needed (IS 1893 Table 6).` }); irregular = true }
        if (areaRatio > 1.5) { row.push({ variant: 'amber', text: `${floorLabel(i)} is ${areaPct}% heavier than the floor below (IS 1893 Table 6, mass irregularity).` }); irregular = true }
        if (cantM > 3) { row.push({ variant: 'red', text: `A ${cant} m overhang needs a beam about ${beamDepth} mm deep. That is not practical in ordinary RCC. Revise the floor areas (IS 456 cl 23.2.1).` }); block = true; irregular = true }
        else if (cantM > 1.5) { row.push({ variant: 'amber', text: `A ${cant} m overhang needs a deep transfer beam (about ${beamDepth} mm). A structural engineer must design it.` }); irregular = true }
        else if (cantM > 0) { row.push({ variant: 'green', text: `Overhang of ${cant} m is in the ordinary range.` }) }
        perFloor[i] = row
      }
    }
    const heightM = (floorAreas.length + (stilt ? 1 : 0)) * 3.0
    const valid = floorAreas.filter(a => a > 0)
    const baseDim = valid.length ? Math.sqrt(Math.min(...valid) * 0.0929) : 0
    const slender = baseDim > 0 && heightM > 5 * baseDim
    return { perFloor, block, irregular, slender }
  }, [sameArea, floorAreas, stilt]) // eslint-disable-line react-hooks/exhaustive-deps

  // the rail on the right ("your project so far")
  useEffect(() => {
    if (!onFormChange) return
    const total = floorAreas.reduce((s, a) => s + a, 0)
    onFormChange({
      floors: buildingLabelStilt(numFloors + 1, stilt),
      bua: Math.round(total),
      siteCondition: site ? SITE_CARDS.find(c => c.value === site)?.label : undefined,
      wallType: WALLS.find(w => w.value === wall)?.label,
    })
  }, [numFloors, floorAreas, site, wall, stilt]) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!localState) errs.state = 'Choose your state'
    if (!site) errs.site = 'Choose the ground that is closest to your site'
    if (sameArea && (!(parseFloat(groundArea) >= 100) || parseFloat(groundArea) > 30000)) errs.area = 'Enter the area of one floor in sq ft (100 to 30,000)'
    if (!sameArea && floorAreas.some(a => !(a >= 100) || a > 30000)) errs.floors = 'Enter an area between 100 and 30,000 sq ft for every floor'
    const pl = plotL.trim(), pw = plotW.trim()
    if ((pl && !pw) || (!pl && pw)) errs.plot = 'Give both sides of the plot, or leave both empty'
    if (pl && pw && !(parseFloat(pl) >= 10 && parseFloat(pl) <= 1000 && parseFloat(pw) >= 10 && parseFloat(pw) <= 1000)) errs.plot = 'Each plot side must be between 10 and 1000 ft'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate() || checks.block) return
    const input: QtyInput = {
      floorAreasSqft: floorAreas,
      state: localState,
      city: localCity.trim() || undefined,
      site: site!,
      wall,
      terraceAccess: terrace,
      plotLengthFt: plotL.trim() ? parseFloat(plotL) : undefined,
      plotWidthFt: plotW.trim() ? parseFloat(plotW) : undefined,
      ...(stilt ? { stilt: true } : {}),
      ...(balconies > 0 && balconyLevels > 0 ? { balconies, balconyDepthM: balconyDepth } : {}),
    }
    onSubmit(input)
  }

  // a balcony hangs off a floor above the lowest slab; the roof does not get one
  const balconyLevels = stilt ? numFloors + 1 : numFloors
  const errorList = Object.values(errors)
  const siteInfo = site ? SITE[site] : null

  return (
    <form onSubmit={e => e.preventDefault()} noValidate className="ns-i-form">
      {onBack && <button type="button" className="ns-i-back" onClick={onBack}><IcArrow />Back</button>}

      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">Step 3 of 4</p>
        <h2>Tell us about your building</h2>
        <p className="ns-i-card__sub">Four short questions. Concrete grade, steel size, column and beam sizes and the foundation are worked out for you from the Indian Standards, and written into your report.</p>
      </div>
      <Note kind="info" title="Adding floors to a house that already stands?">
        That needs an engineer to survey the old foundation and columns first, so this tool does not estimate it. For a new building, carry on below.
      </Note>

      {/* 1 ─ place */}
      <Disclosure n="1" title="Where is your plot?">
        <div className="ns-i-fields">
          <Field id="bd-state" label="State" required error={errors.state}>
            <Select value={localState} onChange={e => setLocalState(e.target.value)}>
              <option value="">Select your state or UT</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field id="bd-city" label="Town or city" hint="Used to find the earthquake zone">
            <Input value={localCity} onChange={e => setLocalCity(e.target.value)} placeholder="e.g. Pune" autoComplete="address-level2" />
          </Field>
        </div>
        {zone && (
          <div className="ns-i-zone">
            <span className="ns-i-mono">Earthquake zone {zone.zone}</span>
            <span style={{ fontWeight: 400 }}>{zone.note}</span>
            <Tip info={INFO.seismic} />
          </div>
        )}
        {localState && HIMALAYAN.includes(localState) && (
          <Note kind="warn">Your region is in the highest earthquake zones. Ductile steel and closer stirrups are built into every figure in your report, which raises the steel quantity.</Note>
        )}
      </Disclosure>

      {/* 2 ─ floors */}
      <Disclosure n="2" title="How many floors, and how big is each?">
        <div className="ns-i-fields">
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Is the ground level left open for parking?<Tip info={INFO.stilt} /></legend>
            <div className="ns-i-seg">
              {([['No', false], ['Yes, parking underneath', true]] as const).map(([label, v]) => (
                <label key={label} className="ns-i-segopt">
                  <input type="radio" name="bd-stilt" checked={stilt === v} onChange={() => toggleStilt(v)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {stilt && <p className="ns-i-hint" style={{ marginTop: 8 }}>List only the floors above the parking level. The parking level itself is added for you, with larger columns.</p>}
          </fieldset>
          <Field id="bd-floors" label={stilt ? 'Floors above the parking' : 'Number of floors'} hint={stilt ? undefined : 'G means ground only. G+1 means ground plus one floor above.'}>
            <Select value={numFloors} onChange={e => setNumFloors(parseInt(e.target.value))}>
              {Array.from({ length: (stilt ? MAX_G_STILT : MAX_G) + 1 }, (_, g) => (
                <option key={g} value={g}>{stilt ? `${g + 1} floor${g === 0 ? '' : 's'} above the parking` : g === 0 ? 'G (ground only)' : `G + ${g}`}</option>
              ))}
            </Select>
          </Field>
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab">Same area on every floor?</legend>
            <div className="ns-i-seg">
              {(['Yes', 'No'] as const).map(opt => (
                <label key={opt} className="ns-i-segopt">
                  <input type="radio" name="bd-samearea" checked={sameArea === (opt === 'Yes')} onChange={() => setSameArea(opt === 'Yes')} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {sameArea ? (
          <div className="ns-i-fields">
            <Field id="bd-area" label="Built-up area of one floor (sq ft)" required hint="Inside the outer walls. If your plan's figure includes balconies, take them out and tell us about them in step 4." error={errors.area}>
              <Input type="number" inputMode="numeric" min="100" placeholder="e.g. 1200" value={groundArea} onChange={e => setGroundArea(e.target.value)} />
            </Field>
          </div>
        ) : (
          <>
            <Note kind="info">Enter the built-up area of each floor in sq ft, inside the outer walls and without balconies (step 4 asks about those). A floor that is larger than the one below overhangs it; the checks below say whether that is practical.</Note>
            <ul className="ns-i-floors">
              {floorAreas.map((a, idx) => {
                const prev = idx > 0 ? floorAreas[idx - 1] : null
                const diff = prev !== null && a > 0 && prev > 0 ? a - prev : null
                const bad = !!errors.floors && !(a >= 100 && a <= 30000)
                const badges = checks.perFloor[idx] ?? []
                return (
                  <li key={idx} className="ns-i-floor">
                    <p className="ns-i-floor__t">{floorLabel(idx)}</p>
                    <div className="ns-i-floor__g">
                      <Field id={`bd-fa-${idx}`} label="Area (sq ft)" invalid={bad}>
                        <Input type="number" inputMode="numeric" min="0" placeholder="e.g. 1200" value={areas[idx] ?? ''} onChange={e => setAreas(prevA => prevA.map((v, i) => (i === idx ? e.target.value : v)))} />
                      </Field>
                      <div className="ns-i-f">
                        <span className="ns-i-lab">Difference from the floor below</span>
                        <span className={`ns-i-diff ${diff === null ? 'ns-i-diff--na' : diff > 0 ? 'ns-i-diff--up' : diff < 0 ? 'ns-i-diff--dn' : ''}`}>
                          {diff === null ? '—' : diff > 0 ? `+${diff.toFixed(0)} sqft` : diff < 0 ? `${diff.toFixed(0)} sqft` : '±0 sqft'}
                        </span>
                      </div>
                    </div>
                    <div className="ns-i-floor__chk">
                      {idx === 0
                        ? <p className="ns-i-isb ns-i-isb--idle">{stilt ? 'Sits on the parking level: no overhang to compare' : 'Base floor: nothing below to compare with'}</p>
                        : badges.length > 0
                          ? badges.map((b, bi) => <IsBadge key={bi} variant={b.variant} text={b.text} />)
                          : (a > 0 && prev && prev > 0
                            ? <p className="ns-i-isb ns-i-isb--green"><IcCheck />No irregularity</p>
                            : <p className="ns-i-isb ns-i-isb--idle">Enter the area to check this floor</p>)}
                    </div>
                  </li>
                )
              })}
            </ul>
            {errors.floors && <p className="ns-i-err" role="alert"><IcAlert />{errors.floors}</p>}
          </>
        )}

        {checks.slender && (
          <Note kind="warn">Your building is tall for its footprint (more than 5 times its width). The report checks wind as well as earthquake (IS 875 Part 3) and uses the larger force, but a tall thin building needs an engineer&rsquo;s dynamic check before construction.</Note>
        )}
        {checks.block && (
          <Note kind="err" title="One or more floors cannot be built in ordinary RCC" foot="IS 456:2000 cl 23.2.1 · IS 1893:2016 Table 6">
            A floor overhangs the one below by more than a practical limit. Revise the floor areas or take a structural engineer&rsquo;s advice before going ahead. We cannot give quantities for a shape like this.
          </Note>
        )}
        {checks.irregular && !checks.block && (
          <Note kind="warn" title="This shape needs an engineer's check" foot="IS 1893:2016 Table 6">
            The quantities will be given, but an irregular shape needs a dynamic analysis by a licensed structural engineer before construction.
          </Note>
        )}
        <ElevationDiagram stilt={stilt} floors={floorAreas.map((area, i) => ({ label: floorLabel(i), area }))} />
      </Disclosure>

      {/* 3 ─ ground */}
      <Disclosure n="3" title="What is the ground like?">
        <div className="ns-i-labrow"><span className="ns-i-lab">Pick the closest match</span><Tip info={INFO.site} /></div>
        <fieldset className="ns-i-fs" aria-describedby={errors.site ? 'bd-site-e' : undefined}>
          <legend className="ns-sr">Ground</legend>
          {errors.site && <p className="ns-i-err" id="bd-site-e" role="alert" style={{ marginBottom: 10 }}><IcAlert />{errors.site}</p>}
          <div className="ns-i-sites">
            {SITE_CARDS.map(card => (
              <label key={card.value} className="ns-i-site">
                <input type="radio" name="bd-site" value={card.value} checked={site === card.value} onChange={() => setSite(card.value)} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SITE_ICON[card.value]}</svg>
                <span className="ns-i-site__t">{card.label}</span>
                <span className="ns-i-site__d">{card.note}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {siteInfo && (
          <Note kind="info" title="What the report will assume for this ground">
            {siteInfo.raft ? 'A raft foundation' : 'Separate footings under each column'}, about {siteInfo.depth.toFixed(1)} m deep, on ground that safely carries {siteInfo.sbc} kN/m². A soil test report replaces this assumption; it should come before any foundation work.
          </Note>
        )}
        {site === 'bcs' && (
          <Note kind="warn">Black cotton soil swells in the rains and shrinks in summer. The foundation here is a rough guide only. A soil test and a structural engineer must choose it (under-reamed piles are common in this soil).</Note>
        )}
        {(site === 'soft_marshy' || site === 'waterlogged') && (
          <Note kind="warn">The bearing of soft or waterlogged ground can be low. Do not start the foundation without a soil test.</Note>
        )}
        {site === 'coastal' && (
          <Note kind="info">Salt-laden air attacks steel. The report raises the concrete grade and the cover over the bars for this exposure (IS 456 Table 5 and Table 16).</Note>
        )}
      </Disclosure>

      {/* 4 ─ the rest */}
      <Disclosure n="4" title="A few last questions">
        <fieldset className="ns-i-fs">
          <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Balconies that stick out beyond the walls<Tip info={INFO.balcony} /></legend>
          {balconyLevels === 0 ? (
            <p className="ns-i-hint">A single ground floor has no upper floor to hang a balcony from. Add a floor above to ask about balconies.</p>
          ) : (
            <>
              <div className="ns-i-fields">
                <Field id="bd-bal" label={`How many on each ${stilt ? 'floor' : 'upper floor'}?`} hint={stilt ? 'On every floor above the parking except the roof' : 'On every floor above the ground floor except the roof'}>
                  <Select value={balconies} onChange={e => setBalconies(parseInt(e.target.value))}>
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n === 0 ? 'None' : n}</option>)}
                  </Select>
                </Field>
                {balconies > 0 && (
                  <Field id="bd-bald" label="How far does each stick out?" hint="Measured from the wall, most are 1.2 m (4 ft)">
                    <Select value={balconyDepth} onChange={e => setBalconyDepth(parseFloat(e.target.value) as 1 | 1.2 | 1.5)}>
                      <option value={1}>1.0 m (about 3 ft 3 in)</option>
                      <option value={1.2}>1.2 m (about 4 ft)</option>
                      <option value={1.5}>1.5 m (about 5 ft)</option>
                    </Select>
                  </Field>
                )}
              </div>
              {balconies > 0 && <p className="ns-i-hint">About {balconies * balconyLevels} balcon{balconies * balconyLevels === 1 ? 'y' : 'ies'} in all. Each is as wide as one column bay, up to 3.6 m.</p>}
            </>
          )}
        </fieldset>

        <fieldset className="ns-i-fs">
          <legend className="ns-i-lab">What will the walls be made of?</legend>
          <div className="ns-i-choices ns-i-choices--2">
            {WALLS.map(w => (
              <label key={w.value} className="ns-i-choice">
                <input type="radio" name="bd-wall" checked={wall === w.value} onChange={() => setWall(w.value)} />
                <span>
                  <span className="ns-i-choice__t">{w.label}</span>
                  <span className="ns-i-choice__d">{w.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ns-i-fs">
          <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Will people use the roof as a terrace?<Tip info={INFO.terrace} /></legend>
          <div className="ns-i-seg">
            {([['Yes', true], ['No', false]] as const).map(([label, v]) => (
              <label key={label} className="ns-i-segopt">
                <input type="radio" name="bd-terrace" checked={terrace === v} onChange={() => setTerrace(v)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="ns-i-hint" style={{ marginTop: 8 }}>Yes if you will walk on it, dry clothes there or keep a tank. No if the roof is only reached for repairs.</p>
        </fieldset>

        <div>
          <div className="ns-i-labrow" style={{ marginBottom: 8 }}><span className="ns-i-lab">Plot size (optional)</span><Tip info={INFO.plot} /></div>
          <div className="ns-i-fields">
            <Field id="bd-plotl" label="Plot length (ft)" invalid={!!errors.plot}>
              <Input type="number" inputMode="numeric" min="10" placeholder="e.g. 50" value={plotL} onChange={e => setPlotL(e.target.value)} />
            </Field>
            <Field id="bd-plotw" label="Plot width (ft)" error={errors.plot}>
              <Input type="number" inputMode="numeric" min="10" placeholder="e.g. 30" value={plotW} onChange={e => setPlotW(e.target.value)} />
            </Field>
          </div>
        </div>
      </Disclosure>

      <div className="ns-i-actions">
        {errorList.length > 0 && (
          <div className="ns-i-note ns-i-note--err ns-i-errsum" role="alert">
            <IcAlert />
            <div>
              <p><b>Please check these before continuing</b></p>
              <ul>{errorList.map(m => <li key={m}>{m}</li>)}</ul>
            </div>
          </div>
        )}
        <div className="ns-i-actions__r">
          <button type="button" className="ns-btn" onClick={handleSubmit} disabled={checks.block} data-blocked={checks.block ? '' : undefined}>
            {checks.block ? 'Fix the floor shape to continue' : 'Work out my structure'}
            {!checks.block && <IcArrow width={22} height={11} />}
          </button>
        </div>
        <p className="ns-i-fine">Free: the earthquake zone, concrete and steel grades, IS-code checks and a 3D model of your frame. The itemised quantities are in the {TOOL.price} report.</p>
      </div>
    </form>
  )
}

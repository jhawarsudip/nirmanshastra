'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { INDIAN_STATES } from '@/lib/structopro-qty/states'
import { seismicZoneFor } from '@/lib/structopro-qty/zones'
import { SITE } from '@/lib/structopro-qty/sites'
import type { QtyInput, SiteCondition, WallType } from '@/lib/structopro-qty/types'
import { buildingLabelFor } from '@/lib/i18n/labels/structopro-fmt'
import { stateLabel } from '@/lib/i18n/states'
import { useCopy } from '@/lib/i18n/use-copy'
import { useStructTr } from '@/lib/i18n/labels/structopro-tr'
import { COPY } from '../copy'
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

const MAX_G = 5 // G+5 is the tallest the form offers: beyond it a structural engineer is needed from day one
const MAX_G_STILT = 4 // an open parking level plus 5 floors is the same six storeys as G+5, so 5 floors above it is the most

// ─── Site cards ───────────────────────────────────────────────────────────────

// the label and the note of each card are in ../copy.ts (build.sites)
const SITE_VALUES: SiteCondition[] = ['flat', 'sloped_mild', 'sloped_steep', 'rocky', 'bcs', 'soft_marshy', 'waterlogged', 'coastal']

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

const WALL_VALUES: WallType[] = ['brick', 'block']

const HIMALAYAN = ['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura','Jammu and Kashmir','Ladakh','Uttarakhand','Himachal Pradesh']

// ─── Small pieces ─────────────────────────────────────────────────────────────

interface ISBadge { variant: 'green' | 'amber' | 'red'; text: string }

function IsBadge({ variant, text }: ISBadge) {
  const t = useCopy(COPY).build
  const Icon = variant === 'green' ? IcCheck : IcAlert
  const lead = variant === 'red' ? t.leadProblem : variant === 'amber' ? t.leadWarning : t.leadOk
  return (
    <p className={`ns-i-isb ns-i-isb--${variant}`}>
      <Icon />
      <span><span className="ns-sr">{lead}</span>{text}</span>
    </p>
  )
}

// Elevation sketch: ground floor at the bottom, floors stack upward, bar width = area
function ElevationDiagram({ floors, stilt }: { floors: { label: string; area: number }[]; stilt: boolean }) {
  const t = useCopy(COPY).build
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
  const summary = floors.map(f => `${f.label} ${f.area.toFixed(0)} ${t.sqftTight}`).join(', ')
  return (
    <figure className="ns-i-elev">
      <figcaption className="ns-i-elev__t">{t.elevTitle}</figcaption>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label={t.elevAria(stilt ? t.openLevel : t.groundFloorLow, summary)}>
        <line x1={10} y1={baseY} x2={svgW - 10} y2={baseY} strokeWidth={1} />
        {stilt && firstW > 0 && (
          <g>
            {[0, 0.5, 1].map(t => <line key={t} x1={(svgW - firstW) / 2 + t * firstW} y1={baseY} x2={(svgW - firstW) / 2 + t * firstW} y2={baseY - openH} strokeWidth={2} />)}
            <text x={svgW / 2} y={baseY - openH / 2 + 3.5} textAnchor="middle">{t.openLevelCap}</text>
          </g>
        )}
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} style={{ fillOpacity: 0.16 + i * 0.08 }} />
            <text x={svgW / 2} y={r.y + r.h / 2 + 3.5} textAnchor="middle">{r.label} {r.area > 0 ? `${r.area.toFixed(0)} ${t.sqft}` : ''}</text>
          </g>
        ))}
        <text className="ns-i-elev__gl" x={svgW - 5} y={baseY + 12} textAnchor="end">G.L.</text>
      </svg>
      <p className="ns-i-fine">{stilt ? t.elevFineStilt : t.elevFineGround}{t.elevFine}</p>
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
  const t = useCopy(COPY).build
  const tr = useStructTr()
  const locale = useLocale()
  const SITE_CARDS = SITE_VALUES.map(value => ({ value, ...t.sites[value] }))
  const WALLS = WALL_VALUES.map(value => ({ value, ...t.walls[value] }))
  const INFO: Record<string, TipInfo> = t.info
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
  const floorLabel = (i: number) => (stilt ? t.floorLabels[i + 1] : t.floorLabels[i]) ?? t.floorN(i + (stilt ? 1 : 0))
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
        if (dimRatio > 1.5) { row.push({ variant: 'red', text: t.wider(dimPct, true) }); irregular = true }
        else if (dimRatio > 1.25) { row.push({ variant: 'amber', text: t.wider(dimPct, false) }); irregular = true }
        if (areaRatio > 1.5) { row.push({ variant: 'amber', text: t.heavier(floorLabel(i), areaPct) }); irregular = true }
        if (cantM > 3) { row.push({ variant: 'red', text: t.overhangBad(cant, beamDepth) }); block = true; irregular = true }
        else if (cantM > 1.5) { row.push({ variant: 'amber', text: t.overhangDeep(cant, beamDepth) }); irregular = true }
        else if (cantM > 0) { row.push({ variant: 'green', text: t.overhangOk(cant) }) }
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
      floors: buildingLabelFor(locale, numFloors + 1, stilt),
      bua: Math.round(total),
      siteCondition: site ? t.sites[site]?.label : undefined,
      wallType: t.walls[wall]?.label,
    })
  }, [numFloors, floorAreas, site, wall, stilt, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!localState) errs.state = t.errState
    if (!site) errs.site = t.errSite
    if (sameArea && (!(parseFloat(groundArea) >= 100) || parseFloat(groundArea) > 30000)) errs.area = t.errArea
    if (!sameArea && floorAreas.some(a => !(a >= 100) || a > 30000)) errs.floors = t.errFloors
    const pl = plotL.trim(), pw = plotW.trim()
    if ((pl && !pw) || (!pl && pw)) errs.plot = t.errPlotBoth
    if (pl && pw && !(parseFloat(pl) >= 10 && parseFloat(pl) <= 1000 && parseFloat(pw) >= 10 && parseFloat(pw) <= 1000)) errs.plot = t.errPlotRange
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
      {onBack && <button type="button" className="ns-i-back" onClick={onBack}><IcArrow />{t.back}</button>}

      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">{t.eyebrow}</p>
        <h2>{t.title}</h2>
        <p className="ns-i-card__sub">{t.sub}</p>
      </div>
      <Note kind="info" title={t.extTitle}>
        {t.extBody}
      </Note>

      {/* 1 ─ place */}
      <Disclosure n="1" title={t.s1}>
        <div className="ns-i-fields">
          <Field id="bd-state" label={t.state} required error={errors.state}>
            <Select value={localState} onChange={e => setLocalState(e.target.value)}>
              <option value="">{t.statePick}</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{stateLabel(s, locale)}</option>)}
            </Select>
          </Field>
          <Field id="bd-city" label={t.city} hint={t.cityHint}>
            <Input value={localCity} onChange={e => setLocalCity(e.target.value)} placeholder={t.cityEg} autoComplete="address-level2" />
          </Field>
        </div>
        {zone && (
          <div className="ns-i-zone">
            <span className="ns-i-mono">{t.zone(zone.zone)}</span>
            <span style={{ fontWeight: 400 }}>{tr(zone.note)}</span>
            <Tip info={INFO.seismic} />
          </div>
        )}
        {localState && HIMALAYAN.includes(localState) && (
          <Note kind="warn">{t.himalayan}</Note>
        )}
      </Disclosure>

      {/* 2 ─ floors */}
      <Disclosure n="2" title={t.s2}>
        <div className="ns-i-fields">
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.stiltQ}<Tip info={INFO.stilt} /></legend>
            <div className="ns-i-seg">
              {([[t.no, false], [t.stiltYes, true]] as const).map(([label, v]) => (
                <label key={label} className="ns-i-segopt">
                  <input type="radio" name="bd-stilt" checked={stilt === v} onChange={() => toggleStilt(v)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {stilt && <p className="ns-i-hint" style={{ marginTop: 8 }}>{t.stiltHint}</p>}
          </fieldset>
          <Field id="bd-floors" label={stilt ? t.floorsAbove : t.floorsNum} hint={stilt ? undefined : t.floorsHint}>
            <Select value={numFloors} onChange={e => setNumFloors(parseInt(e.target.value))}>
              {Array.from({ length: (stilt ? MAX_G_STILT : MAX_G) + 1 }, (_, g) => (
                <option key={g} value={g}>{stilt ? t.floorsAboveOpt(g + 1) : g === 0 ? t.groundOnly : `G + ${g}`}</option>
              ))}
            </Select>
          </Field>
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab">{t.sameArea}</legend>
            <div className="ns-i-seg">
              {([['Yes', t.yes], ['No', t.no]] as const).map(([opt, word]) => (
                <label key={opt} className="ns-i-segopt">
                  <input type="radio" name="bd-samearea" checked={sameArea === (opt === 'Yes')} onChange={() => setSameArea(opt === 'Yes')} />
                  <span>{word}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {sameArea ? (
          <div className="ns-i-fields">
            <Field id="bd-area" label={t.area} required hint={t.areaHint} error={errors.area}>
              <Input type="number" inputMode="numeric" min="100" placeholder={t.areaEg} value={groundArea} onChange={e => setGroundArea(e.target.value)} />
            </Field>
          </div>
        ) : (
          <>
            <Note kind="info">{t.diffNote}</Note>
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
                      <Field id={`bd-fa-${idx}`} label={t.areaShort} invalid={bad}>
                        <Input type="number" inputMode="numeric" min="0" placeholder={t.areaEg} value={areas[idx] ?? ''} onChange={e => setAreas(prevA => prevA.map((v, i) => (i === idx ? e.target.value : v)))} />
                      </Field>
                      <div className="ns-i-f">
                        <span className="ns-i-lab">{t.diffLabel}</span>
                        <span className={`ns-i-diff ${diff === null ? 'ns-i-diff--na' : diff > 0 ? 'ns-i-diff--up' : diff < 0 ? 'ns-i-diff--dn' : ''}`}>
                          {diff === null ? '—' : diff > 0 ? `+${diff.toFixed(0)} ${t.sqft}` : diff < 0 ? `${diff.toFixed(0)} ${t.sqft}` : `±0 ${t.sqft}`}
                        </span>
                      </div>
                    </div>
                    <div className="ns-i-floor__chk">
                      {idx === 0
                        ? <p className="ns-i-isb ns-i-isb--idle">{stilt ? t.baseStilt : t.baseGround}</p>
                        : badges.length > 0
                          ? badges.map((b, bi) => <IsBadge key={bi} variant={b.variant} text={b.text} />)
                          : (a > 0 && prev && prev > 0
                            ? <p className="ns-i-isb ns-i-isb--green"><IcCheck />{t.noIrreg}</p>
                            : <p className="ns-i-isb ns-i-isb--idle">{t.enterArea}</p>)}
                    </div>
                  </li>
                )
              })}
            </ul>
            {errors.floors && <p className="ns-i-err" role="alert"><IcAlert />{errors.floors}</p>}
          </>
        )}

        {checks.slender && (
          <Note kind="warn">{t.slender}</Note>
        )}
        {checks.block && (
          <Note kind="err" title={t.blockTitle} foot={t.blockFoot}>
            {t.blockBody}
          </Note>
        )}
        {checks.irregular && !checks.block && (
          <Note kind="warn" title={t.irregTitle} foot={t.irregFoot}>
            {t.irregBody}
          </Note>
        )}
        <ElevationDiagram stilt={stilt} floors={floorAreas.map((area, i) => ({ label: floorLabel(i), area }))} />
      </Disclosure>

      {/* 3 ─ ground */}
      <Disclosure n="3" title={t.s3}>
        <div className="ns-i-labrow"><span className="ns-i-lab">{t.pickClosest}</span><Tip info={INFO.site} /></div>
        <fieldset className="ns-i-fs" aria-describedby={errors.site ? 'bd-site-e' : undefined}>
          <legend className="ns-sr">{t.groundSr}</legend>
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
          <Note kind="info" title={t.siteAssumeTitle}>
            {t.siteAssume(siteInfo.raft, siteInfo.depth.toFixed(1), siteInfo.sbc)}
          </Note>
        )}
        {site === 'bcs' && (
          <Note kind="warn">{t.bcs}</Note>
        )}
        {(site === 'soft_marshy' || site === 'waterlogged') && (
          <Note kind="warn">{t.soft}</Note>
        )}
        {site === 'coastal' && (
          <Note kind="info">{t.coastal}</Note>
        )}
      </Disclosure>

      {/* 4 ─ the rest */}
      <Disclosure n="4" title={t.s4}>
        <fieldset className="ns-i-fs">
          <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.balconyQ}<Tip info={INFO.balcony} /></legend>
          {balconyLevels === 0 ? (
            <p className="ns-i-hint">{t.balconyNone}</p>
          ) : (
            <>
              <div className="ns-i-fields">
                <Field id="bd-bal" label={t.balHowMany(stilt)} hint={t.balHowManyHint(stilt)}>
                  <Select value={balconies} onChange={e => setBalconies(parseInt(e.target.value))}>
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n === 0 ? t.none : n}</option>)}
                  </Select>
                </Field>
                {balconies > 0 && (
                  <Field id="bd-bald" label={t.balDepth} hint={t.balDepthHint}>
                    <Select value={balconyDepth} onChange={e => setBalconyDepth(parseFloat(e.target.value) as 1 | 1.2 | 1.5)}>
                      <option value={1}>{t.balD1}</option>
                      <option value={1.2}>{t.balD12}</option>
                      <option value={1.5}>{t.balD15}</option>
                    </Select>
                  </Field>
                )}
              </div>
              {balconies > 0 && <p className="ns-i-hint">{t.balTotal(balconies * balconyLevels)}</p>}
            </>
          )}
        </fieldset>

        <fieldset className="ns-i-fs">
          <legend className="ns-i-lab">{t.wallsQ}</legend>
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
          <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t.terraceQ}<Tip info={INFO.terrace} /></legend>
          <div className="ns-i-seg">
            {([[t.yes, true], [t.no, false]] as const).map(([label, v]) => (
              <label key={label} className="ns-i-segopt">
                <input type="radio" name="bd-terrace" checked={terrace === v} onChange={() => setTerrace(v)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="ns-i-hint" style={{ marginTop: 8 }}>{t.terraceHint}</p>
        </fieldset>

        <div>
          <div className="ns-i-labrow" style={{ marginBottom: 8 }}><span className="ns-i-lab">{t.plotTitle}</span><Tip info={INFO.plot} /></div>
          <div className="ns-i-fields">
            <Field id="bd-plotl" label={t.plotLen} invalid={!!errors.plot}>
              <Input type="number" inputMode="numeric" min="10" placeholder={t.plotEg1} value={plotL} onChange={e => setPlotL(e.target.value)} />
            </Field>
            <Field id="bd-plotw" label={t.plotWid} error={errors.plot}>
              <Input type="number" inputMode="numeric" min="10" placeholder={t.plotEg2} value={plotW} onChange={e => setPlotW(e.target.value)} />
            </Field>
          </div>
        </div>
      </Disclosure>

      <div className="ns-i-actions">
        {errorList.length > 0 && (
          <div className="ns-i-note ns-i-note--err ns-i-errsum" role="alert">
            <IcAlert />
            <div>
              <p><b>{t.errSummary}</b></p>
              <ul>{errorList.map(m => <li key={m}>{m}</li>)}</ul>
            </div>
          </div>
        )}
        <div className="ns-i-actions__r">
          <button type="button" className="ns-btn" onClick={handleSubmit} disabled={checks.block} data-blocked={checks.block ? '' : undefined}>
            {checks.block ? t.fixShape : t.go}
            {!checks.block && <IcArrow width={22} height={11} />}
          </button>
        </div>
        <p className="ns-i-fine">{t.fine(TOOL.price)}</p>
      </div>
    </form>
  )
}

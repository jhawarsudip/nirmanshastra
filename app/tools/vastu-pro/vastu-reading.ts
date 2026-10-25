// VastuPro: reads a plan against the rule table. Deterministic: the same plan and the same rules always give the same
// reading. Nothing here calls a model, a network or a clock.

import {
  BORDERLINE_DEG,
  ZONE_COUNT,
  ZONE_SPAN,
  compassBearing,
  cornerCover,
  edgeDistance,
  minAreaRect,
  placeRoom,
  polygonArea,
  polygonCentroid,
  rayExit,
  rectPoly,
  zoneOfBearing,
  type Poly,
} from './vastu-geometry'
import { CATALOGUE } from './vastu-catalogue'
import {
  DONTS,
  DOS,
  PADA_RING,
  REMEDIES,
  ROOM_RULES,
  RULES_VERSION,
  SEV_SCORE,
  SIDE_FULL,
  SIDE_ORDER,
  SPECIAL,
  ZONES,
  capSeverity,
  padaAt,
  worse,
  zoneText,
  type PadaTone,
  type RoomRule,
  type Side,
} from './vastu-rules'
import type { Basis, Finding, PlanInput, PlotNote, Reading, RemedySet, Severity } from './vastu-types'

const NO_REMEDIES: RemedySet = { structural: [], practical: [] }

/** Below this share of a room in the Brahmasthan, the centre is not mentioned at all. */
const CENTRE_SHARE = 0.25
/** At or above this share, the room is treated as being in the centre and its zone is not read. */
const CENTRE_ALL = 0.9
/** How close to the line between two entrance positions a door must be (as a fraction of one position) to be called borderline. */
const PADA_EDGE = 0.12

const MAIN_START: Record<Side, string> = { E: 'north-east', S: 'south-east', W: 'south-west', N: 'north-west' }

// ------------------------------------------------------------------------------------------------ small helpers

function scoreToSeverity(score: number): Severity {
  if (score >= 85) return 'POSITIVE'
  if (score >= 55) return 'NEUTRAL'
  if (score >= 20) return 'MODERATE'
  return 'CRITICAL'
}

const pct = (x: number) => `${Math.round(x * 100)}%`

/** Who is speaking: the older texts, today’s teachers, or recent practice. */
function prefers(basis: Basis, what: string): string {
  if (basis === 'classical') return `The traditional texts prefer ${what}.`
  if (basis === 'taught') return `Teachers today prefer ${what}.`
  return `Recent practice prefers ${what}.`
}

function cautions(basis: Basis): string {
  if (basis === 'classical') return 'the traditional texts caution against'
  if (basis === 'taught') return 'teachers caution against'
  return 'recent practice cautions against'
}

function headline(label: string, where: string, sev: Severity, rule: RoomRule): string {
  switch (sev) {
    case 'POSITIVE':
      return `The ${label} is in the ${where}, a placement the tradition favours.`
    case 'NEUTRAL':
      return `The ${label} is in the ${where}. The tradition neither favours nor cautions against this.`
    case 'MODERATE':
      return `The ${label} is in the ${where}. ${prefers(rule.basis, rule.prefer)}`
    case 'CRITICAL':
      return `The ${label} is in the ${where}, a placement ${cautions(rule.basis)}. ${prefers(rule.basis, rule.prefer)}`
  }
}

/** Severity of a room from how much of it lies in each zone. null when the room is all in the Brahmasthan. */
function severityFromShares(rule: RoomRule, shares: number[], centreShare: number): Severity | null {
  const outside = 1 - centreShare
  if (outside < 1e-9) return null
  let score = 0
  for (let z = 0; z < ZONE_COUNT; z++) score += shares[z] * SEV_SCORE[rule.zones[z]]
  return scoreToSeverity(score / outside)
}

function centreSeverity(rule: RoomRule): Severity {
  switch (rule.centre) {
    case 'open': return 'POSITIVE'
    case 'ok': return 'NEUTRAL'
    case 'avoid': return 'MODERATE'
    case 'avoid-serious': return 'CRITICAL'
  }
}

const CENTRE_TEXT_AVOID =
  'The centre of the plan, the Brahmasthana, is meant to stay open and light. The older texts say so in general. The list of rooms to keep out of it (toilets, kitchen, stairs, bedrooms) comes from later teachers.'
const CENTRE_TEXT_OPEN =
  'The centre of the plan, the Brahmasthana, is meant to stay open. Brihat Samhita and Mayamata both treat it as the part to keep clear, and an open hall or court there fits that.'

function withDuplicates(items: PlanInput['items']): Record<string, string> {
  const count: Record<string, number> = {}
  items.forEach(i => { count[i.kind] = (count[i.kind] ?? 0) + 1 })
  const seen: Record<string, number> = {}
  const out: Record<string, string> = {}
  for (const it of items) {
    const base = CATALOGUE[it.kind]?.label ?? it.kind
    seen[it.kind] = (seen[it.kind] ?? 0) + 1
    out[it.id] = count[it.kind] > 1 ? `${base} ${seen[it.kind]}` : base
  }
  return out
}

// ------------------------------------------------------------------------------------------------ rooms

function readRoom(item: PlanInput['items'][number], label: string, ref: Poly, northDeg: number): Finding | null {
  const rule = ROOM_RULES[item.kind]
  const cat = CATALOGUE[item.kind]
  if (!rule || !cat) return null

  const room = rectPoly(item.x, item.y, item.w, item.h)
  const p = placeRoom(room, ref, northDeg)

  const evaluate = (shares: number[]): Severity => {
    const zoneSev = severityFromShares(rule, shares, p.centreShare)
    let sev: Severity
    if (zoneSev === null || p.centreShare >= CENTRE_ALL) sev = centreSeverity(rule)
    else if (p.centreShare >= CENTRE_SHARE && (rule.centre === 'avoid' || rule.centre === 'avoid-serious')) sev = worse(zoneSev, centreSeverity(rule))
    else sev = zoneSev
    return capSeverity(rule.basis, sev)
  }

  const severity = evaluate(p.shares)
  const inCentre = p.centreShare >= CENTRE_SHARE
  const allCentre = p.centreShare >= CENTRE_ALL || p.primaryZone < 0

  const where = allCentre ? 'centre of the plan (the Brahmasthan)' : zoneText(p.primaryZone)

  // other zones this room reaches, biggest first
  const also = p.alsoIn.map(z => `${ZONES[z].short} (${pct(p.shares[z])})`)
  const alsoText = also.length ? `also covers ${also.join(', ')}` : undefined

  // how the room would read across the nearest zone line
  let altSeverity: Severity | undefined
  if (p.borderline && p.primaryZone >= 0) {
    const delta = ((p.bearing - p.primaryZone * ZONE_SPAN + 540) % 360) - 180
    const neighbour = (p.primaryZone + (delta >= 0 ? 1 : -1) + ZONE_COUNT) % ZONE_COUNT
    const moved = p.shares.slice()
    moved[neighbour] += moved[p.primaryZone]
    moved[p.primaryZone] = 0
    const alt = evaluate(moved)
    if (alt !== severity) altSeverity = alt
  }

  // what the tradition says
  let tradition: string
  const special = !allCentre ? SPECIAL[`${item.kind}_${p.primaryZone}`] : undefined
  if (allCentre) tradition = rule.centre === 'open' ? CENTRE_TEXT_OPEN : rule.centre === 'ok' ? rule.principle : `${CENTRE_TEXT_AVOID} ${rule.principle}`
  else tradition = special ?? rule.principle
  if (inCentre && !allCentre && (rule.centre === 'avoid' || rule.centre === 'avoid-serious')) tradition = `${tradition} ${CENTRE_TEXT_AVOID}`

  const showDispute = rule.disputed && (!rule.disputedZones || rule.disputedZones.includes(p.primaryZone))

  // where the room lies, in plain numbers
  const lies = p.shares
    .map((s, z) => ({ s, z }))
    .filter(o => o.s >= 0.05)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map(o => `${ZONES[o.z].short} ${pct(o.s)}`)
  if (p.centreShare >= 0.05) lies.push(`centre ${pct(p.centreShare)}`)
  const detail = [`Where it lies: ${lies.join(', ')}.`]
  if (p.borderline) detail.push(`Its middle is ${p.edgeDeg.toFixed(1)}° from a zone line, so a small error in north could change the reading.`)

  const needsFix = severity === 'MODERATE' || severity === 'CRITICAL'

  return {
    id: item.id,
    kind: item.kind,
    label,
    severity,
    zoneText: where.charAt(0).toUpperCase() + where.slice(1),
    alsoText,
    headline: headline(label.toLowerCase(), where, severity, rule),
    tradition,
    basis: rule.basis,
    disputed: showDispute ? rule.disputed : undefined,
    borderline: p.borderline,
    centre: inCentre,
    weight: rule.weight,
    detail,
    altSeverity,
    source: rule.source,
    practical: rule.practical,
    shares: p.shares,
    remedies: needsFix ? (REMEDIES[item.kind] ?? NO_REMEDIES) : NO_REMEDIES,
    dos: DOS[item.kind] ?? [],
    donts: DONTS[item.kind] ?? [],
  }
}

// ------------------------------------------------------------------------------------------------ doors

const TONE_SEV: Record<PadaTone, Severity> = { favourable: 'POSITIVE', mixed: 'NEUTRAL', cautioned: 'MODERATE' }
const STEP_DOWN: Record<Severity, Severity> = { POSITIVE: 'NEUTRAL', NEUTRAL: 'MODERATE', MODERATE: 'CRITICAL', CRITICAL: 'CRITICAL' }
const TONE_WORD: Record<PadaTone, string> = { favourable: 'favourable', mixed: 'mixed', cautioned: 'cautioned' }

const RING: { side: Side; index: number; name: string; tone: PadaTone }[] = SIDE_ORDER.flatMap(side =>
  PADA_RING[side].map((p, index) => ({ side, index, name: p.name, tone: p.tone })),
)

/** The side of the completed rectangle, named by the compass direction it faces, or null if the plot sits diagonally. */
export function ringSides(ref: Poly, northDeg: number): (Side | null)[] | null {
  const centre = polygonCentroid(ref)
  const names: Side[] = ['N', 'E', 'S', 'W']
  const out: Side[] = []
  for (let i = 0; i < 4; i++) {
    const a = ref[i]
    const b = ref[(i + 1) % 4]
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const bearing = compassBearing(centre, mid, northDeg)
    // a side facing within 5 degrees of a diagonal cannot be told apart from its neighbour
    const offDiagonal = Math.abs(((bearing % 90) + 90) % 90 - 45)
    if (offDiagonal < 5) return null
    out.push(names[Math.round(bearing / 90) % 4])
  }
  return new Set(out).size === 4 ? out : null
}

function readDoor(door: PlanInput['doors'][number], ref: Poly, northDeg: number): Finding | null {
  const rule = ROOM_RULES[door.kind]
  const cat = CATALOGUE[door.kind]
  if (!rule || !cat) return null

  const centre = polygonCentroid(ref)
  const bearing = compassBearing(centre, door.pt, northDeg)
  const zone = zoneOfBearing(bearing)
  const edgeDeg = edgeDistance(bearing)
  const zoneBorderline = edgeDeg < BORDERLINE_DEG

  const dirSev = (z: number) => capSeverity(rule.basis, rule.zones[z])
  const neighbourZone = (zone + (((bearing - zone * ZONE_SPAN + 540) % 360) - 180 >= 0 ? 1 : -1) + ZONE_COUNT) % ZONE_COUNT

  const detail: string[] = []
  let severity = dirSev(zone)
  let alt: Severity | undefined
  let tradition = rule.principle
  let disputed: string | undefined

  if (door.kind === 'main_door') {
    const sides = ringSides(ref, northDeg)
    const hit = rayExit(centre, door.pt, ref)
    if (sides && hit) {
      const ringSide = sides[hit.side]!
      const at = padaAt(ringSide, hit.t)
      const pos = RING.findIndex(r => r.side === at.side && r.index === at.index)
      const here = RING[pos]
      const padaSev = TONE_SEV[here.tone]
      const frac = hit.t * 9 - Math.floor(hit.t * 9)
      const padaBorderline = frac < PADA_EDGE || frac > 1 - PADA_EDGE
      const nb = RING[(pos + (frac < PADA_EDGE ? -1 : 1) + 32) % 32]

      // The old text decides; a direction teachers rate "Serious" pulls the verdict down one step, and no more.
      const combine = (ps: Severity, ds: Severity): Severity => (ds === 'CRITICAL' ? STEP_DOWN[ps] : ps)
      severity = combine(padaSev, dirSev(zone))

      detail.push(`The door is on the ${SIDE_FULL[at.side]} side of the plot, in position ${at.index + 1} of 8 counted from the ${MAIN_START[at.side]} corner. The old texts call that position ${here.name}, and name it ${TONE_WORD[here.tone]}.`)
      detail.push(`Direction from the centre of the plot: ${zoneText(zone)}. Teachers today rate that direction for a main door as ${dirSev(zone) === 'POSITIVE' ? 'favourable' : dirSev(zone) === 'NEUTRAL' ? 'acceptable' : dirSev(zone) === 'MODERATE' ? 'to review' : 'serious'}.`)
      if (padaBorderline) {
        detail.push(`The door is close to the line between two positions. The next one, ${nb.name}, is named ${TONE_WORD[nb.tone]}.`)
        const a = combine(TONE_SEV[nb.tone], dirSev(zone))
        if (a !== severity) alt = a
      }
      if (zoneBorderline) {
        const a = combine(padaSev, dirSev(neighbourZone))
        if (a !== severity && (!alt || Math.abs(SEV_SCORE[a] - SEV_SCORE[severity]) > Math.abs(SEV_SCORE[alt] - SEV_SCORE[severity]))) alt = a
      }
      tradition = rule.principle
      if (padaSev === 'POSITIVE' && dirSev(zone) === 'CRITICAL') {
        tradition += ' Teachers today would still advise against this direction, so both readings are shown and the verdict is lowered one step, to “acceptable”.'
      }
      if (ringSide === 'S') disputed = rule.disputed
    } else {
      // diagonal plot: the boundary positions cannot be told apart
      detail.push(`Direction from the centre of the plot: ${zoneText(zone)}.`)
      detail.push('The plot sits diagonally to the compass, so the entrance positions of the old texts cannot be read. Only the direction is rated.')
      tradition = rule.principle
      if (zoneBorderline) {
        const a = dirSev(neighbourZone)
        if (a !== severity) alt = a
      }
    }
  } else {
    detail.push(`Direction from the centre of the plot: ${zoneText(zone)}.`)
    if (zoneBorderline) {
      const a = dirSev(neighbourZone)
      if (a !== severity) alt = a
    }
  }

  if (zoneBorderline) detail.push(`The door is ${edgeDeg.toFixed(1)}° from a zone line, so a small error in north could change the reading.`)

  const needsFix = severity === 'MODERATE' || severity === 'CRITICAL'
  const where = zoneText(zone)
  const label = cat.label

  return {
    id: door.id,
    kind: door.kind,
    label,
    severity,
    zoneText: where,
    headline: headline(label.toLowerCase(), where, severity, rule),
    tradition,
    basis: rule.basis,
    disputed,
    borderline: zoneBorderline,
    centre: false,
    weight: rule.weight,
    detail,
    altSeverity: alt,
    source: rule.source,
    practical: rule.practical,
    shares: new Array<number>(ZONE_COUNT).fill(0),
    remedies: needsFix ? (REMEDIES[door.kind] ?? NO_REMEDIES) : NO_REMEDIES,
    dos: DOS[door.kind] ?? [],
    donts: DONTS[door.kind] ?? [],
  }
}

// ------------------------------------------------------------------------------------------------ the plot itself

function directionName(ref: Poly, i: number, northDeg: number): string {
  const centre = polygonCentroid(ref)
  const z = zoneOfBearing(compassBearing(centre, ref[i], northDeg))
  const principal = (Math.round(z / 2) * 2) % ZONE_COUNT
  return ZONES[principal].full.toLowerCase()
}

function plotNotes(house: Poly, ref: Poly, northDeg: number): PlotNote[] {
  const notes: PlotNote[] = []
  const fill = polygonArea(house) / Math.max(polygonArea(ref), 1e-9)
  const irregular = house.length > 4 || fill < 0.97

  const cuts: { i: number; share: number; dir: string }[] = []
  for (let i = 0; i < 4; i++) {
    const cut = 1 - cornerCover(house, ref, i)
    if (cut >= 0.25) cuts.push({ i, share: cut, dir: directionName(ref, i, northDeg) })
  }

  for (const c of cuts) {
    const ne = c.dir === 'north-east'
    notes.push({
      id: `cut-${c.i}`,
      severity: 'MODERATE',
      title: `The ${c.dir} corner of the plot is cut`,
      text:
        `${c.share >= 0.97 ? 'All of' : `About ${pct(c.share)} of`} the ${c.dir} corner of the plot is missing. The older texts prefer a square or rectangular site and do not name individual corner cuts. ` +
        `Teachers today treat a missing corner as a defect${ne ? ', and a missing north-east corner as the one they stress most' : ''}. ` +
        'This check reads the zones from the completed rectangle, as practitioners do, so the rest of the reading is not shifted by the cut.',
      basis: 'modern',
      counted: true,
      remedies: {
        structural: ['If you are building anyway and the plot allows it, complete the rectangle at that corner with the building, an open court or a boundary wall. Keep to the setbacks and boundary lines in the bye-laws.'],
        practical: ['Keep the cut corner open and uncluttered, and do not store heavy goods there.'],
      },
    })
  }

  if (irregular) {
    notes.push({
      id: 'shape',
      severity: 'NEUTRAL',
      title: cuts.length ? 'The outline is not a plain rectangle' : 'The outline is not a plain rectangle, but no corner is cut',
      text:
        'Brihat Samhita ch. 53 and Mayamata ch. 3 prefer a square or rectangular site and caution against irregular ones. ' +
        'This check reads the zones from the smallest rectangle that holds your outline.',
      basis: 'classical',
      counted: false,
    })
  }

  notes.push({
    id: 'site-checks',
    severity: 'NEUTRAL',
    title: 'Check these on site',
    text:
      'Brihat Samhita and Mayamata caution against anything standing directly in front of the gate: a pole, a tree, a well, a pillar or the end of a road, unless it is farther away than twice the height of the house. ' +
      'They also caution against a door that opens, closes or creaks by itself. A plan cannot show these, so look at the gate and the street in front of it.',
    basis: 'classical',
    counted: false,
  })

  return notes
}

// ------------------------------------------------------------------------------------------------ the reading

export function readPlan(input: PlanInput): Reading {
  const { house, northDeg } = input
  const counts: Record<Severity, number> = { CRITICAL: 0, MODERATE: 0, NEUTRAL: 0, POSITIVE: 0 }
  const empty: Reading = {
    findings: [],
    plot: [],
    score: null,
    range: null,
    counts,
    missing: ['main door', 'kitchen'],
    basisNotes: [],
    rulesVersion: RULES_VERSION,
  }
  if (house.length < 3 || polygonArea(house) < 1e-6) return empty

  const ref = minAreaRect(house)
  const labels = withDuplicates(input.items)

  const findings: Finding[] = []
  for (const d of input.doors) {
    const f = readDoor(d, ref, northDeg)
    if (f) findings.push(f)
  }
  for (const it of input.items) {
    const f = readRoom(it, labels[it.id], ref, northDeg)
    if (f) findings.push(f)
  }
  // worst first, then by weight, so the page opens on what matters
  findings.sort((a, b) => {
    const r = { CRITICAL: 0, MODERATE: 1, NEUTRAL: 2, POSITIVE: 3 } as const
    return r[a.severity] - r[b.severity] || b.weight - a.weight
  })

  const plot = plotNotes(house, ref, northDeg)

  for (const f of findings) counts[f.severity]++
  for (const n of plot) if (n.counted) counts[n.severity]++

  // the index: importance-weighted, shown second to the counts
  const parts: { w: number; s: number; alt?: number }[] = []
  for (const f of findings) parts.push({ w: f.weight, s: SEV_SCORE[f.severity], alt: f.altSeverity ? SEV_SCORE[f.altSeverity] : undefined })
  for (const n of plot) if (n.counted) parts.push({ w: 1, s: SEV_SCORE[n.severity] })
  const wsum = parts.reduce((a, p) => a + p.w, 0)
  const index = (pick: (p: { s: number; alt?: number }) => number) => Math.round(parts.reduce((a, p) => a + p.w * pick(p), 0) / Math.max(wsum, 1))

  const enough = findings.length >= 3
  const score = enough ? index(p => p.s) : null
  let range: [number, number] | null = null
  if (enough && parts.some(p => p.alt !== undefined)) {
    const lo = index(p => Math.min(p.s, p.alt ?? p.s))
    const hi = index(p => Math.max(p.s, p.alt ?? p.s))
    if (hi > lo) range = [lo, hi]
  }

  const missing: string[] = []
  if (!input.doors.some(d => d.kind === 'main_door')) missing.push('main door')
  if (!input.items.some(i => i.kind === 'kitchen')) missing.push('kitchen')
  if (!input.items.some(i => i.kind === 'toilet' || i.kind === 'bathroom')) missing.push('a toilet or bathroom')

  const basisNotes = [
    `North is set at ${Math.round(((northDeg % 360) + 360) % 360)}° clockwise from the top of your drawing. Check it on site: builders’ plans are often 10° to 25° off true north.`,
    'Magnetic north differs from true north by only a few degrees across India (about 2° west to 3° east), but steel, wiring and phone sensors can throw a compass reading off by far more. Take the reading away from steel.',
    'The compass is divided into 16 equal zones of 22.5° around the centre of the plot. That split is a modern convention. The older texts divide the boundary of the plot into 32 positions, which is how the main door is read.',
    'The centre is the centre of the smallest rectangle that holds your outline, and the Brahmasthan is the middle ninth of that rectangle.',
    'Each room is judged by how much of its area lies in each zone, not by a single point.',
    `A reading within ${BORDERLINE_DEG}° of a zone line is marked borderline and the other reading is shown.`,
  ]

  return { findings, plot, score, range, counts, missing, basisNotes, rulesVersion: RULES_VERSION }
}

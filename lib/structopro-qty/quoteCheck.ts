// "Check your contractor's quantities": set the quantities a contractor (or an engineer's BOQ) gave you beside this report.
// Pure arithmetic on the report the person has already paid for. No rupees, no rates, no network, nothing stored.
//
// How a figure is placed. Let X be the report figure and [lo, hi] its uncertainty band (so the band is X*lo to X*hi).
//   - Below X*lo ................ lower than a frame designed to the codes should need: something may be left out.
//   - X*lo to X*1.10 ............ close to the code figure.
//   - X*1.10 to the top edge .... above the code figure but inside the range real buildings fall in. Common.
//       The top edge is the larger of X*hi and, for steel and concrete, the top of the published range for real buildings.
//   - Above the top edge ........ above everything we would expect. Ask for the working.
//   - Ratio beyond 4x either way  almost always means a unit slip (cubic feet read as cubic metres, quintals as kilograms).
// A verdict is a reason to ask a question. It is never a finding that anyone overcharged.

export type QuoteVerdict = 'units' | 'below' | 'near' | 'inside' | 'above'
export type QuoteKey = 'concrete' | 'steel' | 'cement' | 'shuttering'

export type ConcreteUnit = 'm3' | 'cft'
export type SteelUnit = 'kg' | 'quintal' | 'tonne'
export type ShutterUnit = 'sqft' | 'sqm'
/** 'order': the steel to be bought, cutting waste included. 'drawing': the bar weight in a bar bending schedule, before waste. */
export type SteelBasis = 'order' | 'drawing'

export interface QuoteInput {
  concrete?: { value: number; unit: ConcreteUnit }
  steel?: { value: number; unit: SteelUnit; basis: SteelBasis }
  cement?: { value: number }
  shuttering?: { value: number; unit: ShutterUnit }
}

/** The few numbers of a paid report the check needs. A PaidPayload satisfies this. */
export interface QuoteReference {
  totals: { concreteM3: number; steelNetKg: number; steelBuyKg: number }
  materials: { cementBags: number; formworkSqft: number }
  band: { concrete: [number, number]; steel: [number, number]; cement: [number, number]; formwork: [number, number] }
  practice?: { steelKg: [number, number]; concreteM3: [number, number] }
}

export interface QuoteItem {
  key: QuoteKey
  label: string
  /** the unit the report and this result are shown in */
  unit: string
  decimals: number
  /** the contractor's figure, converted to `unit` */
  yours: number
  /** the report figure it was compared with */
  report: number
  /** yours / report, minus one, as a percentage (positive means the contractor's figure is higher) */
  pctVsReport: number
  /** the range the report says the true number should fall in */
  bandLow: number
  bandHigh: number
  /** the top of the published real-building range, converted to the compared basis (steel, concrete only) */
  practiceHigh: number | null
  verdict: QuoteVerdict
  headline: string
  advice: string
}

export type QuoteRead = { ok: true; input: QuoteInput } | { ok: false; error: string }

export const M3_TO_CFT = 35.3147
export const SQM_TO_SQFT = 10.7639
/** Written into the report as "5% cutting waste"; the ratio is read from the report so the two cannot drift apart. */
const NEAR_UP = 1.10
const UNIT_SLIP = 4

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1e9

/** Read the form. Blank fields are skipped; at least one figure is needed. */
export function readQuote(raw: Record<string, unknown>): QuoteRead {
  const num = (k: string): number | null => {
    const s = raw[k]
    if (s === undefined || s === null || String(s).trim() === '') return null
    const v = Number(String(s).replace(/,/g, '').trim())
    return Number.isFinite(v) ? v : NaN
  }
  const input: QuoteInput = {}
  const c = num('concrete')
  const s = num('steel')
  const m = num('cement')
  const sh = num('shuttering')
  for (const [name, v] of [['concrete', c], ['steel', s], ['cement', m], ['shuttering', sh]] as const) {
    if (v !== null && !positive(v)) return { ok: false, error: `The ${name} figure needs to be a number above zero.` }
  }
  if (c !== null) input.concrete = { value: c, unit: raw.concreteUnit === 'cft' ? 'cft' : 'm3' }
  if (s !== null) {
    const unit: SteelUnit = raw.steelUnit === 'tonne' ? 'tonne' : raw.steelUnit === 'quintal' ? 'quintal' : 'kg'
    input.steel = { value: s, unit, basis: raw.steelBasis === 'drawing' ? 'drawing' : 'order' }
  }
  if (m !== null) input.cement = { value: m }
  if (sh !== null) input.shuttering = { value: sh, unit: raw.shutteringUnit === 'sqm' ? 'sqm' : 'sqft' }
  if (!input.concrete && !input.steel && !input.cement && !input.shuttering) return { ok: false, error: 'Enter at least one figure from your contractor.' }
  return { ok: true, input }
}

interface Spec {
  key: QuoteKey
  label: string
  unit: string
  decimals: number
  yours: number
  report: number
  band: [number, number]
  practiceHigh: number | null
  /** what a figure of this kind most often leaves out or adds, in the words used under the verdict */
  scopeHint: string
  unitHint: string
  /** what to ask for when a figure is above everything expected */
  askFor: string
}

function place(s: Spec): QuoteItem {
  const ratio = s.yours / s.report
  const bandLow = s.report * s.band[0]
  const bandHigh = s.report * s.band[1]
  const topEdge = Math.max(bandHigh, s.practiceHigh ?? 0)
  let verdict: QuoteVerdict
  if (ratio > UNIT_SLIP || ratio < 1 / UNIT_SLIP) verdict = 'units'
  else if (s.yours < bandLow) verdict = 'below'
  else if (s.yours <= s.report * NEAR_UP) verdict = 'near'
  else if (s.yours <= topEdge) verdict = 'inside'
  else verdict = 'above'

  let headline = ''
  let advice = ''
  switch (verdict) {
    case 'units':
      headline = 'This is far from the report figure. Check the unit.'
      advice = `${s.unitHint} If the unit is right, the two are for different things: ask what the contractor’s figure covers.`
      break
    case 'below':
      headline = 'Lower than this frame should need.'
      advice = `Ask whether anything is left out, such as ${s.scopeHint}, or whether a smaller building was priced. A figure below the range can mean a gap that shows up later as extra material or a cut in the structure.`
      break
    case 'near':
      headline = 'Close to the code figure.'
      advice = 'This is in line with a frame designed to the Indian Standards. Real buildings usually use somewhat more, so a little above is normal.'
      break
    case 'inside':
      headline = 'Above the code figure, inside the range real buildings fall in.'
      advice = 'This is common. Site practice adds margin that no code asks for. It is worth asking how much margin is built in and where, not a sign of a problem.'
      break
    case 'above':
      headline = 'Above everything we would expect for this frame.'
      advice = `Ask for the working behind it: ${s.askFor}. Check also that the scope matches (this report counts only the reinforced-concrete frame of the house, not a boundary wall, an overhead or underground tank, or a septic tank).`
      break
  }
  return {
    key: s.key,
    label: s.label,
    unit: s.unit,
    decimals: s.decimals,
    yours: s.yours,
    report: s.report,
    pctVsReport: (ratio - 1) * 100,
    bandLow,
    bandHigh,
    practiceHigh: s.practiceHigh,
    verdict,
    headline,
    advice,
  }
}

/** Compare the figures entered with the report. Returns one result per figure entered, in a fixed order. */
export function checkQuote(ref: QuoteReference, q: QuoteInput): QuoteItem[] {
  const out: QuoteItem[] = []

  if (q.concrete) {
    const m3 = q.concrete.unit === 'cft' ? q.concrete.value / M3_TO_CFT : q.concrete.value
    out.push(place({
      key: 'concrete', label: 'Concrete', unit: 'm³', decimals: 1,
      yours: m3, report: ref.totals.concreteM3, band: ref.band.concrete,
      practiceHigh: ref.practice ? ref.practice.concreteM3[1] : null,
      scopeHint: 'the staircase, lintels, balcony slabs or foundations',
      askFor: 'the member-wise quantity sheet (footings, columns, beams, slabs, stairs, one line each)',
      unitHint: 'Concrete is quoted in cubic metres or cubic feet, and one cubic metre is about 35 cubic feet, so mixing them up changes the figure 35 times.',
    }))
  }

  if (q.steel) {
    const kg = q.steel.unit === 'tonne' ? q.steel.value * 1000 : q.steel.unit === 'quintal' ? q.steel.value * 100 : q.steel.value
    const drawing = q.steel.basis === 'drawing'
    const base = drawing ? ref.totals.steelNetKg : ref.totals.steelBuyKg
    // the published range counts the steel in the drawing, so compare it on bar weight: take the cutting waste back out of an order figure
    const wasteRatio = ref.totals.steelBuyKg / ref.totals.steelNetKg
    const practiceHigh = ref.practice ? ref.practice.steelKg[1] * (drawing ? 1 : wasteRatio) : null
    out.push(place({
      key: 'steel', label: drawing ? 'Steel (bar weight, from the drawing)' : 'Steel to buy', unit: 'kg', decimals: 0,
      yours: kg, report: base, band: ref.band.steel, practiceHigh,
      scopeHint: 'the stirrups and ties, the staircase, or the steel in lintels and balcony slabs',
      askFor: 'the bar bending schedule, which lists every bar by member, diameter, length and weight',
      unitHint: 'Steel is quoted in kilograms, quintals (100 kg) or tonnes (1,000 kg), and the figure changes 100 or 1,000 times between them.',
    }))
  }

  if (q.cement) {
    out.push(place({
      key: 'cement', label: 'Cement (50 kg bags)', unit: 'bags', decimals: 0,
      yours: q.cement.value, report: ref.materials.cementBags, band: ref.band.cement, practiceHigh: null,
      scopeHint: 'the lean concrete under the footings, or the cement for the staircase and lintels',
      askFor: 'the concrete mix they assumed (M20, M25) and the bags of cement they allowed per cubic metre of it',
      unitHint: 'This report counts cement in 50 kg bags. A figure in tonnes needs multiplying by 20 first.',
    }))
  }

  if (q.shuttering) {
    const sqft = q.shuttering.unit === 'sqm' ? q.shuttering.value * SQM_TO_SQFT : q.shuttering.value
    out.push(place({
      key: 'shuttering', label: 'Shuttering (contact area)', unit: 'sq ft', decimals: 0,
      yours: sqft, report: ref.materials.formworkSqft, band: ref.band.formwork, practiceHigh: null,
      scopeHint: 'the staircase, lintels, or the sides of the footings',
      askFor: 'the shuttering area worked out for each member, and how many times they plan to reuse the plates',
      unitHint: 'Shuttering is quoted in square feet or square metres, and one square metre is about 10.8 square feet.',
    }))
  }

  return out
}

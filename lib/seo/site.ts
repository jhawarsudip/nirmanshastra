// ─────────────────────────────────────────────────────────────────────────────
// SEO / AEO — site facts (single source for JSON-LD, llms.txt, llms-full.txt)
//
// Prices are NEVER typed here. They are read from lib/tool-pricing.ts and
// lib/site-templates.ts (the same server-trusted sources the payment routes use),
// so structured data and llms.txt can never disagree with what the site charges.
// ─────────────────────────────────────────────────────────────────────────────

import { TOOL_PRICE_PAISE, type PaidAppType } from '@/lib/tool-pricing'
import { SITE_TEMPLATES, BUNDLE_PRICE_PAISE } from '@/lib/site-templates'

export const SITE_URL = 'https://www.nirmanshastra.in'
export const SITE_NAME = 'NirmanShastra'
export const SUPPORT_EMAIL = 'reports@nirmanshastra.in'
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
export const LOGO_URL = `${SITE_URL}/icon-512.png`

export const SITE_SUMMARY =
  "NirmanShastra is an Indian construction cost estimator. It gives IS-code-based material quantities and cost estimates (BOQ) for houses and buildings, so homeowners can check a contractor's quote before they pay. It has 10 free calculators, paid BOQ reports (StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro, Grand Total), Excel site templates and a free contractor-quote comparison tool, in English and Hindi."

// Authorship decision: no personal name, institute or employer anywhere
// (pages, schema, metadata). Reviewer line is deliberately generic.
export const REVIEW_NOTE = 'Written and checked by a civil engineer (B.Tech Civil).'
export const ORG_REVIEW_DESCRIPTION =
  'Content is written and reviewed by a civil engineer (B.Tech Civil). Quantities follow the Indian Standards listed on the IS Codes Used page.'

export const abs = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`)

export const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

// ── Tools ────────────────────────────────────────────────────────────────────

export type ToolKind = 'free-calculator' | 'free-tool' | 'paid-report'

export interface ToolEntry {
  path: string
  name: string
  kind: ToolKind
  /** One factual line. Wording is condensed from each page's own metadata description. */
  summary: string
  /** Main IS code(s) the tool is built on, as printed on the page. */
  isCodes: string[]
  appType?: PaidAppType
}

export const TOOLS: ToolEntry[] = [
  // ── 10 free calculators ──
  {
    path: '/tools/bar-bending-schedule-calculator',
    name: 'Bar Bending Schedule Calculator',
    kind: 'free-calculator',
    summary:
      'Rebar cutting length and unit weight for 13 standard shapes (stirrups, cranked bars, hooks), with bend deductions and hook allowances.',
    isCodes: ['IS 2502'],
  },
  {
    path: '/tools/water-tank-size-calculator',
    name: 'Water Tank Size Calculator',
    kind: 'free-calculator',
    summary:
      'Daily demand, required storage and the nearest standard tank size from occupants, water source and days of storage, using the IS 1172:1993 per-capita demand (135 / 150 LPCD) and the 2/3-day storage rule.',
    isCodes: ['IS 1172:1993'],
  },
  {
    path: '/tools/concrete-mix-ratio-calculator',
    name: 'Concrete Mix Ratio Calculator',
    kind: 'free-calculator',
    summary:
      'Cement bags, sand and aggregate for a given concrete volume and grade (M20 = 1:1.5:3, M25 = 1:1:2), using IS 456:2000 per-cubic-metre quantities. M30 and above are flagged as design mixes.',
    isCodes: ['IS 456:2000'],
  },
  {
    path: '/tools/brick-calculator',
    name: 'Brick Calculator',
    kind: 'free-calculator',
    summary:
      'Brick count for 9-inch and 4.5-inch walls with openings and a 5–10% wastage allowance: 100 and 50 bricks per m² for the standard 190×90×90 mm modular brick.',
    isCodes: ['IS 1077:1992', 'IS 2212:1991'],
  },
  {
    path: '/tools/wire-size-calculator',
    name: 'Wire Size Calculator',
    kind: 'free-calculator',
    summary:
      'Minimum copper conductor cross-section (1.5, 2.5, 4.0, 6.0 or 10.0 sqmm) by circuit type: lighting and fans, power sockets, AC/geyser, sub-panel feed, main incomer.',
    isCodes: ['IS 732:2019'],
  },
  {
    path: '/tools/ra-bill-retention-tds-calculator',
    name: 'RA Bill Calculator (Retention, GST, TDS)',
    kind: 'free-calculator',
    summary:
      'Net payable on a running-account bill after retention, advance recovery, GST and TDS. Defaults are 5% retention, 18% GST and 1% TDS, all editable.',
    isCodes: [],
  },
  {
    path: '/tools/concrete-cube-test-calculator',
    name: 'Concrete Cube Test Calculator',
    kind: 'free-calculator',
    summary:
      'Minimum number of acceptance samples and total cubes to cast for a concrete pour, per IS 456:2000 Cl 15.2.2.',
    isCodes: ['IS 456:2000'],
  },
  {
    path: '/tools/daily-wage-pf-esi-calculator',
    name: 'Daily-Wage PF & ESI Calculator',
    kind: 'free-calculator',
    summary:
      'Muster-roll style net payable for construction site labour: gross wages less employee PF (12%, capped at ₹1,800), employee ESI (0.75% of gross up to the ₹21,000 ceiling) and advances.',
    isCodes: [],
  },
  {
    path: '/tools/finish-tier-cost-calculator',
    name: 'Finish-Tier Cost Calculator',
    kind: 'free-calculator',
    summary:
      'Per-element and total cost difference between any two finish tiers (Basic, Standard, Premium, Luxury) for an Indian home, at indicative Tier-2 city rates.',
    isCodes: [],
  },
  {
    path: '/tools/earned-value-calculator',
    name: 'Earned Value Calculator',
    kind: 'free-calculator',
    summary:
      'SV, CV, SPI, CPI, EAC, ETC, VAC and TCPI from Budget at Completion, Planned Value, Earned Value and Actual Cost.',
    isCodes: [],
  },

  // ── Other free tools ──
  {
    path: '/tools/vastu-pro',
    name: 'VastuPro',
    kind: 'free-tool',
    summary:
      'Free Vastu analysis of a home: mark 33 rooms on the floor plan and get a zone-by-zone compliance score and a free PDF report.',
    isCodes: [],
  },
  {
    path: '/compare-quote',
    name: 'Compare Contractor Quote',
    kind: 'free-tool',
    summary:
      "Upload a contractor's quote and see which line items are above IS-code quantities and typical rates. Free.",
    isCodes: [],
  },

  // ── Paid BOQ reports (prices come from lib/tool-pricing.ts) ──
  {
    path: '/tools/structopro',
    name: 'StructurePro',
    kind: 'paid-report',
    appType: 'structopro',
    summary:
      'Itemised RCC structure BOQ: concrete, steel and structural cost for a building, using IS 456:2000.',
    isCodes: ['IS 456:2000', 'IS 1786:2008', 'IS 1893:2016'],
  },
  {
    path: '/tools/masonpro',
    name: 'MasonryPro',
    kind: 'paid-report',
    appType: 'masonpro',
    summary:
      'Itemised masonry BOQ: brick counts, mortar quantities and plastering costs for 8 wall types, per IS 1077:1992.',
    isCodes: ['IS 1077:1992'],
  },
  {
    path: '/tools/electropro',
    name: 'ElectricalPro',
    kind: 'paid-report',
    appType: 'electropro',
    summary: 'Wire lengths, DB panel circuits and MCB costs for a house, per IS 732:2019.',
    isCodes: ['IS 732:2019'],
  },
  {
    path: '/tools/plumbpro',
    name: 'PlumbingPro',
    kind: 'paid-report',
    appType: 'plumbpro',
    summary: 'Pipe lengths, tank sizes, pump HP and fixture costs as an itemised plumbing BOQ, per IS 1172:1993.',
    isCodes: ['IS 1172:1993'],
  },
  {
    path: '/tools/interiorpro',
    name: 'InteriorPro',
    kind: 'paid-report',
    appType: 'interiorpro',
    summary: 'Flooring, kitchen, false ceiling and paint costs across 4 quality grades, Basic to Luxury, as an interior BOQ.',
    isCodes: [],
  },
  {
    path: '/tools/grand-total',
    name: 'Grand Total Report',
    kind: 'paid-report',
    appType: 'grandtotal',
    summary:
      'All 5 phases (structure, masonry, electrical, plumbing, interior) merged into one complete BOQ report.',
    isCodes: [],
  },
]

export const getTool = (path: string) => TOOLS.find((t) => t.path === path)

export const priceOfTool = (t: ToolEntry): number | null =>
  t.appType ? TOOL_PRICE_PAISE[t.appType] : null

// ── Excel site templates (prices come from lib/site-templates.ts) ────────────

const TEMPLATE_META: Record<string, { path: string; summary: string }> = {
  'cost-estimator': {
    path: '/site-templates/cost-estimator',
    summary:
      'A 16-sheet Excel construction cost estimator for Indian homes: build a BOQ from IS-code rate analysis, generate a client quotation, compare up to 3 contractor quotes line by line, and track budget vs actual.',
  },
  'documentation-pack': {
    path: '/site-templates/site-documentation',
    summary:
      'A 14-sheet Excel site documentation pack: drawing register, RFI register, NCR and test registers, procurement log, daily site log and snag list.',
  },
  'billing-measurement': {
    path: '/site-templates/billing-measurement',
    summary:
      'A 9-sheet Excel billing and measurement workbook: measurement book, IS 1200 deductions, abstract against BOQ, and RA bills with retention, TDS (Section 393) and GST.',
  },
  'bar-bending-schedule': {
    path: '/site-templates/bar-bending-schedule',
    summary:
      'A 12-sheet Excel bar bending schedule template: shape library, cutting-length calculator with bend deductions and hook allowances per IS 2502, lap and development lengths, cutting optimiser and steel order note.',
  },
  'labour-compliance': {
    path: '/site-templates/labour-compliance',
    summary:
      "A 16-sheet Excel labour payroll and compliance workbook: muster roll, wage register, PF/ESI and minimum-wage checks, wage slips and subcontractor compliance holds under India's four Labour Codes.",
  },
  'planning-progress': {
    path: '/site-templates/planning-progress',
    summary:
      'A 17-sheet Excel project controls workbook: baseline plan, Gantt, value-weighted S-curve and earned value, cash flow, plus a delay and EOT register.',
  },
}

export interface TemplateEntry {
  id: string
  name: string
  path: string
  summary: string
  pricePaise: number
}

export const TEMPLATES: TemplateEntry[] = SITE_TEMPLATES.filter((t) => TEMPLATE_META[t.id]).map(
  (t) => ({
    id: t.id,
    name: t.title,
    path: TEMPLATE_META[t.id].path,
    summary: TEMPLATE_META[t.id].summary,
    pricePaise: t.price,
  })
)

export const BUNDLE = {
  name: 'All 6 Toolkits — Bundle',
  path: '/site-templates',
  pricePaise: BUNDLE_PRICE_PAISE,
}

export const getTemplate = (path: string) => TEMPLATES.find((t) => t.path === path)

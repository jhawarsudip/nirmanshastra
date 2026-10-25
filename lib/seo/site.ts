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
export const SUPPORT_EMAIL = 'nirmanshastraindia@gmail.com'
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
export const LOGO_URL = `${SITE_URL}/icon-512.png`

export const SITE_SUMMARY =
  "NirmanShastra is an Indian construction quantity estimator. From a few plain answers about a plot and plan it works out, to the Indian Standards, how much concrete, steel, cement, sand, aggregate, bricks, wire and pipe a house needs, so homeowners know the quantities before they order or sign. It gives quantities only: no labour, dealer or contractor rates. It has 10 free calculators, paid quantity reports (StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro, Grand Total), Excel site templates and a free tool to compare a contractor's quantities with ours, in English and Hindi."

// Authorship decision: no personal name, institute or employer anywhere
// (pages, schema, metadata). Reviewer line is deliberately generic.
export const REVIEW_NOTE = 'Written by the NirmanShastra founder, who holds a B.Tech in Civil Engineering. Not a structural design and not reviewed by a practising engineer.'
export const ORG_REVIEW_DESCRIPTION =
  'Content is written by the founder, who holds a B.Tech in Civil Engineering. It is not reviewed by a practising engineer. Quantities follow the Indian Standards listed on the IS Codes Used page, and each report says what it could not check.'

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
    name: 'Bar Bending Calculator',
    kind: 'free-calculator',
    summary:
      'Cutting length and weight of one bar: straight, L, U, 45° crank, stirrup and square tie. Bends taken off, 135° hooks added, length rounded up to 25 mm, weight d² ÷ 162.2 kg a metre; the same rules as the StructurePro model.',
    isCodes: ['IS 2502:1963', 'IS 1786:2008', 'IS 13920'],
  },
  {
    path: '/tools/water-tank-size-calculator',
    name: 'Water Tank Size Calculator',
    kind: 'free-calculator',
    summary:
      'The day’s water use and the underground and overhead tank sizes for a house, from the number of people and the water source (piped, borewell or tanker): 135 / 150 litres a person (IS 1172:1993) split between the tanks as in the NBC Part 9 draft, rounded up to ready-made sizes.',
    isCodes: ['IS 1172:1993', 'IS 2065:1983'],
  },
  {
    path: '/tools/concrete-mix-ratio-calculator',
    name: 'Concrete Mix Calculator',
    kind: 'free-calculator',
    summary:
      'Cement bags, sand and aggregate for a volume of concrete, by grade (M10 to M40) and site exposure. M20 and below are the CPWD nominal mixes (M20 = 1:1.5:3 = 400 kg of cement a cubic metre); M25 and above are an IS 10262 working within the IS 456 Table 5 limits.',
    isCodes: ['IS 456:2000', 'IS 10262:2009'],
  },
  {
    path: '/tools/brick-calculator',
    name: 'Brick Calculator',
    kind: 'free-calculator',
    summary:
      'Brick count, order with breakage and joint mortar for a wall, for the red (230×115×75 mm), modular (190×90×90 mm) or 230×110×70 mm brick, one or half a brick thick, with openings taken out.',
    isCodes: ['IS 1077:1992', 'IS 12894:2002', 'IS 2212:1991'],
  },
  {
    path: '/tools/wire-size-calculator',
    name: 'Wire Size Calculator',
    kind: 'free-calculator',
    summary:
      'Least copper wire for a circuit in a home (1.5, 2.5 or 4 mm²), or for the supply from the meter by load (4, 6 or 10 mm² up to 10 kW), with the breaker and conduit.',
    isCodes: ['IS 4648 (draft revision, 2024)'],
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
      'The least number of samples for a pour of one grade of concrete (IS 456:2000 clause 15.2.2, counting “or part thereof” above 50 m³) and the cubes to cast: three a sample, tested at 28 days.',
    isCodes: ['IS 456:2000'],
  },
  {
    path: '/tools/daily-wage-pf-esi-calculator',
    name: 'Daily-Wage PF & ESI Calculator',
    kind: 'free-calculator',
    summary:
      'Muster-roll style net payable for construction site labour: gross wages less employee PF (12%, capped at ₹1,800), employee ESI (0.75% of wages for a covered worker: basic of ₹21,000 or less, average day above ₹176) and advances.',
    isCodes: [],
  },
  {
    path: '/tools/paint-tile-calculator',
    name: 'Paint and Tile Calculator',
    kind: 'free-calculator',
    summary:
      'Paint, putty and primer for a wall or ceiling, or tiles, boxes, grout and fixing for a floor or wall, from the area and the finish chosen, with wastage allowances.',
    isCodes: ['IS 1200 (Part 11, 13)', 'IS 15622:2006'],
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
      'Free Vastu check of a home plan: set where North is, mark your rooms, and get each one read by its zone among the 16, an overall score and a PDF of your findings. A traditional system, not an IS code.',
    isCodes: [],
  },
  {
    path: '/compare-quote',
    name: "Check a Contractor's Quantities",
    kind: 'free-tool',
    summary:
      "A free guide to the four quantities to ask a contractor for (concrete, steel, cement, shuttering) and how to read them. The line-by-line check against your own frame is inside the StructurePro report.",
    isCodes: [],
  },

  // ── Paid quantity reports (prices come from lib/tool-pricing.ts) ──
  {
    path: '/tools/structopro',
    name: 'StructurePro',
    kind: 'paid-report',
    appType: 'structopro',
    summary:
      'RCC frame quantity report: concrete, steel (by bar diameter), cement, sand, aggregate and shuttering for footings, columns, beams, slabs and stairs, worked out to IS 456, IS 875, IS 1893 and IS 13920 from a few plain answers.',
    isCodes: ['IS 456:2000', 'IS 875', 'IS 1893:2016', 'IS 13920:2016', 'IS 1786:2008'],
  },
  {
    path: '/tools/masonpro',
    name: 'MasonryPro',
    kind: 'paid-report',
    appType: 'masonpro',
    summary:
      'Masonry quantity report: brick or block counts, mortar and plaster quantities (cement and sand) for external and internal walls, per IS 1077 and IS 2212.',
    isCodes: ['IS 1077:1992'],
  },
  {
    path: '/tools/electropro',
    name: 'ElectricalPro',
    kind: 'paid-report',
    appType: 'electropro',
    summary: 'Points, circuits, boards, wire by size and colour, conduit and fittings for the wiring of a house, from the CPWD specification and the BIS draft of IS 4648.',
    isCodes: ['IS 4648 (draft revision, 2024)', 'IS 4648:1968', 'IS 732:1989'],
  },
  {
    path: '/tools/plumbpro',
    name: 'PlumbingPro',
    kind: 'paid-report',
    appType: 'plumbpro',
    summary: 'Pipe lengths by size, fittings, tank sizes, pump size and fixture counts as a plumbing quantity report, per IS 1172:1993.',
    isCodes: ['IS 1172:1993'],
  },
  {
    path: '/tools/interiorpro',
    name: 'InteriorPro',
    kind: 'paid-report',
    appType: 'interiorpro',
    summary: 'Flooring, paint, false ceiling and kitchen quantities room by room, with wastage, as an interior quantity report.',
    isCodes: [],
  },
  {
    path: '/tools/grand-total',
    name: 'Grand Total Report',
    kind: 'paid-report',
    appType: 'grandtotal',
    summary:
      'Your paid frame, walls, wiring, plumbing and finishing reports added into one list of what to buy, with shared materials added up and nothing counted twice.',
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
      'A 17-sheet Excel construction cost estimator for Indian homes: build a BOQ from IS-code rate analysis, generate a client quotation, compare up to 3 contractor quotes line by line, and track budget vs actual.',
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

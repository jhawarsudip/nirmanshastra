// ─────────────────────────────────────────────────────────────────────────────
// Answer-first content for the 6 paid report pages (StructurePro … Grand Total).
//
// RULES
//  • No price is typed here. Prices are read from lib/tool-pricing.ts via site.ts.
//  • CLAUDE.md: "Never reveal paid quantities before server HMAC verification."
//    So every worked example uses ONLY numbers the free calculators / free guides
//    already publish (bricks per m², litres per person, wire sizes, the 0.4 bag and
//    4 kg per sq ft thumb rules, interior paint/tile constants). It is a sample of
//    the method, never a per-project paid output.
//  • Every figure traces to an engine constant; `source` says which.
// ─────────────────────────────────────────────────────────────────────────────

import { getTool, priceOfTool, inr } from '@/lib/seo/site'
import type { CalcFaq } from '@/lib/seo/calc-content'

export interface PaidExampleRow {
  label: string
  value: string
  note?: string
}

export interface PaidContent {
  /** e.g. "What StructurePro gives you" */
  heading: string
  whatsInside: string[]
  whoFor: string
  example: { title: string; intro: string; rows: PaidExampleRow[]; footnote: string }
  faq: CalcFaq[]
  /** Where the numbers come from, for re-verification (not rendered). */
  source: string
}

const priceLine = (path: string) => {
  const t = getTool(path)
  const p = t ? priceOfTool(t) : null
  return p === null ? '' : inr(p)
}

export const PAID_CONTENT: Record<string, PaidContent> = {
  // ── StructurePro ───────────────────────────────────────────────────────────
  '/tools/structopro': {
    heading: 'What StructurePro gives you',
    whatsInside: [
      'Cement bags, steel (kg), coarse aggregate, sand, binding wire, admixture and formwork quantities for the whole structure.',
      'A foundation recommendation matched to your site condition, with a cost range.',
      'The seismic zone for your state (IS 1893:2016) and the exposure class (IS 456:2000).',
      'IS compliance checks against IS 456:2000, with the clause shown.',
      'A cost comparison across M20, M25, M30 and M35 concrete grades.',
      'A Basic, Standard and Premium grand-total cost range, with or without labour.',
      'A separate vertical-extension estimate for adding floors to an existing building.',
    ],
    whoFor:
      'Homeowners and small builders planning a ground-floor to G+5 RCC house who want the structure’s quantities and cost before they sign a contractor’s quote.',
    example: {
      title: 'Sample: 1,000 sq ft built-up, G+1, M20 concrete, Fe500 steel',
      intro:
        'The report starts from the thumb rules below, then applies your own area, floors, state, site condition and grades.',
      rows: [
        { label: 'Cement', value: '400 bags', note: '0.4 bag per sq ft of built-up area' },
        { label: 'Steel', value: '4,000 kg', note: '4 kg per sq ft of built-up area' },
      ],
      footnote:
        'These are the same thumb rules explained in our free guides, valid for G+1 to G+3. The paid report adds aggregate, sand, binding wire, admixture, formwork, the foundation and the IS compliance checks for your inputs.',
    },
    faq: [
      {
        question: 'What does StructurePro calculate?',
        answer:
          'It estimates the RCC structure of a house: cement, steel, aggregate, sand, binding wire, admixture and formwork quantities, a foundation recommendation for your site, IS 456:2000 compliance checks, a concrete-grade cost comparison and a Basic, Standard and Premium cost range.',
      },
      {
        question: 'How much does StructurePro cost?',
        answer: `The StructurePro report costs ${priceLine('/tools/structopro')} per report, inclusive of GST.`,
      },
      {
        question: 'How much cement and steel does a 1,000 sq ft house need?',
        answer:
          'By the thumb rules the report starts from, 0.4 bag of cement and 4 kg of steel per sq ft of built-up area for G+1 to G+3, so 1,000 sq ft needs about 400 bags of cement and 4,000 kg of steel. The report refines this for your own floors, grade and site.',
      },
      {
        question: 'Which IS codes does StructurePro follow?',
        answer:
          'IS 456:2000 for plain and reinforced concrete, IS 1786:2008 for reinforcement bars and IS 1893:2016 for seismic zoning.',
      },
      {
        question: 'Does the estimate include labour?',
        answer:
          'Labour can be included or left out of the grand-total range, so you can compare it with a materials-only quote or a labour-inclusive one.',
      },
      {
        question: 'Is StructurePro a structural design?',
        answer:
          'No. It is a quantity and cost estimate (a BOQ). A structural engineer must design and approve the structure before construction.',
      },
    ],
    source:
      'structopro-engine.ts IS_THUMB (0.4 bag, 4 kg per sq ft), floorFactor (1.00 for G+1..G+3), GRADE_COST_FACTOR M20..M40, includeLabour flag; prices via tool-pricing. Sample uses only the two thumb rules already printed in lib/blog-content.ts.',
  },

  // ── MasonryPro ─────────────────────────────────────────────────────────────
  '/tools/masonpro': {
    heading: 'What MasonryPro gives you',
    whatsInside: [
      'Brick or block counts for 8 external wall types: modular and non-modular red clay brick, modular and non-modular fly ash brick, hollow and solid concrete block, AAC block and CLC foam block.',
      'Internal partition options: 4.5-inch clay or fly ash brick, 100 mm hollow concrete, AAC or CLC block, and gypsum board.',
      'Mortar quantities and plastering costs.',
      'An itemised masonry BOQ built on IS 1077:1992.',
    ],
    whoFor:
      'Homeowners comparing a mason’s or contractor’s quote for bricks, blocks, mortar and plaster on a new house.',
    example: {
      title: 'Sample: 10 m × 3 m external wall, 9-inch modular red clay brick, no openings',
      intro: 'The same counting method the free Brick Calculator uses.',
      rows: [
        { label: 'Wall area', value: '30 m²', note: '10 m × 3 m' },
        { label: 'Bricks per m²', value: '100', note: '9-inch modular clay, IS 1077:1992' },
        { label: 'Bricks laid', value: '3,000', note: '30 × 100' },
        { label: 'Order with 5–10% wastage', value: 'about 3,150 to 3,300' },
      ],
      footnote:
        'MasonryPro extends this to all 8 external wall types and the internal partitions, adds mortar and plaster, and totals them for your whole house.',
    },
    faq: [
      {
        question: 'What does MasonryPro calculate?',
        answer:
          'Brick or block counts, mortar quantities and plastering costs for 8 external wall types and a range of internal partitions, as an itemised masonry BOQ based on IS 1077:1992.',
      },
      {
        question: 'How much does MasonryPro cost?',
        answer: `The MasonryPro report costs ${priceLine('/tools/masonpro')} per report, inclusive of GST.`,
      },
      {
        question: 'Which wall materials does it cover?',
        answer:
          'Red clay brick and fly ash brick (modular and non-modular), hollow and solid concrete blocks, AAC blocks and CLC foam blocks for external walls, plus 4.5-inch brick, 100 mm blocks and gypsum board partitions inside.',
      },
      {
        question: 'How is it different from the free Brick Calculator?',
        answer:
          'The free Brick Calculator counts modular clay bricks for one wall at a time, at 100 bricks per m² for a 9-inch wall and 50 for a 4.5-inch partition. MasonryPro covers all 8 external wall materials and the partitions, and adds mortar and plaster for the whole house.',
      },
      {
        question: 'How many bricks are in a 10 m × 3 m wall?',
        answer:
          'A 9-inch modular clay wall of 30 m² needs 3,000 bricks before wastage, about 3,150 to 3,300 once 5–10% is added.',
      },
    ],
    source:
      'masonpro-engine.ts EXTERNAL_WALL_SPECS (8) / INTERNAL_WALL_SPECS (6) labels; brick-engine.ts 100 bricks per m², wastage 5/10%. Sample equals the free Brick Calculator default.',
  },

  // ── ElectricalPro ──────────────────────────────────────────────────────────
  '/tools/electropro': {
    heading: 'What ElectricalPro gives you',
    whatsInside: [
      'Wire lengths for the whole house, sized by circuit.',
      'A distribution-board (DB) panel schedule with each circuit and its MCB.',
      'A schedule of electrical points.',
      'MCB and material costs.',
      'Compliance checks against IS 732:2019.',
    ],
    whoFor:
      'Homeowners who want the wiring quantities and MCB costs worked out before an electrician quotes.',
    example: {
      title: 'Sample: minimum copper wire and typical MCB for each circuit',
      intro: 'IS 732:2019 Cl 6.2 minimum cross-sections, the same table the free Wire Size Calculator uses.',
      rows: [
        { label: 'Lighting and fans', value: '1.5 mm²', note: 'typical 6 A MCB' },
        { label: 'Power sockets', value: '2.5 mm²', note: 'typical 16 A MCB' },
        { label: 'AC or geyser (2 kW and above)', value: '4 mm²', note: 'typical 20 A MCB, dedicated circuit' },
        { label: 'Sub-panel feed', value: '6 mm²', note: 'typical 32 A MCB or isolator' },
        { label: 'Main incomer', value: '10 mm²', note: 'main MCB or MCCB, 32 A to 63 A by demand' },
      ],
      footnote:
        'ElectricalPro applies this to your own rooms and points to produce the wire lengths, DB schedule and cost.',
    },
    faq: [
      {
        question: 'What does ElectricalPro calculate?',
        answer:
          'Wire lengths, DB panel circuits, electrical points and MCB costs for a house, checked against IS 732:2019.',
      },
      {
        question: 'How much does ElectricalPro cost?',
        answer: `The ElectricalPro report costs ${priceLine('/tools/electropro')} per report, inclusive of GST.`,
      },
      {
        question: 'What wire size is needed for an AC?',
        answer:
          'The IS 732:2019 minimum used here is 4 mm² copper on a dedicated circuit, with a typical 20 A MCB.',
      },
      {
        question: 'Is there a free way to check a wire size?',
        answer:
          'Yes. The free Wire Size Calculator gives the minimum copper size and typical MCB for each of the five circuit types. ElectricalPro adds the lengths, DB schedule and costs for your whole house.',
      },
    ],
    source:
      'electropro-engine.ts WIRE_SIZES via wire-size-engine.ts CIRCUIT_SPECS (1.5/2.5/4/6/10 mm², typical MCBs); interfaces DBPanelSchedule, WireSchedule, PointSchedule, ComplianceCheck.',
  },

  // ── PlumbingPro ────────────────────────────────────────────────────────────
  '/tools/plumbpro': {
    heading: 'What PlumbingPro gives you',
    whatsInside: [
      'Daily water demand and tank size for your household.',
      'Pipe lengths and a pipe schedule.',
      'Pump horsepower.',
      'A fixture schedule with costs.',
      'An itemised plumbing BOQ based on IS 1172:1993.',
    ],
    whoFor:
      'Homeowners who want the water tank, pipe and fixture quantities worked out before a plumber quotes.',
    example: {
      title: 'Sample: 5 people on municipal supply',
      intro: 'The IS 1172:1993 method, the same one the free Water Tank Size Calculator uses.',
      rows: [
        { label: 'Daily demand', value: '675 L', note: '5 people × 135 litres per person per day' },
        { label: 'Storage', value: '452 L', note: 'two-thirds of a day’s demand (× 0.67)' },
        { label: 'Tank to buy', value: '500 L', note: 'next standard size' },
      ],
      footnote:
        'Borewell supply uses 150 litres per person per day. PlumbingPro adds pipe lengths, pump horsepower and fixtures for your own bathrooms and floors.',
    },
    faq: [
      {
        question: 'What does PlumbingPro calculate?',
        answer:
          'Pipe lengths, tank sizes, pump horsepower and fixture costs as an itemised plumbing BOQ, based on IS 1172:1993.',
      },
      {
        question: 'How much does PlumbingPro cost?',
        answer: `The PlumbingPro report costs ${priceLine('/tools/plumbpro')} per report, inclusive of GST.`,
      },
      {
        question: 'How much water per person does it assume?',
        answer:
          '135 litres per person per day on municipal supply and 150 on borewell supply (IS 1172:1993).',
      },
      {
        question: 'What tank does a family of 5 need?',
        answer:
          'On municipal supply, 675 litres a day means 452 litres of storage, so a 500 L tank. On borewell supply it is 750 litres a day and 503 litres of storage, which steps up to a 1,000 L tank.',
      },
    ],
    source:
      'plumbpro-engine.ts WATER_DEMAND_LPCD {135,150}, TANK_RATIO 0.67; water-tank-engine.ts STANDARD_TANK_SIZES; calculate({5, municipal, 1 day}) = 675 / 452 / 500.',
  },

  // ── InteriorPro ────────────────────────────────────────────────────────────
  '/tools/interiorpro': {
    heading: 'What InteriorPro gives you',
    whatsInside: [
      'Flooring, kitchen, false ceiling and paint costs.',
      'Four quality grades, Basic, Standard, Premium and Luxury, side by side.',
      'A room-by-room breakdown.',
      'A flooring schedule that includes tile wastage, and a paint schedule.',
      'An interior BOQ you can set against a designer’s or contractor’s quote.',
    ],
    whoFor:
      'Homeowners who want to see what moving between Basic and Luxury finishes does to the interior budget before they sign an interior quote.',
    example: {
      title: 'Sample: 1,000 sq ft built-up area',
      intro: 'Two of the planning constants the report applies.',
      rows: [
        { label: 'Interior paint', value: '180 L', note: '0.18 litre per sq ft of built-up area' },
        { label: 'Floor tile to order', value: '1,100 sq ft', note: '1,000 sq ft of floor plus 10% wastage' },
      ],
      footnote:
        'InteriorPro uses your own rooms, finishes and grade to produce the full cost, room by room.',
    },
    faq: [
      {
        question: 'What does InteriorPro calculate?',
        answer:
          'Flooring, kitchen, false ceiling and paint costs across four quality grades, Basic to Luxury, as an interior BOQ.',
      },
      {
        question: 'How much does InteriorPro cost?',
        answer: `The InteriorPro report costs ${priceLine('/tools/interiorpro')} per report, inclusive of GST.`,
      },
      {
        question: 'How much extra tile should I order?',
        answer:
          'The report adds 10% for tile wastage, so 1,000 sq ft of floor means ordering about 1,100 sq ft.',
      },
      {
        question: 'How much paint does a house need?',
        answer:
          'The report uses 0.18 litre of paint per sq ft of built-up area, so 1,000 sq ft needs about 180 litres.',
      },
      {
        question: 'Is there a free way to compare finish tiers?',
        answer:
          'Yes. The free Finish-Tier Cost Calculator shows, element by element, what moving between Basic, Standard, Premium and Luxury adds to the cost of a home.',
      },
    ],
    source:
      'interiorpro-engine.ts PAINT_LITRES_PER_SQFT_BUA 0.18, TILE_WASTAGE_FACTOR 1.10, InteriorGrade basic/standard/premium/luxury, RoomBreakdown / FlooringSchedule / PaintSchedule interfaces.',
  },

  // ── Grand Total ────────────────────────────────────────────────────────────
  '/tools/grand-total': {
    heading: 'What the Grand Total Report gives you',
    whatsInside: [
      'All five phases merged into one complete BOQ: RCC structure, masonry, electrical, plumbing and interior.',
      'One total to set against a contractor’s all-in quote.',
    ],
    whoFor:
      'Homeowners who have estimated each phase and want one consolidated BOQ to check a single, all-inclusive contractor quote.',
    example: {
      title: 'How the total is built',
      intro: 'The Grand Total is the sum of the five phase reports.',
      rows: [
        { label: 'Phase 1', value: 'RCC structure', note: 'StructurePro' },
        { label: 'Phase 2', value: 'Masonry', note: 'MasonryPro' },
        { label: 'Phase 3', value: 'Electrical', note: 'ElectricalPro' },
        { label: 'Phase 4', value: 'Plumbing', note: 'PlumbingPro' },
        { label: 'Phase 5', value: 'Interior', note: 'InteriorPro' },
      ],
      footnote: 'The Grand Total Report merges these five into a single BOQ.',
    },
    faq: [
      {
        question: 'What is the Grand Total Report?',
        answer:
          'It merges all five construction phases, structure, masonry, electrical, plumbing and interior, into one complete BOQ report.',
      },
      {
        question: 'How much does the Grand Total Report cost?',
        answer: `The Grand Total Report costs ${priceLine('/tools/grand-total')}, inclusive of GST. The tool page lists it as free if you have bought all five phase reports.`,
      },
      {
        question: 'Which phases does it include?',
        answer:
          'Phase 1 RCC structure, phase 2 masonry, phase 3 electrical, phase 4 plumbing and phase 5 interior.',
      },
    ],
    source: 'site.ts TOOLS summary for /tools/grand-total; app/tools/grand-total/layout.tsx metadata (“₹999 or free with all 5 paid tools”).',
  },
}

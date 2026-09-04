'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'

const content: ProductContent = {
  productId: 'cost-estimator',
  productTitle: 'Residential Construction Cost Estimator',
  eyebrow: 'Cost Estimator',
  h1: 'Construction Cost Estimator — price a house from IS-code first principles.',
  subhead:
    'A 16-sheet Excel workbook that takes a residential project from plot area to a defensible client quotation — building the BOQ from rate analysis, not a per-square-foot guess. Then it stays useful after the quote is signed: compare contractor bids line by line, and track budget against actual as the money goes out.',
  price: '₹1,499',
  sheetCount: 16,
  codesLabel: 'Codes',
  codes: ['IS 456:2000', 'IS 1786:2008', 'IS 1077:1992', 'IS 2212', 'IS 1661:1972', 'IS 1893:2016'],
  description:
    'Prices a house from IS-code first principles, generates a client quotation, compares up to 3 contractor quotes line by line, tracks budget against actual once the job starts.',
  fullSheetList:
    'Project Inputs, Area Statement, Rate Library, Rate Analysis, BOQ, Material Summary, Quality Tiers, Material Options, Quotation, Margin & Bid, Quote Comparison, Payment Schedule, Budget vs Actual, Change Orders, Cost Diagrams, Dashboard.',

  problem: {
    heading: 'A ₹/sqft number is a guess dressed up as a quote.',
    paras: [
      'Most residential estimates in India begin and end with a single multiplier — “₹1,800 a square foot” — applied to built-up area. It is fast, and it is almost always wrong, because it hides every decision that actually moves the cost: the concrete grade, the steel percentage per member, the wall type, the plaster thickness, the finishing tier. When the site reality diverges from the assumption baked into that multiplier, the owner absorbs it as “extras”, and the contractor absorbs the blame.',
      'A real estimate is built the other way around: quantities first, rates second, total last. That is what rate analysis is — a cement bag, a kilogram of steel, a day of a mason’s time, each priced from your own city’s rates, then rolled up into a Bill of Quantities. This workbook does that build-up for you, using the same IS-code constants NirmanShastra’s calculators use — M20 at 8.07 bags/m³, 100 modular bricks per square metre of 9-inch wall, internal plaster at 0.078 bags/sqm — so the number you hand a client can be traced back to a clause, not to a hunch.',
    ],
  },

  sheetsIntro:
    'Sixteen sheets, linked front to back: change a rate on one, and the BOQ, quotation, margin, and dashboard all move with it. A few of the load-bearing ones:',
  sheets: [
    { name: 'Rate Analysis', blurb: 'The engine. Breaks each item of work into its material, labour, and plant components at your city rates — so a cubic metre of M20 or a square metre of brickwork carries a built-up rate you can defend, not a round number pulled from the air.' },
    { name: 'BOQ', blurb: 'The Bill of Quantities: every item of work with its measured quantity and analysed rate, subtotalled by trade. This is the spine the quotation and every comparison hang off.' },
    { name: 'Quality Tiers', blurb: 'Basic / Standard / Premium finishing bands, so the same structure can be priced three ways for a client who is still deciding how far to spend — the structural frame is only ~40–45% of the total, and this is where the rest lands.' },
    { name: 'Quotation', blurb: 'A clean, client-facing quote generated from the BOQ — presentable enough to send, itemised enough to stand up to questions.' },
    { name: 'Quote Comparison', blurb: 'Drop in up to three contractor quotes and see them side by side against your analysed rate, line by line, so an inflated concrete rate or a padded steel quantity shows up instead of hiding in a lump sum.' },
    { name: 'Budget vs Actual', blurb: 'Once the job starts, log what was actually spent against what was estimated, item by item — the early-warning system that tells you a trade is running over before the money is gone.' },
    { name: 'Change Orders', blurb: 'A running register of scope changes with their cost impact, so “extras” are documented and agreed rather than argued about at handover.' },
  ],

  whoFor: {
    heading: 'Built for the person who signs off on the number.',
    intro:
      'This is for anyone who has to put a construction cost in writing and then live with it — where “roughly” is not good enough:',
    bullets: [
      'Homeowners and self-builders who want to walk into a contractor meeting already knowing what the job should cost, and why.',
      'Small contractors and PMCs who bid residential work and need a repeatable, defensible estimate rather than re-inventing one per enquiry.',
      'Civil engineers and quantity surveyors who want IS-code rate analysis in a workbook they can edit, not a black-box app.',
      'Architects briefing a client on budget who need the finishing tiers and the structure priced in one place.',
    ],
  },

  example: {
    heading: 'A 2,000 sqft G+1 in Pune, priced two ways.',
    label: 'Scenario',
    paras: [
      'Take a 2,000 sqft built-up G+1 house. The ₹/sqft habit says ₹1,800 × 2,000 = ₹36 lakh, full stop — no way to see what is inside it or where it will move.',
      'The workbook builds it up instead. Area Statement fixes the 2,000 sqft; Rate Analysis prices M20 concrete at 8.07 bags of cement per cubic metre and Fe500 steel at your Pune steel rate; the BOQ carries roughly 0.4 bags of cement and 4 kg of steel per sqft of the structural frame through to a subtotal. The frame lands around ₹15–16 lakh — and the Quality Tiers sheet then shows the same house finishing out at ₹34 lakh on Basic, ₹41 lakh on Standard, or ₹52 lakh on Premium, because finishing, not structure, is where the spread lives.',
      'Now a contractor quotes ₹44 lakh. Paste it into Quote Comparison and the reason surfaces on one line: his concrete rate is 12% above your analysed rate and his steel quantity is 9% high. You are no longer negotiating a lump sum in the dark — you are discussing two specific lines, with the IS-code quantity next to each.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={content} />
}

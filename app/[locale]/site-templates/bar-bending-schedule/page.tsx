'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'
import { BBS_HI } from '@/lib/i18n/labels/templates-bbs'

const content: ProductContent = {
  productId: 'bar-bending-schedule',
  productTitle: 'Bar Bending Schedule',
  eyebrow: 'Bar Bending Schedule',
  h1: 'Bar Bending Schedule — reinforcement details to a cutting-length steel order.',
  subhead:
    'A 12-sheet Excel workbook that turns drawing reinforcement details into a proper bar bending schedule — cutting lengths with every bend deduction and hook allowance applied per IS 2502, laps and development lengths to IS 456, then a cutting optimiser and a steel order note. The offline, editable companion to the free BBS calculator.',
  price: '₹2,099',
  sheetCount: 12,
  codesLabel: 'Codes',
  codes: ['IS 2502:1963', 'IS 1786:2008', 'IS 456:2000', 'IS 13920:2016'],
  description:
    'Turns reinforcement details into a cutting-length schedule and steel order note, with every bend deduction and hook allowance applied per code.',
  fullSheetList:
    'Project & Standards, Shape Library, Shape Diagrams, Cutting Length Calc, Lap & Development, BBS, Bar Summary, Cutting Optimiser, Reconciliation, Order Note, Dashboard.',

  problem: {
    heading: 'Steel is ordered on centre-line lengths, and paid for as scrap.',
    paras: [
      'The reinforcement on a drawing is dimensioned to its outside or centre-line — the numbers that describe the shape. But a bar is not cut to those numbers. When steel bends, the metal on the outside of the bend stretches and the neutral axis shifts, so the actual cutting length is shorter than the sum of the outside dimensions by a fixed deduction at each bend, plus an allowance added back for hooks. IS 2502 gives those deductions for bent bars, and the hook allowances that go back on for stirrups and ties. Ignore them and a cranked bar is cut long while a stirrup is cut short; multiply that across a slab and it is real tonnage of avoidable scrap or re-cutting.',
      'The other silent overrun is laps. A bar is only as long as it comes, so continuity is made by lapping — and the lap length is a code quantity (a multiple of bar diameter that depends on grade, concrete, and whether the zone is seismic under IS 13920), not a thumb figure. Under-lap and the joint is unsafe; over-lap and you have bought steel that does nothing. This workbook applies both — bend deductions and code laps — so the schedule reflects the bar that is actually cut and placed.',
    ],
  },

  sheetsIntro:
    'Twelve linked sheets take a member’s reinforcement from shape code to a priced steel order, with the standards set once up front:',
  sheets: [
    { name: 'Shape Library', blurb: 'The standard bar shapes — straight, L-bend, cranked, stirrup, and the rest — each with its formula for total length from the entered dimensions, so you pick a shape and enter numbers rather than deriving geometry by hand.' },
    { name: 'Cutting Length Calc', blurb: 'The heart of it: applies the IS 2502 bend deductions and hook allowances to the shape’s outside dimensions to give the true cutting length — the number the bar bender actually cuts to.' },
    { name: 'Lap & Development', blurb: 'Lap lengths and development lengths as code multiples of bar diameter, adjusted for grade and seismic detailing under IS 13920, so continuity and anchorage are correct rather than assumed.' },
    { name: 'BBS', blurb: 'The bar bending schedule proper: member, bar mark, diameter, shape, number, cutting length, and weight — the sheet you hand the bar-bending yard.' },
    { name: 'Bar Summary', blurb: 'Total weight by diameter across the whole schedule — the figure that drives procurement and lets you check tonnage against the structural estimate.' },
    { name: 'Cutting Optimiser', blurb: 'Nests the required cut lengths against standard 12 m stock to minimise off-cuts — the difference between ordering to the schedule and ordering to the scrap bin.' },
    { name: 'Reconciliation', blurb: 'Scheduled steel against steel actually delivered and used, so wastage is measured, not guessed — and a contractor’s steel claim can be checked line by line.' },
    { name: 'Order Note', blurb: 'A clean cut-to-length steel order by diameter and quantity, ready to send to the supplier straight off the schedule.' },
  ],

  whoFor: {
    heading: 'For whoever is accountable for the steel.',
    intro:
      'Reinforcement is usually the second-largest material cost in a frame and the easiest to over-order — this is for the people who carry that number:',
    bullets: [
      'Site engineers and bar-bending supervisors preparing schedules for the yard and checking cut lengths before the shear is switched on.',
      'Contractors reconciling steel delivered against steel used, and defending or checking a steel wastage claim.',
      'Structural draughtsmen and detailers producing schedules from their own drawings in an editable workbook.',
      'Civil students and young engineers who want to see the IS 2502 deductions and IS 456 laps applied on real members, not just in a textbook.',
    ],
  },

  example: {
    heading: 'The stirrups of one beam: why the perimeter is not the cutting length.',
    label: 'Scenario',
    paras: [
      'A beam is 230 mm wide and 350 mm deep, with 25 mm cover on every side and 8 mm stirrups. Taken out to out, each stirrup is 180 mm wide and 300 mm deep, so its perimeter is 2 × (180 + 300) = 960 mm. The instinct is to cut each stirrup at 960 mm.',
      'But a stirrup is a closed rectangle with a hook at each end, and the hooks are extra bar, while every bend takes a little length back. The Cutting Length Calc sheet shows each term: the 960 mm perimeter, plus two hooks at 9 bar diameters (72 mm, lifted to the 75 mm minimum, so 150 mm for the pair), less 96 mm for the five bends (three 90° bends at 2 diameters each, two 135° bends at 3 each). The bar needs to be 1,014 mm. Cut at the perimeter and every stirrup is 54 mm short of what it needs to close properly.',
      'Change the hook allowance on the Project & Standards sheet to 12 diameters, the IS 13920 seismic hook, and the same stirrup becomes 1,056 mm. Detailing conventions differ between offices, so the bend deductions and hook allowance are plain editable constants: set them to what your approved drawing shows. For 60 stirrups at 1.014 m and 0.395 kg/m (d²/162) that is 24.0 kg of bar placed, or 25.0 kg with seismic hooks. Feed the whole cage — stirrups, main bars with their laps from the Lap & Development sheet — into the BBS and Bar Summary, and the Cutting Optimiser then nests those lengths against 12 m stock so the off-cuts are minimised too. The Order Note that comes out is a cut-to-length order the supplier can price directly, and the Reconciliation sheet later checks that the steel that arrived is the steel that went in.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={{ en: content, hi: BBS_HI }} />
}

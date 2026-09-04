'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'

const content: ProductContent = {
  productId: 'billing-measurement',
  productTitle: 'Billing & Measurement',
  eyebrow: 'Billing & Measurement',
  h1: 'Billing & Measurement — measured work, through the full Indian billing chain.',
  subhead:
    'A 9-sheet Excel workbook that takes work from the measurement book to a paid RA bill the way Indian construction actually bills it: joint measurement under IS 1200, abstract against the BOQ, then a running-account bill with retention, TDS and GST worked correctly — and a tracker that follows every bill to close.',
  price: '₹1,499',
  sheetCount: 9,
  codesLabel: 'Codes',
  codes: ['IS 1200', 'CPWD Works Manual Ch. 26', 'Income-tax Act 2025 Section 393(1)'],
  description:
    'Takes measured work through the full Indian billing chain — joint measurement, abstract against BOQ, RA bill with retention/TDS/GST, payment tracking to close.',
  fullSheetList:
    'Project & Contract, IS 1200 Deductions, BOQ & Rates, Measurement Book, Abstract, RA Bill, Payment Tracker, Dashboard.',

  problem: {
    heading: 'The dispute is almost never the rate. It is the measurement.',
    paras: [
      'By the time a project is billing, the rates are already agreed in the contract. What people actually fight over is quantity: how much brickwork, measured which way, with which openings deducted. IS 1200 exists precisely because “how you measure” is not obvious — it sets the method of measurement for each item, including the deductions for openings, that both sides are meant to follow. Bill without it and every running-account bill becomes a negotiation from scratch.',
      'The second place money leaks is the bill build-up itself. A running-account (RA) bill is not just quantity × rate — it is this bill’s value less the previous bill, less retention, less TDS, plus GST, adjusted for any secured advance and materials-at-site. Get the sequence wrong and you either overpay a contractor you can’t claw back from, or underpay one who then stops work. This workbook encodes that chain once, so each RA bill is arithmetic, not improvisation.',
    ],
  },

  sheetsIntro:
    'Nine linked sheets that mirror the real billing sequence — measure, abstract, bill, track — with the contract terms set once and pulled through every bill:',
  sheets: [
    { name: 'Measurement Book', blurb: 'The MB: item, location, and the number × length × breadth × depth entries that make up a measured quantity — the primary record of what was actually done, ready for joint signature.' },
    { name: 'IS 1200 Deductions', blurb: 'The method-of-measurement rules that decide what comes off — door and window openings in brickwork and plaster, and the other standard deductions — so measured quantities are computed to code instead of by habit.' },
    { name: 'Abstract', blurb: 'Rolls the measurement book up against the BOQ items and their agreed rates, giving the value of work done to date, item by item — the bridge between what was measured and what gets billed.' },
    { name: 'RA Bill', blurb: 'The running-account bill: gross value this period, less previous bills, less retention, less TDS under Section 393, plus GST — the full statutory build-up, computed rather than typed in.' },
    { name: 'BOQ & Rates', blurb: 'The contract schedule of items and rates, set once, that both the abstract and the RA bill draw from — so a rate lives in exactly one place.' },
    { name: 'Payment Tracker', blurb: 'Every RA bill by status — submitted, certified, paid — with retention held to date and outstanding balances, so nothing certified goes unpaid and no retention is quietly forgotten.' },
  ],

  whoFor: {
    heading: 'For whoever raises or certifies the bill.',
    intro:
      'Billing sits between two parties with opposite incentives, and the workbook serves either side of the table:',
    bullets: [
      'Contractors and subcontractors raising RA bills who want them measured to IS 1200 and built up correctly the first time, so certification is fast and undisputed.',
      'Owners, PMCs and site engineers certifying bills who need to check a contractor’s measurement and deductions against the code before releasing money.',
      'Quantity surveyors and billing engineers who want the measurement book, abstract, and RA bill chain in one auditable workbook.',
      'Homeowners on a large custom build who are paying against progress and want to see retention, TDS and GST handled properly.',
    ],
  },

  example: {
    heading: 'A 9-inch wall with two windows, and the ₹18,000 that hangs on the method.',
    label: 'Scenario',
    paras: [
      'A ground-floor brick wall measures 8 m long and 3 m high — 24 sqm gross. It carries two windows of 1.2 m × 1.2 m. The contractor’s first cut bills the full 24 sqm; the site engineer says deduct the openings. Who is right depends entirely on the method of measurement, not on either person’s confidence.',
      'The IS 1200 Deductions sheet settles it: the two openings are 2 × 1.44 = 2.88 sqm, so the net measured area is 21.12 sqm. At a brickwork rate of, say, ₹850/sqm that is the difference between billing ₹20,400 and ₹17,952 on this one wall — about ₹2,450 here, and multiples of that across a whole floor of walls and plaster.',
      'The RA Bill sheet then takes that net value into the running account: it adds this period’s work, subtracts the previous bill and the retention, deducts TDS under Section 393 and adds GST — and the Payment Tracker carries the certified figure through to paid. The contractor gets paid for exactly what was built, measured the way the contract already agreed to measure it.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={content} />
}

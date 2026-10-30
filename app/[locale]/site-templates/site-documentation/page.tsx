'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'

const content: ProductContent = {
  productId: 'documentation-pack',
  productTitle: 'Construction Site Documentation Pack',
  eyebrow: 'Site Documentation',
  h1: 'Site Documentation Pack — the record that holds up when it is disputed.',
  subhead:
    'A 14-sheet Excel workbook of the registers a site actually runs on: drawings, RFIs, instructions, inspections, non-conformances, material tests, procurement, daily logs and snags. Not paperwork for its own sake — the contemporaneous record that decides who is right when a delay or a defect turns into a claim.',
  price: '₹1,699',
  sheetCount: 14,
  codesLabel: 'Codes',
  codes: ['IS 516', 'IS 1786:2008', 'IS 3495', 'IS 4031', 'IS 383', 'IS 2386', 'IS 456:2000'],
  description:
    'Nine registers holding the proof of what happened on site — the contemporaneous record that holds up when a delay or defect is disputed.',
  fullSheetList:
    'Project Info, Drawing Register, RFI Register & Form, Site Instructions, Inspection Requests, NCR Register, Test Register, Procurement Log, Daily Site Log, Snag List, Document Flow, Dashboard.',

  problem: {
    heading: 'When it goes to a claim, memory loses to paper.',
    paras: [
      'Most residential and small-commercial sites in India run on WhatsApp and recollection. It works right up until it doesn’t — a slab fails a cube test, a client withholds payment for a defect, a contractor claims an extension of time for a drawing that arrived late. At that point the only thing that matters is what was written down at the time, by whom, and when. A message thread scrolled back through six months later is not that.',
      'A contemporaneous record is the professional version of the same information: dated, sequential, and hard to reconstruct after the fact. It is why a drawing register exists, why an RFI carries a number and a response date, why a cube result is logged the day it breaks. This pack gives a small team the same nine registers a large project runs — without the enterprise software — so that “we told you on the 14th” is a line in a register, not an argument.',
    ],
  },

  sheetsIntro:
    'Fourteen sheets, structured as a document-control system rather than loose forms — each register feeds the Document Flow and Dashboard so nothing open is invisible. The core registers:',
  sheets: [
    { name: 'Drawing Register', blurb: 'Every drawing by number and revision, with issued and superseded dates — so the site is provably building to the current sheet, and a late or missing drawing is documented the moment it bites.' },
    { name: 'RFI Register & Form', blurb: 'Requests for Information, numbered, with the question, the raised date, and the response date. The single most powerful delay-defence tool on a small site: it timestamps exactly when you asked and when you got an answer.' },
    { name: 'NCR Register', blurb: 'Non-Conformance Reports — where work that missed spec is logged, dispositioned, and closed. Turns “that beam looked off” into a tracked item with an owner and a resolution.' },
    { name: 'Test Register', blurb: 'Material and workmanship tests logged against the relevant IS method — concrete compressive strength to IS 516, bricks to IS 3495, cement to IS 4031, aggregates to IS 383 and IS 2386 — with sample reference, date, and pass/fail. The evidence a slab or a batch was actually acceptable.' },
    { name: 'Procurement Log', blurb: 'What was ordered, from whom, when it was needed, and when it landed — so a material-driven delay is traceable to a real lead time, not asserted after the fact.' },
    { name: 'Daily Site Log', blurb: 'The day book: labour on site, weather, work done, deliveries, stoppages. The single most valuable document in any delay dispute, because it is built one ordinary day at a time.' },
    { name: 'Snag List', blurb: 'The defects list for handover — every open item with location, raised date, and close-out — so possession happens against a signed-off list rather than a vague promise to “finish up”.' },
  ],

  whoFor: {
    heading: 'For the person who will be asked to prove it later.',
    intro:
      'Anyone carrying responsibility for what happens on a site — and exposure if it goes wrong — needs a record that outlives memory:',
    bullets: [
      'Site engineers and project managers running residential or small-commercial builds without an enterprise document-control system.',
      'Contractors who want a delay claim — or a defence against one — backed by dated registers rather than a phone gallery.',
      'Owners and owner-representatives supervising their own build who need to see what is open, tested, and outstanding at a glance.',
      'Consultants and PMCs standardising site records across several small projects at once.',
    ],
  },

  example: {
    heading: 'A failed cube test, six weeks before it becomes a fight.',
    label: 'Scenario',
    paras: [
      'A first-floor slab is poured on the 3rd. On the 10th, the 7-day cubes come back low. Without records, this is a rumour by the time anyone senior hears it, and a shouting match by the time the client does.',
      'With the pack, it is a paper trail. The Daily Site Log for the 3rd shows the pour, the mix, and the crew. The Test Register carries the cube sample reference and the IS 516 result flagged fail. An NCR is opened the same day, linked to that test, with a disposition — re-test at 28 days, and if still short, a load test or a strengthening scheme by the structural engineer.',
      'By the 28th, whichever way it resolves, there is a closed, dated chain: poured here, tested to code here, non-conformance raised and dispositioned here. The client sees a controlled process instead of a cover-up, and if it ever reaches a claim, the contractor is standing on a contemporaneous record instead of a recollection.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={content} />
}

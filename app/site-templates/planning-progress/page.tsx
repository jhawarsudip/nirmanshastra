'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'

const content: ProductContent = {
  productId: 'planning-progress',
  productTitle: 'Planning, Progress & Delay Control',
  eyebrow: 'Planning & Progress',
  h1: 'Planning, Progress & Delay Control — a controls pack that also protects the claim.',
  subhead:
    'A 17-sheet Excel project-controls workbook: a value-weighted baseline and S-curve, earned-value tracking, and cash flow — plus a delay and EOT register that classifies every delaying event the way a contract actually does, with the notice deadlines that decide whether an extension of time is winnable at all.',
  price: '₹1,499',
  sheetCount: 17,
  codesLabel: 'Reference',
  codes: ['FIDIC Red/Yellow Books', 'Indian Contract Act 1872'],
  description:
    'Value-weighted S-curve and earned value tracking, plus a delay/EOT register that classifies events the way a contract actually does — with notice-deadline tracking.',
  fullSheetList:
    'Project & Baseline, Baseline Plan, Gantt Chart, Progress Update, S-Curve, Earned Value, Cash Flow, Lookahead, Milestones, Delay Register, EOT Claim, Variation Register, Monsoon Planner, Risk Register, Progress Report, Dashboard.',

  problem: {
    heading: '“Percent complete” tells you nothing, and the claim dies on a missed notice.',
    paras: [
      'Ask a site how it is doing and you will hear “about 60% done”. Sixty percent of what — activities, floor area, or money? A progress figure that is not weighted by value is a feeling, not a measurement. Earned value fixes this: you weight each activity by its cost, so completing the foundations counts for what it is actually worth, and the S-curve shows planned value against earned value as a gap you can read in rupees and days, not vibes. Without it, a project looks fine until the month it very suddenly does not.',
      'The more expensive failure is contractual. When a delay hits — a late drawing, a client-instructed change, an unseasonal monsoon — an extension of time is not granted because the delay was real. It is granted because the delay was the right type under the contract and because notice was given inside the deadline the contract sets. Most valid EOT claims in Indian construction are lost not on merit but on a missed notice window. This workbook logs each event, classifies whose risk it is, and counts down the notice deadline — so the claim survives long enough to be argued on merit.',
    ],
  },

  sheetsIntro:
    'Seventeen linked sheets run the plan, measure the progress, and protect the position — off one weighted baseline:',
  sheets: [
    { name: 'Baseline Plan', blurb: 'The agreed programme with each activity’s duration and cost weight — the fixed reference every later measurement is judged against, so “behind” means behind the baseline, not behind a moving target.' },
    { name: 'S-Curve', blurb: 'Planned value against earned value over time — the single chart that shows, at a glance, whether the project is ahead or behind in money-weighted terms.' },
    { name: 'Earned Value', blurb: 'The metrics behind the curve — planned value, earned value, and the schedule/cost variances — so progress is a computed number, not an estimate off the top of someone’s head.' },
    { name: 'Cash Flow', blurb: 'The money profile that follows the S-curve — what has to be paid when — so a programme slip is also read as a cash-flow slip before it becomes a surprise.' },
    { name: 'Lookahead', blurb: 'The rolling short-window plan (the next few weeks) that turns the baseline into this fortnight’s actual work-front and readiness checks.' },
    { name: 'Delay Register', blurb: 'Every delaying event logged with its cause, its classification — employer risk, contractor risk, or neutral — and its programme impact, so entitlement is assessed event by event instead of in one hopeless lump at the end.' },
    { name: 'EOT Claim', blurb: 'Builds an extension-of-time claim off the delay register, with the notice deadline tracked against each event — the sheet that keeps a valid claim from dying on a missed notice under the contract.' },
    { name: 'Monsoon Planner', blurb: 'Plans the programme around the rains and separates ordinary expected weather from an exceptional event — the difference between a delay you absorb and one you can actually claim.' },
  ],

  whoFor: {
    heading: 'For whoever owns the programme and the claim on it.',
    intro:
      'Time is the axis every construction dispute rotates on — this is for the people who have to defend a date:',
    bullets: [
      'Planning and project-controls engineers who need a weighted baseline, S-curve and earned value in an editable workbook rather than heavyweight scheduling software.',
      'Contractors protecting an extension-of-time position who need every delay classified and its notice deadline tracked as it happens.',
      'Owners, PMCs and consultants assessing a contractor’s EOT and variation claims against a proper baseline instead of a narrative.',
      'Developers and project directors who want a value-weighted progress and cash-flow picture across a build at a glance.',
    ],
  },

  example: {
    heading: 'A drawing three weeks late, and the EOT that survives because the notice went in.',
    label: 'Scenario',
    paras: [
      'A revised structural drawing for the second floor arrives 21 days late. Work on that floor stalls. At the end of the job the contractor claims 21 days’ extension — and the client rejects it, because by then it is one line in a spreadsheet with no evidence and no timely notice.',
      'In the workbook the sequence is different. The day the drawing is flagged late, an entry goes in the Delay Register: cause “late employer information”, classification “employer risk”, impact “2nd floor slab held”. The EOT Claim sheet starts the notice countdown against the contract’s window — say 14 days — so the notice goes out on time, not at final account. The Progress Update and S-curve then show the earned-value gap opening from that exact date, tying the money-weighted slip to the cause.',
      'When the claim is assessed, it is a documented, correctly-classified, timely-noticed event with the programme impact visible on the curve — an extension argued on its merits, instead of one written off on a technicality the contract handed the other side.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={content} />
}

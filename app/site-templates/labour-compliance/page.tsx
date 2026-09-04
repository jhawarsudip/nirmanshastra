'use client'

import ProductPage, { type ProductContent } from '../_components/ProductPage'

const content: ProductContent = {
  productId: 'labour-compliance',
  productTitle: 'Labour & Statutory Compliance',
  eyebrow: 'Labour & Compliance',
  h1: 'Labour & Compliance — site payroll, end to end, under the four Labour Codes.',
  subhead:
    'A 16-sheet Excel workbook that runs construction site payroll the way it now has to be run: muster roll to wage register to wage slip, with PF, ESI and minimum-wage checks built in, and subcontractor compliance held before their bill is paid — under India’s four consolidated Labour Codes, in force since November 2025.',
  price: '₹1,499',
  sheetCount: 16,
  codesLabel: 'Codes',
  codes: [
    'Code on Wages 2019',
    'Code on Social Security 2020',
    'OSH & Working Conditions Code 2020',
    'Industrial Relations Code 2020',
  ],
  description:
    "Runs site payroll end to end under India's current four Labour Codes (in force since Nov 2025) — PF, ESI, minimum wage checks, subcontractor compliance holds.",
  fullSheetList:
    'Setup, Trade Rates, Worker Master, Muster Roll, Wage Register, Advance Ledger, Wage Slip, Payment Advice, Subcontractor Register & Bill, Contractor Compliance, Safety Register, Statutory Summary, Compliance Checklist, Dashboard.',

  problem: {
    heading: 'The rules changed. Most sites are still running the old ones.',
    paras: [
      'India’s labour law was, until recently, twenty-nine separate Acts. From November 2025 they are consolidated into four Codes — Wages, Social Security, Occupational Safety, and Industrial Relations. For a construction site that means the definitions that drive every deduction — what counts as “wages” for PF, who is covered by ESI, what the floor wage is — have moved, and a register format built for the old Acts is now quietly non-compliant. The exposure is not abstract: it lands on the principal employer when a subcontractor’s workers turn out to be uninsured or underpaid.',
      'The second trap is the subcontractor chain. On most sites the majority of labour is not on the builder’s own muster — it comes through petty contractors. Under the Codes the principal employer is still on the hook for their statutory dues. The only defence is to make compliance a condition of payment: no PF challan, no ESI, no wage proof, no release of the running bill. This workbook builds that hold into the billing, instead of leaving it to trust.',
    ],
  },

  sheetsIntro:
    'Sixteen linked sheets take a worker from the attendance sheet to a compliant, paid wage — and a subcontractor from their register to a held-or-released bill:',
  sheets: [
    { name: 'Muster Roll', blurb: 'Daily attendance by worker and trade — the statutory record of who was present, which drives the wage register and the whole payroll below it.' },
    { name: 'Wage Register', blurb: 'The wages ledger: days worked, rate, gross, and the statutory deductions computed — PF, ESI, advances — down to net payable, in the register format the Codes expect.' },
    { name: 'Trade Rates', blurb: 'Rate per trade with the minimum-wage floor alongside, so an under-minimum rate is caught on entry rather than in an inspection — the Code on Wages makes the floor non-negotiable.' },
    { name: 'Advance Ledger', blurb: 'Advances paid and recovered per worker, carried into the wage register so recoveries are correct and a worker is never over-recovered in a single period.' },
    { name: 'Wage Slip', blurb: 'A per-worker payslip generated from the register — the individual wage statement each worker is entitled to, with earnings and deductions itemised.' },
    { name: 'Subcontractor Register & Bill', blurb: 'Each petty contractor’s workers and their running bill in one place — the link between the labour they supply and the money they are owed.' },
    { name: 'Contractor Compliance', blurb: 'The hold: PF challan, ESI, and wage proof logged per subcontractor, with their bill flagged until the evidence is in — so principal-employer liability is closed before payment, not after a notice.' },
    { name: 'Statutory Summary', blurb: 'PF, ESI and wage totals rolled up for the period — the numbers that feed the actual challans and returns.' },
  ],

  whoFor: {
    heading: 'For whoever is the principal employer in the eyes of the law.',
    intro:
      'Liability under the Codes flows uphill to whoever runs the site — so this is for the people that liability lands on:',
    bullets: [
      'Builders and main contractors responsible for their own labour and, in law, for their subcontractors’ compliance too.',
      'Site accountants and HR staff running a weekly or monthly muster-to-wage cycle who need registers in the current Code format.',
      'PMCs and owner-representatives on larger builds who release subcontractor bills and want a documented compliance hold before they do.',
      'Owner-builders employing labour directly who did not realise minimum wage, PF and ESI now apply to them as well.',
    ],
  },

  example: {
    heading: 'A petty contractor’s bill, held until the PF challan lands.',
    label: 'Scenario',
    paras: [
      'A masonry subcontractor supplies twelve workers for the month and submits a bill for ₹3.6 lakh. The temptation is to pay it — the work is done and the crew wants their money. Paying it blind is exactly how the principal employer inherits the subcontractor’s unpaid PF and ESI.',
      'In the workbook, those twelve workers sit on the Subcontractor Register with the muster behind them. The Trade Rates check confirms the mason rate is above the Code on Wages floor for the state. But the Contractor Compliance sheet shows the PF challan and ESI for the month are not yet uploaded — so the subcontractor’s bill is flagged on hold.',
      'The bill releases the moment the challan is logged. The workers get paid, the statutory dues are provably deposited, and the Statutory Summary rolls the PF and ESI into the period totals for the returns — so if an inspector ever asks, the principal employer’s exposure was closed before the money moved, not defended after a notice arrived.',
    ],
  },

  buyLabel: 'Buy',
}

export default function Page() {
  return <ProductPage content={content} />
}

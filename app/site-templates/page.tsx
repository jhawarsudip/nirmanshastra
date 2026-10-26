'use client'

import React from 'react'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { templatesIndexSchema } from '@/lib/seo/schema'
import { IcArrow } from '@/components/v2/inner/kit'
import { BuyButton, CodeTag, useToolkitCheckout } from './_components/purchase'

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT — six downloadable Excel toolkits. Prices are shown here for the
// reader; the amount charged is always taken from the server-side catalog
// (lib/site-templates.ts), never from this page.
// ─────────────────────────────────────────────────────────────────────────────
type Toolkit = {
  id: string
  href: string
  title: string
  price: string
  sheetCount: number
  description: string
  codesLabel: string
  codes: string[]
}

const BUNDLE_TITLE = 'Site Operations Suite — All 6 Toolkits'

const TOOLKITS: Toolkit[] = [
  {
    id: 'cost-estimator',
    href: '/site-templates/cost-estimator',
    title: 'Residential Construction Cost Estimator',
    price: '₹2,499',
    sheetCount: 16,
    description:
      'For contractors: price a house from IS-code quantities using your own rates, make a client quotation, and compare up to 3 quotes.',
    codesLabel: 'Codes',
    codes: ['IS 456:2000', 'IS 1786:2008', 'IS 1077:1992', 'IS 2212', 'IS 1661:1972', 'IS 1893:2016'],
  },
  {
    id: 'documentation-pack',
    href: '/site-templates/site-documentation',
    title: 'Construction Site Documentation Pack',
    price: '₹1,699',
    sheetCount: 14,
    description:
      'Nine registers holding the proof of what happened on site — the contemporaneous record that holds up when a delay or defect is disputed.',
    codesLabel: 'Codes',
    codes: ['IS 516', 'IS 1786:2008', 'IS 3495', 'IS 4031', 'IS 383', 'IS 2386', 'IS 456:2000'],
  },
  {
    id: 'billing-measurement',
    href: '/site-templates/billing-measurement',
    title: 'Billing & Measurement',
    price: '₹2,299',
    sheetCount: 9,
    description:
      'Takes measured work through the full Indian billing chain — joint measurement, abstract against BOQ, RA bill with retention/TDS/GST, payment tracking to close.',
    codesLabel: 'Codes',
    codes: ['IS 1200', 'CPWD Works Manual Ch. 26', 'Income-tax Act 2025 Section 393(1)'],
  },
  {
    id: 'bar-bending-schedule',
    href: '/site-templates/bar-bending-schedule',
    title: 'Bar Bending Schedule',
    price: '₹2,099',
    sheetCount: 12,
    description:
      'Turns reinforcement details into a cutting-length schedule and steel order note, with every bend deduction and hook allowance applied per code.',
    codesLabel: 'Codes',
    codes: ['IS 2502:1963', 'IS 1786:2008', 'IS 456:2000', 'IS 13920:2016'],
  },
  {
    id: 'labour-compliance',
    href: '/site-templates/labour-compliance',
    title: 'Labour & Statutory Compliance',
    price: '₹1,999',
    sheetCount: 16,
    description:
      "Runs site payroll end to end under India's current four Labour Codes (in force since Nov 2025) — PF, ESI, minimum wage checks, subcontractor compliance holds.",
    codesLabel: 'Codes',
    codes: [
      'Code on Wages 2019',
      'Code on Social Security 2020',
      'OSH & Working Conditions Code 2020',
      'Industrial Relations Code 2020',
    ],
  },
  {
    id: 'planning-progress',
    href: '/site-templates/planning-progress',
    title: 'Planning, Progress & Delay Control',
    price: '₹2,299',
    sheetCount: 17,
    description:
      'Value-weighted S-curve and earned value tracking, plus a delay/EOT register that classifies events the way a contract actually does — with notice-deadline tracking.',
    codesLabel: 'Reference',
    codes: ['FIDIC Red/Yellow Books', 'Indian Contract Act 1872'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// TOOLKIT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ToolkitCard({
  kit,
  onBuy,
  busy,
}: {
  kit: Toolkit
  onBuy: (id: string, title: string) => void
  busy: boolean
}) {
  return (
    <article className="ns-plate ns-st-card">
      <div className="ns-st-card__top">
        <span className="ns-i-pill">{kit.sheetCount} linked sheets</span>
        <span className="ns-st-card__fmt">Excel · .xlsx</span>
      </div>

      <div className="ns-st-card__main">
        <h3><Link href={kit.href}>{kit.title}</Link></h3>
        <p>{kit.description}</p>
        <p className="ns-st-k">{kit.codesLabel}</p>
        <ul className="ns-st-codes" aria-label={kit.codesLabel}>
          {kit.codes.map((code) => <CodeTag key={code} code={code} />)}
        </ul>
      </div>

      <div className="ns-st-card__foot">
        <p className="ns-st-price ns-st-price--sm">{kit.price}</p>
        <div className="ns-st-card__acts">
          <Link href={kit.href} className="ns-i-back ns-st-more">Details<IcArrow aria-hidden="true" /></Link>
          <BuyButton label={`Buy · ${kit.price}`} onClick={() => onBuy(kit.id, kit.title)} busy={busy} />
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteTemplatesPage() {
  const { busy, open, overlay } = useToolkitCheckout()

  return (
    <div className="ns-i-page">
      {/* BreadcrumbList JSON-LD (server-rendered; JsonLd has no hooks). Sub-pages carry their own via their layouts. */}
      <JsonLd data={templatesIndexSchema()} />
      <div className="ns-i-wrap ns-st">
        {/* ── HERO ── */}
        <header className="ns-st-hero">
          <p className="ns-st-k">Site Templates · 6 Excel toolkits</p>
          <h1>Downloadable Excel toolkits for running the job on site.</h1>
          <p>
            Standalone spreadsheet packs, separate from the interactive calculators. Each is a set
            of linked sheets built to Indian standards and statutory practice: estimate, document,
            bill, schedule, comply, and control progress. They are built for contractors and site engineers, who
            work from their own rates. The reports for homeowners, which count the materials a house needs,
            are a separate product. Buy one toolkit, or take the full suite.
          </p>
        </header>

        {/* ── FEATURED BUNDLE ── */}
        <section className="ns-plate ns-st-bundle" aria-label="Site Operations Suite bundle">
          <div className="ns-st-bundle__l">
            <p className="ns-st-k">The bundle · All 6 toolkits</p>
            <h2>Site Operations Suite</h2>
            <p>
              Every toolkit on this page — estimating, documentation, billing, bar bending,
              labour compliance, and planning &amp; delay control — in one download.
            </p>
            <p className="ns-st-save">
              <s aria-label="Separate price">₹12,894 if bought separately</s>
              <span className="ns-i-pill ns-i-pill--tc">Save about 38%</span>
            </p>
          </div>
          <div className="ns-st-bundle__r">
            <p className="ns-st-price">₹7,999</p>
            <BuyButton label="Buy bundle · ₹7,999" onClick={() => open('bundle', BUNDLE_TITLE)} busy={busy} />
          </div>
        </section>

        {/* ── INDIVIDUAL TOOLKITS ── */}
        <section aria-labelledby="st-ind" className="ns-st-ind">
          <h2 id="st-ind" className="ns-st-rule"><span>Or buy individually · ₹1,699 to ₹2,499</span></h2>
          <div className="ns-st-grid">
            {TOOLKITS.map((kit) => (
              <ToolkitCard key={kit.id} kit={kit} onBuy={open} busy={busy} />
            ))}
          </div>
        </section>

        <p className="ns-st-fine ns-st-fine--c">
          Secure payment by Razorpay. Toolkits are delivered as Excel (.xlsx) files, packaged as
          a .zip, via a secure download link shown here and emailed to you after checkout.{' '}
          <Link href="/site-templates/terms">Licence, delivery and refund terms</Link>.
        </p>
      </div>
      {overlay}
    </div>
  )
}

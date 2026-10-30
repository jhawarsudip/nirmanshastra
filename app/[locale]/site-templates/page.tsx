'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { IcArrow } from '@/components/v2/inner/kit'
import { displayTitleForProduct } from '@/lib/site-templates'
import { useCopy } from '@/lib/i18n/use-copy'
import {
  BUNDLE_RUPEES, CARD_HI, HIGHEST_PAISE, INDEX, LOWEST_PAISE, SAVE_PERCENT, SEPARATE_RUPEES, inr,
} from '@/lib/i18n/labels/templates-ui'
import { templatesIndexJsonLd } from '@/lib/i18n/labels/templates-jsonld'
import { BuyButton, CodeTag, useToolkitCheckout } from './_components/purchase'
import { Rich } from './_components/rich'

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
  const t = useCopy(INDEX)
  const hi = useLocale() === 'hi'
  // Hindi: the title is in lib/site-templates.ts, the description, label and codes in CARD_HI. The English title still goes to the checkout.
  const card = hi ? CARD_HI[kit.id] : undefined
  const title = hi ? displayTitleForProduct(kit.id, 'hi') : kit.title
  const codesLabel = card?.codesLabel ?? kit.codesLabel
  const codes = card?.codes ?? kit.codes
  return (
    <article className="ns-plate ns-st-card">
      <div className="ns-st-card__top">
        <span className="ns-i-pill">{t.sheets(kit.sheetCount)}</span>
        <span className="ns-st-card__fmt" lang={hi ? 'en' : undefined}>Excel · .xlsx</span>
      </div>

      <div className="ns-st-card__main">
        <h3><Link href={kit.href}>{title}</Link></h3>
        <p>{card?.desc ?? kit.description}</p>
        <p className="ns-st-k">{codesLabel}</p>
        <ul className="ns-st-codes" aria-label={codesLabel}>
          {codes.map((code) => <CodeTag key={code} code={code} />)}
        </ul>
      </div>

      <div className="ns-st-card__foot">
        <p className="ns-st-price ns-st-price--sm">{kit.price}</p>
        <div className="ns-st-card__acts">
          <Link href={kit.href} className="ns-i-back ns-st-more">{t.details}<IcArrow aria-hidden="true" /></Link>
          <BuyButton label={t.buy(kit.price)} onClick={() => onBuy(kit.id, kit.title)} busy={busy} />
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
  const t = useCopy(INDEX)
  const locale = useLocale()

  return (
    <div className="ns-i-page">
      {/* BreadcrumbList JSON-LD (server-rendered; JsonLd has no hooks). Sub-pages carry their own via their layouts. */}
      <JsonLd data={templatesIndexJsonLd(locale)} />
      <div className="ns-i-wrap ns-st">
        {/* ── HERO ── */}
        <header className="ns-st-hero">
          <p className="ns-st-k">{t.kicker}</p>
          <h1>{t.h1}</h1>
          <p>{t.intro}</p>
        </header>

        {/* ── FEATURED BUNDLE ── */}
        <section className="ns-plate ns-st-bundle" aria-label={t.bundleAria}>
          <div className="ns-st-bundle__l">
            <p className="ns-st-k">{t.bundleKicker}</p>
            <h2>{t.bundleName}</h2>
            <p>{t.bundleText}</p>
            <p className="ns-st-save">
              <s aria-label={t.separateAria}>{t.separate(SEPARATE_RUPEES)}</s>
              <span className="ns-i-pill ns-i-pill--tc">{t.save(SAVE_PERCENT)}</span>
            </p>
          </div>
          <div className="ns-st-bundle__r">
            <p className="ns-st-price">{BUNDLE_RUPEES}</p>
            <BuyButton label={t.buyBundle(BUNDLE_RUPEES)} onClick={() => open('bundle', BUNDLE_TITLE)} busy={busy} />
          </div>
        </section>

        {/* ── INDIVIDUAL TOOLKITS ── */}
        <section aria-labelledby="st-ind" className="ns-st-ind">
          <h2 id="st-ind" className="ns-st-rule"><span>{t.individually(inr(LOWEST_PAISE), inr(HIGHEST_PAISE))}</span></h2>
          <div className="ns-st-grid">
            {TOOLKITS.map((kit) => (
              <ToolkitCard key={kit.id} kit={kit} onBuy={open} busy={busy} />
            ))}
          </div>
        </section>

        <p className="ns-st-fine ns-st-fine--c">
          <Rich text={t.fineBefore} /><Link href="/site-templates/terms">{t.fineLink}</Link>{t.fineAfter}
        </p>
      </div>
      {overlay}
    </div>
  )
}

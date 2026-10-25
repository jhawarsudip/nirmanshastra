'use client'

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PAGE RENDERER — shared layout for the six individual toolkit pages
// under /site-templates/*. Each page supplies its own copy through the
// ProductContent object; the Razorpay purchase flow comes from useToolkitPurchase.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import Link from 'next/link'
import { IcArrow } from '@/components/v2/inner/kit'
import { BuyButton, CodeTag, useToolkitPurchase } from './purchase'

export type ProductContent = {
  productId: string
  productTitle: string
  eyebrow: string
  h1: string
  subhead: string
  price: string
  sheetCount: number
  formatLabel?: string
  codesLabel: string
  codes: string[]
  description: string
  fullSheetList: string
  problem: { heading: string; paras: string[] }
  sheetsIntro: string
  sheets: { name: string; blurb: string }[]
  whoFor: { heading: string; intro: string; bullets: string[] }
  example: { heading: string; label: string; paras: string[] }
  buyLabel: string
}

export default function ProductPage({ content }: { content: ProductContent }) {
  const { busy, openCheckout, overlay } = useToolkitPurchase(content.productId, content.productTitle)
  const buy = `${content.buyLabel} · ${content.price}`

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap ns-st">
        {/* ── HERO ── */}
        <header className="ns-st-hero">
          <nav className="ns-st-crumb" aria-label="Breadcrumb">
            <Link href="/site-templates">Site Templates</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{content.eyebrow}</span>
          </nav>
          <h1>{content.h1}</h1>
          <p>{content.subhead}</p>
        </header>

        {/* ── BUY BOX ── */}
        <section className="ns-plate ns-st-buy" aria-label="Buy this toolkit">
          <div className="ns-st-buy__l">
            <div className="ns-st-buy__meta">
              <span className="ns-i-pill">{content.sheetCount} linked sheets</span>
              <span className="ns-i-pill">{content.formatLabel ?? 'Excel · .xlsx'}</span>
            </div>
            <p className="ns-st-buy__d">{content.description}</p>
            <div>
              <p className="ns-st-k">{content.codesLabel}</p>
              <ul className="ns-st-codes" aria-label={content.codesLabel}>
                {content.codes.map((c) => <CodeTag key={c} code={c} />)}
              </ul>
            </div>
          </div>
          <div className="ns-st-buy__r">
            <p className="ns-st-price">{content.price}</p>
            <BuyButton label={buy} onClick={openCheckout} busy={busy} />
            <p className="ns-st-fine">One payment, instant download. Secure payment by Razorpay. <Link href="/site-templates/terms">Terms and refunds</Link>.</p>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">The problem</p>
          <h2>{content.problem.heading}</h2>
          <div className="ns-prose">
            {content.problem.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── WHAT'S INSIDE ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">What&apos;s inside · {content.sheetCount} linked sheets</p>
          <h2>Every sheet, and what it does</h2>
          <div className="ns-prose"><p>{content.sheetsIntro}</p></div>

          <div className="ns-plate ns-plate--flat ns-st-list">
            <p className="ns-st-k">Full sheet list</p>
            <p>{content.fullSheetList}</p>
          </div>

          <ul className="ns-st-sheets">
            {content.sheets.map((s) => (
              <li key={s.name} className="ns-plate ns-plate--flat ns-st-sheet">
                <span className="ns-i-pill ns-i-pill--tc">{s.name}</span>
                <p>{s.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">Who it&apos;s for</p>
          <h2>{content.whoFor.heading}</h2>
          <div className="ns-prose"><p>{content.whoFor.intro}</p></div>
          <ul className="ns-st-who">
            {content.whoFor.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>

        {/* ── WORKED EXAMPLE ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">Worked example</p>
          <h2>{content.example.heading}</h2>
          <div className="ns-plate ns-st-ex">
            <p className="ns-st-k">{content.example.label}</p>
            <div className="ns-prose">
              {content.example.paras.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <aside className="ns-plate ns-st-cta">
          <div>
            <p className="ns-st-k">Get the toolkit</p>
            <h2>{content.productTitle}</h2>
            <p>
              Delivered as an Excel (.xlsx) workbook in a .zip via a secure download link, shown here and emailed to you after checkout. Need all six? See the{' '}
              <Link href="/site-templates">Site Operations Suite bundle</Link>.
            </p>
          </div>
          <div className="ns-st-cta__r">
            <p className="ns-st-price">{content.price}</p>
            <BuyButton label={buy} onClick={openCheckout} busy={busy} />
            <Link href="/site-templates" className="ns-i-back"><IcArrow aria-hidden="true" />All toolkits</Link>
          </div>
        </aside>
      </div>
      {overlay}
    </div>
  )
}

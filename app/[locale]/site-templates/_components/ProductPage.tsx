'use client'

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PAGE RENDERER — shared layout for the six individual toolkit pages
// under /site-templates/*. Each page supplies its own copy through the
// ProductContent object, in English and in Hindi (the Hindi lives in
// lib/i18n/labels/templates-<name>.ts); the Razorpay purchase flow comes from useToolkitPurchase.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { IcArrow } from '@/components/v2/inner/kit'
import { titleForProduct } from '@/lib/site-templates'
import type { Copy } from '@/lib/i18n/copy'
import { useCopy } from '@/lib/i18n/use-copy'
import { PRODUCT_UI } from '@/lib/i18n/labels/templates-ui'
import type { ProductContent } from '@/lib/i18n/labels/templates-types'
import { BuyButton, CodeTag, useToolkitPurchase } from './purchase'
import { Rich } from './rich'

export type { ProductContent }

export default function ProductPage({ content: copy }: { content: Copy<ProductContent> }) {
  const content = useCopy(copy)
  const t = useCopy(PRODUCT_UI)
  // Sheet names are the tabs of the English Excel file, so they stay English (and are marked so) on the Hindi page.
  const en = useLocale() === 'hi' ? 'en' : undefined
  // The checkout is given the English title always: it goes to the payment provider. The dialog shows the Hindi one itself.
  const { busy, openCheckout, overlay } = useToolkitPurchase(content.productId, titleForProduct(content.productId))
  const buy = `${content.buyLabel} · ${content.price}`

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap ns-st">
        {/* ── HERO ── */}
        <header className="ns-st-hero">
          <nav className="ns-st-crumb" aria-label={t.crumbAria}>
            <Link href="/site-templates">{t.crumbHome}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{content.eyebrow}</span>
          </nav>
          <h1>{content.h1}</h1>
          <p><Rich text={content.subhead} /></p>
        </header>

        {/* ── BUY BOX ── */}
        <section className="ns-plate ns-st-buy" aria-label={t.buyAria}>
          <div className="ns-st-buy__l">
            <div className="ns-st-buy__meta">
              <span className="ns-i-pill">{t.sheets(content.sheetCount)}</span>
              <span className="ns-i-pill" lang={en}>{content.formatLabel ?? 'Excel · .xlsx'}</span>
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
            <p className="ns-st-fine">{t.fineBefore}<Link href="/site-templates/terms">{t.fineLink}</Link>{t.fineAfter}</p>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">{t.problem}</p>
          <h2>{content.problem.heading}</h2>
          <div className="ns-prose">
            {content.problem.paras.map((p, i) => <p key={i}><Rich text={p} /></p>)}
          </div>
        </section>

        {/* ── WHAT'S INSIDE ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">{t.inside(content.sheetCount)}</p>
          <h2>{t.everySheet}</h2>
          <div className="ns-prose"><p><Rich text={content.sheetsIntro} /></p></div>

          <div className="ns-plate ns-plate--flat ns-st-list">
            <p className="ns-st-k">{t.fullList}</p>
            <p lang={en}>{content.fullSheetList}</p>
          </div>

          <ul className="ns-st-sheets">
            {content.sheets.map((s) => (
              <li key={s.name} className="ns-plate ns-plate--flat ns-st-sheet">
                <span className="ns-i-pill ns-i-pill--tc" lang={en}>{s.name}</span>
                <p><Rich text={s.blurb} /></p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">{t.whoFor}</p>
          <h2>{content.whoFor.heading}</h2>
          <div className="ns-prose"><p><Rich text={content.whoFor.intro} /></p></div>
          <ul className="ns-st-who">
            {content.whoFor.bullets.map((b, i) => <li key={i}><Rich text={b} /></li>)}
          </ul>
        </section>

        {/* ── WORKED EXAMPLE ── */}
        <section className="ns-st-sec">
          <p className="ns-st-k">{t.example}</p>
          <h2>{content.example.heading}</h2>
          <div className="ns-plate ns-st-ex">
            <p className="ns-st-k">{content.example.label}</p>
            <div className="ns-prose">
              {content.example.paras.map((p, i) => <p key={i}><Rich text={p} /></p>)}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <aside className="ns-plate ns-st-cta">
          <div>
            <p className="ns-st-k">{t.getKit}</p>
            <h2>{content.productTitle}</h2>
            <p>
              <Rich text={t.ctaBefore} /><Link href="/site-templates">{t.ctaLink}</Link>{t.ctaAfter}
            </p>
          </div>
          <div className="ns-st-cta__r">
            <p className="ns-st-price">{content.price}</p>
            <BuyButton label={buy} onClick={openCheckout} busy={busy} />
            <Link href="/site-templates" className="ns-i-back"><IcArrow aria-hidden="true" />{t.allKits}</Link>
          </div>
        </aside>
      </div>
      {overlay}
    </div>
  )
}

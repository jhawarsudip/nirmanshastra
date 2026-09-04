'use client'

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PAGE RENDERER — shared layout for the six individual toolkit pages
// under /site-templates/*. Styling matches the combined /site-templates page
// (matte dark, gold accent). Each page supplies its own unique copy via the
// ProductContent object; the Razorpay purchase flow comes from useToolkitPurchase.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import Link from 'next/link'
import {
  BG, SURF, GOLD, TP, TS, BSub, FI, FP,
  BuyButton, CodeTag, useToolkitPurchase,
} from './purchase'

const MONO = 'var(--font-plex-mono)'

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
      {children}
    </p>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: FP, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700, color: TP, marginBottom: 18, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
      {children}
    </h2>
  )
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: FI, fontSize: 15.5, color: TS, lineHeight: 1.8, marginBottom: 16, maxWidth: 720 }}>
      {children}
    </p>
  )
}

// The buy box — sheet-count badge, carried-over description, price, Buy button, code chips.
function BuyBox({
  content,
  busy,
  onBuy,
}: {
  content: ProductContent
  busy: boolean
  onBuy: () => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${GOLD}`,
        borderRadius: 2,
        padding: '30px 32px',
        background: SURF,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: TS,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            border: `1px solid ${BSub}`,
            borderRadius: 2,
            padding: '4px 9px',
          }}
        >
          {content.sheetCount} linked sheets
        </span>
        <span style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {content.formatLabel ?? 'Excel · .xlsx'}
        </span>
      </div>

      <p style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7 }}>
        {content.description}
      </p>

      <div>
        <p style={{ fontFamily: FI, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          {content.codesLabel}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {content.codes.map((c) => <CodeTag key={c} code={c} />)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: `1px solid ${BSub}`, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 500, color: TP }}>{content.price}</span>
        <BuyButton label={`${content.buyLabel} — ${content.price}`} onClick={onBuy} busy={busy} />
      </div>
    </div>
  )
}

export default function ProductPage({ content }: { content: ProductContent }) {
  const { busy, openCheckout, overlay } = useToolkitPurchase(content.productId, content.productTitle)

  return (
    <main className="sheet-frame" style={{ background: BG, minHeight: '100vh' }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pt-16 pb-12" style={{ background: BG }}>
        <div style={{ maxWidth: 900 }}>
          <p style={{ fontFamily: MONO, fontSize: 11, color: TS, marginBottom: 20 }}>
            <Link href="/site-templates" style={{ color: TS, textDecoration: 'none' }}>Site Templates</Link>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>  /  </span>
            <span style={{ color: GOLD }}>{content.eyebrow}</span>
          </p>
          <h1
            style={{
              fontFamily: FP,
              fontSize: 'clamp(34px,4.6vw,54px)',
              fontWeight: 700,
              color: TP,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              marginBottom: 22,
            }}
          >
            {content.h1}
          </h1>
          <p style={{ fontFamily: FI, fontSize: 17, color: TS, lineHeight: 1.7, maxWidth: 700 }}>
            {content.subhead}
          </p>
        </div>
      </section>

      {/* ── BUY BOX ──────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-16" style={{ background: BG }}>
        <BuyBox content={content} busy={busy} onBuy={openCheckout} />
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-16" style={{ background: SURF, borderTop: `1px solid ${BSub}`, borderBottom: `1px solid ${BSub}` }}>
        <Eyebrow>The problem</Eyebrow>
        <SectionTitle>{content.problem.heading}</SectionTitle>
        {content.problem.paras.map((p, i) => <Para key={i}>{p}</Para>)}
      </section>

      {/* ── WHAT'S INSIDE — SHEET BREAKDOWN ──────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-16" style={{ background: BG }}>
        <Eyebrow>What&apos;s inside · {content.sheetCount} linked sheets</Eyebrow>
        <SectionTitle>Every sheet, and what it does</SectionTitle>
        <Para>{content.sheetsIntro}</Para>

        <div
          style={{
            border: `1px solid ${BSub}`,
            borderRadius: 2,
            background: SURF,
            padding: '16px 18px',
            marginBottom: 28,
            maxWidth: 860,
          }}
        >
          <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Full sheet list
          </p>
          <p style={{ fontFamily: MONO, fontSize: 13, color: TS, lineHeight: 1.7 }}>
            {content.fullSheetList}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860 }}>
          {content.sheets.map((s) => (
            <div
              key={s.name}
              style={{
                display: 'flex',
                gap: 18,
                alignItems: 'flex-start',
                border: `1px solid ${BSub}`,
                borderRadius: 2,
                background: SURF,
                padding: '18px 20px',
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: GOLD,
                  border: `1px solid ${GOLD}`,
                  borderRadius: 2,
                  padding: '5px 10px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {s.name}
              </span>
              <p style={{ fontFamily: FI, fontSize: 14.5, color: TS, lineHeight: 1.7, margin: 0 }}>
                {s.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-16" style={{ background: SURF, borderTop: `1px solid ${BSub}`, borderBottom: `1px solid ${BSub}` }}>
        <Eyebrow>Who it&apos;s for</Eyebrow>
        <SectionTitle>{content.whoFor.heading}</SectionTitle>
        <Para>{content.whoFor.intro}</Para>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {content.whoFor.bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: GOLD, flexShrink: 0, lineHeight: 1.7 }}>—</span>
              <span style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.7 }}>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── WORKED EXAMPLE ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 py-16" style={{ background: BG }}>
        <Eyebrow>Worked example</Eyebrow>
        <SectionTitle>{content.example.heading}</SectionTitle>
        <div
          style={{
            border: `1px solid ${BSub}`,
            borderLeft: `2px solid ${GOLD}`,
            borderRadius: 2,
            background: SURF,
            padding: '26px 28px',
            maxWidth: 780,
          }}
        >
          <p style={{ fontFamily: MONO, fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            {content.example.label}
          </p>
          {content.example.paras.map((p, i) => (
            <p key={i} style={{ fontFamily: FI, fontSize: 15, color: TS, lineHeight: 1.8, marginBottom: i === content.example.paras.length - 1 ? 0 : 14 }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-28 pt-4" style={{ background: BG }}>
        <div
          style={{
            border: `1px solid ${GOLD}`,
            borderRadius: 2,
            padding: '32px 34px',
            background: SURF,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            maxWidth: 860,
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Get the toolkit
            </p>
            <h3 style={{ fontFamily: FI, fontSize: 22, fontWeight: 600, color: TP, marginBottom: 8, lineHeight: 1.2 }}>
              {content.productTitle} — {content.price}
            </h3>
            <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 560 }}>
              Delivered as an Excel (.xlsx) workbook in a .zip via a secure download link — shown here and emailed to you after checkout. Need all six? See the{' '}
              <Link href="/site-templates" style={{ color: GOLD, textDecoration: 'none' }}>Site Operations Suite bundle</Link>.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 500, color: TP, lineHeight: 1 }}>{content.price}</span>
            <BuyButton label={`${content.buyLabel} — ${content.price}`} onClick={openCheckout} busy={busy} variant="bundle" />
          </div>
        </div>

        <p style={{ fontFamily: FI, fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 24, lineHeight: 1.7, maxWidth: 860 }}>
          Secure payment by Razorpay. This toolkit is delivered as an Excel (.xlsx) file, packaged as a .zip, via a secure download link shown here and emailed to you after checkout.
        </p>
      </section>

      {overlay}
    </main>
  )
}

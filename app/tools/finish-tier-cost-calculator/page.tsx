'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  calculate,
  FINISH_TIER_DEFAULTS,
  SQFT_ELEMENTS,
  KITCHEN_ELEMENT,
  TIERS,
  type Tier,
} from './finish-tier-engine'

// ── Design tokens — matte dark system, matches the other free tool pages (wire / brick / ra-bill) ──
const MONO = 'var(--font-plex-mono)'
const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const INK_45 = 'rgba(244,244,240,0.45)'
const INK_35 = 'rgba(244,244,240,0.35)'
const SURF = '#171717'
const BSUB = 'rgba(255,255,255,0.08)'
const BLUEPRINT = '#1F4E79'
const OXIDE = '#8C3A22'
const GREEN = '#14532D'

// ── Small presentational helpers ───────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, color: BLUEPRINT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </p>
  )
}

/** ₹ formatter — Indian grouping, no decimals (rates & quantities are whole-rupee exact). */
function rupee(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/** signed ₹ — leading + / − for a delta figure. */
function signedRupee(n: number) {
  if (n === 0) return '₹0'
  const sign = n > 0 ? '+' : '−'
  return sign + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN')
}

/** parse a possibly-empty numeric string to a finite non-negative number (or 0). */
function toNum(s: string): number {
  const v = parseFloat(s)
  return Number.isFinite(v) && v > 0 ? v : 0
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function FinishTierCalculatorPage() {
  const [area, setArea] = useState(String(FINISH_TIER_DEFAULTS.areaSqft))
  const [kitchenRft, setKitchenRft] = useState('') // blank = 0, matches the verified per-sqft-only example
  const [tierA, setTierA] = useState<Tier>(FINISH_TIER_DEFAULTS.tierA)
  const [tierB, setTierB] = useState<Tier>(FINISH_TIER_DEFAULTS.tierB)

  const result = useMemo(
    () =>
      calculate({
        areaSqft: toNum(area),
        kitchenRft: toNum(kitchenRft),
        tierA,
        tierB,
      }),
    [area, kitchenRft, tierA, tierB]
  )

  const hasKitchen = toNum(kitchenRft) > 0
  const sameTier = tierA === tierB

  // Field styling
  const labelStyle: React.CSSProperties = { fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(244,244,240,0.06)',
    border: `1px solid ${BSUB}`,
    color: INK,
    padding: '11px 12px',
    fontSize: 14,
    fontFamily: MONO,
    borderRadius: 6,
    outline: 'none',
  }
  const hintStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 12, color: INK_45, lineHeight: 1.55, marginTop: 7 }

  return (
    <main className="sheet-frame" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pt-16 pb-10">
        <div style={{ maxWidth: 860 }}>
          <Eyebrow>Free Calculator · Finish Quality Tiers · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Finish-Tier Cost Difference Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Enter your <strong style={{ color: INK, fontWeight: 600 }}>built-up area</strong> and pick any two
            quality tiers — <strong style={{ color: INK, fontWeight: 600 }}>Basic, Standard, Premium or
            Luxury</strong>. See, element by element, exactly how much moving up a finish tier adds — and where
            that money actually goes. It runs the same per-element rate build-up as the{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Residential Construction Cost Estimator</strong>&rsquo;s
            Quality Tiers sheet.
          </p>
          <p style={{ fontFamily: MONO, fontSize: 14.5, color: INK, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px', marginTop: 18, lineHeight: 1.6 }}>
            Cost Difference = Σ (rate<sub>tier B</sub> − rate<sub>tier A</sub>) × area, per element
          </p>
          <div style={{ border: `1px solid rgba(217,154,6,0.4)`, background: 'rgba(217,154,6,0.07)', borderRadius: 2, padding: '13px 16px', marginTop: 18 }}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: INK_65, lineHeight: 1.6 }}>
              <span style={{ color: '#D99A06', fontWeight: 600 }}>Note · </span>
              These are <strong style={{ color: INK }}>indicative Tier-2 city rates</strong>, exactly as the source
              sheet states. The value of this tool is showing the <strong style={{ color: INK }}>shape of the
              difference</strong> between finish tiers — not exact absolute pricing for any one city or year.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ alignItems: 'start' }}>

          {/* INPUT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              Your Build
            </p>

            {/* Built-up area */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="ft-area">Built-up area (sqft)</label>
              <input
                id="ft-area"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={fieldStyle}
              />
              <p style={hintStyle}>
                Total built-up area across all floors. The seven per-sqft elements scale with this figure.
              </p>
            </div>

            {/* Tier A / Tier B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="ft-tierA">Compare from — Tier A</label>
                <select
                  id="ft-tierA"
                  value={tierA}
                  onChange={(e) => setTierA(e.target.value as Tier)}
                  style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t} style={{ background: SURF }}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="ft-tierB">Compare to — Tier B</label>
                <select
                  id="ft-tierB"
                  value={tierB}
                  onChange={(e) => setTierB(e.target.value as Tier)}
                  style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer', borderColor: sameTier ? 'rgba(217,154,6,0.6)' : BSUB }}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t} style={{ background: SURF }}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kitchen running feet — optional, separate */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle} htmlFor="ft-kitchen">Kitchen counter run (running ft) — optional</label>
              <input
                id="ft-kitchen"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={kitchenRft}
                onChange={(e) => setKitchenRft(e.target.value)}
                style={fieldStyle}
              />
              <p style={hintStyle}>
                Kitchen is priced <strong style={{ color: INK_65 }}>per running foot</strong>, separate from the
                per-sqft elements — it does not scale with floor area. Leave blank to exclude it (as the source
                worked example does).
              </p>
            </div>

            {sameTier && (
              <div style={{ border: `1px solid rgba(217,154,6,0.5)`, background: 'rgba(217,154,6,0.08)', borderRadius: 2, padding: '11px 14px', marginTop: 16 }}>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_65, lineHeight: 1.6 }}>
                  <span style={{ color: '#D99A06', fontWeight: 600 }}>⚠ </span>
                  Tier A and Tier B are the same, so every difference is ₹0. Pick two different tiers to compare.
                </p>
              </div>
            )}
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Total Cost Difference · {tierA} → {tierB}
            </p>

            <div style={{ fontFamily: MONO, fontSize: 'clamp(34px,5.4vw,54px)', fontWeight: 700, color: INK, lineHeight: 1.05, marginBottom: 4, wordBreak: 'break-word' }}>
              {signedRupee(result.totalDelta)}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 20 }}>
              {rupee(result.totalA)} → {rupee(result.totalB)}
              {hasKitchen ? ' · incl. kitchen' : ''}
            </p>

            {/* Per-element ledger — BOQ-style rows */}
            <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, overflow: 'hidden' }}>
              {result.sqftRows.map((r) => (
                <ElementRow
                  key={r.key}
                  label={r.label}
                  sub={`${rupee(r.rateA)}/sqft → ${rupee(r.rateB)}/sqft`}
                  value={signedRupee(r.delta)}
                  tone={r.delta > 0 ? 'add' : r.delta < 0 ? 'deduct' : 'flat'}
                />
              ))}
              <ElementRow
                label="Per-sqft subtotal"
                sub={`${rupee(result.sqftTotalA)} → ${rupee(result.sqftTotalB)}`}
                value={signedRupee(result.sqftDelta)}
                subtotal
              />
              {hasKitchen && (
                <ElementRow
                  label={result.kitchenRow.label}
                  sub={`${rupee(result.kitchenRow.rateA)}/rft → ${rupee(result.kitchenRow.rateB)}/rft`}
                  value={signedRupee(result.kitchenRow.delta)}
                  tone={result.kitchenRow.delta > 0 ? 'add' : result.kitchenRow.delta < 0 ? 'deduct' : 'flat'}
                />
              )}
              <ElementRow
                label="Total difference"
                value={signedRupee(result.totalDelta)}
                total
              />
            </div>

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
              Each row is <strong style={{ color: INK_65 }}>(rate at {tierB} − rate at {tierA}) × area</strong>.
              Notice how little <strong style={{ color: INK_65 }}>structure &amp; masonry</strong> moves against
              how much the finish elements swing — that is the whole point of the comparison.
            </p>
          </div>
        </div>

        {/* ── CTA — Cost Estimator product ───────────────────────────────── */}
        <div
          style={{
            marginTop: 28,
            background: SURF,
            border: `1px solid ${OXIDE}`,
            borderRadius: 2,
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(200,120,90,0.95)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Want the whole estimate, not just the tier delta?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              This calculator shows the cost <em>difference</em> between two finish tiers. The{' '}
              <strong style={{ color: INK }}>Residential Construction Cost Estimator</strong> does the full job —
              every element costed at your chosen tier, area-wise and room-wise, with the same Quality Tiers
              build-up this tool is ported from, ready to hand to a bank or a contractor.
            </p>
          </div>
          <Link
            href="/site-templates/cost-estimator"
            className="btn-3d"
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '13px 26px',
              borderRadius: 2,
              background: OXIDE,
              color: INK,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            See the Cost Estimator →
          </Link>
        </div>
      </section>

      {/* ── REFERENCE TABLE ─────────────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Indicative Tier-2 City Rates</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          The full tier rate card
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr>
                {['Element', 'Unit', 'Basic', 'Standard', 'Premium', 'Luxury'].map((h, i) => (
                  <th key={h} style={{ textAlign: i <= 1 ? 'left' : 'right', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SQFT_ELEMENTS.map((el, i) => (
                <tr key={el.key} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{el.label}</td>
                  <td style={{ padding: '10px 14px', color: INK_35 }}>/sqft</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(el.rates.Basic)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(el.rates.Standard)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(el.rates.Premium)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: INK }}>{rupee(el.rates.Luxury)}</td>
                </tr>
              ))}
              {/* Per-sqft subtotal row */}
              <tr style={{ background: 'rgba(31,78,121,0.10)', borderTop: `1px solid ${BSUB}` }}>
                <td style={{ padding: '11px 14px', color: INK, fontWeight: 500 }}>Per-sqft subtotal</td>
                <td style={{ padding: '11px 14px', color: INK_35 }}>/sqft</td>
                {TIERS.map((t) => (
                  <td key={t} style={{ padding: '11px 14px', textAlign: 'right', color: INK, fontWeight: 500 }}>
                    {rupee(SQFT_ELEMENTS.reduce((s, el) => s + el.rates[t], 0))}
                  </td>
                ))}
              </tr>
              {/* Kitchen row (separate unit) */}
              <tr style={{ background: 'transparent' }}>
                <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{KITCHEN_ELEMENT.label}</td>
                <td style={{ padding: '10px 14px', color: INK_35 }}>/rft</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(KITCHEN_ELEMENT.rates.Basic)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(KITCHEN_ELEMENT.rates.Standard)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: INK_65 }}>{rupee(KITCHEN_ELEMENT.rates.Premium)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: INK }}>{rupee(KITCHEN_ELEMENT.rates.Luxury)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 760 }}>
          Rates as carried on the Residential Construction Cost Estimator&rsquo;s Quality Tiers sheet — indicative
          Tier-2 city figures. Seven elements are priced per sqft of built-up area; the kitchen is priced per
          running foot and kept separate because it does not scale with floor area.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="Why structure barely moves — and finishes multiply">
          <p>
            Run the numbers across the tiers and one pattern jumps out immediately.{' '}
            <strong style={{ color: INK }}>Structure &amp; masonry</strong> climbs only from ₹900 to ₹1,120 per
            sqft between Basic and Luxury — a rise of about a quarter. Over the same span,{' '}
            <strong style={{ color: INK }}>flooring goes from ₹90 to ₹520</strong> (nearly 6×),{' '}
            <strong style={{ color: INK }}>doors &amp; windows from ₹70 to ₹400</strong>, and{' '}
            <strong style={{ color: INK }}>false ceiling &amp; joinery from nothing at all to ₹240</strong>. The
            frame is nearly flat; the finishes fan out.
          </p>
          <p>
            The reason is structural, not commercial. A slab, a beam, a column, a footing must carry the same
            loads and satisfy the same <strong style={{ color: INK }}>IS 456:2000</strong> requirements —
            concrete grade, cover, steel percentage, curing — whether the house is finished in vitrified tile or
            imported marble. The building code does not know or care what tier of flooring goes on top. So the
            concrete-and-steel cost is essentially fixed by engineering: you cannot make a safe frame meaningfully
            cheaper by choosing a lower finish, and choosing a higher finish does not require a stronger frame.
          </p>
          <p>
            Everything downstream of the frame is a <em>choice</em>. Tile can be ceramic or large-format
            porcelain; a door can be a flush shutter or solid teak; paint can be a distemper or a low-VOC
            emulsion with a putty base; you can skip the false ceiling entirely or run cove lighting through
            every room. Each of those choices scales with taste and budget, not with physics — which is exactly
            why the tier difference lives in the finishes, and why the total swing between Basic and Luxury is
            dominated by them.
          </p>
        </Prose>

        <Prose heading="Worked example — 2400 sqft, Standard vs Premium">
          <p>
            Take a <strong style={{ color: INK }}>2400 sqft</strong> built-up home and step it up from{' '}
            <strong style={{ color: INK }}>Standard to Premium</strong> — the calculator&rsquo;s defaults, with no
            kitchen figure entered (as the source worked example does). Element by element, per sqft:
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 13, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '16px', lineHeight: 1.9, overflowX: 'auto' }}>
            Structure &amp; masonry&nbsp;&nbsp;950 → 1020&nbsp;&nbsp;(+70)<br />
            Flooring&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;160 → 280&nbsp;(+120)<br />
            Doors &amp; windows&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;120 → 210&nbsp;&nbsp;(+90)<br />
            Electrical&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;85 → 140&nbsp;&nbsp;(+55)<br />
            Plumbing&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;95 → 165&nbsp;&nbsp;(+70)<br />
            Painting&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;35 → 58&nbsp;&nbsp;&nbsp;(+23)<br />
            False ceiling &amp; joinery&nbsp;45 → 110&nbsp;&nbsp;(+65)<br />
            ─────────────────────<br />
            Per sqft&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1490 → 1983&nbsp;(+493)<br />
            <strong>× 2400 sqft&nbsp;&nbsp;3,576,000 → 4,759,200</strong><br />
            <strong>Difference&nbsp;&nbsp;&nbsp;&nbsp;+₹11,83,200</strong>
          </p>
          <p>
            So on a 2400 sqft home, stepping from Standard to Premium adds{' '}
            <strong style={{ color: INK }}>₹11,83,200</strong> — total moving from{' '}
            <strong style={{ color: INK }}>₹35,76,000 to ₹47,59,200</strong>. Of that ₹493-per-sqft jump, only{' '}
            <strong style={{ color: INK }}>₹70</strong> is structure. The other <strong style={{ color: INK }}>₹423
            </strong> — roughly six-sevenths of the increase — is finishes. Change the tiers or the area above and
            every line recomputes live.
          </p>
        </Prose>

        <Prose heading="How to read the difference on your own build">
          <ul>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Don&rsquo;t trade down on structure to save money.</span>{' '}
              The frame is the cheapest tier lever and the one you must never compromise — a weaker frame is not
              a saving, it is a safety liability. Save on finishes, which you can also upgrade later; do not save
              on concrete and steel, which you cannot.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Mix tiers deliberately.</span>{' '}
              Nothing forces one tier across the whole house. A common, sensible pattern is Premium structure and
              plumbing (hard to redo later) with Standard flooring and painting (easy to upgrade room by room).
              Use the per-element rows above to price exactly that.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Treat kitchen separately.</span>{' '}
              Kitchen scales with counter run, not floor area, and its tier jump is steep — ₹1,200 to ₹7,500 per
              running foot. On a 15-ft run that is a ₹94,500 swing on the kitchen alone, independent of house
              size. Enter your run above to fold it in.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>These are indicative, not quotes.</span>{' '}
              The rates are Tier-2 city figures meant to show the <em>shape</em> of the tier difference. Your
              actual rates will vary with city, year, and specification — but the pattern (flat structure, fanning
              finishes) holds almost everywhere.
            </li>
          </ul>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          For budgeting and comparison reference only. The rates here are indicative Tier-2 city figures ported
          from the Residential Construction Cost Estimator&rsquo;s Quality Tiers sheet; they are designed to show
          the relative difference between finish tiers, not to serve as an exact quotation for any specific city,
          year, or specification. Verify against local rates and a costing professional before committing a
          budget.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────────

function ElementRow({
  label,
  sub,
  value,
  tone,
  subtotal,
  total,
}: {
  label: string
  sub?: string
  value: string
  tone?: 'add' | 'deduct' | 'flat'
  subtotal?: boolean
  total?: boolean
}) {
  const emphasised = subtotal || total
  const valueColor = total ? INK : tone === 'add' ? '#C8785A' : tone === 'deduct' ? '#7BAE7B' : INK_65
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderBottom: total ? 'none' : `1px solid ${BSUB}`,
        background: total ? 'rgba(20,83,45,0.14)' : subtotal ? 'rgba(31,78,121,0.10)' : 'transparent',
        borderTop: total ? `1px solid ${GREEN}` : undefined,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: SANS, fontSize: emphasised ? 14.5 : 13.5, fontWeight: emphasised ? 600 : 500, color: emphasised ? INK : INK_65 }}>{label}</span>
        {sub && <span style={{ fontFamily: MONO, fontSize: 10.5, color: INK_35, display: 'block', marginTop: 2 }}>{sub}</span>}
      </div>
      <span style={{ fontFamily: MONO, fontSize: total ? 16 : 14, fontWeight: total ? 700 : emphasised ? 600 : 500, color: valueColor, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

function Prose({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="bbs-prose" style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px,2.6vw,28px)', fontWeight: 600, color: INK, lineHeight: 1.25, marginBottom: 14 }}>
        {heading}
      </h2>
      <div style={{ fontFamily: SANS, fontSize: 16, color: INK_65, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

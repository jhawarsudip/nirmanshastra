'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  THICKNESS_SPECS,
  THICKNESS_ORDER,
  BRICK_SIZE_MM,
  MORTAR_JOINT_MM,
  calculate,
  type WallThickness,
} from './brick-engine'

// ── Design tokens — matte dark system, matches the tool pages (water-tank / bbs) ──
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

// ── Small presentational helpers ───────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, color: BLUEPRINT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </p>
  )
}

function ISChip({ code }: { code: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: INK_65, border: `1px solid ${BLUEPRINT}`, borderRadius: 2, padding: '3px 7px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {code}
    </span>
  )
}

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function BrickCalculatorPage() {
  const [length, setLength] = useState<string>('10')
  const [height, setHeight] = useState<string>('3')
  const [thickness, setThickness] = useState<WallThickness>('9in')
  const [openings, setOpenings] = useState<string>('0')

  const lengthM = Math.max(0, parseFloat(length || '0') || 0)
  const heightM = Math.max(0, parseFloat(height || '0') || 0)
  const openingsM2 = Math.max(0, parseFloat(openings || '0') || 0)

  const result = useMemo(
    () => calculate({ lengthM, heightM, thickness, openingsAreaM2: openingsM2 }),
    [lengthM, heightM, thickness, openingsM2],
  )
  const spec = THICKNESS_SPECS[thickness]

  const valid = result.netAreaM2 > 0

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

  return (
    <main className="sheet-frame" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pt-16 pb-10">
        <div style={{ maxWidth: 860 }}>
          <Eyebrow>Free Calculator · IS 1077:1992 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Brick Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Count the bricks in a wall before you order. Enter the wall&rsquo;s length and height, pick the
            thickness, and deduct any door or window openings — the tool applies the IS 1077:1992 /
            IS 2212:1991 rate of{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>100 bricks/m² for a 9-inch wall</strong> (50 for a
            4.5-inch partition) and adds a{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>5–10% wastage allowance</strong>. Permanently free —
            nothing to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 1077:1992', 'IS 2212:1991', 'IS 12894:2002'].map((c) => (
              <ISChip key={c} code={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ alignItems: 'start' }}>

          {/* INPUT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              Wall Details
            </p>

            {/* Length + Height */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="bk-len">Wall length (m)</label>
                <input
                  id="bk-len"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="0"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="bk-ht">Wall height (m)</label>
                <input
                  id="bk-ht"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                  style={fieldStyle}
                />
              </div>
            </div>

            {/* Thickness */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="bk-thk">Wall thickness</label>
              <select
                id="bk-thk"
                value={thickness}
                onChange={(e) => setThickness(e.target.value as WallThickness)}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {THICKNESS_ORDER.map((t) => (
                  <option key={t} value={t} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {t === '9in' ? '9-inch (230mm) — 100 bricks/m²' : '4.5-inch (115mm) — 50 bricks/m²'}
                  </option>
                ))}
              </select>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                {spec.note}
              </p>
            </div>

            {/* Openings */}
            <div>
              <label style={labelStyle} htmlFor="bk-open">Openings to deduct (m²)</label>
              <input
                id="bk-open"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
                placeholder="0"
                style={{ ...fieldStyle, maxWidth: 200 }}
              />
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                Total area of doors and windows in this wall. A standard 0.9 m × 2.1 m door is about 1.9 m²; a
                1.2 m × 1.2 m window is about 1.44 m². Leave at 0 for a solid wall.
              </p>
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Bricks Required · {thickness === '9in' ? '9-inch' : '4.5-inch'}
            </p>

            {valid ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(48px,7vw,72px)', fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 4 }}>
                  {num(result.bricks, 0)}
                  <span style={{ fontSize: 22, fontWeight: 500, color: INK_45, marginLeft: 8 }}>bricks</span>
                </div>
                <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
                  before wastage · {num(result.netAreaM2, 2)} m² net wall area
                </p>

                {/* Figure pills — area + order-with-wastage */}
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Net wall area</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(result.netAreaM2, 2)} <span style={{ fontSize: 12, color: INK_45 }}>m²</span></p>
                  </div>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Order (+5–10%)</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: '#7BA77B' }}>{num(result.bricksWith5pct, 0)}–{num(result.bricksWith10pct, 0)}</p>
                  </div>
                </div>

                {/* Breakdown — BOQ table */}
                <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Calculation breakdown
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5 }}>
                  <tbody>
                    <BreakRow
                      label="Gross area"
                      detail={`${num(lengthM, 2)} m × ${num(heightM, 2)} m`}
                      value={`${num(result.grossAreaM2, 2)} m²`}
                    />
                    <BreakRow
                      label="Less openings"
                      detail="doors + windows"
                      value={`− ${num(result.openingsAreaM2, 2)} m²`}
                      muted
                    />
                    <BreakRow
                      label="Net area"
                      detail="area laid in brick"
                      value={`${num(result.netAreaM2, 2)} m²`}
                    />
                    <BreakRow
                      label="Bricks"
                      detail={`× ${num(result.bricksPerSqm, 0)} bricks/m²`}
                      value={`${num(result.bricks, 0)}`}
                      positive
                    />
                    <BreakRow
                      label="+5% wastage"
                      detail="minimum order"
                      value={`${num(result.bricksWith5pct, 0)}`}
                      muted
                    />
                    <BreakRow
                      label="+10% wastage"
                      detail="brittle / cut-heavy walls"
                      value={`${num(result.bricksWith10pct, 0)}`}
                      muted
                    />
                  </tbody>
                </table>

                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
                  The base count is the exact number of bricks laid. Always order with a{' '}
                  <strong style={{ color: INK_65 }}>5–10% wastage allowance</strong> on top for breakage in
                  transit, cutting at corners and openings, and rejects — 5% for clean rectangular walls, closer to
                  10% where there is a lot of cutting.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK_45, lineHeight: 1.7, paddingTop: 8 }}>
                Enter the wall length and height to see the wall area, brick count, and the recommended order
                quantity with wastage.
              </p>
            )}
          </div>
        </div>

        {/* ── CTA — MasonPro ────────────────────────────────────────────────────── */}
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
              Need the full masonry estimate?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              Need your whole masonry cost, not just brick count? Get cement, sand and mortar quantities across all
              8 wall types, plastering and waterproofing BOQs, and a contractor-quote comparison — with MasonPro,
              the complete IS 1077:1992 &amp; IS 2212:1991 masonry estimate.
            </p>
          </div>
          <Link
            href="/tools/masonpro"
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
            Open MasonPro →
          </Link>
        </div>
      </section>

      {/* ── WALL THICKNESS REFERENCE TABLE ──────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Wall Thickness</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          Bricks per square metre of wall
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 560 }}>
            <thead>
              <tr>
                {['Wall', 'Use', 'Mortar', 'Bricks / m²'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 3 ? 'center' : 'left', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {THICKNESS_ORDER.map((t, i) => {
                const s = THICKNESS_SPECS[t]
                return (
                  <tr key={t} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{t === '9in' ? '9" (230mm)' : '4.5" (115mm)'}</td>
                    <td style={{ padding: '10px 14px', color: INK_65 }}>{t === '9in' ? 'Load-bearing / external' : 'Internal partition'}</td>
                    <td style={{ padding: '10px 14px', color: INK_65 }}>{s.mortarRatio}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{num(s.bricksPerSqm, 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          Rates are the IS 1077:1992 / IS 2212:1991 figures shared with NirmanShastra&rsquo;s paid MasonPro tool,
          for the standard 190×90×90mm modular clay brick with a 10mm mortar joint. Order with 5–10% wastage on
          top of the calculated count.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="The standard Indian brick — 190 × 90 × 90 mm">
          <p>
            The Bureau of Indian Standards fixes the <strong style={{ color: INK }}>modular brick</strong> at{' '}
            <strong style={{ color: INK }}>{BRICK_SIZE_MM.length} × {BRICK_SIZE_MM.width} × {BRICK_SIZE_MM.height} mm</strong>{' '}
            under IS 1077:1992. That is the actual, physical size of the brick before any mortar. It is smaller
            than the older &ldquo;traditional&rdquo; non-modular brick (230 × 115 × 75 mm) that many yards still
            supply, which is why this tool asks you which wall you are building rather than guessing.
          </p>
          <p>
            The modular size is designed to work in a tidy 100 mm grid once the mortar is added — a brick plus its
            joint comes to a round <strong style={{ color: INK }}>200 × 100 × 100 mm</strong>. That neat unit is
            what makes 100 bricks land in a square metre of 9-inch wall.
          </p>
        </Prose>

        <Prose heading="Why the 10 mm mortar joint matters">
          <p>
            A brick is never laid tight against its neighbour. IS 2212:1991 sets a{' '}
            <strong style={{ color: INK }}>{MORTAR_JOINT_MM} mm mortar joint</strong> — {MORTAR_JOINT_MM} mm on the
            bed below and {MORTAR_JOINT_MM} mm on the vertical (perpend) face. Adding that joint turns the
            {' '}190 × 90 × 90 mm brick into a 200 × 100 × 100 mm laying unit, and it is the <em>laying</em> unit,
            not the bare brick, that decides how many fit in a wall.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 15, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            9&quot; wall: 1 m² ÷ (0.2 m × 0.1 m face) = 50 faces × 2 brick depths = 100 bricks
          </p>
          <p>
            This is why joint thickness is not a detail to hand-wave. If a mason lays fat 15–20 mm joints to
            stretch the brick count, the wall uses fewer bricks than the code figure — you were billed for 100/m²
            but fewer went in — and the extra mortar is both weaker and more prone to cracking. A thin, consistent
            10 mm joint is what the IS rate assumes, and what this calculator counts.
          </p>
        </Prose>

        <Prose heading="Deducting doors, windows and other openings">
          <p>
            Bricks are only laid in the solid part of the wall, so every door and window has to come out of the
            area first. Multiply each opening&rsquo;s width by its height, add them up, and enter the total in the
            openings field. The tool subtracts it before counting bricks.
          </p>
          <ul>
            <li><span style={{ fontFamily: MONO, color: INK }}>Standard door</span> — about 0.9 × 2.1 m ≈ 1.9 m².</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>Standard window</span> — about 1.2 × 1.2 m ≈ 1.44 m².</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>Ventilator</span> — about 0.6 × 0.45 m ≈ 0.27 m².</li>
          </ul>
          <p>
            Skipping this step is one of the most common ways a brick order is over-quoted. On a wall with a door
            and two windows you can easily be deducting 5 m² — that is 500 bricks on a 9-inch wall that you would
            otherwise pay for and never use.
          </p>
        </Prose>

        <Prose heading="Worked example — a 10 m × 3 m external wall">
          <p>
            Take the calculator&rsquo;s default: a <strong style={{ color: INK }}>10 m long, 3 m high</strong>,{' '}
            <strong style={{ color: INK }}>9-inch</strong> wall with no openings. The gross area is 10 × 3 = 30 m².
            With nothing to deduct, the net area is the same 30 m². At the IS rate of 100 bricks per m²:
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            30 m² × 100 bricks/m² = 3000 bricks  →  order 3150–3300 with 5–10% wastage
          </p>
          <p>
            So 3000 bricks are actually laid, and you would buy roughly{' '}
            <strong style={{ color: INK }}>3150 to 3300</strong> to cover breakage and cutting. If that same wall
            had a 0.9 × 2.1 m door, you would deduct 1.9 m², leaving 28.1 m² and 2810 bricks before wastage.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          Schematic for estimation reference only. Counts use the IS 1077:1992 / IS 2212:1991 rates for the
          standard 190×90×90mm modular clay brick with a 10mm joint (100 bricks/m² for a 9-inch wall, 50 for a
          4.5-inch partition); non-modular bricks, thicker joints, and block masonry differ. Always add 5–10%
          wastage when ordering. Not a substitute for a site engineer&rsquo;s measurement.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components / formatters ──────────────────────────────────────────────────

function BreakRow({
  label, detail, value, positive, negative, muted,
}: { label: string; detail: string; value: string; positive?: boolean; negative?: boolean; muted?: boolean }) {
  const valColor = negative ? '#C8785A' : positive ? '#7BA77B' : muted ? INK_45 : INK_65
  return (
    <tr>
      <td style={{ padding: '7px 0', color: INK_65, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '7px 12px', color: INK_35, fontSize: 11.5 }}>{detail}</td>
      <td style={{ padding: '7px 0', textAlign: 'right', color: valColor, whiteSpace: 'nowrap' }}>{value}</td>
    </tr>
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

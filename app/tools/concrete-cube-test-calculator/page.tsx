'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  calculate,
  SAMPLING_BANDS,
  CUBES_PER_SAMPLE,
} from './cube-test-engine'

// ── Design tokens — matte dark system, matches the other free tool pages (wire / brick / bbs) ──
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

function num(n: number) {
  return n.toLocaleString('en-IN')
}

/** parse a possibly-empty numeric string to a finite number (or 0). */
function toNum(s: string): number {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function ConcreteCubeTestCalculatorPage() {
  // Prefilled with a clean 10 m³ pour so the on-load figures match the worked example in the copy.
  const [volume, setVolume] = useState('10')

  const result = useMemo(() => calculate(toNum(volume)), [volume])
  const activeBandIndex = useMemo(() => {
    const v = toNum(volume)
    if (v <= 0) return -1
    if (v <= 5) return 0
    if (v <= 15) return 1
    if (v <= 30) return 2
    if (v <= 50) return 3
    return 4
  }, [volume])

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
          <Eyebrow>Free Calculator · IS 456:2000 Cl 15.2.2 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Concrete Cube Test Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Enter the volume of concrete in a pour or element and get the{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>minimum number of acceptance samples</strong>{' '}
            and the total cubes to cast — the frequency set by{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>IS 456:2000 Cl 15.2.2</strong>. Each sample is
            six cubes per IS 516: three broken at 7 days as an early check, three at 28 days for the
            acceptance decision. Permanently free — nothing to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 456:2000 · Cl 15.2.2', 'IS 516', 'IS 1199'].map((c) => (
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
              Concrete Quantity
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="cc-volume">Volume of concrete in this pour (m³)</label>
              <input
                id="cc-volume"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                style={fieldStyle}
              />
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                Total concrete placed in the element or day&rsquo;s pour — a raft, a slab, a set of columns.
                Sampling is by quantity, so enter the volume actually cast, not the design estimate.
              </p>
            </div>

            {/* Sampling band table — active band highlighted */}
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 22, marginBottom: 10 }}>
              IS 456:2000 Cl 15.2.2 frequency
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SAMPLING_BANDS.map((b, i) => {
                const active = i === activeBandIndex
                return (
                  <div
                    key={b.range}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: active ? 'rgba(31,78,121,0.18)' : 'rgba(244,244,240,0.03)',
                      border: `1px solid ${active ? BLUEPRINT : BSUB}`,
                      borderRadius: 2,
                      padding: '10px 12px',
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 13, color: active ? INK : INK_65 }}>{b.range} m³</span>
                    <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: active ? INK : INK_45, whiteSpace: 'nowrap' }}>{b.samples}{b.samples === '1' ? ' sample' : ' samples'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              For {result.volume > 0 ? `${num(result.volume)} m³` : '—'} of concrete
            </p>

            {/* Two headline figures */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(40px,6vw,60px)', fontWeight: 700, color: INK, lineHeight: 1 }}>
                  {num(result.samples)}
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: INK_35, marginTop: 4 }}>samples required</p>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(40px,6vw,60px)', fontWeight: 700, color: INK, lineHeight: 1 }}>
                  {num(result.totalCubes)}
                </div>
                <p style={{ fontFamily: MONO, fontSize: 12, color: INK_35, marginTop: 4 }}>cubes to cast</p>
              </div>
            </div>

            {/* 7-day / 28-day split */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 22 }}>
              <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Break at 7 days</p>
                <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: INK }}>{num(result.cubes7Day)} <span style={{ fontSize: 12, color: INK_45, fontWeight: 500 }}>cubes</span></p>
                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, marginTop: 4 }}>early indicator only</p>
              </div>
              <div style={{ border: `1px solid ${BLUEPRINT}`, borderRadius: 2, padding: '14px 16px' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Break at 28 days</p>
                <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: INK }}>{num(result.cubes28Day)} <span style={{ fontSize: 12, color: INK_45, fontWeight: 500 }}>cubes</span></p>
                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, marginTop: 4 }}>acceptance criterion</p>
              </div>
            </div>

            {/* Per-shift reminder — Marking-Yellow advisory */}
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Regardless of volume
            </p>
            <div style={{ border: `1px solid rgba(217,154,6,0.5)`, background: 'rgba(217,154,6,0.08)', borderRadius: 2, padding: '14px 16px' }}>
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: INK_65, lineHeight: 1.65 }}>
                <span style={{ color: '#D99A06', fontWeight: 600 }}>⚠ </span>
                IS 456:2000 Cl 15.2.2 also requires <strong style={{ color: INK }}>at least one sample from
                every work shift</strong> (each day of concreting). If a small pour spans two shifts, take a
                sample in each — the volume table is a minimum, not a licence to skip a shift.
              </p>
            </div>

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
              {CUBES_PER_SAMPLE} cubes per sample (IS 516): {result.samples > 0 ? `${num(result.samples)} × 6 = ${num(result.totalCubes)}` : '3 for the 7-day break, 3 for the 28-day break'}.
              These are minimum acceptance samples — cast spares if you also want stripping or
              post-tensioning checks.
            </p>
          </div>
        </div>

        {/* ── CTA — Site Documentation pack ─────────────────────────────────────── */}
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
              Where do these results get recorded?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              A cube test only counts if it is logged. This is 1 of 9 registers in the full{' '}
              <strong style={{ color: INK }}>Construction Site Documentation Pack</strong> — the Cube Test
              Register, NCR Register, Daily Site Log, and more — the record set an engineer keeps so every
              sample, break and result is traceable back to the pour.
            </p>
          </div>
          <Link
            href="/site-templates/site-documentation"
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
            See the Documentation Pack →
          </Link>
        </div>
      </section>

      {/* ── REFERENCE TABLE ─────────────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Sampling Frequency</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          Samples and cubes by concrete volume
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 620 }}>
            <thead>
              <tr>
                {['Quantity of concrete', 'Samples (IS 456 Cl 15.2.2)', 'Cubes (× 6)'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : 'center', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['1 – 5 m³', '1', '6'],
                ['6 – 15 m³', '2', '12'],
                ['16 – 30 m³', '3', '18'],
                ['31 – 50 m³', '4', '24'],
                ['51 m³ and above', '4 + 1 per further 50 m³', '(samples × 6)'],
              ].map((row, i) => (
                <tr key={row[0]} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: INK }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          Worked at the boundaries: 50 m³ → 4 samples; 51 m³ → still 4 (the extra sample kicks in only past
          each further 50 m³); 100 m³ → 5; 120 m³ → 4 + floor((120−50)/50) = 5 samples = 30 cubes. And on
          every band, at least one sample per shift.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="Why cube testing matters — and what the 28-day break really decides">
          <p>
            A concrete cube test is how a structure proves it is as strong as it was designed to be. Fresh
            concrete is sampled at the pour, cast into standard 150&nbsp;mm cubes, cured in a controlled water
            bath, and crushed in a compression machine to measure the stress it carries before it fails. That
            crushing figure — in N/mm² — is compared against the specified grade (M20, M25, and so on), and it
            is the <strong style={{ color: INK }}>only direct evidence</strong> that the concrete actually in
            the building meets its grade.
          </p>
          <p>
            The <strong style={{ color: INK }}>28-day strength is the acceptance criterion</strong>. Concrete
            gains strength over time as cement hydrates, and IS 456 defines the characteristic strength at 28
            days — that is the number the design assumed and the number acceptance is judged against. The{' '}
            <strong style={{ color: INK }}>7-day break is an early warning only</strong>: at 7 days a normal
            OPC mix has typically reached roughly two-thirds of its 28-day strength, so a low 7-day result
            flags a problem — wrong mix, bad materials, poor curing — while there is still time to react. A
            good 7-day result is reassuring, but it never substitutes for the 28-day test. That is exactly why
            each sample is six cubes: three for the early 7-day indicator, three for the 28-day decision.
          </p>
        </Prose>

        <Prose heading="What happens if a cube test fails">
          <p>
            A failed test — 28-day results below the acceptance limits of IS 456 Cl 16 — does not automatically
            condemn the structure, but it does trigger a defined escalation rather than a shrug. In order:
          </p>
          <ul>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Check the test, then the concrete.</span> First
              confirm the result is genuine (correct sampling, curing, and machine calibration — not a cube
              handling error). If the concrete is genuinely suspect, the engineer investigates that specific
              pour.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Core testing.</span> Cut cores from the hardened
              member and test them, to measure the in-situ strength of the actual concrete rather than a cube
              cast beside it. This is the primary way IS 456 lets you assess concrete already in place.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Load testing.</span> If cores are inconclusive,
              the member can be subjected to a load test per IS 456 to check it carries its design load with
              acceptable deflection and recovery.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Rectification or demolition.</span> If the element
              still cannot be shown to be adequate, it is strengthened, or in the worst case removed and
              recast. The decision rests with the structural engineer against IS 456 — the cube result is what
              forces the question to be asked.
            </li>
          </ul>
          <p>
            None of this is possible without traceable records: which sample came from which pour, its 7-day
            and 28-day figures, and the location it represents. A missing or muddled Cube Test Register is how
            a marginal result becomes an argument instead of a decision.
          </p>
        </Prose>

        <Prose heading="Worked example — a 45 m³ slab pour">
          <p>
            Say you place <strong style={{ color: INK }}>45 m³ of M25</strong> for a floor slab in a single
            shift. Read the frequency table: 45 m³ falls in the 31–50 m³ band, so it needs{' '}
            <strong style={{ color: INK }}>4 samples</strong>.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '16px', lineHeight: 1.85 }}>
            Volume&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 45 m³ (31–50 band)<br />
            Samples&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 4<br />
            Cubes/sample&nbsp;= 6 &nbsp;(3 at 7 days · 3 at 28 days)<br />
            ─────────────────────<br />
            <strong>Total cubes&nbsp;= 4 × 6 = 24</strong> &nbsp;(12 broken at 7 days, 12 at 28 days)
          </p>
          <p>
            So the site casts <strong style={{ color: INK }}>24 cubes</strong> from that slab — and because it
            all went in one shift, the one-sample-per-shift rule is already satisfied by the four samples. Push
            the same pour to 120 m³ and the volume rule gives 4 + floor((120−50)/50) = 5 samples = 30 cubes.
            Enter any volume above and the calculator returns the samples, the total cubes, and the 7-day /
            28-day split.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          For estimation and site-planning reference only. Sampling frequency is the IS 456:2000 Cl 15.2.2
          minimum; each sample is 6 cubes tested per IS 516 (3 at 7 days, 3 at 28 days), and at least one
          sample must be taken from every shift regardless of volume. Acceptance, core testing, load testing
          and any rectification are decisions for the structural engineer against IS 456. Not a substitute for
          the project&rsquo;s specified quality-assurance plan.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────────

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

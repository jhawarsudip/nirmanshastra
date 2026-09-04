'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  GRADES,
  GRADE_ORDER,
  DRY_VOLUME_FACTOR,
  CEMENT_DENSITY,
  BAG_WEIGHT,
  calculate,
  type Grade,
} from './concrete-mix-engine'

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
const MARKING = '#D99A06' // advisories / design-mix notice

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

export default function ConcreteMixRatioCalculatorPage() {
  const [volume, setVolume] = useState<string>('1')
  const [grade, setGrade] = useState<Grade>('M20')

  const vol = Math.max(0, parseFloat(volume || '0') || 0)

  const result = useMemo(() => calculate({ wetVolumeM3: vol, grade }), [vol, grade])
  const spec = GRADES[grade]

  const valid = vol > 0

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
          <Eyebrow>Free Calculator · IS 456:2000 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Concrete Mix Ratio Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Turn a concrete volume into a shopping list. Enter how many cubic metres you need to pour and pick a
            grade — the tool uses NirmanShastra&rsquo;s{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>locked IS 456:2000 per-cubic-metre quantities</strong>{' '}
            to give you <strong style={{ color: INK, fontWeight: 600 }}>cement bags, sand, and aggregate</strong> in
            both m³ and cft. Permanently free — nothing to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 456:2000', 'IS 383:2016', 'IS 269:2015'].map((c) => (
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
              Pour Details
            </p>

            {/* Volume */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="cm-vol">Concrete volume needed (m³)</label>
              <input
                id="cm-vol"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="0"
                style={{ ...fieldStyle, maxWidth: 200 }}
              />
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                The finished volume of the pour. For a slab, that is length × width × thickness — e.g. a
                3 m × 4 m slab, 125 mm thick, is 3 × 4 × 0.125 = 1.5 m³.
              </p>
            </div>

            {/* Grade */}
            <div>
              <label style={labelStyle} htmlFor="cm-grade">Concrete grade</label>
              <select
                id="cm-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value as Grade)}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {GRADE_ORDER.map((g) => (
                  <option key={g} value={g} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {g} — {GRADES[g].ratio}
                  </option>
                ))}
              </select>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                {spec.note}
              </p>
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Materials Required · {grade}
            </p>

            {result.isDesignMix ? (
              // ── DESIGN-MIX NOTICE — no fabricated number (M30+) ────────────────
              <div style={{ paddingTop: 6 }}>
                <div style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.6vw,36px)', fontWeight: 700, color: INK, lineHeight: 1.15, marginBottom: 14 }}>
                  Design mix required
                </div>
                <div style={{ border: `1px solid ${MARKING}`, background: 'rgba(217,154,6,0.10)', borderRadius: 2, padding: '16px 18px', marginBottom: 18 }}>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MARKING, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    ⚠ IS 456:2000 · Cl 9
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 14.5, color: INK, lineHeight: 1.65 }}>
                    {result.designMixMessage}
                  </p>
                </div>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.7 }}>
                  Nominal volume ratios (like 1:1.5:3) are only permitted up to M20, with M25 as the practical
                  ceiling. From M30 upward, the proportions must be fixed by laboratory trial mixes against the
                  actual site materials — so this tool deliberately does not print a cement-bag figure for M30.
                </p>
              </div>
            ) : valid ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(48px,7vw,72px)', fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 4 }}>
                  {num(result.cementBags as number, 2)}
                  <span style={{ fontSize: 22, fontWeight: 500, color: INK_45, marginLeft: 8 }}>bags cement</span>
                </div>
                <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
                  {num(result.cementWeightKg as number, 1)} kg · {num(vol, 2)} m³ of {grade} concrete
                </p>

                {/* Figure pills — sand + aggregate */}
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sand</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(result.sandCft as number, 2)} <span style={{ fontSize: 12, color: INK_45 }}>cft</span></p>
                    <p style={{ fontFamily: MONO, fontSize: 12.5, color: INK_45, marginTop: 2 }}>{num(result.sandVolumeM3 as number, 2)} m³</p>
                  </div>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Aggregate</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(result.aggregateCft as number, 2)} <span style={{ fontSize: 12, color: INK_45 }}>cft</span></p>
                    <p style={{ fontFamily: MONO, fontSize: 12.5, color: INK_45, marginTop: 2 }}>{num(result.aggregateVolumeM3 as number, 2)} m³</p>
                  </div>
                </div>

                {/* Breakdown — BOQ table (linear scaling of locked per-m³ figures) */}
                <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Calculation breakdown
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5 }}>
                  <tbody>
                    <BreakRow
                      label="Cement"
                      detail={`${num(spec.perM3!.cementBags, 2)} bags/m³ × ${num(vol, 2)} m³`}
                      value={`${num(result.cementBags as number, 2)} bags`}
                      positive
                    />
                    <BreakRow
                      label="Sand"
                      detail={`${num(spec.perM3!.sandCft, 2)} cft/m³ × ${num(vol, 2)} m³`}
                      value={`${num(result.sandCft as number, 2)} cft`}
                    />
                    <BreakRow
                      label="Aggregate"
                      detail={`${num(spec.perM3!.aggregateCft, 2)} cft/m³ × ${num(vol, 2)} m³`}
                      value={`${num(result.aggregateCft as number, 2)} cft`}
                    />
                  </tbody>
                </table>

                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
                  Per-m³ figures are the locked IS 456:2000 values from NirmanShastra&rsquo;s Section 8 reference,
                  scaled by your volume. They are dry materials before water — add roughly 2–3% for wastage and
                  spillage on site. Water is added on site to the design water-cement ratio, not shown here.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK_45, lineHeight: 1.7, paddingTop: 8 }}>
                Enter the concrete volume to see the cement bags, sand, and aggregate — in both cubic feet and
                cubic metres.
              </p>
            )}
          </div>
        </div>

        {/* ── CTA — StructurePro ────────────────────────────────────────────────── */}
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
              Need more than concrete?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              Need your full structural cost, not just concrete? Get exact quantities — foundation, columns, beams,
              slabs, steel, and formwork, member by member with contractor-quote comparison — with StructurePro,
              the complete IS 456:2000 &amp; IS 1786:2008 RCC structure estimate.
            </p>
          </div>
          <Link
            href="/tools/structopro"
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
            Open StructurePro →
          </Link>
        </div>
      </section>

      {/* ── GRADE REFERENCE TABLE ───────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · Nominal Mix Grades</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          Per cubic metre of finished concrete
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 620 }}>
            <thead>
              <tr>
                {['Grade', 'Ratio', 'Cement (bags)', 'Sand (cft)', 'Aggregate (cft)'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 || i === 1 ? 'left' : 'center', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADE_ORDER.map((g, i) => {
                const s = GRADES[g]
                return (
                  <tr key={g} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{g}</td>
                    <td style={{ padding: '10px 14px', color: INK_65 }}>{s.ratio}</td>
                    {s.perM3 ? (
                      <>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{num(s.perM3.cementBags, 2)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{num(s.perM3.sandCft, 2)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{num(s.perM3.aggregateCft, 2)}</td>
                      </>
                    ) : (
                      <td colSpan={3} style={{ padding: '10px 14px', textAlign: 'center', color: MARKING }}>
                        Design mix — per structural engineer
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          Figures are the locked IS 456:2000 values from NirmanShastra&rsquo;s Section 8 reference, per 1 m³ of
          finished concrete (dry materials before water). Multiply by your pour volume, then add 2–3% for wastage.
          M30 and above are design mixes — no nominal ratio applies.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="What M20 and M25 actually mean">
          <p>
            The <strong style={{ color: INK }}>M</strong> stands for <strong style={{ color: INK }}>mix</strong>,
            and the number is the concrete&rsquo;s characteristic compressive strength in{' '}
            <strong style={{ color: INK }}>newtons per square millimetre (N/mm², the same as MPa)</strong> measured
            on a standard 150 mm cube after 28 days of curing. M20 concrete reaches 20 N/mm² and M25 reaches 25.
            The higher the number, the stronger — and the more cement-rich — the mix.
          </p>
          <p>
            For nominal mixes, IS 456:2000 fixes the volume proportions of cement, fine aggregate (sand), and
            coarse aggregate (stone):
          </p>
          <ul>
            <li><span style={{ fontFamily: MONO, color: INK }}>M20 = 1 : 1.5 : 3</span> — the workhorse grade for ordinary residential RCC: most house slabs, beams and columns in mild exposure.</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>M25 = 1 : 1 : 2</span> — a richer mix for heavier loads and moderate exposure, and the practical ceiling for site-batched nominal mixing.</li>
            <li><span style={{ fontFamily: MONO, color: INK }}>M30 and above</span> — <strong style={{ color: INK }}>no nominal ratio applies</strong>. These are design mixes proportioned in a laboratory; see the next section.</li>
          </ul>
          <p>
            A frequent site error is calling M20 a &ldquo;1:2:4&rdquo; mix — that is actually M15. The correct M20
            proportion under IS 456:2000 is <strong style={{ color: INK }}>1:1.5:3</strong>, and this calculator
            uses the code value.
          </p>
        </Prose>

        <Prose heading="Nominal mix vs design mix — and why M30 has no ratio here">
          <p>
            A <strong style={{ color: INK }}>nominal mix</strong> uses fixed volume ratios like the ones above. It
            is simple, needs no laboratory, and is what most small residential sites actually batch by the boxful.
            Its weakness is that it ignores the real properties of your materials — the moisture in the sand, the
            grading and water absorption of the aggregate, the exact strength of the cement — so it carries a
            generous safety margin.
          </p>
          <p>
            A <strong style={{ color: INK }}>design mix</strong> is proportioned in a laboratory (following IS 10262)
            for a target strength, using trial batches with the actual site materials and a controlled
            water-cement ratio. It is more economical and more reliable at higher strengths.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 15, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            IS 456:2000 — nominal mixes are permitted only up to M20; above M25 a design mix is mandatory.
          </p>
          <p>
            That is why this tool prints quantities only for <strong style={{ color: INK }}>M20 and M25</strong>.
            For <strong style={{ color: INK }}>M30 and above</strong> there is no legitimate nominal ratio to scale
            — a fabricated &ldquo;1:1:1.5&rdquo; figure would be misleading — so selecting M30 returns a design-mix
            notice instead of a number. Get the proportions from your structural engineer, or from StructurePro&rsquo;s
            full IS 456-compliant grade selection.
          </p>
        </Prose>

        <Prose heading="Where the per-cubic-metre quantities come from">
          <p>
            When cement, sand and aggregate are dry and loose, they hold a lot of air in the voids between grains.
            As they are mixed with water and compacted, that air is driven out and the materials pack tighter, so
            the finished concrete occupies <strong style={{ color: INK }}>less</strong> volume than the dry
            ingredients. IS 456 practice accounts for this by multiplying the required wet volume by{' '}
            <strong style={{ color: INK }}>{DRY_VOLUME_FACTOR}</strong> to get the dry material volume, splitting
            that in the grade&rsquo;s ratio, and converting the cement share to weight at{' '}
            <strong style={{ color: INK }}>{CEMENT_DENSITY} kg/m³</strong> ÷ {BAG_WEIGHT} kg to get bags.
          </p>
          <p>
            NirmanShastra has already run that derivation and{' '}
            <strong style={{ color: INK }}>locked the finished per-m³ quantities</strong> in its Section 8
            reference. Rather than re-deriving them (and risking a rounding drift), this calculator uses those
            locked figures directly and scales them by your volume:
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 15, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            M20 → 8.07 bags · 11.22 cft sand · 22.44 cft aggregate  (per m³)<br />
            M25 → 11.00 bags · 7.48 cft sand · 14.96 cft aggregate  (per m³)
          </p>
        </Prose>

        <Prose heading="Worked example — 1 m³ and 2 m³ of M20 concrete">
          <p>
            Take the calculator&rsquo;s default: <strong style={{ color: INK }}>1 m³</strong> of{' '}
            <strong style={{ color: INK }}>M20 (1:1.5:3)</strong>. Straight from the locked Section 8 figures, one
            cubic metre needs <strong style={{ color: INK }}>8.07 bags of cement</strong>,{' '}
            <strong style={{ color: INK }}>11.22 cft of sand</strong>, and{' '}
            <strong style={{ color: INK }}>22.44 cft of aggregate</strong>.
          </p>
          <p>
            Because the method is linear, a larger pour just multiplies through. For{' '}
            <strong style={{ color: INK }}>2 m³</strong> of the same M20:
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            2 m³ M20 → 8.07 × 2 = 16.14 bags · 11.22 × 2 = 22.44 cft sand · 22.44 × 2 = 44.88 cft aggregate
          </p>
          <p>
            Those are the quantities for the pour; add a small wastage allowance on top. The ~8 bags per m³ for
            M20 matches the standard site rule of thumb.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          Schematic for estimation reference only. Quantities are NirmanShastra&rsquo;s locked IS 456:2000
          per-cubic-metre values (Section 8), scaled by volume; actual requirements vary with material grading,
          moisture, compaction, and wastage. M30 and above must be produced as a design mix per IS 456:2000
          (IS 10262) — no nominal ratio is offered here. Not a substitute for a structural engineer&rsquo;s mix
          design.
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

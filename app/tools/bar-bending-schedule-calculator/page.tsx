'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  SHAPES,
  STANDARD_DIAMETERS,
  calculate,
  hookAllowancePerHook,
  toSigFigs,
  type DimKey,
  type ShapeDef,
} from './bbs-engine'

// ── Design tokens — matte dark system, matches the tool pages (plumbpro / electropro) ──
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

export default function BarBendingScheduleCalculatorPage() {
  const [shapeCode, setShapeCode] = useState('07')
  const [diameter, setDiameter] = useState<number>(8)
  const [quantity, setQuantity] = useState<string>('1')
  const [dimValues, setDimValues] = useState<Record<string, string>>({ A: '180', B: '400', C: '', crankDepth: '' })

  const shape: ShapeDef = useMemo(
    () => SHAPES.find((s) => s.code === shapeCode) ?? SHAPES[0],
    [shapeCode],
  )

  function setDim(key: string, value: string) {
    setDimValues((prev) => ({ ...prev, [key]: value }))
  }

  // Numeric snapshot of the dimensions this shape actually uses.
  const dims = useMemo(() => {
    const out: Record<DimKey, number> = { A: 0, B: 0, C: 0, crankDepth: 0 }
    for (const spec of shape.dims) {
      out[spec.key] = parseFloat(dimValues[spec.key] || '0') || 0
    }
    return out
  }, [shape, dimValues])

  const qty = Math.max(1, Math.floor(parseFloat(quantity || '1') || 1))

  const allFilled = shape.dims.every((s) => (parseFloat(dimValues[s.key] || '0') || 0) > 0)
  const result = useMemo(() => calculate(shape, diameter, dims, qty), [shape, diameter, dims, qty])

  const cuttingMm = Math.round(result.cuttingLength)
  const cuttingM = result.cuttingLength / 1000
  const weightBar = toSigFigs(result.weightPerBar, 4)
  const weightTotal = toSigFigs(result.totalWeight, 4)

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
          <Eyebrow>Free Calculator · IS 2502 · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(34px,5vw,52px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Bar Bending Schedule Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Work out the exact <strong style={{ color: INK, fontWeight: 600 }}>cutting length</strong> and{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>weight</strong> of any reinforcement bar. Choose a
            standard shape, enter its dimensions, and the tool applies the IS 2502 bend deductions, hook
            allowances, and crank additions the way a steel yard actually cuts bars. Permanently free — nothing
            to unlock, no sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['IS 2502', 'IS 1786:2008', 'IS 456:2000', 'IS 13920:2016'].map((c) => (
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
              Bar Details
            </p>

            {/* Shape */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="bbs-shape">Bar shape</label>
              <select
                id="bbs-shape"
                value={shapeCode}
                onChange={(e) => setShapeCode(e.target.value)}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {SHAPES.map((s) => (
                  <option key={s.code} value={s.code} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_45, lineHeight: 1.6, marginTop: 10 }}>
                {shape.note}
              </p>
            </div>

            {/* Diameter */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="bbs-dia">Bar diameter (mm)</label>
              <select
                id="bbs-dia"
                value={diameter}
                onChange={(e) => setDiameter(parseFloat(e.target.value))}
                style={{ ...fieldStyle, appearance: 'none' }}
              >
                {STANDARD_DIAMETERS.map((d) => (
                  <option key={d} value={d} style={{ background: '#1a1a1a', color: '#fff' }}>
                    {d} mm
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
              {shape.dims.map((spec) => (
                <div key={spec.key}>
                  <label style={labelStyle} htmlFor={`bbs-${spec.key}`}>{spec.label} (mm)</label>
                  <input
                    id={`bbs-${spec.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={dimValues[spec.key] ?? ''}
                    onChange={(e) => setDim(spec.key, e.target.value)}
                    placeholder="0"
                    style={fieldStyle}
                  />
                  <p style={{ fontFamily: SANS, fontSize: 11, color: INK_35, marginTop: 5, lineHeight: 1.5 }}>{spec.hint}</p>
                </div>
              ))}
            </div>

            {/* Quantity */}
            <div>
              <label style={labelStyle} htmlFor="bbs-qty">Number of bars</label>
              <input
                id="bbs-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                style={{ ...fieldStyle, maxWidth: 160 }}
              />
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Cutting Length · Shape {shape.code}
            </p>

            {allFilled ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 'clamp(48px,7vw,72px)', fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 4 }}>
                  {num(cuttingMm, 0)}
                  <span style={{ fontSize: 22, fontWeight: 500, color: INK_45, marginLeft: 8 }}>mm</span>
                </div>
                <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
                  = {num(cuttingM, 3)} m per bar
                </p>

                {/* Weight pills */}
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Weight / bar</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(weightBar, weightBar < 1 ? 4 : 3)} <span style={{ fontSize: 12, color: INK_45 }}>kg</span></p>
                  </div>
                  <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total · {qty} bar{qty > 1 ? 's' : ''}</p>
                    <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: INK }}>{num(weightTotal, weightTotal < 1 ? 4 : 3)} <span style={{ fontSize: 12, color: INK_45 }}>kg</span></p>
                  </div>
                </div>

                {/* Breakdown — BOQ table */}
                <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Calculation breakdown
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5 }}>
                  <tbody>
                    <BreakRow label={shape.closedLink ? 'Perimeter' : 'Straight segments'} detail={shape.straightLabel(dims)} value={`+ ${num(result.straight, 0)} mm`} />
                    {shape.hooks > 0 && (
                      <BreakRow
                        label="Hook allowance"
                        detail={`${shape.hooks} × max(9×${diameter}, 75) = ${shape.hooks} × ${num(hookAllowancePerHook(diameter), 0)}`}
                        value={`+ ${num(result.hookTotal, 0)} mm`}
                        positive
                      />
                    )}
                    {result.bendDeduction > 0 && (
                      <BreakRow
                        label="Bend deduction"
                        detail={bendDetail(shape, diameter)}
                        value={`− ${num(result.bendDeduction, 0)} mm`}
                        negative
                      />
                    )}
                    {shape.hasCrank && (
                      <BreakRow
                        label="Crank addition"
                        detail={`0.42 × ${num(dims.crankDepth, 0)}`}
                        value={`+ ${num(result.crankAddition, 1)} mm`}
                        positive
                      />
                    )}
                    <BreakRow label="Unit weight" detail={`${diameter}² ÷ 162`} value={`${num(result.unitWeight, 4)} kg/m`} muted />
                    <tr>
                      <td colSpan={2} style={{ padding: '11px 0 0', borderTop: `1px solid ${BSUB}`, color: INK, fontWeight: 500 }}>Cutting length</td>
                      <td style={{ padding: '11px 0 0', borderTop: `1px solid ${BSUB}`, textAlign: 'right', color: INK, fontWeight: 600 }}>{num(cuttingMm, 0)} mm</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
                  Cutting length figures round to the nearest millimetre; weights are shown to four significant figures.
                  Add development / lap lengths (IS 2502 Cl. 6, IS 456 Cl. 26.2) separately where bars are spliced.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK_45, lineHeight: 1.7, paddingTop: 8 }}>
                Enter all dimensions for shape {shape.code} to see the cutting length, weight, and a full breakdown.
              </p>
            )}
          </div>
        </div>

        {/* ── CTA — full offline spreadsheet ──────────────────────────────────── */}
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
              Need the full schedule?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              Need the full offline spreadsheet with editable formulas? Get the Bar Bending Schedule Excel
              Template — a 12-sheet workbook with a shape library, cutting-length calc, lap &amp; development
              schedule, BBS, bar summary, cutting optimiser, and steel order note built to IS 2502.
            </p>
          </div>
          <Link
            href="/site-templates"
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
            Get the Excel Template →
          </Link>
        </div>
      </section>

      {/* ── SHAPE REFERENCE TABLE ───────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · 13 Shapes</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          Shape library
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 620 }}>
            <thead>
              <tr>
                {['#', 'Shape', 'Straight length', 'Bends', 'Hooks'].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Straight length' || h === 'Shape' ? 'left' : 'center', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHAPES.map((s, i) => (
                <tr key={s.code} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{s.code}</td>
                  <td style={{ padding: '10px 14px', color: INK, fontFamily: SANS }}>{s.name}</td>
                  <td style={{ padding: '10px 14px', color: INK_65 }}>{straightFormula(s)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{bendSummary(s)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: INK_65 }}>{s.hooks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="What a bar bending schedule actually is">
          <p>
            A bar bending schedule — a BBS — is the reinforcement equivalent of a cutting list. Before a single
            bar is cut on site, the schedule sets out, for every bar mark on the drawing, the bar diameter, the
            shape it is bent to, the dimensions of each leg, the cut length, the number of bars, and the total
            weight. It is the bridge between the structural drawing (which shows where steel goes) and the steel
            yard (which needs a list of straight lengths to cut and bend).
          </p>
          <p>
            The single most important number the schedule produces is the <strong style={{ color: INK }}>cutting
            length</strong>: how long each straight bar must be <em>before</em> it is bent, so that after bending
            it fits the member with the correct cover and anchorage. Get the cutting length wrong and every bar of
            that mark is either short (scrap, or an unsafe lap) or long (wasted steel that still gets billed).
            Multiply a small per-bar error across the thousands of bars in a house and the money is real.
          </p>
        </Prose>

        <Prose heading="Why the bent length is shorter than the sum of the legs">
          <p>
            Steel is not paper. When a bar is bent around a pin, the material on the outside of the bend stretches
            and the material on the inside compresses. The bar follows a curve at the corner rather than a sharp
            point, so the true length of steel needed is <em>less</em> than the sum of the leg dimensions you
            measure to the outside faces of the member.
          </p>
          <p>
            IS 2502 accounts for this with a fixed <strong style={{ color: INK }}>bend deduction</strong> per bend,
            expressed as a multiple of the bar diameter (d):
          </p>
          <ul>
            <li><span style={{ fontFamily: MONO, color: INK }}>45° bend → deduct 1d</span></li>
            <li><span style={{ fontFamily: MONO, color: INK }}>90° bend → deduct 2d</span></li>
            <li><span style={{ fontFamily: MONO, color: INK }}>135° bend → deduct 3d</span></li>
          </ul>
          <p>
            The sharper the bend, the more the bar &ldquo;short-cuts&rdquo; the corner, so the larger the deduction.
            You add up the leg dimensions, subtract one deduction for every bend in the bar, add back the hook
            allowances, and that is your cutting length. This tool does exactly that — the breakdown panel shows
            each term so you can trace where the number comes from.
          </p>
        </Prose>

        <Prose heading="Hooks and 135° seismic hooks">
          <p>
            Bars that need to be anchored — stirrup ends, the free ends of many main bars — finish in a hook. IS
            2502 gives a standard hook allowance per hook of the <strong style={{ color: INK }}>greater of 9d or
            75&nbsp;mm</strong>. For a small bar the 75&nbsp;mm floor governs; for 10&nbsp;mm and above the 9d term
            takes over. The hook adds length, so it is added to the cutting length (the bend at the hook itself is
            the 135° deduction that goes the other way).
          </p>
          <p>
            In seismic zones III to V, IS 13920:2016 requires stirrups and ties to close with 135° hooks rather
            than 90° hooks, because a 90° hook can open up and lose its grip when the concrete cover spalls during
            an earthquake. That is the only difference between shape 07 and shape 08 in the library above — the
            geometry is identical; the detailing standard is stricter.
          </p>
        </Prose>

        <Prose heading="The common manual-calculation errors this tool removes">
          <ul>
            <li>
              <strong style={{ color: INK }}>Forgetting the bend deduction entirely.</strong> The most frequent
              mistake — adding the legs and stopping there. On a rectangular stirrup with five bends that alone
              over-states the length by several diameters, and the error repeats on every stirrup in every column
              and beam.
            </li>
            <li>
              <strong style={{ color: INK }}>Applying the wrong deduction for the angle.</strong> Treating a 135°
              seismic hook as if it were a 90° bend (2d instead of 3d), or vice-versa, is easy to do by hand and
              silently wrong.
            </li>
            <li>
              <strong style={{ color: INK }}>Using 9d for the hook when 75&nbsp;mm governs.</strong> For 6 and
              8&nbsp;mm stirrup steel, 9d is only 54–72&nbsp;mm, but the code floor is 75&nbsp;mm. Hand
              calculations that always use 9d under-cut small-diameter hooks.
            </li>
            <li>
              <strong style={{ color: INK }}>Missing the crank addition.</strong> A 45° crank adds 0.42 × the
              crank depth for the inclined portion. Bars cranked at a support are routinely scheduled as if they
              were straight, and come up short.
            </li>
            <li>
              <strong style={{ color: INK }}>Wrong unit weight.</strong> The d²/162 rule (kg per metre) is simple,
              but rounding 8&nbsp;mm to &ldquo;0.4&rdquo; or 12&nbsp;mm to &ldquo;0.9&rdquo; instead of the true
              0.395 and 0.888 quietly shifts every weight — and steel is billed by weight.
            </li>
          </ul>
        </Prose>

        <Prose heading="How the unit weight is derived">
          <p>
            A bar is a cylinder of steel. Its weight per metre is its cross-sectional area times the density of
            steel (7850&nbsp;kg/m³ per IS 1786:2008). Working the area through in millimetres and simplifying the
            constants collapses to the well-known site rule:
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 15, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            unit weight (kg/m) = d² ÷ 162
          </p>
          <p>
            So an 8&nbsp;mm bar is 64 ÷ 162 = 0.395&nbsp;kg/m and a 12&nbsp;mm bar is 144 ÷ 162 = 0.888&nbsp;kg/m.
            Multiply the cutting length in metres by this figure and you have the weight of one bar; multiply by
            the bar count for the mark and you have the schedule weight the yard will invoice.
          </p>
        </Prose>

        <Prose heading="Worked example — a rectangular stirrup">
          <p>
            Take shape 07, a rectangular stirrup in 8&nbsp;mm steel with legs A = 180&nbsp;mm and B = 400&nbsp;mm
            (centre-line dimensions). The perimeter is 2 × (180 + 400) = 1160&nbsp;mm. It carries two hooks, each
            the greater of 9 × 8 = 72&nbsp;mm or 75&nbsp;mm, so 2 × 75 = 150&nbsp;mm. Its bends are three 90°
            corners (3 × 2d = 48&nbsp;mm) and two 135° hooks (2 × 3d = 48&nbsp;mm), a total deduction of
            96&nbsp;mm.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 14.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px' }}>
            1160 + 150 − 96 = 1214&nbsp;mm  →  1.214&nbsp;m × 0.395&nbsp;kg/m = 0.4796&nbsp;kg
          </p>
          <p>
            That is exactly what the calculator returns when you load shape 07 with those inputs — the default
            values above. Change the diameter to a seismic 500D bar or the shape to 08 and you can watch each term
            in the breakdown move.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          Schematic for estimation reference only. Cutting lengths use centre-line dimensions and the standard
          IS 2502 bend deductions and hook allowances; verify against your structural drawings and add lap /
          development lengths before ordering steel. Not a substitute for a structural engineer&rsquo;s approved
          bar bending schedule.
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

function bendDetail(shape: ShapeDef, d: number): string {
  const parts: string[] = []
  if (shape.bends.deg45) parts.push(`${shape.bends.deg45}×45°(1d)`)
  if (shape.bends.deg90) parts.push(`${shape.bends.deg90}×90°(2d)`)
  if (shape.bends.deg135) parts.push(`${shape.bends.deg135}×135°(3d)`)
  return `${parts.join(' + ')}, d=${d}`
}

function bendSummary(shape: ShapeDef): string {
  const parts: string[] = []
  if (shape.bends.deg45) parts.push(`${shape.bends.deg45}×45°`)
  if (shape.bends.deg90) parts.push(`${shape.bends.deg90}×90°`)
  if (shape.bends.deg135) parts.push(`${shape.bends.deg135}×135°`)
  return parts.length ? parts.join(', ') : '—'
}

function straightFormula(shape: ShapeDef): string {
  switch (shape.code) {
    case '00': case '04': return 'A'
    case '01': case '03': return 'A + B'
    case '02': return 'A + B + C'
    case '05': case '06': return 'A + B + C'
    case '07': case '08': case '10': return '2 × (A + B)'
    case '09': return '4 × A'
    case '11': return '2 × A + B'
    case '12': return 'A (= π × dia)'
    default: return '—'
  }
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

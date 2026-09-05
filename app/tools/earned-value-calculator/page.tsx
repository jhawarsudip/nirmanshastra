'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { calculate, readQuadrant } from './evm-engine'

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
const YELLOW = '#D99A06'

// Stamp colours by tone.
const TONE_COLOR: Record<'good' | 'warn' | 'bad' | 'neutral', string> = {
  good: '#7BAE7B',
  warn: YELLOW,
  bad: 'rgba(200,120,90,0.95)',
  neutral: INK_45,
}
const TONE_BORDER: Record<'good' | 'warn' | 'bad' | 'neutral', string> = {
  good: GREEN,
  warn: 'rgba(217,154,6,0.6)',
  bad: OXIDE,
  neutral: BSUB,
}
const TONE_FILL: Record<'good' | 'warn' | 'bad' | 'neutral', string> = {
  good: 'rgba(20,83,45,0.14)',
  warn: 'rgba(217,154,6,0.08)',
  bad: 'rgba(140,58,34,0.12)',
  neutral: 'transparent',
}

// ── Small presentational helpers ───────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, color: BLUEPRINT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </p>
  )
}

function Chip({ code }: { code: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: INK_65, border: `1px solid ${BLUEPRINT}`, borderRadius: 2, padding: '3px 7px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {code}
    </span>
  )
}

/** ₹ formatter — Indian grouping, 2 dp. */
function rupee(n: number) {
  const sign = n < 0 ? '−' : ''
  return sign + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** money metric that may be null (not computable). */
function rupeeOrDash(n: number | null) {
  return n === null ? '—' : rupee(n)
}

/** index formatter — 4 dp, or dash if not computable. */
function index4(n: number | null) {
  return n === null ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

/** parse a possibly-empty numeric string to a finite number (or 0). */
function toNum(s: string): number {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function EarnedValueCalculatorPage() {
  // Prefilled with the source product's real worked example, so what loads on
  // screen is exactly the verified reference figures.
  const [bac, setBac] = useState('3330373')
  const [pv, setPv] = useState('1307160.87')
  const [ev, setEv] = useState('1143012.03')
  const [ac, setAc] = useState('1169100')

  const result = useMemo(
    () =>
      calculate({
        bac: toNum(bac),
        pv: toNum(pv),
        ev: toNum(ev),
        ac: toNum(ac),
      }),
    [bac, pv, ev, ac]
  )

  const quadrant = useMemo(() => readQuadrant(result.spi, result.cpi), [result.spi, result.cpi])

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
          <Eyebrow>Free Calculator · Project Controls · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Earned Value Calculator — SPI, CPI, EAC &amp; TCPI
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Enter four figures a project already tracks —{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Budget at Completion, Planned Value, Earned Value and Actual Cost</strong>{' '}
            to date — and get the full earned-value picture: schedule and cost variances, the SPI and CPI
            performance indices, the forecast final cost, and the efficiency the remaining work must hit.
            It runs the same analysis as our{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Planning, Progress &amp; Delay Control</strong> workbook:
          </p>
          <p style={{ fontFamily: MONO, fontSize: 13.5, color: INK, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px', marginTop: 18, lineHeight: 1.9 }}>
            SV = EV − PV&nbsp;&nbsp;·&nbsp;&nbsp;CV = EV − AC<br />
            SPI = EV ÷ PV&nbsp;&nbsp;·&nbsp;&nbsp;CPI = EV ÷ AC<br />
            EAC = BAC ÷ CPI&nbsp;&nbsp;·&nbsp;&nbsp;ETC = EAC − AC&nbsp;&nbsp;·&nbsp;&nbsp;VAC = BAC − EAC<br />
            TCPI = (BAC − EV) ÷ (BAC − AC)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['Earned Value Management', 'Schedule + Cost', 'Forecast at Completion'].map((c) => (
              <Chip key={c} code={c} />
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
              Earned Value Inputs (₹)
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="evm-bac">Budget at Completion — BAC (₹)</label>
              <input id="evm-bac" type="number" inputMode="decimal" min={0} step="any" value={bac} onChange={(e) => setBac(e.target.value)} style={fieldStyle} />
              <p style={hintStyle}>The total approved budget for the whole scope of work.</p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="evm-pv">Planned Value to date — PV (₹)</label>
              <input id="evm-pv" type="number" inputMode="decimal" min={0} step="any" value={pv} onChange={(e) => setPv(e.target.value)} style={fieldStyle} />
              <p style={hintStyle}>Budgeted cost of the work that <em>should</em> be done by the cut-off date, per the baseline.</p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="evm-ev">Earned Value to date — EV (₹)</label>
              <input id="evm-ev" type="number" inputMode="decimal" min={0} step="any" value={ev} onChange={(e) => setEv(e.target.value)} style={fieldStyle} />
              <p style={hintStyle}>Budgeted cost of the work <em>actually</em> completed = % complete × BAC, summed over activities.</p>
            </div>

            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle} htmlFor="evm-ac">Actual Cost to date — AC (₹)</label>
              <input id="evm-ac" type="number" inputMode="decimal" min={0} step="any" value={ac} onChange={(e) => setAc(e.target.value)} style={fieldStyle} />
              <p style={hintStyle}>The real money spent on the work completed so far.</p>
            </div>

            <div style={{ border: `1px solid rgba(31,78,121,0.4)`, background: 'rgba(31,78,121,0.08)', borderRadius: 2, padding: '11px 14px', marginTop: 18 }}>
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_65, lineHeight: 1.6 }}>
                Earned value is only as honest as the <strong style={{ color: INK }}>percentage-complete</strong> that
                feeds EV. It measures value executed, not activities ticked — so weight each activity by its cost and
                judge % complete on physical work in place, not effort spent.
              </p>
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Forecast Cost at Completion — EAC
            </p>

            <div style={{ fontFamily: MONO, fontSize: 'clamp(30px,4.8vw,48px)', fontWeight: 700, color: INK, lineHeight: 1.05, marginBottom: 4, wordBreak: 'break-word' }}>
              {rupeeOrDash(result.eac)}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 22 }}>
              at the current cost efficiency (BAC ÷ CPI)
            </p>

            {/* Metric grid — schedule row, cost row, forecast row */}
            <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 4 }}>
              <Metric label="Schedule Variance" abbr="SV = EV − PV" value={rupee(result.sv)} tone={result.sv < 0 ? 'bad' : 'good'} />
              <Metric label="Cost Variance" abbr="CV = EV − AC" value={rupee(result.cv)} tone={result.cv < 0 ? 'bad' : 'good'} />
              <Metric label="Schedule Perf. Index" abbr="SPI = EV ÷ PV" value={index4(result.spi)} tone={result.spi === null ? 'neutral' : result.spi < 1 ? 'bad' : 'good'} />
              <Metric label="Cost Perf. Index" abbr="CPI = EV ÷ AC" value={index4(result.cpi)} tone={result.cpi === null ? 'neutral' : result.cpi < 1 ? 'bad' : 'good'} />
              <Metric label="Estimate to Complete" abbr="ETC = EAC − AC" value={rupeeOrDash(result.etc)} tone="neutral" />
              <Metric label="Variance at Completion" abbr="VAC = BAC − EAC" value={rupeeOrDash(result.vac)} tone={result.vac === null ? 'neutral' : result.vac < 0 ? 'bad' : 'good'} />
              <Metric label="To-Complete Perf. Index" abbr="TCPI = (BAC−EV)÷(BAC−AC)" value={index4(result.tcpi)} tone="neutral" wide />
            </div>

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 16 }}>
              EAC forecasts the final cost if the work carries on at today&rsquo;s CPI. VAC is the resulting
              over-run (negative) or saving (positive) against BAC. TCPI is the cost efficiency the remaining
              work must average to still finish inside BAC — above 1.00 means the rest has to be run tighter
              than it has been so far.
            </p>
          </div>
        </div>

        {/* ── 2×2 READING STAMP ───────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 24,
            background: TONE_FILL[quadrant.tone],
            border: `1px solid ${TONE_BORDER[quadrant.tone]}`,
            borderRadius: 2,
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: TONE_COLOR[quadrant.tone],
                border: `1px solid ${TONE_COLOR[quadrant.tone]}`,
                borderRadius: 2,
                padding: '5px 10px',
                transform: 'rotate(-2deg)',
                display: 'inline-block',
              }}
            >
              SPI {index4(result.spi)} · CPI {index4(result.cpi)}
            </span>
            <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, color: INK }}>{quadrant.title}</span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 14.5, color: INK_65, lineHeight: 1.7, maxWidth: 760 }}>
            {quadrant.reading}
          </p>
        </div>

        {/* ── CTA — Planning, Progress & Delay Control product ──────────────────── */}
        <div
          style={{
            marginTop: 24,
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
              Tracking a whole programme, not one cut-off?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              This calculator reads one snapshot. The{' '}
              <strong style={{ color: INK }}>Planning, Progress &amp; Delay Control</strong> workbook does the
              full job — a value-weighted baseline and S-curve, period-by-period progress updates, the earned
              value metrics tracked over time, plus a delay/EOT register that classifies events the way a
              contract does — the exact source this tool is ported from.
            </p>
          </div>
          <Link
            href="/site-templates/planning-progress"
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
            See Planning &amp; Progress →
          </Link>
        </div>
      </section>

      {/* ── 2×2 REFERENCE TABLE ─────────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reading Guide · The SPI × CPI Grid</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          What the two indices mean together
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr>
                {['SPI', 'CPI', 'Reading', 'Where the risk is'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['≥ 1', '≥ 1', 'On/ahead of schedule & on budget', 'Best quadrant — hold the line'],
                ['≥ 1', '< 1', 'On time but over cost', 'Cost run, not the calendar'],
                ['< 1', '≥ 1', 'Behind schedule but under cost', 'Schedule & LD exposure'],
                ['< 1', '< 1', 'Behind schedule & over cost', 'Worst quadrant — recover now'],
              ].map((row, i) => (
                <tr key={row[2]} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px', color: INK }}>{row[2]}</td>
                  <td style={{ padding: '10px 14px', color: INK_65 }}>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          An index of exactly 1.00 is on target. Below 1.00 is the problem side — SPI &lt; 1 means less value
          earned than planned by now; CPI &lt; 1 means the earned value cost more than it was budgeted for.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="Earned value measures value executed, not activities ticked">
          <p>
            Ask a site how it is doing and you will hear &ldquo;about 60% done&rdquo;. Sixty percent of{' '}
            <em>what</em> — activities, floor area, or money? A progress figure that is not weighted by value
            is a feeling, not a measurement. Earned value fixes that:{' '}
            <strong style={{ color: INK }}>earned value measures value executed, not activities ticked</strong>.
            You weight each activity by its cost, so completing the foundations counts for exactly what it is
            worth, and the gap between planned and earned becomes something you can read in rupees and days
            rather than vibes.
          </p>
          <p>
            But the method is only as honest as one number you feed it: the{' '}
            <strong style={{ color: INK }}>percentage-complete</strong> that drives Earned Value. EV is
            &ldquo;% complete × budget&rdquo; summed across activities, so an optimistic 80%-when-it-is-really-60%
            quietly inflates EV, flatters SPI and CPI, and hides the very slip the method exists to catch.
            Judge % complete on physical work in place, not effort spent or time elapsed, and the metrics below
            stay trustworthy.
          </p>
        </Prose>

        <Prose heading="What SPI and CPI actually mean">
          <p>
            <strong style={{ color: INK }}>SPI, the Schedule Performance Index, is EV ÷ PV.</strong> It asks:
            of the value that <em>should</em> have been earned by now, how much actually was? An SPI of 0.87
            means you have earned 87 paise of value for every rupee the baseline planned by this date — the
            project is running at 87% of the planned pace, i.e. behind schedule in money-weighted terms. SPI
            of 1.00 is dead on plan; above 1.00 is ahead. Because it is measured in value, not on the critical
            path, SPI is a health check, not a replacement for the programme — a project can show SPI near 1
            while a critical activity is still late.
          </p>
          <p>
            <strong style={{ color: INK }}>CPI, the Cost Performance Index, is EV ÷ AC.</strong> It asks: for
            every rupee actually spent, how much value did you get? A CPI of 0.98 means each rupee bought 98
            paise of budgeted value — you are spending slightly more than the work is worth, i.e. mildly over
            cost. CPI of 1.00 is on budget; above 1.00 means the work is coming in cheaper than budgeted. CPI
            is the single most watched EVM number because it is stubborn: on most projects the cost efficiency
            you have shown so far is a good predictor of what you will keep showing — which is exactly why the
            forecast <strong style={{ color: INK }}>EAC = BAC ÷ CPI</strong> extrapolates from it.
          </p>
        </Prose>

        <Prose heading="Worked example — the reference figures this tool loads with">
          <p>
            The calculator opens on a real snapshot from the Planning &amp; Progress workbook:{' '}
            <strong style={{ color: INK }}>BAC ₹33,30,373</strong>, and to date{' '}
            <strong style={{ color: INK }}>PV ₹13,07,160.87</strong>,{' '}
            <strong style={{ color: INK }}>EV ₹11,43,012.03</strong> and{' '}
            <strong style={{ color: INK }}>AC ₹11,69,100</strong>.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 13, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '16px', lineHeight: 1.9, overflowX: 'auto' }}>
            SV&nbsp;&nbsp;= EV − PV&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= −₹1,64,148.84<br />
            CV&nbsp;&nbsp;= EV − AC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= −₹26,087.97<br />
            SPI&nbsp;= EV ÷ PV&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 0.8744<br />
            CPI&nbsp;= EV ÷ AC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 0.9777<br />
            EAC&nbsp;= BAC ÷ CPI&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹34,06,385.04<br />
            ETC&nbsp;= EAC − AC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹22,37,285.04<br />
            VAC&nbsp;= BAC − EAC&nbsp;&nbsp;&nbsp;&nbsp;= −₹76,012.04<br />
            TCPI = (BAC−EV)÷(BAC−AC) = 1.0121
          </p>
          <p>
            Read together: SPI 0.8744 and CPI 0.9777 are <em>both</em> below 1, so this project sits in the
            worst quadrant — behind schedule and over cost, though only mildly on cost. The forecast EAC of
            ₹34,06,385 is about ₹76,012 over the ₹33,30,373 budget (that is the negative VAC), and TCPI 1.0121
            says the remaining work must run at 101.21% cost efficiency — slightly tighter than it has managed
            so far — to still land on budget. Change any input above and all eight metrics, the quadrant, and
            the EAC update live.
          </p>
        </Prose>

        <Prose heading="EAC, ETC, VAC and TCPI — reading the forecast">
          <ul>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>EAC — Estimate at Completion.</span>{' '}
              BAC ÷ CPI. The projected final cost if the work continues at today&rsquo;s cost efficiency. The
              most common forecast; it assumes the cost trend holds.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>ETC — Estimate to Complete.</span>{' '}
              EAC − AC. The money still to be spent from now to the finish — the forward-looking figure for a
              cash-flow forecast.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>VAC — Variance at Completion.</span>{' '}
              BAC − EAC. The forecast over-run (negative) or saving (positive) against the original budget.
              This is the number the client ultimately cares about.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>TCPI — To-Complete Performance Index.</span>{' '}
              (BAC − EV) ÷ (BAC − AC). The cost efficiency the <em>remaining</em> work must average to still
              finish inside BAC. If TCPI is well above the CPI you have actually been achieving, finishing on
              budget is no longer realistic — it is a reality check on the recovery plan.
            </li>
          </ul>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          For estimation and cross-checking reference only. Earned value analysis is only as reliable as the
          baseline and the percentage-complete figures behind Planned Value and Earned Value; garbage in,
          garbage out. The forecast EAC shown here is the CPI-based method (BAC ÷ CPI) — other EAC formulas
          suit projects where the cost trend is not expected to continue. Use alongside the programme and a
          qualified planning engineer&rsquo;s judgement, not in place of them.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────────

function Metric({
  label,
  abbr,
  value,
  tone,
  wide,
}: {
  label: string
  abbr: string
  value: string
  tone: 'good' | 'warn' | 'bad' | 'neutral'
  wide?: boolean
}) {
  return (
    <div
      style={{
        border: `1px solid ${BSUB}`,
        borderRadius: 2,
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.015)',
        gridColumn: wide ? '1 / -1' : undefined,
      }}
    >
      <p style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 500, color: INK_65, marginBottom: 2 }}>{label}</p>
      <p style={{ fontFamily: MONO, fontSize: 9.5, color: INK_35, marginBottom: 8, letterSpacing: '0.01em' }}>{abbr}</p>
      <p style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: TONE_COLOR[tone] === INK_45 ? INK : TONE_COLOR[tone], wordBreak: 'break-word' }}>
        {value}
      </p>
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

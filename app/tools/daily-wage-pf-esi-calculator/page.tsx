'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  calculate,
  PF_EMPLOYEE_CAP,
  PF_WAGE_CEILING,
  ESI_WAGE_CEILING,
  STANDARD_HOURS_PER_DAY,
  OVERTIME_MULTIPLIER,
} from './wage-engine'

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

function ISChip({ code }: { code: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: INK_65, border: `1px solid ${BLUEPRINT}`, borderRadius: 2, padding: '3px 7px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {code}
    </span>
  )
}

/** ₹ formatter — Indian grouping, 2 dp. */
function rupee(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** parse a possibly-empty numeric string to a finite number (or 0). */
function toNum(s: string): number {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function DailyWagePfEsiCalculatorPage() {
  // Prefilled to Test Case 1 (₹900/day × 23 days) so the number on screen at load
  // matches the worked example in the copy below.
  const [dailyWage, setDailyWage] = useState('900')
  const [payableDays, setPayableDays] = useState('23')
  const [overtimeHours, setOvertimeHours] = useState('0')
  const [advance, setAdvance] = useState('0')

  const result = useMemo(
    () =>
      calculate({
        dailyWage: toNum(dailyWage),
        payableDays: toNum(payableDays),
        overtimeHours: toNum(overtimeHours),
        advance: toNum(advance),
      }),
    [dailyWage, payableDays, overtimeHours, advance]
  )

  const hasOvertime = toNum(overtimeHours) > 0

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
          <Eyebrow>Free Calculator · Site Labour Muster Roll · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Daily-Wage PF &amp; ESI Calculator
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Work out one worker&rsquo;s net wage the way a construction site actually pays —{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>a daily rate across the days worked</strong>, not a
            fixed monthly salary. Enter the daily wage and payable days (decimals are fine — 23.5 is a real
            muster-roll figure), add overtime or an advance if any, and get basic earned, gross wages,
            employee PF, employee ESI and the final net payable. It runs the same computation as our{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Labour &amp; Statutory Compliance</strong> Wage
            Register:
          </p>
          <p style={{ fontFamily: MONO, fontSize: 14.5, color: INK, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px', marginTop: 18, lineHeight: 1.6 }}>
            Net Payable = Gross Wages − PF − ESI − Advance
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['EPF Act 1952 · ₹15,000 ceiling', 'ESI Act 1948 · ₹21,000 ceiling', 'Code on Wages 2019'].map((c) => (
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
              Muster-Roll Inputs
            </p>

            {/* Daily wage + payable days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="dw-wage">Daily wage (₹)</label>
                <input
                  id="dw-wage"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>The agreed rate for one full day on the muster roll.</p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="dw-days">Payable days</label>
                <input
                  id="dw-days"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={payableDays}
                  onChange={(e) => setPayableDays(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>Days actually worked this period. Decimals allowed — e.g. 23.5.</p>
              </div>
            </div>

            {/* Overtime + advance (both optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 4 }}>
              <div>
                <label style={labelStyle} htmlFor="dw-ot">Overtime hours — optional</label>
                <input
                  id="dw-ot"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>
                  Paid at twice the ordinary hourly rate (daily wage ÷ {STANDARD_HOURS_PER_DAY} h). Leave at 0
                  if none.
                </p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="dw-advance">Advance taken (₹) — optional</label>
                <input
                  id="dw-advance"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>Any advance already paid, recovered from this wage. Leave at ₹0 if none.</p>
              </div>
            </div>
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Net Payable to Worker
            </p>

            <div style={{ fontFamily: MONO, fontSize: 'clamp(34px,5.4vw,54px)', fontWeight: 700, color: INK, lineHeight: 1.05, marginBottom: 4, wordBreak: 'break-word' }}>
              {rupee(result.netPayable)}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
              after PF, ESI &amp; advance recovery
            </p>

            {/* Breakdown ledger — muster-roll rows */}
            <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, overflow: 'hidden' }}>
              <LedgerRow label="Basic earned" sub={`${toNum(dailyWage) || 0} × ${toNum(payableDays) || 0} days`} value={rupee(result.basicEarned)} sign="" />
              {hasOvertime && (
                <LedgerRow label="Overtime pay" sub={`${toNum(overtimeHours)} h × ${OVERTIME_MULTIPLIER}× hourly`} value={rupee(result.overtimePay)} sign="+" tone="add" />
              )}
              <LedgerRow label="Gross wages" value={rupee(result.grossWages)} sign="=" subtotal />
              <LedgerRow
                label="PF (employee)"
                sub={result.pf >= PF_EMPLOYEE_CAP ? `12% of basic — capped at ${rupee(PF_EMPLOYEE_CAP)}` : '12% of basic earned'}
                value={rupee(result.pf)}
                sign="−"
                tone="deduct"
              />
              <LedgerRow
                label="ESI (employee)"
                sub={result.esiApplies ? '0.75% of gross' : `gross > ${rupee(ESI_WAGE_CEILING)} — not covered`}
                value={rupee(result.esi)}
                sign="−"
                tone="deduct"
              />
              <LedgerRow label="Advance recovery" sub="entered amount" value={rupee(result.advance)} sign="−" tone="deduct" />
              <LedgerRow label="Net payable" value={rupee(result.netPayable)} sign="=" total />
            </div>

            {!result.esiApplies && (
              <div style={{ border: `1px solid rgba(217,154,6,0.5)`, background: 'rgba(217,154,6,0.08)', borderRadius: 2, padding: '11px 14px', marginTop: 16 }}>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_65, lineHeight: 1.6 }}>
                  <span style={{ color: '#D99A06', fontWeight: 600 }}>⚠ </span>
                  Gross wages exceed the {rupee(ESI_WAGE_CEILING)} ESI coverage ceiling, so no employee ESI
                  is deducted this period.
                </p>
              </div>
            )}

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
              PF is <strong style={{ color: INK_65 }}>12% of basic earned</strong>, hard-capped at{' '}
              {rupee(PF_EMPLOYEE_CAP)} (12% of the {rupee(PF_WAGE_CEILING)} EPF wage ceiling). ESI is{' '}
              <strong style={{ color: INK_65 }}>0.75% of gross wages</strong> and applies only while gross is
              at or below {rupee(ESI_WAGE_CEILING)}. Overtime adds to gross (and to the ESI base) but not to
              the PF base.
            </p>
          </div>
        </div>

        {/* ── CTA — Labour & Statutory Compliance product ───────────────────────── */}
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
              Running the whole gang, not one worker?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              This calculator handles one worker&rsquo;s net wage. The{' '}
              <strong style={{ color: INK }}>Labour &amp; Statutory Compliance</strong> Excel toolkit does the
              full job — the complete muster roll for the whole gang, PF &amp; ESI contribution registers
              (employee and employer share), wage slips, overtime and advance ledgers, and the statutory
              returns built in — the exact source this tool is ported from.
            </p>
          </div>
          <Link
            href="/site-templates/labour-compliance"
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
            See Labour &amp; Statutory Compliance →
          </Link>
        </div>
      </section>

      {/* ── REFERENCE TABLE ─────────────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · The Lines of a Muster-Roll Wage</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          How each figure is worked out
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr>
                {['Line', 'Basis', 'Ceiling', 'Effect on payable'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 3 ? 'center' : 'left', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Basic earned', 'Daily wage × payable days', '—', 'Base'],
                ['Overtime pay', 'OT hrs × 2× hourly rate', '—', '+ add'],
                ['Gross wages', 'Basic + overtime', '—', 'Subtotal'],
                ['PF (employee)', '12% of basic earned', '₹1,800 cap (₹15,000 wage)', '− deduct'],
                ['ESI (employee)', '0.75% of gross wages', 'nil above ₹21,000 gross', '− deduct'],
                ['Advance recovery', 'Rupee amount entered', '—', '− deduct'],
              ].map((row, i) => (
                <tr key={row[0]} style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', color: BLUEPRINT }}>{row[0]}</td>
                  <td style={{ padding: '10px 14px', color: INK_65 }}>{row[1]}</td>
                  <td style={{ padding: '10px 14px', color: INK_65 }}>{row[2]}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: INK }}>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: INK_35, lineHeight: 1.6, marginTop: 14, maxWidth: 720 }}>
          These are the employee-side deductions carried on the Labour &amp; Statutory Compliance Wage
          Register. The employer also contributes its own PF and ESI share on top — those sit in the full
          contribution registers of the paid toolkit, not in this net-pay calculator.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="Why this is not a monthly-salary PF/ESI calculator">
          <p>
            Most PF and ESI calculators online — the ones built for HR and office payroll — start from a{' '}
            <strong style={{ color: INK }}>fixed monthly CTC</strong>: a set salary, split into basic, HRA and
            allowances, the same every month regardless of how many days fall in it. That model does not
            describe a construction site. A site labourer is on a <strong style={{ color: INK }}>muster
            roll</strong>: paid a daily rate for the days actually attended, which changes every wage period —
            21 days one fortnight, 26 the next, 23.5 when a half-day is marked.
          </p>
          <p>
            So this calculator is built the way site wages are built. You enter a{' '}
            <strong style={{ color: INK }}>daily wage and payable days</strong> — not a monthly salary — and
            the days can be fractional, because attendance on a muster roll genuinely is. Basic earned is
            simply the daily wage times the days worked; everything statutory is layered on that. It is the
            same arithmetic a site supervisor does by hand on the wage sheet, not the CTC-decomposition an
            office payroll tool performs.
          </p>
        </Prose>

        <Prose heading="What the two wage ceilings protect against">
          <p>
            PF and ESI each carry a statutory wage ceiling, and the two ceilings do opposite jobs — which is
            exactly why a daily-wage tool has to handle them separately.
          </p>
          <p>
            <strong style={{ color: INK }}>The ₹15,000 EPF ceiling caps the deduction.</strong> Employee PF is
            12% of basic earned, but only up to a basic of ₹15,000 — so the deduction is capped at{' '}
            <strong style={{ color: INK }}>₹1,800</strong> (12% × ₹15,000). This protects the worker&rsquo;s
            take-home: a good stretch of days at a healthy daily rate can push basic earned well past
            ₹15,000, yet PF never bites more than ₹1,800. Without the cap, a busy month would quietly eat a
            larger and larger slice of the wage. In Test Case&nbsp;1 below, basic earned is ₹20,700 and 12% of
            that would be ₹2,484 — but the cap holds the PF at ₹1,800.
          </p>
          <p>
            <strong style={{ color: INK }}>The ₹21,000 ESI ceiling caps the coverage.</strong> ESI is a
            health-insurance scheme for lower-wage workers; once a worker&rsquo;s gross wages cross{' '}
            <strong style={{ color: INK }}>₹21,000</strong> in the period, they fall outside ESI and no
            employee ESI is deducted at all. This protects against a wrong deduction: deducting ESI from a
            worker who is above the ceiling takes money that should never have been taken. So the tool applies
            0.75% only while gross is at or below ₹21,000, and drops it to zero above — flagging the change so
            it is never silent.
          </p>
        </Prose>

        <Prose heading="Worked example — Test Case 1">
          <p>
            Take a worker on <strong style={{ color: INK }}>₹900 a day</strong> who is marked present for{' '}
            <strong style={{ color: INK }}>23 days</strong>, with no overtime and no advance to recover — the
            values the calculator loads with.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 13.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '16px', lineHeight: 1.9 }}>
            Basic earned&nbsp;&nbsp;&nbsp;= ₹900 × 23 = ₹20,700.00<br />
            Gross wages&nbsp;&nbsp;&nbsp;&nbsp;= ₹20,700.00<br />
            − PF (12%, capped)&nbsp;= ₹1,800.00<br />
            − ESI (0.75%)&nbsp;&nbsp;&nbsp;&nbsp;= ₹155.25<br />
            − Advance&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹0.00<br />
            ─────────────────────<br />
            <strong>Net payable&nbsp;&nbsp;&nbsp;&nbsp;= ₹18,744.75</strong>
          </p>
          <p>
            Basic earned is ₹20,700, which is also the gross since there is no overtime. PF would have been
            ₹2,484 at a flat 12%, but the ₹15,000 ceiling caps it at ₹1,800. Gross is under ₹21,000, so ESI
            applies at 0.75% = ₹155.25. Nothing to recover, so the worker is paid{' '}
            <strong style={{ color: INK }}>₹18,744.75</strong>. Change the daily wage, days, overtime or
            advance above and every line — and the net payable — updates live. (For a second check, a worker
            on ₹650 for 20.5 days nets ₹11,626.06: basic ₹13,325, PF ₹1,599 — below the cap — and ESI ₹99.94.)
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          For estimation and cross-checking reference only. This computes the employee-side deductions
          (12% PF capped at ₹1,800; 0.75% ESI up to the ₹21,000 gross ceiling) and the net payable on one
          muster-roll wage; the employer&rsquo;s own PF and ESI contribution is separate. Exact applicability
          — coverage thresholds, contribution rates, overtime rules and advance recovery terms — depends on
          the establishment, the state and the current statute. Not legal or payroll advice; verify against
          the applicable rules and a qualified professional before disbursing wages.
        </p>
      </article>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────────

function LedgerRow({
  label,
  sub,
  value,
  sign,
  tone,
  subtotal,
  total,
}: {
  label: string
  sub?: string
  value: string
  sign: string
  tone?: 'add' | 'deduct'
  subtotal?: boolean
  total?: boolean
}) {
  const signColor = tone === 'add' ? '#7BAE7B' : tone === 'deduct' ? 'rgba(200,120,90,0.95)' : INK_45
  const emphatic = subtotal || total
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
        borderTop: total ? `1px solid ${GREEN}` : subtotal ? `1px solid rgba(31,78,121,0.4)` : undefined,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: SANS, fontSize: emphatic ? 14.5 : 13.5, fontWeight: emphatic ? 600 : 500, color: emphatic ? INK : INK_65 }}>{label}</span>
        {sub && <span style={{ fontFamily: MONO, fontSize: 10.5, color: INK_35, display: 'block', marginTop: 2 }}>{sub}</span>}
      </div>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: signColor, width: 12, textAlign: 'center' }}>{sign}</span>
        <span style={{ fontFamily: MONO, fontSize: total ? 16 : 14, fontWeight: total ? 700 : 500, color: INK }}>{value}</span>
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

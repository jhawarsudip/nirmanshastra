'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  calculate,
  RA_BILL_DEFAULTS,
  TDS_MIN_PCT,
  TDS_MAX_PCT,
} from './ra-bill-engine'

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

export default function RABillCalculatorPage() {
  // Prefilled with the calculator's defaults + a clean ₹1,00,000 gross so the
  // worked example in the copy matches what loads on screen.
  const [gross, setGross] = useState('100000')
  const [retentionPct, setRetentionPct] = useState(String(RA_BILL_DEFAULTS.retentionPct))
  const [gstPct, setGstPct] = useState(String(RA_BILL_DEFAULTS.gstPct))
  const [tdsPct, setTdsPct] = useState(String(RA_BILL_DEFAULTS.tdsPct))
  const [advance, setAdvance] = useState(String(RA_BILL_DEFAULTS.advanceRecovery))

  const result = useMemo(
    () =>
      calculate({
        grossBillValue: toNum(gross),
        retentionPct: toNum(retentionPct),
        gstPct: toNum(gstPct),
        tdsPct: toNum(tdsPct),
        advanceRecovery: toNum(advance),
      }),
    [gross, retentionPct, gstPct, tdsPct, advance]
  )

  const tdsOutOfRange = toNum(tdsPct) < TDS_MIN_PCT || toNum(tdsPct) > TDS_MAX_PCT

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
          <Eyebrow>Free Calculator · Works Contract Billing · No Login</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,50px)', fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20 }}>
            RA Bill Calculator — Retention, GST &amp; TDS
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: INK_65, lineHeight: 1.7, maxWidth: 720 }}>
            Enter the gross value of a{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Running Account (RA) bill</strong> and get the
            exact net payable to the contractor — retention held back, GST added, TDS deducted, and any
            mobilisation-advance recovery netted off. It runs the same computation as our{' '}
            <strong style={{ color: INK, fontWeight: 600 }}>Billing &amp; Measurement</strong> spreadsheet:
          </p>
          <p style={{ fontFamily: MONO, fontSize: 14.5, color: INK, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '14px 16px', marginTop: 18, lineHeight: 1.6 }}>
            Net Payable = Gross Bill Value − Retention − Advance Recovery + GST − TDS
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 22 }}>
            {['Income-tax Act 2025 · s.393(1)', 'Table Sl. No. 6(i)', 'CGST Act 2017'].map((c) => (
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
              RA Bill Inputs
            </p>

            {/* Gross bill value */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle} htmlFor="ra-gross">Gross RA bill value (₹)</label>
              <input
                id="ra-gross"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                style={fieldStyle}
              />
              <p style={hintStyle}>
                Value of work certified in this running bill, before any deduction or tax.
              </p>
            </div>

            {/* Percentages row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="ra-retention">Retention %</label>
                <input
                  id="ra-retention"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={retentionPct}
                  onChange={(e) => setRetentionPct(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>Default 5%.</p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="ra-gst">GST %</label>
                <input
                  id="ra-gst"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  style={fieldStyle}
                />
                <p style={hintStyle}>Default 18%.</p>
              </div>
              <div>
                <label style={labelStyle} htmlFor="ra-tds">TDS %</label>
                <input
                  id="ra-tds"
                  type="number"
                  inputMode="decimal"
                  min={TDS_MIN_PCT}
                  max={TDS_MAX_PCT}
                  step="any"
                  value={tdsPct}
                  onChange={(e) => setTdsPct(e.target.value)}
                  style={{ ...fieldStyle, borderColor: tdsOutOfRange ? 'rgba(217,154,6,0.6)' : BSUB }}
                />
                <p style={hintStyle}>Default 1% ({TDS_MIN_PCT}–{TDS_MAX_PCT}%).</p>
              </div>
            </div>

            {/* Advance recovery */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle} htmlFor="ra-advance">Mobilisation advance recovery (₹) — optional</label>
              <input
                id="ra-advance"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                style={fieldStyle}
              />
              <p style={hintStyle}>
                A rupee amount, not a percentage. The slice of the mobilisation / material advance being
                recovered against this bill. Leave at ₹0 if none.
              </p>
            </div>

            {tdsOutOfRange && (
              <div style={{ border: `1px solid rgba(217,154,6,0.5)`, background: 'rgba(217,154,6,0.08)', borderRadius: 2, padding: '11px 14px', marginTop: 16 }}>
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_65, lineHeight: 1.6 }}>
                  <span style={{ color: '#D99A06', fontWeight: 600 }}>⚠ </span>
                  TDS on a works-contract payment is normally {TDS_MIN_PCT}–{TDS_MAX_PCT}% under
                  Section 393(1), Table Sl. No. 6(i) of the Income-tax Act 2025. Double-check a rate
                  outside that band.
                </p>
              </div>
            )}
          </div>

          {/* RESULT CARD */}
          <div style={{ background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '28px' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK_35, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Net Payable to Contractor
            </p>

            <div style={{ fontFamily: MONO, fontSize: 'clamp(34px,5.4vw,54px)', fontWeight: 700, color: INK, lineHeight: 1.05, marginBottom: 4, wordBreak: 'break-word' }}>
              {rupee(result.netPayable)}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 13, color: INK_35, marginBottom: 24 }}>
              after retention, GST, TDS &amp; advance recovery
            </p>

            {/* Breakdown ledger — BOQ-style rows */}
            <div style={{ border: `1px solid ${BSUB}`, borderRadius: 2, overflow: 'hidden' }}>
              <LedgerRow label="Gross bill value" value={rupee(result.grossBillValue)} sign="" />
              <LedgerRow label="Retention held back" sub={`${toNum(retentionPct) || 0}% of gross`} value={rupee(result.retention)} sign="−" tone="deduct" />
              <LedgerRow label="Advance recovery" sub="entered amount" value={rupee(result.advanceRecovery)} sign="−" tone="deduct" />
              <LedgerRow label="GST added" sub={`${toNum(gstPct) || 0}% of gross`} value={rupee(result.gst)} sign="+" tone="add" />
              <LedgerRow label="TDS deducted" sub={`${toNum(tdsPct) || 0}% of gross (excl. GST)`} value={rupee(result.tds)} sign="−" tone="deduct" />
              <LedgerRow label="Net payable" value={rupee(result.netPayable)} sign="=" total />
            </div>

            <p style={{ fontFamily: SANS, fontSize: 11.5, color: INK_35, lineHeight: 1.6, marginTop: 18 }}>
              Retention and GST are each a straight percentage of the gross bill value. TDS is also on the
              gross bill value — the amount <strong style={{ color: INK_65 }}>excluding GST</strong> — per
              Section 393(1), Table Sl. No. 6(i) of the Income-tax Act 2025. Advance recovery is the rupee
              figure you entered, not a percentage.
            </p>
          </div>
        </div>

        {/* ── CTA — Billing & Measurement product ───────────────────────────────── */}
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
              Running the whole bill, not one line?
            </p>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: INK_65, lineHeight: 1.6, maxWidth: 620 }}>
              This calculator handles one RA bill&rsquo;s net payable. The{' '}
              <strong style={{ color: INK }}>Billing &amp; Measurement</strong> Excel toolkit does the full
              job — item-wise measurement sheets, abstract of quantities, cumulative RA bills with
              previous-bill carry-forward, retention and advance ledgers, and the GST / TDS working built
              in — the exact source this tool is ported from.
            </p>
          </div>
          <Link
            href="/site-templates/billing-measurement"
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
            See Billing &amp; Measurement →
          </Link>
        </div>
      </section>

      {/* ── REFERENCE TABLE ─────────────────────────────────────────────────────── */}
      <section className="grid-paper px-6 md:px-16 lg:px-24 py-16" style={{ borderTop: `1px solid ${BSUB}` }}>
        <Eyebrow>Reference · The Five Lines of an RA Bill</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, color: INK, marginBottom: 20 }}>
          How each deduction is worked out
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${BSUB}`, borderRadius: 2, background: SURF }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr>
                {['Line', 'Basis', 'Default', 'Effect on payable'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 3 ? 'center' : 'left', fontFamily: MONO, fontSize: 10, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 14px', borderBottom: `1px solid ${BSUB}`, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Gross bill value', 'Work certified this bill', '—', 'Base'],
                ['Retention', '% × gross', '5%', '− deduct'],
                ['Advance recovery', 'Rupee amount entered', '₹0', '− deduct'],
                ['GST', '% × gross', '18%', '+ add'],
                ['TDS', '% × gross (excl. GST)', '1% (1–2%)', '− deduct'],
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
          These are the defaults carried on the Billing &amp; Measurement RA Bill sheet. Every rate is
          editable above — but note the tool does not assume a reduced &ldquo;residential&rdquo; GST rate;
          the default is the standard 18% unless you change it.
        </p>
      </section>

      {/* ── WRITTEN CONTENT ─────────────────────────────────────────────────────── */}
      <article className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 820 }}>

        <Prose heading="What retention actually protects against">
          <p>
            Retention — usually <strong style={{ color: INK }}>5% of every RA bill</strong> — is money the
            client holds back from what the contractor has earned, as security. It is not a penalty and it
            is not the client&rsquo;s to keep: it is a guarantee fund against the{' '}
            <strong style={{ color: INK }}>defect liability period</strong>, the window (commonly 12 months
            after completion) during which the contractor must return and fix anything that fails —
            cracked plaster, a leaking chajja, a sunk floor, honeycombed concrete that shows up under load.
          </p>
          <p>
            If the contractor fixes defects promptly, the retention is released — typically half on
            practical completion and the balance at the end of the defect liability period. If they walk
            away, the client uses the retained money to get the defects rectified by someone else. That is
            the whole logic: retention keeps the contractor financially interested in the building long
            after the last pour. Because it accumulates bill by bill, a running tally of retention held
            versus released is one of the numbers a site engineer is expected to have at their fingertips.
          </p>
        </Prose>

        <Prose heading="Why TDS applies to a works contract">
          <p>
            A construction contract is a <strong style={{ color: INK }}>works contract</strong> — a
            contract for carrying out work (building, fabrication, erection) rather than a plain sale of
            goods. Payments a business makes to a contractor for such work fall under the tax-deduction-at-
            source net: the payer must deduct a small percentage of the payment as{' '}
            <strong style={{ color: INK }}>TDS</strong> and deposit it against the contractor&rsquo;s tax
            account, so the income is captured at the point it is paid rather than left to be declared
            later.
          </p>
          <p>
            Under <strong style={{ color: INK }}>Section 393(1) of the Income-tax Act 2025, Table Sl. No.
            6(i)</strong> — the row for payments to contractors for carrying out work — the rate on a works
            payment sits at <strong style={{ color: INK }}>1–2%</strong>, which is why this tool defaults
            to 1% and bounds the field to that band. Two details matter on site. First, the TDS is computed
            on the <strong style={{ color: INK }}>value of the work — the gross bill excluding GST</strong>,
            not on the GST-inclusive figure. Second, TDS is a deduction <em>from</em> the contractor&rsquo;s
            payment, whereas GST is an <em>addition</em> the contractor collects and passes to the
            exchequer — they pull the net payable in opposite directions, which is exactly why both appear
            on the same bill.
          </p>
        </Prose>

        <Prose heading="Common mistakes that corrupt the net payable">
          <ul>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Assuming a lower &ldquo;residential&rdquo; GST.</span>{' '}
              People often carry over a reduced-rate assumption from a specific composite or affordable-
              housing scheme and apply it to an ordinary works bill. Unless a specific concessional rate
              genuinely applies to the contract, the works-contract GST is the standard rate — this tool
              defaults to 18% and never implies a hidden residential discount.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Computing TDS on the GST-inclusive amount.</span>{' '}
              TDS belongs on the value of the work, i.e. the gross bill <em>excluding</em> GST. Deducting
              it on gross-plus-GST over-deducts and understates the contractor&rsquo;s payment.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Forgetting the advance recovery — or mis-prorating it.</span>{' '}
              A mobilisation or material advance paid up front is recovered in slices across the RA bills,
              usually pro-rata to work done. Skip the recovery on a bill and you overpay; recover the whole
              advance in one bill instead of prorating it and you starve the contractor&rsquo;s cash flow.
              It is a rupee figure, entered per bill — not a percentage — which is why this calculator takes
              it as an amount.
            </li>
            <li>
              <span style={{ fontFamily: MONO, color: INK }}>Netting retention against the wrong base.</span>{' '}
              Retention is a percentage of the gross bill value, taken before GST — not of the payable
              after tax. Applying it to the wrong figure quietly changes what is held back.
            </li>
          </ul>
        </Prose>

        <Prose heading="Worked example — using the defaults">
          <p>
            Take a clean <strong style={{ color: INK }}>₹1,00,000 gross RA bill</strong> at the calculator&rsquo;s
            defaults: retention 5%, GST 18%, TDS 1%, and no advance being recovered this bill.
          </p>
          <p style={{ fontFamily: MONO, color: INK, fontSize: 13.5, background: SURF, border: `1px solid ${BSUB}`, borderRadius: 2, padding: '16px', lineHeight: 1.9 }}>
            Gross bill value&nbsp;&nbsp;&nbsp;&nbsp;= ₹1,00,000.00<br />
            − Retention (5%)&nbsp;&nbsp;&nbsp;= ₹5,000.00<br />
            − Advance recovery&nbsp;= ₹0.00<br />
            + GST (18%)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹18,000.00<br />
            − TDS (1%)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹1,000.00<br />
            ─────────────────────<br />
            <strong>Net payable&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ₹1,12,000.00</strong>
          </p>
          <p>
            So on ₹1,00,000 of certified work, ₹5,000 is held as retention against the defect liability
            period, ₹18,000 of GST is added on, ₹1,000 of TDS is deducted against the contractor&rsquo;s
            tax, and — with no advance to recover — the contractor is paid{' '}
            <strong style={{ color: INK }}>₹1,12,000</strong>. Change any rate above and every line, and the
            net payable, updates live.
          </p>
        </Prose>

        {/* Disclaimer note */}
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: INK_35, lineHeight: 1.7, marginTop: 8, borderTop: `1px solid ${BSUB}`, paddingTop: 18 }}>
          For estimation and cross-checking reference only. Retention terms, GST rate applicability, and the
          exact TDS rate for a given contract depend on the contract, the parties&rsquo; registration status
          and the current statute — the defaults here (5% retention, 18% GST, 1% TDS under Section 393(1),
          Table Sl. No. 6(i) of the Income-tax Act 2025) are the common works-contract case, all editable
          above. Not tax or legal advice; verify against the contract and a qualified professional before
          releasing payment.
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
  total,
}: {
  label: string
  sub?: string
  value: string
  sign: string
  tone?: 'add' | 'deduct'
  total?: boolean
}) {
  const signColor = tone === 'add' ? '#7BAE7B' : tone === 'deduct' ? 'rgba(200,120,90,0.95)' : INK_45
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderBottom: total ? 'none' : `1px solid ${BSUB}`,
        background: total ? 'rgba(20,83,45,0.14)' : 'transparent',
        borderTop: total ? `1px solid ${GREEN}` : undefined,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span style={{ fontFamily: SANS, fontSize: total ? 14.5 : 13.5, fontWeight: total ? 600 : 500, color: total ? INK : INK_65 }}>{label}</span>
        {sub && <span style={{ fontFamily: MONO, fontSize: 10.5, color: INK_35, display: 'block', marginTop: 2 }}>{sub}</span>}
      </div>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: signColor, width: 12, textAlign: 'center' }}>{sign}</span>
        <span style={{ fontFamily: MONO, fontSize: total ? 16 : 14, fontWeight: total ? 700 : 500, color: total ? INK : INK }}>{value}</span>
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

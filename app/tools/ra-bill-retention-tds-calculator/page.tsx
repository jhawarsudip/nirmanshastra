'use client'

import { useMemo, useState } from 'react'
import { ToolHead, Field, Input, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import { RA_BILL_DEFAULTS, TDS_INDIVIDUAL_PCT, TDS_OTHER_PCT, calculate } from './ra-bill-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { RABILL_CONTENT } from '@/lib/seo/calc-content'

const rupee = (n: number) =>
  (n < -0.005 ? '−' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (n: number) => `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`
const toNum = (s: string) => {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

export default function RABillCalculatorPage() {
  const [gross, setGross] = useState('1000000')
  const [retentionPct, setRetentionPct] = useState(String(RA_BILL_DEFAULTS.retentionPct))
  const [gstPct, setGstPct] = useState(String(RA_BILL_DEFAULTS.gstPct))
  const [tdsPct, setTdsPct] = useState(String(RA_BILL_DEFAULTS.tdsPct))
  const [advance, setAdvance] = useState(String(RA_BILL_DEFAULTS.advanceRecovery))

  const g = toNum(gross)
  const rp = toNum(retentionPct)
  const gp = toNum(gstPct)
  const tp = toNum(tdsPct)
  const r = useMemo(
    () => calculate({ grossBillValue: g, retentionPct: rp, gstPct: gp, tdsPct: tp, advanceRecovery: toNum(advance) }),
    [g, rp, gp, tp, advance],
  )
  const ready = g > 0
  const tdsUnusual = tp !== TDS_INDIVIDUAL_PCT && tp !== TDS_OTHER_PCT

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="RA Bill Calculator: retention, GST and TDS"
        blurb="Enter the gross value of a running account bill and see what the contractor is paid: the retention held back, the GST added, the TDS deducted, and any advance taken back."
      />
      <QuickAnswer content={RABILL_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The bill</CalcLabel>
            <div className="ns-i-fields">
              <Field id="ra-gross" label="Gross RA bill value, in ₹" wide hint="The value of work certified in this bill, before any deduction or tax.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={gross} onChange={(e) => setGross(e.target.value)} />
              </Field>
              <Field id="ra-retention" label="Retention, %" hint="Held back against defects. The contract fixes it.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={retentionPct} onChange={(e) => setRetentionPct(e.target.value)} />
              </Field>
              <Field id="ra-gst" label="GST, %" hint="18% is the general rate for a works contract.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={gstPct} onChange={(e) => setGstPct(e.target.value)} />
              </Field>
              <Field id="ra-tds" label="TDS, %" hint={`${TDS_INDIVIDUAL_PCT}% if the contractor is an individual or HUF, ${TDS_OTHER_PCT}% for a company or firm.`}>
                <Input type="number" inputMode="decimal" min={0} step="any" value={tdsPct} onChange={(e) => setTdsPct(e.target.value)} />
              </Field>
              <Field id="ra-advance" label="Advance to recover, in ₹ (optional)" hint="A rupee amount for this bill, not a percentage.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
            </div>
            {tdsUnusual ? (
              <Note kind="warn" title="Check the TDS rate">
                A payment to a contractor carries {TDS_INDIVIDUAL_PCT}% TDS for an individual or HUF and {TDS_OTHER_PCT}% for others, or 20% if the contractor gives no PAN. Any other rate needs a reason.
              </Note>
            ) : null}
          </>
        }
        result={
          ready ? (
            <>
              <Big k="Net payable to the contractor" v={rupee(r.netPayable)} sub="after retention, GST, TDS and the advance" />
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Gross bill value', detail: '', value: rupee(r.grossBillValue) },
                  { label: 'Retention held back', detail: `${pct(rp)} of gross`, value: '− ' + rupee(r.retention) },
                  { label: 'Advance recovery', detail: 'as entered', value: '− ' + rupee(r.advanceRecovery), tone: r.advanceRecovery > 0 ? undefined : 'dim' },
                  { label: 'GST added', detail: `${pct(gp)} of gross`, value: '+ ' + rupee(r.gst) },
                  { label: 'TDS deducted', detail: `${pct(tp)} of gross, without GST`, value: '− ' + rupee(r.tds) },
                  { label: 'Net payable', detail: 'gross − retention − advance + GST − TDS', value: rupee(r.netPayable), tone: 'ok' },
                ]}
              />
              {r.netPayable < 0 ? (
                <Note kind="warn" title="The deductions are more than the bill">
                  The retention, advance and TDS come to more than the bill and its GST. Check the advance amount.
                </Note>
              ) : null}
              <p className="ns-calc-help">
                Retention and GST are each a percentage of the gross bill value. <strong>TDS is on the value without GST</strong>, so the GST you add is never taxed again. The advance is the rupee amount you typed.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the gross value of the bill to see the net payable.</p>
          )
        }
      />

      <CalcCta
        kicker="Running the whole bill, not one line?"
        text="This page works out the net payable on one bill. The Billing and Measurement Excel toolkit is the full set: the measurement sheets, the abstract of quantities, running bills that carry the previous bill forward, and the retention and advance ledgers."
        href="/site-templates/billing-measurement"
        label="See the toolkit"
      />

      <CalcSection title="How each line is worked out" sub="The five lines of an RA bill, the rule behind each, and the figure the calculator starts at.">
        <ReportTable
          head={['Line', 'Basis', 'Starts at', 'Effect']}
          num={[]}
          rows={[
            ['Gross bill value', 'Work certified in this bill', '—', 'The base'],
            ['Retention', '% × gross', pct(RA_BILL_DEFAULTS.retentionPct), 'Takes off'],
            ['Advance recovery', 'The rupee amount entered', '₹0', 'Takes off'],
            ['GST', '% × gross', pct(RA_BILL_DEFAULTS.gstPct), 'Adds'],
            ['TDS', '% × gross, without GST', `${pct(RA_BILL_DEFAULTS.tdsPct)} (2% for a company or firm)`, 'Takes off'],
          ]}
        />
        <p className="ns-r-tblnote">
          Every rate can be edited. The calculator does not assume a reduced “residential” GST rate: 18% is the general rate for a works contract.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="What retention is for">
          <p>
            Retention is money the client holds back from each bill as security. It is not a penalty and it is not the client’s to keep. It guards against defects: if something fails after the contractor has been paid, such as a leaking chajja, a cracked floor or honeycombed concrete that shows up under load, the retained money pays for the repair. The contract fixes the percentage, how long it is held and when it is released.
          </p>
          <p>
            Because it builds up bill by bill, a site engineer is expected to know the retention held so far against what has been released.
          </p>
        </Prose>

        <Prose title="How TDS works on a contractor’s bill">
          <p>
            A construction contract is a works contract. The one who pays a contractor deducts a small percentage as tax at source, and deposits it against the contractor’s tax account. Under section 393(1) of the Income-tax Act 2025, which applies from 1 April 2026 and replaces section 194C of the 1961 Act, the rate is <strong>1%</strong> when the contractor is an individual or HUF and <strong>2%</strong> for anyone else. It is 20% if the contractor gives no PAN.
          </p>
          <p>
            No TDS is taken on a single payment of ₹30,000 or less, unless the payments to that contractor in the year pass ₹1,00,000. This calculator does not test those limits; it deducts the percentage you enter.
          </p>
          <p>
            Two details matter on site. The TDS is on the value of the work <strong>without GST</strong>, when the GST is shown separately on the bill. And TDS comes <em>off</em> the contractor’s payment while GST goes <em>on</em>, so the two pull the net payable in opposite directions.
          </p>
        </Prose>

        <Prose title="Mistakes that spoil the net payable">
          <ul>
            <li>
              <strong>Assuming a lower residential GST.</strong> Some residential projects sold by developers are taxed differently. An ordinary works-contract bill is at 18% unless the contract says otherwise.
            </li>
            <li>
              <strong>Working TDS on the GST-inclusive amount.</strong> That deducts too much and shorts the contractor.
            </li>
            <li>
              <strong>Forgetting the advance, or taking it all at once.</strong> An advance paid up front is taken back in parts across the bills, as the contract says. Skip it on one bill and you overpay; take it all in one and you strain the contractor’s cash.
            </li>
            <li>
              <strong>Working retention on the wrong figure.</strong> Here retention is a percentage of the gross bill value, before GST, not of the amount payable after tax.
            </li>
          </ul>
        </Prose>

        <Prose title="A worked bill">
          <p>
            A gross bill of ₹10,00,000 at the starting rates: retention 5%, GST 18%, TDS 1%, and no advance to recover.
          </p>
          <Formula>
            Gross bill value = ₹10,00,000.00{'\n'}
            − Retention (5%) = ₹50,000.00{'\n'}
            − Advance recovery = ₹0.00{'\n'}
            + GST (18%) = ₹1,80,000.00{'\n'}
            − TDS (1%) = ₹10,000.00{'\n'}
            Net payable = ₹11,20,000.00
          </Formula>
          <p>
            Change any rate above and every line, with the net payable, updates as you type.
          </p>
        </Prose>

        <Prose title="What this page does not work out">
          <p>
            It does not test the TDS thresholds, work out the contractor’s own tax, or take any other deduction a contract may carry, such as a cess, a penalty or a recovery for material supplied. It does not check the GST rate that fits a particular contract, and it takes retention on the gross value before GST. The contract and the invoice decide each of these.
          </p>
        </Prose>
      </article>

      <CalcFaq items={RABILL_CONTENT.faq} />
      <RelatedLinks path="/tools/ra-bill-retention-tds-calculator" />

      <Chips codes={['Income-tax Act 2025 s.393(1)', 'CGST Act 2017']} />
      <CalcFine>
        For checking a bill. The rates are those in guides to the Income-tax Act 2025 and the GST rate notifications, and may have changed; confirm them before releasing a payment. Retention, the advance and the GST rate that applies depend on the contract, the parties’ registration and the current law. Not tax or legal advice.
      </CalcFine>
    </CalcPage>
  )
}

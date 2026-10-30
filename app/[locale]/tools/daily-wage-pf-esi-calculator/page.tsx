'use client'

import { useMemo, useState } from 'react'
import { ToolHead, Field, Input, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  calculate,
  ESI_DAILY_EXEMPT,
  ESI_WAGE_CEILING,
  OVERTIME_MULTIPLIER,
  PF_EMPLOYEE_CAP,
  PF_WAGE_CEILING,
  STANDARD_HOURS_PER_DAY,
} from './wage-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { WAGE_CONTENT } from '@/lib/seo/calc-content'

const rupee = (n: number) =>
  (n < -0.005 ? '−' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
const plain = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
const toNum = (s: string) => {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}

export default function DailyWagePfEsiCalculatorPage() {
  const [dailyWage, setDailyWage] = useState('900')
  const [payableDays, setPayableDays] = useState('23')
  const [overtimeHours, setOvertimeHours] = useState('0')
  const [advance, setAdvance] = useState('0')

  const dw = toNum(dailyWage)
  const days = toNum(payableDays)
  const ot = toNum(overtimeHours)
  const r = useMemo(
    () => calculate({ dailyWage: dw, payableDays: days, overtimeHours: ot, advance: toNum(advance) }),
    [dw, days, ot, advance],
  )
  const ready = dw > 0 && days > 0

  const esiDetail =
    r.esiStatus === 'applies'
      ? '0.75% of gross wages'
      : r.esiStatus === 'above-ceiling'
        ? `basic is over ${whole(ESI_WAGE_CEILING)}, not covered`
        : `average day ${rupee(r.averageDailyWage)}, ${whole(ESI_DAILY_EXEMPT)} or less`

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Daily-Wage PF and ESI Calculator"
        blurb="Work out one worker’s net wage the way a site pays it: a daily rate across the days worked, not a monthly salary. Enter the rate and the days (23.5 is fine), add overtime or an advance if there is one, and see the PF, the ESI and what the worker takes home."
      />
      <QuickAnswer content={WAGE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The muster roll</CalcLabel>
            <div className="ns-i-fields">
              <Field id="dw-wage" label="Daily wage, in ₹" hint="The rate agreed for one full day.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} />
              </Field>
              <Field id="dw-days" label="Payable days" hint="Days worked in the period. A part day is fine: 23.5.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={payableDays} onChange={(e) => setPayableDays(e.target.value)} />
              </Field>
              <Field id="dw-ot" label="Overtime hours (optional)" hint={`Paid at twice the hourly rate, which is the daily wage over ${STANDARD_HOURS_PER_DAY} hours.`}>
                <Input type="number" inputMode="decimal" min={0} step="any" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
              </Field>
              <Field id="dw-adv" label="Advance to recover, in ₹ (optional)" hint="An advance already paid, taken back from this wage.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
            </div>
          </>
        }
        result={
          ready ? (
            <>
              <Big k="Net payable to the worker" v={rupee(r.netPayable)} sub="after PF, ESI and the advance" />
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Basic earned', detail: `${plain(dw)} × ${plain(days)} days`, value: rupee(r.basicEarned) },
                  ...(ot > 0
                    ? [{ label: 'Overtime', detail: `${plain(ot)} h × ${OVERTIME_MULTIPLIER} × hourly rate`, value: '+ ' + rupee(r.overtimePay) }]
                    : []),
                  { label: 'Gross wages', detail: '', value: rupee(r.grossWages) },
                  {
                    label: 'PF, worker’s share',
                    detail: r.pfCapped ? `12% of basic, held at ${whole(PF_EMPLOYEE_CAP)}` : '12% of basic earned',
                    value: '− ' + rupee(r.pf),
                  },
                  { label: 'ESI, worker’s share', detail: esiDetail, value: '− ' + rupee(r.esi), tone: r.esiStatus === 'applies' ? undefined : 'dim' },
                  { label: 'Advance', detail: 'as entered', value: '− ' + rupee(r.advance), tone: r.advance > 0 ? undefined : 'dim' },
                  { label: 'Net payable', detail: 'gross − PF − ESI − advance', value: rupee(r.netPayable), tone: 'ok' },
                ]}
              />
              {r.netPayable < 0 ? (
                <Note kind="warn" title="The advance is more than this wage">
                  The deductions come to more than the wages earned. Recover the advance over more than one period.
                </Note>
              ) : null}
              {r.esiStatus === 'above-ceiling' ? (
                <Note kind="info" title="No ESI taken on this wage">
                  Basic earned is over {whole(ESI_WAGE_CEILING)}. A worker who was covered at the start of the contribution period (1 April or 1 October) stays covered until it ends, on the actual wages, so check the start of the period before leaving ESI out.
                </Note>
              ) : null}
              {r.esiStatus === 'daily-exempt' ? (
                <Note kind="info" title="The worker’s ESI share is not taken">
                  An average day of {whole(ESI_DAILY_EXEMPT)} or less is exempt from the worker’s share of ESI. The employer still pays its own share.
                </Note>
              ) : null}
              <p className="ns-calc-help">
                <strong>PF</strong> is 12% of basic earned, held at {whole(PF_EMPLOYEE_CAP)}, which is 12% of the {whole(PF_WAGE_CEILING)} wage ceiling. <strong>ESI</strong> is 0.75% of all wages, overtime included, once the worker is covered. Overtime counts towards the ESI base but not the PF base.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter a daily wage and the days worked to see the net wage.</p>
          )
        }
      />

      <CalcCta
        kicker="Running the whole gang, not one worker?"
        text="This page works out one worker’s net wage. The Labour and Statutory Compliance Excel toolkit is the full register: the muster roll for the whole gang, the PF and ESI registers with the employer’s share, wage slips and the advance ledgers."
        href="/site-templates/labour-compliance"
        label="See the toolkit"
      />

      <CalcSection title="How each figure is worked out" sub="One line of a muster-roll wage, the rule behind it, and what it does to the pay.">
        <ReportTable
          head={['Line', 'Basis', 'Limit', 'Effect']}
          num={[]}
          rows={[
            ['Basic earned', 'Daily wage × payable days', 'None', 'The base'],
            ['Overtime', `Hours × ${OVERTIME_MULTIPLIER} × (daily wage ÷ ${STANDARD_HOURS_PER_DAY})`, 'None', 'Adds'],
            ['Gross wages', 'Basic + overtime', 'None', 'Subtotal'],
            ['PF, worker’s share', '12% of basic earned', `${whole(PF_EMPLOYEE_CAP)} (12% of ${whole(PF_WAGE_CEILING)})`, 'Takes off'],
            ['ESI, worker’s share', '0.75% of gross wages', `Covered if basic is ${whole(ESI_WAGE_CEILING)} or less; none if the average day is ${whole(ESI_DAILY_EXEMPT)} or less`, 'Takes off'],
            ['Advance', 'The amount entered', 'None', 'Takes off'],
          ]}
        />
        <p className="ns-r-tblnote">
          These are the worker’s own deductions. The employer pays its own PF and ESI share on top, and that is not part of the net wage.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="Why this is not a monthly-salary calculator">
          <p>
            Most PF and ESI calculators start from a fixed monthly salary, split into basic, HRA and allowances, the same every month. A site does not pay that way. A labourer is on a <strong>muster roll</strong>: a daily rate for the days attended, which changes every period, 21 days one fortnight, 26 the next, 23.5 when a half day is marked.
          </p>
          <p>
            So here basic earned is the daily wage times the days worked, and everything else is worked from that. It is the arithmetic a supervisor does by hand on the wage sheet.
          </p>
        </Prose>

        <Prose title="The two ceilings do different jobs">
          <p>
            <strong>The {whole(PF_WAGE_CEILING)} ceiling caps the PF.</strong> Employee PF is 12% of basic earned, but only on wages up to {whole(PF_WAGE_CEILING)}, so the deduction stops at {whole(PF_EMPLOYEE_CAP)}. A good stretch of days can lift basic far above the ceiling, and the PF still never takes more than that. Contributions on higher wages are by agreement, not compulsory. The EPF Scheme 2026, notified in June 2026 under the Code on Social Security 2020, leaves the ceiling where it was.
          </p>
          <p>
            <strong>The {whole(ESI_WAGE_CEILING)} ceiling decides who is covered.</strong> ESI is the health insurance for lower-paid workers. A worker is covered when wages <em>without overtime</em> are {whole(ESI_WAGE_CEILING)} a month or less, and once covered the 0.75% is taken on all wages, overtime included. That is why overtime can push the ESI base past {whole(ESI_WAGE_CEILING)} without ending cover.
          </p>
          <p>
            Two details sit on top. A worker whose average day is {whole(ESI_DAILY_EXEMPT)} or less does not pay the worker’s share (the employer still does). And cover is fixed for each six-month period, April to September and October to March, so a worker who crosses {whole(ESI_WAGE_CEILING)} part-way through a period stays covered until it ends. This page tests the wages you type in, one period at a time, so it cannot know how the period began.
          </p>
        </Prose>

        <Prose title="A worked wage">
          <p>
            A worker on {whole(900)} a day, marked present 23 days, with no overtime and no advance:
          </p>
          <Formula>
            Basic earned = 900 × 23 = ₹20,700.00{'\n'}
            PF = 12% of 20,700 = 2,484, held at ₹1,800.00{'\n'}
            ESI = 0.75% of 20,700 = ₹155.25 (basic is under ₹21,000, so covered){'\n'}
            Net payable = 20,700 − 1,800 − 155.25 = ₹18,744.75
          </Formula>
          <p>
            Now add overtime. At {whole(800)} a day for 26 days the basic is ₹20,800, so the worker is covered. Eight hours of overtime at twice {whole(100)} an hour adds ₹1,600, so gross is ₹22,400. PF stays at ₹1,800 because overtime is not in the PF base, and ESI is 0.75% of ₹22,400, which is ₹168.00. Net payable is ₹20,432.00.
          </p>
        </Prose>

        <Prose title="What this page does not work out">
          <p>
            It does not work out the employer’s share of PF and ESI, the minimum wage for your state and trade, bonus, or gratuity. PF and ESI apply to a worker only when the employer’s establishment is covered, which depends on how many people it employs and on the state; the page assumes both apply. Overtime is taken as twice the rate over an {STANDARD_HOURS_PER_DAY}-hour day, and a contract or a state rule may set a different normal day.
          </p>
        </Prose>
      </article>

      <CalcFaq items={WAGE_CONTENT.faq} />
      <RelatedLinks path="/tools/daily-wage-pf-esi-calculator" />

      <Chips codes={['Code on Social Security 2020 (EPF Scheme 2026)', 'ESI wage ceiling ₹21,000', 'Code on Wages 2019 s.14']} />
      <CalcFine>
        For checking a wage sheet. It works out the worker’s own deductions on one muster-roll wage, from ceilings and rates published in payroll guides that may have changed since; confirm them with EPFO and ESIC before paying wages. Whether PF and ESI apply, the overtime terms and the advance recovery depend on the establishment, the state and the current law. Not legal or payroll advice.
      </CalcFine>
    </CalcPage>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { ToolHead, Field, Input, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import { calculate, readQuadrant } from './evm-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { EVM_CONTENT } from '@/lib/seo/calc-content'

const rupee = (n: number) =>
  (n < -0.005 ? '−' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const rupeeOrDash = (n: number | null) => (n === null ? '—' : rupee(n))
const index4 = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 }))
const toNum = (s: string) => {
  const v = parseFloat(s)
  return Number.isFinite(v) ? v : 0
}
const QUAD_NOTE = { good: 'ok', warn: 'warn', bad: 'err', neutral: 'info' } as const

export default function EarnedValueCalculatorPage() {
  const [bac, setBac] = useState('1000000')
  const [pv, setPv] = useState('400000')
  const [ev, setEv] = useState('350000')
  const [ac, setAc] = useState('420000')

  const r = useMemo(() => calculate({ bac: toNum(bac), pv: toNum(pv), ev: toNum(ev), ac: toNum(ac) }), [bac, pv, ev, ac])
  const quad = useMemo(() => readQuadrant(r.spi, r.cpi), [r.spi, r.cpi])
  const ready = r.bac > 0

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Earned Value Calculator: SPI, CPI, EAC and TCPI"
        blurb="Enter four figures a project already tracks, the budget, the planned value, the earned value and the actual cost to date, and see whether it is behind schedule or over cost, and what it is forecast to cost in the end."
      />
      <QuickAnswer content={EVM_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The four figures, in ₹</CalcLabel>
            <div className="ns-i-fields">
              <Field id="evm-bac" label="Budget at completion (BAC)" wide hint="The total approved budget for the whole scope of work.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={bac} onChange={(e) => setBac(e.target.value)} />
              </Field>
              <Field id="evm-pv" label="Planned value to date (PV)" hint="The budgeted cost of the work that should be done by now, from the baseline.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={pv} onChange={(e) => setPv(e.target.value)} />
              </Field>
              <Field id="evm-ev" label="Earned value to date (EV)" hint="The budgeted cost of the work actually done: % complete × budget, added up over the activities.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={ev} onChange={(e) => setEv(e.target.value)} />
              </Field>
              <Field id="evm-ac" label="Actual cost to date (AC)" wide hint="The money really spent on the work done so far.">
                <Input type="number" inputMode="decimal" min={0} step="any" value={ac} onChange={(e) => setAc(e.target.value)} />
              </Field>
            </div>
            <Note kind="info" title="EV is only as honest as the percentage complete behind it">
              Earned value counts value executed, not activities ticked. Weight each activity by its cost and judge the percentage on work in place, not on effort spent.
            </Note>
          </>
        }
        result={
          ready ? (
            <>
              <Big k="Forecast cost at completion (EAC)" v={rupeeOrDash(r.eac)} sub="if the work goes on at today’s cost efficiency: BAC ÷ CPI" />
              <Figures
                items={[
                  { k: 'Schedule index (SPI)', v: index4(r.spi), tone: r.spi === null ? undefined : r.spi < 1 ? 'warn' : 'ok' },
                  { k: 'Cost index (CPI)', v: index4(r.cpi), tone: r.cpi === null ? undefined : r.cpi < 1 ? 'warn' : 'ok' },
                ]}
              />
              <Note kind={QUAD_NOTE[quad.tone]} title={quad.title}>
                {quad.reading}
              </Note>
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Schedule variance', detail: 'SV = EV − PV', value: rupee(r.sv) },
                  { label: 'Cost variance', detail: 'CV = EV − AC', value: rupee(r.cv) },
                  { label: 'Estimate to complete', detail: 'ETC = EAC − AC', value: rupeeOrDash(r.etc) },
                  { label: 'Variance at completion', detail: 'VAC = BAC − EAC', value: rupeeOrDash(r.vac) },
                  { label: 'To-complete index', detail: 'TCPI = (BAC − EV) ÷ (BAC − AC)', value: index4(r.tcpi) },
                ]}
              />
              <p className="ns-calc-help">
                A negative variance is behind schedule or over cost. VAC is the forecast overrun (negative) or saving (positive) against the budget. TCPI above 1.00 means the rest of the work must be run tighter than it has been so far to finish inside the budget.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the budget at completion to see the forecast.</p>
          )
        }
      />

      <CalcCta
        kicker="Tracking a whole programme, not one cut-off?"
        text="This page reads one snapshot. The Planning, Progress and Delay Control Excel toolkit tracks a value-weighted baseline and S-curve, period-by-period progress, the earned value figures over time, and a delay register."
        href="/site-templates/planning-progress"
        label="See the toolkit"
      />

      <CalcSection title="What the two indices say together" sub="Read the schedule index and the cost index as a pair. Exactly 1.00 counts as on target.">
        <ReportTable
          head={['SPI', 'CPI', 'Reading', 'Where the risk is']}
          labelRow
          num={[]}
          rows={[
            ['1 or more', '1 or more', 'On or ahead of schedule, and on budget', 'Hold the line'],
            ['1 or more', 'Under 1', 'On time but over cost', 'The cost run, not the calendar'],
            ['Under 1', '1 or more', 'Behind schedule but under cost', 'The schedule, and any delay damages'],
            ['Under 1', 'Under 1', 'Behind schedule and over cost', 'Recover now'],
          ]}
        />
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="Earned value measures value executed, not activities ticked">
          <p>
            Ask a site how it is doing and you hear “about 60% done”. Sixty percent of what: activities, floor area, or money? A progress figure that is not weighted by value is a feeling, not a measurement. Earned value fixes that by weighting each activity by its cost, so finishing the foundations counts for what it is worth, and the gap between planned and earned can be read in rupees.
          </p>
          <p>
            The method is only as honest as the percentage complete that drives it. EV is “% complete × budget” added up across the activities, so an optimistic 80% that is really 60% inflates EV, flatters both indices and hides the very slip the method exists to catch.
          </p>
        </Prose>

        <Prose title="What SPI and CPI mean">
          <p>
            <strong>SPI is EV ÷ PV.</strong> Of the value that should have been earned by now, how much was? An SPI of 0.875 means 87.5 paise earned for every rupee planned by this date: the project runs at 87.5% of the planned pace. It is measured in value and not on the critical path, so it is a health check, not a replacement for the programme.
          </p>
          <p>
            <strong>CPI is EV ÷ AC.</strong> For every rupee spent, how much value was got? A CPI of 0.833 means each rupee bought 83 paise of budgeted work, so the job is over cost. On most projects the cost efficiency shown so far is a fair guide to what follows, which is why the forecast <strong>EAC = BAC ÷ CPI</strong> carries it forward.
          </p>
        </Prose>

        <Prose title="A worked example">
          <p>
            The calculator opens on a budget of ₹10,00,000, with ₹4,00,000 planned, ₹3,50,000 earned and ₹4,20,000 spent.
          </p>
          <Formula>
            SV = 3,50,000 − 4,00,000 = −₹50,000{'\n'}
            CV = 3,50,000 − 4,20,000 = −₹70,000{'\n'}
            SPI = 3,50,000 ÷ 4,00,000 = 0.8750{'\n'}
            CPI = 3,50,000 ÷ 4,20,000 = 0.8333{'\n'}
            EAC = 10,00,000 ÷ 0.8333 = ₹12,00,000{'\n'}
            ETC = 12,00,000 − 4,20,000 = ₹7,80,000{'\n'}
            VAC = 10,00,000 − 12,00,000 = −₹2,00,000{'\n'}
            TCPI = (10,00,000 − 3,50,000) ÷ (10,00,000 − 4,20,000) = 1.1207
          </Formula>
          <p>
            Both indices are under 1, so the project is behind schedule and over cost. It is forecast to finish ₹2,00,000 over budget, and to finish on budget the rest of the work would have to run at 112% of the cost efficiency it has managed so far, which is a stiff ask.
          </p>
        </Prose>

        <Prose title="Reading the forecast">
          <ul>
            <li><strong>EAC, estimate at completion.</strong> BAC ÷ CPI: the final cost if the work goes on at today’s cost efficiency. It assumes the trend holds.</li>
            <li><strong>ETC, estimate to complete.</strong> EAC − AC: the money still to be spent from now to the finish, for the cash-flow forecast.</li>
            <li><strong>VAC, variance at completion.</strong> BAC − EAC: the forecast overrun (negative) or saving (positive) against the budget, the number the client cares about.</li>
            <li><strong>TCPI, to-complete index.</strong> (BAC − EV) ÷ (BAC − AC): the cost efficiency the remaining work must average to finish inside BAC. If it is far above the CPI achieved so far, finishing on budget is no longer realistic.</li>
          </ul>
        </Prose>
      </article>

      <CalcFaq items={EVM_CONTENT.faq} />
      <RelatedLinks path="/tools/earned-value-calculator" />

      <Chips codes={['Earned value management', 'Schedule and cost indices', 'Forecast at completion']} />
      <CalcFine>
        For checking a project’s health. Earned value is only as reliable as the baseline and the percentage-complete figures behind PV and EV. The forecast here is the CPI method (BAC ÷ CPI); other methods suit a project whose cost trend is not expected to continue. Use it with the programme and a planning engineer’s judgement, not in place of them.
      </CalcFine>
    </CalcPage>
  )
}

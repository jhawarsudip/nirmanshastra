'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { EVM_DICT } from '@/lib/i18n/labels/calc-evm'
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
  const { hi, L } = useL()
  const t = useTr(EVM_DICT)
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
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Earned Value Calculator: SPI, CPI, EAC and TCPI', 'अर्नड वैल्यू कैलकुलेटर: SPI, CPI, EAC और TCPI')}
        blurb={L(
          'Enter four figures a project already tracks, the budget, the planned value, the earned value and the actual cost to date, and see whether it is behind schedule or over cost, and what it is forecast to cost in the end.',
          'चार आँकड़े डालिए जो प्रोजेक्ट पहले से ट्रैक करता है, यानी बजट, प्लान्ड वैल्यू, अर्नड वैल्यू और अब तक की असल लागत, और देखिए कि वह शेड्यूल से पीछे है या लागत से ऊपर, और अंत में उसकी लागत कितनी रहने का अनुमान है।',
        )}
      />
      <QuickAnswer content={EVM_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The four figures, in ₹', 'चार आँकड़े, ₹ में')}</CalcLabel>
            <div className="ns-i-fields">
              <Field
                id="evm-bac"
                label={L('Budget at completion (BAC)', 'पूरा होने पर बजट (BAC)')}
                wide
                hint={L('The total approved budget for the whole scope of work.', 'पूरे काम के लिए मंज़ूर कुल बजट।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={bac} onChange={(e) => setBac(e.target.value)} />
              </Field>
              <Field
                id="evm-pv"
                label={L('Planned value to date (PV)', 'अब तक की प्लान्ड वैल्यू (PV)')}
                hint={L(
                  'The budgeted cost of the work that should be done by now, from the baseline.',
                  'बेसलाइन के हिसाब से अब तक जितना काम हो जाना चाहिए, उसकी बजट लागत।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={pv} onChange={(e) => setPv(e.target.value)} />
              </Field>
              <Field
                id="evm-ev"
                label={L('Earned value to date (EV)', 'अब तक की अर्नड वैल्यू (EV)')}
                hint={L(
                  'The budgeted cost of the work actually done: % complete × budget, added up over the activities.',
                  'जो काम सच में हुआ है उसकी बजट लागत: पूरा हुआ % × बजट, सब गतिविधियों पर जोड़कर।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={ev} onChange={(e) => setEv(e.target.value)} />
              </Field>
              <Field
                id="evm-ac"
                label={L('Actual cost to date (AC)', 'अब तक की असल लागत (AC)')}
                wide
                hint={L('The money really spent on the work done so far.', 'अब तक हुए काम पर सच में ख़र्च हुआ पैसा।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={ac} onChange={(e) => setAc(e.target.value)} />
              </Field>
            </div>
            <Note
              kind="info"
              title={L('EV is only as honest as the percentage complete behind it', 'EV उतना ही सच्चा है जितना उसके पीछे का पूरा हुआ प्रतिशत')}
            >
              {L(
                'Earned value counts value executed, not activities ticked. Weight each activity by its cost and judge the percentage on work in place, not on effort spent.',
                'अर्नड वैल्यू निभाई गई वैल्यू गिनती है, टिक की गई गतिविधियाँ नहीं। हर गतिविधि को उसकी लागत से तौलिए और प्रतिशत को लगे हुए काम पर परखिए, लगाई गई मेहनत पर नहीं।',
              )}
            </Note>
          </>
        }
        result={
          ready ? (
            <>
              <Big
                k={L('Forecast cost at completion (EAC)', 'पूरा होने पर अनुमानित लागत (EAC)')}
                v={rupeeOrDash(r.eac)}
                sub={L(
                  'if the work goes on at today’s cost efficiency: BAC ÷ CPI',
                  'अगर काम आज की लागत-क्षमता पर चलता रहा: BAC ÷ CPI',
                )}
              />
              <Figures
                items={[
                  { k: L('Schedule index (SPI)', 'शेड्यूल इंडेक्स (SPI)'), v: index4(r.spi), tone: r.spi === null ? undefined : r.spi < 1 ? 'warn' : 'ok' },
                  { k: L('Cost index (CPI)', 'कॉस्ट इंडेक्स (CPI)'), v: index4(r.cpi), tone: r.cpi === null ? undefined : r.cpi < 1 ? 'warn' : 'ok' },
                ]}
              />
              <Note kind={QUAD_NOTE[quad.tone]} title={t(quad.title)}>
                {t(quad.reading)}
              </Note>
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Schedule variance', 'शेड्यूल वेरियंस'), detail: 'SV = EV − PV', value: rupee(r.sv) },
                  { label: L('Cost variance', 'कॉस्ट वेरियंस'), detail: 'CV = EV − AC', value: rupee(r.cv) },
                  { label: L('Estimate to complete', 'पूरा करने का अनुमान'), detail: 'ETC = EAC − AC', value: rupeeOrDash(r.etc) },
                  { label: L('Variance at completion', 'पूरा होने पर वेरियंस'), detail: 'VAC = BAC − EAC', value: rupeeOrDash(r.vac) },
                  { label: L('To-complete index', 'पूरा करने का इंडेक्स'), detail: 'TCPI = (BAC − EV) ÷ (BAC − AC)', value: index4(r.tcpi) },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  'A negative variance is behind schedule or over cost. VAC is the forecast overrun (negative) or saving (positive) against the budget. TCPI above 1.00 means the rest of the work must be run tighter than it has been so far to finish inside the budget.',
                  'माइनस वेरियंस का मतलब है शेड्यूल से पीछे या लागत से ऊपर। VAC बजट के मुक़ाबले अनुमानित ओवररन (माइनस) या बचत (प्लस) है। TCPI का 1.00 से ऊपर होना बताता है कि बजट के भीतर पूरा करने के लिए बाक़ी काम को अब तक से ज़्यादा कसकर चलाना होगा।',
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">{L('Enter the budget at completion to see the forecast.', 'अनुमान देखने के लिए पूरा होने पर बजट डालिए।')}</p>
          )
        }
      />

      <CalcCta
        kicker={L('Tracking a whole programme, not one cut-off?', 'सिर्फ़ एक कट-ऑफ़ नहीं, पूरा प्रोग्राम ट्रैक करना है?')}
        text={L(
          'This page reads one snapshot. The Planning, Progress and Delay Control Excel toolkit tracks a value-weighted baseline and S-curve, period-by-period progress, the earned value figures over time, and a delay register.',
          'यह पेज एक स्नैपशॉट पढ़ता है। प्लानिंग, प्रोग्रेस और डिले कंट्रोल Excel टूलकिट वैल्यू-वेटेड बेसलाइन और S-कर्व, अवधि-दर-अवधि प्रोग्रेस, समय के साथ अर्नड वैल्यू के आँकड़े और डिले रजिस्टर ट्रैक करता है।',
        )}
        href="/site-templates/planning-progress"
        label={L('See the toolkit', 'टूलकिट देखिए')}
      />

      <CalcSection
        title={L('What the two indices say together', 'दोनों इंडेक्स साथ में क्या कहते हैं')}
        sub={L(
          'Read the schedule index and the cost index as a pair. Exactly 1.00 counts as on target.',
          'शेड्यूल इंडेक्स और कॉस्ट इंडेक्स को जोड़ी में पढ़िए। ठीक 1.00 का मतलब है लक्ष्य पर।',
        )}
      >
        <ReportTable
          head={['SPI', 'CPI', L('Reading', 'पढ़त'), L('Where the risk is', 'जोखिम कहाँ है')]}
          labelRow
          num={[]}
          rows={
            hi
              ? [
                  ['1 या ज़्यादा', '1 या ज़्यादा', 'शेड्यूल पर या आगे, और बजट में', 'यही रफ़्तार बनाए रखिए'],
                  ['1 या ज़्यादा', '1 से कम', 'समय पर, पर लागत से ऊपर', 'लागत की दौड़, कैलेंडर नहीं'],
                  ['1 से कम', '1 या ज़्यादा', 'शेड्यूल से पीछे, पर लागत के भीतर', 'शेड्यूल, और देरी का कोई हर्जाना'],
                  ['1 से कम', '1 से कम', 'शेड्यूल से पीछे और लागत से ऊपर', 'अभी भरपाई कीजिए'],
                ]
              : [
                  ['1 or more', '1 or more', 'On or ahead of schedule, and on budget', 'Hold the line'],
                  ['1 or more', 'Under 1', 'On time but over cost', 'The cost run, not the calendar'],
                  ['Under 1', '1 or more', 'Behind schedule but under cost', 'The schedule, and any delay damages'],
                  ['Under 1', 'Under 1', 'Behind schedule and over cost', 'Recover now'],
                ]
          }
        />
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('Earned value measures value executed, not activities ticked', 'अर्नड वैल्यू निभाई गई वैल्यू नापती है, टिक की गई गतिविधियाँ नहीं')}>
          {hi ? (
            <>
              <p>
                किसी साइट से पूछिए कि काम कैसा चल रहा है और जवाब मिलता है “लगभग 60% हो गया”। 60% किसका: गतिविधियों का, फ़र्श के एरिया का या पैसे का? जो प्रोग्रेस आँकड़ा वैल्यू से तौला न गया हो, वह एक एहसास है, नाप नहीं। अर्नड वैल्यू इसे ठीक करती है, हर गतिविधि को उसकी लागत से तौलकर, ताकि नींव पूरी होना उतना गिना जाए जितना उसका मोल है, और प्लान और अर्न के बीच का अंतर रुपयों में पढ़ा जा सके।
              </p>
              <p>
                यह तरीक़ा उतना ही सच्चा है जितना उसे चलाने वाला पूरा हुआ प्रतिशत। EV “पूरा हुआ % × बजट” का सभी गतिविधियों पर जोड़ है, इसलिए 80% का आशावादी आँकड़ा जो असल में 60% है, EV को फुला देता है, दोनों इंडेक्स को अच्छा दिखाता है और वही चूक छिपा देता है जिसे पकड़ने के लिए यह तरीक़ा बना है।
              </p>
            </>
          ) : (
            <>
              <p>
                Ask a site how it is doing and you hear “about 60% done”. Sixty percent of what: activities, floor area, or money? A progress figure that is not weighted by value is a feeling, not a measurement. Earned value fixes that by weighting each activity by its cost, so finishing the foundations counts for what it is worth, and the gap between planned and earned can be read in rupees.
              </p>
              <p>
                The method is only as honest as the percentage complete that drives it. EV is “% complete × budget” added up across the activities, so an optimistic 80% that is really 60% inflates EV, flatters both indices and hides the very slip the method exists to catch.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('What SPI and CPI mean', 'SPI और CPI का मतलब')}>
          {hi ? (
            <>
              <p>
                <strong>SPI है EV ÷ PV।</strong> अब तक जितनी वैल्यू अर्न हो जानी चाहिए थी, उसमें से कितनी हुई? 0.875 के SPI का मतलब है इस तारीख़ तक प्लान किए हर रुपये पर 87.5 पैसे अर्न हुए: प्रोजेक्ट प्लान की रफ़्तार के 87.5% पर चल रहा है। यह वैल्यू में नापा जाता है, क्रिटिकल पाथ पर नहीं, इसलिए यह सेहत की जाँच है, प्रोग्राम की जगह नहीं।
              </p>
              <p>
                <strong>CPI है EV ÷ AC।</strong> ख़र्च हुए हर रुपये पर कितनी वैल्यू मिली? 0.833 के CPI का मतलब है कि हर रुपये से 83 पैसे का बजट वाला काम हुआ, यानी काम लागत से ऊपर है। ज़्यादातर प्रोजेक्ट में अब तक दिखी लागत-क्षमता आगे के लिए ठीक-ठाक संकेत होती है, इसीलिए अनुमान <strong>EAC = BAC ÷ CPI</strong> उसे आगे ले जाता है।
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>SPI is EV ÷ PV.</strong> Of the value that should have been earned by now, how much was? An SPI of 0.875 means 87.5 paise earned for every rupee planned by this date: the project runs at 87.5% of the planned pace. It is measured in value and not on the critical path, so it is a health check, not a replacement for the programme.
              </p>
              <p>
                <strong>CPI is EV ÷ AC.</strong> For every rupee spent, how much value was got? A CPI of 0.833 means each rupee bought 83 paise of budgeted work, so the job is over cost. On most projects the cost efficiency shown so far is a fair guide to what follows, which is why the forecast <strong>EAC = BAC ÷ CPI</strong> carries it forward.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('A worked example', 'हल किया उदाहरण')}>
          <p>
            {L(
              'The calculator opens on a budget of ₹10,00,000, with ₹4,00,000 planned, ₹3,50,000 earned and ₹4,20,000 spent.',
              'कैलकुलेटर ₹10,00,000 के बजट पर खुलता है, जिसमें ₹4,00,000 प्लान्ड, ₹3,50,000 अर्नड और ₹4,20,000 ख़र्च हुए हैं।',
            )}
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
            {L(
              'Both indices are under 1, so the project is behind schedule and over cost. It is forecast to finish ₹2,00,000 over budget, and to finish on budget the rest of the work would have to run at 112% of the cost efficiency it has managed so far, which is a stiff ask.',
              'दोनों इंडेक्स 1 से कम हैं, इसलिए प्रोजेक्ट शेड्यूल से पीछे और लागत से ऊपर है। अनुमान है कि वह बजट से ₹2,00,000 ऊपर पूरा होगा, और बजट में पूरा करने के लिए बाक़ी काम को अब तक की लागत-क्षमता के 112% पर चलाना होगा, जो बहुत कड़ी माँग है।',
            )}
          </p>
        </Prose>

        <Prose title={L('Reading the forecast', 'अनुमान को पढ़ना')}>
          {hi ? (
            <ul>
              <li><strong>EAC, पूरा होने पर अनुमान।</strong> BAC ÷ CPI: अगर काम आज की लागत-क्षमता पर चलता रहा तो अंतिम लागत। यह मानकर चलता है कि रुझान बना रहेगा।</li>
              <li><strong>ETC, पूरा करने का अनुमान।</strong> EAC − AC: अब से अंत तक अभी ख़र्च होने वाला पैसा, कैश-फ़्लो अनुमान के लिए।</li>
              <li><strong>VAC, पूरा होने पर वेरियंस।</strong> BAC − EAC: बजट के मुक़ाबले अनुमानित ओवररन (माइनस) या बचत (प्लस), वह आँकड़ा जिसकी क्लाइंट को परवाह होती है।</li>
              <li><strong>TCPI, पूरा करने का इंडेक्स।</strong> (BAC − EV) ÷ (BAC − AC): BAC के भीतर पूरा करने के लिए बाक़ी काम को औसतन जितनी लागत-क्षमता दिखानी होगी। अगर वह अब तक मिले CPI से बहुत ऊपर है, तो बजट में पूरा करना अब यथार्थवादी नहीं रहा।</li>
            </ul>
          ) : (
            <ul>
              <li><strong>EAC, estimate at completion.</strong> BAC ÷ CPI: the final cost if the work goes on at today’s cost efficiency. It assumes the trend holds.</li>
              <li><strong>ETC, estimate to complete.</strong> EAC − AC: the money still to be spent from now to the finish, for the cash-flow forecast.</li>
              <li><strong>VAC, variance at completion.</strong> BAC − EAC: the forecast overrun (negative) or saving (positive) against the budget, the number the client cares about.</li>
              <li><strong>TCPI, to-complete index.</strong> (BAC − EV) ÷ (BAC − AC): the cost efficiency the remaining work must average to finish inside BAC. If it is far above the CPI achieved so far, finishing on budget is no longer realistic.</li>
            </ul>
          )}
        </Prose>
      </article>

      <CalcFaq items={EVM_CONTENT.faq} />
      <RelatedLinks path="/tools/earned-value-calculator" />

      <Chips
        codes={
          hi
            ? ['अर्नड वैल्यू मैनेजमेंट', 'शेड्यूल और कॉस्ट इंडेक्स', 'पूरा होने पर अनुमान']
            : ['Earned value management', 'Schedule and cost indices', 'Forecast at completion']
        }
      />
      <CalcFine>
        {L(
          'For checking a project’s health. Earned value is only as reliable as the baseline and the percentage-complete figures behind PV and EV. The forecast here is the CPI method (BAC ÷ CPI); other methods suit a project whose cost trend is not expected to continue. Use it with the programme and a planning engineer’s judgement, not in place of them.',
          'प्रोजेक्ट की सेहत जाँचने के लिए। अर्नड वैल्यू उतनी ही भरोसेमंद है जितनी बेसलाइन और PV तथा EV के पीछे के पूरा हुआ प्रतिशत के आँकड़े। यहाँ का अनुमान CPI तरीक़े से है (BAC ÷ CPI); जिस प्रोजेक्ट में लागत का रुझान आगे चलने की उम्मीद नहीं, उसके लिए दूसरे तरीक़े ठीक रहते हैं। इसे प्रोग्राम और प्लानिंग इंजीनियर के विवेक के साथ इस्तेमाल कीजिए, उनकी जगह नहीं।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

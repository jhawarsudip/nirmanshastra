'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
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
  const { hi, L } = useL()
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
      ? L('0.75% of gross wages', 'ग्रॉस मज़दूरी का 0.75%')
      : r.esiStatus === 'above-ceiling'
        ? L(`basic is over ${whole(ESI_WAGE_CEILING)}, not covered`, `बेसिक ${whole(ESI_WAGE_CEILING)} से ऊपर है, कवर्ड नहीं`)
        : L(`average day ${rupee(r.averageDailyWage)}, ${whole(ESI_DAILY_EXEMPT)} or less`, `औसत दिन ${rupee(r.averageDailyWage)}, ${whole(ESI_DAILY_EXEMPT)} या कम`)
  const none = L('None', 'कोई नहीं')

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Daily-Wage PF and ESI Calculator', 'दैनिक मज़दूरी PF और ESI कैलकुलेटर')}
        blurb={L(
          'Work out one worker’s net wage the way a site pays it: a daily rate across the days worked, not a monthly salary. Enter the rate and the days (23.5 is fine), add overtime or an advance if there is one, and see the PF, the ESI and what the worker takes home.',
          'एक मज़दूर की नेट मज़दूरी साइट के तरीक़े से निकालिए: काम किए गए दिनों पर दैनिक दर, मासिक वेतन नहीं। दर और दिन डालिए (23.5 भी चलेगा), ओवरटाइम या एडवांस हो तो जोड़िए, और देखिए PF, ESI और मज़दूर के हाथ में कितना आता है।',
        )}
      />
      <QuickAnswer content={WAGE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The muster roll', 'मस्टर रोल')}</CalcLabel>
            <div className="ns-i-fields">
              <Field id="dw-wage" label={L('Daily wage, in ₹', 'दैनिक मज़दूरी, ₹ में')} hint={L('The rate agreed for one full day.', 'पूरे एक दिन के लिए तय की गई दर।')}>
                <Input type="number" inputMode="decimal" min={0} step="any" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} />
              </Field>
              <Field id="dw-days" label={L('Payable days', 'देय दिन')} hint={L('Days worked in the period. A part day is fine: 23.5.', 'इस अवधि में काम किए गए दिन। आधा दिन भी चलेगा: 23.5।')}>
                <Input type="number" inputMode="decimal" min={0} step="any" value={payableDays} onChange={(e) => setPayableDays(e.target.value)} />
              </Field>
              <Field
                id="dw-ot"
                label={L('Overtime hours (optional)', 'ओवरटाइम के घंटे (वैकल्पिक)')}
                hint={L(
                  `Paid at twice the hourly rate, which is the daily wage over ${STANDARD_HOURS_PER_DAY} hours.`,
                  `घंटे की दर के दोगुने पर, जो दैनिक मज़दूरी को ${STANDARD_HOURS_PER_DAY} घंटे से भाग देकर आती है।`,
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
              </Field>
              <Field
                id="dw-adv"
                label={L('Advance to recover, in ₹ (optional)', 'वसूल किया जाने वाला एडवांस, ₹ में (वैकल्पिक)')}
                hint={L('An advance already paid, taken back from this wage.', 'पहले दिया जा चुका एडवांस, जो इस मज़दूरी से वापस लिया जाएगा।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
            </div>
          </>
        }
        result={
          ready ? (
            <>
              <Big
                k={L('Net payable to the worker', 'मज़दूर को नेट देय')}
                v={rupee(r.netPayable)}
                sub={L('after PF, ESI and the advance', 'PF, ESI और एडवांस के बाद')}
              />
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Basic earned', 'कमाई गई बेसिक'), detail: L(`${plain(dw)} × ${plain(days)} days`, `${plain(dw)} × ${plain(days)} दिन`), value: rupee(r.basicEarned) },
                  ...(ot > 0
                    ? [{
                        label: L('Overtime', 'ओवरटाइम'),
                        detail: L(`${plain(ot)} h × ${OVERTIME_MULTIPLIER} × hourly rate`, `${plain(ot)} घंटे × ${OVERTIME_MULTIPLIER} × घंटे की दर`),
                        value: '+ ' + rupee(r.overtimePay),
                      }]
                    : []),
                  { label: L('Gross wages', 'ग्रॉस मज़दूरी'), detail: '', value: rupee(r.grossWages) },
                  {
                    label: L('PF, worker’s share', 'PF, मज़दूर का हिस्सा'),
                    detail: r.pfCapped
                      ? L(`12% of basic, held at ${whole(PF_EMPLOYEE_CAP)}`, `बेसिक का 12%, ${whole(PF_EMPLOYEE_CAP)} पर रोका गया`)
                      : L('12% of basic earned', 'कमाई गई बेसिक का 12%'),
                    value: '− ' + rupee(r.pf),
                  },
                  { label: L('ESI, worker’s share', 'ESI, मज़दूर का हिस्सा'), detail: esiDetail, value: '− ' + rupee(r.esi), tone: r.esiStatus === 'applies' ? undefined : 'dim' },
                  { label: L('Advance', 'एडवांस'), detail: L('as entered', 'जैसा डाला'), value: '− ' + rupee(r.advance), tone: r.advance > 0 ? undefined : 'dim' },
                  {
                    label: L('Net payable', 'नेट देय'),
                    detail: L('gross − PF − ESI − advance', 'ग्रॉस − PF − ESI − एडवांस'),
                    value: rupee(r.netPayable),
                    tone: 'ok',
                  },
                ]}
              />
              {r.netPayable < 0 ? (
                <Note kind="warn" title={L('The advance is more than this wage', 'एडवांस इस मज़दूरी से ज़्यादा है')}>
                  {L(
                    'The deductions come to more than the wages earned. Recover the advance over more than one period.',
                    'कटौतियाँ कमाई गई मज़दूरी से ज़्यादा बैठती हैं। एडवांस को एक से ज़्यादा अवधि में वसूल कीजिए।',
                  )}
                </Note>
              ) : null}
              {r.esiStatus === 'above-ceiling' ? (
                <Note kind="info" title={L('No ESI taken on this wage', 'इस मज़दूरी पर ESI नहीं कटा')}>
                  {L(
                    `Basic earned is over ${whole(ESI_WAGE_CEILING)}. A worker who was covered at the start of the contribution period (1 April or 1 October) stays covered until it ends, on the actual wages, so check the start of the period before leaving ESI out.`,
                    `कमाई गई बेसिक ${whole(ESI_WAGE_CEILING)} से ऊपर है। जो मज़दूर अंशदान अवधि की शुरुआत (1 अप्रैल या 1 अक्टूबर) पर कवर्ड था, वह उसके ख़त्म होने तक असल मज़दूरी पर कवर्ड रहता है, इसलिए ESI छोड़ने से पहले अवधि की शुरुआत जाँच लीजिए।`,
                  )}
                </Note>
              ) : null}
              {r.esiStatus === 'daily-exempt' ? (
                <Note kind="info" title={L('The worker’s ESI share is not taken', 'मज़दूर का ESI हिस्सा नहीं कटा')}>
                  {L(
                    `An average day of ${whole(ESI_DAILY_EXEMPT)} or less is exempt from the worker’s share of ESI. The employer still pays its own share.`,
                    `${whole(ESI_DAILY_EXEMPT)} या उससे कम का औसत दिन ESI के मज़दूर वाले हिस्से से मुक्त है। नियोक्ता अपना हिस्सा फिर भी देता है।`,
                  )}
                </Note>
              ) : null}
              <p className="ns-calc-help">
                {hi ? (
                  <>
                    <strong>PF</strong> कमाई गई बेसिक का 12% है, जो {whole(PF_EMPLOYEE_CAP)} पर रोका जाता है, यानी {whole(PF_WAGE_CEILING)} की मज़दूरी सीमा का 12%। <strong>ESI</strong> मज़दूर के कवर्ड होने पर सारी मज़दूरी का 0.75% है, ओवरटाइम सहित। ओवरटाइम ESI के आधार में गिना जाता है, PF के आधार में नहीं।
                  </>
                ) : (
                  <>
                    <strong>PF</strong> is 12% of basic earned, held at {whole(PF_EMPLOYEE_CAP)}, which is 12% of the {whole(PF_WAGE_CEILING)} wage ceiling. <strong>ESI</strong> is 0.75% of all wages, overtime included, once the worker is covered. Overtime counts towards the ESI base but not the PF base.
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">{L('Enter a daily wage and the days worked to see the net wage.', 'नेट मज़दूरी देखने के लिए दैनिक मज़दूरी और काम किए गए दिन डालिए।')}</p>
          )
        }
      />

      <CalcCta
        kicker={L('Running the whole gang, not one worker?', 'एक मज़दूर नहीं, पूरी गैंग चलानी है?')}
        text={L(
          'This page works out one worker’s net wage. The Labour and Statutory Compliance Excel toolkit is the full register: the muster roll for the whole gang, the PF and ESI registers with the employer’s share, wage slips and the advance ledgers.',
          'यह पेज एक मज़दूर की नेट मज़दूरी निकालता है। लेबर और स्टैच्युटरी कम्प्लायंस Excel टूलकिट पूरा रजिस्टर है: पूरी गैंग का मस्टर रोल, नियोक्ता के हिस्से सहित PF और ESI रजिस्टर, वेज स्लिप और एडवांस के खाते।',
        )}
        href="/site-templates/labour-compliance"
        label={L('See the toolkit', 'टूलकिट देखिए')}
      />

      <CalcSection
        title={L('How each figure is worked out', 'हर आँकड़ा कैसे निकलता है')}
        sub={L(
          'One line of a muster-roll wage, the rule behind it, and what it does to the pay.',
          'मस्टर रोल की मज़दूरी की एक-एक पंक्ति, उसके पीछे का नियम, और वह पैसे पर क्या असर डालती है।',
        )}
      >
        <ReportTable
          head={[L('Line', 'पंक्ति'), L('Basis', 'आधार'), L('Limit', 'सीमा'), L('Effect', 'असर')]}
          num={[]}
          rows={
            hi
              ? [
                  ['कमाई गई बेसिक', 'दैनिक मज़दूरी × देय दिन', none, 'आधार'],
                  ['ओवरटाइम', `घंटे × ${OVERTIME_MULTIPLIER} × (दैनिक मज़दूरी ÷ ${STANDARD_HOURS_PER_DAY})`, none, 'जोड़ता है'],
                  ['ग्रॉस मज़दूरी', 'बेसिक + ओवरटाइम', none, 'उप-जोड़'],
                  ['PF, मज़दूर का हिस्सा', 'कमाई गई बेसिक का 12%', `${whole(PF_EMPLOYEE_CAP)} (${whole(PF_WAGE_CEILING)} का 12%)`, 'घटाता है'],
                  ['ESI, मज़दूर का हिस्सा', 'ग्रॉस मज़दूरी का 0.75%', `बेसिक ${whole(ESI_WAGE_CEILING)} या कम हो तो कवर्ड; औसत दिन ${whole(ESI_DAILY_EXEMPT)} या कम हो तो कुछ नहीं`, 'घटाता है'],
                  ['एडवांस', 'डाली गई रुपयों की रकम', none, 'घटाता है'],
                ]
              : [
                  ['Basic earned', 'Daily wage × payable days', 'None', 'The base'],
                  ['Overtime', `Hours × ${OVERTIME_MULTIPLIER} × (daily wage ÷ ${STANDARD_HOURS_PER_DAY})`, 'None', 'Adds'],
                  ['Gross wages', 'Basic + overtime', 'None', 'Subtotal'],
                  ['PF, worker’s share', '12% of basic earned', `${whole(PF_EMPLOYEE_CAP)} (12% of ${whole(PF_WAGE_CEILING)})`, 'Takes off'],
                  ['ESI, worker’s share', '0.75% of gross wages', `Covered if basic is ${whole(ESI_WAGE_CEILING)} or less; none if the average day is ${whole(ESI_DAILY_EXEMPT)} or less`, 'Takes off'],
                  ['Advance', 'The amount entered', 'None', 'Takes off'],
                ]
          }
        />
        <p className="ns-r-tblnote">
          {L(
            'These are the worker’s own deductions. The employer pays its own PF and ESI share on top, and that is not part of the net wage.',
            'ये मज़दूर की अपनी कटौतियाँ हैं। नियोक्ता अपना PF और ESI का हिस्सा इसके ऊपर से देता है, और वह नेट मज़दूरी का हिस्सा नहीं है।',
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('Why this is not a monthly-salary calculator', 'यह मासिक वेतन का कैलकुलेटर क्यों नहीं है')}>
          {hi ? (
            <>
              <p>
                ज़्यादातर PF और ESI कैलकुलेटर तय मासिक वेतन से शुरू होते हैं, जो बेसिक, HRA और भत्तों में बँटा होता है और हर महीने एक-सा रहता है। साइट पर भुगतान ऐसे नहीं होता। मज़दूर <strong>मस्टर रोल</strong> पर होता है: हाज़िर दिनों के लिए दैनिक दर, जो हर अवधि में बदलती है, एक पखवाड़े में 21 दिन, अगले में 26, और आधा दिन लगे तो 23.5।
              </p>
              <p>
                इसलिए यहाँ कमाई गई बेसिक दैनिक मज़दूरी गुणा काम किए गए दिन है, और बाक़ी सब उसी से निकलता है। यह वही हिसाब है जो सुपरवाइज़र मज़दूरी की शीट पर हाथ से करता है।
              </p>
            </>
          ) : (
            <>
              <p>
                Most PF and ESI calculators start from a fixed monthly salary, split into basic, HRA and allowances, the same every month. A site does not pay that way. A labourer is on a <strong>muster roll</strong>: a daily rate for the days attended, which changes every period, 21 days one fortnight, 26 the next, 23.5 when a half day is marked.
              </p>
              <p>
                So here basic earned is the daily wage times the days worked, and everything else is worked from that. It is the arithmetic a supervisor does by hand on the wage sheet.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('The two ceilings do different jobs', 'दोनों सीमाएँ अलग-अलग काम करती हैं')}>
          {hi ? (
            <>
              <p>
                <strong>{whole(PF_WAGE_CEILING)} की सीमा PF की ऊपरी हद तय करती है।</strong> कर्मचारी का PF कमाई गई बेसिक का 12% है, पर सिर्फ़ {whole(PF_WAGE_CEILING)} तक की मज़दूरी पर, इसलिए कटौती {whole(PF_EMPLOYEE_CAP)} पर रुक जाती है। दिनों की अच्छी गिनती बेसिक को सीमा से बहुत ऊपर पहुँचा सकती है, फिर भी PF इससे ज़्यादा कभी नहीं लेता। इससे ऊँची मज़दूरी पर अंशदान आपसी सहमति से होता है, अनिवार्य नहीं। जून 2026 में सामाजिक सुरक्षा संहिता 2020 के तहत अधिसूचित EPF योजना 2026 सीमा को वहीं रखती है जहाँ वह थी।
              </p>
              <p>
                <strong>{whole(ESI_WAGE_CEILING)} की सीमा तय करती है कि कौन कवर्ड है।</strong> ESI कम कमाने वाले मज़दूरों का स्वास्थ्य बीमा है। मज़दूर तब कवर्ड होता है जब <em>ओवरटाइम के बिना</em> मज़दूरी प्रति माह {whole(ESI_WAGE_CEILING)} या उससे कम हो, और कवर्ड होने के बाद 0.75% सारी मज़दूरी पर कटता है, ओवरटाइम सहित। इसीलिए ओवरटाइम ESI के आधार को {whole(ESI_WAGE_CEILING)} से ऊपर पहुँचा सकता है और कवर ख़त्म नहीं होता।
              </p>
              <p>
                दो बातें और हैं। जिस मज़दूर का औसत दिन {whole(ESI_DAILY_EXEMPT)} या उससे कम है, वह मज़दूर वाला हिस्सा नहीं देता (नियोक्ता फिर भी देता है)। और कवर हर छह महीने की अवधि के लिए तय होता है, अप्रैल से सितंबर और अक्टूबर से मार्च, इसलिए जो मज़दूर अवधि के बीच में {whole(ESI_WAGE_CEILING)} पार करता है, वह उसके ख़त्म होने तक कवर्ड रहता है। यह पेज आपकी डाली हुई मज़दूरी को एक बार में एक अवधि के लिए परखता है, इसलिए नहीं जान सकता कि अवधि कैसे शुरू हुई थी।
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>The {whole(PF_WAGE_CEILING)} ceiling caps the PF.</strong> Employee PF is 12% of basic earned, but only on wages up to {whole(PF_WAGE_CEILING)}, so the deduction stops at {whole(PF_EMPLOYEE_CAP)}. A good stretch of days can lift basic far above the ceiling, and the PF still never takes more than that. Contributions on higher wages are by agreement, not compulsory. The EPF Scheme 2026, notified in June 2026 under the Code on Social Security 2020, leaves the ceiling where it was.
              </p>
              <p>
                <strong>The {whole(ESI_WAGE_CEILING)} ceiling decides who is covered.</strong> ESI is the health insurance for lower-paid workers. A worker is covered when wages <em>without overtime</em> are {whole(ESI_WAGE_CEILING)} a month or less, and once covered the 0.75% is taken on all wages, overtime included. That is why overtime can push the ESI base past {whole(ESI_WAGE_CEILING)} without ending cover.
              </p>
              <p>
                Two details sit on top. A worker whose average day is {whole(ESI_DAILY_EXEMPT)} or less does not pay the worker’s share (the employer still does). And cover is fixed for each six-month period, April to September and October to March, so a worker who crosses {whole(ESI_WAGE_CEILING)} part-way through a period stays covered until it ends. This page tests the wages you type in, one period at a time, so it cannot know how the period began.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('A worked wage', 'हल की गई मज़दूरी')}>
          <p>
            {L(
              `A worker on ${whole(900)} a day, marked present 23 days, with no overtime and no advance:`,
              `${whole(900)} प्रति दिन पर काम करने वाला मज़दूर, 23 दिन हाज़िर लगा, बिना ओवरटाइम और बिना एडवांस के:`,
            )}
          </p>
          <Formula>
            {hi ? (
              <>
                कमाई गई बेसिक = 900 × 23 = ₹20,700.00{'\n'}
                PF = 20,700 का 12% = 2,484, ₹1,800.00 पर रोका गया{'\n'}
                ESI = 20,700 का 0.75% = ₹155.25 (बेसिक ₹21,000 से कम है, इसलिए कवर्ड){'\n'}
                नेट देय = 20,700 − 1,800 − 155.25 = ₹18,744.75
              </>
            ) : (
              <>
                Basic earned = 900 × 23 = ₹20,700.00{'\n'}
                PF = 12% of 20,700 = 2,484, held at ₹1,800.00{'\n'}
                ESI = 0.75% of 20,700 = ₹155.25 (basic is under ₹21,000, so covered){'\n'}
                Net payable = 20,700 − 1,800 − 155.25 = ₹18,744.75
              </>
            )}
          </Formula>
          <p>
            {L(
              `Now add overtime. At ${whole(800)} a day for 26 days the basic is ₹20,800, so the worker is covered. Eight hours of overtime at twice ${whole(100)} an hour adds ₹1,600, so gross is ₹22,400. PF stays at ₹1,800 because overtime is not in the PF base, and ESI is 0.75% of ₹22,400, which is ₹168.00. Net payable is ₹20,432.00.`,
              `अब ओवरटाइम जोड़िए। ${whole(800)} प्रति दिन पर 26 दिन में बेसिक ₹20,800 है, इसलिए मज़दूर कवर्ड है। ${whole(100)} प्रति घंटे के दोगुने पर आठ घंटे का ओवरटाइम ₹1,600 जोड़ता है, इसलिए ग्रॉस ₹22,400 है। PF ₹1,800 पर ही रहता है क्योंकि ओवरटाइम PF के आधार में नहीं है, और ESI ₹22,400 का 0.75% है, यानी ₹168.00। नेट देय ₹20,432.00 है।`,
            )}
          </p>
        </Prose>

        <Prose title={L('What this page does not work out', 'यह पेज क्या नहीं निकालता')}>
          <p>
            {L(
              `It does not work out the employer’s share of PF and ESI, the minimum wage for your state and trade, bonus, or gratuity. PF and ESI apply to a worker only when the employer’s establishment is covered, which depends on how many people it employs and on the state; the page assumes both apply. Overtime is taken as twice the rate over an ${STANDARD_HOURS_PER_DAY}-hour day, and a contract or a state rule may set a different normal day.`,
              `यह नियोक्ता का PF और ESI हिस्सा, आपके राज्य और काम की न्यूनतम मज़दूरी, बोनस या ग्रेच्युटी नहीं निकालता। PF और ESI किसी मज़दूर पर तभी लागू होते हैं जब नियोक्ता का प्रतिष्ठान कवर्ड हो, जो इस पर निर्भर करता है कि वह कितने लोगों को काम देता है और राज्य कौन-सा है; पेज मानकर चलता है कि दोनों लागू हैं। ओवरटाइम ${STANDARD_HOURS_PER_DAY} घंटे के दिन पर दर का दोगुना माना गया है, और अनुबंध या राज्य का नियम कोई और सामान्य दिन तय कर सकता है।`,
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={WAGE_CONTENT.faq} />
      <RelatedLinks path="/tools/daily-wage-pf-esi-calculator" />

      <Chips
        codes={
          hi
            ? ['सामाजिक सुरक्षा संहिता 2020 (EPF योजना 2026)', 'ESI मज़दूरी सीमा ₹21,000', 'मज़दूरी संहिता 2019 धारा 14']
            : ['Code on Social Security 2020 (EPF Scheme 2026)', 'ESI wage ceiling ₹21,000', 'Code on Wages 2019 s.14']
        }
      />
      <CalcFine>
        {L(
          'For checking a wage sheet. It works out the worker’s own deductions on one muster-roll wage, from ceilings and rates published in payroll guides that may have changed since; confirm them with EPFO and ESIC before paying wages. Whether PF and ESI apply, the overtime terms and the advance recovery depend on the establishment, the state and the current law. Not legal or payroll advice.',
          'मज़दूरी की शीट जाँचने के लिए। यह मस्टर रोल की एक मज़दूरी पर मज़दूर की अपनी कटौतियाँ निकालता है, उन सीमाओं और दरों से जो पेरोल गाइडों में छपी हैं और तब से बदल चुकी हो सकती हैं; मज़दूरी देने से पहले उन्हें EPFO और ESIC से पक्का कर लीजिए। PF और ESI लागू हैं या नहीं, ओवरटाइम की शर्तें और एडवांस की वसूली प्रतिष्ठान, राज्य और मौजूदा क़ानून पर निर्भर करती हैं। यह क़ानूनी या पेरोल सलाह नहीं है।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

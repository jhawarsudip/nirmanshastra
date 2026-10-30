'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
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
  const { hi, L } = useL()
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
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('RA Bill Calculator: retention, GST and TDS', 'आरए बिल कैलकुलेटर: रिटेंशन, GST और TDS')}
        blurb={L(
          'Enter the gross value of a running account bill and see what the contractor is paid: the retention held back, the GST added, the TDS deducted, and any advance taken back.',
          'रनिंग अकाउंट बिल की ग्रॉस वैल्यू डालिए और देखिए कि ठेकेदार को क्या मिलता है: रोका गया रिटेंशन, जुड़ा GST, कटा TDS और वापस लिया गया एडवांस।',
        )}
      />
      <QuickAnswer content={RABILL_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The bill', 'बिल')}</CalcLabel>
            <div className="ns-i-fields">
              <Field
                id="ra-gross"
                label={L('Gross RA bill value, in ₹', 'RA बिल की ग्रॉस वैल्यू, ₹ में')}
                wide
                hint={L(
                  'The value of work certified in this bill, before any deduction or tax.',
                  'इस बिल में प्रमाणित काम की वैल्यू, किसी कटौती या टैक्स से पहले।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={gross} onChange={(e) => setGross(e.target.value)} />
              </Field>
              <Field
                id="ra-retention"
                label={L('Retention, %', 'रिटेंशन, %')}
                hint={L('Held back against defects. The contract fixes it.', 'ख़ामियों के बदले रोका जाता है। अनुबंध इसे तय करता है।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={retentionPct} onChange={(e) => setRetentionPct(e.target.value)} />
              </Field>
              <Field
                id="ra-gst"
                label="GST, %"
                hint={L('18% is the general rate for a works contract.', 'वर्क्स कॉन्ट्रैक्ट के लिए 18% आम दर है।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={gstPct} onChange={(e) => setGstPct(e.target.value)} />
              </Field>
              <Field
                id="ra-tds"
                label="TDS, %"
                hint={L(
                  `${TDS_INDIVIDUAL_PCT}% if the contractor is an individual or HUF, ${TDS_OTHER_PCT}% for a company or firm.`,
                  `ठेकेदार व्यक्ति या HUF हो तो ${TDS_INDIVIDUAL_PCT}%, कंपनी या फ़र्म हो तो ${TDS_OTHER_PCT}%।`,
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={tdsPct} onChange={(e) => setTdsPct(e.target.value)} />
              </Field>
              <Field
                id="ra-advance"
                label={L('Advance to recover, in ₹ (optional)', 'वसूल किया जाने वाला एडवांस, ₹ में (वैकल्पिक)')}
                hint={L('A rupee amount for this bill, not a percentage.', 'इस बिल के लिए रुपयों की रकम, प्रतिशत नहीं।')}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </Field>
            </div>
            {tdsUnusual ? (
              <Note kind="warn" title={L('Check the TDS rate', 'TDS दर जाँच लीजिए')}>
                {L(
                  `A payment to a contractor carries ${TDS_INDIVIDUAL_PCT}% TDS for an individual or HUF and ${TDS_OTHER_PCT}% for others, or 20% if the contractor gives no PAN. Any other rate needs a reason.`,
                  `ठेकेदार को भुगतान पर व्यक्ति या HUF के लिए ${TDS_INDIVIDUAL_PCT}% और बाक़ी के लिए ${TDS_OTHER_PCT}% TDS लगता है, या 20% अगर ठेकेदार PAN नहीं देता। कोई और दर हो तो उसकी वजह होनी चाहिए।`,
                )}
              </Note>
            ) : null}
          </>
        }
        result={
          ready ? (
            <>
              <Big
                k={L('Net payable to the contractor', 'ठेकेदार को नेट देय')}
                v={rupee(r.netPayable)}
                sub={L('after retention, GST, TDS and the advance', 'रिटेंशन, GST, TDS और एडवांस के बाद')}
              />
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Gross bill value', 'ग्रॉस बिल वैल्यू'), detail: '', value: rupee(r.grossBillValue) },
                  { label: L('Retention held back', 'रोका गया रिटेंशन'), detail: L(`${pct(rp)} of gross`, `ग्रॉस का ${pct(rp)}`), value: '− ' + rupee(r.retention) },
                  { label: L('Advance recovery', 'एडवांस की वसूली'), detail: L('as entered', 'जैसा डाला'), value: '− ' + rupee(r.advanceRecovery), tone: r.advanceRecovery > 0 ? undefined : 'dim' },
                  { label: L('GST added', 'जोड़ा गया GST'), detail: L(`${pct(gp)} of gross`, `ग्रॉस का ${pct(gp)}`), value: '+ ' + rupee(r.gst) },
                  { label: L('TDS deducted', 'काटा गया TDS'), detail: L(`${pct(tp)} of gross, without GST`, `GST के बिना ग्रॉस का ${pct(tp)}`), value: '− ' + rupee(r.tds) },
                  {
                    label: L('Net payable', 'नेट देय'),
                    detail: L('gross − retention − advance + GST − TDS', 'ग्रॉस − रिटेंशन − एडवांस + GST − TDS'),
                    value: rupee(r.netPayable),
                    tone: 'ok',
                  },
                ]}
              />
              {r.netPayable < 0 ? (
                <Note kind="warn" title={L('The deductions are more than the bill', 'कटौतियाँ बिल से ज़्यादा हैं')}>
                  {L(
                    'The retention, advance and TDS come to more than the bill and its GST. Check the advance amount.',
                    'रिटेंशन, एडवांस और TDS मिलकर बिल और उसके GST से ज़्यादा बैठते हैं। एडवांस की रकम जाँच लीजिए।',
                  )}
                </Note>
              ) : null}
              <p className="ns-calc-help">
                {hi ? (
                  <>
                    रिटेंशन और GST दोनों ग्रॉस बिल वैल्यू का प्रतिशत हैं। <strong>TDS GST के बिना की वैल्यू पर है</strong>, इसलिए आप जो GST जोड़ते हैं उस पर दोबारा टैक्स नहीं लगता। एडवांस वही रुपयों की रकम है जो आपने डाली।
                  </>
                ) : (
                  <>
                    Retention and GST are each a percentage of the gross bill value. <strong>TDS is on the value without GST</strong>, so the GST you add is never taxed again. The advance is the rupee amount you typed.
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">{L('Enter the gross value of the bill to see the net payable.', 'नेट देय देखने के लिए बिल की ग्रॉस वैल्यू डालिए।')}</p>
          )
        }
      />

      <CalcCta
        kicker={L('Running the whole bill, not one line?', 'एक पंक्ति नहीं, पूरा बिल चलाना है?')}
        text={L(
          'This page works out the net payable on one bill. The Billing and Measurement Excel toolkit is the full set: the measurement sheets, the abstract of quantities, running bills that carry the previous bill forward, and the retention and advance ledgers.',
          'यह पेज एक बिल का नेट देय निकालता है। बिलिंग और मेज़रमेंट Excel टूलकिट पूरा सेट है: मेज़रमेंट शीट, मात्राओं का अब्स्ट्रैक्ट, पिछले बिल को आगे ले जाने वाले रनिंग बिल, और रिटेंशन तथा एडवांस के खाते।',
        )}
        href="/site-templates/billing-measurement"
        label={L('See the toolkit', 'टूलकिट देखिए')}
      />

      <CalcSection
        title={L('How each line is worked out', 'हर पंक्ति कैसे निकलती है')}
        sub={L(
          'The five lines of an RA bill, the rule behind each, and the figure the calculator starts at.',
          'RA बिल की पाँच पंक्तियाँ, हर एक के पीछे का नियम, और वह आँकड़ा जिस पर कैलकुलेटर शुरू होता है।',
        )}
      >
        <ReportTable
          head={[L('Line', 'पंक्ति'), L('Basis', 'आधार'), L('Starts at', 'शुरुआत'), L('Effect', 'असर')]}
          num={[]}
          rows={
            hi
              ? [
                  ['ग्रॉस बिल वैल्यू', 'इस बिल में प्रमाणित काम', '—', 'आधार'],
                  ['रिटेंशन', '% × ग्रॉस', pct(RA_BILL_DEFAULTS.retentionPct), 'घटाता है'],
                  ['एडवांस की वसूली', 'डाली गई रुपयों की रकम', '₹0', 'घटाता है'],
                  ['GST', '% × ग्रॉस', pct(RA_BILL_DEFAULTS.gstPct), 'जोड़ता है'],
                  ['TDS', '% × ग्रॉस, GST के बिना', `${pct(RA_BILL_DEFAULTS.tdsPct)} (कंपनी या फ़र्म के लिए 2%)`, 'घटाता है'],
                ]
              : [
                  ['Gross bill value', 'Work certified in this bill', '—', 'The base'],
                  ['Retention', '% × gross', pct(RA_BILL_DEFAULTS.retentionPct), 'Takes off'],
                  ['Advance recovery', 'The rupee amount entered', '₹0', 'Takes off'],
                  ['GST', '% × gross', pct(RA_BILL_DEFAULTS.gstPct), 'Adds'],
                  ['TDS', '% × gross, without GST', `${pct(RA_BILL_DEFAULTS.tdsPct)} (2% for a company or firm)`, 'Takes off'],
                ]
          }
        />
        <p className="ns-r-tblnote">
          {L(
            'Every rate can be edited. The calculator does not assume a reduced “residential” GST rate: 18% is the general rate for a works contract.',
            'हर दर बदली जा सकती है। कैलकुलेटर कोई घटी हुई “आवासीय” GST दर नहीं मानता: वर्क्स कॉन्ट्रैक्ट के लिए 18% आम दर है।',
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('What retention is for', 'रिटेंशन किसलिए होता है')}>
          {hi ? (
            <>
              <p>
                रिटेंशन वह पैसा है जो क्लाइंट सुरक्षा के तौर पर हर बिल से रोक लेता है। यह जुर्माना नहीं है और यह क्लाइंट के रखने के लिए भी नहीं है। यह ख़ामियों से बचाता है: ठेकेदार को भुगतान हो जाने के बाद अगर कुछ ख़राब निकले, जैसे टपकता छज्जा, फटा फ़र्श या हनीकॉम्ब वाला कंक्रीट जो लोड पड़ने पर दिखे, तो रोका हुआ पैसा मरम्मत का ख़र्च उठाता है। प्रतिशत, कितने समय रोका जाए और कब छोड़ा जाए, यह अनुबंध तय करता है।
              </p>
              <p>
                यह बिल-दर-बिल जमा होता जाता है, इसलिए साइट इंजीनियर से उम्मीद की जाती है कि उसे पता हो अब तक कितना रिटेंशन रोका गया और उसमें से कितना छोड़ा गया।
              </p>
            </>
          ) : (
            <>
              <p>
                Retention is money the client holds back from each bill as security. It is not a penalty and it is not the client’s to keep. It guards against defects: if something fails after the contractor has been paid, such as a leaking chajja, a cracked floor or honeycombed concrete that shows up under load, the retained money pays for the repair. The contract fixes the percentage, how long it is held and when it is released.
              </p>
              <p>
                Because it builds up bill by bill, a site engineer is expected to know the retention held so far against what has been released.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('How TDS works on a contractor’s bill', 'ठेकेदार के बिल पर TDS कैसे काम करता है')}>
          {hi ? (
            <>
              <p>
                निर्माण का ठेका वर्क्स कॉन्ट्रैक्ट होता है। ठेकेदार को भुगतान करने वाला स्रोत पर टैक्स के रूप में एक छोटा प्रतिशत काट लेता है, और उसे ठेकेदार के टैक्स खाते में जमा करता है। आयकर अधिनियम 2025 की धारा 393(1) के तहत, जो 1 अप्रैल 2026 से लागू है और 1961 के अधिनियम की धारा 194C की जगह लेती है, दर <strong>1%</strong> है जब ठेकेदार व्यक्ति या HUF हो और बाक़ी सबके लिए <strong>2%</strong>। ठेकेदार PAN न दे तो यह 20% है।
              </p>
              <p>
                ₹30,000 या उससे कम के एक भुगतान पर TDS नहीं कटता, जब तक कि साल में उस ठेकेदार को हुए भुगतान ₹1,00,000 से ऊपर न चले जाएँ। यह कैलकुलेटर इन सीमाओं को नहीं परखता; यह आपका डाला हुआ प्रतिशत काटता है।
              </p>
              <p>
                साइट पर दो बातें मायने रखती हैं। जब GST बिल पर अलग से दिखाया गया हो, तब TDS काम की <strong>GST के बिना</strong> वैल्यू पर लगता है। और TDS ठेकेदार के भुगतान में से <em>कटता</em> है जबकि GST <em>जुड़ता</em> है, इसलिए दोनों नेट देय को उलटी दिशाओं में खींचते हैं।
              </p>
            </>
          ) : (
            <>
              <p>
                A construction contract is a works contract. The one who pays a contractor deducts a small percentage as tax at source, and deposits it against the contractor’s tax account. Under section 393(1) of the Income-tax Act 2025, which applies from 1 April 2026 and replaces section 194C of the 1961 Act, the rate is <strong>1%</strong> when the contractor is an individual or HUF and <strong>2%</strong> for anyone else. It is 20% if the contractor gives no PAN.
              </p>
              <p>
                No TDS is taken on a single payment of ₹30,000 or less, unless the payments to that contractor in the year pass ₹1,00,000. This calculator does not test those limits; it deducts the percentage you enter.
              </p>
              <p>
                Two details matter on site. The TDS is on the value of the work <strong>without GST</strong>, when the GST is shown separately on the bill. And TDS comes <em>off</em> the contractor’s payment while GST goes <em>on</em>, so the two pull the net payable in opposite directions.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Mistakes that spoil the net payable', 'ग़लतियाँ जो नेट देय बिगाड़ देती हैं')}>
          {hi ? (
            <ul>
              <li>
                <strong>आवासीय GST को कम मान लेना।</strong> डेवलपरों द्वारा बेचे जाने वाले कुछ आवासीय प्रोजेक्टों पर अलग तरह से टैक्स लगता है। आम वर्क्स कॉन्ट्रैक्ट का बिल 18% पर होता है, जब तक अनुबंध कुछ और न कहे।
              </li>
              <li>
                <strong>TDS को GST सहित रकम पर निकालना।</strong> इससे ज़्यादा कट जाता है और ठेकेदार को कम मिलता है।
              </li>
              <li>
                <strong>एडवांस भूल जाना, या सारा एक साथ ले लेना।</strong> पहले दिया गया एडवांस अनुबंध के हिसाब से कई बिलों में हिस्सों में वापस लिया जाता है। एक बिल में छोड़ दिया तो ज़्यादा भुगतान हो जाता है; सारा एक में ले लिया तो ठेकेदार की नकदी पर बोझ पड़ता है।
              </li>
              <li>
                <strong>रिटेंशन को ग़लत आँकड़े पर निकालना।</strong> यहाँ रिटेंशन ग्रॉस बिल वैल्यू का प्रतिशत है, GST से पहले, टैक्स के बाद देय रकम का नहीं।
              </li>
            </ul>
          ) : (
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
          )}
        </Prose>

        <Prose title={L('A worked bill', 'हल किया हुआ बिल')}>
          <p>
            {L(
              'A gross bill of ₹10,00,000 at the starting rates: retention 5%, GST 18%, TDS 1%, and no advance to recover.',
              '₹10,00,000 का ग्रॉस बिल शुरुआती दरों पर: रिटेंशन 5%, GST 18%, TDS 1%, और वसूल करने को कोई एडवांस नहीं।',
            )}
          </p>
          <Formula>
            {hi ? (
              <>
                ग्रॉस बिल वैल्यू = ₹10,00,000.00{'\n'}
                − रिटेंशन (5%) = ₹50,000.00{'\n'}
                − एडवांस की वसूली = ₹0.00{'\n'}
                + GST (18%) = ₹1,80,000.00{'\n'}
                − TDS (1%) = ₹10,000.00{'\n'}
                नेट देय = ₹11,20,000.00
              </>
            ) : (
              <>
                Gross bill value = ₹10,00,000.00{'\n'}
                − Retention (5%) = ₹50,000.00{'\n'}
                − Advance recovery = ₹0.00{'\n'}
                + GST (18%) = ₹1,80,000.00{'\n'}
                − TDS (1%) = ₹10,000.00{'\n'}
                Net payable = ₹11,20,000.00
              </>
            )}
          </Formula>
          <p>
            {L(
              'Change any rate above and every line, with the net payable, updates as you type.',
              'ऊपर कोई भी दर बदलिए और नेट देय सहित हर पंक्ति टाइप करते ही बदल जाती है।',
            )}
          </p>
        </Prose>

        <Prose title={L('What this page does not work out', 'यह पेज क्या नहीं निकालता')}>
          <p>
            {L(
              'It does not test the TDS thresholds, work out the contractor’s own tax, or take any other deduction a contract may carry, such as a cess, a penalty or a recovery for material supplied. It does not check the GST rate that fits a particular contract, and it takes retention on the gross value before GST. The contract and the invoice decide each of these.',
              'यह TDS की सीमाएँ नहीं परखता, ठेकेदार का अपना टैक्स नहीं निकालता, और अनुबंध में हो सकने वाली कोई और कटौती नहीं लेता, जैसे सेस, जुर्माना या दी गई सामग्री की वसूली। यह नहीं जाँचता कि किसी ख़ास अनुबंध पर कौन-सी GST दर बैठती है, और रिटेंशन GST से पहले की ग्रॉस वैल्यू पर लेता है। इनमें से हर बात अनुबंध और इनवॉइस तय करते हैं।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={RABILL_CONTENT.faq} />
      <RelatedLinks path="/tools/ra-bill-retention-tds-calculator" />

      <Chips codes={hi ? ['आयकर अधिनियम 2025 धारा 393(1)', 'CGST अधिनियम 2017'] : ['Income-tax Act 2025 s.393(1)', 'CGST Act 2017']} />
      <CalcFine>
        {L(
          'For checking a bill. The rates are those in guides to the Income-tax Act 2025 and the GST rate notifications, and may have changed; confirm them before releasing a payment. Retention, the advance and the GST rate that applies depend on the contract, the parties’ registration and the current law. Not tax or legal advice.',
          'बिल जाँचने के लिए। दरें आयकर अधिनियम 2025 की गाइडों और GST दर की अधिसूचनाओं से हैं, और बदल चुकी हो सकती हैं; भुगतान छोड़ने से पहले उन्हें पक्का कर लीजिए। रिटेंशन, एडवांस और लागू GST दर अनुबंध, पक्षों के पंजीकरण और मौजूदा क़ानून पर निर्भर करते हैं। यह टैक्स या क़ानूनी सलाह नहीं है।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import '@/styles/v2/assure.css'
import { ToolHead } from '@/components/v2/inner/kit'
import {
  FAILED_DELIVERY_EN, FAILED_DELIVERY_HI, NOT_REFUNDABLE_EN, NOT_REFUNDABLE_HI, PACK_REFUND_EN, PACK_REFUND_HI,
  REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS,
} from '@/lib/policy'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import SampleReportLink from '@/components/samples/SampleReportLink'

// A fixed date, so the page does not say "today" every time it is built.
const UPDATED = '29 October 2026'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function RefundPolicyPage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal"
          name="Refund Policy"
          blurb={`What is and is not refundable, in plain words. Last updated ${UPDATED}.`}
          after={<p style={{ margin: '12px 0 0' }}><a href="#hindi" className="ns-i-link" style={{ padding: 0 }}>हिन्दी में पढ़िए</a></p>}
        />

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-1">
          <h2 id="rp-1" style={H2}>In short</h2>
          <p>{NOT_REFUNDABLE_EN}</p>
          <p>{FAILED_DELIVERY_EN}</p>
          <p>Not sure whether a report will suit you? Look at a real one before you buy. Every page of the sample is marked as a sample.</p>
          <SampleReportLink sample="structopro" where="refund_policy" />
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-2">
          <h2 id="rp-2" style={H2}>If your report did not arrive</h2>
          <ol>
            <li>Email <a href={`mailto:${CONTACT_EMAIL}?subject=Report%20not%20delivered`}>{CONTACT_EMAIL}</a> within {REFUND_ASK_DAYS} days of payment. Write from the email address you bought with, so we can find the payment.</li>
            <li>Say which report it was, and give your report ID if you have one (it starts with NS-), or the payment ID Razorpay showed you.</li>
            <li>We look into it. If the report cannot be delivered within {REFUND_FAILED_DELIVERY_HOURS} hours of payment because of a fault on our side, you are refunded the full amount you paid, to the card, bank account or UPI app you paid with.</li>
          </ol>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-3">
          <h2 id="rp-3" style={H2}>What this covers</h2>
          <ul>
            <li>Every paid report: StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro and the Grand Total Report.</li>
            <li>{PACK_REFUND_EN}</li>
            <li>VastuPro and the free calculators cost nothing, so there is nothing to refund.</li>
            <li>The Excel Site Templates sold at <Link href="/site-templates">/site-templates</Link> have their own licence, delivery and refund terms: see the <Link href="/site-templates/terms">Site Templates Terms and Licence</Link>.</li>
          </ul>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" id="hindi" lang="hi" aria-labelledby="rp-hi" style={{ scrollMarginTop: 90 }}>
          <h2 id="rp-hi" style={H2}>रिफ़ंड नीति (हिन्दी में)</h2>
          <p>{NOT_REFUNDABLE_HI}</p>
          <p>{FAILED_DELIVERY_HI}</p>
          <h3 style={{ margin: '18px 0 0', fontSize: 20 }}>रिपोर्ट न पहुँचे तो</h3>
          <ol>
            <li>भुगतान के {REFUND_ASK_DAYS} दिन के भीतर <a href={`mailto:${CONTACT_EMAIL}?subject=Report%20not%20delivered`}>{CONTACT_EMAIL}</a> पर ईमेल कीजिए। उसी ईमेल पते से लिखिए जिससे ख़रीदा था, ताकि हम भुगतान ढूँढ सकें।</li>
            <li>बताइए कि कौन-सी रिपोर्ट थी, और रिपोर्ट का ID (वह NS- से शुरू होता है) या Razorpay का दिखाया गया पेमेंट ID दीजिए।</li>
            <li>हम जाँच करते हैं। अगर हमारी ओर की ख़राबी से रिपोर्ट भुगतान के {REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर नहीं पहुँच सकती, तो आपका दिया पूरा पैसा उसी कार्ड, बैंक खाते या UPI ऐप में लौटा दिया जाता है जिससे आपने भुगतान किया था।</li>
          </ol>
          <h3 style={{ margin: '18px 0 0', fontSize: 20 }}>यह किन पर लागू है</h3>
          <ul>
            <li>हर सशुल्क रिपोर्ट: स्ट्रक्चरप्रो, मेसनरीप्रो, इलेक्ट्रिकलप्रो, प्लंबिंगप्रो, इंटीरियरप्रो और ग्रैंड टोटल रिपोर्ट।</li>
            <li>{PACK_REFUND_HI}</li>
            <li>VastuPro और मुफ़्त कैलकुलेटर मुफ़्त हैं, इसलिए उनमें रिफ़ंड का सवाल नहीं उठता।</li>
            <li>Excel साइट टेम्पलेट (<Link href="/site-templates">/site-templates</Link>) की लाइसेंस, डिलीवरी और रिफ़ंड की अपनी शर्तें हैं: <Link href="/site-templates/terms">साइट टेम्पलेट की शर्तें और लाइसेंस</Link> देखिए।</li>
          </ul>
          <p style={{ fontSize: 14.5, color: 'var(--ns-ink-2)' }}>यह हिन्दी रूप सुविधा के लिए है। अंग्रेज़ी रूप ऊपर दिया गया है।</p>
        </section>

        <p className="ns-i-fine">See also the <Link href="/terms-of-use">Terms of Use</Link> and the <Link href="/privacy-policy">Privacy Policy</Link>.</p>
      </div>
    </div>
  )
}

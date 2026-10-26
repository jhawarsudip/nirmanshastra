import Link from 'next/link'
import '@/styles/v2/results.css'
import '@/styles/v2/assure.css'
import { ToolHead } from '@/components/v2/inner/kit'
import { REFUND_DAYS, REFUND_PROCESSING, REFUND_PROCESSING_HI, REFUND_PROMISE_EN, REFUND_PROMISE_HI } from '@/lib/policy'
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER, whatsappUrl } from '@/lib/site-contact'
import SampleReportLink from '@/components/samples/SampleReportLink'

// A fixed date, so the page does not say "today" every time it is built.
const UPDATED = '26 October 2026'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function RefundPolicyPage() {
  const wa = WHATSAPP_NUMBER ? whatsappUrl(`Hi, I want a refund. My report ID is `) : ''
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal"
          name="Refund Policy"
          blurb={`A short policy, because the promise is short. Last updated ${UPDATED}.`}
          after={<p style={{ margin: '12px 0 0' }}><a href="#hindi" className="ns-i-link" style={{ padding: 0 }}>हिन्दी में पढ़िए</a></p>}
        />

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-1" style={{ borderLeft: '6px solid var(--ns-verdigris, #2F7A4F)' }}>
          <h2 id="rp-1" style={H2}>Our promise</h2>
          <p style={{ fontSize: 'clamp(18px, 1.7vw, 21px)', lineHeight: 1.55, color: 'var(--ns-ink)' }}>{REFUND_PROMISE_EN}</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-2">
          <h2 id="rp-2" style={H2}>How to ask</h2>
          <ol>
            <li>Write to <a href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}>{CONTACT_EMAIL}</a> within {REFUND_DAYS} days of buying{WHATSAPP_NUMBER ? <>, or message us on WhatsApp at <a href={wa} target="_blank" rel="noopener">{WHATSAPP_DISPLAY}</a></> : null}.</li>
            <li>Say which report it was. Your report ID is on the PDF and in the email we sent when your report was ready; it starts with NS-. Write from the email address you bought with, so we can find the payment.</li>
            <li>That is all. You do not need to fill in a form, give a reason, or explain yourself.</li>
          </ol>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-3">
          <h2 id="rp-3" style={H2}>What happens next</h2>
          <ul>
            <li>We reply within 24 to 48 hours on business days and confirm the refund.</li>
            <li>The refund is for the full amount you paid.</li>
            <li>Once approved, the money reaches your original payment method within {REFUND_PROCESSING}. It goes back the way it came: to the card, bank account or UPI app you paid with. We cannot send it anywhere else.</li>
          </ul>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="rp-4">
          <h2 id="rp-4" style={H2}>What this covers</h2>
          <ul>
            <li>Every paid report: StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro and the Grand Total Report.</li>
            <li>The Complete House Pack, as one purchase.</li>
            <li>A report that did not reach you, or that failed to generate because of a fault on our side, is refunded in full as well.</li>
            <li>VastuPro and the free calculators cost nothing, so there is nothing to refund.</li>
            <li>The Excel Site Templates sold at <Link href="/site-templates">/site-templates</Link> have their own licence, delivery and refund terms: see the <Link href="/site-templates/terms">Site Templates Terms and Licence</Link>.</li>
          </ul>
          <p>Not sure whether a report will suit you? Look at a real one before you buy. Every page of the sample is marked as a sample.</p>
          <SampleReportLink sample="structopro" where="refund_policy" />
        </section>

        <section className="ns-plate ns-r-sec ns-prose" id="hindi" lang="hi" aria-labelledby="rp-hi" style={{ scrollMarginTop: 90 }}>
          <h2 id="rp-hi" style={H2}>रिफ़ंड नीति (हिन्दी में)</h2>
          <p style={{ fontSize: 'clamp(18px, 1.7vw, 21px)', lineHeight: 1.7, color: 'var(--ns-ink)' }}>{REFUND_PROMISE_HI}</p>
          <h3 style={{ margin: '18px 0 0', fontSize: 20 }}>कैसे माँगें</h3>
          <ol>
            <li>ख़रीदने के {REFUND_DAYS} दिन के भीतर <a href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}>{CONTACT_EMAIL}</a> पर लिखिए{WHATSAPP_NUMBER ? <>, या WhatsApp पर <a href={wa} target="_blank" rel="noopener">{WHATSAPP_DISPLAY}</a> पर संदेश भेजिए</> : null}।</li>
            <li>बताइए कि कौन-सी रिपोर्ट थी। रिपोर्ट का ID PDF में और रिपोर्ट तैयार होने पर भेजे गए ईमेल में होता है; वह NS- से शुरू होता है। उसी ईमेल पते से लिखिए जिससे ख़रीदा था, ताकि हम भुगतान ढूँढ सकें।</li>
            <li>बस इतना ही। कोई फ़ॉर्म नहीं, कारण बताने या सफ़ाई देने की ज़रूरत नहीं।</li>
          </ol>
          <h3 style={{ margin: '18px 0 0', fontSize: 20 }}>आगे क्या होता है</h3>
          <ul>
            <li>हम व्यावसायिक दिनों में 24 से 48 घंटे के भीतर जवाब देकर रिफ़ंड की पुष्टि करते हैं।</li>
            <li>रिफ़ंड आपके दिए पूरे पैसे का होता है।</li>
            <li>मंज़ूरी के बाद पैसा {REFUND_PROCESSING_HI} में आपके मूल भुगतान माध्यम में पहुँच जाता है। पैसा उसी रास्ते लौटता है जिससे आया था: जिस कार्ड, बैंक खाते या UPI ऐप से आपने भुगतान किया।</li>
          </ul>
          <h3 style={{ margin: '18px 0 0', fontSize: 20 }}>यह किन पर लागू है</h3>
          <ul>
            <li>हर सशुल्क रिपोर्ट: स्ट्रक्चरप्रो, मेसनरीप्रो, इलेक्ट्रिकलप्रो, प्लंबिंगप्रो, इंटीरियरप्रो और ग्रैंड टोटल रिपोर्ट।</li>
            <li>कम्प्लीट हाउस पैक, एक खरीद के रूप में।</li>
            <li>जो रिपोर्ट आप तक नहीं पहुँची, या हमारी ओर की किसी ख़राबी से बन नहीं पाई, उसका भी पूरा रिफ़ंड होता है।</li>
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

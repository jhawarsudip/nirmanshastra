/*
  Hindi for /refund-policy (app/[locale]/refund-policy/page.tsx).

  Clause for clause the English page. The three refund terms are the Hindi constants of lib/policy.ts, passed in by the page
  (so scripts/check-policy.ts can see the page is built from them); the hours and days come from the same constants as the English.
  The English page also carries an older Hindi section at its foot ("हिन्दी में पढ़िए"); it is not repeated here.
*/
import { REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS } from '@/lib/policy'
import { dateFromEn, LAST_UPDATED_HI, LEGAL_EYEBROW_HI, type LegalDoc } from '@/lib/i18n/labels/legal-common'

export function refundDocHi(updatedEn: string, terms: { notRefundable: string; failedDelivery: string; pack: string }): LegalDoc {
  return {
    eyebrow: LEGAL_EYEBROW_HI,
    name: 'रिफ़ंड नीति',
    blurb: `क्या वापस होता है और क्या नहीं, सीधी-सादी भाषा में। ${LAST_UPDATED_HI}: ${dateFromEn(updatedEn)}।`,
    sections: [
      {
        id: 'rp-1',
        h: 'संक्षेप में',
        blocks: [
          { p: terms.notRefundable },
          { p: terms.failedDelivery },
          { p: 'पक्का नहीं है कि कोई रिपोर्ट आपके काम की होगी? ख़रीदने से पहले एक असली रिपोर्ट देख लीजिए। नमूने के हर पन्ने पर नमूना होने का निशान लगा है।' },
          { sample: 'structopro', where: 'refund_policy' },
        ],
      },
      {
        id: 'rp-2',
        h: 'अगर आपकी रिपोर्ट न पहुँचे',
        blocks: [
          {
            ol: [
              `भुगतान के ${REFUND_ASK_DAYS} दिन के भीतर {mail|subject=Report%20not%20delivered} पर ईमेल कीजिए। उसी ईमेल पते से लिखिए जिससे आपने ख़रीदा था, ताकि हम भुगतान ढूँढ सकें।`,
              'बताइए कि कौन-सी रिपोर्ट थी, और अगर आपके पास रिपोर्ट ID है (इसकी शुरुआत NS- से होती है) तो वह दीजिए, या वह पेमेंट ID दीजिए जो Razorpay ने आपको दिखाई थी।',
              `हम इसकी जाँच करते हैं। अगर हमारी ओर की किसी ख़राबी के कारण रिपोर्ट भुगतान के ${REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर आप तक नहीं पहुँचाई जा सकती, तो आपने जितना पैसा दिया था वह पूरा लौटा दिया जाता है, उसी कार्ड, बैंक खाते या UPI ऐप में जिससे आपने भुगतान किया था।`,
            ],
          },
        ],
      },
      {
        id: 'rp-3',
        h: 'यह किन पर लागू है',
        blocks: [
          {
            ul: [
              'हर सशुल्क रिपोर्ट: StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro और ग्रैंड टोटल रिपोर्ट।',
              terms.pack,
              'VastuPro और मुफ़्त कैलकुलेटर पर कुछ ख़र्च नहीं होता, इसलिए रिफ़ंड करने को कुछ नहीं है।',
              '{link|/site-templates|/site-templates} पर बिकने वाले Excel साइट टेम्पलेट की लाइसेंस, डिलीवरी और रिफ़ंड की अपनी शर्तें हैं: {link|/site-templates/terms|साइट टेम्पलेट की शर्तें और लाइसेंस} देखिए।',
            ],
          },
        ],
      },
    ],
    foot: { kind: 'fine', text: '{link|/terms-of-use|उपयोग की शर्तें} और {link|/privacy-policy|गोपनीयता नीति} भी देखिए।' },
  }
}

/*
  The refund terms, in one place. The Terms of Use, the FAQ and /refund-policy all read from here, so they cannot drift apart.

  These are the terms the site had before 26 Oct 2026, restored on 29 Oct 2026 at SJ's request: a report that has been delivered is
  not refundable (the buyer can look at a real sample report first), and a report that could not be delivered because of a fault on
  our side is refunded in full. The "7-day satisfaction promise" added on 26 Oct 2026 is gone.
  To change the windows, edit the two constants below and redeploy.
*/

/** A report that cannot be delivered within this many hours of payment, because of a fault on our side, is refunded in full. */
export const REFUND_FAILED_DELIVERY_HOURS = 48

/** Days after payment within which the buyer writes to ask for that refund. */
export const REFUND_ASK_DAYS = 7

export const NOT_REFUNDABLE_EN =
  'Once a PDF report has been generated and delivered to your registered email, the payment is not refundable. The quantities are worked out and the PDF is generated at the time of payment, so there is nothing to return.'

export const FAILED_DELIVERY_EN =
  `If a PDF fails to generate because of a technical fault on our side and cannot be delivered within ${REFUND_FAILED_DELIVERY_HOURS} hours of payment, we will refund you in full.`

/** The Complete House Pack unlocks reports instead of delivering one PDF, so "delivered" means "unlocked, and the confirmation email sent". */
export const PACK_REFUND_EN =
  `The Complete House Pack is one purchase. Once it has been unlocked and its confirmation email sent, it is not refundable. If it cannot be unlocked because of a technical fault on our side within ${REFUND_FAILED_DELIVERY_HOURS} hours of payment, we will refund you in full.`

/** The sentence that says how to ask. The Terms and the policy page put the address in as a link; the FAQ writes it out. */
export const howToAskEn = (email: string) => `To ask for a refund for a failed delivery, email ${email} within ${REFUND_ASK_DAYS} days of payment.`

/** The same terms in Hindi. Change both together (scripts/check-policy.ts fails if the numbers differ). */
export const NOT_REFUNDABLE_HI =
  'PDF रिपोर्ट बनकर आपके पंजीकृत ईमेल पर पहुँच जाने के बाद भुगतान वापस नहीं होता। मात्राएँ और PDF भुगतान के समय ही तैयार होते हैं, इसलिए लौटाने के लिए कुछ नहीं बचता।'
export const FAILED_DELIVERY_HI =
  `अगर हमारी ओर की किसी तकनीकी ख़राबी से PDF बन नहीं पाती और भुगतान के ${REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर आप तक नहीं पहुँच पाती, तो हम आपको पूरा पैसा लौटा देंगे।`
export const PACK_REFUND_HI =
  `कम्प्लीट हाउस पैक एक ही ख़रीद है। एक बार वह खुल जाए और उसका पुष्टि-ईमेल चला जाए, तो वह वापस नहीं होता। अगर हमारी ओर की किसी तकनीकी ख़राबी से वह भुगतान के ${REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर नहीं खुल पाता, तो हम आपको पूरा पैसा लौटा देंगे।`
export const howToAskHi = (email: string) => `डिलीवरी न होने पर रिफ़ंड माँगने के लिए, भुगतान के ${REFUND_ASK_DAYS} दिन के भीतर ${email} पर ईमेल कीजिए।`

/** The question and the request at the foot of every report-ready email. Replies reach CONTACT_EMAIL (the emails set it as Reply-To). */
export const FEEDBACK_QUESTION = 'Did the report help?'
export const FEEDBACK_REQUEST = 'Reply with one line we can share, using your first name and city.'
export const FEEDBACK_ASK = `${FEEDBACK_QUESTION} ${FEEDBACK_REQUEST}`

/*
  The refund promise, in one place. Every page, pay button, email and the Terms read from here, so the figures cannot drift apart.
  To change the window or the processing time, edit the two constants below and redeploy.
*/

/** Days after purchase within which a customer can ask for a full refund. */
export const REFUND_DAYS = 7

/** How long an approved refund takes to reach the original payment method. */
export const REFUND_PROCESSING = '7–10 working days'
/** The same time in Hindi. Change both together (scripts/check-policy.ts fails if the numbers differ). */
export const REFUND_PROCESSING_HI = '7–10 कार्य-दिवसों'

/** The full promise, as shown on /refund-policy. */
export const REFUND_PROMISE_EN =
  `Our promise: if your report does not help you question at least one line of your contractor’s quote, write to us within ${REFUND_DAYS} days of purchase and we will refund you in full. No forms, no argument. Once approved, the money reaches your original payment method within ${REFUND_PROCESSING}.`

export const REFUND_PROMISE_HI =
  `हमारा वादा: अगर हमारी रिपोर्ट आपको अपने ठेकेदार के कोटेशन की कम से कम एक लाइन पर सवाल उठाने में मदद नहीं करती, तो ख़रीदने के ${REFUND_DAYS} दिन के भीतर हमें लिखिए, हम आपको पूरा पैसा लौटा देंगे। कोई फ़ॉर्म नहीं, कोई बहस नहीं। मंज़ूरी के बाद पैसा ${REFUND_PROCESSING_HI} में आपके मूल भुगतान माध्यम में पहुँच जाता है।`

/** The one-line version shown beside every pay button. */
export const REFUND_SHORT_EN = `Full refund within ${REFUND_DAYS} days if the report does not help you question a line of your quote.`
export const REFUND_SHORT_HI = `रिपोर्ट से कोटेशन की किसी लाइन पर सवाल उठाने में मदद न मिले तो ${REFUND_DAYS} दिन में पूरा पैसा वापस।`

/** The question and the request at the foot of every report-ready email. Replies reach CONTACT_EMAIL (the emails set it as Reply-To). */
export const FEEDBACK_QUESTION = 'Did the report help?'
export const FEEDBACK_REQUEST = 'Reply with one line we can share, using your first name and city.'
export const FEEDBACK_ASK = `${FEEDBACK_QUESTION} ${FEEDBACK_REQUEST}`

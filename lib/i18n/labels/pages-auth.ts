/*
  Hindi for the sign-in page (app/[locale]/auth/page.tsx) and the new-password page (auth/reset-password/page.tsx).

  Two kinds of text live here:
    1. the fixed words on the page (headings, labels, hints, buttons), as English and Hindi objects of the same shape;
    2. messages the page SHOWS but does not own: our own validation lines, and the lines the sign-in service sends
       back when something goes wrong (wrong password, address already used, too many tries...). Those are kept in
       AUTH_MESSAGES as English -> Hindi, used through useTr(AUTH_MESSAGES). The page keeps the English text in its
       state and translates it only when it draws it, so nothing sent to or received from the service changes. A message
       with no entry here is shown exactly as it came (that is deliberate: never hide an unknown error).

  The "{0}" in an entry is the part that varies (seconds to wait, a number of characters, an e-mail address).

  Hindi house style: see docs/NirmanShastra_Hindi_Guide.md. Nothing here is shown on an English page.
*/
import type { Copy } from '@/lib/i18n/copy'
import type { Dict } from '@/lib/i18n/tr'

/* ───────────── the sign-in page ───────────── */

const authEn = {
  eyebrow: 'Your account',
  headings: { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password' },
  /** "Log in to continue to <b>StructurePro</b>." is cut around the tool name, which stays Latin. */
  toolA: 'Log in to continue to ',
  toolB: '.',
  tabsAria: 'Log in or sign up',
  tabLogin: 'Log in',
  tabSignup: 'Sign up',
  resetLede: "Enter your account email address and we'll send you a link to reset your password.",
  fullName: 'Full name',
  namePh: 'Ramesh Sharma',
  email: 'Email',
  emailPh: 'you@example.com',
  mobile: 'Mobile number',
  mobileHint: '10 digits, without +91',
  city: 'Your city',
  cityPh: 'e.g. Pune',
  pin: 'PIN code',
  password: 'Password',
  passHint: 'At least 6 characters',
  passPhNew: 'Choose a password',
  passPhNow: 'Your password',
  forgot: 'Forgot password?',
  consentLegend: 'Share with material partners (optional)',
  c1Label: 'Share my city with construction material partners for relevant offers',
  c1Desc: 'If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your account page.',
  c2Label: 'Also share my name, phone number, and email with construction material partners for offers',
  c2Desc: 'If checked, we may share your name, phone number, and email with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime from your account page.',
  wait: 'Please wait…',
  submitLogin: 'Log in',
  submitReset: 'Send reset link',
  submitSignup: 'Create account',
  backToLogin: 'Back to log in',
  noAccount: 'No account?',
  signupFree: 'Sign up free',
  haveAccount: 'Already have an account?',
  loginLink: 'Log in',
  loading: 'Loading…',
}

const authHi: typeof authEn = {
  eyebrow: 'आपका खाता',
  headings: { login: 'फिर से स्वागत है', signup: 'अपना खाता बनाइए', reset: 'अपना पासवर्ड रीसेट कीजिए' },
  toolA: '',
  toolB: ' पर आगे बढ़ने के लिए लॉग इन कीजिए।',
  tabsAria: 'लॉग इन या साइन अप',
  tabLogin: 'लॉग इन',
  tabSignup: 'साइन अप',
  resetLede: 'अपने खाते का ईमेल पता डालिए। हम आपको पासवर्ड रीसेट करने का लिंक भेज देंगे।',
  fullName: 'पूरा नाम',
  namePh: 'रमेश शर्मा',
  email: 'ईमेल',
  emailPh: 'you@example.com',
  mobile: 'मोबाइल नंबर',
  mobileHint: '10 अंक, +91 के बिना',
  city: 'आपका शहर',
  cityPh: 'जैसे पुणे',
  pin: 'पिन कोड',
  password: 'पासवर्ड',
  passHint: 'कम से कम 6 अक्षर',
  passPhNew: 'एक पासवर्ड चुनिए',
  passPhNow: 'आपका पासवर्ड',
  forgot: 'पासवर्ड भूल गए?',
  consentLegend: 'सामग्री पार्टनरों के साथ साझा करना (वैकल्पिक)',
  c1Label: 'काम की पेशकशों के लिए मेरा शहर निर्माण सामग्री के पार्टनरों के साथ साझा कीजिए',
  c1Desc: 'अगर आप इस पर टिक लगाते हैं, तो हम आपका शहर (आपका फ़ोन नंबर या सही पता नहीं) सीमेंट, स्टील या दूसरी निर्माण सामग्री की कंपनियों के साथ साझेदारी की पेशकशों के लिए साझा कर सकते हैं। आप इसे कभी भी अपने खाते के पेज से वापस ले सकते हैं।',
  c2Label: 'पेशकशों के लिए मेरा नाम, फ़ोन नंबर और ईमेल भी निर्माण सामग्री के पार्टनरों के साथ साझा कीजिए',
  c2Desc: 'अगर आप इस पर टिक लगाते हैं, तो हम आपका नाम, फ़ोन नंबर और ईमेल सीमेंट, स्टील या दूसरी निर्माण सामग्री की कंपनियों के साथ साझेदारी की पेशकशों के लिए साझा कर सकते हैं। आप इसे कभी भी अपने खाते के पेज से वापस ले सकते हैं।',
  wait: 'कृपया रुकिए…',
  submitLogin: 'लॉग इन कीजिए',
  submitReset: 'रीसेट लिंक भेजिए',
  submitSignup: 'खाता बनाइए',
  backToLogin: 'लॉग इन पर वापस जाइए',
  noAccount: 'खाता नहीं है?',
  signupFree: 'मुफ़्त साइन अप कीजिए',
  haveAccount: 'पहले से खाता है?',
  loginLink: 'लॉग इन कीजिए',
  loading: 'लोड हो रहा है…',
}

export const AUTH: Copy<typeof authEn> = { en: authEn, hi: authHi }

/* ───────────── the new-password page ───────────── */

const resetEn = {
  eyebrow: 'Your account',
  name: 'Set a new password',
  doneTitle: 'Password updated',
  doneBody: 'Taking you to the log-in page…',
  badTitle: 'This reset link has expired or is invalid',
  badBody: 'Please request a new one from the log-in page.',
  backToLogin: 'Back to log in',
  newPass: 'New password',
  newHint: 'At least 8 characters',
  newPh: 'Choose a new password',
  confirm: 'Confirm new password',
  confirmPh: 'Repeat your new password',
  wait: 'Please wait…',
  update: 'Update password',
}

const resetHi: typeof resetEn = {
  eyebrow: 'आपका खाता',
  name: 'नया पासवर्ड सेट कीजिए',
  doneTitle: 'पासवर्ड बदल गया',
  doneBody: 'आपको लॉग इन पेज पर ले जा रहे हैं…',
  badTitle: 'यह रीसेट लिंक पुराना हो चुका है या सही नहीं है',
  badBody: 'कृपया लॉग इन पेज से नया लिंक माँगिए।',
  backToLogin: 'लॉग इन पर वापस जाइए',
  newPass: 'नया पासवर्ड',
  newHint: 'कम से कम 8 अक्षर',
  newPh: 'नया पासवर्ड चुनिए',
  confirm: 'नए पासवर्ड की पुष्टि कीजिए',
  confirmPh: 'नया पासवर्ड फिर से लिखिए',
  wait: 'कृपया रुकिए…',
  update: 'पासवर्ड बदलिए',
}

export const RESET: Copy<typeof resetEn> = { en: resetEn, hi: resetHi }

/* ───────────── messages the pages show but do not own ───────────── */

/**
 * English message -> Hindi. Covers the lines written in these pages, and the common lines the sign-in service
 * (Supabase GoTrue) sends back. Matching is on the whole message; "{0}" stands for the part that varies.
 * Anything not listed here is displayed exactly as received.
 */
export const AUTH_MESSAGES: Dict = {
  // written in the pages
  'Check your email for a password reset link. It may take a few minutes to arrive.': 'पासवर्ड रीसेट का लिंक आपके ईमेल पर भेज दिया गया है। उसे पहुँचने में कुछ मिनट लग सकते हैं।',
  'Account created! Check your email to confirm, then log in.': 'खाता बन गया! अपना ईमेल कन्फ़र्म करने के लिए ईमेल देखिए, फिर लॉग इन कीजिए।',
  'Enter a valid 10-digit Indian mobile number': 'सही 10 अंकों का भारतीय मोबाइल नंबर डालिए',
  'Enter a valid 6-digit PIN code': 'सही 6 अंकों का पिन कोड डालिए',
  'Something went wrong. Please try again.': 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  'Password must be at least 8 characters.': 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।',
  'Passwords do not match.': 'दोनों पासवर्ड एक जैसे नहीं हैं।',
  'Could not secure your account. Please try again.': 'आपका खाता सुरक्षित नहीं हो पाया। कृपया फिर कोशिश कीजिए।',

  // sent back by the sign-in service
  'Invalid login credentials': 'ईमेल या पासवर्ड सही नहीं है।',
  'Email not confirmed': 'आपका ईमेल अभी कन्फ़र्म नहीं हुआ है। ईमेल में भेजा गया लिंक खोलिए, फिर लॉग इन कीजिए।',
  'User already registered': 'इस ईमेल से खाता पहले से बना है। लॉग इन कीजिए।',
  'A user with this email address has already been registered': 'इस ईमेल से खाता पहले से बना है। लॉग इन कीजिए।',
  'User not found': 'इस ईमेल से कोई खाता नहीं मिला।',
  'Password should be at least {0} characters.': 'पासवर्ड कम से कम {0} अक्षर का होना चाहिए।',
  'Password should be at least {0} characters': 'पासवर्ड कम से कम {0} अक्षर का होना चाहिए।',
  'Password is known to be weak and easily guessable, please choose a different one.': 'यह पासवर्ड बहुत कमज़ोर है और इसका आसानी से अंदाज़ा लगाया जा सकता है। कृपया कोई दूसरा पासवर्ड चुनिए।',
  'New password should be different from the old password.': 'नया पासवर्ड पुराने पासवर्ड से अलग होना चाहिए।',
  'Signup requires a valid password': 'साइन अप के लिए सही पासवर्ड चाहिए।',
  'To signup, please provide your email': 'साइन अप के लिए अपना ईमेल डालिए।',
  'Unable to validate email address: invalid format': 'यह ईमेल पता सही नहीं लग रहा। जाँचकर फिर डालिए।',
  'Email address "{0}" is invalid': 'ईमेल पता “{0}” सही नहीं है।',
  'Signups not allowed for this instance': 'अभी नए खाते नहीं बनाए जा रहे हैं।',
  'Email signups are disabled': 'अभी नए खाते नहीं बनाए जा रहे हैं।',
  'For security purposes, you can only request this after {0} seconds.': 'सुरक्षा के लिए, आप यह अनुरोध {0} सेकंड बाद ही कर सकते हैं।',
  'email rate limit exceeded': 'अभी बहुत ज़्यादा ईमेल भेजे जा चुके हैं। थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Email rate limit exceeded': 'अभी बहुत ज़्यादा ईमेल भेजे जा चुके हैं। थोड़ी देर बाद फिर कोशिश कीजिए।',
  'request rate limit reached': 'बहुत ज़्यादा कोशिशें हो गईं। थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Request rate limit reached': 'बहुत ज़्यादा कोशिशें हो गईं। थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Error sending recovery email': 'रीसेट का ईमेल भेजा नहीं जा सका। कृपया थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Error sending confirmation email': 'कन्फ़र्मेशन का ईमेल भेजा नहीं जा सका। कृपया थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Database error saving new user': 'नया खाता सहेजते समय गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  'Token has expired or is invalid': 'यह लिंक पुराना हो चुका है या सही नहीं है। कृपया नया लिंक माँगिए।',
  'Email link is invalid or has expired': 'यह लिंक पुराना हो चुका है या सही नहीं है। कृपया नया लिंक माँगिए।',
  'Auth session missing!': 'आपका सेशन नहीं मिला। कृपया दोबारा लॉग इन कीजिए।',

  // the browser could not reach the service
  'Failed to fetch': 'इंटरनेट से जुड़ नहीं पाया। अपना कनेक्शन जाँचकर फिर कोशिश कीजिए।',
  'Load failed': 'इंटरनेट से जुड़ नहीं पाया। अपना कनेक्शन जाँचकर फिर कोशिश कीजिए।',
  'NetworkError when attempting to fetch resource.': 'इंटरनेट से जुड़ नहीं पाया। अपना कनेक्शन जाँचकर फिर कोशिश कीजिए।',
}

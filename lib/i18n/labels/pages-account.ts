/*
  Hindi for the two signed-in pages, Account (app/[locale]/account/*) and My reports (app/[locale]/reports/*).

  Same pattern as the other page labels: an English object, then the Hindi one typed as the English one's shape,
  so a missing key is a compile error. Anything the page sends to the server, any value stored in the database
  (report status, app type) and the "Privacy request" mail subject's e-mail address are not touched.
  Error lines the sign-in service sends back go through AUTH_MESSAGES (pages-auth.ts).

  Hindi house style: see docs/NirmanShastra_Hindi_Guide.md. Nothing here is shown on an English page.
*/
import type { Copy } from '@/lib/i18n/copy'
import { dateHi } from '@/lib/i18n/labels/pages-common'

/* ───────────── Account page ───────────── */

const accountEn = {
  eyebrow: 'Account',
  name: 'Your account',
  blurb: 'The details we hold for you, and the choices you can change.',
  profileH: 'Your profile',
  nameK: 'Name',
  emailK: 'Email',
  cityK: 'City',
  guestNoEmail: 'Guest session, no email on file',
  /** "To delete your account ... email <address> with the subject ...": cut around the e-mail link. */
  privacyA: 'To delete your account or ask for a copy of your data, email',
  privacyB: 'with the subject “Privacy request: [your name]”.',
}

const accountHi: typeof accountEn = {
  eyebrow: 'खाता',
  name: 'आपका खाता',
  blurb: 'आपके बारे में हमारे पास जो जानकारी है, और वे चुनाव जो आप बदल सकते हैं।',
  profileH: 'आपकी प्रोफ़ाइल',
  nameK: 'नाम',
  emailK: 'ईमेल',
  cityK: 'शहर',
  guestNoEmail: 'गेस्ट सेशन, कोई ईमेल दर्ज नहीं',
  privacyA: 'अपना खाता मिटवाने या अपने डेटा की कॉपी माँगने के लिए',
  privacyB: 'पर ईमेल कीजिए, विषय में “निजता अनुरोध: [आपका नाम]” लिखकर।',
}

export const ACCOUNT: Copy<typeof accountEn> = { en: accountEn, hi: accountHi }

/* ───────────── "Secure your account" card for guest sessions ───────────── */

const guestEn = {
  doneTitle: 'Check your email to confirm your new address',
  doneBody: 'Once confirmed, you can log in with this email and password. All your existing projects and reports stay exactly where they are.',
  noteTitle: 'Guest session',
  noteBody: 'You are using NirmanShastra as a guest. A guest cannot log back in on another device or after clearing the browser.',
  h: 'Secure your account',
  sub: 'Add an email and password to keep permanent access to your projects, reports and purchases. Nothing you have already made is lost.',
  email: 'Email',
  emailPh: 'you@example.com',
  password: 'Password',
  passHint: 'At least 6 characters.',
  errTitle: 'Could not secure the account',
  busy: 'Securing…',
  go: 'Secure my account',
}

const guestHi: typeof guestEn = {
  doneTitle: 'अपना नया ईमेल कन्फ़र्म करने के लिए ईमेल देखिए',
  doneBody: 'कन्फ़र्म होते ही आप इसी ईमेल और पासवर्ड से लॉग इन कर सकेंगे। आपके सारे मौजूदा प्रोजेक्ट और रिपोर्टें जहाँ हैं, वहीं रहेंगी।',
  noteTitle: 'गेस्ट सेशन',
  noteBody: 'आप NirmanShastra को गेस्ट के रूप में इस्तेमाल कर रहे हैं। गेस्ट किसी दूसरे डिवाइस पर, या ब्राउज़र साफ़ करने के बाद, दोबारा लॉग इन नहीं कर सकता।',
  h: 'अपना खाता सुरक्षित कीजिए',
  sub: 'अपने प्रोजेक्ट, रिपोर्टों और ख़रीदारी तक हमेशा पहुँच बनाए रखने के लिए एक ईमेल और पासवर्ड जोड़िए। आपका अब तक का बनाया कुछ भी नहीं जाएगा।',
  email: 'ईमेल',
  emailPh: 'you@example.com',
  password: 'पासवर्ड',
  passHint: 'कम से कम 6 अक्षर।',
  errTitle: 'खाता सुरक्षित नहीं हो पाया',
  busy: 'सुरक्षित हो रहा है…',
  go: 'मेरा खाता सुरक्षित कीजिए',
}

export const GUEST: Copy<typeof guestEn> = { en: guestEn, hi: guestHi }

/* ───────────── the two sharing choices ───────────── */

const consentEn = {
  h: 'Share with material partners (optional)',
  cityLabel: 'Share my city with construction material partners for relevant offers',
  cityDesc: 'If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this consent at any time by unchecking this box.',
  contactLabel: 'Also share my name, phone number, and email with construction material partners for offers',
  contactDesc: 'If checked, we may share your name, phone number, and email with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime by unchecking this box.',
  saving: 'Saving…',
  saved: 'Preference saved',
  failed: 'Could not save. Please try again.',
}

const consentHi: typeof consentEn = {
  h: 'सामग्री पार्टनरों के साथ साझा करना (वैकल्पिक)',
  cityLabel: 'काम की पेशकशों के लिए मेरा शहर निर्माण सामग्री के पार्टनरों के साथ साझा कीजिए',
  cityDesc: 'अगर आप इस पर टिक लगाते हैं, तो हम आपका शहर (आपका फ़ोन नंबर या सही पता नहीं) सीमेंट, स्टील या दूसरी निर्माण सामग्री की कंपनियों के साथ साझेदारी की पेशकशों के लिए साझा कर सकते हैं। इस बॉक्स का टिक हटाकर आप अपनी यह सहमति कभी भी वापस ले सकते हैं।',
  contactLabel: 'पेशकशों के लिए मेरा नाम, फ़ोन नंबर और ईमेल भी निर्माण सामग्री के पार्टनरों के साथ साझा कीजिए',
  contactDesc: 'अगर आप इस पर टिक लगाते हैं, तो हम आपका नाम, फ़ोन नंबर और ईमेल सीमेंट, स्टील या दूसरी निर्माण सामग्री की कंपनियों के साथ साझेदारी की पेशकशों के लिए साझा कर सकते हैं। इस बॉक्स का टिक हटाकर आप इसे कभी भी वापस ले सकते हैं।',
  saving: 'सहेजा जा रहा है…',
  saved: 'पसंद सहेज ली गई',
  failed: 'सहेजा नहीं जा सका। कृपया फिर कोशिश कीजिए।',
}

export const CONSENT: Copy<typeof consentEn> = { en: consentEn, hi: consentHi }

/* ───────────── My reports ───────────── */

const reportsEn = {
  eyebrow: 'Account',
  name: 'My reports',
  blurb: 'Every estimate you have saved. A paid report can be downloaded again here at any time.',
  errTitle: 'Could not load your reports',
  errBody: 'Please refresh the page.',
  emptyH: 'No reports yet',
  emptySub: 'Run any tool and your estimate is saved here.',
  emptyGo: 'Start with StructurePro',
  head: ['Tool', 'Project', 'Location', 'Date', 'Status', 'Report'],
  openPack: 'Open your pack',
  /** "Showing 3 estimates, most recent first." */
  showing: (n: number) => `Showing ${n} estimate${n === 1 ? '' : 's'}, most recent first.`,
  status: { draft: 'In progress', complete: 'Free view', paid: 'Paid' },
  /** Names in the Tool column. The six tool names stay as they are; only the two that are plain words are written out. */
  apps: { grandtotal: 'Grand Total', completepack: 'Complete House Pack' },
}

const reportsHi: typeof reportsEn = {
  eyebrow: 'खाता',
  name: 'मेरी रिपोर्टें',
  blurb: 'आपके सहेजे हुए सारे एस्टिमेट। पेड रिपोर्ट आप यहाँ से कभी भी दोबारा डाउनलोड कर सकते हैं।',
  errTitle: 'आपकी रिपोर्टें लोड नहीं हो सकीं',
  errBody: 'कृपया पेज रिफ़्रेश कीजिए।',
  emptyH: 'अभी कोई रिपोर्ट नहीं',
  emptySub: 'कोई भी टूल चलाइए, आपका एस्टिमेट यहाँ सहेज लिया जाएगा।',
  emptyGo: 'StructurePro से शुरू कीजिए',
  head: ['टूल', 'प्रोजेक्ट', 'जगह', 'तारीख़', 'स्थिति', 'रिपोर्ट'],
  openPack: 'अपना पैक खोलिए',
  showing: (n) => `${n} एस्टिमेट दिख रहे हैं, सबसे नया सबसे ऊपर।`,
  status: { draft: 'जारी है', complete: 'मुफ़्त नतीजा', paid: 'पेड' },
  apps: { grandtotal: 'ग्रैंड टोटल', completepack: 'कम्प्लीट हाउस पैक' },
}

export const REPORTS: Copy<typeof reportsEn> = { en: reportsEn, hi: reportsHi }

/**
 * "25 अक्टूबर 2026" for a saved timestamp, read in India time (the English page also reads it in Asia/Kolkata).
 * The English page keeps its own formatter; this is only called for Hindi.
 */
export function reportDateHi(iso: string): string {
  const [y, m, d] = new Date(iso)
    .toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' })
    .split('-')
    .map(Number)
  return dateHi(y, m, d)
}

/* ───────────── the "Download PDF" button ───────────── */

const downloadEn = {
  none: 'No PDF',
  busy: 'Fetching…',
  go: 'Download PDF',
  notBuilt: 'This PDF was not built yet. Open the tool to build it.',
  failed: 'Could not fetch it. Please try again.',
}

const downloadHi: typeof downloadEn = {
  none: 'PDF नहीं है',
  busy: 'लाया जा रहा है…',
  go: 'PDF डाउनलोड कीजिए',
  notBuilt: 'यह PDF अभी बनी नहीं है। इसे बनाने के लिए टूल खोलिए।',
  failed: 'PDF नहीं मिल पाई। कृपया फिर कोशिश कीजिए।',
}

export const DOWNLOAD: Copy<typeof downloadEn> = { en: downloadEn, hi: downloadHi }

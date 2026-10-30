/*
  Hindi for the Site Templates shop: the index page (/site-templates), the words every product page shares
  (components in app/[locale]/site-templates/_components/ProductPage.tsx) and the buy dialog (purchase.tsx).
  The six product pages' own text is in templates-<name>.ts next to this file.

  1. INDEX, PRODUCT_UI and CHECKOUT are Copy objects: English first, Hindi typed as the English shape, so a missing key fails tsc.
  2. CARD_HI is the Hindi for each toolkit's card: description, the label of its codes list, and the codes.
     The descriptions are word for word the Hindi on the home page (lib/v2/content.ts, SITE_TEMPLATES) and are also the
     product page's "description" paragraph. Titles are in lib/site-templates.ts (titleHi).
  3. CHECKOUT_DICT is for the messages that the buy flow keeps as English strings: some are typed in purchase.tsx, some come back
     from /api/site-templates/* and are shown unchanged. The dialog looks each one up here at display time (useTr). The
     routes and the stored state are not touched, and a message with no entry shows in English.

  Money is never typed here: every rupee figure comes from lib/site-templates.ts (the same catalog that charges the customer).
*/
import type { Copy } from '../copy'
import type { Dict } from '../tr'
import { BUNDLE_PRICE_PAISE, SIGNED_URL_TTL_SECONDS, SITE_TEMPLATES, getProductById } from '@/lib/site-templates'

/* ───────────── prices, worked out from the catalog ───────────── */

/** 249900 -> "₹2,499"; 1289400 -> "₹12,894" (Indian digit grouping, written by hand so the server and the browser agree). */
export function inr(paise: number): string {
  const n = String(Math.round(paise / 100))
  const tail = n.slice(-3)
  const head = n.slice(0, -3)
  return '₹' + (head ? head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + tail
}

/** The price of one toolkit as the page writes it ("₹2,099"), from the catalog that charges the customer. */
export function catalogPrice(productId: string): string {
  return inr(getProductById(productId)?.price ?? 0)
}

const prices = SITE_TEMPLATES.map((p) => p.price)
/** What the six toolkits cost bought one by one. */
export const SEPARATE_PAISE = prices.reduce((a, b) => a + b, 0)
export const LOWEST_PAISE = Math.min(...prices)
export const HIGHEST_PAISE = Math.max(...prices)
export const BUNDLE_RUPEES = inr(BUNDLE_PRICE_PAISE)
export const SEPARATE_RUPEES = inr(SEPARATE_PAISE)
export const SAVE_PERCENT = Math.round((1 - BUNDLE_PRICE_PAISE / SEPARATE_PAISE) * 100)
/** How long a download link works, in hours. */
export const LINK_HOURS = Math.round(SIGNED_URL_TTL_SECONDS / 3600)

/* ───────────── each toolkit's card: Hindi ───────────── */

export type CardHi = { desc: string; codesLabel: string; codes: string[] }

export const CARD_HI: Record<string, CardHi> = {
  'cost-estimator': {
    desc: 'ठेकेदारों के लिए: अपने रेट लगाकर IS कोड की मात्राओं से घर का हिसाब लगाइए, क्लाइंट के लिए कोटेशन बनाइए और 3 कोटेशन तक की तुलना कीजिए।',
    codesLabel: 'कोड',
    codes: ['IS 456:2000', 'IS 1786:2008', 'IS 1077:1992', 'IS 2212', 'IS 1661:1972', 'IS 1893:2016'],
  },
  'documentation-pack': {
    desc: 'नौ रजिस्टर, जिनमें साइट पर जो कुछ हुआ उसका प्रमाण दर्ज रहता है। उसी समय का यह रिकॉर्ड तब काम आता है जब देरी या ख़ामी पर विवाद हो।',
    codesLabel: 'कोड',
    codes: ['IS 516', 'IS 1786:2008', 'IS 3495', 'IS 4031', 'IS 383', 'IS 2386', 'IS 456:2000'],
  },
  'billing-measurement': {
    desc: 'नापे हुए काम को भारतीय बिलिंग की पूरी कड़ी से गुज़ारता है: संयुक्त माप, BOQ के सामने एब्सट्रैक्ट, रिटेंशन/TDS/GST के साथ RA बिल, और अंत तक भुगतान की ट्रैकिंग।',
    codesLabel: 'कोड',
    codes: ['IS 1200', 'CPWD वर्क्स मैनुअल अध्याय 26', 'आयकर अधिनियम 2025, धारा 393(1)'],
  },
  'bar-bending-schedule': {
    desc: 'सरिये की डिटेल को कटिंग-लेंथ शेड्यूल और स्टील ऑर्डर नोट में बदलता है, हर मोड़ की कटौती और हुक का भत्ता कोड के अनुसार लगाकर।',
    codesLabel: 'कोड',
    codes: ['IS 2502:1963', 'IS 1786:2008', 'IS 456:2000', 'IS 13920:2016'],
  },
  'labour-compliance': {
    desc: 'साइट का पूरा पेरोल भारत के मौजूदा चार लेबर कोड (नवंबर 2025 से लागू) के हिसाब से चलाता है: PF, ESI, न्यूनतम मज़दूरी की जाँच और सब-कॉन्ट्रैक्टर के कम्प्लायंस होल्ड।',
    codesLabel: 'कोड',
    codes: [
      'वेतन संहिता 2019',
      'सामाजिक सुरक्षा संहिता 2020',
      'व्यावसायिक सुरक्षा, स्वास्थ्य और कार्य-स्थिति संहिता 2020',
      'औद्योगिक संबंध संहिता 2020',
    ],
  },
  'planning-progress': {
    desc: 'वैल्यू-वेटेड S-कर्व और अर्नड वैल्यू ट्रैकिंग, साथ में डिले/EOT रजिस्टर, जो घटनाओं को वैसे ही बाँटता है जैसे कॉन्ट्रैक्ट बाँटता है, नोटिस की आख़िरी तारीख़ की ट्रैकिंग सहित।',
    codesLabel: 'संदर्भ',
    codes: ['FIDIC रेड/येलो बुक', 'भारतीय संविदा अधिनियम 1872'],
  },
}

/* ───────────── the index page ───────────── */

const indexEn = {
  kicker: 'Site Templates · 6 Excel toolkits',
  h1: 'Downloadable Excel toolkits for running the job on site.',
  intro: 'Standalone spreadsheet packs, separate from the interactive calculators. Each is a set of linked sheets built to Indian standards and statutory practice: estimate, document, bill, schedule, comply, and control progress. They are built for contractors and site engineers, who work from their own rates. The reports for homeowners, which count the materials a house needs, are a separate product. Buy one toolkit, or take the full suite.',
  bundleAria: 'Site Operations Suite bundle',
  bundleKicker: 'The bundle · All 6 toolkits',
  bundleName: 'Site Operations Suite',
  bundleText: 'Every toolkit on this page — estimating, documentation, billing, bar bending, labour compliance, and planning & delay control — in one download.',
  separate: (price: string) => `${price} if bought separately`,
  separateAria: 'Separate price',
  save: (pct: number) => `Save about ${pct}%`,
  buyBundle: (price: string) => `Buy bundle · ${price}`,
  individually: (low: string, high: string) => `Or buy individually · ${low} to ${high}`,
  sheets: (n: number) => `${n} linked sheets`,
  details: 'Details',
  buy: (price: string) => `Buy · ${price}`,
  fineBefore: 'Secure payment by Razorpay. Toolkits are delivered as Excel (.xlsx) files, packaged as a .zip, via a secure download link shown here and emailed to you after checkout. ',
  fineLink: 'Licence, delivery and refund terms',
  fineAfter: '.',
}
const indexHi: typeof indexEn = {
  kicker: 'साइट टेम्पलेट · 6 Excel टूलकिट',
  h1: 'साइट पर काम चलाने के लिए डाउनलोड होने वाले Excel टूलकिट।',
  intro: 'अपने-आप में पूरे स्प्रेडशीट पैक, जो इंटरैक्टिव कैलकुलेटरों से अलग हैं। हर पैक आपस में जुड़ी शीटों का एक सेट है, जो भारतीय मानकों और क़ानूनी व्यवहार के हिसाब से बना है: अनुमान लगाना, दस्तावेज़ रखना, बिल बनाना, शेड्यूल बनाना, अनुपालन करना और प्रगति पर नज़र रखना। ये ठेकेदारों और साइट इंजीनियरों के लिए बने हैं, जो अपने रेट से काम करते हैं। घर बनवाने वालों की रिपोर्टें, जो घर के लिए ज़रूरी सामान की मात्रा गिनती हैं, अलग प्रोडक्ट हैं। एक टूलकिट ख़रीदिए, या पूरा सूट ले लीजिए।',
  bundleAria: 'साइट ऑपरेशंस सूट बंडल',
  bundleKicker: 'बंडल · सभी 6 टूलकिट',
  bundleName: 'साइट ऑपरेशंस सूट',
  bundleText: 'इस पेज के सभी टूलकिट — एस्टिमेशन, डॉक्यूमेंटेशन, बिलिंग, बार बेंडिंग, लेबर कम्प्लायंस, और प्लानिंग व डिले कंट्रोल — एक ही डाउनलोड में।',
  separate: (price: string) => `अलग-अलग ख़रीदने पर ${price}`,
  separateAria: 'अलग-अलग ख़रीदने की क़ीमत',
  save: (pct: number) => `लगभग ${pct}% की बचत`,
  buyBundle: (price: string) => `बंडल ख़रीदिए · ${price}`,
  individually: (low: string, high: string) => `या अलग-अलग ख़रीदिए · ${low} से ${high}`,
  sheets: (n: number) => `${n} आपस में जुड़ी शीट`,
  details: 'विवरण',
  buy: (price: string) => `ख़रीदिए · ${price}`,
  fineBefore: 'भुगतान Razorpay से सुरक्षित तरीक़े से होता है। टूलकिट Excel ([[.xlsx]]) फ़ाइलों के रूप में मिलते हैं, जो [[.zip]] में पैक होती हैं; चेकआउट के बाद डाउनलोड का सुरक्षित लिंक यहीं दिखता है और आपको ईमेल भी किया जाता है। ',
  fineLink: 'लाइसेंस, डिलीवरी और रिफ़ंड की शर्तें',
  fineAfter: '।',
}
export const INDEX: Copy<typeof indexEn> = { en: indexEn, hi: indexHi }

/* ───────────── the words every product page shares ───────────── */

const productEn = {
  crumbAria: 'Breadcrumb',
  crumbHome: 'Site Templates',
  sheets: (n: number) => `${n} linked sheets`,
  buyAria: 'Buy this toolkit',
  fineBefore: 'One payment, instant download. Secure payment by Razorpay. ',
  fineLink: 'Terms and refunds',
  fineAfter: '.',
  problem: 'The problem',
  inside: (n: number) => `What's inside · ${n} linked sheets`,
  everySheet: 'Every sheet, and what it does',
  fullList: 'Full sheet list',
  whoFor: "Who it's for",
  example: 'Worked example',
  getKit: 'Get the toolkit',
  ctaBefore: 'Delivered as an Excel (.xlsx) workbook in a .zip via a secure download link, shown here and emailed to you after checkout. Need all six? See the ',
  ctaLink: 'Site Operations Suite bundle',
  ctaAfter: '.',
  allKits: 'All toolkits',
}
const productHi: typeof productEn = {
  crumbAria: 'पेज का रास्ता',
  crumbHome: 'साइट टेम्पलेट',
  sheets: (n: number) => `${n} आपस में जुड़ी शीट`,
  buyAria: 'यह टूलकिट ख़रीदिए',
  fineBefore: 'एक बार भुगतान, तुरंत डाउनलोड। भुगतान Razorpay से सुरक्षित तरीक़े से होता है। ',
  fineLink: 'शर्तें और रिफ़ंड',
  fineAfter: '।',
  problem: 'समस्या',
  inside: (n: number) => `अंदर क्या है · ${n} आपस में जुड़ी शीट`,
  everySheet: 'हर शीट, और वह क्या करती है',
  fullList: 'शीट की पूरी सूची (शीट के नाम Excel फ़ाइल में जैसे हैं, वैसे ही दिए हैं)',
  whoFor: 'यह किसके लिए है',
  example: 'हल किया हुआ उदाहरण',
  getKit: 'टूलकिट पाइए',
  ctaBefore: 'Excel ([[.xlsx]]) वर्कबुक के रूप में, [[.zip]] में, सुरक्षित डाउनलोड लिंक से मिलता है; चेकआउट के बाद यह लिंक यहीं दिखता है और आपको ईमेल भी किया जाता है। छहों चाहिए? ',
  ctaLink: 'साइट ऑपरेशंस सूट बंडल',
  ctaAfter: ' देखिए।',
  allKits: 'सभी टूलकिट',
}
export const PRODUCT_UI: Copy<typeof productEn> = { en: productEn, hi: productHi }

/* ───────────── the buy dialog ───────────── */

const checkoutEn = {
  processing: 'Processing…',
  kicker: 'Checkout · Site Templates',
  emailIntro: 'Enter your email. Your download link is shown here after payment and also emailed to you, so you have it even if you close this tab.',
  emailLabel: 'Email address',
  termsBefore: 'By paying you accept the ',
  termsLink: 'Site Templates Terms',
  termsAfter: '. A downloaded file cannot be returned; a faulty one is fixed or refunded.',
  getPreview: 'Get download (preview mode)',
  toPayment: 'Continue to payment',
  cancel: 'Cancel',
  verifying: 'Verifying payment',
  oneMoment: 'One moment',
  confirming: 'Confirming your payment and preparing your secure download link…',
  confirmed: 'Payment confirmed',
  ready: (many: boolean) => `Your toolkit${many ? 's are' : ' is'} ready`,
  emailedOk: (many: boolean, email: string) => `We've also emailed ${many ? 'these links' : 'this link'} to ${email}. `,
  emailedFail: (many: boolean, email: string) => `We tried to email ${many ? 'these links' : 'this link'} to ${email} but delivery may have failed — download now to be safe. `,
  saveLink: (many: boolean, hours: number) => `Save your download link or check your email now — there is no login to retrieve this purchase later. Links are secure and expire in ${hours} hours; save the file${many ? 's' : ''} after downloading.`,
  downloadZip: 'Download .zip ↓',
  lostBefore: 'Lost the link? Write to ',
  lostAfter: ' from the email you bought with.',
  termsRefunds: ' Terms and refunds',
  termsRefundsAfter: '.',
  done: 'Done',
  wentWrong: 'Something went wrong',
  failed: 'Your payment could not be completed. If money was deducted it will be refunded automatically.',
  close: 'Close',
}
const checkoutHi: typeof checkoutEn = {
  processing: 'प्रोसेस हो रहा है…',
  kicker: 'चेकआउट · साइट टेम्पलेट',
  emailIntro: 'अपना ईमेल डालिए। भुगतान के बाद आपका डाउनलोड लिंक यहीं दिखेगा और आपको ईमेल भी किया जाएगा, ताकि यह टैब बंद करने पर भी वह आपके पास रहे।',
  emailLabel: 'ईमेल पता',
  termsBefore: 'भुगतान करके आप ',
  termsLink: 'साइट टेम्पलेट की शर्तें',
  termsAfter: ' मानते हैं। डाउनलोड की गई फ़ाइल लौटाई नहीं जा सकती; ख़राब फ़ाइल को ठीक किया जाता है या उसका रिफ़ंड किया जाता है।',
  getPreview: 'डाउनलोड पाइए (प्रीव्यू मोड)',
  toPayment: 'भुगतान पर आगे बढ़िए',
  cancel: 'रद्द कीजिए',
  verifying: 'भुगतान की जाँच हो रही है',
  oneMoment: 'ज़रा रुकिए',
  confirming: 'आपके भुगतान की पुष्टि हो रही है और सुरक्षित डाउनलोड लिंक तैयार किया जा रहा है…',
  confirmed: 'भुगतान की पुष्टि हो गई',
  ready: (many: boolean) => (many ? 'आपके टूलकिट तैयार हैं' : 'आपका टूलकिट तैयार है'),
  emailedOk: (many: boolean, email: string) => (many ? `हमने ये लिंक ${email} पर ईमेल भी कर दिए हैं। ` : `हमने यह लिंक ${email} पर ईमेल भी कर दिया है। `),
  emailedFail: (many: boolean, email: string) => (many
    ? `हमने ये लिंक ${email} पर ईमेल करने की कोशिश की, पर हो सकता है ईमेल न पहुँचा हो — इसलिए अभी डाउनलोड कर लीजिए। `
    : `हमने यह लिंक ${email} पर ईमेल करने की कोशिश की, पर हो सकता है ईमेल न पहुँचा हो — इसलिए अभी डाउनलोड कर लीजिए। `),
  saveLink: (many: boolean, hours: number) => `अपना डाउनलोड लिंक अभी सेव कर लीजिए या अपना ईमेल देख लीजिए — बाद में इस ख़रीदारी को वापस निकालने के लिए कोई लॉगिन नहीं है। लिंक सुरक्षित हैं और ${hours} घंटे में ख़त्म हो जाते हैं; डाउनलोड के बाद ${many ? 'फ़ाइलें' : 'फ़ाइल'} सँभालकर रखिए।`,
  downloadZip: 'डाउनलोड [[.zip]] ↓',
  lostBefore: 'लिंक खो गया? जिस ईमेल से ख़रीदा था, उसी से ',
  lostAfter: ' पर लिखिए।',
  termsRefunds: ' शर्तें और रिफ़ंड',
  termsRefundsAfter: '।',
  done: 'हो गया',
  wentWrong: 'कुछ गड़बड़ हो गई',
  failed: 'आपका भुगतान पूरा नहीं हो सका। अगर पैसे कट गए हैं तो वे अपने-आप वापस कर दिए जाएँगे।',
  close: 'बंद कीजिए',
}
export const CHECKOUT: Copy<typeof checkoutEn> = { en: checkoutEn, hi: checkoutHi }

/* ───────────── messages the buy flow keeps as English strings ───────────── */

const SOMETHING = 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।'
const OFFLINE = 'इंटरनेट से जुड़ नहीं पाए। अपना कनेक्शन देखकर फिर कोशिश कीजिए।'

export const CHECKOUT_DICT: Dict = {
  // typed in purchase.tsx
  'Please enter a valid email address.': 'कृपया सही ईमेल पता डालिए।',
  'Verification failed': 'भुगतान की जाँच नहीं हो पाई।',
  'Could not create order': 'ऑर्डर नहीं बन पाया।',
  'Payment SDK not loaded. Please refresh and try again.': 'भुगतान की विंडो लोड नहीं हुई। कृपया पेज रीफ़्रेश करके फिर कोशिश कीजिए।',
  'Payment verification failed.': 'भुगतान की जाँच नहीं हो पाई।',
  'Payment was not completed. You can try again.': 'भुगतान पूरा नहीं हुआ। आप फिर कोशिश कर सकते हैं।',
  'Something went wrong. Please try again.': SOMETHING,
  // sent by /api/site-templates/create-order and /verify
  'productId is required': 'कोई प्रोडक्ट चुना नहीं गया है।',
  'Unknown product': 'यह प्रोडक्ट पहचाना नहीं गया।',
  'Missing required fields': 'ज़रूरी जानकारी पूरी नहीं मिली।',
  'Invalid payment signature': 'भुगतान का सिग्नेचर सही नहीं मिला।',
  'Purchase record not found for this order': 'इस ऑर्डर की ख़रीदारी का रिकॉर्ड नहीं मिला।',
  'Could not prepare download links. Please contact support.': 'डाउनलोड लिंक तैयार नहीं हो पाए। कृपया सपोर्ट से संपर्क कीजिए।',
  'Internal server error': 'सर्वर में गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  'Failed to create payment order': 'भुगतान का ऑर्डर नहीं बन पाया। कृपया फिर कोशिश कीजिए।',
  'Razorpay credentials not configured': 'भुगतान की सेवा अभी चालू नहीं है।',
  'Razorpay API error: {0}': 'भुगतान की सेवा से ऑर्डर नहीं बन पाया। कृपया फिर कोशिश कीजिए।',
  // what a browser says when the request never got through, or the answer was not JSON
  'Failed to fetch': OFFLINE,
  'Load failed': OFFLINE,
  'NetworkError when attempting to fetch resource.': OFFLINE,
  'Unexpected token {0}': SOMETHING,
  'Unexpected end of JSON input': SOMETHING,
}

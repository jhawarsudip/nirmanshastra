/*
  Hindi for the About, Careers and Contact pages, written as English and Hindi objects of the same shape (a missing Hindi key fails tsc).
  Prices, the e-mail address and the founder line are NOT typed here: the pages read them from lib/tool-pricing.ts, lib/site-contact.ts
  and lib/founder.ts. Hindi says what the English says, no more (see the About page notes on the founder).
*/
import type { Copy } from '@/lib/i18n/copy'

/* ───────────── About ───────────── */

const aboutEn = {
  eyebrow: 'About',
  name: 'Quantities, worked out in the open',
  blurb: 'NirmanShastra tells you how much of each material a house needs, before you order or sign. It does not tell you what anything costs, and that is on purpose.',
  whyH: 'Why it exists',
  why1: 'A homeowner in India is usually handed a rate per square foot and little else. Behind any rate sits a list of quantities: cubic metres of concrete, kilograms of steel, bags of cement, bricks, metres of wire and pipe. The quantities are what can be checked against the Indian Standards. A rate cannot.',
  why2: 'So NirmanShastra works out the quantities first. We put no prices of our own on them, because prices change by town, by month and by who you buy from, and because a price laid over a wrong quantity is worse than no number at all. If you want the rupees, you can type the rates your dealer quotes into a report and it multiplies them by the quantities; labour, transport and taxes are not included.',
  whatH: 'What you get',
  whatSub: 'You answer a few plain questions about the plot and the plan. The quantities are worked out on our server, to the Indian Standards, and shown with a range around each one. Free calculators cover single questions such as the bricks in a wall or the size of a water tank.',
  head: ['Report', 'What it counts', 'Price'],
  counts: {
    struct: 'Concrete, steel, cement, sand, aggregate and shuttering for the reinforced-concrete frame: footings, columns, beams, slabs, stairs, balconies and an open parking floor.',
    mason: 'Bricks or blocks, mortar, plaster and lintels for the walls.',
    elec: 'Points, wire by size, conduit, switches, boards and circuits.',
    plumb: 'Water and drain pipe, fittings, tanks, pump, septic tank and soak pit.',
    int: 'Paint, putty, tiles, false ceiling, doors, windows and plywood.',
  } as Record<string, string>,
  grandName: 'Grand Total',
  grandWhat: 'The five reports together, with the overlaps counted once.',
  grandPrice: (p: string) => `${p} add-on, or included in the pack`,
  packName: 'Complete House Pack',
  packWhat: 'All five reports and the Grand Total, for one house, in one purchase.',
  packPrice: (pack: string, separate: string) => `${pack} (${separate} bought one by one)`,
  sureH: 'How sure it is, and what it cannot tell you',
  sure1: 'Every quantity comes with a low and a high figure, because a few answers cannot fix every dimension of a building. Real buildings also use more steel and concrete than a code minimum, so the StructurePro report sets its figures beside what 26 published bills of quantities show.',
  sure2a: 'Every standard a report relies on is named on the ',
  sure2link: 'IS Codes Used',
  sure2b: ' page, with what we take from it. Where we could not read a standard in full, or a figure is our assumption, that page says so.',
  whoH: 'Who builds it',
  who1: 'NirmanShastra is built and run by one person, with no outside funding. The founder spent a little over a year as a site engineer before moving to other work.',
  who2a: ' Your project details are not sold to contractors, builders or material suppliers; the ',
  who2link: 'privacy policy',
  who2b: ' has the exact terms.',
  warnTitle: 'Not a structural design',
  warn: 'A NirmanShastra report is for planning and for asking better questions. It is not a drawing, an approval or a quotation. Have the engineer who signs your drawings give the final bar bending schedule and confirm the earthquake zone for your town.',
  goK: 'Start',
  goH: 'See the frame of your house first',
  goA: 'The StructurePro form takes a few minutes, and you see your house in 3D before you pay. Already have a quote? ',
  goLink: 'Check what it counts',
  goB: '.',
  goBtn: 'Start with StructurePro',
}
const aboutHi: typeof aboutEn = {
  eyebrow: 'हमारे बारे में',
  name: 'मात्राएँ, सबके सामने निकाली हुई',
  blurb: 'NirmanShastra बताता है कि एक घर को हर सामग्री कितनी चाहिए, आपके ऑर्डर देने या दस्तख़त करने से पहले। यह नहीं बताता कि कोई चीज़ कितने की है, और यह जान-बूझकर है।',
  whyH: 'यह क्यों है',
  why1: 'भारत में घर बनवाने वाले को आम तौर पर प्रति वर्ग फ़ुट का एक रेट थमा दिया जाता है, और कुछ ख़ास नहीं। हर रेट के पीछे मात्राओं की एक सूची होती है: घन मीटर कंक्रीट, किलो स्टील, बैग सीमेंट, ईंटें, मीटर तार और पाइप। जिसे भारतीय मानकों से जाँचा जा सकता है, वह मात्राएँ हैं। रेट को नहीं जाँचा जा सकता।',
  why2: 'इसलिए NirmanShastra पहले मात्राएँ निकालता है। हम उन पर अपना कोई दाम नहीं लगाते, क्योंकि दाम शहर, महीने और आपके ख़रीदने की जगह के हिसाब से बदलते हैं, और ग़लत मात्रा पर चढ़ाया दाम किसी भी संख्या के न होने से बुरा है। रुपये देखने हों तो आपका डीलर जो रेट बताए, वह रिपोर्ट में डाल दीजिए और वह उसे मात्राओं से गुणा कर देगी; मज़दूरी, ढुलाई और टैक्स शामिल नहीं हैं।',
  whatH: 'आपको क्या मिलता है',
  whatSub: 'आप प्लॉट और नक्शे के बारे में कुछ सीधे सवालों के जवाब देते हैं। मात्राएँ हमारे सर्वर पर भारतीय मानकों के हिसाब से निकलती हैं, और हर एक के आसपास एक दायरे के साथ दिखाई जाती हैं। मुफ़्त कैलकुलेटर अकेले सवालों को सँभालते हैं, जैसे दीवार की ईंटें या पानी की टंकी का साइज़।',
  head: ['रिपोर्ट', 'क्या गिनती है', 'क़ीमत'],
  counts: {
    struct: 'प्रबलित कंक्रीट (RCC) ढाँचे के लिए कंक्रीट, स्टील, सीमेंट, रेत, गिट्टी और शटरिंग: फुटिंग, कॉलम, बीम, स्लैब, सीढ़ी, बालकनी और खुला पार्किंग तल।',
    mason: 'दीवारों के लिए ईंट या ब्लॉक, मसाला, प्लास्टर और लिंटल।',
    elec: 'पॉइंट, साइज़ के हिसाब से तार, कंड्यूट, स्विच, बोर्ड और सर्किट।',
    plumb: 'पानी और नाली का पाइप, फ़िटिंग, टंकियाँ, पंप, सेप्टिक टैंक और सोक पिट।',
    int: 'पेंट, पुट्टी, टाइल, फ़ॉल्स सीलिंग, दरवाज़े, खिड़कियाँ और प्लाईवुड।',
  },
  grandName: 'ग्रैंड टोटल',
  grandWhat: 'पाँचों रिपोर्ट एक साथ, जहाँ चीज़ें दोहराती हैं वहाँ एक ही बार गिनकर।',
  grandPrice: (p) => `${p} ऐड-ऑन, या पैक में शामिल`,
  packName: 'कम्प्लीट हाउस पैक',
  packWhat: 'पाँचों रिपोर्ट और ग्रैंड टोटल, एक घर के लिए, एक ही ख़रीद में।',
  packPrice: (pack, separate) => `${pack} (एक-एक करके ख़रीदने पर ${separate})`,
  sureH: 'यह कितना पक्का है, और क्या नहीं बता सकता',
  sure1: 'हर मात्रा के साथ एक कम और एक ज़्यादा आँकड़ा आता है, क्योंकि कुछ जवाब इमारत का हर नाप तय नहीं कर सकते। असली इमारतें कोड के न्यूनतम से ज़्यादा स्टील और कंक्रीट भी लेती हैं, इसलिए StructurePro रिपोर्ट अपने आँकड़े उसके बगल में रखती है जो 26 प्रकाशित बिल ऑफ़ क्वांटिटीज़ दिखाते हैं।',
  sure2a: 'रिपोर्ट जिस भी मानक पर टिकी है, उसका नाम ',
  sure2link: 'प्रयुक्त IS कोड',
  sure2b: ' पेज पर है, साथ में यह भी कि हम उससे क्या लेते हैं। जहाँ हम कोई मानक पूरा नहीं पढ़ पाए, या कोई आँकड़ा हमारी अपनी धारणा है, वहाँ वह पेज यह कह देता है।',
  whoH: 'इसे कौन बनाता है',
  who1: 'NirmanShastra को एक ही व्यक्ति बनाता और चलाता है, बिना किसी बाहरी फ़ंडिंग के। संस्थापक ने साइट इंजीनियर के रूप में एक साल से कुछ ज़्यादा समय काम किया, फिर वे दूसरे काम में चले गए।',
  who2a: ' आपके प्रोजेक्ट का ब्योरा ठेकेदारों, बिल्डरों या सामग्री के सप्लायरों को बेचा नहीं जाता; सटीक शर्तें ',
  who2link: 'गोपनीयता नीति',
  who2b: ' में हैं।',
  warnTitle: 'स्ट्रक्चरल डिज़ाइन नहीं',
  warn: 'NirmanShastra की रिपोर्ट योजना बनाने और बेहतर सवाल पूछने के लिए है। यह न ड्रॉइंग है, न मंज़ूरी, न कोटेशन। अंतिम बार बेंडिंग शेड्यूल और अपने शहर का भूकंप ज़ोन आपके ड्रॉइंग पर दस्तख़त करने वाले इंजीनियर से ही तय कराइए।',
  goK: 'शुरू कीजिए',
  goH: 'पहले अपने घर का ढाँचा देखिए',
  goA: 'StructurePro का फ़ॉर्म भरने में कुछ मिनट लगते हैं, और भुगतान से पहले आप अपना घर 3D में देख लेते हैं। कोटेशन पहले से है? ',
  goLink: 'देखिए कि उसमें क्या गिना गया है',
  goB: '।',
  goBtn: 'StructurePro से शुरू कीजिए',
}
export const ABOUT: Copy<typeof aboutEn> = { en: aboutEn, hi: aboutHi }

export const ABOUT_META_HI = {
  title: 'NirmanShastra के बारे में: पहले मात्राएँ, सबके सामने निकाली हुई',
  description:
    'NirmanShastra भारतीय मानकों के हिसाब से निकालता है कि एक घर को कितना कंक्रीट, स्टील, सीमेंट, ईंट, तार और पाइप चाहिए, और अपना कोई दाम नहीं लगाता: रुपये देखने के लिए आप अपने रेट जोड़ सकते हैं। इसे सिविल इंजीनियरिंग में B.Tech वाले, बिना बाहरी फ़ंडिंग के चलने वाले एक अकेले संस्थापक बनाते और चलाते हैं।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ, भारतीय मानकों के हिसाब से',
}

/* ───────────── Careers ───────────── */

const careersEn = {
  eyebrow: 'Careers',
  name: 'We are not hiring',
  blurb: 'NirmanShastra is run by one person, with no outside funding. There are no open roles and no plan to open any soon.',
  noteTitle: 'No open roles',
  note: 'A CV sent expecting a quick answer about an offer will not get one. If you still want to write, the people below are the ones whose notes are most useful.',
  whoH: 'Who we would like to hear from',
  engH: 'Civil and structural engineers',
  eng: 'You work to the Indian Standards, and you can read a bar bending schedule and spot where a quantity is off. Tell us which figure in a report you would not sign, and why.',
  devH: 'Developers',
  dev: 'You build careful, data-heavy interfaces in Next.js and TypeScript, and you care more about being correct than about being flashy. Construction knowledge helps but is not needed.',
  wrH: 'Writers',
  wr: 'You can explain a technical subject to a homeowner without talking down to them, and without inventing a number.',
  goK: 'Write in',
  goH: 'Say what you would fix first',
  go: 'Send a short note through the contact page. No CV template needed: tell us what you see.',
  goBtn: 'Write to us',
}
const careersHi: typeof careersEn = {
  eyebrow: 'करियर',
  name: 'हम भर्ती नहीं कर रहे',
  blurb: 'NirmanShastra को एक ही व्यक्ति चलाता है, बिना किसी बाहरी फ़ंडिंग के। कोई पद ख़ाली नहीं है, और जल्दी कोई खोलने की योजना भी नहीं।',
  noteTitle: 'कोई पद ख़ाली नहीं',
  note: 'जो CV इस उम्मीद से भेजा जाए कि ऑफ़र पर जल्दी जवाब मिलेगा, उसे वह जवाब नहीं मिलेगा। फिर भी लिखना चाहें, तो नीचे बताए लोगों के नोट हमारे सबसे ज़्यादा काम के हैं।',
  whoH: 'हम किनसे सुनना चाहेंगे',
  engH: 'सिविल और स्ट्रक्चरल इंजीनियर',
  eng: 'आप भारतीय मानकों के हिसाब से काम करते हैं, बार बेंडिंग शेड्यूल पढ़ सकते हैं और देख लेते हैं कि कोई मात्रा कहाँ ग़लत है। हमें बताइए कि रिपोर्ट के किस आँकड़े पर आप दस्तख़त नहीं करेंगे, और क्यों।',
  devH: 'डेवलपर',
  dev: 'आप Next.js और TypeScript में सावधानी से बने, डेटा से भरे इंटरफ़ेस बनाते हैं, और आपके लिए चमकदार होने से ज़्यादा सही होना मायने रखता है। निर्माण की जानकारी मदद करती है, पर ज़रूरी नहीं।',
  wrH: 'लेखक',
  wr: 'आप किसी तकनीकी विषय को घर बनवाने वाले को बिना नीचा दिखाए और बिना कोई संख्या गढ़े समझा सकते हैं।',
  goK: 'लिख भेजिए',
  goH: 'बताइए कि आप सबसे पहले क्या ठीक करेंगे',
  go: 'संपर्क पेज से एक छोटा नोट भेजिए। CV के किसी साँचे की ज़रूरत नहीं: हमें बताइए कि आपको क्या दिखता है।',
  goBtn: 'हमें लिखिए',
}
export const CAREERS: Copy<typeof careersEn> = { en: careersEn, hi: careersHi }

export const CAREERS_META_HI = {
  title: 'करियर: NirmanShastra भर्ती नहीं कर रहा',
  description:
    'NirmanShastra एक अकेले व्यक्ति की, बिना बाहरी फ़ंडिंग की कंपनी है और इसमें कोई पद ख़ाली नहीं है। अगर आप सॉफ़्टवेयर बनाते हैं, निर्माण पर लिखते हैं या साइट पर काम करते हैं, और मदद करना चाहते हैं, तब भी आप लिख सकते हैं।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

/* ───────────── Contact ───────────── */

const contactEn = {
  eyebrow: 'Contact',
  name: 'Write to us',
  blurb: 'Questions about a quantity report, a standard it cites, or a payment. Based in India, serving homeowners across India.',
  formH: 'Send a message',
  sentTitle: 'Message sent',
  sent: 'We will get back to you within 24 to 48 hours on business days.',
  nameL: 'Name',
  nameP: 'Your full name',
  emailL: 'Email',
  subjectL: 'Subject',
  subjectP: 'What is this about?',
  messageL: 'Message',
  messageP: 'Your message',
  errTitle: 'Something went wrong',
  err: (email: string) => `Please email us directly at ${email}.`,
  sending: 'Sending…',
  send: 'Send message',
  asideAria: 'Contact details',
  directH: 'Direct contact',
  emailK: 'Email',
  locK: 'Location',
  loc: 'Uttar Pradesh, India',
  respK: 'Response time',
  resp: 'Within 24 to 48 hours on business days',
  includeH: 'What to include',
  include: [
    'Your state and city (the earthquake zone and wind speed depend on them)',
    'Which tool you used or are asking about',
    'A short description of the question or the problem',
    'Your estimate ID, if you have one (it is in your PDF report)',
  ],
}
const contactHi: typeof contactEn = {
  eyebrow: 'संपर्क',
  name: 'हमें लिखिए',
  blurb: 'मात्रा रिपोर्ट, उसमें हवाला दिए गए किसी मानक, या भुगतान के बारे में सवाल। भारत में स्थित, पूरे भारत के घर बनवाने वालों के लिए।',
  formH: 'संदेश भेजिए',
  sentTitle: 'संदेश भेज दिया गया',
  sent: 'हम कामकाजी दिनों में 24 से 48 घंटे के भीतर आपको जवाब देंगे।',
  nameL: 'नाम',
  nameP: 'आपका पूरा नाम',
  emailL: 'ईमेल',
  subjectL: 'विषय',
  subjectP: 'यह किस बारे में है?',
  messageL: 'संदेश',
  messageP: 'आपका संदेश',
  errTitle: 'कुछ गड़बड़ हो गई',
  err: (email) => `कृपया हमें सीधे ${email} पर ईमेल कीजिए।`,
  sending: 'भेजा जा रहा है…',
  send: 'संदेश भेजिए',
  asideAria: 'संपर्क का ब्योरा',
  directH: 'सीधा संपर्क',
  emailK: 'ईमेल',
  locK: 'जगह',
  loc: 'उत्तर प्रदेश, भारत',
  respK: 'जवाब का समय',
  resp: 'कामकाजी दिनों में 24 से 48 घंटे के भीतर',
  includeH: 'क्या लिखें',
  include: [
    'आपका राज्य और शहर (भूकंप ज़ोन और हवा की रफ़्तार इन्हीं पर निर्भर हैं)',
    'आपने कौन-सा टूल इस्तेमाल किया या किसके बारे में पूछ रहे हैं',
    'सवाल या दिक़्क़त का छोटा-सा ब्योरा',
    'आपकी एस्टिमेट ID, अगर हो (वह आपकी PDF रिपोर्ट में है)',
  ],
}
export const CONTACT: Copy<typeof contactEn> = { en: contactEn, hi: contactHi }

export const CONTACT_META_HI = {
  title: 'NirmanShastra से संपर्क करें',
  description:
    'मात्रा रिपोर्ट, उसमें हवाला दिए गए किसी मानक, या भुगतान के बारे में सवाल हैं? NirmanShastra को लिखिए। हम कामकाजी दिनों में 24 से 48 घंटे के भीतर जवाब देते हैं।',
  imageAlt: 'NirmanShastra: भारतीय घरों के लिए सामग्री की मात्राएँ',
}

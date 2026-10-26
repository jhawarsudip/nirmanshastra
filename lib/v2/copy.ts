// Plain-language, homeowner-first copy for the homepage. EN + HI side by side.
// Rule: no IS-code numbers, formulas or site jargon in headlines or body text. The numbers and the rules
// behind them live behind each section's "Show the calculation" button (components/v2/Calc.tsx) and in the
// "Where do the numbers come from?" section. Every number here is either from the quantity model
// (lib/structopro-qty and lib/qty) or labelled as a sample.
// QUANTITY-ONLY: nothing on the page is a rupee figure, a rate, a labour cost or a "what it should cost".

export type Bi = { en: string; hi: string }
export type Loc = 'en' | 'hi'

export const pick = (b: Bi, l: Loc) => b[l]

export const NAV = {
  how: { en: 'How it works', hi: 'कैसे काम करता है' },
  build: { en: 'How a house is built', hi: 'घर कैसे बनता है' },
  quote: { en: 'Check a quote', hi: 'कोटेशन जाँचें' },
  pricing: { en: 'Pricing', hi: 'मूल्य' },
  tools: { en: 'Our tools', hi: 'हमारे टूल' },
  pros: { en: 'For builders', hi: 'बिल्डर के लिए' },
  prosLong: { en: 'For builders & engineers', hi: 'बिल्डर और इंजीनियर के लिए' },
  login: { en: 'Log in', hi: 'लॉग इन' },
  start: { en: 'Start free', hi: 'मुफ़्त शुरू करें' },
  menu: { en: 'Open menu', hi: 'मेन्यू खोलें' },
  close: { en: 'Close menu', hi: 'मेन्यू बंद करें' },
  night: { en: 'Switch day / night', hi: 'दिन / रात बदलें' },
  calm: { en: 'Calm mode (stop motion)', hi: 'शांत मोड (हलचल बंद)' },
  skip: { en: 'Skip to content', hi: 'सामग्री पर जाएँ' },
  lang: { en: 'Language', hi: 'भाषा' },
  forHome: { en: 'For your home', hi: 'आपके घर के लिए' },
  freeCalcs: { en: 'Free calculators', hi: 'मुफ़्त कैलकुलेटर' },
  siteKits: { en: 'Site toolkits (Excel)', hi: 'साइट टूलकिट (Excel)' },
}

export const HERO = {
  eyebrow: { en: 'For people building their own home', hi: 'अपना घर बनवाने वालों के लिए' },
  h1a: { en: 'Know exactly how much your house needs', hi: 'जानिए आपके घर को ठीक कितना सामान चाहिए' },
  h1b: { en: 'before you place the order.', hi: 'ऑर्डर देने से पहले।' },
  sub: {
    en: 'Tell us the size of your house. We work out its frame the way an engineer would, then tell you how much concrete, steel, cement, bricks and sand it needs. Exact quantities, so every quote you get can be checked against them.',
    hi: 'अपने घर का साइज़ बताइए। हम इसके ढाँचे को वैसे ही निकालते हैं जैसे इंजीनियर निकालता है, फिर बताते हैं कि कितना कंक्रीट, स्टील, सीमेंट, ईंट और रेत लगेगा। सटीक मात्राएँ, ताकि आपको मिला हर कोटेशन उनसे जाँचा जा सके।',
  },
  cta1: { en: 'Check my plan for Vastu, free', hi: 'मेरे नक्शे की वास्तु जाँच, मुफ़्त' },
  cta2: { en: "Check my contractor's quantities", hi: 'मेरे ठेकेदार की मात्राएँ जाँचें' },
  chips: [
    { en: 'Exact quantities. Add your own rates to see the rupees.', hi: 'सटीक मात्राएँ। रुपये देखने के लिए अपने रेट जोड़ें।' },
    { en: 'Hindi & English', hi: 'हिंदी और English' },
    { en: 'Checked against Indian Standards', hi: 'भारतीय मानकों (IS) से जाँचा' },
  ] as Bi[],
  scroll: { en: 'scroll to watch a house get built', hi: 'स्क्रॉल कीजिए, घर बनते देखिए' },
}

/** The hero widget: area + floors in, the frame of the house out (grid, columns, footings, beams, slab panels). The model runs on the server; no material quantity is shown here. */
export const EST = {
  title: { en: 'What does the frame of your house look like?', hi: 'आपके घर का ढाँचा कैसा दिखेगा?' },
  lede: {
    en: 'The frame is the part that holds the house up: foundation, columns, beams and slabs. Move the sliders and see how an engineer would lay it out.',
    hi: 'ढाँचा यानी घर को थामने वाला हिस्सा: नींव, कॉलम, बीम और स्लैब। स्लाइडर चलाइए और देखिए कि इंजीनियर इसे कैसे बिछाएगा।',
  },
  area: { en: 'Area of one floor', hi: 'एक मंज़िल का एरिया' },
  sqft: { en: 'sq ft', hi: 'वर्ग फ़ुट' },
  floors: { en: 'How many floors?', hi: 'कितनी मंज़िलें?' },
  floorOpts: [
    { v: 1, en: 'Ground only', hi: 'सिर्फ़ ग्राउंड' },
    { v: 2, en: 'Ground + 1', hi: 'ग्राउंड + 1' },
    { v: 3, en: 'Ground + 2', hi: 'ग्राउंड + 2' },
    { v: 4, en: 'Ground + 3', hi: 'ग्राउंड + 3' },
    { v: 5, en: 'Ground + 4', hi: 'ग्राउंड + 4' },
  ],
  builtUp: { en: 'All floors together', hi: 'सभी मंज़िलें मिलाकर' },
  planTitle: { en: 'Ground floor, seen from above', hi: 'ग्राउंड फ़्लोर, ऊपर से देखने पर' },
  planKey: { en: 'Columns joined by beams', hi: 'बीम से जुड़े कॉलम' },
  loading: { en: 'Laying out the frame…', hi: 'ढाँचा बिछाया जा रहा है…' },
  failed: { en: 'We could not draw the frame just now. Please try again in a moment.', hi: 'अभी ढाँचा नहीं बन पाया। कृपया थोड़ी देर में फिर कोशिश कीजिए।' },
  tiles: {
    size: { en: 'Plan size', hi: 'नक्शे का साइज़' },
    grid: { en: 'Grid of columns', hi: 'कॉलम का ग्रिड' },
    cols: { en: 'Columns on each floor', hi: 'हर मंज़िल पर कॉलम' },
    foot: { en: 'Footings', hi: 'फुटिंग' },
    raft: { en: 'Foundation', hi: 'नींव' },
    beams: { en: 'Beams on each floor', hi: 'हर मंज़िल पर बीम' },
    slabs: { en: 'Slab panels on each floor', hi: 'हर मंज़िल पर स्लैब पैनल' },
  },
  bays: { en: 'bays', hi: 'खाने' },
  oneRaft: { en: 'One raft', hi: 'एक रैफ़्ट' },
  fine: {
    en: 'This is the shape of the frame for a typical plot, with columns about every 3.75 m. Your own plot and plan will change it. How much concrete, steel and cement the frame takes is in the full report.',
    hi: 'यह एक सामान्य प्लॉट के ढाँचे का आकार है, जिसमें कॉलम क़रीब हर 3.75 मीटर पर हैं। आपके अपने प्लॉट और नक्शे से यह बदलेगा। इस ढाँचे में कितना कंक्रीट, स्टील और सीमेंट लगेगा, यह पूरी रिपोर्ट में है।',
  },
  ctaH: { en: 'Want the quantities for your own plan?', hi: 'अपने नक्शे की मात्राएँ चाहिए?' },
  ctaP: {
    en: 'The full report sizes every footing, column, beam and slab for your plot, then counts the concrete, the steel by bar size, and the cement, sand and aggregate to buy. Exact quantities. Add your own rates to see the rupees.',
    hi: 'पूरी रिपोर्ट आपके प्लॉट के लिए हर फुटिंग, कॉलम, बीम और स्लैब का साइज़ तय करती है, फिर कंक्रीट, सरिया (साइज़ के हिसाब से) और ख़रीदने के लिए सीमेंट, रेत और गिट्टी गिनती है। सटीक मात्राएँ। रुपये देखने के लिए अपने रेट जोड़ें।',
  },
  next: { en: 'Get the quantities for my house', hi: 'मेरे घर की मात्राएँ पाएँ' },
  // calculation drawer
  calcRows: {
    built: { en: 'House size', hi: 'घर का साइज़' },
    one: { en: 'One floor in square metres', hi: 'एक मंज़िल वर्ग मीटर में' },
    plan: { en: 'Plan of one floor', hi: 'एक मंज़िल का नक्शा' },
    grid: { en: 'Columns along each side', hi: 'हर तरफ़ कॉलम' },
    cols: { en: 'Columns on each floor', hi: 'हर मंज़िल पर कॉलम' },
  },
  calcNote: {
    en: 'A typical plot is taken to be 1.3 times as long as it is wide. Columns go about every 3.75 m, which is usual for houses, and never more than 5 m apart. The full report goes on to size each member to IS 456:2000, IS 875 and IS 1893 and counts the materials.',
    hi: 'एक सामान्य प्लॉट की लंबाई चौड़ाई से 1.3 गुना मानी गई है। कॉलम क़रीब हर 3.75 मीटर पर लगते हैं, जो घरों के लिए आम है, और 5 मीटर से ज़्यादा दूर कभी नहीं। पूरी रिपोर्ट आगे हर हिस्से का साइज़ IS 456:2000, IS 875 और IS 1893 से तय करती है और सामग्री गिनती है।',
  },
}

/** The ticker under the hero: questions every homeowner has. */
export const TAPE = [
  { en: 'How many bags of cement?', hi: 'कितने बैग सीमेंट?' },
  { en: 'How much steel?', hi: 'कितना स्टील?' },
  { en: 'How many bricks?', hi: 'कितनी ईंटें?' },
  { en: 'How much sand?', hi: 'कितनी रेत?' },
  { en: 'How many metres of wire?', hi: 'कितने मीटर तार?' },
  { en: 'How much pipe?', hi: 'कितना पाइप?' },
  { en: 'Are my contractor’s quantities right?', hi: 'क्या मेरे ठेकेदार की मात्राएँ सही हैं?' },
  { en: 'Does my plan follow Vastu?', hi: 'क्या मेरा नक्शा वास्तु के अनुसार है?' },
  { en: 'Exact quantities. Add your own rates to see the rupees.', hi: 'सटीक मात्राएँ। रुपये देखने के लिए अपने रेट जोड़ें।' },
  { en: 'Hindi & English', hi: 'हिंदी और English' },
] as Bi[]

export const QUOTE_PROBLEMS = {
  eyebrow: { en: 'Before you sign anything', hi: 'कुछ भी साइन करने से पहले' },
  title: { en: 'Why quotes are so hard to check', hi: 'कोटेशन जाँचना इतना मुश्किल क्यों है' },
  lede: {
    en: 'It is not always dishonest. A quote just rarely says how much of anything it counts. Here is what gets in the way.',
    hi: 'ज़रूरी नहीं कि यह बेईमानी हो। बस कोटेशन में शायद ही कभी लिखा होता है कि उसमें कितनी सामग्री गिनी गई है। रास्ते में ये चीज़ें आती हैं।',
  },
  hoverHint: { en: 'Hover or tap a card', hi: 'किसी कार्ड पर हाथ रखिए या टैप कीजिए' },
  cards: [
    {
      title: { en: 'A lump sum, no quantities', hi: 'एकमुश्त रकम, कोई मात्रा नहीं' },
      body: {
        en: 'Many quotes give one total. You cannot see how many bags of cement or kilos of steel it counts, so you cannot check it.',
        hi: 'कई कोटेशन बस एक कुल रकम देते हैं। आप नहीं देख पाते कि उसमें कितने बैग सीमेंट या कितने किलो स्टील गिने गए हैं, इसलिए उसे जाँच नहीं सकते।',
      },
    },
    {
      title: { en: 'One rate per sq ft hides the details', hi: 'प्रति वर्ग फ़ुट का एक रेट सब छिपा देता है' },
      body: {
        en: 'A single rate per sq ft sounds simple. But brick counts, mortar mix and pipe sizes can quietly change inside it.',
        hi: 'प्रति वर्ग फ़ुट का एक रेट सीधा लगता है। पर ईंटों की गिनती, मसाले का मिश्रण और पाइप का साइज़ इसके अंदर चुपचाप बदल सकते हैं।',
      },
    },
    {
      title: { en: 'Five trades, five lists, no total', hi: 'पाँच काम, पाँच सूचियाँ, कोई कुल योग नहीं' },
      body: {
        en: 'Structure, brickwork, electrical, plumbing and interiors are each counted their own way. Nobody puts them into one list of what to buy.',
        hi: 'ढाँचा, चिनाई, इलेक्ट्रिकल, प्लंबिंग और इंटीरियर, सबकी गिनती अपने-अपने ढंग से होती है। कोई भी उन्हें ख़रीदने की एक सूची में नहीं जोड़ता।',
      },
    },
  ] as { title: Bi; body: Bi }[],
}

/** Labels for the "Show the calculation" disclosure (components/v2/Calc.tsx). */
export const CALC = {
  show: { en: 'Show the calculation', hi: 'गणना दिखाइए' },
  hide: { en: 'Hide the calculation', hi: 'गणना छिपाइए' },
  title: { en: 'How we got this', hi: 'यह कैसे निकला' },
  rule: { en: 'Rule', hi: 'नियम' },
  working: { en: 'Working', hi: 'हिसाब' },
  result: { en: 'Result', hi: 'नतीजा' },
  standards: { en: 'Standards behind it', hi: 'इसके पीछे के मानक' },
}

/** One plain line per tool, for menus and cards. Product names stay; these say what each one does. */
export const TOOL_PLAIN: Record<string, Bi> = {
  vastu: { en: 'Check your plan, room by room', hi: 'अपने नक्शे को कमरे-दर-कमरे जाँचें' },
  struct: { en: 'Foundation, columns, beams and slab', hi: 'नींव, कॉलम, बीम और स्लैब' },
  mason: { en: 'Bricks, plaster and waterproofing', hi: 'ईंट, प्लास्टर और वॉटरप्रूफ़िंग' },
  elec: { en: 'Wiring, switches and earthing', hi: 'वायरिंग, स्विच और अर्थिंग' },
  plumb: { en: 'Water supply, drains and tank', hi: 'पानी की सप्लाई, नाली और टंकी' },
  int: { en: 'Floors, kitchen, paint and ceilings', hi: 'फ़र्श, रसोई, पेंट और सीलिंग' },
}

export const FOOT = {
  tag: { en: 'Build with certainty.', hi: 'भरोसे के साथ बनाइए।' },
  tools: { en: 'Our tools', hi: 'हमारे टूल' },
  calcs: { en: 'Free calculators', hi: 'मुफ़्त कैलकुलेटर' },
  kits: { en: 'Site toolkits', hi: 'साइट टूलकिट' },
  company: { en: 'Company', hi: 'कंपनी' },
  legal: { en: 'Legal', hi: 'क़ानूनी' },
  note: {
    en: 'Estimates are planning numbers for budgeting, not a quote and not a structural approval. Have a licensed engineer sign off before you build.',
    hi: 'ये अनुमान बजट के लिए योजना की संख्याएँ हैं। ये कोटेशन या स्ट्रक्चरल मंज़ूरी नहीं हैं। निर्माण से पहले लाइसेंस प्राप्त इंजीनियर से मंज़ूरी लीजिए।',
  },
  free: { en: 'Free', hi: 'मुफ़्त' },
  top: { en: 'Back to top', hi: 'ऊपर जाएँ' },
} as Record<string, Bi>

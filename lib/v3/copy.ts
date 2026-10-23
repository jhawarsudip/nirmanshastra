// Plain-language, homeowner-first copy for the v3 ("Storybook") homepage. EN + HI side by side.
// Rule: no IS-code numbers or site jargon in headlines. Standards live in the Trust section only.
// Every number here is either from the engine/locked Build Reference or labelled as a sample.

export type Bi = { en: string; hi: string }
export type Loc = 'en' | 'hi'

export const pick = (b: Bi, l: Loc) => b[l]

export const NAV = {
  how: { en: 'How it works', hi: 'कैसे काम करता है' },
  pricing: { en: 'Pricing', hi: 'मूल्य' },
  quote: { en: 'Check a quote', hi: 'कोटेशन जाँचें' },
  blog: { en: 'Blog', hi: 'ब्लॉग' },
  faq: { en: 'Questions', hi: 'सवाल' },
  pros: { en: 'For builders & engineers', hi: 'बिल्डर और इंजीनियर के लिए' },
  prosShort: { en: 'For builders', hi: 'बिल्डर के लिए' },
  login: { en: 'Log in', hi: 'लॉग इन' },
  start: { en: 'Start free', hi: 'मुफ़्त शुरू करें' },
  reports: { en: 'My reports', hi: 'मेरी रिपोर्ट' },
  logout: { en: 'Log out', hi: 'लॉग आउट' },
  menu: { en: 'Open menu', hi: 'मेन्यू खोलें' },
  close: { en: 'Close menu', hi: 'मेन्यू बंद करें' },
  night: { en: 'Switch day / night', hi: 'दिन / रात बदलें' },
  calm: { en: 'Calm mode (stop motion)', hi: 'शांत मोड (हलचल बंद)' },
  calmOn: { en: 'Calm on · motion off', hi: 'शांत मोड चालू' },
  calmOff: { en: 'Motion on', hi: 'हलचल चालू' },
  skip: { en: 'Skip to content', hi: 'सामग्री पर जाएँ' },
  lang: { en: 'Language', hi: 'भाषा' },
  tools: { en: 'Our tools', hi: 'हमारे टूल' },
}

export const HERO = {
  h1a: { en: 'Know what your house really needs', hi: 'जानिए आपके घर में असल में क्या लगेगा' },
  h1b: { en: 'before you sign the quote.', hi: 'कोटेशन पर साइन करने से पहले।' },
  sub: {
    en: "Tell us the size of your house. We'll tell you how much cement, steel, bricks and sand it needs, and what that should cost. No engineering degree needed.",
    hi: 'अपने घर का साइज़ बताइए। हम बताएँगे कि कितना सीमेंट, स्टील, ईंट और रेत लगेगा, और उसका ख़र्च कितना होना चाहिए। इंजीनियरिंग की डिग्री की ज़रूरत नहीं।',
  },
  cta1: { en: 'Check my house, free', hi: 'मेरा घर जाँचें, मुफ़्त' },
  cta2: { en: "Is my contractor's quote fair?", hi: 'क्या मेरे ठेकेदार का कोटेशन ठीक है?' },
  chips: [
    { en: 'Free to start', hi: 'मुफ़्त शुरुआत' },
    { en: 'No engineering degree needed', hi: 'इंजीनियरिंग डिग्री की ज़रूरत नहीं' },
    { en: 'Hindi & English', hi: 'हिंदी और English' },
    { en: 'Checked against Indian Standards', hi: 'भारतीय मानकों (IS) से जाँचा' },
  ] as Bi[],
  note: { en: 'watch a house get built', hi: 'देखिए घर कैसे बनता है' },
  sceneLabel: {
    en: 'Illustration of a two-storey house being built step by step: foundation, columns, walls, roof, then a family moving in.',
    hi: 'दो मंज़िला घर के चरण-दर-चरण बनने का चित्र: नींव, कॉलम, दीवारें, छत, फिर परिवार का गृह-प्रवेश।',
  },
}

export const DOORS = {
  title: { en: 'What do you want to find out?', hi: 'आप क्या जानना चाहते हैं?' },
  items: [
    {
      key: 'material',
      title: { en: 'How much material will my house need?', hi: 'मेरे घर में कितना सामान लगेगा?' },
      body: {
        en: 'Cement, steel, bricks, sand: in numbers you can take to your contractor.',
        hi: 'सीमेंट, स्टील, ईंट, रेत: ऐसे आँकड़े जो आप ठेकेदार के पास ले जा सकें।',
      },
      cta: { en: 'Try it now', hi: 'अभी आज़माएँ' },
      href: '#try',
      tone: 'indigo',
    },
    {
      key: 'quote',
      title: { en: "Is my contractor's quote fair?", hi: 'क्या मेरे ठेकेदार का कोटेशन ठीक है?' },
      body: {
        en: "Put the quote next to a proper breakdown and see which lines look high, line by line.",
        hi: 'कोटेशन को सही ब्रेकडाउन के साथ रखकर देखिए कि कौन सी लाइन ज़्यादा लग रही है।',
      },
      cta: { en: 'Compare a quote', hi: 'कोटेशन की तुलना करें' },
      href: '/compare-quote',
      tone: 'marigold',
    },
    {
      key: 'vastu',
      title: { en: 'Does my plan follow Vastu?', hi: 'क्या मेरा नक्शा वास्तु के अनुसार है?' },
      body: {
        en: 'A free check of every room in your plan, with a score, simple remedies and a PDF report.',
        hi: 'आपके नक्शे के हर कमरे की मुफ़्त जाँच: स्कोर, आसान उपाय और PDF रिपोर्ट के साथ।',
      },
      cta: { en: 'Check my Vastu, free', hi: 'मेरा वास्तु जाँचें, मुफ़्त' },
      href: '/tools/vastu-pro',
      tone: 'leaf',
    },
  ],
}

export const TRY = {
  title: { en: 'Try it: what does the frame of your house need?', hi: 'आज़माइए: आपके घर के ढाँचे में क्या लगेगा?' },
  lede: {
    en: 'The frame is the foundation, columns, beams and slabs. Move the slider and see the cement and steel it takes.',
    hi: 'ढाँचा यानी नींव, कॉलम, बीम और स्लैब। स्लाइडर चलाइए और देखिए कितना सीमेंट और स्टील लगेगा।',
  },
  area: { en: 'Built-up area (all floors together)', hi: 'बिल्ट-अप एरिया (सभी मंज़िलें मिलाकर)' },
  sqft: { en: 'sq ft', hi: 'वर्ग फ़ुट' },
  floors: { en: 'How many floors?', hi: 'कितनी मंज़िलें?' },
  floorOpts: [
    { v: 0, en: 'Ground floor only', hi: 'सिर्फ़ ग्राउंड फ़्लोर' },
    { v: 1, en: 'Ground + 1', hi: 'ग्राउंड + 1' },
    { v: 2, en: 'Ground + 2', hi: 'ग्राउंड + 2' },
    { v: 3, en: 'Ground + 3', hi: 'ग्राउंड + 3' },
    { v: 4, en: 'Ground + 4 or more', hi: 'ग्राउंड + 4 या ज़्यादा' },
  ],
  cement: { en: 'Cement', hi: 'सीमेंट' },
  steel: { en: 'Steel bars', hi: 'स्टील सरिया' },
  bags: { en: 'bags', hi: 'बैग' },
  kg: { en: 'kg', hi: 'किलो' },
  tonnes: { en: 'tonnes', hi: 'टन' },
  total: { en: 'Rough cost of just these two', hi: 'सिर्फ़ इन दोनों का मोटा ख़र्च' },
  rates: { en: 'Prices used (change them to your city)', hi: 'इस्तेमाल हुए भाव (अपने शहर के भाव डालें)' },
  perBag: { en: '₹ per 50 kg bag', hi: '₹ प्रति 50 किलो बैग' },
  perKg: { en: '₹ per kg', hi: '₹ प्रति किलो' },
  note: {
    en: 'A rule of thumb for houses up to Ground + 3. It is a planning number, not a quote. Starting prices are Pune 2026.',
    hi: 'यह ग्राउंड + 3 तक के घरों के लिए अंदाज़े का नियम है। यह योजना बनाने का आँकड़ा है, कोटेशन नहीं। शुरुआती भाव पुणे 2026 के हैं।',
  },
  noteOutside: {
    en: 'This rule is tuned for Ground + 1 to Ground + 3. For your floors, the full report adjusts it.',
    hi: 'यह नियम ग्राउंड + 1 से ग्राउंड + 3 के लिए बना है। आपकी मंज़िलों के लिए पूरी रिपोर्ट इसे ठीक करती है।',
  },
  next: {
    en: 'The full report lists foundation, columns, beams and slab separately for your real plan, plus sand, aggregate and more.',
    hi: 'पूरी रिपोर्ट आपके असली नक्शे के लिए नींव, कॉलम, बीम और स्लैब अलग-अलग गिनती है, साथ में रेत, गिट्टी और बहुत कुछ।',
  },
  nextCta: { en: 'Get the full report', hi: 'पूरी रिपोर्ट पाएँ' },
}

export interface Stage {
  n: number
  title: Bi
  what: Bi
  ask: Bi
}

export const STORY = {
  title: { en: 'How a house gets built, and what to ask your contractor', hi: 'घर कैसे बनता है, और ठेकेदार से क्या पूछें' },
  lede: {
    en: 'Seven steps. Scroll down and watch the house grow. Each step has one question worth asking.',
    hi: 'सात चरण। नीचे स्क्रॉल कीजिए और घर को बनते देखिए। हर चरण में एक सवाल है जो पूछना बनता है।',
  },
  askLabel: { en: 'Ask your contractor', hi: 'ठेकेदार से पूछिए' },
  stageLabel: { en: 'Step', hi: 'चरण' },
  stages: [
    {
      n: 1,
      title: { en: 'Foundation', hi: 'नींव' },
      what: {
        en: 'The foundation spreads the weight of the whole house onto the soil. It gets buried, so almost nobody checks it once the earth is filled back.',
        hi: 'नींव पूरे घर का वज़न मिट्टी पर फैलाती है। यह दब जाती है, इसलिए मिट्टी भरने के बाद इसे कोई नहीं देखता।',
      },
      ask: { en: 'What soil is under my plot, and how deep is the foundation going?', hi: 'मेरे प्लॉट की मिट्टी कैसी है, और नींव कितनी गहरी जाएगी?' },
    },
    {
      n: 2,
      title: { en: 'Columns', hi: 'कॉलम' },
      what: {
        en: 'Columns carry the weight of every floor down to the foundation. They are the bones of your house.',
        hi: 'कॉलम हर मंज़िल का वज़न नीचे नींव तक पहुँचाते हैं। ये आपके घर की हड्डियाँ हैं।',
      },
      ask: { en: 'What size are my columns, and how many steel bars go in each one?', hi: 'मेरे कॉलम कितने साइज़ के हैं, और हर में कितने सरिये लगेंगे?' },
    },
    {
      n: 3,
      title: { en: 'Plinth beam', hi: 'प्लिंथ बीम' },
      what: {
        en: 'A beam at ground level ties the columns together and carries the walls above. It helps stop cracks if the ground settles a little.',
        hi: 'ज़मीन के स्तर की यह बीम कॉलमों को आपस में बाँधती है और ऊपर की दीवारों को सहारा देती है। मिट्टी थोड़ी बैठे तो दरारें रोकने में मदद करती है।',
      },
      ask: { en: 'Does the plinth beam run all the way around the house without a break?', hi: 'क्या प्लिंथ बीम पूरे घर में बिना टूटे चारों तरफ़ जाएगी?' },
    },
    {
      n: 4,
      title: { en: 'Brick walls', hi: 'ईंट की दीवारें' },
      what: {
        en: 'In a framed house the walls fill the gaps between the columns. A 9-inch wall takes about 100 bricks for every square metre, so the numbers add up fast.',
        hi: 'फ्रेम वाले घर में दीवारें कॉलमों के बीच की जगह भरती हैं। 9 इंच की दीवार में हर वर्ग मीटर पर करीब 100 ईंटें लगती हैं, इसलिए गिनती जल्दी बढ़ती है।',
      },
      ask: { en: 'How many bricks per square metre are you counting, and for which wall thickness?', hi: 'आप हर वर्ग मीटर पर कितनी ईंटें गिन रहे हैं, और किस मोटाई की दीवार के लिए?' },
    },
    {
      n: 5,
      title: { en: 'Beams and lintels', hi: 'बीम और लिंटल' },
      what: {
        en: 'Beams hold up each floor and tie the frame together. Lintels are short beams over every door and window so the bricks above do not sag.',
        hi: 'बीम हर मंज़िल को थामती हैं और ढाँचे को जोड़ती हैं। लिंटल हर दरवाज़े-खिड़की के ऊपर की छोटी बीम हैं ताकि ऊपर की ईंटें न झुकें।',
      },
      ask: { en: 'Is there a lintel over every door and window?', hi: 'क्या हर दरवाज़े और खिड़की के ऊपर लिंटल होगा?' },
    },
    {
      n: 6,
      title: { en: 'Roof slab', hi: 'छत की स्लैब' },
      what: {
        en: 'The slab is the floor above and the roof overhead. A lot of the concrete and steel in your house goes here, in one big pour.',
        hi: 'स्लैब ऊपर की मंज़िल का फ़र्श भी है और सिर पर की छत भी। घर का काफ़ी कंक्रीट और स्टील एक ही बड़ी ढलाई में यहीं लगता है।',
      },
      ask: { en: 'How thick is the slab, and what size and spacing are the steel bars?', hi: 'स्लैब कितनी मोटी है, और सरिये किस साइज़ और कितनी दूरी पर होंगे?' },
    },
    {
      n: 7,
      title: { en: 'Wiring, pipes and finish', hi: 'वायरिंग, पाइप और फ़िनिश' },
      what: {
        en: 'Wires and pipes go inside the walls before plaster. Fixing them later means breaking walls. Then plaster, paint, doors and windows turn it into a home.',
        hi: 'प्लास्टर से पहले वायरिंग और पाइप दीवारों के अंदर जाते हैं। बाद में ठीक करना यानी दीवार तोड़ना। फिर प्लास्टर, पेंट, दरवाज़े और खिड़कियाँ इसे घर बना देते हैं।',
      },
      ask: { en: 'Can I see the wiring and pipe layout before the walls are plastered?', hi: 'क्या प्लास्टर से पहले मैं वायरिंग और पाइप का नक्शा देख सकता हूँ?' },
    },
  ] as Stage[],
}

export const QUOTE = {
  title: { en: 'Why quotes confuse almost everyone', hi: 'कोटेशन लगभग सबको क्यों उलझाते हैं' },
  lede: {
    en: "It is not always dishonest. It is just hard to check. Here is what gets in the way.",
    hi: 'ज़रूरी नहीं कि यह बेईमानी हो। बस इसे जाँचना मुश्किल होता है। रास्ते में ये चीज़ें आती हैं।',
  },
  cards: [
    {
      title: { en: 'One number, no breakdown', hi: 'एक रकम, कोई ब्रेकडाउन नहीं' },
      body: {
        en: "Many quotes just say 'lump sum ₹X'. You cannot see how many bags of cement or kilos of steel it counts.",
        hi: "कई कोटेशन बस 'एकमुश्त ₹X' लिखते हैं। आप नहीं देख पाते कि उसमें कितने बैग सीमेंट या कितने किलो स्टील गिने गए हैं।",
      },
    },
    {
      title: { en: 'Price per sq ft hides the details', hi: 'प्रति वर्ग फ़ुट भाव में सब छिप जाता है' },
      body: {
        en: '₹1,800 per sq ft sounds simple. But brick counts, mortar mix and pipe sizes can quietly change inside it.',
        hi: '₹1,800 प्रति वर्ग फ़ुट सीधा लगता है। पर ईंटों की गिनती, मसाले का मिश्रण और पाइप का साइज़ इसके अंदर चुपचाप बदल सकते हैं।',
      },
    },
    {
      title: { en: 'Five trades, five quotes, no total', hi: 'पाँच काम, पाँच कोटेशन, कोई कुल योग नहीं' },
      body: {
        en: 'Structure, brickwork, electrical, plumbing and interiors come separately. It is hard to see where, for example, ₹15 lakh went.',
        hi: 'ढाँचा, चिनाई, इलेक्ट्रिकल, प्लंबिंग और इंटीरियर अलग-अलग आते हैं। यह देखना मुश्किल है कि मान लीजिए ₹15 लाख कहाँ गए।',
      },
    },
  ] as { title: Bi; body: Bi }[],
  cta: { en: 'Compare my quote', hi: 'मेरा कोटेशन जाँचें' },
}

export const STEPS = {
  title: { en: 'How it works', hi: 'यह कैसे काम करता है' },
  items: [
    {
      title: { en: 'Tell us about your house', hi: 'अपने घर के बारे में बताइए' },
      body: { en: 'Size, floors, your state and the kind of soil. Just a few simple questions.', hi: 'साइज़, मंज़िलें, आपका राज्य और मिट्टी का प्रकार। बस कुछ आसान सवाल।' },
    },
    {
      title: { en: 'Get a clear shopping list', hi: 'साफ़ ख़रीदारी की सूची पाइए' },
      body: {
        en: 'Engineers call it a Bill of Quantities (BOQ). It is simply every material your house needs, how much of it, and what it should cost.',
        hi: 'इंजीनियर इसे बिल ऑफ़ क्वांटिटीज़ (BOQ) कहते हैं। यह बस हर सामान की सूची है: कितना लगेगा और कितने का होना चाहिए।',
      },
    },
    {
      title: { en: 'Take it to your contractor', hi: 'इसे अपने ठेकेदार के पास ले जाइए' },
      body: {
        en: 'Compare line by line, ask better questions and talk price with facts in your hand.',
        hi: 'लाइन-दर-लाइन तुलना कीजिए, बेहतर सवाल पूछिए और हाथ में तथ्य लेकर भाव की बात कीजिए।',
      },
    },
  ] as { title: Bi; body: Bi }[],
  sampleTitle: { en: 'A sample, in plain words', hi: 'एक नमूना, सीधी भाषा में' },
  sampleSub: { en: '1,000 sq ft house, Ground + 1 (rule of thumb)', hi: '1,000 वर्ग फ़ुट का घर, ग्राउंड + 1 (अंदाज़े का नियम)' },
  sampleRows: [
    { label: { en: 'Cement', hi: 'सीमेंट' }, val: { en: '400 bags', hi: '400 बैग' }, why: { en: '0.4 bag for every sq ft', hi: 'हर वर्ग फ़ुट पर 0.4 बैग' } },
    { label: { en: 'Steel bars', hi: 'स्टील सरिया' }, val: { en: '4,000 kg', hi: '4,000 किलो' }, why: { en: '4 kg for every sq ft', hi: 'हर वर्ग फ़ुट पर 4 किलो' } },
  ],
  sampleFoot: {
    en: 'Your paid report goes much further: sand, aggregate, bricks, wire, labour, and why each number is what it is.',
    hi: 'आपकी पेड रिपोर्ट इससे कहीं आगे जाती है: रेत, गिट्टी, ईंट, तार, मज़दूरी, और हर आँकड़ा ऐसा क्यों है।',
  },
}

export const PRICING = {
  title: { en: 'Pay only for the part you are building', hi: 'सिर्फ़ उसी हिस्से के पैसे दीजिए जो आप बना रहे हैं' },
  lede: {
    en: 'One report per part of the house. Start free with Vastu.',
    hi: 'घर के हर हिस्से की एक रिपोर्ट। वास्तु से मुफ़्त शुरू कीजिए।',
  },
  free: {
    badge: { en: 'Free forever', hi: 'हमेशा मुफ़्त' },
    name: 'VastuPro',
    sub: { en: 'Check your plan for Vastu', hi: 'अपने नक्शे की वास्तु जाँच' },
    price: { en: 'FREE', hi: 'मुफ़्त' },
    points: [
      { en: '33 room types, scored one by one', hi: '33 तरह के कमरे, हर एक का स्कोर' },
      { en: 'A 16-direction Vastu chart', hi: '16 दिशाओं वाला वास्तु चार्ट' },
      { en: 'Simple remedies for each problem', hi: 'हर समस्या के लिए आसान उपाय' },
      { en: 'A full PDF report to keep', hi: 'सँभालकर रखने के लिए पूरी PDF रिपोर्ट' },
    ] as Bi[],
    cta: { en: 'Start free', hi: 'मुफ़्त शुरू करें' },
    href: '/tools/vastu-pro',
  },
  single: {
    badge: { en: 'Start here', hi: 'यहाँ से शुरू करें' },
    name: { en: 'One part of your house', hi: 'आपके घर का एक हिस्सा' },
    sub: { en: 'Pick the part you are building now', hi: 'जो हिस्सा अभी बना रहे हैं वही चुनिए' },
    price: { en: 'from ₹499', hi: '₹499 से' },
    points: [
      { en: 'Exact quantities of every material', hi: 'हर सामान की सटीक मात्रा' },
      { en: 'Cost of each item, with labour', hi: 'हर चीज़ का ख़र्च, मज़दूरी समेत' },
      { en: 'Why each number is what it is', hi: 'हर आँकड़ा ऐसा क्यों है' },
      { en: 'Side-by-side with your contractor quote', hi: 'ठेकेदार के कोटेशन से आमने-सामने तुलना' },
      { en: 'A PDF with drawings to show your contractor', hi: 'ठेकेदार को दिखाने के लिए चित्रों वाली PDF' },
    ] as Bi[],
    cta: { en: 'Start with the frame of your house', hi: 'घर के ढाँचे से शुरू कीजिए' },
    href: '/tools/structopro',
  },
  parts: [
    { name: { en: 'Frame: foundation, columns, beams, slab', hi: 'ढाँचा: नींव, कॉलम, बीम, स्लैब' }, tool: 'StructurePro', price: '₹999', href: '/tools/structopro' },
    { name: { en: 'Walls, plaster and waterproofing', hi: 'दीवारें, प्लास्टर और वॉटरप्रूफ़िंग' }, tool: 'MasonryPro', price: '₹699', href: '/tools/masonpro' },
    { name: { en: 'Wiring, switches and earthing', hi: 'वायरिंग, स्विच और अर्थिंग' }, tool: 'ElectricalPro', price: '₹499', href: '/tools/electropro' },
    { name: { en: 'Water supply, drains and tank', hi: 'पानी की सप्लाई, नाली और टंकी' }, tool: 'PlumbingPro', price: '₹499', href: '/tools/plumbpro' },
    { name: { en: 'Floors, kitchen, paint and ceilings', hi: 'फ़र्श, रसोई, पेंट और सीलिंग' }, tool: 'InteriorPro', price: '₹899', href: '/tools/interiorpro' },
  ],
  gt: {
    badge: { en: 'Everything together', hi: 'सब कुछ एक साथ' },
    name: { en: 'Whole‑house report', hi: 'पूरे घर की रिपोर्ट' },
    sub: { en: 'All five parts in one master report', hi: 'पाँचों हिस्से एक मास्टर रिपोर्ट में' },
    price: '₹999',
    free: { en: 'Free when you have bought all five parts', hi: 'पाँचों हिस्से ख़रीदने पर मुफ़्त' },
    points: [
      { en: 'One total cost for the whole house', hi: 'पूरे घर का एक कुल ख़र्च' },
      { en: 'A timeline chart of the work', hi: 'काम की समयरेखा का चार्ट' },
      { en: 'A PDF report to hand to your contractor', hi: 'ठेकेदार को देने के लिए PDF रिपोर्ट' },
    ] as Bi[],
    cta: { en: 'Build my whole-house report', hi: 'मेरे पूरे घर की रिपोर्ट बनाइए' },
    href: '/tools/grand-total',
  },
}

export const PROS = {
  title: { en: 'Builder, contractor or site engineer?', hi: 'बिल्डर, ठेकेदार या साइट इंजीनियर?' },
  lede: {
    en: 'These tools are for people who run sites. Homeowners can skip this part.',
    hi: 'ये टूल साइट चलाने वालों के लिए हैं। घर बनवाने वाले इस हिस्से को छोड़ सकते हैं।',
  },
  calcTitle: { en: 'Free calculators', hi: 'मुफ़्त कैलकुलेटर' },
  calcNote: { en: 'No sign-up needed.', hi: 'साइन-अप की ज़रूरत नहीं।' },
  kitTitle: { en: 'Site toolkits (Excel)', hi: 'साइट टूलकिट (Excel)' },
  kitBundle: { en: 'All six toolkits as a bundle', hi: 'सभी छह टूलकिट बंडल में' },
  sheets: { en: 'sheets', hi: 'शीट' },
  free: { en: 'FREE', hi: 'मुफ़्त' },
  seeAll: { en: 'See all toolkits', hi: 'सभी टूलकिट देखें' },
}

export const TRUST = {
  title: { en: 'Where do the numbers come from?', hi: 'ये आँकड़े आते कहाँ से हैं?' },
  body: {
    en: "Every quantity follows the Indian Standard (IS) codes that engineers and builders use across India. For example, IS 456 is the rulebook for concrete. You do not need to read them. Your report shows which rule each number came from.",
    hi: 'हर मात्रा भारतीय मानक (IS) कोड के अनुसार है, जिन्हें पूरे भारत में इंजीनियर और बिल्डर इस्तेमाल करते हैं। जैसे IS 456 कंक्रीट की नियमावली है। आपको इन्हें पढ़ने की ज़रूरत नहीं। आपकी रिपोर्ट बताती है कि हर आँकड़ा किस नियम से आया।',
  },
  honest: {
    en: 'These are planning estimates, not quotes. A licensed structural engineer must approve your final drawings before building.',
    hi: 'ये योजना बनाने के अनुमान हैं, कोटेशन नहीं। निर्माण से पहले आपके अंतिम नक्शे को लाइसेंसधारी स्ट्रक्चरल इंजीनियर से पास कराना ज़रूरी है।',
  },
  more: { en: 'See the 25 standards we use', hi: 'हमारे इस्तेमाल किए 25 मानक देखें' },
  all: { en: 'Read about each standard', hi: 'हर मानक के बारे में पढ़ें' },
}

export const FOOT = {
  tagline: { en: 'Build with certainty.', hi: 'भरोसे के साथ बनाइए।' },
  note: {
    en: 'Estimates are for budgeting only. Not for structural approval without a licensed engineer.',
    hi: 'अनुमान सिर्फ़ बजट के लिए हैं। लाइसेंसधारी इंजीनियर के बिना ढाँचे की मंज़ूरी के लिए नहीं।',
  },
  tools: { en: 'Our tools', hi: 'हमारे टूल' },
  calcs: { en: 'Free calculators', hi: 'मुफ़्त कैलकुलेटर' },
  kits: { en: 'Site toolkits', hi: 'साइट टूलकिट' },
  company: { en: 'Company', hi: 'कंपनी' },
  legal: { en: 'Legal', hi: 'कानूनी' },
  top: { en: 'Back to top', hi: 'ऊपर जाएँ' },
}


/** Small extras used by the v3 components (kept here so every visible string stays bilingual and in one place). */
export const MORE = {
  hello: { en: 'Building a home? Start here.', hi: 'घर बनवा रहे हैं? यहाँ से शुरू कीजिए।' },
  prosHint: { en: 'Builder or site engineer? Your tools are here.', hi: 'बिल्डर या साइट इंजीनियर? आपके टूल यहाँ हैं।' },
  emptyPlot: { en: 'An empty plot', hi: 'खाली प्लॉट' },
  replay: { en: 'Watch again', hi: 'फिर से देखें' },
  stepOf: { en: 'Step', hi: 'चरण' },
  ofSeven: { en: 'of 7', hi: '/ 7' },
  jump: { en: 'Jump to step', hi: 'इस चरण पर जाएँ' },
  floorsHint: {
    en: 'The area above already counts every floor. This only checks the rule suits your house.',
    hi: 'ऊपर का एरिया सभी मंज़िलें गिन चुका है। यह सिर्फ़ जाँचता है कि नियम आपके घर पर लागू होता है या नहीं।',
  },
  legendCement: { en: 'each sack = 50 bags', hi: 'हर बोरी = 50 बैग' },
  legendSteel: { en: 'each bundle = 500 kg', hi: 'हर बंडल = 500 किलो' },
  onlyFrame: { en: 'This is only the frame. Walls, wiring and paint come on top.', hi: 'यह सिर्फ़ ढाँचा है। दीवारें, वायरिंग और पेंट इसके ऊपर आते हैं।' },
  free: { en: 'FREE', hi: 'मुफ़्त' },
  fromBuilders: { en: 'Made for people who run sites', hi: 'साइट चलाने वालों के लिए बना' },
  stamp: { en: 'INDIAN STANDARDS • BHARATIYA MANAK • ', hi: 'भारतीय मानक • INDIAN STANDARDS • ' },
  stampMid: { en: 'IS', hi: 'IS' },
  allKits: { en: 'Everything for the site office', hi: 'साइट ऑफ़िस के लिए सब कुछ' },
  about: { en: 'About', hi: 'हमारे बारे में' },
  contact: { en: 'Contact', hi: 'संपर्क' },
  blog: { en: 'Blog', hi: 'ब्लॉग' },
  careers: { en: 'Careers', hi: 'करियर' },
  privacy: { en: 'Privacy', hi: 'गोपनीयता' },
  terms: { en: 'Terms', hi: 'शर्तें' },
  disclaimer: { en: 'Disclaimer', hi: 'अस्वीकरण' },
  isCodes: { en: 'Standards we use', hi: 'हमारे इस्तेमाल किए मानक' },
  glossary: { en: 'Glossary', hi: 'शब्दावली' },
  llms: { en: 'For AI assistants', hi: 'AI असिस्टेंट के लिए' },
  pwPlaceholder: { en: 'Password', hi: 'पासवर्ड' },
  enter: { en: 'Enter', hi: 'अंदर जाएँ' },
  checking: { en: 'Checking…', hi: 'जाँच रहे हैं…' },
  fmtTonnes: { en: 'tonnes', hi: 'टन' },
}

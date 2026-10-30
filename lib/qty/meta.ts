/*
  What each trade tool is called and what its report holds. Plain data, safe for the browser and the server.
  The names, prices and artwork on the homepage come from lib/v2/content.ts; this file carries the rest.
*/

import type { PaidAppType } from '../tool-pricing'

export type TradeSlug = 'plumbpro' | 'electropro' | 'masonpro' | 'interiorpro'

export interface TradeMeta {
  slug: TradeSlug
  /** the tool's key in lib/v2/content.ts (name, price, accent colour, artwork) */
  toolKey: 'plumb' | 'elec' | 'mason' | 'int'
  appType: PaidAppType
  label: string
  /** the title on the report */
  heading: string
  /** the tag in the band at the top of the PDF */
  tag: string
  /** short code in report ids */
  code: string
  eyebrow: string
  blurb: string
  /** what the paid report holds: shown beside the unlock button and in the email */
  includes: string[]
  /** what comes next, shown at the foot of the report */
  next: { href: string; name: string; text: string }
  /** the sentence on the busy screen while the server works */
  busy: { title: string; text: string }
}

export const TRADE_META: Record<TradeSlug, TradeMeta> = {
  plumbpro: {
    slug: 'plumbpro',
    toolKey: 'plumb',
    appType: 'plumbpro',
    label: 'PlumbingPro',
    heading: 'Plumbing quantities',
    tag: 'PHASE 4 · PLUMBINGPRO',
    code: 'PL',
    eyebrow: 'Phase 4 · Water and drainage',
    blurb: 'Pipe lengths, tank sizes, the pump and every tap, valve and fitting you need to buy, counted from your floors and fixtures to the Indian Standards.',
    includes: [
      'Supply and drain pipe by size, in whole 3 m lengths',
      'Underground and overhead tank sizes, and the transfer pump',
      'Every tap, valve, trap, fitting and fixture, counted',
      'Septic tank and soak pit for your ground, or the sewer connection',
      'Rain-water down-pipes for your roof',
      'The assumptions behind every figure, what is not counted, and how far off it can be',
      'A PDF you can hand to your plumber',
    ],
    next: { href: '/tools/interiorpro', name: 'InteriorPro', text: 'With the services in, InteriorPro counts the paint, tiles, ceilings, doors and carpentry for the finishing stage.' },
    busy: { title: 'Working out your plumbing…', text: 'Sizing the pipes, tanks and drains to the IS codes. This takes a few seconds.' },
  },
  electropro: {
    slug: 'electropro',
    toolKey: 'elec',
    appType: 'electropro',
    label: 'ElectricalPro',
    heading: 'Electrical quantities',
    tag: 'PHASE 3 · ELECTRICALPRO',
    code: 'EL',
    eyebrow: 'Phase 3 · Wiring',
    blurb: 'Points, wire, conduit, switchboards and earthing, counted room by room from the plan and the Indian Standards.',
    includes: [
      'Light, fan, socket and power points room by room',
      'Wire by size and colour, in whole 90 m coils',
      'Conduit, boxes, saddles and bends, counted',
      'Distribution boards, MCBs, RCCB and the earthing set',
      'The assumptions behind every figure, what is not counted, and how far off it can be',
      'A PDF you can hand to your electrician',
    ],
    next: { href: '/tools/plumbpro', name: 'PlumbingPro', text: 'PlumbingPro counts the pipes, tanks, fittings and fixtures for water and drainage.' },
    busy: { title: 'Working out your wiring…', text: 'Counting the points and sizing the circuits to the IS codes. This takes a few seconds.' },
  },
  masonpro: {
    slug: 'masonpro',
    toolKey: 'mason',
    appType: 'masonpro',
    label: 'MasonryPro',
    heading: 'Masonry quantities',
    tag: 'PHASE 2 · MASONRYPRO',
    code: 'MA',
    eyebrow: 'Phase 2 · Walls and plaster',
    blurb: 'Bricks or blocks, mortar, cement, sand, lintels and plaster for every wall, worked out from your floors and openings.',
    includes: [
      'Bricks or blocks for outer and inner walls, floor by floor',
      'Mortar, cement and sand for the masonry and for plaster',
      'Openings deducted the way IS 1200 measures them',
      'Lintels and sills, and the plaster area inside and out',
      'The assumptions behind every figure, what is not counted, and how far off it can be',
      'A PDF you can hand to your mason',
    ],
    next: { href: '/tools/electropro', name: 'ElectricalPro', text: 'ElectricalPro counts the points, wire, conduit and switchboards that go into those walls.' },
    busy: { title: 'Working out your walls…', text: 'Measuring the masonry and plaster the way the IS codes do. This takes a few seconds.' },
  },
  interiorpro: {
    slug: 'interiorpro',
    toolKey: 'int',
    appType: 'interiorpro',
    label: 'InteriorPro',
    heading: 'Finishing quantities',
    tag: 'PHASE 5 · INTERIORPRO',
    code: 'IN',
    eyebrow: 'Phase 5 · Finishing',
    blurb: 'Paint, putty, tiles, ceilings, doors and carpentry, counted area by area from your rooms.',
    includes: [
      'Putty, primer and paint by area, with the coats counted',
      'Floor and wall tiles, adhesive and grout',
      'False ceiling boards, channels and hangers',
      'Doors, windows and the carpentry sheets',
      'The assumptions behind every figure, what is not counted, and how far off it can be',
      'A PDF you can hand to your contractor',
    ],
    next: { href: '/tools/grand-total', name: 'Grand Total', text: 'The Grand Total report adds your structure, walls, wiring, plumbing and finishing into one list of what to buy.' },
    busy: { title: 'Working out your finishing…', text: 'Measuring the surfaces and counting what each one needs. This takes a few seconds.' },
  },
}

export const TRADE_SLUGS = Object.keys(TRADE_META) as TradeSlug[]
export const isTradeSlug = (s: string): s is TradeSlug => Object.prototype.hasOwnProperty.call(TRADE_META, s)

/* ───────────── Hindi (SJ, 30 Oct 2026) ─────────────
  What the page shows on /hi. A parallel table: the English record above is untouched (the PDFs and e-mails still read it).
  Brand names (PlumbingPro, InteriorPro...) stay Latin, as everywhere on the site. `localizeMeta` is what the pages call. */

type MetaHi = Pick<TradeMeta, 'eyebrow' | 'heading' | 'blurb' | 'includes' | 'busy'> & { next: { name?: string; text: string } }

const COMMON_INCLUDE_ASSUME = 'हर आँकड़े के पीछे की मान्यताएँ, क्या नहीं गिना गया, और वह कितना अलग हो सकता है'

export const TRADE_META_HI: Record<TradeSlug, MetaHi> = {
  plumbpro: {
    eyebrow: 'फ़ेज़ 4 · पानी और निकासी',
    heading: 'प्लंबिंग की मात्राएँ',
    blurb: 'पाइप की लंबाई, टंकी के साइज़, पंप, और हर वह नल, वॉल्व और फ़िटिंग जो आपको ख़रीदनी है, आपकी मंज़िलों और फ़िक्सचर से भारतीय मानकों के अनुसार गिनी गई।',
    includes: [
      'साइज़ के हिसाब से सप्लाई और ड्रेन पाइप, पूरी 3 m की लंबाइयों में',
      'ज़मीन के नीचे और ऊपर की टंकियों के साइज़, और ट्रांसफ़र पंप',
      'हर नल, वॉल्व, ट्रैप, फ़िटिंग और फ़िक्सचर, गिना हुआ',
      'आपकी ज़मीन के हिसाब से सेप्टिक टैंक और सोक पिट, या सीवर कनेक्शन',
      'आपकी छत के लिए बारिश के पानी के डाउन-पाइप',
      COMMON_INCLUDE_ASSUME,
      'एक PDF जो आप अपने प्लंबर को दे सकते हैं',
    ],
    next: { text: 'सर्विसेज़ लगने के बाद, InteriorPro फ़िनिशिंग के लिए पेंट, टाइल, सीलिंग, दरवाज़े और बढ़ईगिरी गिनता है।' },
    busy: { title: 'आपकी प्लंबिंग निकाली जा रही है…', text: 'पाइप, टंकियों और नालियों का साइज़ IS कोड के अनुसार तय हो रहा है। इसमें कुछ सेकंड लगते हैं।' },
  },
  electropro: {
    eyebrow: 'फ़ेज़ 3 · वायरिंग',
    heading: 'इलेक्ट्रिकल की मात्राएँ',
    blurb: 'पॉइंट, तार, कंड्यूट, स्विचबोर्ड और अर्थिंग, नक्शे और भारतीय मानकों से कमरा-दर-कमरा गिने गए।',
    includes: [
      'लाइट, पंखे, सॉकेट और पावर पॉइंट, कमरा-दर-कमरा',
      'साइज़ और रंग के हिसाब से तार, पूरे 90 m के कुंडलों में',
      'कंड्यूट, बॉक्स, सैडल और बेंड, गिने हुए',
      'डिस्ट्रीब्यूशन बोर्ड, MCB, RCCB और अर्थिंग सेट',
      COMMON_INCLUDE_ASSUME,
      'एक PDF जो आप अपने इलेक्ट्रीशियन को दे सकते हैं',
    ],
    next: { text: 'PlumbingPro पानी और निकासी के लिए पाइप, टंकियाँ, फ़िटिंग और फ़िक्सचर गिनता है।' },
    busy: { title: 'आपकी वायरिंग निकाली जा रही है…', text: 'पॉइंट गिने जा रहे हैं और सर्किट का साइज़ IS कोड के अनुसार तय हो रहा है। इसमें कुछ सेकंड लगते हैं।' },
  },
  masonpro: {
    eyebrow: 'फ़ेज़ 2 · दीवारें और प्लास्टर',
    heading: 'चिनाई की मात्राएँ',
    blurb: 'हर दीवार के लिए ईंट या ब्लॉक, मसाला, सीमेंट, रेत, लिंटल और प्लास्टर, आपकी मंज़िलों और दरवाज़े-खिड़कियों से निकाला गया।',
    includes: [
      'बाहरी और भीतरी दीवारों के लिए ईंट या ब्लॉक, मंज़िल-दर-मंज़िल',
      'चिनाई और प्लास्टर के लिए मसाला, सीमेंट और रेत',
      'दरवाज़े-खिड़कियों की जगहें वैसे घटाई गईं जैसे IS 1200 नापता है',
      'लिंटल और सिल, और अंदर-बाहर का प्लास्टर एरिया',
      COMMON_INCLUDE_ASSUME,
      'एक PDF जो आप अपने राजमिस्त्री को दे सकते हैं',
    ],
    next: { text: 'ElectricalPro उन दीवारों में लगने वाले पॉइंट, तार, कंड्यूट और स्विचबोर्ड गिनता है।' },
    busy: { title: 'आपकी दीवारें निकाली जा रही हैं…', text: 'चिनाई और प्लास्टर वैसे नापा जा रहा है जैसे IS कोड नापते हैं। इसमें कुछ सेकंड लगते हैं।' },
  },
  interiorpro: {
    eyebrow: 'फ़ेज़ 5 · फ़िनिशिंग',
    heading: 'फ़िनिशिंग की मात्राएँ',
    blurb: 'पेंट, पुट्टी, टाइल, सीलिंग, दरवाज़े और बढ़ईगिरी, आपके कमरों से एरिया-दर-एरिया गिने गए।',
    includes: [
      'एरिया के हिसाब से पुट्टी, प्राइमर और पेंट, कोट गिनकर',
      'फ़र्श और दीवार की टाइलें, अडेसिव और ग्राउट',
      'फ़ॉल्स सीलिंग के बोर्ड, चैनल और हैंगर',
      'दरवाज़े, खिड़कियाँ और बढ़ईगिरी की शीटें',
      COMMON_INCLUDE_ASSUME,
      'एक PDF जो आप अपने ठेकेदार को दे सकते हैं',
    ],
    next: { name: 'ग्रैंड टोटल', text: 'ग्रैंड टोटल रिपोर्ट आपके ढाँचे, दीवारों, वायरिंग, प्लंबिंग और फ़िनिशिंग को जोड़कर ख़रीदने की एक सूची बनाती है।' },
    busy: { title: 'आपकी फ़िनिशिंग निकाली जा रही है…', text: 'सतहें नापी जा रही हैं और हर एक के लिए चाहिए सामान गिना जा रहा है। इसमें कुछ सेकंड लगते हैं।' },
  },
}

/** The tool's words in the visitor's language; English returns the record itself. */
export function localizeMeta(meta: TradeMeta, locale: string): TradeMeta {
  if (locale !== 'hi') return meta
  const hi = TRADE_META_HI[meta.slug]
  return {
    ...meta,
    eyebrow: hi.eyebrow,
    heading: hi.heading,
    blurb: hi.blurb,
    includes: hi.includes,
    busy: hi.busy,
    next: { ...meta.next, name: hi.next.name ?? meta.next.name, text: hi.next.text },
  }
}

/**
 * The structured data of a trade tool's page, with the words in Hindi on /hi: "Home" in the breadcrumb, the one-line summary and the
 * language tag. The builders in lib/seo are English only and are not touched; the tool names are brand names and stay as they are.
 */
export function localizeToolLd<T extends object>(data: T[], locale: string, hiDescription: string): T[] {
  if (locale !== 'hi') return data
  return data.map(node => {
    const n = node as Record<string, unknown>
    if (n['@type'] === 'BreadcrumbList' && Array.isArray(n.itemListElement)) {
      return { ...n, itemListElement: n.itemListElement.map((it: { name?: string }) => (it.name === 'Home' ? { ...it, name: 'होम' } : it)) } as T
    }
    if (n['@type'] === 'SoftwareApplication') return { ...n, description: hiDescription, inLanguage: 'hi-IN' } as T
    return node
  })
}

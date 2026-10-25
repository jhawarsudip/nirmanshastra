// Static content for the v2 homepage. Prices and hrefs are carried over from the legacy page.
import type { Bi } from './copy'

// The Indian Standards the quantity models cite (the full list, with what each one governs, is lib/is-codes-data.ts and /is-codes-used).
// Only standards a model actually reads belong here: the homepage count is IS_CODES.length.
export const IS_CODES = [
  'IS 456:2000', 'IS 1786:2008', 'IS 1893 (Part 1)', 'IS 13920:2016',
  'IS 875 (Part 3)', 'IS 10262:2009', 'IS 2502:1963', 'IS 1904:1986',
  'IS 1077:1992', 'IS 12894:2002', 'IS 2185', 'IS 2212:1991',
  'IS 2572:2005', 'IS 6041:1985', 'IS 2250:1981', 'IS 4326:1993',
  'IS 4648', 'IS 732:1989', 'IS 3043:2018', 'IS 1172:1993',
  'IS 1742:1983', 'IS 2470', 'IS 15778:2007', 'IS 1200',
  'IS 2395 (Part 1)', 'IS 15622:2006', 'IS 1003 (Part 1)', 'NBC 2016',
] as const

// Google Maps query strings stay in English for accurate results
export const DEALER_QUERIES = [
  'construction material dealer near',
  'hardware store near',
  'brick and masonry dealer near',
  'electrical store near',
  'pipes and sanitaryware dealer near',
  'tiles and marble dealer near',
  'paint store near',
  'furniture and interior decor store near',
] as const

export type ToolKey = 'vastu' | 'struct' | 'mason' | 'elec' | 'plumb' | 'int'

export interface ToolMeta {
  key: ToolKey
  phase: string
  name: string
  href: string
  price: string
  free: boolean
  /** CSS custom property that carries the accent colour */
  accent: string
  plate: string
  plateAlt: string
  chips: string[]
  descriptorKey: string
  descKey: string
}

export const TOOLS: ToolMeta[] = [
  {
    key: 'vastu', phase: 'P0', name: 'VastuPro', href: '/tools/vastu-pro', price: 'FREE', free: true,
    accent: '--ns-t-vastu', plate: '/v2/products/p06-vastupro.webp',
    plateAlt: 'Plan-view drawing of a house with a 16-zone Vastu compass grid in gold line',
    chips: ['24 ROOMS', 'SOURCED RULES'],
    descriptorKey: 'vastuDescriptor', descKey: 'vastuDesc',
  },
  {
    key: 'struct', phase: 'P1', name: 'StructurePro', href: '/tools/structopro', price: '₹999', free: false,
    accent: '--ns-t-struct', plate: '/v2/products/p01-structurepro.webp',
    plateAlt: 'Isometric cutaway of an RCC column and beam joint with its rebar cage',
    chips: ['IS 456:2000', 'IS 13920:2016', 'IS 1893 (Part 1)'],
    descriptorKey: 'structureDescriptor', descKey: 'structureDesc',
  },
  {
    key: 'mason', phase: 'P2', name: 'MasonryPro', href: '/tools/masonpro', price: '₹699', free: false,
    accent: '--ns-t-mason', plate: '/v2/products/p02-masonpro.webp',
    plateAlt: 'Isometric corner of an English-bond brick wall with a window and lintel',
    chips: ['IS 1077:1992', 'IS 2212:1991', 'IS 2185'],
    descriptorKey: 'masonryDescriptor', descKey: 'masonryDesc',
  },
  {
    key: 'elec', phase: 'P3', name: 'ElectricalPro', href: '/tools/electropro', price: '₹499', free: false,
    accent: '--ns-t-elec', plate: '/v2/products/p03-electricalpro.webp',
    plateAlt: 'Isometric wall section with recessed conduit, switch box and distribution board',
    chips: ['IS 4648', 'IS 732:1989', 'IS 3043:2018'],
    descriptorKey: 'electricalDescriptor', descKey: 'electricalDesc',
  },
  {
    key: 'plumb', phase: 'P4', name: 'PlumbingPro', href: '/tools/plumbpro', price: '₹499', free: false,
    accent: '--ns-t-plumb', plate: '/v2/products/p04-plumbpro.webp',
    plateAlt: 'Isometric plumbing riser from overhead tank to bathroom and drain chamber',
    chips: ['IS 1172:1993', 'IS 1742:1983'],
    descriptorKey: 'plumbingDescriptor', descKey: 'plumbingDesc',
  },
  {
    key: 'int', phase: 'P5', name: 'InteriorPro', href: '/tools/interiorpro', price: '₹899', free: false,
    accent: '--ns-t-int', plate: '/v2/products/p05-interiorpro.webp',
    plateAlt: 'Isometric cutaway of a room corner with tile floor, skirting and false ceiling',
    chips: ['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY'],
    descriptorKey: 'interiorDescriptor', descKey: 'interiorDesc',
  },
]

export interface TemplateDef { title: string; sheets: number; price: string; desc: string; href: string }

// Six toolkits — titles, sheet counts and descriptions verbatim from /site-templates.
export const SITE_TEMPLATES: TemplateDef[] = [
  {
    title: 'Residential Construction Cost Estimator', sheets: 16, price: '₹2,499',
    desc: 'Prices a house from IS-code first principles, generates a client quotation, compares up to 3 contractor quotes line by line, tracks budget against actual once the job starts.',
    href: '/site-templates/cost-estimator',
  },
  {
    title: 'Construction Site Documentation Pack', sheets: 14, price: '₹1,699',
    desc: 'Nine registers holding the proof of what happened on site — the contemporaneous record that holds up when a delay or defect is disputed.',
    href: '/site-templates/site-documentation',
  },
  {
    title: 'Billing & Measurement', sheets: 9, price: '₹2,299',
    desc: 'Takes measured work through the full Indian billing chain — joint measurement, abstract against BOQ, RA bill with retention/TDS/GST, payment tracking to close.',
    href: '/site-templates/billing-measurement',
  },
  {
    title: 'Bar Bending Schedule', sheets: 12, price: '₹2,099',
    desc: 'Turns reinforcement details into a cutting-length schedule and steel order note, with every bend deduction and hook allowance applied per code.',
    href: '/site-templates/bar-bending-schedule',
  },
  {
    title: 'Labour & Statutory Compliance', sheets: 16, price: '₹1,999',
    desc: "Runs site payroll end to end under India's current four Labour Codes (in force since Nov 2025) — PF, ESI, minimum wage checks, subcontractor compliance holds.",
    href: '/site-templates/labour-compliance',
  },
  {
    title: 'Planning, Progress & Delay Control', sheets: 17, price: '₹2,299',
    desc: 'Value-weighted S-curve and earned value tracking, plus a delay/EOT register that classifies events the way a contract actually does — with notice-deadline tracking.',
    href: '/site-templates/planning-progress',
  },
]

export const TEMPLATES_BUNDLE = { href: '/site-templates', price: '₹7,999' }

/**
 * The eight isometric layers, listed in the order a real RCC house is BUILT (researched against site sequences,
 * see the "build sequence research" doc in the Project): footings with the column bars standing in them, plinth beams
 * that tie those bars, the columns above the plinth, roof beams, roof slab (beams and slab are one pour), then the
 * brick walls with their lintels, then wiring and plumbing, then plaster, floor and paint.
 * `z` is where the layer sits when the house is stacked and pulled apart (bottom 0 to top 6), which is not the same
 * as build order: the walls sit between the plinth beams and the roof beams but are laid after the slab is cast, and
 * the paint layer (l08, derived from the wall layer) sits just above the walls it covers.
 * The working numbers sit behind the "Show the calculation" button instead of in the headline. They are limits and
 * times printed in the standards themselves (IS 456:2000 cover, least steel and stripping times, IS 13920:2016 ring spacing),
 * plus the M20 nominal mix, the brick count and the mortar mix. None of them is a quantity for a particular house:
 * the reports work those out from the answers a visitor gives.
 */

export interface LayerCalcRow { label: Bi; how: Bi; value: string }
export interface LayerDef {
  id: string
  src: string
  z: number
  /** how it arrives while the house goes up: dropped in from above, raised from the bottom (cast or laid upward), or painted on from the top */
  enter: 'drop' | 'rise' | 'paint'
  name: Bi
  what: Bi
  onQuote: Bi
  rows: LayerCalcRow[]
  /** shown instead of rows when there is no single number to give */
  note?: Bi
  codes: string[]
}

export const LAYERS: LayerDef[] = [
  {
    id: 'S1', src: '/v2/layers/l01.webp', z: 0, enter: 'drop',
    name: { en: 'Footings', hi: 'फुटिंग' },
    what: {
      en: 'The concrete feet of the house. Each one spreads a column’s weight over a wide patch of ground. The steel bars of the future columns already stand up out of it, waiting.',
      hi: 'घर के कंक्रीट के पैर। हर फुटिंग एक कॉलम का वज़न ज़मीन के बड़े हिस्से पर फैलाती है। भविष्य के कॉलम के सरिये उसमें से पहले ही सीधे खड़े होते हैं, इंतज़ार करते हुए।',
    },
    onQuote: { en: 'Digging, concrete, steel bars', hi: 'खुदाई, कंक्रीट, सरिया' },
    rows: [{ label: { en: 'Concrete cover under the footing steel', hi: 'फुटिंग के स्टील के नीचे कंक्रीट कवर' }, how: { en: 'least cover where concrete meets the ground (IS 456 cl 26.4.2.2)', hi: 'जहाँ कंक्रीट ज़मीन से लगता है वहाँ न्यूनतम कवर (IS 456 cl 26.4.2.2)' }, value: '50 mm' }],
    codes: ['IS 456:2000', 'IS 1904:1986'],
  },
  {
    id: 'S2', src: '/v2/layers/l03.webp', z: 2, enter: 'drop',
    name: { en: 'Plinth beams', hi: 'प्लिंथ बीम' },
    what: {
      en: 'A ring of beams at ground level that ties the column bars together before anything tall goes up, so the house moves as one and the walls above have a solid base.',
      hi: 'ज़मीन के स्तर पर बीम का घेरा जो ऊपर कुछ भी उठने से पहले कॉलम के सरियों को आपस में जोड़ देता है, ताकि घर एक साथ टिके और ऊपर की दीवारों को पक्का आधार मिले।',
    },
    onQuote: { en: 'Concrete, steel bars, shuttering', hi: 'कंक्रीट, सरिया, शटरिंग' },
    rows: [{ label: { en: 'Least steel in the beam', hi: 'बीम में न्यूनतम स्टील' }, how: { en: '0.85 ÷ the steel strength, as a share of the section (IS 456 cl 26.5.1.1), here for Fe 500', hi: 'स्टील की मज़बूती से 0.85 ÷, सेक्शन के हिस्से के रूप में (IS 456 cl 26.5.1.1), यहाँ Fe 500 के लिए' }, value: '0.17%' }],
    codes: ['IS 456:2000'],
  },
  {
    id: 'S3', src: '/v2/layers/l02.webp', z: 1, enter: 'rise',
    name: { en: 'Columns', hi: 'कॉलम' },
    what: {
      en: 'Now the posts rise from the footings. Steel bars run up inside them, tied with small steel rings, and concrete is poured into moulds. Each column carries its share of the house down to its footing.',
      hi: 'अब फुटिंग से खंभे उठते हैं। अंदर सरिये ऊपर तक जाते हैं, छोटे स्टील के छल्लों से बँधे हुए, और साँचों में कंक्रीट डाला जाता है। हर कॉलम घर के वज़न का अपना हिस्सा नीचे फुटिंग तक पहुँचाता है।',
    },
    onQuote: { en: 'Concrete, steel bars and rings, shuttering (the moulds)', hi: 'कंक्रीट, सरिया और छल्ले, शटरिंग (साँचे)' },
    rows: [
      { label: { en: 'Steel allowed in the column', hi: 'कॉलम में स्टील की सीमा' }, how: { en: 'least and most, as a share of the column section (IS 456 cl 26.5.3.1)', hi: 'कॉलम सेक्शन के हिस्से के रूप में न्यूनतम और अधिकतम (IS 456 cl 26.5.3.1)' }, value: '0.8% to 6%' },
      { label: { en: 'Rings near the ends', hi: 'सिरों के पास छल्ले' }, how: { en: 'every ¼ of the column width or 100 mm, whichever is less', hi: 'कॉलम की चौड़ाई का ¼ या 100 mm, जो कम हो' }, value: '≤ 100 mm' },
      { label: { en: 'Side moulds can come off after', hi: 'बगल के साँचे हटते हैं' }, how: { en: 'stripping time for column sides', hi: 'कॉलम की बगलों का स्ट्रिपिंग समय' }, value: '16–24 h' },
    ],
    codes: ['IS 456:2000', 'IS 13920:2016'],
  },
  {
    id: 'S4', src: '/v2/layers/l05.webp', z: 4, enter: 'drop',
    name: { en: 'Roof beams', hi: 'छत की बीम' },
    what: {
      en: 'Beams run across the tops of the columns and carry the slab. Beam and slab are poured together, so the roof becomes one solid piece. In a house with more floors this step repeats on every floor.',
      hi: 'कॉलम के ऊपरी सिरों पर बीम चलती हैं और स्लैब को थामती हैं। बीम और स्लैब एक ही बार में ढाले जाते हैं, इसलिए छत एक ठोस टुकड़ा बनती है। ज़्यादा मंज़िल वाले घर में यह चरण हर मंज़िल पर दोहराया जाता है।',
    },
    onQuote: { en: 'Concrete, steel bars and rings, shuttering, props', hi: 'कंक्रीट, सरिया और छल्ले, शटरिंग, सपोर्ट' },
    rows: [
      { label: { en: 'Least steel in the beam', hi: 'बीम में न्यूनतम स्टील' }, how: { en: '0.85 ÷ the steel strength, as a share of the section (IS 456 cl 26.5.1.1), here for Fe 500', hi: 'स्टील की मज़बूती से 0.85 ÷, सेक्शन के हिस्से के रूप में (IS 456 cl 26.5.1.1), यहाँ Fe 500 के लिए' }, value: '0.17%' },
      { label: { en: 'Props under the beam stay for', hi: 'बीम के नीचे सपोर्ट रहते हैं' }, how: { en: 'beams spanning up to 6 m', hi: '6 m तक की बीम के लिए' }, value: '14 days' },
    ],
    codes: ['IS 456:2000', 'IS 13920:2016'],
  },
  {
    id: 'S5', src: '/v2/layers/l06.webp', z: 5, enter: 'drop',
    name: { en: 'Roof slab', hi: 'छत की स्लैब' },
    what: {
      en: 'The flat concrete roof, with a mesh of steel inside. The beam and slab steel is tied first, then everything is poured in one go. Pipes and conduits that will sit inside the slab go in before the pour, because cutting into a finished slab weakens it.',
      hi: 'सपाट कंक्रीट की छत, जिसके अंदर स्टील की जाली होती है। बीम और स्लैब का स्टील पहले बाँधा जाता है, फिर सब एक साथ ढाला जाता है। स्लैब के अंदर जाने वाले पाइप और कंड्यूट ढलाई से पहले रखे जाते हैं, क्योंकि बनी हुई स्लैब को काटने से वह कमज़ोर हो जाती है।',
    },
    onQuote: { en: 'Concrete, steel mesh, shuttering and props', hi: 'कंक्रीट, स्टील जाली, शटरिंग और सपोर्ट' },
    rows: [
      { label: { en: 'Least steel in the slab', hi: 'स्लैब में न्यूनतम स्टील' }, how: { en: 'share of the slab section, for high-strength bars (IS 456 cl 26.5.2.1)', hi: 'स्लैब सेक्शन का हिस्सा, उच्च-शक्ति सरियों के लिए (IS 456 cl 26.5.2.1)' }, value: '0.12%' },
      { label: { en: 'Concrete mix (M20)', hi: 'कंक्रीट मिक्स (M20)' }, how: { en: '1 part cement : 1½ parts sand : 3 parts stone', hi: '1 भाग सीमेंट : 1½ भाग रेत : 3 भाग गिट्टी' }, value: '1 : 1.5 : 3' },
      { label: { en: 'Props under the slab stay for', hi: 'स्लैब के नीचे सपोर्ट रहते हैं' }, how: { en: 'slabs spanning up to 4.5 m', hi: '4.5 m तक की स्लैब के लिए' }, value: '7 days' },
      { label: { en: 'Kept wet (curing)', hi: 'गीला रखना (क्योरिंग)' }, how: { en: 'ordinary Portland cement', hi: 'साधारण पोर्टलैंड सीमेंट' }, value: '≥ 7 days' },
    ],
    codes: ['IS 456:2000', 'IS 1786:2008'],
  },
  {
    id: 'S6', src: '/v2/layers/l04.webp', z: 3, enter: 'rise',
    name: { en: 'Brick walls and lintels', hi: 'ईंट की दीवारें और लिंटल' },
    what: {
      en: 'Once the frame has cured, the walls go up between the columns. Where there is a door or window, a small beam called a lintel is cast over the opening as the bricks reach that height, and the wall carries on above it.',
      hi: 'ढाँचे के पक जाने के बाद दीवारें कॉलम के बीच उठती हैं। जहाँ दरवाज़ा या खिड़की है, वहाँ ईंटें उस ऊँचाई तक पहुँचने पर खुले हिस्से के ऊपर लिंटल नाम की छोटी बीम ढाली जाती है, और दीवार उसके ऊपर आगे बढ़ती है।',
    },
    onQuote: { en: 'Bricks, cement, sand, lintels', hi: 'ईंट, सीमेंट, रेत, लिंटल' },
    rows: [
      { label: { en: 'Bricks in a 9-inch wall', hi: '9 इंच की दीवार में ईंटें' }, how: { en: 'per square metre of wall', hi: 'प्रति वर्ग मीटर दीवार' }, value: '100' },
      { label: { en: 'Mortar mix', hi: 'मसाले का अनुपात' }, how: { en: '1 part cement : 6 parts sand', hi: '1 भाग सीमेंट : 6 भाग रेत' }, value: '1 : 6' },
    ],
    codes: ['IS 1077:1992', 'IS 2212:1991'],
  },
  {
    id: 'S7', src: '/v2/layers/l07.webp', z: 6, enter: 'drop',
    name: { en: 'Wiring and plumbing', hi: 'वायरिंग और प्लंबिंग' },
    what: {
      en: 'Conduits for the wires and pipes for water and drains are fitted into the walls (cut in neatly) and floors before the plaster goes on. Some already went into the slab before it was poured. The wires themselves are pulled through after plastering.',
      hi: 'तारों के कंड्यूट और पानी व नालियों के पाइप प्लास्टर से पहले दीवारों में (सफ़ाई से काटकर) और फ़र्श में लगते हैं। कुछ स्लैब के अंदर ढलाई से पहले ही डाले जा चुके होते हैं। तार खुद प्लास्टर के बाद खींचे जाते हैं।',
    },
    onQuote: { en: 'Wire, conduit, switch boards, pipes, fittings', hi: 'तार, कंड्यूट, स्विच बोर्ड, पाइप, फ़िटिंग' },
    rows: [],
    note: { en: 'There is no single number here. Wire size depends on the load of each circuit, and pipe size on the fixtures it feeds; the electrical and plumbing reports work these out room by room.', hi: 'यहाँ कोई एक संख्या नहीं है। तार का साइज़ हर सर्किट के लोड पर और पाइप का साइज़ उससे जुड़ी फ़िटिंग पर निर्भर करता है; इलेक्ट्रिकल और प्लंबिंग रिपोर्ट इसे कमरे-दर-कमरे निकालती हैं।' },
    codes: ['IS 4648', 'IS 732:1989', 'IS 1172:1993'],
  },
  {
    id: 'S8', src: '/v2/layers/l08.webp', z: 3.2, enter: 'paint',
    name: { en: 'Plaster, floor and paint', hi: 'प्लास्टर, फ़र्श और रंग' },
    what: {
      en: 'Plaster smooths the walls, the floor is laid, doors and windows are fitted, and paint goes on last. This is the part you see and live with every day.',
      hi: 'प्लास्टर दीवारों को समतल करता है, फ़र्श बिछता है, दरवाज़े-खिड़कियाँ लगती हैं और रंग सबसे आख़िर में चढ़ता है। यही वह हिस्सा है जो आप रोज़ देखते और जीते हैं।',
    },
    onQuote: { en: 'Plaster, flooring, doors and windows, paint', hi: 'प्लास्टर, फ़र्श, दरवाज़े-खिड़कियाँ, रंग' },
    rows: [],
    note: { en: 'No single number applies here. Tiles, paint and fittings are your choice, so the quantities depend on what you pick. The interior report counts them room by room, in square metres of floor and wall and litres of paint.', hi: 'यहाँ कोई एक संख्या लागू नहीं होती। टाइल, रंग और फ़िटिंग आपकी पसंद हैं, इसलिए मात्राएँ आपके चुनाव पर निर्भर करती हैं। इंटीरियर रिपोर्ट इन्हें कमरे-दर-कमरे गिनती है: फ़र्श और दीवार वर्ग मीटर में, रंग लीटर में।' },
    codes: ['IS 1200', 'IS 2395 (Part 1)'],
  },
]

/** Surveyor's-tape ticker content: each IS code is a "number" on the tape. */
export const TAPE_CODES = IS_CODES

// Static content for the v2 homepage. Prices, hrefs and IS codes are carried over verbatim from the legacy page.

export const IS_CODES = [
  'IS 456:2000', 'IS 1786:2008', 'IS 1893:2016', 'IS 13920:2016',
  'IS 1077:1992', 'IS 12894:2002', 'IS 2185:2005', 'IS 2212:1991',
  'IS 1661:1972', 'IS 2645:2003', 'IS 4326:1993', 'IS 732:2019',
  'IS 694:2010', 'IS 8828:2007', 'IS 3043:2018', 'IS 1172:1993',
  'IS 1742:1983', 'IS 1904:2016', 'IS 2911:2010', 'IS 875:2015',
  'IS 2250:1981', 'IS 383:2016', 'IS 269:2015', 'IS 2547:1976',
  'NBC 2016',
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
    chips: ['IS 4326:1993', '33 ROOMS', '16 ZONES'],
    descriptorKey: 'vastuDescriptor', descKey: 'vastuDesc',
  },
  {
    key: 'struct', phase: 'P1', name: 'StructurePro', href: '/tools/structopro', price: '₹999', free: false,
    accent: '--ns-t-struct', plate: '/v2/products/p01-structurepro.webp',
    plateAlt: 'Isometric cutaway of an RCC column and beam joint with its rebar cage',
    chips: ['IS 456:2000', 'IS 13920:2016', 'IS 1893:2016'],
    descriptorKey: 'structureDescriptor', descKey: 'structureDesc',
  },
  {
    key: 'mason', phase: 'P2', name: 'MasonryPro', href: '/tools/masonpro', price: '₹699', free: false,
    accent: '--ns-t-mason', plate: '/v2/products/p02-masonpro.webp',
    plateAlt: 'Isometric corner of an English-bond brick wall with a window and lintel',
    chips: ['IS 1077:1992', 'IS 2212:1991', 'IS 1661:1972'],
    descriptorKey: 'masonryDescriptor', descKey: 'masonryDesc',
  },
  {
    key: 'elec', phase: 'P3', name: 'ElectricalPro', href: '/tools/electropro', price: '₹499', free: false,
    accent: '--ns-t-elec', plate: '/v2/products/p03-electricalpro.webp',
    plateAlt: 'Isometric wall section with recessed conduit, switch box and distribution board',
    chips: ['IS 732:2019', 'IS 3043:2018'],
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

/** The seven code-built isometric layers, in stack order (see design-v2-layers-code-build.md). */
export interface LayerDef {
  id: string
  src: string
  name: { en: string; hi: string }
  codes: string[]
  /** locked Build Reference Section 8 fact shown for this layer */
  fact: { en: string; hi: string }
  factNum: string
}

export const LAYERS: LayerDef[] = [
  {
    id: 'L01', src: '/v2/layers/l01.webp',
    name: { en: 'Footings', hi: 'फुटिंग' },
    codes: ['IS 456:2000', 'IS 1904:2016'],
    fact: { en: 'Footing steel at 0.50% of the concrete volume', hi: 'फुटिंग में स्टील — कंक्रीट आयतन का 0.50%' },
    factNum: '39.25 kg/m³',
  },
  {
    id: 'L02', src: '/v2/layers/l02.webp',
    name: { en: 'Columns', hi: 'कॉलम' },
    codes: ['IS 456:2000', 'IS 13920:2016'],
    fact: { en: 'Column steel at 2.50%; hinge-zone ties at d/4 or 100 mm, whichever is less', hi: 'कॉलम में स्टील 2.50%; हिंज ज़ोन में टाई d/4 या 100 mm, जो कम हो' },
    factNum: '196.25 kg/m³',
  },
  {
    id: 'L03', src: '/v2/layers/l03.webp',
    name: { en: 'Plinth beams', hi: 'प्लिंथ बीम' },
    codes: ['IS 456:2000', 'IS 4326:1993'],
    fact: { en: 'Plinth beam steel at 1.50%', hi: 'प्लिंथ बीम में स्टील 1.50%' },
    factNum: '117.75 kg/m³',
  },
  {
    id: 'L04', src: '/v2/layers/l04.webp',
    name: { en: 'Brick walls', hi: 'ईंट की दीवारें' },
    codes: ['IS 1077:1992', 'IS 2212:1991'],
    fact: { en: '9″ (230 mm) wall, modular bricks, 1:6 mortar', hi: '9″ (230 mm) दीवार, मॉड्यूलर ईंट, 1:6 मसाला' },
    factNum: '100 bricks/m²',
  },
  {
    id: 'L05', src: '/v2/layers/l05.webp',
    name: { en: 'Lintels & beams', hi: 'लिंटल और बीम' },
    codes: ['IS 456:2000', 'IS 13920:2016'],
    fact: { en: 'Roof-level beam steel at 1.50%', hi: 'छत-स्तर की बीम में स्टील 1.50%' },
    factNum: '117.75 kg/m³',
  },
  {
    id: 'L06', src: '/v2/layers/l06.webp',
    name: { en: 'Roof slab', hi: 'छत की स्लैब' },
    codes: ['IS 456:2000', 'IS 1786:2008'],
    fact: { en: 'Slab steel at 1.00%; M20 mix is 1:1.5:3', hi: 'स्लैब में स्टील 1.00%; M20 मिक्स 1:1.5:3' },
    factNum: '78.50 kg/m³',
  },
  {
    id: 'L07', src: '/v2/layers/l07.webp',
    name: { en: 'Electrical + plumbing', hi: 'इलेक्ट्रिकल + प्लंबिंग' },
    codes: ['IS 732:2019', 'IS 1172:1993'],
    fact: { en: 'Conduit, DB, tank, riser and drain — sized per code', hi: 'कंड्यूट, DB, टंकी, राइज़र और ड्रेन — कोड के अनुसार' },
    factNum: '5 phases · 1 BOQ',
  },
]

/** Surveyor's-tape ticker content: each IS code is a "number" on the tape. */
export const TAPE_CODES = IS_CODES

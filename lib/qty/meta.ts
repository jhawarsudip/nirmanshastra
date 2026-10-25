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

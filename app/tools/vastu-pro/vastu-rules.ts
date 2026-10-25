// VastuPro: the rule table. Plain data and small helpers; the reading itself is in vastu-reading.ts.
//
// Every rule carries a basis so a reader can tell an old text from a modern habit:
//   classical  stated in the traditional texts (Brihat Samhita ch. 53, Mayamata) and repeated by most teachers
//   taught     widely taught today; the older texts are silent on it, or teachers differ
//   modern     a recent convention with no basis in the texts we could check
// A "modern" rule can never read worse than "To review" (see capSeverity); only rules with older roots can be "Serious".
//
// Zone indices: 0 N, 1 NNE, 2 NE, 3 ENE, 4 E, 5 ESE, 6 SE, 7 SSE, 8 S, 9 SSW, 10 SW, 11 WSW, 12 W, 13 WNW, 14 NW, 15 NNW.
// The 16-way split of the compass is itself a modern convention. The older texts divide the boundary of the plot
// into 32 padas, which is how the main door is read (see PADA_RING).

import type { Basis, RemedySet, Severity } from './vastu-types'

export const RULES_VERSION = 'VP rules 1.0, 25 Oct 2026'

export const SEV_SCORE: Record<Severity, number> = { POSITIVE: 100, NEUTRAL: 70, MODERATE: 40, CRITICAL: 0 }

/** Worst first. */
export const SEV_RANK: Record<Severity, number> = { CRITICAL: 0, MODERATE: 1, NEUTRAL: 2, POSITIVE: 3 }

export function worse(a: Severity, b: Severity): Severity {
  return SEV_RANK[a] <= SEV_RANK[b] ? a : b
}

/** A rule with no basis in the older texts is not allowed to call anything "Serious". */
export function capSeverity(basis: Basis, s: Severity): Severity {
  if (basis === 'modern' && s === 'CRITICAL') return 'MODERATE'
  return s
}

// ------------------------------------------------------------------------------------------------ zones

export interface ZoneInfo {
  index: number
  short: string
  full: string
  /** the guardian of the eight main directions (agreed in the texts); the in-between zones have none */
  lord?: string
}

export const ZONES: ZoneInfo[] = [
  { index: 0, short: 'N', full: 'North', lord: 'Kubera' },
  { index: 1, short: 'NNE', full: 'North-north-east' },
  { index: 2, short: 'NE', full: 'North-east', lord: 'Ishana' },
  { index: 3, short: 'ENE', full: 'East-north-east' },
  { index: 4, short: 'E', full: 'East', lord: 'Indra' },
  { index: 5, short: 'ESE', full: 'East-south-east' },
  { index: 6, short: 'SE', full: 'South-east', lord: 'Agni' },
  { index: 7, short: 'SSE', full: 'South-south-east' },
  { index: 8, short: 'S', full: 'South', lord: 'Yama' },
  { index: 9, short: 'SSW', full: 'South-south-west' },
  { index: 10, short: 'SW', full: 'South-west', lord: 'Nirriti' },
  { index: 11, short: 'WSW', full: 'West-south-west' },
  { index: 12, short: 'W', full: 'West', lord: 'Varuna' },
  { index: 13, short: 'WNW', full: 'West-north-west' },
  { index: 14, short: 'NW', full: 'North-west', lord: 'Vayu' },
  { index: 15, short: 'NNW', full: 'North-north-west' },
]

export function zoneText(z: number): string {
  const info = ZONES[z]
  return info ? `${info.full} (${info.short})` : 'the centre'
}

// ------------------------------------------------------------------------------------------------ the 32 padas of the boundary

/**
 * Brihat Samhita ch. 53 names the 32 devatas of the boundary of the Vastu grid and says which positions of a door
 * are good or bad. The ring is read clockwise from the NE corner: the east side (NE to SE), the south side
 * (SE to SW), the west side (SW to NW), then the north side (NW to NE). Each side is divided into nine equal parts;
 * the first part is the corner it starts from, and the ninth part is the corner it ends on, which is the first
 * pada of the next side.
 *
 * The favourable / mixed / cautioned split follows the Iyer (1884) translation and agrees with the tables most
 * teachers use. Names of the corner padas differ between Brihat Samhita and Mayamata. The translation has quirks,
 * so this table must be checked against a printed edition (Bhat, Motilal Banarsidass) before it is published.
 */
export type PadaTone = 'favourable' | 'mixed' | 'cautioned'
export type Side = 'E' | 'S' | 'W' | 'N'

export interface Pada {
  name: string
  tone: PadaTone
}

const P = (name: string, tone: PadaTone): Pada => ({ name, tone })

export const PADA_RING: Record<Side, Pada[]> = {
  E: [P('Shikhi', 'cautioned'), P('Parjanya', 'mixed'), P('Jayanta', 'favourable'), P('Indra', 'favourable'), P('Surya', 'cautioned'), P('Satya', 'cautioned'), P('Bhrisha', 'cautioned'), P('Antariksha', 'cautioned')],
  S: [P('Anila', 'cautioned'), P('Pusha', 'cautioned'), P('Vitatha', 'cautioned'), P('Grihakshata', 'mixed'), P('Yama', 'cautioned'), P('Gandharva', 'cautioned'), P('Bhringaraja', 'cautioned'), P('Mriga', 'cautioned')],
  W: [P('Pitr', 'cautioned'), P('Dauvarika', 'cautioned'), P('Sugriva', 'cautioned'), P('Pushpadanta', 'favourable'), P('Varuna', 'favourable'), P('Asura', 'cautioned'), P('Shosha', 'cautioned'), P('Papayakshma', 'cautioned')],
  N: [P('Roga', 'cautioned'), P('Naga', 'cautioned'), P('Mukhya', 'favourable'), P('Bhallata', 'favourable'), P('Soma', 'favourable'), P('Bhujaga', 'cautioned'), P('Aditi', 'cautioned'), P('Diti', 'cautioned')],
}

export const SIDE_ORDER: Side[] = ['E', 'S', 'W', 'N']
export const SIDE_FULL: Record<Side, string> = { E: 'east', S: 'south', W: 'west', N: 'north' }

/** Where a door falls on the ring: which side, which of the eight padas, counted from the corner the side starts at. */
export function padaAt(side: Side, t: number): { side: Side; index: number; pada: Pada } {
  const part = Math.min(Math.max(Math.floor(t * 9), 0), 8)
  if (part === 8) {
    const next = SIDE_ORDER[(SIDE_ORDER.indexOf(side) + 1) % 4]
    return { side: next, index: 0, pada: PADA_RING[next][0] }
  }
  return { side, index: part, pada: PADA_RING[side][part] }
}

// ------------------------------------------------------------------------------------------------ sources shown in the report

export interface SourceNote {
  work: string
  note: string
}

export const SOURCES: SourceNote[] = [
  { work: 'Brihat Samhita, ch. 53, “On House-building” (Varahamihira, about the 6th century)', note: 'The earliest datable text with a chapter on the house. Read in the 1884 translation by N. Chidambaram Iyer. Source of the 32 entrance positions, the kitchen and prayer-room directions, and the directions for a water source.' },
  { work: 'Mayamata (south India, about the 5th to 7th century)', note: 'Read in Bruno Dagens’s translation and in Ripan Ghosh’s 2024 study. Source of the Vastu grid, the Brahmasthana kept open, and the rule that no door faces it.' },
  { work: 'Samarangana Sutradhara (Bhoja, 11th century)', note: 'Read through D. N. Shukla’s digest. Source for door defects and house types.' },
  { work: 'Vibhuti Chakrabarti, Indian Architectural Theory and Practice (Routledge, 2013)', note: 'The best synthesis of what the texts say and of how consultants use them today. It is also critical of consultant practice.' },
  { work: 'En-Yu Huang, Comparing the Do’s and Taboos in Chinese Feng-Shui and Indian Vastu-Shastra (Leiden, 2012)', note: 'Separates what the old texts say from what modern manuals teach.' },
]

// ------------------------------------------------------------------------------------------------ rooms

/** How a room treats the Brahmasthan, the central ninth of the plan. */
export type CentreRule = 'open' | 'ok' | 'avoid' | 'avoid-serious'

export interface RoomRule {
  kind: string
  basis: Basis
  /** a verse or chapter, shown beside the basis; only for rules with a source */
  source?: string
  zones: Severity[]
  /** where the tradition prefers it, in words */
  prefer: string
  /** what the tradition says, in one or two sentences, without outcomes */
  principle: string
  /** set when the older texts and today's teachers differ */
  disputed?: string
  /** the dispute is shown only when the room sits in one of these zones; if empty it is always shown */
  disputedZones?: number[]
  /** a real engineering or climate reason, only where one exists */
  practical?: string
  centre: CentreRule
  /** 1 to 3 */
  weight: 1 | 2 | 3
}

function z(positive: number[], moderate: number[], critical: number[], neutral: number[] = []): Severity[] {
  const arr: Severity[] = new Array(16).fill('NEUTRAL') as Severity[]
  positive.forEach(i => { arr[i] = 'POSITIVE' })
  neutral.forEach(i => { arr[i] = 'NEUTRAL' })
  moderate.forEach(i => { arr[i] = 'MODERATE' })
  critical.forEach(i => { arr[i] = 'CRITICAL' })
  return arr
}

const N_E_LIGHT = 'In most of India the north and east sides get the softer light and the south and west take the afternoon sun, so rooms used in the day do well on the north and east side.'

export const ROOM_RULES: Record<string, RoomRule> = {
  main_door: {
    kind: 'main_door',
    basis: 'classical',
    source: 'Brihat Samhita ch. 53',
    zones: z([0, 1, 2, 3, 4, 13, 14, 15], [5, 7, 12], [6, 8, 9, 10, 11]),
    prefer: 'the north or east side, at one of the favoured positions of the boundary',
    principle: 'The texts do not just say which side the door is on. They say where along that side it sits: each of the 32 positions of the boundary has a guardian, and a few positions are named as favourable.',
    disputed: 'Some texts list a position on the south side as acceptable, while many consultants advise against a south door altogether. Teachers also differ on whether a door should be in the middle of a wall.',
    centre: 'ok',
    weight: 3,
  },
  back_door: {
    kind: 'back_door',
    basis: 'modern',
    zones: z([8, 9, 10, 11, 12], [6, 7, 13, 14, 15], [0, 1, 2, 3, 4]),
    prefer: 'the south or west side',
    principle: 'The older texts name no place for a back door. Teachers today keep it away from the north-east, so that the north-east stays the quiet, light side of the house.',
    centre: 'ok',
    weight: 1,
  },
  side_door: {
    kind: 'side_door',
    basis: 'modern',
    zones: z([0, 1, 4, 13, 14, 15], [3, 5, 6, 12], [8, 9, 10, 11]),
    prefer: 'the north, east or north-west side',
    principle: 'The older texts name no place for a side door. Teachers today follow the same preference as for the main door.',
    centre: 'ok',
    weight: 1,
  },

  living_room: {
    kind: 'living_room', basis: 'taught',
    zones: z([0, 1, 2, 3, 4], [12, 13, 14, 15, 6, 7], [8, 9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'Teachers place the main sitting space on the north or east side, the side that opens to guests and morning light. The older texts do not fix a place for it.',
    practical: N_E_LIGHT,
    centre: 'open', weight: 1,
  },
  hall: {
    kind: 'hall', basis: 'taught',
    zones: z([0, 1, 2, 3, 4], [12, 13, 14, 15, 6, 7], [8, 9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'A hall is read like the living room. A hall or open court at the centre fits the old idea of keeping the middle of the house open.',
    practical: N_E_LIGHT,
    centre: 'open', weight: 1,
  },
  lobby: {
    kind: 'lobby', basis: 'taught',
    zones: z([0, 1, 2, 4, 15], [3, 12, 13, 14, 8], [6, 7, 9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'A lobby or foyer is the first space a visitor enters, so teachers place it on the favoured sides of the house.',
    centre: 'open', weight: 1,
  },
  lounge: {
    kind: 'lounge', basis: 'modern',
    zones: z([0, 1, 2, 3, 4], [12, 13, 14, 6, 7, 15], [8, 9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'A lounge is a modern room type, read like the living room.',
    practical: N_E_LIGHT,
    centre: 'open', weight: 1,
  },
  dining_room: {
    kind: 'dining_room', basis: 'taught',
    zones: z([4, 12, 0, 13, 6], [1, 8, 2, 14, 15], [9, 10, 11, 7]),
    prefer: 'the east, west or north, next to the kitchen',
    principle: 'Teachers place the dining space beside the kitchen, on the east, west or north side. Samarangana Sutradhara also keeps the dining space near the kitchen.',
    centre: 'ok', weight: 1,
  },

  master_bedroom: {
    kind: 'master_bedroom', basis: 'taught',
    zones: z([9, 10, 11], [8, 12, 14, 0, 15, 13], [1, 2, 3, 4, 5, 6, 7]),
    prefer: 'the south-west',
    principle: 'Teachers today put the heads of the household in the south-west, the heavy, stable corner. No older text we could check names a place for the master bedroom; the south-west is a later teaching.',
    disputed: 'Some teachers prefer the south or west for the master bedroom; the south-west is the most common teaching.',
    disputedZones: [8, 12],
    centre: 'avoid', weight: 2,
  },
  parents_room: {
    kind: 'parents_room', basis: 'taught',
    zones: z([10, 11, 9], [14, 8, 12, 0, 15, 13], [1, 2, 3, 4, 5, 6]),
    prefer: 'the south-west or west',
    principle: 'Teachers place elders’ rooms on the south-west or west side, away from the north-east.',
    centre: 'avoid', weight: 1,
  },
  childrens_room: {
    kind: 'childrens_room', basis: 'taught',
    zones: z([4, 12, 14, 13], [0, 1, 15, 3, 8, 7], [9, 10, 2, 6, 11]),
    prefer: 'the east, west or north-west',
    principle: 'Teachers place children’s rooms on the east, west or north-west side. The older texts say nothing specific.',
    centre: 'avoid', weight: 1,
  },
  guest_bedroom: {
    kind: 'guest_bedroom', basis: 'taught',
    zones: z([14, 15, 12, 13], [0, 4, 8, 5, 1], [2, 6, 9, 10, 11]),
    prefer: 'the north-west or west',
    principle: 'Teachers place guest rooms on the north-west or west side, the side of Vayu, the guardian of movement.',
    centre: 'avoid', weight: 1,
  },

  kitchen: {
    kind: 'kitchen', basis: 'classical', source: 'Brihat Samhita ch. 53',
    zones: z([5, 6, 7], [14, 15, 8, 4, 12], [0, 1, 2, 3, 9, 10, 11]),
    prefer: 'the south-east, the side of Agni, the guardian of fire',
    principle: 'Brihat Samhita names the south-east for the kitchen, the side of Agni, the guardian of fire. How serious the other directions are comes from later teachers, who keep the fire room away from the north-east, the side kept for the prayer room and for water.',
    disputed: 'Many teachers accept the north-west as a second choice. The older text names the south-east only.',
    disputedZones: [14, 15],
    centre: 'avoid-serious', weight: 3,
  },

  bathroom: {
    kind: 'bathroom', basis: 'taught',
    zones: z([4, 5, 13, 14, 3], [0, 12, 1, 8, 7, 15], [2, 10, 6, 9, 11]),
    prefer: 'the east, west or north-west side, and never the north-east or the centre',
    principle: 'Teachers keep wet rooms away from the north-east and the centre of the plan. No older text names a place for a bathroom; this comes from later manuals.',
    practical: 'Keeping bathrooms away from the kitchen and the drinking-water point, and at the lower end of the plot’s drainage, is sound on any plan.',
    centre: 'avoid-serious', weight: 2,
  },
  toilet: {
    kind: 'toilet', basis: 'taught',
    zones: z([14, 12, 8, 9, 15], [13, 7, 4, 5, 6], [0, 1, 2, 3, 10, 11]),
    prefer: 'the north-west, west or south side, and never the north-east or the centre',
    principle: 'Teachers keep toilets out of the north-east and the centre of the plan, the sides kept for the prayer room, water and the open middle. No older text names a place for a toilet; this comes from later manuals.',
    practical: 'Keeping toilets and septic lines away from the kitchen, the drinking-water source and any well or bore is sound on any plan, whatever the direction.',
    centre: 'avoid-serious', weight: 3,
  },

  puja_room: {
    kind: 'puja_room', basis: 'classical', source: 'Brihat Samhita ch. 53',
    zones: z([2], [3, 12, 14, 13, 0, 1, 4], [5, 6, 7, 8, 9, 10, 11]),
    prefer: 'the north-east, the side of Ishana',
    principle: 'Brihat Samhita places the room of the household deity in the north-east, the side of Ishana. The north and east next to it are accepted by most teachers.',
    centre: 'ok', weight: 2,
  },
  study_room: {
    kind: 'study_room', basis: 'taught',
    zones: z([0, 1, 2, 3, 4, 12], [13, 15, 14, 8], [9, 10, 11, 6, 7]),
    prefer: 'the north, north-east, east or west',
    principle: 'Teachers place the room used for study on the north or east side, facing the morning light. The older texts do not fix a place for it.',
    practical: N_E_LIGHT,
    centre: 'ok', weight: 1,
  },
  office: {
    kind: 'office', basis: 'modern',
    zones: z([0, 1, 2, 3, 4, 12], [13, 15, 14, 8], [9, 10, 11, 6, 7]),
    prefer: 'the north, north-east, east or west',
    principle: 'A work area at home is a modern room type, read like the study.',
    practical: N_E_LIGHT,
    centre: 'ok', weight: 1,
  },

  ug_water_tank: {
    kind: 'ug_water_tank', basis: 'classical', source: 'Brihat Samhita ch. 53',
    zones: z([0, 1, 2], [12, 14, 15, 8, 9], [5, 6, 7, 10, 11], [3, 4]),
    prefer: 'the north-east or north',
    principle: 'Brihat Samhita lists the direction of a water source and names the north-east and the north as favourable, the others as cautioned. The south-east is the side of fire, and the south-west is the heaviest corner.',
    disputed: 'Brihat Samhita cautions against the east for a water source, but most teachers today accept the east. Both readings are shown, and the east counts as acceptable here.',
    disputedZones: [3, 4],
    practical: 'A tank on the side of the plot where the ground is lowest is easy to fill and drain.',
    centre: 'avoid-serious', weight: 2,
  },
  oh_water_tank: {
    kind: 'oh_water_tank', basis: 'modern',
    zones: z([8, 9, 10, 11, 12], [13, 14, 6, 7, 15], [0, 1, 2, 3, 4, 5]),
    prefer: 'the south-west or west',
    principle: 'The older texts say nothing about an overhead tank. Teachers today put the heavy load on the south-west or west and keep the north-east light.',
    practical: 'A tank is a heavy load. It must sit over a column or beam that is designed for it, wherever the Vastu preference points.',
    centre: 'avoid', weight: 1,
  },
  swimming_pool: {
    kind: 'swimming_pool', basis: 'taught',
    zones: z([0, 1, 2, 3, 4], [12, 14, 15, 13], [5, 6, 7, 8, 9, 10]),
    prefer: 'the north, north-east or east',
    principle: 'Teachers follow the rule for water sources: a body of water belongs on the north or east side and away from the fire side and the heavy south-west.',
    centre: 'avoid-serious', weight: 1,
  },

  staircase: {
    kind: 'staircase', basis: 'taught',
    zones: z([8, 9, 10, 11, 12], [6, 7, 14, 13, 15], [0, 1, 2, 3, 4]),
    prefer: 'the south, west or south-west',
    principle: 'Teachers put the staircase, a heavy and enclosed element, on the south, west or south-west side, away from the north-east and the centre. No older text names a place for it.',
    practical: 'Wherever it goes, a staircase needs enough headroom, tread and landing size to be safe. The National Building Code and local bye-laws decide that, not Vastu.',
    centre: 'avoid', weight: 2,
  },
  lift: {
    kind: 'lift', basis: 'modern',
    zones: z([9, 10, 11, 12, 8], [13, 14, 6, 7, 15], [0, 1, 2, 3, 4]),
    prefer: 'the south, west or south-west',
    principle: 'A lift is a modern element, read like the staircase.',
    centre: 'avoid', weight: 1,
  },
  store_room: {
    kind: 'store_room', basis: 'taught',
    zones: z([8, 9, 10, 11, 12, 14], [13, 15, 0, 4, 6], [1, 2, 3]),
    prefer: 'the south-west, west or north-west',
    principle: 'Brihat Samhita puts the room for household utensils in the south-west and the granary in the north-west. Teachers extend this to storage in general and keep it out of the north-east.',
    centre: 'avoid', weight: 1,
  },

  balcony: {
    kind: 'balcony', basis: 'modern',
    zones: z([0, 1, 2, 3, 4], [12, 14, 8, 7, 15], [9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'Samarangana Sutradhara asks for a verandah. The direction of a balcony comes from later teachers, who keep the open side to the north and east and the closed, heavy side to the south-west.',
    practical: N_E_LIGHT,
    centre: 'ok', weight: 1,
  },
  garden: {
    kind: 'garden', basis: 'taught',
    zones: z([0, 1, 2, 3, 4], [12, 14, 15, 8], [9, 10, 11]),
    prefer: 'the north, north-east or east',
    principle: 'Teachers keep more open space on the north and east than on the south and west. Large trees close to the house are kept on the south and west.',
    centre: 'ok', weight: 1,
  },
  car_parking: {
    kind: 'car_parking', basis: 'modern',
    zones: z([5, 6, 7, 14, 15], [0, 4, 12, 8, 9], [1, 2, 10, 11]),
    prefer: 'the south-east or north-west',
    principle: 'The older texts do not mention vehicles. Teachers today put them on the south-east or north-west and keep them out of the north-east.',
    centre: 'avoid', weight: 1,
  },
}

// ------------------------------------------------------------------------------------------------ notes for a few placements

/**
 * A few placements teachers single out. These replace the general line in "what the tradition says". Written as the
 * tradition’s view; none of them is a prediction.
 */
export const SPECIAL: Record<string, string> = {
  kitchen_2: 'A kitchen in the north-east is the placement teachers warn against most firmly. The north-east is the side of Ishana, kept for the prayer room and for water, and a cooking fire there is the opposite of what the tradition puts in that corner.',
  kitchen_10: 'A kitchen in the south-west is cautioned by teachers: the south-west is the side of Nirriti, the heaviest and most stable corner, and the tradition keeps the fire room on the south-east instead.',
  kitchen_6: 'The south-east is the side of Agni, the guardian of fire, and is the place Brihat Samhita names for the kitchen.',
  master_bedroom_2: 'A bedroom in the north-east is cautioned by teachers: the north-east is meant to stay the lightest and quietest part of the house, with the prayer room or an open space.',
  master_bedroom_10: 'The south-west is the side of Nirriti, the heavy, stable corner, and is where teachers place the heads of the household.',
  puja_room_2: 'The north-east is the side of Ishana, and Brihat Samhita names it for the room of the household deity.',
  puja_room_10: 'A prayer room in the south-west is cautioned by teachers: the south-west is the heavy, stable corner, while the tradition puts the prayer room on the light north-east side.',
  toilet_2: 'A toilet in the north-east is the placement teachers warn against most firmly: the north-east is the side kept for the prayer room, water and the open, light part of the house.',
  bathroom_2: 'A bathroom in the north-east is cautioned by teachers, who keep the north-east for the prayer room, water and light.',
  staircase_2: 'A staircase in the north-east is cautioned by teachers: it is a heavy, enclosed element, and the north-east is meant to stay the lightest part of the house.',
  ug_water_tank_2: 'The north-east is where Brihat Samhita places a water source, and it is the favoured place in most teaching.',
  ug_water_tank_6: 'Water in the south-east, the side of Agni, the guardian of fire, is cautioned both by Brihat Samhita and by today’s teachers.',
}

// ------------------------------------------------------------------------------------------------ remedies, dos and don’ts

const NONSTRUCT = 'Do not move a wall, column, beam or plumbing line for Vastu without a structural engineer and the bye-law check.'

/**
 * Remedies are in two tiers. Structural: only worth doing if the building work is happening anyway. Practical: no
 * building work. No product (pyramid, crystal, mirror, metal strip) is recommended; none has a basis in the texts.
 */
export const REMEDIES: Record<string, RemedySet> = {
  main_door: {
    structural: ['If the door is being moved or rebuilt anyway, shift it along the same wall to one of the favoured positions of the boundary shown above.', NONSTRUCT],
    practical: ['Keep the entrance well lit, clean and clear of shoes and clutter.', 'Check the approach on site: a pole, a tree, a well or the end of a road directly facing the door is cautioned in the older texts.', 'A door that sticks, creaks or swings by itself is also cautioned. Fix the hinges.'],
  },
  back_door: {
    structural: ['If the wall is being rebuilt anyway, move the back door toward the south or west side.', NONSTRUCT],
    practical: ['Keep the back door closed when not in use.'],
  },
  side_door: {
    structural: ['If the wall is being rebuilt anyway, move the side door toward the north, east or north-west side.', NONSTRUCT],
    practical: ['Keep the side door closed when not in use.'],
  },
  living_room: {
    structural: ['Keep the living room on the north or east side if the plan is still open.'],
    practical: ['Place the heavier furniture on the south and west walls and keep the north and east side open and light.', 'Sit facing north or east when you receive guests, if the layout allows.'],
  },
  hall: {
    structural: ['Keep the hall on the north or east side if the plan is still open.'],
    practical: ['Keep the middle of the hall free of heavy furniture.', 'Place the heavier pieces on the south and west walls.'],
  },
  lobby: { structural: [], practical: ['Keep the lobby clear and well lit.'] },
  lounge: { structural: [], practical: ['Place the heavier furniture on the south and west walls.'] },
  dining_room: {
    structural: ['Keep the dining space next to the kitchen if the plan is still open.'],
    practical: ['Sit facing east or north while eating, if the layout allows.'],
  },
  master_bedroom: {
    structural: ['If the plan is still open, place the master bedroom in the south-west.', NONSTRUCT],
    practical: ['Place the bed against the south or west wall, so that you sleep with your head to the south or east, as most teachers advise.', 'Keep the bedroom free of clutter and keep electronics away from the bed.'],
  },
  parents_room: {
    structural: ['If the plan is still open, place the elders’ room in the south-west or west.'],
    practical: ['Place the bed so the head is to the south or east.'],
  },
  childrens_room: {
    structural: ['If the plan is still open, place the children’s room on the east, west or north-west.'],
    practical: ['Place the study table so the child faces east or north when studying.'],
  },
  guest_bedroom: {
    structural: ['If the plan is still open, place the guest room on the north-west or west.'],
    practical: ['Keep the guest room closed and aired when not in use.'],
  },
  kitchen: {
    structural: ['If you are re-planning anyway, move the kitchen to the south-east of the house.', 'If only the room is being re-laid, move the cooking platform to the south-east part of the kitchen.', NONSTRUCT],
    practical: ['Cook facing east if the layout allows.', 'Keep the stove on the south-east side of the kitchen and the sink and water filter on the north-east side, apart from the stove.', 'Keep the north-east corner of the kitchen light and free of clutter.'],
  },
  bathroom: {
    structural: ['If you are re-planning anyway, move the bathroom to the east, west or north-west side.', NONSTRUCT],
    practical: ['Keep the bathroom door closed and the room well ventilated.', 'Fix any leak at once; a damp wall next to the prayer room or kitchen is a problem on any plan.'],
  },
  toilet: {
    structural: ['If you are re-planning anyway, move the toilet to the north-west, west or south side.', NONSTRUCT],
    practical: ['Keep the toilet door closed and the room well ventilated.', 'Keep the toilet seat facing north or south, not east or west, as most teachers advise.', 'Check that the septic line runs away from the kitchen and any drinking-water source.'],
  },
  puja_room: {
    structural: ['If you are re-planning anyway, move the prayer room to the north-east.', NONSTRUCT],
    practical: ['Keep the prayer space clean and keep nothing else stored in it.', 'Face east or north while praying, if the layout allows.', 'A small shelf or wall niche in the north-east of a living room is a lighter alternative where a separate room is not possible.'],
  },
  study_room: {
    structural: ['If the plan is still open, place the study on the north or east side.'],
    practical: ['Place the desk so you face north or east when you study.', 'Keep the desk away from a beam overhead.'],
  },
  office: {
    structural: [],
    practical: ['Place the desk so you face north or east when you work.', 'Sit with a solid wall behind you, not a door.'],
  },
  ug_water_tank: {
    structural: ['If the tank is being built or replaced anyway, place it in the north-east or north of the plot.', NONSTRUCT],
    practical: ['Keep the tank covered and clean.'],
  },
  oh_water_tank: {
    structural: ['If the tank is being relocated anyway, place it on the south-west or west of the roof, over a column or beam designed for it.', NONSTRUCT],
    practical: ['Keep the north-east of the roof light and uncluttered.'],
  },
  swimming_pool: {
    structural: ['If the pool is still being planned, place it on the north or east of the plot.'],
    practical: ['Keep the area around the pool clean and well drained.'],
  },
  staircase: {
    structural: ['If you are re-planning anyway, move the staircase to the south or west side.', NONSTRUCT],
    practical: ['Keep the staircase well lit and its landing clear.', 'Keep the area under the stairs free of a prayer space and a toilet.'],
  },
  lift: { structural: [], practical: ['Keep the lift lobby clear and well lit.'] },
  store_room: {
    structural: ['If the plan is still open, place the store room in the south-west, west or north-west.'],
    practical: ['Keep heavy goods on the south and west side of the store room and the north-east corner light.'],
  },
  balcony: { structural: [], practical: ['Keep the north and east balcony light and open.', 'Keep heavy planters and furniture on the south and west side.'] },
  garden: {
    structural: [],
    practical: ['Keep the north and east of the plot more open, and larger trees to the south and west.'],
  },
  car_parking: {
    structural: ['If the plan is still open, place parking on the south-east or north-west.'],
    practical: ['Keep the north-east of the plot free of parked vehicles and stored goods.'],
  },
}

export const DOS: Record<string, string[]> = {
  main_door: ['Keep the entrance well lit and clean.', 'Make the main door the best-made door in the house.'],
  kitchen: ['Keep the kitchen clean and ventilated.', 'Cook facing east if the layout allows.'],
  puja_room: ['Keep the prayer room clean and quiet.', 'Face east or north while praying.'],
  master_bedroom: ['Keep the room airy and uncluttered.', 'Sleep with your head to the south or east.'],
  bathroom: ['Keep it dry and ventilated.'],
  toilet: ['Keep it dry and ventilated.'],
  staircase: ['Keep it well lit.', 'Keep it clear of stored items.'],
  ug_water_tank: ['Keep it covered.'],
  study_room: ['Face north or east while you study.'],
  living_room: ['Keep the north and east side open and light.'],
}

export const DONTS: Record<string, string[]> = {
  main_door: ['Do not put a dustbin or shoe stack at the front door.', 'Do not leave a door that creaks or swings by itself.'],
  kitchen: ['Do not put the stove directly opposite the entrance to the kitchen.', 'Do not store waste in the north-east of the kitchen.'],
  puja_room: ['Do not store anything else in the prayer room.', 'Do not place it next to a toilet or under a staircase.'],
  master_bedroom: ['Do not sleep under an exposed beam.', 'Do not place the bed so the feet point at the door.'],
  bathroom: ['Do not leave leaks unrepaired.'],
  toilet: ['Do not place it next to the prayer room or the kitchen.'],
  staircase: ['Do not store things under the stairs that block air or light.'],
  ug_water_tank: ['Do not build a septic tank near it.'],
  study_room: ['Do not sit with your back to the door.'],
  living_room: ['Do not crowd the middle of the room with heavy furniture.'],
}

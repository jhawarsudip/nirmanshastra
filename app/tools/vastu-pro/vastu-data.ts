// Vastu zone and room compliance data — ported from VastuSutra reference logic.
// Zone indices: 0=N, 1=NNE, 2=NE, 3=ENE, 4=E, 5=ESE, 6=SE, 7=SSE,
//               8=S, 9=SSW, 10=SW, 11=WSW, 12=W, 13=WNW, 14=NW, 15=NNW

export type Severity = 'CRITICAL' | 'MODERATE' | 'NEUTRAL' | 'POSITIVE'

export interface ZoneDefinition {
  index: number
  name: string
  full: string
  deity: string
  meaning: string
}

export interface RoomDefinition {
  key: string
  label: string
  category: string
  multiInstance: boolean
  abbrev: string
  zoneSeverity: Severity[]  // 16 entries indexed by zone
}

export const ZONE_SCORE: Record<Severity, number> = {
  POSITIVE: 100,
  NEUTRAL: 70,
  MODERATE: 40,
  CRITICAL: 0,
}

export const ZONES: ZoneDefinition[] = [
  { index: 0,  name: 'N',   full: 'North',           deity: 'Kuber',         meaning: 'Wealth & Prosperity' },
  { index: 1,  name: 'NNE', full: 'North-Northeast',  deity: 'Adi Brahman',   meaning: 'Skill & Awareness' },
  { index: 2,  name: 'NE',  full: 'Northeast',        deity: 'Ishan',         meaning: 'Divine Blessings' },
  { index: 3,  name: 'ENE', full: 'East-Northeast',   deity: 'Parjanya',      meaning: 'Health & Clarity' },
  { index: 4,  name: 'E',   full: 'East',             deity: 'Indra',         meaning: 'Strength & Success' },
  { index: 5,  name: 'ESE', full: 'East-Southeast',   deity: 'Vitathya',      meaning: 'Intelligence' },
  { index: 6,  name: 'SE',  full: 'Southeast',        deity: 'Agni',          meaning: 'Fire & Energy' },
  { index: 7,  name: 'SSE', full: 'South-Southeast',  deity: 'Graha Kshat',   meaning: 'Confidence' },
  { index: 8,  name: 'S',   full: 'South',            deity: 'Yama',          meaning: 'Discipline & Order' },
  { index: 9,  name: 'SSW', full: 'South-Southwest',  deity: 'Nirriti',       meaning: 'Instinct & Intuition' },
  { index: 10, name: 'SW',  full: 'Southwest',        deity: 'Nairutya',      meaning: 'Stability & Strength' },
  { index: 11, name: 'WSW', full: 'West-Southwest',   deity: 'Diti',          meaning: 'Attachment & Relations' },
  { index: 12, name: 'W',   full: 'West',             deity: 'Varuna',        meaning: 'Knowledge & Gains' },
  { index: 13, name: 'WNW', full: 'West-Northwest',   deity: 'Pushpa Danta',  meaning: 'Pleasure & Enjoyment' },
  { index: 14, name: 'NW',  full: 'Northwest',        deity: 'Vayu',          meaning: 'Air, Movement & Support' },
  { index: 15, name: 'NNW', full: 'North-Northwest',  deity: 'Mukhya',        meaning: 'Life Force & Vitality' },
]

// Helper: build 16-element severity array
function z(
  positive: number[],
  moderate: number[],
  critical: number[]
): Severity[] {
  const arr: Severity[] = new Array(16).fill('NEUTRAL') as Severity[]
  positive.forEach(i => { arr[i] = 'POSITIVE' })
  moderate.forEach(i => { arr[i] = 'MODERATE' })
  critical.forEach(i => { arr[i] = 'CRITICAL' })
  return arr
}

export const ROOM_CATEGORIES = [
  'Entrances',
  'Water',
  'Gathering',
  'Bedrooms',
  'Kitchen',
  'Bathrooms',
  'Sacred & Study',
  'Storage & Vertical',
  'Outdoor',
  'Vehicles',
  'Leisure & Work',
]

export const ROOMS: RoomDefinition[] = [
  // ── Entrances ──────────────────────────────────────────────────────────────
  {
    key: 'main_door',
    label: 'Main Door',
    category: 'Entrances',
    multiInstance: false,
    abbrev: 'MD',
    zoneSeverity: z(
      [0, 1, 2, 3, 4, 13, 14, 15],       // positive: N, NNE, NE, ENE, E, WNW, NW, NNW
      [5, 7, 12],                          // moderate: ESE, SSE, W
      [6, 8, 9, 10, 11]                    // critical: SE, S, SSW, SW, WSW
    ),
  },
  {
    key: 'back_entrance',
    label: 'Back Entrance',
    category: 'Entrances',
    multiInstance: false,
    abbrev: 'BE',
    zoneSeverity: z(
      [8, 9, 10, 11, 12],                  // positive: S, SSW, SW, WSW, W
      [6, 7, 13, 14, 15],                  // moderate: SE, SSE, WNW, NW, NNW
      [0, 1, 2, 3, 4]                      // critical: N, NNE, NE, ENE, E
    ),
  },
  {
    key: 'side_entrance',
    label: 'Side Entrance',
    category: 'Entrances',
    multiInstance: true,
    abbrev: 'SE',
    zoneSeverity: z(
      [0, 1, 4, 13, 14, 15],              // positive: N, NNE, E, WNW, NW, NNW
      [3, 5, 6, 12],                       // moderate: ENE, ESE, SE, W
      [8, 9, 10, 11]                       // critical: S, SSW, SW, WSW
    ),
  },

  // ── Water ──────────────────────────────────────────────────────────────────
  {
    key: 'ug_water_tank',
    label: 'Underground Water Tank',
    category: 'Water',
    multiInstance: false,
    abbrev: 'UW',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],                    // positive: N, NNE, NE, ENE, E
      [12, 14, 8, 9, 15],                  // moderate: W, NW, S, SSW, NNW
      [5, 6, 7, 10, 11]                    // critical: ESE, SE, SSE, SW, WSW
    ),
  },
  {
    key: 'oh_water_tank',
    label: 'Overhead Water Tank',
    category: 'Water',
    multiInstance: false,
    abbrev: 'OW',
    zoneSeverity: z(
      [8, 9, 10, 11, 12],                 // positive: S, SSW, SW, WSW, W
      [13, 14, 6, 7, 15],                  // moderate: WNW, NW, SE, SSE, NNW
      [0, 1, 2, 3, 4, 5]                  // critical: N, NNE, NE, ENE, E, ESE
    ),
  },

  // ── Gathering ──────────────────────────────────────────────────────────────
  {
    key: 'living_room',
    label: 'Living Room',
    category: 'Gathering',
    multiInstance: false,
    abbrev: 'LR',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],                    // positive: N, NNE, NE, ENE, E
      [12, 13, 14, 15, 6, 7],             // moderate: W, WNW, NW, NNW, SE, SSE
      [8, 9, 10, 11]                       // critical: S, SSW, SW, WSW
    ),
  },
  {
    key: 'hall',
    label: 'Hall',
    category: 'Gathering',
    multiInstance: false,
    abbrev: 'HL',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],
      [12, 13, 14, 15, 6, 7],
      [8, 9, 10, 11]
    ),
  },
  {
    key: 'lobby',
    label: 'Lobby',
    category: 'Gathering',
    multiInstance: false,
    abbrev: 'LB',
    zoneSeverity: z(
      [0, 1, 2, 4, 15],
      [3, 12, 13, 14, 8],
      [6, 7, 9, 10, 11]
    ),
  },
  {
    key: 'dining_room',
    label: 'Dining Room',
    category: 'Gathering',
    multiInstance: false,
    abbrev: 'DR',
    zoneSeverity: z(
      [4, 12, 0, 13, 6],                  // positive: E, W, N, WNW, SE (near kitchen)
      [1, 8, 2, 14, 15],                   // moderate: NNE, S, NE, NW, NNW
      [9, 10, 11, 7]                       // critical: SSW, SW, WSW, SSE
    ),
  },
  {
    key: 'lounge',
    label: 'Lounge Area',
    category: 'Gathering',
    multiInstance: false,
    abbrev: 'LG',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],
      [12, 13, 14, 6, 7, 15],
      [8, 9, 10, 11]
    ),
  },

  // ── Bedrooms ───────────────────────────────────────────────────────────────
  {
    key: 'master_bedroom',
    label: 'Master Bedroom',
    category: 'Bedrooms',
    multiInstance: false,
    abbrev: 'MB',
    zoneSeverity: z(
      [9, 10, 11],                         // positive: SSW, SW, WSW
      [8, 12, 14, 0, 15, 13],             // moderate: S, W, NW, N, NNW, WNW
      [1, 2, 3, 4, 5, 6, 7]              // critical: NNE, NE, ENE, E, ESE, SE, SSE
    ),
  },
  {
    key: 'parents_room',
    label: 'Parents Room',
    category: 'Bedrooms',
    multiInstance: false,
    abbrev: 'PR',
    zoneSeverity: z(
      [10, 11, 9],                         // positive: SW, WSW, SSW
      [14, 8, 12, 0, 15, 13],
      [1, 2, 3, 4, 5, 6]
    ),
  },
  {
    key: 'childrens_room',
    label: "Children's Room",
    category: 'Bedrooms',
    multiInstance: true,
    abbrev: 'CR',
    zoneSeverity: z(
      [4, 12, 14, 13],                    // positive: E, W, NW, WNW
      [0, 1, 15, 3, 8, 7],
      [9, 10, 2, 6, 11]
    ),
  },
  {
    key: 'guest_bedroom',
    label: 'Guest Bedroom',
    category: 'Bedrooms',
    multiInstance: true,
    abbrev: 'GB',
    zoneSeverity: z(
      [14, 15, 12, 13],                   // positive: NW, NNW, W, WNW
      [0, 4, 8, 5, 1],
      [2, 6, 9, 10, 11]
    ),
  },

  // ── Kitchen ────────────────────────────────────────────────────────────────
  {
    key: 'kitchen',
    label: 'Kitchen',
    category: 'Kitchen',
    multiInstance: false,
    abbrev: 'KT',
    zoneSeverity: z(
      [5, 6, 7],                           // positive: ESE, SE, SSE (Agni zone)
      [14, 15, 8, 4, 12],                 // moderate: NW, NNW, S, E, W
      [0, 1, 2, 3, 9, 10, 11]            // critical: N, NNE, NE, ENE, SSW, SW, WSW
    ),
  },

  // ── Bathrooms ──────────────────────────────────────────────────────────────
  {
    key: 'bathroom',
    label: 'Bathroom',
    category: 'Bathrooms',
    multiInstance: true,
    abbrev: 'BT',
    zoneSeverity: z(
      [4, 5, 13, 14, 3],                  // positive: E, ESE, WNW, NW, ENE
      [0, 12, 1, 8, 7, 15],
      [2, 10, 6, 9, 11]
    ),
  },
  {
    key: 'toilet',
    label: 'Toilet',
    category: 'Bathrooms',
    multiInstance: true,
    abbrev: 'TL',
    zoneSeverity: z(
      [14, 12, 8, 9, 15],                 // positive: NW, W, S, SSW, NNW
      [13, 7, 4, 5, 6],
      [0, 1, 2, 3, 10, 11]               // critical: N, NNE, NE, ENE, SW, WSW
    ),
  },

  // ── Sacred & Study ─────────────────────────────────────────────────────────
  {
    key: 'puja_room',
    label: 'Puja Room',
    category: 'Sacred & Study',
    multiInstance: false,
    abbrev: 'PJ',
    zoneSeverity: z(
      [0, 1, 2, 4],                       // positive: N, NNE, NE, E (most divine)
      [3, 12, 14, 13],
      [5, 6, 7, 8, 9, 10, 11]           // critical: ESE through WSW (fire/death zones)
    ),
  },
  {
    key: 'study_room',
    label: 'Study Room',
    category: 'Sacred & Study',
    multiInstance: true,
    abbrev: 'SR',
    zoneSeverity: z(
      [0, 1, 2, 3, 4, 12],              // positive: N, NNE, NE, ENE, E, W
      [13, 15, 14, 8],
      [9, 10, 11, 6, 7]
    ),
  },

  // ── Storage & Vertical ─────────────────────────────────────────────────────
  {
    key: 'store_room',
    label: 'Store Room',
    category: 'Storage & Vertical',
    multiInstance: true,
    abbrev: 'ST',
    zoneSeverity: z(
      [8, 9, 10, 11, 12, 14],            // positive: S, SSW, SW, WSW, W, NW
      [13, 15, 0, 4, 6],
      [1, 2, 3]                           // critical: NNE, NE, ENE (sacred zones)
    ),
  },
  {
    key: 'staircase',
    label: 'Staircase',
    category: 'Storage & Vertical',
    multiInstance: false,
    abbrev: 'SC',
    zoneSeverity: z(
      [8, 9, 10, 11, 12],                // positive: S, SSW, SW, WSW, W
      [6, 7, 14, 13, 15],
      [0, 1, 2, 3, 4]                    // critical: N, NNE, NE, ENE, E (blocks divine energy)
    ),
  },
  {
    key: 'lift',
    label: 'Lift',
    category: 'Storage & Vertical',
    multiInstance: false,
    abbrev: 'LF',
    zoneSeverity: z(
      [9, 10, 11, 12, 8],
      [13, 14, 6, 7, 15],
      [0, 1, 2, 3, 4]
    ),
  },

  // ── Outdoor ────────────────────────────────────────────────────────────────
  {
    key: 'balcony',
    label: 'Balcony',
    category: 'Outdoor',
    multiInstance: true,
    abbrev: 'BC',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],                   // positive: N, NNE, NE, ENE, E
      [12, 14, 8, 7, 15],
      [9, 10, 11]                         // critical: SSW, SW, WSW
    ),
  },
  {
    key: 'garden',
    label: 'Garden',
    category: 'Outdoor',
    multiInstance: false,
    abbrev: 'GD',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],
      [12, 14, 15, 8],
      [9, 10, 11]
    ),
  },
  {
    key: 'front_yard',
    label: 'Front Yard',
    category: 'Outdoor',
    multiInstance: false,
    abbrev: 'FY',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],
      [14, 15, 13, 8],
      [9, 10, 11]
    ),
  },
  {
    key: 'backyard',
    label: 'Backyard',
    category: 'Outdoor',
    multiInstance: false,
    abbrev: 'BY',
    zoneSeverity: z(
      [8, 9, 10, 11, 12],
      [6, 7, 14, 13, 0, 1, 4],
      []                                  // backyards are generally acceptable
    ),
  },
  {
    key: 'play_area',
    label: 'Play Area',
    category: 'Outdoor',
    multiInstance: false,
    abbrev: 'PA',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],
      [12, 14, 15, 8, 6],
      [9, 10, 11]
    ),
  },
  {
    key: 'swimming_pool',
    label: 'Swimming Pool',
    category: 'Outdoor',
    multiInstance: false,
    abbrev: 'SP',
    zoneSeverity: z(
      [0, 1, 2, 3, 4],                   // positive: north/east for water
      [12, 14, 15, 13],
      [5, 6, 7, 8, 9, 10]               // critical: fire zone + south for large water body
    ),
  },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  {
    key: 'car_garage',
    label: 'Car Garage',
    category: 'Vehicles',
    multiInstance: false,
    abbrev: 'CG',
    zoneSeverity: z(
      [5, 6, 7, 14, 15],                 // positive: ESE, SE, SSE, NW, NNW
      [0, 4, 12, 8, 9],
      [1, 2, 10, 11]
    ),
  },
  {
    key: 'parking',
    label: 'Parking',
    category: 'Vehicles',
    multiInstance: false,
    abbrev: 'PK',
    zoneSeverity: z(
      [5, 6, 7, 14, 15],
      [0, 4, 12, 8],
      [1, 2, 10, 11]
    ),
  },

  // ── Leisure & Work ─────────────────────────────────────────────────────────
  {
    key: 'bar_area',
    label: 'Bar/Drinks Area',
    category: 'Leisure & Work',
    multiInstance: false,
    abbrev: 'BA',
    zoneSeverity: z(
      [12, 13, 14, 15],                  // positive: W, WNW, NW, NNW (Vayu/guest energy)
      [8, 9, 10, 11, 0, 4],
      [1, 2, 3]                          // critical: not near sacred NE zone
    ),
  },
  {
    key: 'home_theatre',
    label: 'Mini Home Theatre',
    category: 'Leisure & Work',
    multiInstance: false,
    abbrev: 'HT',
    zoneSeverity: z(
      [8, 9, 10, 11, 12],               // positive: S, SSW, SW, WSW, W
      [14, 13, 6, 7, 15],
      [0, 1, 2, 3, 4]                   // critical: entertainment in divine north/east disturbs energy
    ),
  },
  {
    key: 'office',
    label: 'Office/Work Area',
    category: 'Leisure & Work',
    multiInstance: true,
    abbrev: 'OF',
    zoneSeverity: z(
      [0, 1, 2, 3, 4, 12],             // positive: N, NNE, NE, ENE, E, W
      [13, 15, 14, 8],
      [9, 10, 11, 6, 7]
    ),
  },
]

// Impact text overrides for the most significant room-zone combinations
export const IMPACT_OVERRIDES: Record<string, string> = {
  // Kitchen critical overrides
  'kitchen_2': 'The Kitchen in the Northeast zone is the most severe Vastu dosha for a home. The Northeast is the zone of Ishan (Divine Blessings) — the most sacred and energetically sensitive corner. Placing fire (cooking) here creates a direct clash between fire and water/divine energies, causing chronic health issues, financial stress, and repeated conflicts among household members.',
  'kitchen_0': 'The Kitchen in the North zone creates significant Vastu disturbance. North is governed by Kuber (lord of wealth) — fire energy in this zone suppresses financial growth and creates unexpected expenditure cycles. Family members in this household may experience recurring monetary challenges.',
  'kitchen_10': 'The Kitchen in the Southwest zone creates a severe energy imbalance. The Southwest (Nairutya zone) governs stability and the head of household. Placing fire here weakens the health and authority of the elder members, leading to instability in family decisions and potential health challenges for the eldest woman of the house.',
  'kitchen_6': 'The Kitchen in the Southeast zone is the ideal Vastu placement. Southeast is governed by Agni (fire deity), perfectly aligning with the cooking fire. This placement supports the health of household members, ensures adequate nourishment, and promotes smooth domestic harmony. Residents will experience minimal kitchen-related ailments.',

  // Master Bedroom
  'master_bedroom_10': 'The Master Bedroom in the Southwest zone is the ideal Vastu placement for the head of household. Southwest is governed by Nairutya (strength and stability). Sleeping here gives the master of the house maximum authority, sound sleep, stability in decision-making, and long-term prosperity. This is the most auspicious placement for the couple.',
  'master_bedroom_2': 'The Master Bedroom in the Northeast zone is a critical Vastu violation. The Northeast is the zone of divine blessings (Ishan) — it should always remain open and light. Placing the heaviest room (master bedroom, with sleeping occupants adding weight and dense Yin energy) here suppresses divine energy, leading to poor health, sleep disorders, marital disharmony, and financial instability.',

  // Puja Room
  'puja_room_2': 'The Puja Room in the Northeast zone is the most auspicious placement in Vastu Shastra. The Northeast is governed by Ishan — the zone of divine consciousness. Prayer and meditation performed here align with cosmic energy fields, enhancing spiritual growth, bringing peace to the household, and attracting positive life events.',
  'puja_room_10': 'The Puja Room in the Southwest zone is a critical Vastu violation. The Southwest governs earthly stability and instinct (Nairutya) — this energy is opposite to the divine, meditative energy required for sacred spaces. Prayer performed here loses its spiritual potency and may bring anxiety rather than peace.',

  // Main Door
  'main_door_2': 'The Main Door facing Northeast is among the most auspicious entrances in Vastu Shastra. The Northeast (Ishan zone) channels divine cosmic energy directly into the home. This orientation attracts wealth, health, and spiritual progress. Residents of northeast-facing entrances tend to experience smoother life journeys and natural abundance.',
  'main_door_10': 'The Main Door facing Southwest is the most inauspicious entrance in Vastu Shastra. The Southwest (Nairutya zone) governs darkness and instability. An entry from this direction brings in destabilising energy, affecting the head of household\'s health, career, and the family\'s financial security. This placement requires urgent Vastu attention.',
  'main_door_8': 'The Main Door facing South is inauspicious in Vastu Shastra. South is governed by Yama (lord of death and discipline). While discipline is positive, direct southern entry is associated with recurring obstacles, health challenges, and resistance in professional endeavours. Special remedies are required if this entrance cannot be physically relocated.',

  // Underground Water Tank
  'ug_water_tank_2': 'The Underground Water Tank in the Northeast zone aligns perfectly with Vastu principles. Water (Jal Tattva) is the natural energy of the Northeast, governed by Ishan. Underground water storage here enhances the home\'s positive water energy, supporting health, clarity of thought, and spiritual well-being of all residents.',
  'ug_water_tank_6': 'The Underground Water Tank in the Southeast zone creates a severe energy conflict. Southeast is governed by Agni (fire) — placing water underground here directly opposes fire energy. This creates chronic conflicts in the household, particularly between women, and may cause recurring plumbing issues, leakages, and health problems related to digestion.',

  // Staircase
  'staircase_2': 'The Staircase in the Northeast zone is a major Vastu violation. The Northeast must remain the lightest, most open zone of the home — staircase construction here (heavy RCC structure, constant foot traffic going downward symbolically) compresses the divine energy of Ishan. This causes health deterioration over time, financial stagnation, and obstacles in children\'s education.',
  'staircase_10': 'The Staircase in the Southwest zone is an ideal Vastu placement. The Southwest governs stability and earthly strength — the weight and upward movement of stairs here reinforces the protective energy of the Nairutya zone. This placement supports the career and health of the head of household and keeps the family on a steady upward trajectory.',
}

// Neutral zone message (exact text from spec)
export function neutralImpact(roomLabel: string, zoneFull: string): string {
  return `The ${roomLabel} is located in the ${zoneFull} zone. This placement is energetically neutral — it neither generates significant positive energy nor creates negative Vastu doshas for the household. Maintaining cleanliness, good lighting, and clutter-free conditions in this zone will ensure the space remains energetically balanced.`
}

export function positiveImpact(roomLabel: string, zone: ZoneDefinition): string {
  return `The ${roomLabel} in the ${zone.full} zone is highly auspicious. This zone is governed by ${zone.deity}, the lord of ${zone.meaning.toLowerCase()}. Placing the ${roomLabel.toLowerCase()} here aligns with the natural flow of positive energy through your home, bringing prosperity and well-being to all occupants.`
}

export function moderateImpact(roomLabel: string, zone: ZoneDefinition): string {
  return `The ${roomLabel} in the ${zone.full} zone creates a moderate Vastu imbalance. This zone governs ${zone.meaning.toLowerCase()} (presided by ${zone.deity}), and the energy of the ${roomLabel.toLowerCase()} does not fully harmonise with this zone's nature. Minor remedies can mitigate the effects, though structural correction would yield better long-term results.`
}

export function criticalImpact(roomLabel: string, zone: ZoneDefinition): string {
  return `The ${roomLabel} placement in the ${zone.full} zone creates a significant Vastu dosha. This zone is governed by ${zone.deity} and associated with ${zone.meaning.toLowerCase()} — the energy of the ${roomLabel.toLowerCase()} directly conflicts with this zone's inherent nature. This placement can adversely affect the well-being, relationships, and prosperity of the household over time.`
}

export function getImpact(room: RoomDefinition, zone: ZoneDefinition, severity: Severity): string {
  const overrideKey = `${room.key}_${zone.index}`
  if (IMPACT_OVERRIDES[overrideKey]) return IMPACT_OVERRIDES[overrideKey]

  switch (severity) {
    case 'POSITIVE': return positiveImpact(room.label, zone)
    case 'NEUTRAL':  return neutralImpact(room.label, zone.full)
    case 'MODERATE': return moderateImpact(room.label, zone)
    case 'CRITICAL': return criticalImpact(room.label, zone)
  }
}

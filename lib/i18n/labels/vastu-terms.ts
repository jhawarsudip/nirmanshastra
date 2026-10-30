import type { Basis, Severity } from '@/app/[locale]/tools/vastu-pro/vastu-types'

/*
  VastuPro, Hindi vocabulary: directions and zones, doors and rooms, severity and basis words, the names of the
  32 entrance positions. Everything is keyed by the same id the English tables use (zone index 0 to 15, catalogue key,
  English pada name), so the Hindi sits beside the English and never replaces it. The English tables stay as they are
  (the PDF reads them).
*/

// ─── the 16 zones ──────────────────────────────────────────────────────────────────────────
// short: what is drawn on the plan (round the compass and on each room's chip), kept to a few letters.
// list : the Vastu name used in running text and lists ("उत्तर-ईशान 20%").
// text : the full name shown as a heading ("उत्तर-पूर्व (ईशान)"); also the name used in sentences.
export interface ZoneHi { short: string; list: string; text: string }

export const ZONE_HI: ZoneHi[] = [
  { short: 'उत्तर', list: 'उत्तर', text: 'उत्तर' },
  { short: 'उ-ई', list: 'उत्तर-ईशान', text: 'उत्तर-ईशान' },
  { short: 'ईशान', list: 'ईशान', text: 'उत्तर-पूर्व (ईशान)' },
  { short: 'पू-ई', list: 'पूर्व-ईशान', text: 'पूर्व-ईशान' },
  { short: 'पूर्व', list: 'पूर्व', text: 'पूर्व' },
  { short: 'पू-आ', list: 'पूर्व-आग्नेय', text: 'पूर्व-आग्नेय' },
  { short: 'आग्नेय', list: 'आग्नेय', text: 'दक्षिण-पूर्व (आग्नेय)' },
  { short: 'द-आ', list: 'दक्षिण-आग्नेय', text: 'दक्षिण-आग्नेय' },
  { short: 'दक्षिण', list: 'दक्षिण', text: 'दक्षिण' },
  { short: 'द-नै', list: 'दक्षिण-नैऋत्य', text: 'दक्षिण-नैऋत्य' },
  { short: 'नैऋत्य', list: 'नैऋत्य', text: 'दक्षिण-पश्चिम (नैऋत्य)' },
  { short: 'प-नै', list: 'पश्चिम-नैऋत्य', text: 'पश्चिम-नैऋत्य' },
  { short: 'पश्चिम', list: 'पश्चिम', text: 'पश्चिम' },
  { short: 'प-वा', list: 'पश्चिम-वायव्य', text: 'पश्चिम-वायव्य' },
  { short: 'वायव्य', list: 'वायव्य', text: 'उत्तर-पश्चिम (वायव्य)' },
  { short: 'उ-वा', list: 'उत्तर-वायव्य', text: 'उत्तर-वायव्य' },
]

/** The English zone codes in index order, to turn "NNE" into 1 when a string has to be read back. */
export const ZONE_CODES = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

/** The eight main directions by the lower-case English name the engine uses in its sentences ("north-east"). */
export const DIRECTION_HI: Record<string, string> = {
  'north': 'उत्तर',
  'north-east': 'उत्तर-पूर्व (ईशान)',
  'east': 'पूर्व',
  'south-east': 'दक्षिण-पूर्व (आग्नेय)',
  'south': 'दक्षिण',
  'south-west': 'दक्षिण-पश्चिम (नैऋत्य)',
  'west': 'पश्चिम',
  'north-west': 'उत्तर-पश्चिम (वायव्य)',
}

/** The four sides of the plot. */
export const SIDE_HI: Record<'east' | 'south' | 'west' | 'north', string> = { east: 'पूर्व', south: 'दक्षिण', west: 'पश्चिम', north: 'उत्तर' }

// ─── the words for how a placement reads ────────────────────────────────────────────────────
export const SEVERITY_HI: Record<Severity, string> = {
  CRITICAL: 'सावधानी',
  MODERATE: 'दोबारा देखें',
  NEUTRAL: 'ठीक',
  POSITIVE: 'अनुकूल',
}

export const BASIS_HI: Record<Basis, string> = {
  classical: 'पारंपरिक ग्रंथ',
  taught: 'आज आम तौर पर सिखाया जाता है',
  modern: 'आधुनिक चलन',
}

/** How the old text names an entrance position, as it stands in the sentence "...is named ...". */
export const TONE_HI: Record<'favourable' | 'mixed' | 'cautioned', string> = {
  favourable: 'अनुकूल',
  mixed: 'मिली-जुली',
  cautioned: 'सावधानी वाली',
}

/** The 32 guardians of the boundary, as the English table spells them. */
export const PADA_HI: Record<string, string> = {
  Shikhi: 'शिखी', Parjanya: 'पर्जन्य', Jayanta: 'जयंत', Indra: 'इंद्र', Surya: 'सूर्य', Satya: 'सत्य', Bhrisha: 'भृश', Antariksha: 'अंतरिक्ष',
  Anila: 'अनिल', Pusha: 'पूषा', Vitatha: 'वितथ', Grihakshata: 'गृहक्षत', Yama: 'यम', Gandharva: 'गंधर्व', Bhringaraja: 'भृंगराज', Mriga: 'मृग',
  Pitr: 'पितृ', Dauvarika: 'दौवारिक', Sugriva: 'सुग्रीव', Pushpadanta: 'पुष्पदंत', Varuna: 'वरुण', Asura: 'असुर', Shosha: 'शोष', Papayakshma: 'पापयक्ष्मा',
  Roga: 'रोग', Naga: 'नाग', Mukhya: 'मुख्य', Bhallata: 'भल्लाट', Soma: 'सोम', Bhujaga: 'भुजग', Aditi: 'अदिति', Diti: 'दिति',
}

// ─── doors and rooms: name and the short mark drawn on the plan ────────────────────────────
export interface KindHi { label: string; abbrev: string }

export const KIND_HI: Record<string, KindHi> = {
  main_door: { label: 'मुख्य द्वार', abbrev: 'मु' },
  back_door: { label: 'पिछला दरवाज़ा', abbrev: 'पि' },
  side_door: { label: 'बगल का दरवाज़ा', abbrev: 'बग' },

  living_room: { label: 'लिविंग रूम', abbrev: 'लिवि' },
  hall: { label: 'हॉल', abbrev: 'हॉल' },
  lobby: { label: 'लॉबी', abbrev: 'लॉबी' },
  lounge: { label: 'लाउंज', abbrev: 'लाउं' },
  master_bedroom: { label: 'मास्टर बेडरूम', abbrev: 'मा.बे' },
  parents_room: { label: 'माता-पिता का कमरा', abbrev: 'माता' },
  childrens_room: { label: 'बच्चों का कमरा', abbrev: 'बच्चे' },
  guest_bedroom: { label: 'गेस्ट बेडरूम', abbrev: 'गेस्ट' },
  kitchen: { label: 'रसोई', abbrev: 'रसोई' },
  dining_room: { label: 'डाइनिंग रूम', abbrev: 'डाइनि' },
  bathroom: { label: 'बाथरूम', abbrev: 'बाथ' },
  toilet: { label: 'शौचालय', abbrev: 'शौच' },
  puja_room: { label: 'पूजा घर', abbrev: 'पूजा' },
  study_room: { label: 'स्टडी रूम', abbrev: 'स्टडी' },
  office: { label: 'ऑफ़िस या काम की जगह', abbrev: 'ऑफ़ि' },
  ug_water_tank: { label: 'ज़मीन के नीचे की पानी की टंकी', abbrev: 'भू.टं' },
  oh_water_tank: { label: 'ऊपर की पानी की टंकी', abbrev: 'ऊ.टं' },
  swimming_pool: { label: 'स्विमिंग पूल', abbrev: 'पूल' },
  staircase: { label: 'सीढ़ी', abbrev: 'सीढ़ी' },
  lift: { label: 'लिफ़्ट', abbrev: 'लिफ़्ट' },
  store_room: { label: 'स्टोर रूम', abbrev: 'स्टोर' },
  balcony: { label: 'बालकनी', abbrev: 'बाल' },
  garden: { label: 'बगीचा', abbrev: 'बगी' },
  car_parking: { label: 'कार पार्किंग या गैराज', abbrev: 'कार' },
}

/** Room-list headings, by the English category name. */
export const CATEGORY_HI: Record<string, string> = {
  'Doors': 'दरवाज़े',
  'Living': 'लिविंग',
  'Bedrooms': 'बेडरूम',
  'Kitchen and dining': 'रसोई और डाइनिंग',
  'Bathrooms': 'बाथरूम',
  'Prayer and study': 'पूजा और पढ़ाई',
  'Water and tanks': 'पानी और टंकियाँ',
  'Stairs and storage': 'सीढ़ी और स्टोर',
  'Outdoors and vehicles': 'बाहर की जगह और गाड़ियाँ',
}

/** "Bathroom 2" is the English label plus a running number: the Hindi label with the same number. */
export function labelHi(kind: string, englishLabel: string, englishBase: string): string {
  const base = KIND_HI[kind]?.label
  if (!base) return englishLabel
  return englishLabel.startsWith(englishBase) ? base + englishLabel.slice(englishBase.length) : base
}

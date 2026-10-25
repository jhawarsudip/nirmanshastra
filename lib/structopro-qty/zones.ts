// Seismic zone lookup for StructurePro.
// Source: IS 1893 (Part 1):2002 Annex E "Zone factors for some important towns" (107 towns), read from the BIS text archive.
// The scan is garbled; the town/zone alignment was rebuilt by counting and every row's zone agrees with its Z value.
// Town -> state assignment is from geography (the BIS list has no states).
// Allahabad and Cuddalore are set to Zone III (conservative): Amendment 1 moves Allahabad to III; the Cuddalore replacement row is unreadable.
// IS 1893:2016 is the edition in force and its zone map differs for some towns. The result page says "check with a local structural engineer".

import type { Zone } from './codes'

interface Town {
  town: string
  state: string
  zone: Zone
}

const T = (town: string, state: string, zone: Zone): Town => ({ town, state, zone })

export const ANNEX_E_TOWNS: Town[] = [
  T('Agra', 'Uttar Pradesh', 'III'), T('Ahmedabad', 'Gujarat', 'III'), T('Ajmer', 'Rajasthan', 'II'), T('Allahabad', 'Uttar Pradesh', 'III'),
  T('Almora', 'Uttarakhand', 'IV'), T('Ambala', 'Haryana', 'IV'), T('Amritsar', 'Punjab', 'IV'), T('Asansol', 'West Bengal', 'III'),
  T('Aurangabad', 'Maharashtra', 'II'), T('Bahraich', 'Uttar Pradesh', 'IV'), T('Bangalore', 'Karnataka', 'II'), T('Barauni', 'Bihar', 'IV'),
  T('Bareilly', 'Uttar Pradesh', 'III'), T('Belgaum', 'Karnataka', 'III'), T('Bhatinda', 'Punjab', 'III'), T('Bhilai', 'Chhattisgarh', 'II'),
  T('Bhopal', 'Madhya Pradesh', 'II'), T('Bhubaneswar', 'Odisha', 'III'), T('Bhuj', 'Gujarat', 'V'), T('Bijapur', 'Karnataka', 'III'),
  T('Bikaner', 'Rajasthan', 'III'), T('Bokaro', 'Jharkhand', 'III'), T('Bulandshahr', 'Uttar Pradesh', 'IV'), T('Burdwan', 'West Bengal', 'III'),
  T('Calicut', 'Kerala', 'III'), T('Chandigarh', 'Chandigarh', 'IV'), T('Chennai', 'Tamil Nadu', 'III'), T('Chitradurga', 'Karnataka', 'II'),
  T('Coimbatore', 'Tamil Nadu', 'III'), T('Cuddalore', 'Tamil Nadu', 'III'), T('Cuttack', 'Odisha', 'III'), T('Darbhanga', 'Bihar', 'V'),
  T('Darjeeling', 'West Bengal', 'IV'), T('Dharwad', 'Karnataka', 'III'), T('Dehra Dun', 'Uttarakhand', 'IV'), T('Dharampuri', 'Tamil Nadu', 'III'),
  T('Delhi', 'Delhi', 'IV'), T('Durgapur', 'West Bengal', 'III'), T('Gangtok', 'Sikkim', 'IV'), T('Guwahati', 'Assam', 'V'),
  T('Goa', 'Goa', 'III'), T('Gulbarga', 'Karnataka', 'II'), T('Gaya', 'Bihar', 'III'), T('Gorakhpur', 'Uttar Pradesh', 'IV'),
  T('Hyderabad', 'Telangana', 'II'), T('Imphal', 'Manipur', 'V'), T('Jabalpur', 'Madhya Pradesh', 'III'), T('Jaipur', 'Rajasthan', 'II'),
  T('Jamshedpur', 'Jharkhand', 'II'), T('Jhansi', 'Uttar Pradesh', 'II'), T('Jodhpur', 'Rajasthan', 'II'), T('Jorhat', 'Assam', 'V'),
  T('Kakrapara', 'Gujarat', 'III'), T('Kalpakkam', 'Tamil Nadu', 'III'), T('Kanchipuram', 'Tamil Nadu', 'III'), T('Kanpur', 'Uttar Pradesh', 'III'),
  T('Karwar', 'Karnataka', 'III'), T('Kohima', 'Nagaland', 'V'), T('Kolkata', 'West Bengal', 'III'), T('Kota', 'Rajasthan', 'II'),
  T('Kurnool', 'Andhra Pradesh', 'II'), T('Lucknow', 'Uttar Pradesh', 'III'), T('Ludhiana', 'Punjab', 'IV'), T('Madurai', 'Tamil Nadu', 'II'),
  T('Mandi', 'Himachal Pradesh', 'V'), T('Mangalore', 'Karnataka', 'III'), T('Monghyr', 'Bihar', 'IV'), T('Moradabad', 'Uttar Pradesh', 'IV'),
  T('Mumbai', 'Maharashtra', 'III'), T('Mysore', 'Karnataka', 'II'), T('Nagpur', 'Maharashtra', 'II'), T('Nagarjunasagar', 'Telangana', 'II'),
  T('Nainital', 'Uttarakhand', 'IV'), T('Nasik', 'Maharashtra', 'III'), T('Nellore', 'Andhra Pradesh', 'III'), T('Osmanabad', 'Maharashtra', 'III'),
  T('Panjim', 'Goa', 'III'), T('Patiala', 'Punjab', 'III'), T('Patna', 'Bihar', 'IV'), T('Pilibhit', 'Uttar Pradesh', 'IV'),
  T('Pondicherry', 'Puducherry', 'II'), T('Pune', 'Maharashtra', 'III'), T('Raipur', 'Chhattisgarh', 'II'), T('Rajkot', 'Gujarat', 'III'),
  T('Ranchi', 'Jharkhand', 'II'), T('Roorkee', 'Uttarakhand', 'IV'), T('Rourkela', 'Odisha', 'II'), T('Sadiya', 'Assam', 'V'),
  T('Salem', 'Tamil Nadu', 'III'), T('Simla', 'Himachal Pradesh', 'IV'), T('Sironj', 'Madhya Pradesh', 'II'), T('Solapur', 'Maharashtra', 'III'),
  T('Srinagar', 'Jammu and Kashmir', 'V'), T('Surat', 'Gujarat', 'III'), T('Tarapur', 'Maharashtra', 'III'), T('Tezpur', 'Assam', 'V'),
  T('Thane', 'Maharashtra', 'III'), T('Thanjavur', 'Tamil Nadu', 'II'), T('Thiruvananthapuram', 'Kerala', 'III'), T('Tiruchirappalli', 'Tamil Nadu', 'II'),
  T('Tiruvannamalai', 'Tamil Nadu', 'III'), T('Udaipur', 'Rajasthan', 'II'), T('Vadodara', 'Gujarat', 'III'), T('Varanasi', 'Uttar Pradesh', 'III'),
  T('Vellore', 'Tamil Nadu', 'III'), T('Vijayawada', 'Andhra Pradesh', 'III'), T('Visakhapatnam', 'Andhra Pradesh', 'II'),
]

/** Alternative spellings and current names -> Annex E spelling. */
const ALIAS: Record<string, string> = {
  bengaluru: 'bangalore', bombay: 'mumbai', madras: 'chennai', calcutta: 'kolkata', trivandrum: 'thiruvananthapuram',
  pondicherry: 'pondicherry', puducherry: 'pondicherry', shimla: 'simla', prayagraj: 'allahabad', mysuru: 'mysore',
  mangaluru: 'mangalore', kozhikode: 'calicut', vadodra: 'vadodara', baroda: 'vadodara', nashik: 'nasik', panaji: 'panjim',
  dehradun: 'dehra dun', 'dehra-dun': 'dehra dun', belagavi: 'belgaum', vijapura: 'bijapur', kalaburagi: 'gulbarga',
  tiruchirapalli: 'tiruchirappalli', trichy: 'tiruchirappalli', tiruchirapalli2: 'tiruchirappalli', vizag: 'visakhapatnam',
  visakhapatnam: 'visakhapatnam', thiruvanantapuram: 'thiruvananthapuram', munger: 'monghyr', burdwan: 'burdwan', bardhaman: 'burdwan',
  gurgaon: 'delhi', gurugram: 'delhi', noida: 'delhi', 'new delhi': 'delhi', ghaziabad: 'delhi', faridabad: 'delhi',
}

/** Zone used when a state has no Annex E town and no better information: the value in the locked Build Reference mapping. */
const STATE_DEFAULT: Record<string, Zone> = {
  Uttarakhand: 'V', 'Himachal Pradesh': 'V', Sikkim: 'V', 'Arunachal Pradesh': 'V', Assam: 'V', Manipur: 'V', Meghalaya: 'V',
  Mizoram: 'V', Nagaland: 'V', Tripura: 'V', 'Jammu and Kashmir': 'V', Ladakh: 'V', 'Andaman and Nicobar Islands': 'V',
  Delhi: 'IV', Punjab: 'IV', Haryana: 'IV', Chandigarh: 'IV', Bihar: 'IV', 'Uttar Pradesh': 'IV',
  Maharashtra: 'III', Gujarat: 'III', Rajasthan: 'III', 'West Bengal': 'III', Goa: 'III', Kerala: 'III',
  Karnataka: 'II', 'Tamil Nadu': 'II', Telangana: 'II', 'Andhra Pradesh': 'II', 'Madhya Pradesh': 'II', Chhattisgarh: 'II',
  Jharkhand: 'II', Odisha: 'II', Lakshadweep: 'III', Puducherry: 'II', 'Dadra and Nagar Haveli and Daman and Diu': 'III',
}

const ORDER: Zone[] = ['II', 'III', 'IV', 'V']
const maxZone = (a: Zone, b: Zone): Zone => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b)

export interface ZoneResult {
  zone: Zone
  basis: 'town' | 'state_typical' | 'state_default'
  /** Human wording for the results page. */
  note: string
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export function seismicZoneFor(state: string, city?: string): ZoneResult {
  const c = city ? norm(city) : ''
  const key = ALIAS[c] ?? c
  const hit = key ? ANNEX_E_TOWNS.find((t) => norm(t.town) === key) : undefined
  if (hit) {
    return { zone: hit.zone, basis: 'town', note: `Zone ${hit.zone} for ${hit.town} (IS 1893:2002 Annex E). IS 1893:2016 is the edition in force: confirm with a local structural engineer.` }
  }
  const sameState = ANNEX_E_TOWNS.filter((t) => norm(t.state) === norm(state))
  const def = STATE_DEFAULT[state]
  if (sameState.length > 0) {
    // Unlisted town: the most common zone among the state's listed towns (ties go to the higher zone),
    // never below the state value of the earlier Build Reference map.
    const counts = new Map<Zone, number>()
    for (const t of sameState) counts.set(t.zone, (counts.get(t.zone) ?? 0) + 1)
    let z: Zone = 'II'
    let best = -1
    for (const zz of ORDER) {
      const n = counts.get(zz) ?? 0
      if (n >= best && n > 0) {
        best = n
        z = zz
      }
    }
    if (def) z = maxZone(z, def)
    const lo = sameState.reduce<Zone>((a, t) => (ORDER.indexOf(t.zone) < ORDER.indexOf(a) ? t.zone : a), 'V')
    const hi = sameState.reduce<Zone>((a, t) => maxZone(a, t.zone), 'II')
    return {
      zone: z,
      basis: 'state_typical',
      note: `Your town is not in the IS 1893:2002 Annex E list. Zone ${z} is used as the typical value for ${state} (listed towns there range from Zone ${lo} to Zone ${hi}). Confirm with a local structural engineer.`,
    }
  }
  const z = def ?? 'III'
  return { zone: z, basis: 'state_default', note: `No listed town for ${state}; Zone ${z} used as a conservative state value. Confirm with a local structural engineer.` }
}

/** IS 1893:2002 cl 6.4.2 spectrum for medium soil (RECONSTRUCTED): Sa/g = 1+15T (0-0.1), 2.5 (0.1-0.55), 1.36/T (0.55-4). */
export function saOverG(T: number): number {
  if (T < 0.1) return 1 + 15 * T
  if (T <= 0.55) return 2.5
  return Math.min(2.5, 1.36 / T)
}

import { buildingLabel, buildingLabelStilt, storeyLabel, beamLevelLabel } from '@/lib/structopro-qty/labels'

/*
  Hindi counterparts of the small label helpers in lib/structopro-qty/labels.ts ("G+2", "Stilt + 2 floors", "Second floor", "Roof").
  That file is shared with the PDF and stays English; a Hindi page calls these instead, an English page gets the very same output as before.
*/

const ORD_HI = ['पहली', 'दूसरी', 'तीसरी', 'चौथी', 'पाँचवीं', 'छठी', 'सातवीं', 'आठवीं', 'नौवीं']

/** "G", "G+1" ...; with an open parking level "Stilt + 2 floors" / "स्टिल्ट + 2 मंज़िलें". */
export function buildingLabelFor(locale: string, floors: number, stilt: boolean): string {
  if (locale !== 'hi') return buildingLabelStilt(floors, stilt)
  return stilt ? `स्टिल्ट + ${floors} मंज़िल${floors === 1 ? '' : 'ें'}` : buildingLabel(floors)
}

/** Columns: the storey they stand in. */
export function storeyLabelFor(locale: string, k: number, stilt = false): string {
  if (locale !== 'hi') return storeyLabel(k, stilt)
  return k === 0 ? (stilt ? 'खुला पार्किंग तल' : 'ग्राउंड फ़्लोर') : `${ORD_HI[k - 1] ?? `${k}`} मंज़िल`.replace(/^(\d+) मंज़िल$/, 'मंज़िल $1')
}

/** Beams: the slab level they carry; the last level is the roof. */
export function beamLevelLabelFor(locale: string, k: number, storeys: number): string {
  if (locale !== 'hi') return beamLevelLabel(k, storeys)
  return k >= storeys - 1 ? 'छत' : `${ORD_HI[k] ?? `${k + 1}`} मंज़िल`.replace(/^(\d+) मंज़िल$/, 'मंज़िल $1')
}

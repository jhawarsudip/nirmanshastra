/*
  StructurePro's buying lines for the rupee step.

  The Grand Total adds the frame's lines with a buying allowance on each (frameLines rounds every bar diameter up), and that is
  right for its own list. StructurePro's own report prints the unrounded Buy list (sand 945 cft, steel 5,418 kg ...). The rupee
  table on the StructurePro page and in its PDF must carry the SAME quantities as the Buy list printed above it, so this takes the
  frame's lines and puts the report's own figures back.
*/

import type { PaidPayload } from '../structopro-qty/payload'
import type { QtyLine } from '../qty/types'
import { frameLines } from '../qty/grand'
import { CFT_PER_M3 } from './items'

export function structureLines(p: PaidPayload): QtyLine[] {
  const m = p.materials
  const kgByPhi = new Map(p.steelByDiameter.map(s => [`steel-fe500d-${s.phi}mm-kg`, s.kg]))
  return frameLines(p).map((l): QtyLine => {
    if (l.key === 'cement-bag-50kg') return { ...l, qty: m.cementBags }
    if (l.key === 'sand-m3') return { ...l, qty: m.sandCft / CFT_PER_M3 }
    if (l.key === 'aggregate-20mm-m3') return { ...l, qty: m.aggregateCft / CFT_PER_M3 }
    if (l.key === 'binding-wire-kg') return { ...l, qty: m.bindingWireKg }
    const kg = kgByPhi.get(l.key)
    return kg === undefined ? l : { ...l, qty: kg }
  })
}

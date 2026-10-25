// Section 9: the floor slabs and the staircase (and the stair opening that links them).

import type { CalcSection } from '@/lib/calcsheet'
import type { CalcCtx } from './ctx'
import { slabBlocks, slabQuantityBlocks } from './slabs'
import { stairBlocks } from './stairs'

export function floorsSection(c: CalcCtx): CalcSection {
  const panels = slabBlocks(c)
  const stair = stairBlocks(c)
  const qty = slabQuantityBlocks(c)
  return {
    id: 'floors',
    title: '9. Floor slabs and staircase',
    intro: 'Each floor slab is a set of two-way panels designed from the coefficients of IS 456 Table 26. The staircase is a dog-legged flight with landings; its opening is taken out of the floor slabs. Both the steel and the concrete are counted here and carried to the take-off.',
    blocks: [...panels, ...stair, ...qty],
  }
}

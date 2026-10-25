/*
  StructurePro calculation sheet: what every builder in this folder receives.

  PART 1 (design.ts) writes the sections on answers, site, frame, loads, lateral loads, beams and columns.
  PART 2 (foundations, slabs, stairs, balconies, secondary items, steel take-off, concrete, mixes, reconciliation) takes the same CalcCtx.

  `work` is the model's own working from `runQuantityModelDetailed`; `result` is the same run's QtyResult (the figures the report prints).
  The two come from ONE call, so they cannot disagree. A section reads `work` for intermediate values, rebuilds each with the Ledger and passes the
  engine's figure as `expect`, so any difference lands in `L.mismatches`.

  Where PART 2 finds its inputs on `work`:
    work.analysis.footings        Map "ix:iy" -> FootingResult        (isolated footings, ground-storey grid)
    work.analysis.raft            RaftResult | null                   (when the foundation is a raft)
    work.analysis.foundation      how the type was decided (site flag, trial footings, 50 % cover rule)
    work.analysis.fcDesigns       ground-storey columns with loads and designs, as sent to the foundation design
    work.analysis.stair           stair design;  work.analysis.balcony  BalconyOut | null
    work.analysis.plinth          plinth-beam totals
    work.analysis.panelNotes, slabVol, slabForm    slab panel notes and volumes per floor (before the floor-area scale)
    work.analysis.book            SteelBook: .log = every bar added (unscaled), .scales = floor-area corrections by group, .byGroup / .detail = kg (scaled)
    work.parts                    volumes, formwork, steel by family, mixes, cement/sand/aggregate before wastage (AssembleParts)
    work.parts.secondary          secondaryItems() result (lintels, sunshades, parapet, mumty)
    work.ctx, work.plan, work.site, work.fck, work.fckBelow, work.tSlab   the shared design context
*/

import type { Ledger } from '@/lib/calcsheet'
import type { QtyInput, QtyResult } from '../types'
import type { ModelWork } from '../model'

export type { ModelWork, Analysis, AssembleParts, ColRec, NodeLoad } from '../model'

export interface CalcCtx {
  L: Ledger
  input: QtyInput
  result: QtyResult
  work: ModelWork
}

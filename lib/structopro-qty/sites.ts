// Site classes: the assumptions behind each of the eight "what is the ground like" answers.
// Shared by the model (design) and the form (so the person sees exactly what is assumed). A soil test replaces every value here.

import type { Exposure } from './materials'
import type { SiteCondition } from './types'

export interface SiteParams {
  sbc: number // kN/m2 net safe bearing capacity: ASSUMPTION by site class (a soil test replaces it)
  depth: number // m, ground level to underside of footing PCC
  raft: boolean
  exposure: Exposure
  label: string
}

export const SITE: Record<SiteCondition, SiteParams> = {
  flat: { sbc: 150, depth: 1.5, raft: false, exposure: 'mild', label: 'ordinary firm soil' },
  sloped_mild: { sbc: 150, depth: 1.8, raft: false, exposure: 'mild', label: 'mild slope, footings stepped' },
  sloped_steep: { sbc: 150, depth: 2.0, raft: true, exposure: 'moderate', label: 'steep slope' },
  rocky: { sbc: 300, depth: 0.9, raft: false, exposure: 'mild', label: 'rock, footings cut into rock' },
  bcs: { sbc: 100, depth: 2.0, raft: true, exposure: 'moderate', label: 'black cotton soil' },
  soft_marshy: { sbc: 75, depth: 2.0, raft: true, exposure: 'severe', label: 'soft or marshy ground' },
  waterlogged: { sbc: 100, depth: 1.8, raft: false, exposure: 'severe', label: 'high water table' },
  coastal: { sbc: 120, depth: 1.5, raft: false, exposure: 'very_severe', label: 'coastal, salt-laden air' },
}

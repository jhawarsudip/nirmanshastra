// The shapes VastuPro passes between its engine, its screens and its PDF.

import type { Poly } from './vastu-geometry'
import type { DoorMark, PlacedItem } from './vastu-model'

/**
 * How a placement reads, worst to best. The words on screen are "Cautioned", "To review", "Acceptable" and "Favoured";
 * the keys stay as they are so the styling and the lead records keep working. "Cautioned" is only ever used for a
 * placement the traditional texts themselves caution against; a rule that comes from later teachers reads at worst
 * "To review" (see capSeverity in vastu-rules.ts).
 */
export type Severity = 'CRITICAL' | 'MODERATE' | 'NEUTRAL' | 'POSITIVE'

export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'MODERATE', 'NEUTRAL', 'POSITIVE']

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: 'Cautioned',
  MODERATE: 'To review',
  NEUTRAL: 'Acceptable',
  POSITIVE: 'Favoured',
}

/**
 * Where a rule comes from. Shown beside every finding so a reader can tell an old text from a modern habit.
 * - classical: stated in the traditional texts we read (for a rule that names only some places, in those places only)
 * - taught: documented as established manual practice today, but not found in the older texts we read
 * - modern: a recent convention with no basis in the texts
 */
export type Basis = 'classical' | 'taught' | 'modern'

export const BASIS_LABEL: Record<Basis, string> = {
  classical: 'Traditional texts',
  taught: 'Widely taught today',
  modern: 'Modern convention',
}

export interface PlanInput {
  house: Poly
  northDeg: number
  items: PlacedItem[]
  doors: DoorMark[]
}

export interface RemedySet {
  /** needs building work: moving a room, changing plumbing, rebuilding a wall */
  structural: string[]
  /** no building work: furniture, light, colour, habit */
  practical: string[]
}

export interface Finding {
  /** the id of the item or door this is about */
  id: string
  kind: string
  label: string
  severity: Severity
  /** "North-east (NE)" */
  zoneText: string
  /** "also covers NNE (35%)" */
  alsoText?: string
  /** one plain sentence: what the reading is */
  headline: string
  /** what the tradition says about this placement, written as the tradition's view and never as a prediction */
  tradition: string
  basis: Basis
  /** set when teachers disagree on this placement */
  disputed?: string
  /** the room's centre is within a few degrees of a zone edge */
  borderline: boolean
  /** part of the room is in the Brahmasthan */
  centre: boolean
  /** how much the traditional texts stress this item: 1 (low), 2 (medium) or 3 (high). Used only to put the findings in order. */
  weight: 1 | 2 | 3
  /** extra lines that show how the verdict was reached, such as the entrance position on the boundary */
  detail: string[]
  /** how it would read if the room sat just across the nearest zone edge; set only when it is borderline */
  altSeverity?: Severity
  /** "Brihat Samhita ch. 53" and so on, set only when the rule has a source */
  source?: string
  /** a real engineering or climate reason, set only when there is one */
  practical?: string
  /** share of the room in each of the 16 zones, for the report */
  shares: number[]
  /** share of the room inside the Brahmasthan (rooms only); with shares it adds up to 1. Lets the report show the working. */
  centreShare?: number
  /** the entrance position the main door fell on, when it could be read (side of the plot and position 0 to 7 from the start corner) */
  pada?: { side: 'E' | 'S' | 'W' | 'N'; index: number }
  remedies: RemedySet
  dos: string[]
  donts: string[]
}

export interface PlotNote {
  id: string
  severity: Severity
  title: string
  text: string
  basis: Basis
  remedies?: RemedySet
  /** false for notes that only inform and are not checked against the plan */
  counted: boolean
}

export interface Reading {
  findings: Finding[]
  plot: PlotNote[]
  counts: Record<Severity, number>
  /** the important things not yet on the plan, by name */
  missing: string[]
  /** the visitor's own steps, so the report can say what it was based on */
  basisNotes: string[]
  /** which version of the rule table produced this reading */
  rulesVersion: string
}

// The words of the StructurePro calculation sheet that are not a section: what the sheet is, the method in the order the tool works, what a reader must know, and the standards.

import type { CalcReference } from '@/lib/calcsheet'
import { DESIGN_LIMITS, DESIGN_METHOD, DESIGN_REFERENCES } from './design'

export const PURPOSE =
  'This sheet shows how every quantity in the StructurePro report was worked out. The tool designs a regular frame for your building by hand methods to the Indian Standards, records every bar, and carries the concrete, the steel and the shuttering to the buy list. The sheet is for the structural engineer, the bank valuer or the contractor who wants to check the quantities. It is a planning estimate and not a structural design for your drawings.'

/** The method: the six steps of the design half, then the steps of the quantity half. */
export const METHOD: string[] = [
  ...DESIGN_METHOD,
  'It sizes the foundation: an isolated footing under every column from its load and the bearing capacity assumed for the ground, or a raft where the ground or the loads ask for one, with the lean concrete under the footings and the plinth beams (Section 8).',
  'It designs the floor slabs panel by panel with the coefficients of IS 456, the staircase and the balconies, and counts the lintels, sunshades, terrace parapet band and stair head-room roof from the plan (Sections 9 and 10).',
  'Every bar of every member is recorded with its diameter, cut length and number. The bars are weighed again and added by member and by diameter, and the steel to buy adds the cutting waste (Section 11).',
  'It counts the concrete and the shuttering of the columns and beams from the sizes found and sets them beside those of the other members (Section 12).',
  'It takes the cement, sand and aggregate in a cubic metre of each grade of concrete, multiplies by the concrete of each mix, adds the site wastage and turns the result into the buy list (Section 13).',
  'The ranges, the comparison with built houses, the checks, the warnings and the assumptions of the report are placed in Section 14. The last table sets every figure of the report beside the same figure worked here. The sheet is printed only if every figure agrees. That shows the sheet and the report agree with each other, because the sums were done twice. It is not a check against the standards or against what a site will use.',
]

/** What a person checking the sheet must know. */
export const LIMITS: string[] = [
  ...DESIGN_LIMITS,
  'Slabs, staircase and balconies: the slabs use the bending coefficients of IS 456 Annex D; the staircase and the balconies use a simple beam model. Shear, crack width and vibration are not checked. The mid-span bars run the full span without curtailment and the bar spacing is limited to 150 mm; both add steel compared with the code minimum. The loads and sizes of the staircase and the balconies are NirmanShastra choices.',
  'Foundations: an isolated footing is sized for the bearing capacity assumed for the ground class and checked for bending, one-way shear and punching shear. A raft is indicative only: its thickness comes from punching shear, not from the pressure on the ground. Settlement, uplift, the water table, the swelling of black cotton soil and neighbouring buildings are not considered. A soil test replaces the assumed bearing capacity.',
  'Quantities: bars are counted with the hooks, laps and cover worked in the sections, cut lengths are taken up to the next 25 mm, and chairs, spacers and the extra bars a drawing adds at junctions are not counted (the raft is the one place where chairs are). Built houses usually use more, which is why the report prints a range under each total. The quantities of this report are not reconciled with the reports of other NirmanShastra tools, except through the Grand Total.',
  'Concrete mixes: up to M20 the cement, sand and aggregate in a cubic metre are the CPWD nominal-mix figures. From M25 they are worked from IS 10262 with a typical water-cement ratio for the grade, 20 mm aggregate, zone II sand and a 100 mm slump; no target mean strength is worked out. They are for ordering. Trial batches with the real materials decide the mix to be used. IS 10262:2019 is the edition now in force.',
  'Clause numbers: where the SOURCE column gives a clause or table number, treat it as a pointer to check, not as a quotation. The numbers of IS 456, IS 1893 (Part 1), IS 13920, IS 875 (Parts 1, 2 and 3), IS 10262, IS 1786, IS 2502 and SP 34 were read in the text of the edition named when the sheet was written. The CPWD item numbers in the descriptions of the mixes are the report\'s own and were not re-read. The clause numbers printed beside the checks in Section 14 are the report\'s own; they were not re-read, and some name the 2016 edition of IS 13920, which the tool does not follow. Where a limit is the tool\'s own choice the SOURCE column says so.',
  'Floor plans: the model fits one regular grid of bays to every floor, and the bays of each floor must fit over the bays of the floor below. Some sets of floor areas do not give bays that fit (three floors of 1,500, 1,200 and 900 sq ft are one example). The model cannot size them, and for such an input there is no report and no sheet.',
]

/** The standards and sources, with the edition the tool follows and any newer edition. */
export const REFERENCES: CalcReference[] = [
  ...DESIGN_REFERENCES,
  { code: 'IS 10262:2009', title: 'Concrete Mix Proportioning: Guidelines', usedFor: 'The design mix of concrete of M25 and above (Section 13). The tool follows the 2009 edition; IS 10262:2019 is now in force.' },
  { code: 'IS 1904:1986', title: 'Code of Practice for Design and Construction of Foundations in Soils: General Requirements', usedFor: 'The soil pressure under footings and rafts (Section 8). The edition quoted by the tool.' },
  { code: 'CPWD Delhi Analysis of Rates 2014, Vol. 1', title: 'Central Public Works Department, Delhi Analysis of Rates', usedFor: 'Cement, sand and aggregate in a cubic metre of nominal-mix concrete (M20 and below), the cutting waste on steel and the binding wire. Item numbers as found in the tool\'s research notes; not re-read against the published text.' },
  { code: 'GKSPL, March 2026', title: 'Building the Baseline: Embodied Carbon in India\'s Urban Housing, v1', usedFor: 'The range of steel and concrete per m² of 26 built houses shown beside the report (Section 14). As reported by Conserve Consultants; not re-read.' },
]

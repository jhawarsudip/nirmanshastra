/*
  Plumbing constants that the free Water Tank Size calculator and the paid PlumbingPro model share.

  These three values are LOCKED (Build Reference Section 8, IS 1172:1993). They used to live inside the old
  PlumbingPro engine; they are here so that engine can be retired without touching the numbers.
  Do not change a value without changing the Build Reference first.
*/

/**
 * Litres per person per day, by water source (LOCKED, Build Reference Section 8).
 * 135 is the IS 1172:1993 figure for a house with flushing toilets (cl 4.1 and its Note). 150 for a house on its own
 * borewell is the lowest figure IS 1172 gives for towns of over a lakh people (150 to 200); the standard assigns
 * demand by size of town, not by source, so the borewell figure is a choice the model makes.
 */
export const WATER_DEMAND_LPCD = {
  municipal: 135,
  borewell: 150,
} as const

/** Tank sizes sold in India, in litres. Round-UP targets only; no standard lists these (ASSUMPTION). */
export const STANDARD_TANK_SIZES = [500, 1000, 1500, 2000, 3000, 5000] as const

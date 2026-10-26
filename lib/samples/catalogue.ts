/*
  The free sample reports, in one place. Plain data, safe for the browser and the server.

  Each sample is a REAL report made by the same calculations and the same PDF layout as a paid one, for an invented house:
  two floors of 1,000 sq ft each, in Lucknow. Every page is stamped "SAMPLE — example house, not your project".
  The PDFs are files in /public/samples, made by scripts/build-samples.ts (npx tsx --tsconfig tsconfig.json scripts/build-samples.ts). scripts/check-samples.ts fails
  if the model has moved on since they were made, so a sample can never show figures the tool no longer gives.
*/

export type SampleKey = 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro' | 'grandtotal'

/** The invented house every sample is made for. */
export const SAMPLE_HOUSE = {
  floorAreasSqft: [1000, 1000] as number[],
  state: 'Uttar Pradesh',
  city: 'Lucknow',
  /** how the PDF's first page describes it */
  describe: 'G+1, 1,000 sq ft on each floor, Lucknow',
  projectName: 'Example house: G+1, 1,000 sq ft per floor',
} as const

export interface SampleDef {
  key: SampleKey
  /** the file in /public/samples */
  file: string
  /** the tool's name as it reads on the page */
  tool: string
}

export const SAMPLES: Record<SampleKey, SampleDef> = {
  structopro: { key: 'structopro', file: 'structurepro-sample-report.pdf', tool: 'StructurePro' },
  masonpro: { key: 'masonpro', file: 'masonrypro-sample-report.pdf', tool: 'MasonryPro' },
  electropro: { key: 'electropro', file: 'electricalpro-sample-report.pdf', tool: 'ElectricalPro' },
  plumbpro: { key: 'plumbpro', file: 'plumbingpro-sample-report.pdf', tool: 'PlumbingPro' },
  interiorpro: { key: 'interiorpro', file: 'interiorpro-sample-report.pdf', tool: 'InteriorPro' },
  grandtotal: { key: 'grandtotal', file: 'grand-total-sample-report.pdf', tool: 'Grand Total' },
}

export const SAMPLE_KEYS = Object.keys(SAMPLES) as SampleKey[]

/** The path a visitor opens. */
export const sampleHref = (key: SampleKey): string => `/samples/${SAMPLES[key].file}`

/** An estimate's app_type (or a tool slug) to the sample that shows what its report looks like. The pack's summary is the Grand Total. */
export function sampleKeyFor(appTypeOrSlug: string): SampleKey | null {
  if (appTypeOrSlug === 'completepack') return 'grandtotal'
  return Object.prototype.hasOwnProperty.call(SAMPLES, appTypeOrSlug) ? (appTypeOrSlug as SampleKey) : null
}

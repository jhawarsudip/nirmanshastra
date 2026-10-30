/**
 * The shape of one Site Templates product page (/site-templates/<slug>).
 *
 * The English object sits in the page file (app/[locale]/site-templates/<slug>/page.tsx); the Hindi one sits in
 * lib/i18n/labels/templates-<name>.ts and is typed as this, so a missing key fails `tsc`. ProductPage.tsx draws either.
 *
 * In the HINDI text, `[[...]]` marks words that stay English on purpose, because they are names that exist only
 * in English in the Excel file the customer receives (a sheet tab such as [[Rate Analysis]], a file extension such as [[.xlsx]]).
 * The page wraps them in lang="en". English text never contains the marker.
 */
export type ProductContent = {
  productId: string
  productTitle: string
  eyebrow: string
  h1: string
  subhead: string
  price: string
  sheetCount: number
  formatLabel?: string
  codesLabel: string
  codes: string[]
  description: string
  fullSheetList: string
  problem: { heading: string; paras: string[] }
  sheetsIntro: string
  sheets: { name: string; blurb: string }[]
  whoFor: { heading: string; intro: string; bullets: string[] }
  example: { heading: string; label: string; paras: string[] }
  buyLabel: string
}

/*
  The calculation sheet: the last part of every NirmanShastra report.
  It shows, for each figure in the report, the formula, the numbers put into it, the result and the clause it comes from,
  so that a structural engineer, a bank's valuer or a contractor can check the working without the tool.

  Plain data. No rupee figures anywhere (the site is quantity-only).
  A sheet is built by a tool's own `calc` function from the SAME inputs and the SAME run as the report, using a Ledger
  (ledger.ts), which carries out each sum itself, so the working printed and the result printed can never disagree,
  and which checks each result against the figure the engine produced.
*/

export interface CalcLine {
  /** what is being found, in words: "Factored load on the slab" */
  label: string
  /** the formula in symbols: "wu = 1.5 (g + q)" */
  formula?: string
  /** the same formula with the numbers put in: "1.5 × (3.75 + 1.50)" */
  working?: string
  /** the answer with its unit: "7.88 kN/m²" */
  result?: string
  /** the clause, table or published source this step rests on: "IS 456:2000 cl. 18.2.3" */
  ref?: string
  /** an assumption or a one-line explanation */
  note?: string
  /** 'input' = a fact given or chosen, 'step' = a sum, 'result' = a figure that appears in the report */
  kind?: 'input' | 'step' | 'result' | 'text'
}

export interface CalcTable {
  head: string[]
  rows: string[][]
  foot?: string[]
  /** zero-based column indexes that hold numbers (right-aligned) */
  num?: number[]
  note?: string
}

export interface CalcBlock {
  id: string
  /** "Slab panel S1, ground floor (4.00 × 3.50 m)" */
  title: string
  intro?: string
  lines?: CalcLine[]
  table?: CalcTable
  note?: string
}

export interface CalcSection {
  id: string
  /** "3. Loads" */
  title: string
  intro?: string
  blocks: CalcBlock[]
}

/** One line of the reconciliation: a total in the report, and the same total rebuilt in the sheet. */
export interface CalcTieRow {
  item: string
  report: string
  sheet: string
  ok: boolean
}

export interface CalcReference {
  /** "IS 456:2000" */
  code: string
  title: string
  /** what it was used for in this report */
  usedFor: string
}

export interface CalcSheet {
  /** "StructurePro" */
  tool: string
  /** the version of the model that produced the figures, for example "qty-v2" */
  model: string
  /** one short paragraph: what this sheet is and who it is for */
  purpose: string
  /** the method in a few numbered sentences, in the order the tool works */
  method: string[]
  /** what a person checking the sheet must know: simplifications, what is not designed, what needs a site test */
  limits: string[]
  sections: CalcSection[]
  /** the totals in the report, rebuilt from the working: every row must be ok */
  tie: CalcTieRow[]
  references: CalcReference[]
}

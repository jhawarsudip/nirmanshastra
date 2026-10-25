/*
  ElectricalPro calculation sheet: the report's tables, rebuilt from the sheet's own working (derive.ts) in the same
  shape and the same number format as the report, so each cell can be compared with the cell the report prints.
*/

import type { Table } from '../types'
import { fmt, pieces, round } from '../util'
import type { Derived } from './derive'
import { COIL_M, RULE, WASTE, accLineKey, dbLineKey } from './rules'
import { conduitFor, earthMm2 } from './wire'

type Cell = string | number

export interface SheetTable { id: string; rows: Cell[][]; foot?: Cell[]; cols?: number }

/** Names of the accessories rows, in the words of the report. */
export const ACC_NAMES = {
  switch: 'Modular switch, 6 A, one-way (lights, fans, exhaust fans)',
  regulator: 'Electronic fan regulator, step type',
  sock6: 'Modular socket with switch, 6 A, 3-pin',
  sock16: 'Modular socket with switch, 6/16 A',
  acSocket: 'Socket, 20/25 A, for an air conditioner',
  isolator: 'Isolator switch, double-pole, 32 A, with indicator (air conditioner, water heater)',
  bellPush: 'Call bell push',
  bell: 'Call bell',
  tv: 'TV outlet',
  data: 'Data outlet (RJ45)',
  media: 'Media box (TV and data cables meet here)',
  rose: 'Ceiling rose or connector',
  hook: 'Fan hook and box',
  jbox: 'Junction box or ceiling box, 20 mm',
  switchBox: 'Switch box (GI or PVC) with cover plate, about 4 modules each',
} as const

/** Names of the rows of the "Breakers, shock protection and earthing" table, in the words of the report. */
export const PROT_NAMES = {
  rccb: 'RCCB, 30 mA, one on every board',
  meter: 'Meter board for the electricity board’s meter',
  electrode: 'Earth electrode (GI pipe 40 mm × 4.5 m, or a 600 × 600 mm plate)',
  strip: 'GI earth strip, 25 × 5 mm, from each electrode to the board',
  pit: 'Earth pit cover and chamber',
} as const

/** Counts of the accessories, in the order the report lists them. */
export function accessories(d: Derived): Map<string, number> {
  const m = new Map<string, number>()
  const a = (name: string, n: number) => { if (n > 0) m.set(name, (m.get(name) ?? 0) + n) }
  const { L, F, X, B, S6, S16, TV, D } = d.total
  const t = d.tot
  a(ACC_NAMES.switch, L + F + X)
  a(ACC_NAMES.regulator, F)
  a(ACC_NAMES.sock6, S6)
  a(ACC_NAMES.sock16, S16 + t.washers + t.dish)
  a(ACC_NAMES.acSocket, t.ac)
  a(ACC_NAMES.isolator, t.ac + t.geysers)
  a(ACC_NAMES.bellPush, B)
  a(ACC_NAMES.bell, B)
  a(ACC_NAMES.tv, TV)
  a(ACC_NAMES.data, D)
  a(ACC_NAMES.media, t.mediaBoxes)
  a(ACC_NAMES.rose, L + F + B)
  a(ACC_NAMES.hook, F)
  a(ACC_NAMES.jbox, Math.ceil(d.acc.jbox))
  a(ACC_NAMES.switchBox, Math.ceil(t.modules / RULE.modulesPerBox))
  return m
}

export function sheetTables(d: Derived): SheetTable[] {
  const { L, F, X, B, S6, S16, TV, D } = d.total
  const out: SheetTable[] = []

  out.push({
    id: 'points',
    rows: [...d.roomRows.entries()].map(([name, r]) => [name, r.n, r.c.L, r.c.F, r.c.X, r.c.B, r.c.S6, r.c.S16, r.c.TV + r.c.D]),
    foot: ['All rooms and common areas', '', L, F, X, B, S6, S16, TV + D],
  })

  out.push({
    id: 'dedicated',
    rows: ([
      ['Air conditioner outlets, 20/25 A', d.tot.ac],
      ['Water heater outlets, 6/16 A', d.tot.geysers],
      ['Washing machine and dishwasher outlets, 6/16 A', d.tot.washers + d.tot.dish],
      ['Pump outlets', d.tot.pumps],
      ['EV charger points, 32 A', d.tot.evs],
      ['Inverter connections', d.tot.inverters],
    ] as Cell[][]).filter((r) => Number(r[1]) > 0),
  })

  out.push({
    id: 'circuits',
    cols: 4,
    rows: [...d.circuits.entries()].map(([name, c]) => [name, round(c.n), c.rating, c.cable]),
    foot: ['All circuits', round(d.tot.circuits), '', ''],
  })

  out.push({ id: 'boards', rows: [...d.dbs.values()].map((x) => [x.name, x.n, `${x.ways} way, ${x.kind}`, x.incomer, x.rccb]) })

  out.push({
    id: 'mains',
    rows: d.boards.map((b) => {
      const m = b.mains
      return [m.run, `${m.three ? '4' : '2'} × ${m.size} mm² + ${earthMm2(m.size)} mm² earth`, m.n, fmt(round(m.each, 1), 1), `${conduitFor(m.size, m.three)} mm`]
    }),
  })

  out.push({
    id: 'wire',
    rows: d.wireRows.map((r) => {
      const w = r.m * WASTE
      const buy = d.buyWire(r.size, r.m)
      return [`${r.size} mm²`, r.colour, fmt(r.m, 0), fmt(w, 0), r.size <= RULE.coilMaxMm2 ? buy / COIL_M : '', r.size <= RULE.coilMaxMm2 ? `${buy} m` : `${buy} m, by the metre`]
    }),
    foot: ['All sizes', '', fmt(d.wireRunTotal, 0), fmt(d.wireRunTotal * WASTE, 0), '', `${fmt(d.wireBuyTotal)} m`],
  })

  const condRowsOut = d.condRows.map(([mm, m]) => {
    const w = m * WASTE
    const pc = pieces(w, RULE.conduitPieceM)
    return [`${mm} mm`, fmt(m, 0), fmt(w, 0), pc, `${pc * RULE.conduitPieceM} m`]
  })
  out.push({
    id: 'conduit',
    rows: condRowsOut,
    foot: ['All sizes', fmt(d.condRun, 0), fmt(d.condRun * WASTE, 0), condRowsOut.reduce((s, r) => s + Number(r[3]), 0), `${fmt(d.condBuy)} m`],
  })

  const accRows: Cell[][] = [...accessories(d).entries()].map(([k, n]) => [k, n])
  accRows.push(['Conduit bends, 20 mm', Math.ceil(d.acc.bends)])
  accRows.push(['Conduit couplers', Math.ceil(d.acc.couplers)])
  accRows.push(['Conduit saddles or clips', Math.ceil(d.acc.saddles)])
  if (d.coaxBuy > 0) accRows.push(['TV cable (coaxial), to buy', `${d.coaxBuy} m`])
  if (d.catBuy > 0) accRows.push(['Data cable (Cat 6), to buy', `${d.catBuy} m`])
  out.push({ id: 'acc', rows: accRows })

  const prot: Cell[][] = []
  for (const [r, n] of [...d.mcb.entries()].sort((x, y) => x[0] - y[0])) prot.push([`MCB, ${r} A, one-pole, outgoing`, round(n)])
  for (const [k, n] of [...d.incomers.entries()].sort()) { const [poles, amps] = k.split('|'); prot.push([`Incomer MCB, ${poles}-pole, ${amps} A`, n]) }
  prot.push([PROT_NAMES.rccb, d.tot.boards])
  prot.push([PROT_NAMES.meter, d.tot.meterBoards])
  prot.push([PROT_NAMES.electrode, d.electrodes])
  prot.push([PROT_NAMES.strip, `${d.stripM} m`])
  prot.push([PROT_NAMES.pit, d.electrodes])
  out.push({ id: 'prot', rows: prot })

  out.push({
    id: 'load',
    rows: [...d.connected.entries()].filter(([, kw]) => kw > 0).map(([k, kw]) => [k, fmt(kw, 1)]),
    foot: ['Total connected', fmt(d.connectedKw, 1)],
  })

  return out
}

/** The first number in a cell of the report: 2,115 -> 2115, "1,380 m, by the metre" -> 1380, "" -> NaN. */
export function cellNumber(c: Cell | undefined): number {
  if (typeof c === 'number') return c
  const m = String(c ?? '').match(/-?\d[\d,]*\.?\d*/)
  return m ? Number(m[0].replace(/,/g, '')) : NaN
}

/** Compares a table of the sheet with the same table in the report, cell by cell as printed. Returns the mismatches. */
export function compareTable(report: Table | undefined, mine: SheetTable): string[] {
  const bad: string[] = []
  if (!report) return [`table "${mine.id}" is missing from the report`]
  const cols = mine.cols
  const cut = (r: Cell[]) => (cols ? r.slice(0, cols) : r)
  if (report.rows.length !== mine.rows.length) bad.push(`table "${mine.id}": report has ${report.rows.length} rows, sheet ${mine.rows.length}`)
  const n = Math.min(report.rows.length, mine.rows.length)
  for (let i = 0; i < n; i++) {
    const a = cut(report.rows[i]).map(String)
    const b = cut(mine.rows[i]).map(String)
    if (a.length !== b.length || a.some((x, j) => x !== b[j])) bad.push(`table "${mine.id}" row ${i + 1}: report [${a.join(' | ')}] vs sheet [${b.join(' | ')}]`)
  }
  if (mine.foot) {
    const a = cut(report.foot ?? []).map(String)
    const b = cut(mine.foot).map(String)
    if (a.length !== b.length || a.some((x, j) => x !== b[j])) bad.push(`table "${mine.id}" foot: report [${a.join(' | ')}] vs sheet [${b.join(' | ')}]`)
  } else if (report.foot && report.foot.length) bad.push(`table "${mine.id}": the report has a foot the sheet does not`)
  return bad
}

/** One purchase line as the sheet rebuilds it: the key, the words, the quantity and the unit. */
export interface BuyLine { key: string; item: string; qty: number; unit: string }

/** The purchase lines of the report, rebuilt from the sheet's own working, in the report's order. */
export function buyLines(d: Derived): BuyLine[] {
  const out: BuyLine[] = []
  for (const r of d.wireRows) out.push({ key: `wire-cu-${r.size}-${r.colour.toLowerCase()}`, item: `Copper wire ${r.size} mm², ${r.colour.toLowerCase()}`, qty: d.buyWire(r.size, r.m), unit: 'm' })
  for (const [mm, m] of d.condRows) out.push({ key: `conduit-pvc-${mm}`, item: `PVC conduit ${mm} mm`, qty: pieces(m * WASTE, RULE.conduitPieceM) * RULE.conduitPieceM, unit: 'm' })
  for (const [r, n] of [...d.mcb.entries()].sort((x, y) => x[0] - y[0])) out.push({ key: `mcb-${r}a`, item: `MCB ${r} A`, qty: round(n), unit: 'nos' })
  for (const [k, n] of d.incomers) { const [poles, amps] = k.split('|'); out.push({ key: `mcb-incomer-${poles}p-${amps}a`, item: `Incomer MCB ${poles}-pole ${amps} A`, qty: n, unit: 'nos' }) }
  out.push({ key: 'rccb', item: 'RCCB 30 mA', qty: d.tot.boards, unit: 'nos' })
  for (const b of d.dbs.values()) out.push({ key: dbLineKey(b), item: `Distribution board ${b.ways} way, ${b.kind.startsWith('Three') ? 'three-phase' : 'single-phase'} (${b.name.toLowerCase()})`, qty: b.n, unit: 'nos' })
  out.push({ key: 'light-points', item: 'Light, fan, exhaust and bell points', qty: d.points, unit: 'nos' })
  out.push({ key: 'sockets', item: 'Socket outlets (6 A, 6/16 A, 20/25 A)', qty: d.sockets, unit: 'nos' })
  if (d.electrodes > 0) out.push({ key: 'earth-electrode', item: 'Earth electrode with pit', qty: d.electrodes, unit: 'nos' })
  for (const [k, n] of accessories(d)) out.push({ key: accLineKey(k), item: k, qty: n, unit: 'nos' })
  return out
}

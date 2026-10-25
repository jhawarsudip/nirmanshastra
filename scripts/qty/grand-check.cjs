/*
  Checks the Grand Total merge (lib/qty/grand.ts) against the real models.

  Build first:
    rm -rf /tmp/grand-build && npx tsc --outDir /tmp/grand-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict \
      lib/qty/types.ts lib/qty/util.ts lib/qty/plan.ts lib/qty/plumbing/constants.ts lib/qty/plumbing/model.ts lib/qty/masonry/model.ts \
      lib/qty/electrical/model.ts lib/qty/interior/model.ts lib/qty/grand.ts lib/structopro-qty/*.ts
  Then:
    node scripts/qty/grand-check.cjs [--dump]
*/
const B = '/tmp/grand-build'
const dump = process.argv.includes('--dump')
const grand = require(B + '/qty/grand.js')
const sq = require(B + '/structopro-qty/index.js')
const models = {
  plumbing: require(B + '/qty/plumbing/model.js').plumbingModel,
  masonry: require(B + '/qty/masonry/model.js').masonryModel,
  electrical: require(B + '/qty/electrical/model.js').electricalModel,
  interior: require(B + '/qty/interior/model.js').interiorModel,
}
const KEYS = { structure: 'structure', masonry: 'masonry', electrical: 'electrical', plumbing: 'plumbing', interior: 'interior' }

let pass = 0
let fail = 0
const ok = (cond, msg) => {
  if (cond) pass++
  else { fail++; console.log('FAIL:', msg) }
}
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`)

function source(key, floorAreasSqft, extra = {}) {
  const input = { floorAreasSqft, state: 'Karnataka', city: 'Bengaluru', ...extra }
  if (key === 'structure') {
    const r = sq.runQuantityModel({ ...input, site: 'flat', wall: 'brick', terraceAccess: true })
    if (!r.ok) throw new Error('structure: ' + r.error)
    const paid = sq.toPaid(r)
    return {
      key, estimateId: 'est-' + key, projectName: 'Test house', state: 'Karnataka', city: 'Bengaluru',
      floors: paid.inputEcho.floors, builtUpM2: paid.inputEcho.totalBuiltUpM2,
      lines: grand.frameLines(paid), heads: grand.frameHeads(paid.band), widest: grand.frameWidest(paid.band),
      assumptions: paid.assumptions, notIncluded: paid.notIncluded, sources: ['IS 456:2000'],
      _paid: paid,
    }
  }
  const m = models[key]
  const p = m.parse(input)
  if (!p.ok) throw new Error(key + ' parse: ' + p.error)
  const r = m.run(p.input)
  if (!r.ok) throw new Error(key + ' run: ' + r.error)
  const paid = r.result.paid
  return {
    key, estimateId: 'est-' + key, projectName: 'Test house', state: 'Karnataka', city: 'Bengaluru',
    floors: floorAreasSqft.length, builtUpM2: floorAreasSqft.reduce((s, a) => s + a, 0) * 0.09290304,
    lines: paid.lines, heads: grand.tradeHeads(key, paid.bands), widest: grand.widestOf(paid.bands),
    assumptions: paid.assumptions, notIncluded: paid.notIncluded, sources: paid.sources, overlap: paid.overlap,
    _paid: paid,
  }
}

const qtyOf = (lines, key) => lines.filter((l) => l.key === key).reduce((s, l) => s + l.qty, 0)
const lineQty = (g, key) => qtyOf(g.paid.lines, key)

/* ---- all five phases, a G+1 house ---------------------------------------------------------- */
const AREAS = [1200, 1200]
const five = Object.keys(KEYS).map((k) => source(k, AREAS))
const g5 = grand.buildGrand(five)
const by = Object.fromEntries(five.map((s) => [s.key, s]))

ok(g5.paid.engine === 'grand-v1' && g5.free.engine === 'grand-v1', 'engine tags')
ok(g5.free.phases.length === 5 && g5.free.missing.length === 0, 'five phases, none missing')
ok(g5.free.checks.find((c) => c.id === 'same-building')?.status === 'pass', 'same building passes')
ok(g5.free.checks.find((c) => c.id === 'phases')?.status === 'pass', 'phases check passes with all five')
ok(g5.free.checks.some((c) => c.id === 'lintels'), 'lintel check is present when frame and walls are both in')

// the lintel overlap: masonry's own report holds it, the merged list does not
const mOverlap = by.masonry.overlap
ok(mOverlap && mOverlap.lines.length >= 3, 'masonry reports its lintel overlap')
const lintelSteelMasonry = qtyOf(by.masonry.lines, 'steel-lintel-kg')
ok(lintelSteelMasonry > 0, 'masonry has lintel steel on its own')
ok(lineQty(g5, 'steel-lintel-kg') === 0, 'lintel steel is taken out of the merged list when the frame is in')

// cement: frame + walls - the lintel share + finishing (each phase rounded up)
const cementFrame = qtyOf(by.structure.lines, 'cement-bag-50kg')
const cementWalls = qtyOf(by.masonry.lines, 'cement-bag-50kg')
const cementInt = qtyOf(by.interior.lines, 'cement-bag-50kg')
const cut = mOverlap.lines.find((l) => l.key === 'cement-bag-50kg').qty
ok(cut > 0 && cut < cementWalls, 'cement overlap is a part of the walls cement')
near(lineQty(g5, 'cement-bag-50kg'), cementFrame + Math.ceil(cementWalls - cut - 1e-9) + cementInt, 1, 'merged cement')
const sandCut = mOverlap.lines.find((l) => l.key === 'sand-m3').qty
near(lineQty(g5, 'sand-m3'), qtyOf(by.structure.lines, 'sand-m3') + (qtyOf(by.masonry.lines, 'sand-m3') - sandCut) + qtyOf(by.interior.lines, 'sand-m3'), 0.05, 'merged sand')
near(lineQty(g5, 'aggregate-20mm-m3'), qtyOf(by.structure.lines, 'aggregate-20mm-m3'), 0.05, 'merged stone is the frame stone (walls stone was all lintel)')

// steel: every bar size of the frame, one line each; the sum is the frame's buy weight (each size rounded up)
const steelLines = g5.paid.lines.filter((l) => l.key.startsWith('steel-'))
const frameSteel = by.structure._paid.steelByDiameter.reduce((s, x) => s + Math.ceil(x.kg), 0)
ok(steelLines.length === by.structure._paid.steelByDiameter.length, 'one steel line per frame bar size')
near(steelLines.reduce((s, l) => s + l.qty, 0), frameSteel, 0.5, 'merged steel equals the frame bars')
near(frameSteel, by.structure._paid.totals.steelBuyKg, by.structure._paid.steelByDiameter.length + 1, 'frame bars add up to the frame buy weight')

// nothing is negative or duplicated, nothing carries a price
const keys = g5.paid.lines.map((l) => l.key + '|' + l.unit)
ok(new Set(keys).size === keys.length, 'merged list has no duplicate lines')
ok(g5.paid.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), 'every merged quantity is positive')
const text = JSON.stringify(g5)
ok(!/₹|\bRs\.?\s?\d|rupee|per sq ?ft|\blabou?r rate|dealer/i.test(text.replace(/Labour, contractors, equipment hire and transport\. The site counts quantities only\./, '')), 'no price or rate language')

// tiles
ok(g5.paid.tiles.length >= 3 && g5.paid.tiles.length <= 4, 'three or four tiles')
const cementTile = g5.paid.tiles.find((t) => t.k === 'Cement')
ok(cementTile && Number(cementTile.v.replace(/,/g, '')) === lineQty(g5, 'cement-bag-50kg'), 'cement tile equals the merged cement')
{
  const [lo, hi] = cementTile.range.split(' to ').map((x) => Number(x.replace(/,/g, '')))
  ok(lo < lineQty(g5, 'cement-bag-50kg') && hi > lineQty(g5, 'cement-bag-50kg'), 'cement range brackets the total')
}

// tables: phases, bulk, one per phase, order
const ids = g5.paid.tables.map((t) => t.id)
ok(ids[0] === 'phases' && ids.includes('bulk') && ids[ids.length - 1] === 'order', 'tables run phases, bulk, phase lists, order')
for (const k of Object.keys(KEYS)) ok(ids.includes('phase-' + k), 'a buying list for ' + k)
const bulk = g5.paid.tables.find((t) => t.id === 'bulk')
ok(bulk.head.length === bulk.rows[0].length, 'bulk table columns line up')
for (const t of g5.paid.tables) ok(t.rows.every((r) => r.length === t.head.length), 'table ' + t.id + ' rows match the heading')
ok(!g5.paid.tables.find((t) => t.id === 'phase-masonry').rows.some((r) => String(r[0]).startsWith('Steel for lintels')), 'masonry list has no lintel steel when the frame is in')
ok(!g5.paid.tables.some((t) => t.rows.some((r) => ['Cement', 'Sand', 'Stone aggregate 20 mm'].includes(String(r[0])) && t.id.startsWith('phase-'))), 'phase lists do not repeat cement, sand or stone')

// the free part carries no quantity of any material
ok(!('lines' in g5.free) && !('tiles' in g5.free) && !('tables' in g5.free), 'free part has no lines, tiles or tables')

/* ---- the frame alone is not a Grand Total, and walls without a frame keep their lintels ----------- */
const two = grand.buildGrand([by.masonry, by.interior])
ok(two.free.missing.length === 3, 'three phases are missing when two are in')
ok(two.free.checks.find((c) => c.id === 'phases').status === 'advisory', 'missing phases are an advisory note')
ok(!two.free.checks.some((c) => c.id === 'lintels'), 'no lintel note without the frame')
ok(qtyOf(two.paid.lines, 'steel-lintel-kg') === lintelSteelMasonry, 'walls keep their lintel steel when there is no frame')
near(qtyOf(two.paid.lines, 'cement-bag-50kg'), cementWalls + cementInt, 0.5, 'walls + finishing cement, nothing removed')
ok(two.free.warnings.length === 1, 'one warning about the phases that are missing')

/* ---- the reports must agree ------------------------------------------------------------------------ */
{
  const a = source('masonry', [1200, 1200])
  const b = source('plumbing', [1400, 1400]) // 16.7% larger
  ok(!grand.agreement([a, b]).ok, 'a 16% area difference is not the same building')
  ok(/10%/.test(grand.disagreement([a, b]) || ''), 'the message names the 10% limit')
  const c = source('plumbing', [1200, 1200, 1200])
  ok(grand.disagreement([a, c]) && /number of floors/.test(grand.disagreement([a, c])), 'a different floor count is refused')
  const d = { ...source('plumbing', [1200, 1200]), state: 'Maharashtra' }
  ok(/different states/.test(grand.disagreement([a, d]) || ''), 'a different state is refused')
  const e = source('plumbing', [1230, 1230]) // 2.5% larger
  ok(grand.agreement([a, e]).ok, 'a 2.5% difference is accepted')
  const gE = grand.buildGrand([a, e])
  ok(gE.free.checks.find((c) => c.id === 'same-building').status === 'advisory', 'a 2.5% difference is an advisory note')
}

/* ---- a bigger and a smaller house still merge cleanly ---------------------------------------------- */
for (const areas of [[800], [1000, 1000, 1000], [1500, 1500, 1500, 1500]]) {
  const all = Object.keys(KEYS).map((k) => source(k, areas))
  const g = grand.buildGrand(all)
  ok(g.paid.lines.length > 20 && g.paid.lines.every((l) => l.qty > 0), `${areas.length} floors: merged list is sensible`)
  const fc = qtyOf(all.find((s) => s.key === 'structure').lines, 'cement-bag-50kg')
  ok(lineQty(g, 'cement-bag-50kg') >= fc, `${areas.length} floors: merged cement is at least the frame cement`)
}

console.log(`\nGrand Total: ${pass} passed, ${fail} failed`)
if (dump) {
  console.log(JSON.stringify({ tiles: g5.paid.tiles, free: g5.free, bulk: bulk, bands: g5.paid.bands, removed: g5.free.checks.find((c) => c.id === 'lintels') }, null, 1))
}
process.exit(fail ? 1 : 0)

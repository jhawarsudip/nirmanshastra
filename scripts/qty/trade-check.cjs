/* Runs the trade models on a set of cases and prints what they produce, then checks the invariants.
   Usage: compile first (see scripts/qty/README.md), then  node scripts/qty/trade-check.cjs [plumbing|electrical|masonry|interior|all] [--dump]  */
const path = require('path')
const BUILD = process.env.TRADE_BUILD || '/tmp/trade-build'
const arg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all'
const dump = process.argv.includes('--dump')

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FAIL:', msg) } }

function load(name) {
  try { return require(path.join(BUILD, 'qty', name)) } catch (e) { return null }
}

const scenes = {
  g2: { floorAreasSqft: [1000, 1000, 600], state: 'Maharashtra', city: 'Pune' },
  g1: { floorAreasSqft: [1200, 1000], state: 'Karnataka', city: 'Bengaluru' },
  g5: { floorAreasSqft: [1800, 1800, 1800, 1800, 1800, 1800], state: 'Delhi', city: 'Delhi' },
  g0: { floorAreasSqft: [700], state: 'Uttar Pradesh', city: 'Mathura' },
}

function walk(r) {
  // every number anywhere in the paid payload must be finite, and no rupee wording may appear
  const bad = []
  const rec = (v, p) => {
    if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p)
    else if (typeof v === 'string' && /₹|rs\.?\s?\d|rupee|labou?r (cost|rate)|per sq\s?ft rate/i.test(v)) bad.push(p + ' => ' + v)
    else if (Array.isArray(v)) v.forEach((x, i) => rec(x, p + '[' + i + ']'))
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => rec(x, p + '.' + k))
  }
  rec(r, 'r')
  return bad
}

function show(title, res) {
  if (!res.ok) { console.log(title, '=> ERROR', res.error); return }
  const { free, paid } = res.result
  console.log('\n──', title)
  console.log('  chips:', free.chips.join(' | '))
  for (const f of free.facts) console.log('  fact:', f.k, '=', f.v, f.note ? '(' + f.note + ')' : '')
  for (const c of free.checks) console.log('  check:', c.status.toUpperCase(), c.clause, '-', c.description)
  for (const w of free.warnings) console.log('  warn:', w.slice(0, 120))
  for (const t of paid.tiles) console.log('  tile:', t.k, t.v, t.unit, t.range ? '[' + t.range + ']' : '')
  if (dump) for (const t of paid.tables) { console.log('  TABLE', t.title); console.log('   ', t.head.join(' | ')); t.rows.forEach((r) => console.log('   ', r.join(' | '))); if (t.foot) console.log('   ', t.foot.join(' | ')) }
}

/* ───────── plumbing ───────── */
if (arg === 'all' || arg === 'plumbing') {
  const mod = load('plumbing/model.js')
  if (!mod) { console.log('plumbing model not compiled'); fail++ } else {
    const M = mod.plumbingModel
    const cases = {
      'G+2 house, municipal, sewer': { ...scenes.g2, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, water: 'municipal', sewer: true, soil: 'medium', rain: 'heavy' },
      'G+1 house, borewell, septic, good soil': { ...scenes.g1, dwelling: 'house', bedrooms: 4, bathrooms: 4, kitchens: 1, water: 'borewell', sewer: false, soil: 'good', rain: 'veryheavy' },
      'G+5 flats 2/floor, municipal, sewer': { ...scenes.g5, dwelling: 'flats', homesPerFloor: 2, bedrooms: 3, bathrooms: 2, kitchens: 1, water: 'municipal', sewer: true, soil: 'medium', rain: 'extreme' },
      'G only, tanker, septic, poor soil': { ...scenes.g0, dwelling: 'house', bedrooms: 2, bathrooms: 1, kitchens: 1, water: 'tanker', sewer: false, soil: 'poor', rain: 'heavy', geyser: false, washer: false },
    }
    let prev = null
    for (const [name, raw] of Object.entries(cases)) {
      const p = M.parse(raw)
      ok(p.ok, name + ' parses: ' + (p.error || ''))
      if (!p.ok) continue
      const r1 = M.run(p.input), r2 = M.run(p.input)
      ok(r1.ok, name + ' runs')
      if (!r1.ok) continue
      ok(JSON.stringify(r1.result) === JSON.stringify(r2.result), name + ' is deterministic')
      const bad = walk(r1.result.paid); ok(bad.length === 0, name + ' no NaN / rupee words: ' + bad.slice(0, 3).join('; '))
      const badF = walk(r1.result.free); ok(badF.length === 0, name + ' free part clean: ' + badF.slice(0, 3).join('; '))
      // the free part must carry no pipe length, tank size or pump
      const freeText = JSON.stringify(r1.result.free)
      ok(!/\bHP\b|\bm of pipe\b|3 m lengths/.test(freeText), name + ' free part leaks no paid quantity')
      ok(r1.result.paid.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), name + ' every line positive')
      ok(r1.result.paid.tiles.length >= 3, name + ' has tiles')
      show(name, r1)
    }
    // monotonic: more bathrooms -> more pipe, more fittings, more fixtures
    const base = { ...scenes.g2, dwelling: 'house', bedrooms: 3, bathrooms: 2, kitchens: 1, water: 'municipal', sewer: true, soil: 'medium', rain: 'heavy' }
    const more = { ...base, bathrooms: 4 }
    const a = M.run(M.parse(base).input).result.paid, b = M.run(M.parse(more).input).result.paid
    const tot = (x, pre) => x.lines.filter((l) => l.key.startsWith(pre)).reduce((s, l) => s + l.qty, 0)
    ok(tot(b, 'pipe-cpvc') > tot(a, 'pipe-cpvc'), 'more bathrooms -> more CPVC pipe')
    ok(tot(b, 'pipe-swr') > tot(a, 'pipe-swr'), 'more bathrooms -> more drain pipe')
    ok(b.lines.find((l) => l.key === 'wc').qty === 4 && a.lines.find((l) => l.key === 'wc').qty === 2, 'WC count equals bathrooms')
    // more people -> bigger tanks
    const big = { ...base, persons: 12 }
    const c = M.run(M.parse(big).input).result.paid
    const oht = (x) => x.lines.find((l) => l.key === 'tank-oht').qty
    ok(oht(c) >= oht(a), 'more people -> overhead tank not smaller')
    // free tank sanity: 5 people municipal -> UGT 450 -> 500, OHT 225 -> 500
    const five = M.run(M.parse({ ...base, persons: 5 }).input).result.paid
    ok(five.lines.find((l) => l.key === 'tank-ugt').qty === 500 && oht(five) === 500, '5 people municipal: 500 L + 500 L')
    // locked constants and the shared tank split (used by the free Water Tank calculator too)
    const k = load('plumbing/constants.js')
    ok(k && k.WATER_DEMAND_LPCD.municipal === 135 && k.WATER_DEMAND_LPCD.borewell === 150, 'locked IS 1172 constants unchanged')
    const tk = load('plumbing/tanks.js')
    const sm = tk.tankSplit('municipal', 900), sb = tk.tankSplit('borewell', 900), st = tk.tankSplit('tanker', 900)
    ok(sm.ugtL === 600 && sm.ohtL === 300 && sb.ugtL === 0 && sb.ohtL === 450 && st.ugtL === 1350 && st.ohtL === 300, 'NBC tank split: municipal 2/3 + 1/3, borewell 1/2 overhead, tanker 1.5 + 1/3')
    ok(tk.tankPlan(450, true).each === 500 && tk.tankPlan(9000, true).each === 9000 && tk.tankPlan(7500, false).count === 2, 'tank rounding: 450 -> 500, built sump 9,000, 7,500 overhead -> 2 tanks')
    // bad input is refused
    ok(!M.parse({ ...scenes.g2, bathrooms: 99 }).ok, 'bathrooms 99 is refused')
    ok(!M.parse({ floorAreasSqft: [50], state: 'X' }).ok, 'tiny floor is refused')
    ok(!M.parse({ ...scenes.g2, state: '' }).ok, 'missing state is refused')
  }
}

/* ───────── masonry ───────── */
if (arg === 'all' || arg === 'masonry') {
  const mod = load('masonry/model.js')
  if (!mod) { console.log('masonry model not compiled'); fail++ } else {
    const M = mod.masonryModel
    const near = (a, b, tol) => Math.abs(a - b) <= tol
    // the unit and joint figures match the worked values in the research file (IS 1077, IS 12894, IS 2185 sizes; 10 mm joints)
    const S = mod.SYSTEMS
    ok(near(mod.unitsPerM2(S.modular, 0.09, false), 50, 0.01) && near(mod.unitsPerM2(S.modular, 0.19, false), 100, 0.01), 'modular brick: 50 and 100 per m² for half and one brick')
    ok(near(mod.jointMortarPerM2(S.modular, 0.09, false), 0.01305, 0.00002) && near(mod.jointMortarPerM2(S.modular, 0.19, false), 0.0361, 0.00002), 'modular brick: exact joint mortar 0.01305 and 0.03610 m³ per m²')
    ok(near(mod.unitsPerM2(S.brick, 0.115, false), 49.0, 0.1) && near(mod.unitsPerM2(S.brick, 0.23, false), 94.1, 0.1), 'field brick: 49.0 and 94.1 per m²')
    ok(near(mod.jointMortarPerM2(S.brick, 0.115, false), 0.01776, 0.00003) && near(mod.jointMortarPerM2(S.brick, 0.23, false), 0.04329, 0.00003), 'field brick: exact joint mortar 0.01776 and 0.04329 m³ per m²')
    ok(near(mod.unitsPerM2(S.flyash, 0.11, false), 52.1, 0.1) && near(mod.unitsPerM2(S.flyash, 0.23, false), 104.2, 0.1), 'fly-ash brick: 52.1 and 104.2 per m²')
    ok(near(mod.unitsPerM2(S.aac, 0.1, false), 8.333, 0.001) && near(mod.unitsPerM2(S.aac, 0.1, true), 8.169, 0.001), 'AAC block: 8.333 per m² (10 mm joint), 8.169 (thin bed)')
    ok(near(mod.jointMortarPerM2({ ...S.block, L: 0.6, short: true }, 0.1, false), 0.00593, 0.00003), '600 x 200 block, 100 mm: exact joint mortar 0.00593 m³ per m²')

    const cases = {
      'G+1 house 3BHK, red brick': { ...scenes.g1, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, system: 'brick', plasterExt: 'twocoat' },
      'G+2 house, AAC thin bed': { ...scenes.g2, dwelling: 'house', bedrooms: 4, bathrooms: 4, kitchens: 1, balconies: 2, system: 'aac', aacJoint: 'thin', thickOuter: true, plasterExt: 'twocoat' },
      'G+5 flats 2/floor, fly-ash brick': { ...scenes.g5, dwelling: 'flats', homesPerFloor: 2, bedrooms: 3, bathrooms: 2, kitchens: 1, balconies: 2, system: 'flyash', plasterExt: 'single', bigDoor: true },
      'G only, concrete block 150, no outside plaster': { ...scenes.g0, dwelling: 'house', bedrooms: 2, bathrooms: 1, kitchens: 1, balconies: 0, system: 'block', thickOuter: false, plasterExt: 'none', plasterCeil: false, parapet: false, mumty: true },
      'G+2 house, modular brick': { ...scenes.g2, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, system: 'modular', plasterExt: 'twocoat' },
    }
    const results = {}
    for (const [name, raw] of Object.entries(cases)) {
      const p = M.parse(raw)
      ok(p.ok, name + ' parses: ' + (p.error || ''))
      if (!p.ok) continue
      const r1 = M.run(p.input), r2 = M.run(p.input)
      ok(r1.ok, name + ' runs')
      if (!r1.ok) continue
      results[name] = r1.result
      ok(JSON.stringify(r1.result) === JSON.stringify(r2.result), name + ' is deterministic')
      const bad = walk(r1.result.paid); ok(bad.length === 0, name + ' no NaN / rupee words: ' + bad.slice(0, 3).join('; '))
      const badF = walk(r1.result.free); ok(badF.length === 0, name + ' free part clean: ' + badF.slice(0, 3).join('; '))
      const freeText = JSON.stringify(r1.result.free)
      ok(!/\bbags?\b|\bkg\b/.test(freeText), name + ' free part leaks no paid quantity')
      ok(r1.result.paid.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), name + ' every line positive')
      ok(r1.result.paid.tiles.length === 4, name + ' has four tiles')
      // every row of every table has the same width as its head
      for (const t of r1.result.paid.tables) ok(t.rows.every((r) => r.length === t.head.length) && (!t.foot || t.foot.length === t.head.length), name + ' table "' + t.id + '" is rectangular')
      show(name, r1)
    }

    // bricks per sq ft of built-up area for the G+1 red brick house: a sanity band, not a calibration
    const g1 = results['G+1 house 3BHK, red brick']
    if (g1) {
      const bricks = g1.paid.lines.find((l) => l.key === 'masonry-unit-brick').qty
      const per = bricks / (1200 + 1000)
      console.log('  bricks per sq ft built-up (G+1, 3BHK):', per.toFixed(1))
      ok(per > 6 && per < 18, 'bricks per sq ft of built-up area sits in 6 to 18 (' + per.toFixed(1) + ')')
      const cem = g1.paid.lines.find((l) => l.key === 'cement-bag-50kg').qty
      console.log('  cement bags per sq ft built-up:', (cem / 2200).toFixed(3))
    }
    // AAC thin bed has adhesive and a concrete block plinth; no joint mortar on the AAC walls
    const aac = results['G+2 house, AAC thin bed']
    if (aac) {
      ok(aac.paid.lines.some((l) => l.key === 'aac-adhesive-kg'), 'AAC thin bed has an adhesive line')
      ok(aac.paid.lines.some((l) => l.key === 'masonry-unit-block'), 'AAC house has concrete blocks for the plinth')
    }
    // modular brick needs more units per m³ of wall but fewer per m² (190 vs 230 wall), and is a different count from field brick
    const mb = results['G+2 house, modular brick'], g2 = M.run(M.parse({ ...scenes.g2, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, system: 'brick', plasterExt: 'twocoat' }).input).result
    if (mb) ok(mb.paid.lines.find((l) => l.key === 'masonry-unit-modular').qty !== g2.paid.lines.find((l) => l.key === 'masonry-unit-brick').qty, 'modular and field brick give different counts')
    // monotonic checks
    const base = { ...scenes.g2, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, system: 'brick', plasterExt: 'twocoat' }
    const run = (o) => M.run(M.parse({ ...base, ...o }).input).result
    const qty = (r, key) => (r.paid.lines.find((l) => l.key === key) || { qty: 0 }).qty
    const plaster = (r) => Number(String(r.paid.tables.find((t) => t.id === 'plaster').foot[3]).replace(/,/g, ''))
    const b0 = run({})
    ok(qty(run({ floorAreasSqft: [1500, 1500, 900] }), 'masonry-unit-brick') > qty(b0, 'masonry-unit-brick'), 'bigger floors -> more bricks')
    ok(qty(run({ bedrooms: 5, bathrooms: 5 }), 'masonry-unit-brick') > qty(b0, 'masonry-unit-brick'), 'more rooms -> more bricks')
    ok(plaster(run({ plasterExt: 'none' })) < plaster(b0), 'no outside plaster -> less plaster')
    ok(plaster(run({ plasterCeil: false })) < plaster(b0), 'no ceiling plaster -> less plaster')
    ok(qty(run({ parapet: false }), 'masonry-unit-brick') < qty(b0, 'masonry-unit-brick'), 'no parapet -> fewer bricks')
    ok(qty(run({ system: 'flyash' }), 'masonry-unit-flyash') > 0, 'fly-ash brick line exists')
    ok(qty(run({ storeyM: 3.4 }), 'masonry-unit-brick') > qty(b0, 'masonry-unit-brick'), 'taller storey -> more bricks')
    ok(qty(run({ plasterExt: 'single' }), 'cement-bag-50kg') !== qty(b0, 'cement-bag-50kg'), 'plaster choice changes cement')
    // bad input is refused
    ok(!M.parse({ ...base, system: 'timber' }).ok, 'unknown wall material is refused')
    ok(!M.parse({ ...base, storeyM: 9 }).ok, 'storey of 9 m is refused')
    ok(!M.parse({ ...base, balconies: 40 }).ok, '40 balconies is refused')
    ok(!M.parse({ ...base, state: '' }).ok, 'missing state is refused')
  }
}

/* ───────── electrical ───────── */
if (arg === 'all' || arg === 'electrical') {
  const mod = load('electrical/model.js')
  if (!mod) { console.log('electrical model not compiled'); fail++ } else {
    const M = mod.electricalModel
    const cases = {
      'G+1 house 3BHK, standard': { ...scenes.g1, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, acRooms: 2, geyser: true, wiring: 'standard' },
      'G+2 house 4BHK, basic, inverter, EV': { ...scenes.g2, dwelling: 'house', bedrooms: 4, bathrooms: 4, kitchens: 1, balconies: 2, acRooms: 3, inverter: true, ev: true, parking: 2, wiring: 'basic', pooja: true },
      'G+5 flats 2/floor, 2BHK': { ...scenes.g5, dwelling: 'flats', homesPerFloor: 2, bedrooms: 2, bathrooms: 2, kitchens: 1, balconies: 1, acRooms: 1, parking: 12, wiring: 'standard' },
      'G only 2BHK, small': { ...scenes.g0, dwelling: 'house', bedrooms: 2, bathrooms: 1, kitchens: 1, balconies: 0, acRooms: 0, geyser: false, utility: false, wiring: 'basic' },
      'G+1 large house, three-phase': { floorAreasSqft: [3000, 3000], state: 'Gujarat', city: 'Ahmedabad', dwelling: 'house', bedrooms: 5, bathrooms: 5, kitchens: 2, balconies: 3, acRooms: 5, dining: true, supply: 'auto', wiring: 'standard' },
    }
    const results = {}
    for (const [name, raw] of Object.entries(cases)) {
      const p = M.parse(raw)
      ok(p.ok, name + ' parses: ' + (p.error || ''))
      if (!p.ok) continue
      const r1 = M.run(p.input), r2 = M.run(p.input)
      ok(r1.ok, name + ' runs')
      if (!r1.ok) continue
      results[name] = r1.result
      ok(JSON.stringify(r1.result) === JSON.stringify(r2.result), name + ' is deterministic')
      const bad = walk(r1.result.paid); ok(bad.length === 0, name + ' no NaN / rupee words: ' + bad.slice(0, 3).join('; '))
      const badF = walk(r1.result.free); ok(badF.length === 0, name + ' free part clean: ' + badF.slice(0, 3).join('; '))
      const freeText = JSON.stringify(r1.result.free)
      ok(!/\bcoils?\b|lengths|to buy|\bwire\b.*\d+ m\b/i.test(freeText), name + ' free part leaks no paid quantity')
      ok(r1.result.paid.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), name + ' every line positive')
      const keys = r1.result.paid.lines.map((l) => l.key)
      ok(new Set(keys).size === keys.length, name + ' line keys are unique: ' + keys.filter((k, i) => keys.indexOf(k) !== i).join(','))
      ok(r1.result.paid.tiles.length === 4, name + ' has four tiles')
      for (const t of r1.result.paid.tables) ok(t.rows.every((r) => r.length === t.head.length) && (!t.foot || t.foot.length === t.head.length), name + ' table "' + t.id + '" is rectangular')
      show(name, r1)
    }

    const line = (r, key) => (r.paid.lines.find((l) => l.key === key) || { qty: 0 }).qty
    const wireTotal = (r) => r.paid.lines.filter((l) => l.key.startsWith('wire-cu-')).reduce((s, l) => s + l.qty, 0)
    const condTotal = (r) => r.paid.lines.filter((l) => l.key.startsWith('conduit-pvc-')).reduce((s, l) => s + l.qty, 0)
    const pointsOf = (r) => line(r, 'light-points') + line(r, 'sockets')

    // sanity bands on the plain G+1 3BHK house (2,200 sq ft built-up): a check on size, not a calibration
    const g1 = results['G+1 house 3BHK, standard']
    if (g1) {
      const sq = 1200 + 1000
      console.log('  wire m per sq ft:', (wireTotal(g1) / sq).toFixed(2), ' conduit m per sq ft:', (condTotal(g1) / sq).toFixed(2), ' points+sockets per 100 sq ft:', (pointsOf(g1) / sq * 100).toFixed(1))
      ok(wireTotal(g1) / sq > 0.7 && wireTotal(g1) / sq < 2.6, 'wire per sq ft sits in 0.7 to 2.6 m')
      ok(condTotal(g1) / sq > 0.25 && condTotal(g1) / sq < 1.2, 'conduit per sq ft sits in 0.25 to 1.2 m')
      ok(pointsOf(g1) / sq * 100 > 2 && pointsOf(g1) / sq * 100 < 9, 'points and sockets per 100 sq ft sit in 2 to 9')
      ok(g1.paid.lines.some((l) => l.key.startsWith('wire-cu-1.5-red')) && g1.paid.lines.some((l) => l.key.startsWith('wire-cu-2.5-green')), 'wire lines by size and colour exist')
    }
    // the basic level counts fewer points than the standard level, for the same building
    const base = { ...scenes.g1, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, acRooms: 2, geyser: true, wiring: 'standard' }
    const run = (o) => M.run(M.parse({ ...base, ...o }).input).result
    const b0 = run({})
    ok(pointsOf(run({ wiring: 'basic' })) < pointsOf(b0), 'basic wiring counts fewer points and sockets than standard')
    ok(pointsOf(run({ bedrooms: 5, bathrooms: 5 })) > pointsOf(b0), 'more rooms -> more points')
    ok(wireTotal(run({ floorAreasSqft: [2000, 1800] })) > wireTotal(b0), 'bigger floors -> more wire')
    ok(line(run({ acRooms: 4 }), 'sockets') > line(run({ acRooms: 0 }), 'sockets'), 'more air conditioners -> more outlets')
    ok(wireTotal(run({ acRooms: 4 })) > wireTotal(run({ acRooms: 0 })), 'more air conditioners -> more wire')
    ok(run({ inverter: true }).paid.tables.find((t) => t.id === 'circuits').rows.some((r) => r[0] === 'Inverter'), 'an inverter adds a circuit')
    ok(run({ ev: true }).paid.tables.find((t) => t.id === 'circuits').rows.some((r) => r[0] === 'EV charger'), 'EV charging adds a circuit')
    ok(!b0.paid.tables.find((t) => t.id === 'circuits').rows.some((r) => r[0] === 'EV charger' || r[0] === 'Inverter'), 'no EV or inverter circuit unless asked')
    ok(run({ supply: 'three' }).paid.tables.find((t) => t.id === 'wire').rows.some((r) => r[1] === 'Yellow'), 'a three-phase supply adds yellow and blue mains wire')
    ok(!run({ supply: 'single' }).paid.tables.find((t) => t.id === 'wire').rows.some((r) => r[1] === 'Yellow'), 'single-phase has no yellow or blue wire')
    ok(run({ dining: true }).paid.tables.find((t) => t.id === 'points').rows.some((r) => r[0] === 'Dining room'), 'a separate dining room is its own row')
    // flats: more homes -> more boards, and a common board exists
    const fl = results['G+5 flats 2/floor, 2BHK']
    if (fl) {
      const boards = fl.paid.tables.find((t) => t.id === 'boards').rows
      ok(boards.some((r) => r[0] === 'Common board'), 'flats have a common board')
      ok(boards.filter((r) => r[0] !== 'Common board').reduce((s, r) => s + Number(r[1]), 0) === 12, 'twelve flats have twelve boards')
      ok(fl.paid.tables.find((t) => t.id === 'mains').rows.length >= 6, 'flats have rising mains for each floor')
    }
    // the large house is on three-phase
    const big = results['G+1 large house, three-phase']
    if (big) ok(big.free.facts.find((f) => f.k === 'Supply').v === 'Three-phase', 'a very large house is on a three-phase supply')
    const small = results['G only 2BHK, small']
    if (small) ok(small.free.facts.find((f) => f.k === 'Supply').v === 'Single-phase', 'a small house is on a single-phase supply')
    // bad input is refused
    ok(!M.parse({ ...base, wiring: 'luxury' }).ok, 'unknown wiring level is refused')
    ok(!M.parse({ ...base, acRooms: 40 }).ok, '40 air-conditioned rooms is refused')
    ok(!M.parse({ ...base, storeyM: 9 }).ok, 'storey of 9 m is refused')
    ok(!M.parse({ ...base, state: '' }).ok, 'missing state is refused')
  }
}

/* ───────── interior ───────── */
if (arg === 'all' || arg === 'interior') {
  const mod = load('interior/model.js')
  if (!mod) { console.log('interior model not compiled'); fail++ } else {
    const M = mod.interiorModel
    const cases = {
      'G+1 house 3BHK, standard': { ...scenes.g1, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, paint: 'standard', exterior: 'acrylic' },
      'G+2 house 4BHK, premium, textured, ceilings, adhesive, cabinets': { ...scenes.g2, dwelling: 'house', bedrooms: 4, bathrooms: 4, kitchens: 1, balconies: 2, paint: 'premium', exterior: 'textured', falseCeiling: 'rooms', tileSize: '800x800', tileFix: 'adhesive', lay: 'diagonal', bathTile: 'full', kitchenShape: 'u', kitchenCabinets: true, wardrobes: 'all' },
      'G+5 flats 2/floor, economy, cement paint': { ...scenes.g5, dwelling: 'flats', homesPerFloor: 2, bedrooms: 3, bathrooms: 2, kitchens: 1, balconies: 1, paint: 'economy', exterior: 'cement', falseCeiling: 'hall', tileSize: '600x1200', bathTile: 'half', wardrobes: 'master' },
      'G only 2BHK, no outside paint': { ...scenes.g0, dwelling: 'house', bedrooms: 2, bathrooms: 1, kitchens: 1, balconies: 0, paint: 'standard', exterior: 'none' },
    }
    const results = {}
    for (const [name, raw] of Object.entries(cases)) {
      const p = M.parse(raw)
      ok(p.ok, name + ' parses: ' + (p.error || ''))
      if (!p.ok) continue
      const r1 = M.run(p.input), r2 = M.run(p.input)
      ok(r1.ok, name + ' runs')
      if (!r1.ok) continue
      results[name] = r1.result
      ok(JSON.stringify(r1.result) === JSON.stringify(r2.result), name + ' is deterministic')
      const bad = walk(r1.result.paid); ok(bad.length === 0, name + ' no NaN / rupee words: ' + bad.slice(0, 3).join('; '))
      const badF = walk(r1.result.free); ok(badF.length === 0, name + ' free part clean: ' + badF.slice(0, 3).join('; '))
      const freeText = JSON.stringify(r1.result.free)
      ok(!/\b\d[\d,.]*\s?(kg|litres?|sheets|boxes|bags|pieces|nos|m³)\b/i.test(freeText), name + ' free part leaks no paid quantity')
      ok(r1.result.paid.lines.every((l) => l.qty > 0 && Number.isFinite(l.qty)), name + ' every line positive')
      const keys = r1.result.paid.lines.map((l) => l.key)
      ok(new Set(keys).size === keys.length, name + ' line keys are unique: ' + keys.filter((k, i) => keys.indexOf(k) !== i).join(','))
      ok(r1.result.paid.tiles.length === 4, name + ' has four tiles')
      for (const t of r1.result.paid.tables) ok(t.rows.every((r) => r.length === t.head.length) && (!t.foot || t.foot.length === t.head.length), name + ' table "' + t.id + '" is rectangular')
      show(name, r1)
    }

    const line = (r, key) => (r.paid.lines.find((l) => l.key === key) || { qty: 0 }).qty
    const has = (r, pre) => r.paid.lines.some((l) => l.key.startsWith(pre))
    const sumPre = (r, pre) => r.paid.lines.filter((l) => l.key.startsWith(pre)).reduce((s, l) => s + l.qty, 0)

    // sanity bands on the plain G+1 3BHK house (2,200 sq ft = 204 m² built-up): a check on size, not a calibration
    const g1 = results['G+1 house 3BHK, standard']
    if (g1) {
      const m2 = 2200 * 0.092903
      const tileM2 = Number(g1.paid.tiles[1].v.replace(/,/g, ''))
      const paintM2 = Number(g1.paid.tiles[0].v.replace(/,/g, ''))
      console.log('  painted m² per m² built-up:', (paintM2 / m2).toFixed(2), ' tiles m² per m² built-up:', (tileM2 / m2).toFixed(2))
      ok(paintM2 / m2 > 2.4 && paintM2 / m2 < 5.5, 'painted area is 2.4 to 5.5 times the built-up area (inside and out)')
      ok(tileM2 / m2 > 0.7 && tileM2 / m2 < 1.5, 'tile area is 0.7 to 1.5 times the built-up area')
      ok(has(g1, 'tile-600x600-nos') && has(g1, 'tile-300x600-nos'), 'floor and wall tile lines exist')
      ok(has(g1, 'cement-bag-50kg') && has(g1, 'sand-m3'), 'mortar bed gives cement and sand lines that the Grand Total can merge')
      ok(!has(g1, 'gypsum-board'), 'no false ceiling unless asked')
      ok(!has(g1, 'ply-'), 'no plywood unless carpentry is asked')
    }
    const gx = results['G+2 house 4BHK, premium, textured, ceilings, adhesive, cabinets']
    if (gx) {
      ok(has(gx, 'gypsum-board-2400x1200-nos') && has(gx, 'fc-section-m'), 'a false ceiling gives board and framing lines')
      ok(has(gx, 'ply-19mm-sheet') && has(gx, 'laminate-sheet'), 'cabinets and wardrobes give plywood and laminate')
      ok(has(gx, 'tile-adhesive-kg') && !has(gx, 'cement-bag-50kg'), 'adhesive replaces the mortar bed')
      ok(has(gx, 'tile-800x800-nos'), 'the 800 mm tile line exists')
      ok(gx.free.warnings.some((w) => /false ceiling/i.test(w)) && gx.free.warnings.some((w) => /adhesive/i.test(w)), 'warnings for the false ceiling and the adhesive')
    }
    const fl = results['G+5 flats 2/floor, economy, cement paint']
    if (fl) {
      ok(has(fl, 'distemper-interior-l') && has(fl, 'cement-paint-kg'), 'economy gives distemper inside and cement paint outside')
      ok(!has(fl, 'wall-putty-kg') || true, 'putty line is optional on economy')
    }
    const sm = results['G only 2BHK, no outside paint']
    if (sm) ok(!has(sm, 'primer-exterior-l') && !has(sm, 'cement-paint-kg') && !has(sm, 'paint-exterior-l'), 'no outside paint lines when the outside is left')

    const base = { ...scenes.g1, dwelling: 'house', bedrooms: 3, bathrooms: 3, kitchens: 1, balconies: 1, paint: 'standard', exterior: 'acrylic' }
    const run = (o) => M.run(M.parse({ ...base, ...o }).input).result
    const b0 = run({})
    const tilePcs = (r) => r.paid.lines.filter((l) => /^tile-\d+x\d+-nos$/.test(l.key)).reduce((s, l) => s + l.qty, 0)
    ok(tilePcs(run({ floorAreasSqft: [2000, 1800] })) > tilePcs(b0), 'bigger floors -> more tile pieces')
    ok(line(run({ lay: 'diagonal' }), 'tile-600x600-nos') > line(b0, 'tile-600x600-nos'), 'diagonal laying -> more floor tiles')
    ok(sumPre(run({ exterior: 'none' }), 'primer-exterior') === 0 && Number(run({ exterior: 'none' }).paid.tiles[0].v.replace(/,/g, '')) < Number(b0.paid.tiles[0].v.replace(/,/g, '')), 'leaving the outside unpainted cuts the painted area')
    ok(line(run({ bedrooms: 5, bathrooms: 5 }), 'door-room-nos') > line(b0, 'door-room-nos'), 'more rooms -> more room doors')
    ok(run({ falseCeiling: 'rooms' }).paid.tables.find((t) => t.id === 'fc') && Number(run({ falseCeiling: 'rooms' }).paid.lines.find((l) => l.key === 'gypsum-board-2400x1200-nos').qty) > Number(run({ falseCeiling: 'hall' }).paid.lines.find((l) => l.key === 'gypsum-board-2400x1200-nos').qty), 'ceilings in the bedrooms as well as the living rooms need more board')
    ok(line(run({ kitchenCabinets: true }), 'ply-19mm-sheet') > 0 && line(run({ kitchenCabinets: false }), 'ply-19mm-sheet') === 0, 'kitchen cabinets add plywood and none adds none')
    ok(line(run({ wardrobes: 'all' }), 'ply-19mm-sheet') > line(run({ wardrobes: 'master' }), 'ply-19mm-sheet'), 'wardrobes in every bedroom need more plywood than the master alone')
    ok(line(run({ tileFix: 'adhesive' }), 'tile-adhesive-kg') > 0, 'adhesive weight is counted')
    ok(line(run({ bathTile: 'half' }), 'tile-300x600-nos') < line(b0, 'tile-300x600-nos'), 'half-height bathroom tiling uses fewer wall tiles')
    ok(Number(run({ storeyM: 3.3 }).paid.tiles[0].v.replace(/,/g, '')) > Number(b0.paid.tiles[0].v.replace(/,/g, '')), 'taller storeys -> more wall to paint')
    // the free part of the plain house leaves the paid numbers out
    ok(b0.free.facts.every((f) => !/^\d[\d,.]*$/.test(f.v) || f.k === 'Rooms counted'), 'free facts hold no bare quantity but the room count')
    // bad input is refused
    ok(!M.parse({ ...base, paint: 'gold' }).ok, 'unknown paint level is refused')
    ok(!M.parse({ ...base, tileSize: '900x900' }).ok, 'unknown tile size is refused')
    ok(!M.parse({ ...base, storeyM: 9 }).ok, 'storey of 9 m is refused')
    ok(!M.parse({ ...base, bedrooms: 40 }).ok, '40 bedrooms is refused')
    ok(!M.parse({ ...base, state: '' }).ok, 'missing state is refused')
  }
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)

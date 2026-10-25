// Checks for the v3 layers of the StructurePro model: IS 875-3 wind, open parking level (stilt), balcony cantilevers and 6 mm coil bars.
// Every expected value below is recomputed here by hand arithmetic, not by calling the model's own helpers (except where a helper is the thing under test).
// Build first:  npx tsc --outDir /tmp/qty-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
// Run:          node scripts/qty/v3-check.cjs
const B = process.env.QTY_BUILD || '/tmp/qty-build'
const { runQuantityModel, toFree, toPaid } = require(B + '/index.js')
const wind = require(B + '/wind.js')
const planMod = require(B + '/plan.js')
const frame = require(B + '/frame.js')

let pass = 0
let fail = 0
const ok = (name, cond, extra = '') => {
  cond ? pass++ : fail++
  console.log((cond ? 'PASS ' : 'FAIL ') + name.padEnd(74) + extra)
}
const near = (name, got, want, tol, src = '') => ok(name, Math.abs(got - want) <= tol, `got ${Math.round(got * 1000) / 1000}  want ${Math.round(want * 1000) / 1000} (+/-${tol})  ${src}`)
const base = (areas, state, city, extra = {}) => ({ floorAreasSqft: areas, state, city, site: 'flat', ...extra })
const run = (input) => {
  const r = runQuantityModel(input)
  if (!r.ok) throw new Error(r.error)
  return r
}
const M2 = 0.09290304

console.log('--- IS 875 (Part 3) building blocks')
near('k2 at 10 m, category 2', wind.k2At(10), 1.0, 1e-9, 'Table 2')
near('k2 at 15 m, category 2', wind.k2At(15), 1.05, 1e-9, 'Table 2')
near('k2 at 20 m, category 2', wind.k2At(20), 1.07, 1e-9, 'Table 2')
near('k2 at 25 m, category 2 (linear between 20 and 30 m)', wind.k2At(25), 1.095, 1e-9, 'Table 2 note 2')
near('k2 at 30 m, category 3', wind.k2At(30, 3), 1.06, 1e-9, 'Table 2')
near('k2 below 10 m is constant', wind.k2At(4), 1.0, 1e-9, 'Table 2 note')
near('pz = 0.6 Vz^2 at Vb 44, 10 m (kN/m2)', wind.windPressure(44, 10), (0.6 * 44 * 44) / 1000, 1e-9, 'cl 5.4')
near('net coefficient h/w 0.67, l/w 1.3', wind.netPressureCoeff(6, 11, 8.5), 0.95, 1e-9, 'Table 4 (reconstructed)')
near('net coefficient h/w 2, l/w 3', wind.netPressureCoeff(20, 30, 10), 1.1, 1e-9, 'Table 4 (reconstructed)')
ok('Pune is a city value of 39 m/s', wind.basicWindSpeed('Maharashtra', 'Pune').vb === 39 && wind.basicWindSpeed('Maharashtra', 'Pune').basis === 'city')
ok('Bengaluru spelling and old name both give 33', wind.basicWindSpeed('Karnataka', 'Bengaluru').vb === 33 && wind.basicWindSpeed('Karnataka', 'Bangalore').vb === 33)
ok('Gurugram counts as Delhi (47)', wind.basicWindSpeed('Haryana', 'Gurugram').vb === 47)
ok('a town not in the table takes the state value, flagged as state', (() => { const w = wind.basicWindSpeed('Maharashtra', 'Nashik'); return w.vb === 44 && w.basis === 'state' })())
ok('an unknown state takes the highest zone speed 50', wind.basicWindSpeed('Atlantis', 'Nowhere').vb === 50)

console.log('--- wind base shear against an independent hand calculation (Pune G+1, 2 x 1000 sq ft)')
{
  const r = run(base([1000, 1000], 'Maharashtra', 'Pune'))
  // levels at 3.45 m and 6.45 m; tributary 3.225 m and 1.5 + 1.0 m (parapet) = 2.5 m; k2 = 1 below 10 m; Ct 0.95
  const L = r.layout.lengthM
  const W = r.layout.widthM
  const p = ((0.6 * 39 * 39) / 1000) * 0.95
  near('wind base shear along x (kN)', r.wind.windBaseKN.x, p * W * (3.225 + 2.5), 0.3, 'face width = building width')
  near('wind base shear along y (kN)', r.wind.windBaseKN.y, p * L * (3.225 + 2.5), 0.3, 'face width = building length')
  ok('earthquake governs a Zone III two-storey house', r.wind.governs.x === 'earthquake' && r.wind.governs.y === 'earthquake')
  near('used base shear equals the earthquake base shear when it governs', r.wind.usedBaseKN.x, r.wind.quakeBaseKN.x, 1e-6)
}

console.log('--- the larger of wind and earthquake, never the sum (lateralAnalysis called directly)')
{
  const plan = planMod.buildPlan([186, 186], 1.3, 3, 0.45)
  const mk = (vb, stilt) => ({ plan, zone: 'III', seismic: true, tSlab: 150, bBeam: 230, wallT: 0.23, wallGamma: 18.85, terraceLL: 1.5, fck: 20, stilt, windVb: vb, terrain: 2, balcony: null })
  const w = { W: [1500, 1200], total: 2700 }
  const calm = frame.lateralAnalysis(mk(0, false), w)
  const gale = frame.lateralAnalysis(mk(70, false), w)
  ok('no wind: design shear = earthquake shear in both storeys', calm.storeyShear.x.every((v, k) => Math.abs(v - calm.quakeStoreyShear.x[k]) < 1e-9))
  ok('Vb 70: design shear = wind shear (larger) in both storeys', gale.storeyShear.x.every((v, k) => Math.abs(v - gale.wind.x[k]) < 1e-9))
  ok('the shear used is never above the larger of the two', gale.storeyShear.y.every((v, k) => v <= Math.max(gale.quakeStoreyShear.y[k], gale.wind.y[k]) + 1e-9))
  ok('a stronger wind raises the column moment', gale.colM('x', 0, 0, 0) > calm.colM('x', 0, 0, 0))
  const st = frame.lateralAnalysis(mk(0, true), w)
  near('open storey: storey-0 earthquake shear is x 2.5', st.storeyShear.x[0] / calm.storeyShear.x[0], 2.5, 1e-9, 'IS 1893:2002 cl 7.10.3(a)')
  near('open storey: the storey above is unchanged', st.storeyShear.x[1] / calm.storeyShear.x[1], 1.0, 1e-9)
  near('open storey: the base shear reported is still the plain earthquake base shear', st.baseShear.x, calm.baseShear.x, 1e-9)
}

console.log('--- open parking level (stilt)')
{
  const plain = run(base([1000, 1000, 1000], 'Maharashtra', 'Pune'))
  const s = run(base([1000, 1000], 'Maharashtra', 'Pune', { stilt: true }))
  const g1 = run(base([1000, 1000], 'Maharashtra', 'Pune'))
  ok('floors listed stay 2, storeys of the frame become 3', s.inputEcho.floors === 2 && s.inputEcho.storeys === 3 && s.inputEcho.stilt === true)
  near('built-up area counts only the two floors above', s.inputEcho.totalBuiltUpM2, 2000 * M2, 0.01)
  near('roofed area includes the open level', s.inputEcho.roofedAreaM2, 3000 * M2, 0.01)
  ok('amplification 2.5 is reported', s.stilt && s.stilt.amplification === 2.5)
  near('used storey-0 shear = 2.5 x the plain earthquake base shear', s.wind.usedBaseKN.x / s.wind.quakeBaseKN.x, 2.5, 0.01)
  ok('every column of the open storey is at least 300 mm in both sides', s.schedules.columns.filter((c) => c.storey === 0).every((c) => Math.min(c.bMm, c.dMm) >= 300))
  ok('open-storey ties are confining ties over the full height (Zone III)', s.schedules.columns.filter((c) => c.storey === 0).every((c) => /full height/.test(c.ties)))
  ok('the storeys above keep the ordinary 2-zone tie spacing', s.schedules.columns.filter((c) => c.storey > 0).every((c) => !/full height/.test(c.ties)))
  ok('more steel and concrete than the same house without the open level', s.totals.steelNetKg > g1.totals.steelNetKg && s.totals.concreteM3 > g1.totals.concreteM3)
  const ratio = s.totals.steelBuyKg / plain.totals.steelBuyKg
  ok('steel is within 0% to +35% of an ordinary three-storey frame', ratio > 1.0 && ratio < 1.35, `ratio ${ratio.toFixed(3)}`)
  const lin = (r) => r.secondary.find((i) => i.key === 'lintels').count
  ok('no windows or doors at the open level: fewer lintels than a three-storey house', lin(s) < lin(plain), `${lin(s)} vs ${lin(plain)}`)
  ok('a warning tells the owner an engineer must analyse the open level', s.warnings.some((w) => /Open parking level/.test(w)))
  const z2 = run(base([1000, 1000], 'Karnataka', 'Bengaluru', { stilt: true }))
  ok('Zone II stilt: no full-height confinement (ordinary detailing) but still 300 mm columns', z2.schedules.columns.every((c) => !/full height/.test(c.ties)) && z2.schedules.columns.filter((c) => c.storey === 0).every((c) => Math.min(c.bMm, c.dMm) >= 300))
  const wl = run(base([1000, 1000], 'Maharashtra', 'Pune', { stilt: true }))
  ok('open level catches only half a storey of wind (less than a walled three-storey house)', wl.wind.windBaseKN.x < plain.wind.windBaseKN.x)
}

console.log('--- balconies')
{
  const none = run(base([1000, 1000, 1000], 'Maharashtra', 'Pune'))
  const b = run(base([1000, 1000, 1000], 'Maharashtra', 'Pune', { balconies: 2 }))
  const bc = b.balcony
  ok('2 per floor on a G+2 house = 4 balconies on 2 floors (not the roof)', bc.count === 4 && bc.floorsWith === 2 && bc.perFloor === 2)
  near('slab thickness at 1.2 m: d = 1200 / (7 x 1.2) + 25 cover, up to 25 mm', bc.thicknessMm, Math.ceil((1200 / 8.4 + 25) / 25) * 25, 0, 'IS 456 cl 23.2.1')
  for (const [lc, t] of [[1.0, 150], [1.5, 225]]) ok(`thickness at ${lc} m is ${t} mm`, run(base([1000, 1000], 'Maharashtra', 'Pune', { balconies: 1, balconyDepthM: lc })).balcony.thicknessMm === t)
  near('concrete = count x 3.6 m x projection x thickness (m3)', bc.concreteM3, 4 * 3.6 * 1.2 * 0.175, 1e-6)
  // hand moment, per metre: slab 25 x 0.175 + finish 1.5 + plaster 0.25 = 6.125; imposed 3.0; parapet 0.115 x 18.85 + 0.032 x 20.4 = 2.821 kN/m at the tip; railing push 0.35 x 1.0
  const MuK = ((6.125 + 3.0) * 1.2 * 1.2) / 2 + 2.821 * 1.2 + 0.35
  const Mu = 1.5 * MuK
  const d = 175 - 25
  const k = (4.6 * Mu * 1e6) / (20 * 1000 * d * d)
  const ast = ((0.5 * 20) / 500) * (1 - Math.sqrt(1 - k)) * 1000 * d
  const minAst = 0.0012 * 1000 * 175
  ok('hand Ast for the root moment is above the 0.12 % minimum and gives 8 mm @ 150', Math.max(ast, minAst) > minAst && Math.floor((50.27 * 1000) / Math.max(ast, minAst) / 25) * 25 >= 150 && /^8 mm @ 150/.test(bc.mainBars), `Ast ${ast.toFixed(0)} mm2/m, min ${minAst}`)
  near('top bars run back at least the projection (m)', bc.backSpanM, 1.2, 1e-9, 'max(Ld, projection)')
  // hand steel: 8 mm bar of 1200 - 25 + 230 + 1200 + (175 - 40) = 2740 -> 2750 mm, 24 bars each; 6 mm @ 125 x 21 bars of 3550 mm
  const kg = 4 * (24 * 2.75 * (64 / 162.2) + 21 * 3.55 * (36 / 162.2))
  near('balcony steel by hand (kg)', bc.steelKg, kg, 0.5, '8 mm main + 6 mm distribution')
  ok('distribution bars are 6 mm (a coil)', /^6 mm/.test(bc.distributionBars))
  ok('members.balconies agrees with the balcony result', b.members.balconies && Math.abs(b.members.balconies.concreteM3 - bc.concreteM3) < 1e-9 && Math.abs(b.members.balconies.steelKg - bc.steelKg) < 1e-6)
  ok('no balconies key in members when there are none', !('balconies' in none.members))
  ok('the 3D model gets one cantilever slab per balcony, all outside the footprint', (() => {
    const bs = b.geometry.slabs.filter((s) => s.balcony)
    return bs.length === 4 && bs.every((s) => s.y1 <= 1e-9 || s.y0 >= b.layout.widthM - 1e-9)
  })())
  ok('steel and concrete rise with each extra balcony', [0, 1, 2, 3, 4].map((n) => run(base([1000, 1000, 1000], 'Maharashtra', 'Pune', { balconies: n }))).every((r, i, a) => i === 0 || (r.totals.steelNetKg > a[i - 1].totals.steelNetKg && r.totals.concreteM3 > a[i - 1].totals.concreteM3)))
  ok('steel and concrete rise with the projection', [1.0, 1.2, 1.5].map((lc) => run(base([1000, 1000, 1000], 'Maharashtra', 'Pune', { balconies: 2, balconyDepthM: lc }))).every((r, i, a) => i === 0 || (r.totals.steelNetKg > a[i - 1].totals.steelNetKg && r.totals.concreteM3 > a[i - 1].totals.concreteM3)))
  ok('balcony weight and load reach the columns (base load is higher)', b.diagnostics.baseServiceLoadKN > none.diagnostics.baseServiceLoadKN)
  const g0 = run(base([1000], 'Maharashtra', 'Pune', { balconies: 2 }))
  ok('a single-storey house has no upper floor: no balconies, with a warning', !g0.balcony && g0.warnings.some((w) => /no upper floor/.test(w)))
  const sb = run(base([1000, 1000], 'Maharashtra', 'Pune', { stilt: true, balconies: 2 }))
  ok('stilt + balconies together: 2 floors above the open level carry balconies', sb.balcony.floorsWith === 2 && sb.balcony.count === 4)
  const many = run(base([700, 700], 'Maharashtra', 'Pune', { balconies: 4 }))
  ok('more balconies than bays fit: only the bays available are used, with a warning', many.balcony.perFloor <= many.layout.baysX * 2 && (many.balcony.count === 4 || many.warnings.some((w) => /fewer bays/.test(w))))
}

console.log('--- 6 mm coil bars')
{
  const z2 = run(base([1000, 1000], 'Karnataka', 'Bengaluru'))
  const z3 = run(base([1000, 1000], 'Maharashtra', 'Pune'))
  ok('Zone II: every column tie is 6 mm', z2.schedules.columns.every((c) => /^6 @/.test(c.ties)), z2.schedules.columns.map((c) => c.ties).join(' | '))
  ok('Zone II: every beam stirrup is 6 mm', z2.schedules.beams.every((b) => /stirrups 6 @/.test(b.note)))
  ok('Zone III: ties and stirrups stay at 8 mm or more (IS 13920)', z3.schedules.columns.every((c) => /^(8|10|12) @/.test(c.ties)) && z3.schedules.beams.every((b) => /stirrups (8|10|12) @/.test(b.note)))
  const kg6 = (r) => (r.steelByDiameter.find((s) => s.phi === 6) || { kg: 0 }).kg
  ok('6 mm steel exists in both (lintels, sunshades, parapet band) but is far larger in Zone II', kg6(z3) > 0 && kg6(z2) > 2 * kg6(z3), `${Math.round(kg6(z2))} vs ${Math.round(kg6(z3))} kg`)
  const zb = run(base([1000, 1000], 'Karnataka', 'Bengaluru', { balconies: 1 }))
  ok('Zone II balconies keep the 8 mm main bar and a 6 mm distribution bar', /^8 mm/.test(zb.balcony.mainBars) && /^6 mm/.test(zb.balcony.distributionBars))
}

console.log('--- inputs, payloads and invariants')
{
  const e1 = runQuantityModel(base([1000, 1000], 'Maharashtra', 'Pune', { balconies: 5 }))
  const e2 = runQuantityModel(base([1000, 1000], 'Maharashtra', 'Pune', { balconies: 1, balconyDepthM: 1.3 }))
  ok('5 balconies per floor is refused', e1.ok === false && /between 0 and 4/.test(e1.error))
  ok('a 1.3 m projection is refused', e2.ok === false && /1\.0, 1\.2 or 1\.5/.test(e2.error))
  const a = run(base([1000, 1000], 'Maharashtra', 'Pune'))
  const b = run(base([1000, 1000], 'Maharashtra', 'Pune', { stilt: false, balconies: 0 }))
  ok('stilt false and 0 balconies give exactly the plain result', JSON.stringify(a.totals) === JSON.stringify(b.totals) && JSON.stringify(a.materials) === JSON.stringify(b.materials))
  for (const [name, input] of [
    ['plain', base([1000, 1000], 'Maharashtra', 'Pune')],
    ['stilt + balconies', base([1200, 1000, 900], 'Delhi', 'Delhi', { stilt: true, balconies: 3, balconyDepthM: 1.5 })],
    ['Zone V stilt', base([800, 800], 'Assam', 'Guwahati', { stilt: true })],
    ['tall, windy, Zone II', base([900, 900, 900, 900, 900, 900], 'Andhra Pradesh', 'Visakhapatnam', { balconies: 2 })],
  ]) {
    const r = run(input)
    const memC = Object.entries(r.members).filter(([k]) => k !== 'pcc').reduce((s, [, v]) => s + v.concreteM3, 0)
    const memS = Object.values(r.members).reduce((s, v) => s + v.steelKg, 0)
    near(`${name}: member concrete adds to the total`, memC, r.totals.concreteM3, 0.01)
    near(`${name}: member steel adds to the total`, memS, r.totals.steelNetKg, 0.5)
    near(`${name}: steel by diameter adds to the buy total`, r.steelByDiameter.reduce((s, x) => s + x.kg, 0), r.totals.steelBuyKg, 0.5)
    ok(`${name}: steel per roofed m2 is in a sane band (20 to 60)`, r.perM2.steelKgPerM2 > 20 && r.perM2.steelKgPerM2 < 60, r.perM2.steelKgPerM2.toFixed(1))
  }
  const sb = run(base([1000, 1000], 'Maharashtra', 'Pune', { stilt: true, balconies: 2 }))
  const free = toFree(sb)
  const txt = JSON.stringify(free)
  ok('free payload carries the wind, stilt and balcony checks', ['wind', 'stilt', 'balcony'].every((id) => free.compliance.some((c) => c.id === id)))
  ok('free payload shows no quantity and no member size', !/"(totals|materials|members|schedules|steelByDiameter)"/.test(txt) && !/\d+ mm @ \d+/.test(txt) && !/\bkg\b/.test(txt.replace(/kg\/m/g, '')))
  ok('free payload reports floors, storeys, stilt and balconies', free.floors === 2 && free.storeys === 3 && free.stilt === true && free.balconies === 4)
  ok('3D preview counts the open level as a storey', free.preview.floors === 3)
  const paid = toPaid(sb)
  ok('paid payload carries wind, stilt and balcony results and no diagnostics', paid.wind && paid.stilt && paid.balcony && !('diagnostics' in paid))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)

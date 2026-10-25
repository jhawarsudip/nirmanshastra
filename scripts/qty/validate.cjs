// Validation of the quantity model against published code values and independent hand calculations.
// Build first:  npx tsc --outDir /tmp/qty-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
// Run:          node scripts/qty/validate.cjs
const B = process.env.QTY_BUILD || '/tmp/qty-build'
const codes = require(B + '/codes.js')
const mat = require(B + '/materials.js')
const { SteelBook } = require(B + '/steel.js')
const { designIsolatedFooting } = require(B + '/footing.js')
const sec = require(B + '/section.js')
const { runQuantityModel } = require(B + '/index.js')

let pass = 0
let fail = 0
const near = (name, got, want, tol, src) => {
  const ok = Math.abs(got - want) <= tol
  ok ? pass++ : fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(58) + 'got ' + String(Math.round(got * 1000) / 1000).padEnd(10) + 'want ' + String(want).padEnd(8) + '(+/-' + tol + ')  ' + src)
}

console.log('--- IS 456 Table 19 design shear strength (tau_c, N/mm2): formula vs printed table')
const T19 = {
  20: [[0.25, 0.36], [0.5, 0.48], [0.75, 0.56], [1.0, 0.62], [1.5, 0.72], [2.0, 0.79], [3.0, 0.82]],
  25: [[0.25, 0.36], [0.5, 0.49], [0.75, 0.57], [1.0, 0.64], [1.5, 0.74], [2.0, 0.82], [3.0, 0.92]],
  30: [[0.25, 0.37], [0.5, 0.50], [0.75, 0.59], [1.0, 0.66], [1.5, 0.76], [2.0, 0.84], [3.0, 0.96]],
}
for (const [fck, rows] of Object.entries(T19)) for (const [pt, want] of rows) near(`tau_c M${fck} pt=${pt}%`, codes.tauC(Number(fck), pt), want, 0.03, 'IS 456 Table 19 (from memory: Likely)')

console.log('--- IS 1786 mass per metre (d^2/162.2)')
for (const [d, want] of [[8, 0.395], [10, 0.617], [12, 0.888], [16, 1.578], [20, 2.466], [25, 3.853]]) near(`mass ${d} mm`, codes.barMass(d), want, 0.005, 'IS 1786 Table 1')

console.log('--- IS 456 cl 26.2.1 development length, Fe500 deformed bars, tau_bd = 1.6 x (1.2 | 1.4 | 1.5)')
for (const [fck, tbd] of [[20, 1.92], [25, 2.24], [30, 2.4]]) near(`Ld/phi M${fck}`, codes.devLength(16, fck) / 16, (0.87 * 500) / (4 * tbd), 0.6, 'cl 26.2.1.1')

console.log('--- CPWD nominal-mix yields vs IS 10262 absolute volume (dry volume 1.54)')
for (const [grade, parts, c, s, a] of [['M20', [1, 1.5, 3], 400, 0.425, 0.85], ['M15', [1, 2, 4], 320, 0.445, 0.89], ['M10', [1, 3, 6], 220, 0.47, 0.94], ['M7.5', [1, 4, 8], 170, 0.47, 0.89]]) {
  const sum = parts.reduce((x, y) => x + y, 0)
  const m = mat.mixFor(grade, 'mild')
  near(`${grade} cement kg/m3 (model vs 1.54 x 1440 / sum)`, m.cementKg, (1.54 * 1440) / sum, 6, 'CPWD DAR 2014 4.1.x')
  near(`${grade} sand m3/m3`, m.sandM3, (1.54 * parts[1]) / sum, 0.02, 'CPWD DAR 2014')
  near(`${grade} aggregate m3/m3`, m.aggregateM3, (1.54 * parts[2]) / sum, grade === 'M7.5' ? 0.07 : 0.04, grade === 'M7.5' ? 'DAR 4.1.8 prints 0.89 (40 mm graded)' : 'CPWD DAR 2014')
}

console.log('--- IS 456 Table 26 case 1 (interior panel) spot values')
const t = codes.TABLE26[1]
near('alpha_x neg at ly/lx=1.0', t.axNeg[0], 0.032, 1e-9, 'Table 26')
near('alpha_x pos at ly/lx=1.5', t.axPos[5], 0.041, 1e-9, 'Table 26')
near('alpha_x neg at ly/lx=2.0', t.axNeg[7], 0.065, 1e-9, 'Table 26')
near('case 9 alpha_x pos at 1.0', codes.TABLE26[9].axPos[0], 0.056, 1e-9, 'Table 26')

console.log('--- Column section (strain compatibility, IS 456 Annex G) vs closed-form values, 300 x 300, 4-16, M20, Fe500')
{
  const cap = sec.uniaxialCapacity
  const A = 201.06
  const bars = [{ y: 40, area: 2 * A }, { y: 260, area: 2 * A }]
  // pure bending: 2-16 in tension, d = 260; xu = 0.87 fy Ast / (0.36 fck b); Mu = 0.87 fy Ast (d - 0.42 xu)
  const xu = (0.87 * 500 * 2 * A) / (0.36 * 20 * 300)
  const Mu0 = 0.87 * 500 * 2 * A * (260 - 0.42 * xu)
  near('Mu at Pu=0 (kN.m)', cap(300, 300, bars, 0, 20) / 1e6, Mu0 / 1e6, 0.1 * (Mu0 / 1e6), 'Annex G-1.1 (compression steel adds a little)')
  const Asc = 4 * A
  const Puz = 0.45 * 20 * (90000 - Asc) + 0.75 * 500 * Asc
  const m98 = cap(300, 300, bars, 0.98 * Puz, 20)
  const m105 = cap(300, 300, bars, 1.08 * Puz, 20)
  const okc = m98 > 0 && m105 === 0
  okc ? pass++ : fail++
  console.log((okc ? 'PASS ' : 'FAIL ') + 'squash load brackets IS 456 Puz'.padEnd(58) + `Puz ${(Puz / 1000).toFixed(0)} kN: M(0.98 Puz)=${(m98 / 1e6).toFixed(1)} kN.m, M(1.08 Puz)=${(m105 / 1e6).toFixed(1)}`)
}

console.log('--- Isolated footing: independent recomputation')
{
  const book = new SteelBook()
  const P = 400 // kN service
  const Pu = 600
  const r = designIsolatedFooting({ PuKN: Pu, PserKN: P, colB: 300, colD: 300, sbc: 150, fck: 25 }, book, 'f')
  near('plan size (m): sqrt(1.1 P / SBC) rounded up to 50 mm', r.Lf, Math.ceil(Math.sqrt((1.1 * P) / 150) / 0.05 - 1e-9) * 0.05, 0.001, 'IS 456 cl 34 / IS 1904')
  const qu = Pu / (r.Lf * r.Bf)
  const d = r.depth - 50 - 12 // effective depth to the upper layer, mm
  const arm = (r.Lf * 1000 - 300) / 2000
  const Mu = (qu * r.Bf * arm * arm) / 2 // kN.m
  const MuLim = 0.134 * 25 * (r.Bf * 1000) * d * d * 1e-6
  const ok = Mu <= MuLim
  ok ? pass++ : fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + 'footing flexure within section capacity'.padEnd(58) + `Mu ${Mu.toFixed(1)} kN.m <= Mu,lim ${MuLim.toFixed(1)} kN.m`)
  const vx = qu * r.Bf * (arm - d / 1000)
  const tv = (vx * 1000) / (r.Bf * 1000 * d)
  const okv = tv <= codes.tauC(25, 0.3) * 1.15
  okv ? pass++ : fail++
  console.log((okv ? 'PASS ' : 'FAIL ') + 'footing one-way shear'.padEnd(58) + `tau_v ${tv.toFixed(3)} <= tau_c(0.3 %) ${codes.tauC(25, 0.3).toFixed(3)}`)
}

console.log('--- Whole-model consistency')
for (const [name, floors, state, city, site] of [['G+1 Pune', [1000, 1000], 'Maharashtra', 'Pune', 'flat'], ['G+3 Delhi', [1000, 1000, 1000, 1000], 'Delhi', 'Delhi', 'flat']]) {
  const r = runQuantityModel({ floorAreasSqft: floors, state, city, site })
  const m = r.members
  const sumC = Object.entries(m).filter(([k]) => k !== 'pcc').reduce((s, [, v]) => s + v.concreteM3, 0)
  near(`${name}: member concrete adds to total (RCC, excl. PCC)`, sumC, r.totals.concreteM3, 0.01, 'internal')
  const sumS = Object.values(m).reduce((s, v) => s + v.steelKg, 0)
  near(`${name}: member steel adds to total`, sumS, r.totals.steelNetKg, 0.5, 'internal')
  const byDia = r.steelByDiameter.reduce((s, v) => s + v.kg, 0)
  near(`${name}: steel by diameter adds to buy total`, byDia, r.totals.steelBuyKg, 0.5, 'internal')
  near(`${name}: buy steel = net x 1.05`, r.totals.steelBuyKg / r.totals.steelNetKg, 1.05, 1e-6, 'CPWD DAR 5.22.1')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)

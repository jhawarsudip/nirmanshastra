// Old thumb-rule engine (app/tools/structopro/structopro-engine.ts, LOCKED) against the new code-based quantity model, case by case.
// Build old engine:  npx tsc --outDir /tmp/old-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict app/tools/structopro/structopro-engine.ts
// Build new model:   npx tsc --outDir /tmp/qty-build --module commonjs --target es2020 --moduleResolution node --skipLibCheck --strict lib/structopro-qty/*.ts
const { runCalculation } = require(process.env.OLD_BUILD || '/tmp/old-build/structopro-engine.js')
const { runQuantityModel } = require(process.env.QTY_BUILD || '/tmp/qty-build/index.js')
const cases = [
  ['G+0 1000 Pune', [1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 2x1000 Pune', [1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+1 2x1500 Pune', [1500, 1500], 'Maharashtra', 'Pune', 'flat'],
  ['G+2 3x1000 Pune', [1000, 1000, 1000], 'Maharashtra', 'Pune', 'flat'],
  ['G+3 4x1000 Delhi', [1000, 1000, 1000, 1000], 'Delhi', 'Delhi', 'flat'],
  ['G+3 4x1000 Bengaluru', [1000, 1000, 1000, 1000], 'Karnataka', 'Bengaluru', 'flat'],
]
const f0 = (v) => Math.round(v).toLocaleString('en-IN')
const pct = (n, o) => ((n / o - 1) * 100).toFixed(0).padStart(5) + ' %'
console.log('Old = thumb rules (whole-house scale: 4 kg steel, 0.4 bag cement, 1.35 cft aggregate, 1.8 cft sand per sq ft). New = RCC structure only, designed to IS 456 / 1893 / 13920.')
for (const [name, floors, state, city, site] of cases) {
  const o = runCalculation({ state, city, numFloors: floors.length - 1, groundFloorAreaSqft: floors[0], perFloorAreas: floors, siteCondition: site, concreteGrade: 'M25', steelGrade: 'Fe500D' })
  const n = runQuantityModel({ floorAreasSqft: floors, state, city, site })
  const A = floors.reduce((s, v) => s + v, 0)
  console.log(`\n${name}  (${f0(A)} sq ft, zone old ${o.seismicZone} / new ${n.inputEcho.zone}, grade ${n.inputEcho.gradeAbove}/${n.inputEcho.gradeBelow})`)
  console.log('  item                 old            new            new vs old    new per sq ft   old per sq ft')
  const rows = [
    ['steel kg', o.quantities.steelKg, n.materials.steelBuyKg],
    ['cement bags', o.quantities.cementBags, n.materials.cementBags],
    ['aggregate cft', o.quantities.aggregateCft, n.materials.aggregateCft],
    ['sand cft', o.quantities.sandCft, n.materials.sandCft],
    ['formwork sq ft', o.quantities.formworkSqft, n.materials.formworkSqft],
    ['binding wire kg', o.quantities.bindingWireKg, n.materials.bindingWireKg],
  ]
  for (const [label, ov, nv] of rows) console.log('  ' + label.padEnd(18) + f0(ov).padStart(10) + f0(nv).padStart(15) + pct(nv, ov).padStart(15) + (nv / A).toFixed(2).padStart(15) + (ov / A).toFixed(2).padStart(15))
}

/*
  Does the "how far do the drips reach" table in styles/v2/pour.css still match the drip tiles?
  Each join's tile (public/v2/texture/pour-N.webp) has a longest drip; pour.css pads the section under the join by that reach plus a gap, so ordinary
  text starts below the drips (SJ, 29 Oct 2026). If a tile is redrawn, or a join gets another tile, this fails until the table is updated.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-pour-reach.ts
  (How far text is really below the drips, on screen, is checked by scripts/check-drip-clearance.py.)
*/

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

let failed = 0
const check = (name: string, cond: boolean, extra = '') => { if (cond) console.log('ok    ' + name); else { failed++; console.error('FAIL  ' + name + (extra ? '  ' + extra : '')) } }
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const css = read('styles/v2/pour.css')
const CREEP = 1.05      // pour.css: ns-ooze stretches a join by up to 5%
const MELT = 0.118      // pour.css: --jr, the share of the tile that melts into its own section

async function tip(file: string): Promise<number> {
  const { data, info } = await sharp(path.join(process.cwd(), 'public/v2/texture', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let lowest = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * info.channels + 3] >= 24) { lowest = y; break }
  }
  return (lowest + 1) / info.height
}

async function main() {
  // which joins are used, and with which tile
  const used = new Map<number, string>()
  for (const dir of ['components/v2/sections', 'components/v2']) {
    for (const f of fs.readdirSync(path.join(process.cwd(), dir))) {
      if (!f.endsWith('.tsx')) continue
      const src = read(`${dir}/${f}`)
      for (const m of src.matchAll(/<Pour\b[^>]*\bv=\{(\d+)\}[^>]*\/>/g)) if (!/kind="lip"/.test(m[0])) used.set(Number(m[1]), f)
    }
  }
  check('twelve joins are used on the home page (ten between sections, two phone-only)', used.size === 12, `found ${used.size}`)

  for (const [v, file] of [...used].sort((a, b) => a[0] - b[0])) {
    const t = await tip(`pour-${v}.webp`)
    const want = t * CREEP - MELT
    const m = css.match(new RegExp(`--ns-reach-${v}:\\s*calc\\(var\\(--ns-pour-h\\)\\s*\\*\\s*([0-9.]+)\\s*\\+\\s*8px\\)`))
    if (v === 10) { check(`join 10 (${file}) hangs over the footer, which paints on top of it: no table entry needed`, true); continue }
    check(`join ${v} (${file}): the table has an entry`, !!m)
    if (!m) continue
    const have = Number(m[1])
    check(`join ${v} (${file}): table ${have} is not shorter than the tile's ${want.toFixed(3)} (longest drip ${(t * 100).toFixed(1)}% of the tile)`, have >= want - 0.002)
    check(`join ${v} (${file}): table ${have} is not much longer than needed (extra blank space under a short drip)`, have <= want + 0.02)
  }

  check('the gap and the 8px shadow allowance are in the file', /--ns-join-gap:\s*16px/.test(css) && /\+ 8px\)/.test(css))
  const assigned = [...css.matchAll(/--ns-join:\s*calc\(var\(--ns-reach-(\d+)\)/g)].map(m => Number(m[1]))
  for (const v of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]) check(`join ${v} is assigned to the section under it`, assigned.includes(v))

  if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
  console.log('\nAll drip-reach checks passed')
}
main()

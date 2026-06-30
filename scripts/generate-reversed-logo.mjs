// Generates public/logo-mark-reversed.png from public/logo-mark-source.png:
//   - Preserves existing alpha channel (background is already transparent in source)
//   - Gold-hued pixels (warm yellow, b << r) → left unchanged
//   - All other pixels → recolored to #F4F4F0 (Sheet White), alpha preserved
// Run: node scripts/generate-reversed-logo.mjs

import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC  = path.resolve(__dirname, '../public/logo-mark-source.png')
const DEST = path.resolve(__dirname, '../public/logo-mark-reversed.png')

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width, height } = info
const out = Buffer.alloc(width * height * 4)

for (let i = 0; i < width * height; i++) {
  const srcIdx = i * 4
  const r = data[srcIdx]
  const g = data[srcIdx + 1]
  const b = data[srcIdx + 2]
  const a = data[srcIdx + 3]

  const outIdx = i * 4
  out[outIdx + 3] = a  // preserve alpha in all cases

  // Gold: warm-hued pixel where blue is substantially lower than red/green average
  const rg_avg = (r + g) / 2
  const isGold = a > 20 && r > 120 && (rg_avg - b) > 60 && b < rg_avg * 0.7

  if (isGold) {
    out[outIdx]     = r
    out[outIdx + 1] = g
    out[outIdx + 2] = b
  } else {
    // Recolor to Sheet White #F4F4F0
    out[outIdx]     = 244
    out[outIdx + 1] = 244
    out[outIdx + 2] = 240
  }
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(DEST)

console.log(`Written: ${DEST}  (${width}×${height})`)

// One-off script: trim logo-mark-source.png and regenerate PWA icons + favicon
// Run with: node scripts/gen-icons.cjs

'use strict'
const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const root = path.join(__dirname, '..')
const src  = path.join(root, 'public', 'logo-mark-source.png')

function createIco(pngBuffer) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)   // reserved
  header.writeUInt16LE(1, 2)   // type = 1 (icon)
  header.writeUInt16LE(1, 4)   // image count = 1

  const entry = Buffer.alloc(16)
  entry.writeUInt8(32, 0)                        // width
  entry.writeUInt8(32, 1)                        // height
  entry.writeUInt8(0, 2)                         // colorCount (0 = >256)
  entry.writeUInt8(0, 3)                         // reserved
  entry.writeUInt16LE(0, 4)                      // planes (0 for PNG)
  entry.writeUInt16LE(0, 6)                      // bitCount (0 for PNG)
  entry.writeUInt32LE(pngBuffer.length, 8)       // size of image data
  entry.writeUInt32LE(22, 12)                    // offset = 6 + 16

  return Buffer.concat([header, entry, pngBuffer])
}

async function main() {
  console.log('Reading source:', src)

  // Step 1: trim white margin
  const trimmed = await sharp(src)
    .trim({ threshold: 10, background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .toBuffer()

  console.log('Trimmed.')

  // Step 2: 192×192 PWA icon
  const out192 = path.join(root, 'public', 'icon-192.png')
  await sharp(trimmed)
    .resize(192, 192, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(out192)
  console.log('Written:', out192)

  // Step 3: 512×512 PWA icon
  const out512 = path.join(root, 'public', 'icon-512.png')
  await sharp(trimmed)
    .resize(512, 512, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(out512)
  console.log('Written:', out512)

  // Step 4: 32×32 favicon.ico — must be RGBA PNG for ICO container
  const fav32 = await sharp(trimmed)
    .resize(32, 32, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .png()
    .toBuffer()

  const icoPath = path.join(root, 'app', 'favicon.ico')
  fs.writeFileSync(icoPath, createIco(fav32))
  console.log('Written:', icoPath)

  console.log('All done.')
}

main().catch(err => { console.error(err); process.exit(1) })

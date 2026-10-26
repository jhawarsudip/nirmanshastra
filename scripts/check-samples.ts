/*
  Checks the free sample reports in /public/samples.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-samples.ts
  - every sample in the catalogue exists, is a PDF, and is in the manifest;
  - the headline figures in the manifest are what the engines give TODAY (so a sample can never show figures the tool no longer gives);
  - no other PDF sits in the folder, and nothing there is a customer's report.
  If a figure has moved, rebuild:   npx tsx --tsconfig tsconfig.json scripts/build-samples.ts
*/

import fs from 'node:fs'
import path from 'node:path'
import { SAMPLES, SAMPLE_KEYS, sampleHref, sampleKeyFor } from '../lib/samples/catalogue'
import { figuresOf } from './build-samples'

const DIR = path.join(process.cwd(), 'public', 'samples')
let failed = 0
const check = (name: string, cond: boolean, extra = '') => { if (cond) console.log('ok    ' + name); else { failed++; console.error('FAIL  ' + name + (extra ? '  ' + extra : '')) } }

const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8')) as { files: Record<string, { file: string; bytes: number; figures: Record<string, string> }> }

for (const key of SAMPLE_KEYS) {
  const def = SAMPLES[key]
  const file = path.join(DIR, def.file)
  const exists = fs.existsSync(file)
  check(`${key}: ${def.file} exists`, exists)
  if (exists) {
    const head = fs.readFileSync(file).subarray(0, 5).toString('latin1')
    check(`${key}: is a PDF`, head === '%PDF-')
    const size = fs.statSync(file).size
    check(`${key}: size is sensible (${(size / 1024).toFixed(0)} KB)`, size > 100_000 && size < 3_000_000)
    check(`${key}: manifest records this file and size`, manifest.files[key]?.file === def.file && manifest.files[key]?.bytes === size)
  }
  const now = figuresOf(key)
  const then = manifest.files[key]?.figures ?? {}
  check(`${key}: the sample still shows today's figures`, JSON.stringify(now) === JSON.stringify(then), `engine now ${JSON.stringify(now)} vs sample ${JSON.stringify(then)}`)
  check(`${key}: link is under /samples/`, sampleHref(key) === `/samples/${def.file}`)
}

const onDisk = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.pdf'))
check('no stray PDFs in /public/samples', onDisk.every(f => SAMPLE_KEYS.some(k => SAMPLES[k].file === f)), onDisk.join(', '))
check('the pack maps to the Grand Total sample', sampleKeyFor('completepack') === 'grandtotal')
check('vastupro has no paid sample', sampleKeyFor('vastupro') === null)

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
console.log('\nAll sample checks passed')

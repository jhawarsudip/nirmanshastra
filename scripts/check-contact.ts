/*
  Checks the contact details.
    - the three profile links are exactly the ones SJ gave, and the Organization JSON-LD lists them with an email contact point;
    - there is NO WhatsApp and NO phone number anywhere on the site (SJ, 29 Oct 2026): not in the code, the content, the messages,
      the structured data, llms.txt or the files in /public. The only allowed mention is a sentence about how building sites
      run in general (the site-documentation page), which is not contact information.
  Run:  npx tsx scripts/check-contact.ts
*/
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { CONTACT_EMAIL, SAME_AS, SOCIAL_LINKS } from '../lib/site-contact'
import { organizationSchema } from '../lib/seo/schema'

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ok  ' + name) }

ok('profile links are the ones given', () => {
  assert.equal(SOCIAL_LINKS.instagram, 'https://www.instagram.com/nirmanshastraindia/')
  assert.equal(SOCIAL_LINKS.youtube, 'https://www.youtube.com/@NirmanShastra')
  assert.equal(SOCIAL_LINKS.facebook, 'https://www.facebook.com/profile.php?id=61591652705059')
  assert.deepEqual(SAME_AS, [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube, SOCIAL_LINKS.facebook])
})

ok('Organization JSON-LD lists the profiles and an email contact point, and no telephone', () => {
  const org = organizationSchema() as { sameAs: string[]; contactPoint: { telephone?: string; email?: string; url?: string }[] }
  assert.deepEqual(org.sameAs, SAME_AS)
  assert.ok(org.contactPoint.length >= 1 && org.contactPoint.every(c => c.email && !c.telephone))
  assert.equal(org.contactPoint[0].email, CONTACT_EMAIL)
})

ok('no WhatsApp and no phone number anywhere in the site', () => {
  const ROOT = path.join(__dirname, '..')
  const SKIP = new Set(['node_modules', '.next', '.git', 'samples'])
  const pat = /whatsapp|wa\.me|8697620512|86976 ?20512|86976-20512/i
  // a sentence about how building sites run in general; it is not contact information
  const ALLOWED = new Set(['app/[locale]/site-templates/site-documentation/page.tsx'])
  const bad: string[] = []
  const walk = (d: string) => {
    for (const name of fs.readdirSync(d)) {
      if (SKIP.has(name)) continue
      const p = path.join(d, name)
      const st = fs.statSync(p)
      if (st.isDirectory()) { walk(p); continue }
      if (!/\.(ts|tsx|js|mjs|cjs|json|md|mdx|css|txt|html|webmanifest)$/.test(name)) continue
      const rel = path.relative(ROOT, p).split(path.sep).join('/')
      if (ALLOWED.has(rel) || rel === 'scripts/check-contact.ts') continue
      if (pat.test(fs.readFileSync(p, 'utf8'))) bad.push(rel)
    }
  }
  for (const d of ['app', 'components', 'lib', 'messages', 'content', 'public', 'styles']) { const p = path.join(ROOT, d); if (fs.existsSync(p)) walk(p) }
  assert.deepEqual(bad, [], 'WhatsApp or the number is still in: ' + bad.join(', '))
})

ok('the only allowed mention is the sentence about how sites run', () => {
  const s = fs.readFileSync(path.join(__dirname, '..', 'app/[locale]/site-templates/site-documentation/page.tsx'), 'utf8')
  const hits = s.match(/[^.]*whatsapp[^.]*/gi) ?? []
  assert.equal(hits.length, 1)
  assert.ok(/run on WhatsApp and recollection/.test(hits[0]))
  assert.ok(!/wa\.me|8697620512/.test(s))
})

console.log(`\n${n} contact checks passed`)

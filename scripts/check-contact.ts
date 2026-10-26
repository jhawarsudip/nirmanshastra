/*
  Checks the contact details: the three profile links and the WhatsApp number are exactly the ones SJ gave, every tool
  page has a name for the WhatsApp message that matches the registry, and the Organization JSON-LD lists the profiles
  and the WhatsApp number.
  Run:  npx tsx scripts/check-contact.ts
*/
import assert from 'node:assert/strict'
import { SAME_AS, SOCIAL_LINKS, WHATSAPP_DISPLAY, WHATSAPP_E164, WHATSAPP_NUMBER, WHATSAPP_PAGE_NAMES, whatsappMessageFor, whatsappUrl } from '../lib/site-contact'
import { TOOLS } from '../lib/seo/site'
import { organizationSchema } from '../lib/seo/schema'

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('  ok  ' + name) }

ok('profile links and number are the ones given', () => {
  assert.equal(SOCIAL_LINKS.instagram, 'https://www.instagram.com/nirmanshastraindia/')
  assert.equal(SOCIAL_LINKS.youtube, 'https://www.youtube.com/@NirmanShastra')
  assert.equal(SOCIAL_LINKS.facebook, 'https://www.facebook.com/profile.php?id=61591652705059')
  assert.equal(WHATSAPP_NUMBER, '918697620512')
  assert.equal(WHATSAPP_DISPLAY, '+91 86976 20512')
  assert.equal(WHATSAPP_E164, '+918697620512')
  assert.equal(whatsappUrl(), 'https://wa.me/918697620512')
})

ok('every tool page has a WhatsApp name equal to the registry name', () => {
  for (const t of TOOLS) {
    if (t.path === '/compare-quote') continue // gets the "check my contractor's quote" message
    assert.equal(WHATSAPP_PAGE_NAMES[t.path], t.name, t.path)
  }
  for (const p of Object.keys(WHATSAPP_PAGE_NAMES)) assert.ok(TOOLS.some(t => t.path === p), `stale name for ${p}`)
})

ok('the pre-filled message depends on the page', () => {
  assert.equal(whatsappMessageFor('/'), "Hi, I want to check my contractor's quote.")
  assert.equal(whatsappMessageFor('/compare-quote'), "Hi, I want to check my contractor's quote.")
  assert.equal(whatsappMessageFor('/tools/structopro'), 'Hi, I have a question about StructurePro.')
  assert.equal(whatsappMessageFor('/tools/structopro/'), 'Hi, I have a question about StructurePro.')
  assert.equal(whatsappMessageFor('/tools/brick-calculator'), 'Hi, I have a question about Brick Calculator.')
  assert.equal(whatsappMessageFor('/blog/anything'), 'Hi, I read one of your articles and have a question.')
  assert.equal(whatsappMessageFor('/contact'), 'Hi, I have a question about NirmanShastra.')
  assert.equal(whatsappMessageFor('/tools/constructor'), 'Hi, I have a question about NirmanShastra.')
  assert.equal(whatsappMessageFor('/tools/toString'), 'Hi, I have a question about NirmanShastra.')
  assert.ok(whatsappMessageFor('/hi').startsWith('नमस्ते'))
  assert.equal(whatsappUrl("Hi, I want to check my contractor's quote."), "https://wa.me/918697620512?text=Hi%2C%20I%20want%20to%20check%20my%20contractor's%20quote.")
})

ok('Organization JSON-LD lists the profiles and the WhatsApp contact point', () => {
  const org = organizationSchema() as { sameAs: string[]; contactPoint: { telephone?: string; email?: string; url?: string }[] }
  assert.deepEqual(org.sameAs, SAME_AS)
  assert.deepEqual(org.sameAs, [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube, SOCIAL_LINKS.facebook])
  const wa = org.contactPoint.find(c => c.telephone)!
  assert.equal(wa.telephone, '+918697620512')
  assert.equal(wa.url, 'https://wa.me/918697620512')
  assert.ok(org.contactPoint.some(c => c.email))
})

console.log(`\n${n} contact checks passed`)

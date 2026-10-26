/*
  Checks the refund promise, the testimonials switch and the report emails.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-policy.ts
*/

import fs from 'node:fs'
import path from 'node:path'
import { REFUND_DAYS, REFUND_PROCESSING, REFUND_PROCESSING_HI, REFUND_PROMISE_EN, REFUND_PROMISE_HI, REFUND_SHORT_EN, FEEDBACK_ASK } from '../lib/policy'
import { TESTIMONIALS, TESTIMONIALS_MIN, visibleTestimonials, isComplete, type Testimonial } from '../lib/testimonials'
import { buildTradeEmail } from '../lib/qty/email'
import { buildPackEmail } from '../lib/pack/email'
import { TRADE_META } from '../lib/qty/meta'
import { CONTACT_EMAIL } from '../lib/site-contact'
import { FAQ_CATEGORIES } from '../lib/faq-data'

let failed = 0
const check = (name: string, cond: boolean, extra = '') => { if (cond) console.log('ok    ' + name); else { failed++; console.error('FAIL  ' + name + (extra ? '  ' + extra : '')) } }
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

// ── the promise ──
check('promise says the number of days from the config', REFUND_PROMISE_EN.includes(`within ${REFUND_DAYS} days of purchase`) && REFUND_PROMISE_HI.includes(`${REFUND_DAYS} दिन`))
check('promise says the processing time from the config', REFUND_PROMISE_EN.includes(REFUND_PROCESSING) && REFUND_PROMISE_HI.includes(REFUND_PROCESSING_HI))
check('English and Hindi processing time carry the same numbers', REFUND_PROCESSING.match(/\d+–\d+/)?.[0] === REFUND_PROCESSING_HI.match(/\d+–\d+/)?.[0])
check('promise has the agreed wording', /if your report does not help you question at least one line of your contractor.s quote/.test(REFUND_PROMISE_EN) && REFUND_PROMISE_EN.includes('No forms, no argument.'))
check('short line carries the same days', REFUND_SHORT_EN.includes(`${REFUND_DAYS} days`))

// ── no page may still say delivered reports are not refundable ──
const terms = read('app/terms-of-use/page.tsx')
check('Terms: the old "not refundable" clause is gone', !/payment is not refundable|is not refundable/i.test(terms))
check('Terms: uses the promise from the config', terms.includes('REFUND_PROMISE_EN') && terms.includes('/refund-policy'))
const faq = FAQ_CATEGORIES.flatMap(c => c.items).find(i => /refund/i.test(i.question))
check('FAQ: the refund answer matches the promise', !!faq && faq.answer.includes(`${REFUND_DAYS} days`) && faq.answer.includes(REFUND_PROCESSING) && !/not refundable/i.test(faq.answer))

// ── pay buttons ──
for (const f of ['components/v2/qty/QtyResults.tsx', 'components/v2/qty/GrandTotal.tsx', 'components/v2/qty/CompletePack.tsx', 'app/tools/structopro/components/ResultsV2.tsx']) {
  check(`pay screen has the refund line and sample link: ${f}`, read(f).includes('<PayAssurance'))
}
for (const f of ['components/v2/qty/QtyToolPage.tsx', 'components/v2/qty/GrandTotal.tsx', 'components/v2/qty/CompletePack.tsx', 'app/tools/structopro/page.tsx', 'components/v2/sections/Pricing.tsx']) {
  check(`sample link present: ${f}`, read(f).includes('SampleReportLink') || read(f).includes('PayAssurance'))
}

// ── testimonials ──
const good = (n: string): Testimonial => ({ name: n, city: 'Pune', quote: 'It caught a line in my quote that was off.', source: 'email-reply', receivedOn: '2026-11-01', permission: true })
check('testimonials: the shipped list is empty or every entry is complete', TESTIMONIALS.every(isComplete))
check('testimonials: nothing shows today', visibleTestimonials().length === 0 || TESTIMONIALS.length >= TESTIMONIALS_MIN)
check('testimonials: two complete entries stay hidden', visibleTestimonials([good('Asha'), good('Ravi')]).length === 0)
check('testimonials: three complete entries show', visibleTestimonials([good('Asha'), good('Ravi'), good('Meena')]).length === 3)
check('testimonials: an incomplete entry does not count toward the three', visibleTestimonials([good('Asha'), good('Ravi'), { ...good('Meena'), receivedOn: '' }]).length === 0)
check('testimonials: a full name is not accepted (first name only)', !isComplete({ ...good('Asha Rao') }))
check('testimonials: no rating or review markup in the code', !/aggregateRating|ratingValue|"Review"|@type: 'Review'/.test(read('components/v2/sections/Testimonials.tsx') + read('lib/testimonials.ts').replace(/There are no star ratings and no review markup/g, '')))

// ── emails ──
const trade = buildTradeEmail(TRADE_META.plumbpro, 'Asha', 'NS-PL-TEST', 'https://example.test/r.pdf')
check('report email asks "Did the report help?"', trade.includes('Did the report help?') && trade.includes('Reply with one line we can share, using your first name and city.'))
check('report email says the exact agreed sentence', trade.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').includes(FEEDBACK_ASK))
check('report email links the refund policy', trade.includes('/refund-policy'))
const pack = buildPackEmail('Asha', 'pack-1')
check('pack email links the refund policy', pack.includes('/refund-policy'))
check('pack email does not ask "Did the report help?" (no report yet)', !pack.includes('Did the report help?'))
check('structopro email has the question', read('app/api/structopro/generate-pdf/route.ts').includes('emailAssuranceHtml({ feedback: true })'))
for (const f of ['app/api/structopro/generate-pdf/route.ts', 'app/api/qty/[tool]/generate-pdf/route.ts', 'app/api/grand-total/generate-pdf/route.ts', 'lib/pack/email.ts']) {
  check(`replies reach the contact inbox: ${f}`, read(f).includes('replyTo: CONTACT_EMAIL'))
}
check('contact email is set', /@/.test(CONTACT_EMAIL))

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
console.log('\nAll policy checks passed')

/*
  Checks the refund wording (the pre-26-Oct terms, restored 29 Oct 2026), the testimonials switch and the report emails.
  Run from the repo root:   npx tsx --tsconfig tsconfig.json scripts/check-policy.ts
*/

import fs from 'node:fs'
import path from 'node:path'
import {
  FAILED_DELIVERY_EN, FAILED_DELIVERY_HI, NOT_REFUNDABLE_EN, NOT_REFUNDABLE_HI, PACK_REFUND_EN, PACK_REFUND_HI,
  REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS, FEEDBACK_ASK, howToAskEn, howToAskHi,
} from '../lib/policy'
import { TESTIMONIALS, TESTIMONIALS_MIN, visibleTestimonials, isComplete, type Testimonial } from '../lib/testimonials'
import { buildTradeEmail } from '../lib/qty/email'
import { buildPackEmail } from '../lib/pack/email'
import { TRADE_META } from '../lib/qty/meta'
import { CONTACT_EMAIL } from '../lib/site-contact'
import { FAQ_CATEGORIES } from '../lib/faq-data'

let failed = 0
const check = (name: string, cond: boolean, extra = '') => { if (cond) console.log('ok    ' + name); else { failed++; console.error('FAIL  ' + name + (extra ? '  ' + extra : '')) } }
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

// ── the wording ──
const MASS = 'Once a PDF report has been generated and delivered to your registered email, the payment is not refundable.'
check('wording: a delivered report is not refundable (the wording the site had before 26 Oct)', NOT_REFUNDABLE_EN.startsWith(MASS) && NOT_REFUNDABLE_EN.includes('there is nothing to return'))
check('wording: a failed delivery within 48 hours is refunded in full', REFUND_FAILED_DELIVERY_HOURS === 48 && FAILED_DELIVERY_EN.includes('within 48 hours of payment') && FAILED_DELIVERY_EN.includes('refund you in full'))
check('wording: the ask is made by email within 7 days of payment', REFUND_ASK_DAYS === 7 && howToAskEn('a@b.c') === 'To ask for a refund for a failed delivery, email a@b.c within 7 days of payment.')
check('wording: the pack has the same two rules', PACK_REFUND_EN.includes('not refundable') && PACK_REFUND_EN.includes('within 48 hours'))
check('Hindi carries the same numbers as English', [NOT_REFUNDABLE_HI, FAILED_DELIVERY_HI, PACK_REFUND_HI, howToAskHi('a@b.c')].every(t => /\S/.test(t)) && FAILED_DELIVERY_HI.includes('48') && PACK_REFUND_HI.includes('48') && howToAskHi('a@b.c').includes('7'))
check('no mention of a processing time or a satisfaction promise in the wording', ![NOT_REFUNDABLE_EN, FAILED_DELIVERY_EN, PACK_REFUND_EN].some(t => /satisfaction|no forms|processing|business days|question at least one line/i.test(t)))

// ── the pages say it, and say it from the config ──
const terms = read('app/[locale]/terms-of-use/page.tsx')
check('Terms: refunds paragraph is built from the config', terms.includes('NOT_REFUNDABLE_EN') && terms.includes('FAILED_DELIVERY_EN') && terms.includes('REFUND_ASK_DAYS') && terms.includes('/refund-policy'))
check('Terms: the 7-day satisfaction promise is gone', !/REFUND_PROMISE|REFUND_DAYS|REFUND_PROCESSING|satisfaction|No forms, no argument/i.test(terms))
const refundPage = read('app/[locale]/refund-policy/page.tsx')
check('refund page: built from the config, English and Hindi', refundPage.includes('NOT_REFUNDABLE_EN') && refundPage.includes('NOT_REFUNDABLE_HI') && refundPage.includes('FAILED_DELIVERY_EN') && refundPage.includes('FAILED_DELIVERY_HI'))
check('refund page: no promise of a satisfaction refund or a processing time', !/REFUND_PROMISE|REFUND_DAYS|REFUND_PROCESSING|satisfaction|No forms, no argument|business days/i.test(refundPage))
check('refund page: no WhatsApp and no phone number', !/whatsapp|wa\.me|\+91/i.test(refundPage))
const faq = FAQ_CATEGORIES.flatMap(c => c.items).find(i => /refund/i.test(i.question))
check('FAQ: the refund answer is the old wording, word for word', !!faq && faq.answer === `If a report fails to generate because of a fault on our side and cannot be delivered within 48 hours of payment, we refund you in full. Email ${CONTACT_EMAIL} within 7 days of payment with your order ID. A report that has been generated and delivered is not refundable, since the quantities are worked out and the PDF is made at the time of payment. The Terms of Use say the same.`)
check('FAQ: no satisfaction promise', !!faq && !/satisfaction|question at least one line|No forms/i.test(faq.answer))
check('layout descriptions: no 7-day promise', !/7-day|seven-day|satisfaction/i.test(read('app/[locale]/refund-policy/layout.tsx') + read('app/[locale]/terms-of-use/layout.tsx') + read('app/[locale]/faq/layout.tsx')))
check('policy file has no leftover promise constants', !/REFUND_PROMISE|REFUND_SHORT|REFUND_PROCESSING|REFUND_DAYS/.test(read('lib/policy.ts').replace(/The "7-day satisfaction promise"[^\n]*/g, '')))

// ── pay buttons: the sample link stays, the refund line beside the button is gone ──
const assure = read('components/policy/PayAssurance.tsx')
check('pay assurance: has the sample link and no refund line', assure.includes('SampleReportLink') && !/REFUND|refund(?!\.)/.test(assure.replace(/\(The refund line[^)]*\)/, '')))
for (const f of ['components/v2/qty/QtyResults.tsx', 'components/v2/qty/GrandTotal.tsx', 'components/v2/qty/CompletePack.tsx', 'app/[locale]/tools/structopro/components/ResultsV2.tsx']) {
  check(`pay screen has the sample link: ${f}`, read(f).includes('<PayAssurance'))
}
for (const f of ['components/v2/qty/QtyToolPage.tsx', 'components/v2/qty/GrandTotal.tsx', 'components/v2/qty/CompletePack.tsx', 'app/[locale]/tools/structopro/page.tsx', 'components/v2/sections/Pricing.tsx']) {
  check(`sample link present: ${f}`, read(f).includes('SampleReportLink') || read(f).includes('PayAssurance'))
}
check('footer still links the refund policy page', read('components/v2/sections/Footer.tsx').includes("'/refund-policy'"))

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
check('report email makes no refund promise', !/refund|satisfaction|No forms/i.test(trade.replace(/<[^>]+>/g, ' ')))
const pack = buildPackEmail('Asha', 'pack-1')
check('pack email makes no refund promise', !/refund|satisfaction|No forms/i.test(pack.replace(/<[^>]+>/g, ' ')))
check('pack email does not ask "Did the report help?" (no report yet)', !pack.includes('Did the report help?'))
check('structopro email has the question', read('app/api/structopro/generate-pdf/route.ts').includes('emailAssuranceHtml({ feedback: true })'))
for (const f of ['app/api/structopro/generate-pdf/route.ts', 'app/api/qty/[tool]/generate-pdf/route.ts', 'app/api/grand-total/generate-pdf/route.ts', 'lib/pack/email.ts']) {
  check(`replies reach the contact inbox: ${f}`, read(f).includes('replyTo: CONTACT_EMAIL'))
}
check('contact email is set', /@/.test(CONTACT_EMAIL))

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1) }
console.log('\nAll policy checks passed')

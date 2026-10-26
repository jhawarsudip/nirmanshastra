/*
  Group 6 check: trust signals.
    - the founder line and the short disclaimer are exactly the words given, and the founder's name is nowhere on the site
    - the founder photo shows only when a safe address is supplied
    - the contact email is read from CONTACT_EMAIL everywhere (no typed address), and reaches JSON-LD, the footer, PDFs and emails
    - every blog article keeps the publish date it was first given, the update date is separate, and the JSON-LD agrees
  Run: npx tsx --tsconfig tsconfig.json scripts/check-trust.ts
*/

import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'
import { FOUNDER_LINE, FOUNDER_PHOTO, cleanPhotoUrl } from '../lib/founder'
import { REVIEW_NOTE, REVIEW_FACT, ORG_REVIEW_DESCRIPTION, SUPPORT_EMAIL } from '../lib/seo/site'
import { CONTACT_EMAIL } from '../lib/site-contact'
import { BLOG_ARTICLES } from '../lib/blog-content'
import { articleSchema, organizationSchema } from '../lib/seo/schema'
import { emailAssuranceHtml } from '../lib/email-parts'
import { getEmailContent } from '../lib/email-templates'

let failed = 0
const ok = (c: boolean, w: string) => { if (c) console.log(`  ok   ${w}`); else { failed++; console.log(`  FAIL ${w}`) } }

const ROOT = process.cwd()
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.git')) continue
    const p = path.join(dir, n)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|json|md|mdx|txt|css)$/.test(n)) out.push(p)
  }
  return out
}
const files = ['app', 'components', 'lib', 'messages', 'public'].flatMap(d => { try { return walk(path.join(ROOT, d)) } catch { return [] } })
const rel = (f: string) => path.relative(ROOT, f)

console.log('Founder and disclaimer wording')
ok(FOUNDER_LINE.en === 'Built by a civil engineer (B.Tech Civil, NIT), formerly at a leading real estate construction company', 'founder line (English) is the exact wording given')
ok(REVIEW_NOTE === 'Written by a civil engineer (B.Tech Civil, NIT). For budgeting and quantity checks; a structural design still needs a licensed engineer.', 'short disclaimer is the exact wording given')
ok(!/practising/i.test(REVIEW_NOTE) && !/practising/i.test(ORG_REVIEW_DESCRIPTION), 'the alarming "not reviewed by a practising engineer" wording is gone from the short notes')
ok(REVIEW_FACT === 'The calculations have not been independently reviewed by a structural engineer.', 'the plain fact is kept for /about, /disclaimer and llms.txt')
const nameHits = files.filter(f => /sudip|jhawar/i.test(readFileSync(f, 'utf8'))).map(rel)
ok(nameHits.length === 0, `the founder's name appears nowhere in app, components, lib, messages or public${nameHits.length ? ': ' + nameHits.join(', ') : ''}`)
const oldClaims = files.filter(f => /not reviewed by a practising engineer|no practising engineer reviews/i.test(readFileSync(f, 'utf8'))).map(rel)
ok(oldClaims.length === 0, `no page still carries the old long disclaimer sentence${oldClaims.length ? ': ' + oldClaims.join(', ') : ''}`)
const about = readFileSync(path.join(ROOT, 'app/about/page.tsx'), 'utf8')
ok(about.includes('<Founder') && about.includes('REVIEW_FACT'), '/about shows the founder line and the review fact')
const blogPage = readFileSync(path.join(ROOT, 'app/blog/[slug]/page.tsx'), 'utf8')
ok(blogPage.includes('<Founder'), 'blog posts show the founder line')
const home = readFileSync(path.join(ROOT, 'app/[locale]/page.tsx'), 'utf8')
ok(home.includes('<FounderBand'), 'the homepage shows the founder line')
const disc = readFileSync(path.join(ROOT, 'app/disclaimer/page.tsx'), 'utf8')
ok(disc.includes('REVIEW_FACT') && disc.includes('licensed structural engineer must review'), '/disclaimer keeps the full text and the review fact')

console.log('Founder photo slot')
ok(FOUNDER_PHOTO === '', 'no photo is shown while none is supplied')
ok(cleanPhotoUrl('/founder.jpg') === '/founder.jpg', 'a path under /public is accepted')
ok(cleanPhotoUrl('https://cdn.example.com/a/b.jpg') === 'https://cdn.example.com/a/b.jpg', 'an https address is accepted')
for (const bad of ['http://x.com/a.jpg', '//evil.com/a.jpg', 'javascript:alert(1)', '/../secret', 'data:image/png;base64,AAAA', '/a b.jpg', 'https://x.com/"onerror=1', ''])
  ok(cleanPhotoUrl(bad) === '', `refused: ${JSON.stringify(bad)}`)

console.log('Contact email comes from CONTACT_EMAIL')
ok(SUPPORT_EMAIL === CONTACT_EMAIL, 'SUPPORT_EMAIL is the same value')
const typed = files.filter(f => rel(f) !== 'lib/site-contact.ts' && /[A-Za-z0-9._-]+@gmail\.com/.test(readFileSync(f, 'utf8'))).map(rel)
ok(typed.length === 0, `no typed gmail address outside lib/site-contact.ts${typed.length ? ': ' + typed.join(', ') : ''}`)
const org = JSON.stringify(organizationSchema())
ok(org.includes(CONTACT_EMAIL), 'Organization JSON-LD ContactPoint uses it')
const footer = readFileSync(path.join(ROOT, 'components/v2/sections/Footer.tsx'), 'utf8')
ok(footer.includes('CONTACT_EMAIL'), 'the footer shows it')
const kit = readFileSync(path.join(ROOT, 'lib/pdf/qty-kit.tsx'), 'utf8')
ok(kit.includes('{CONTACT_EMAIL}'), 'every PDF footer prints it')
ok(emailAssuranceHtml({ feedback: true }).includes(CONTACT_EMAIL), 'report emails print it')
const seq = getEmailContent('structopro', 7, 'Asha')
ok(!!seq && seq.html.includes(`mailto:${CONTACT_EMAIL}`), 'follow-up emails print it')
const contactApi = readFileSync(path.join(ROOT, 'app/api/contact/route.ts'), 'utf8')
ok(contactApi.includes('= CONTACT_EMAIL'), 'the contact form delivers to it')

console.log('Blog dates')
const FIRST_PUBLISHED: Record<string, string> = {
  'verify-contractor-quote-is-456-2000': '2026-06-15',
  'm20-vs-m25-concrete-grade': '2026-06-18',
  'steel-theft-construction-sites': '2026-06-20',
  'seismic-zones-india-is-1893': '2026-06-22',
  'per-sqft-pricing-contractor-fraud': '2026-06-24',
  'rccb-electrical-safety-is-732-2019': '2026-06-26',
  'water-requirements-is-1172-1993': '2026-06-28',
  'vastu-vedic-architecture-16-zones': '2026-06-30',
  'ghar-banane-ka-sahi-cost-is-code': '2026-07-06',
  'construction-cost-per-sq-ft-india': '2026-10-23',
  'cement-sand-aggregate-for-1000-sq-ft-house': '2026-10-23',
  'how-to-check-contractor-quote': '2026-10-23',
  'steel-required-per-sq-ft': '2026-10-23',
  'bricks-per-sq-ft': '2026-10-23',
}
ok(BLOG_ARTICLES.length === Object.keys(FIRST_PUBLISHED).length, `${BLOG_ARTICLES.length} articles, all accounted for`)
for (const a of BLOG_ARTICLES) {
  ok(a.publishedDate === FIRST_PUBLISHED[a.slug], `${a.slug}: published ${a.publishedDate} (as first committed)`)
  ok(!a.updatedDate || a.updatedDate >= a.publishedDate, `${a.slug}: updated date is not before the publish date`)
  const ld = articleSchema(a) as Record<string, unknown>
  ok(ld.datePublished === a.publishedDate && ld.dateModified === (a.updatedDate ?? a.publishedDate), `${a.slug}: JSON-LD datePublished and dateModified agree`)
}
const card = readFileSync(path.join(ROOT, 'app/blog/ArticleCard.tsx'), 'utf8')
ok(card.includes('fmt(a.publishedDate)') && !card.includes('fmt(a.updatedDate ??'), 'the guide cards lead with the publish date, not the update date')
ok(/Updated <time/.test(blogPage) && !/Last updated/.test(blogPage), 'the guide page shows "Updated" separately, only when there is an update')
const sm = readFileSync(path.join(ROOT, 'app/sitemap.ts'), 'utf8')
ok(sm.includes('article.updatedDate ?? article.publishedDate'), 'the sitemap uses the last real edit')

console.log(failed ? `\n${failed} FAILED` : '\nAll trust checks passed')
process.exit(failed ? 1 : 0)

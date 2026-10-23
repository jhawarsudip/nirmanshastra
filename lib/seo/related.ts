// Cross-links from each tool page to the guides and glossary entries that explain it.
// Labels are resolved from the live blog and glossary data, so a renamed post or term
// cannot leave a stale link title behind.

import { BLOG_ARTICLES } from '@/lib/blog-content'
import { GLOSSARY } from '@/lib/seo/glossary'

export interface RelatedLink {
  label: string
  href: string
}

type Ref = { blog: string } | { term: string }

const MAP: Record<string, Ref[]> = {
  '/tools/bar-bending-schedule-calculator': [{ blog: 'steel-required-per-sq-ft' }, { blog: 'steel-theft-construction-sites' }, { term: 'bbs' }],
  '/tools/water-tank-size-calculator': [{ blog: 'water-requirements-is-1172-1993' }, { blog: 'how-to-check-contractor-quote' }, { term: 'lpcd' }],
  '/tools/concrete-mix-ratio-calculator': [{ blog: 'cement-sand-aggregate-for-1000-sq-ft-house' }, { blog: 'm20-vs-m25-concrete-grade' }, { term: 'concrete-grade' }],
  '/tools/brick-calculator': [{ blog: 'bricks-per-sq-ft' }, { blog: 'how-to-check-contractor-quote' }, { term: 'modular-brick' }],
  '/tools/wire-size-calculator': [{ blog: 'rccb-electrical-safety-is-732-2019' }, { blog: 'how-to-check-contractor-quote' }, { term: 'wire-size' }],
  '/tools/ra-bill-retention-tds-calculator': [{ blog: 'how-to-check-contractor-quote' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'ra-bill' }],
  '/tools/concrete-cube-test-calculator': [{ blog: 'verify-contractor-quote-is-456-2000' }, { blog: 'how-to-check-contractor-quote' }, { term: 'cube-test' }],
  '/tools/daily-wage-pf-esi-calculator': [{ term: 'pf-esi' }, { blog: 'how-to-check-contractor-quote' }],
  '/tools/finish-tier-cost-calculator': [{ blog: 'construction-cost-per-sq-ft-india' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'quality-tier' }],
  '/tools/earned-value-calculator': [{ term: 'earned-value' }, { blog: 'ghar-banane-ka-sahi-cost-is-code' }],
  '/tools/structopro': [{ blog: 'cement-sand-aggregate-for-1000-sq-ft-house' }, { blog: 'steel-required-per-sq-ft' }, { blog: 'seismic-zones-india-is-1893' }, { blog: 'construction-cost-per-sq-ft-india' }],
  '/tools/masonpro': [{ blog: 'bricks-per-sq-ft' }, { blog: 'how-to-check-contractor-quote' }, { term: 'aac-block' }],
  '/tools/electropro': [{ blog: 'rccb-electrical-safety-is-732-2019' }, { term: 'wire-size' }, { term: 'mcb-rccb' }],
  '/tools/plumbpro': [{ blog: 'water-requirements-is-1172-1993' }, { term: 'lpcd' }],
  '/tools/interiorpro': [{ blog: 'construction-cost-per-sq-ft-india' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'quality-tier' }],
  '/tools/grand-total': [{ blog: 'construction-cost-per-sq-ft-india' }, { blog: 'how-to-check-contractor-quote' }, { term: 'boq' }],
}

export function relatedLinksFor(path: string): RelatedLink[] {
  const out: RelatedLink[] = []
  for (const ref of MAP[path] ?? []) {
    if ('blog' in ref) {
      const a = BLOG_ARTICLES.find((x) => x.slug === ref.blog)
      if (a) out.push({ label: a.title, href: `/blog/${a.slug}` })
    } else {
      const t = GLOSSARY.flatMap((g) => g.terms).find((x) => x.id === ref.term)
      if (t) out.push({ label: `Glossary: ${t.term}`, href: `/glossary#${t.id}` })
    }
  }
  return out
}

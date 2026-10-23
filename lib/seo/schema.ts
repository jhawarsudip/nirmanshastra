// ─────────────────────────────────────────────────────────────────────────────
// schema.org builders. Pure functions over site data — no hard-coded prices,
// no invented ratings or reviews. AggregateRating is deliberately absent until
// real reviews exist on the site.
// ─────────────────────────────────────────────────────────────────────────────

import type { BlogArticle } from '@/lib/blog-content'
import type { CodeGroup } from '@/lib/is-codes-data'
import type { CalcFaq } from '@/lib/seo/calc-content'
import type { GlossaryGroup } from '@/lib/seo/glossary'
import { CALC_CONTENT } from '@/lib/seo/calc-content'
import { PAID_CONTENT } from '@/lib/seo/paid-content'
import {
  SITE_URL,
  SITE_NAME,
  SITE_SUMMARY,
  SUPPORT_EMAIL,
  LOGO_URL,
  OG_IMAGE_URL,
  ORG_REVIEW_DESCRIPTION,
  abs,
  getTool,
  getTemplate,
  priceOfTool,
  type ToolEntry,
  type TemplateEntry,
} from '@/lib/seo/site'

type Json = Record<string, unknown>

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`
const orgRef = { '@id': ORG_ID }

export function organizationSchema(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    image: OG_IMAGE_URL,
    description: SITE_SUMMARY,
    areaServed: { '@type': 'Country', name: 'India' },
    knowsLanguage: ['en-IN', 'hi-IN'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SUPPORT_EMAIL,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
    // sameAs (social profiles) intentionally omitted until the profiles exist.
  }
}

// The site has no site-search, so no SearchAction is declared.
export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_SUMMARY,
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: orgRef,
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  }
}

export function faqPageSchema(items: CalcFaq[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}

function priceBlock(paise: number, url: string, vatIncluded: boolean): Json {
  const price = (paise / 100).toFixed(2)
  const offer: Json = {
    '@type': 'Offer',
    price,
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url,
    seller: orgRef,
  }
  if (vatIncluded) {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'INR',
      valueAddedTaxIncluded: true,
    }
  }
  return offer
}

function webApplication(t: ToolEntry): Json {
  const url = abs(t.path)
  return {
    '@type': 'WebApplication',
    '@id': `${url}#app`,
    name: t.name,
    url,
    description: t.summary,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser',
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', url },
    provider: orgRef,
    publisher: orgRef,
  }
}

function paidApplication(t: ToolEntry): Json {
  const url = abs(t.path)
  const paise = priceOfTool(t)
  return {
    '@type': 'SoftwareApplication',
    '@id': `${url}#app`,
    name: t.name,
    url,
    description: t.summary,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    inLanguage: 'en-IN',
    // Site FAQ: "All prices shown are inclusive of GST."
    offers: paise !== null ? priceBlock(paise, url, true) : undefined,
    provider: orgRef,
    publisher: orgRef,
  }
}

export function howToSchema(c: NonNullable<(typeof CALC_CONTENT)[string]['howTo']>): Json {
  return {
    '@type': 'HowTo',
    name: c.name,
    description: c.description,
    step: c.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  }
}

/** Everything a tool page needs: breadcrumb + app + (optional) HowTo + FAQPage. */
export function toolJsonLd(path: string): Json[] {
  const t = getTool(path)
  if (!t) return []
  const out: Json[] = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: t.name, path },
    ]),
    t.kind === 'paid-report' ? paidApplication(t) : webApplication(t),
  ]
  const content = CALC_CONTENT[path]
  if (content?.howTo) out.push(howToSchema(content.howTo))
  const faq = content?.faq?.length ? content.faq : PAID_CONTENT[path]?.faq
  if (faq?.length) out.push(faqPageSchema(faq))
  return out
}

function productSchema(t: TemplateEntry): Json {
  const url = abs(t.path)
  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: t.name,
    sku: t.id,
    url,
    description: t.summary,
    image: OG_IMAGE_URL,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: priceBlock(t.pricePaise, url, false),
  }
}

export function templateJsonLd(path: string): Json[] {
  const t = getTemplate(path)
  if (!t) return []
  return [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Site Templates', path: '/site-templates' },
      { name: t.name, path },
    ]),
    productSchema(t),
  ]
}

export function articleSchema(a: BlogArticle): Json {
  const url = abs(`/blog/${a.slug}`)
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.excerpt,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: a.publishedDate,
    dateModified: a.updatedDate ?? a.publishedDate,
    inLanguage: a.language === 'hi-Latn' ? 'hi-Latn' : 'en-IN',
    articleSection: a.category,
    image: OG_IMAGE_URL,
    // Author is the Organization — no personal name anywhere on the site.
    author: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL, description: ORG_REVIEW_DESCRIPTION },
    publisher: orgRef,
  }
}

export function isCodesItemList(groups: CodeGroup[]): Json {
  const seen = new Map<string, { title: string; governs: string; tools: string[] }>()
  for (const g of groups) {
    for (const c of g.codes) {
      const hit = seen.get(c.code)
      if (hit) {
        if (!hit.tools.includes(g.tool)) hit.tools.push(g.tool)
      } else {
        seen.set(c.code, { title: c.title, governs: c.governs, tools: [g.tool] })
      }
    }
  }
  const items = [...seen.entries()]
  return {
    '@type': 'ItemList',
    name: 'IS codes used by NirmanShastra',
    numberOfItems: items.length,
    itemListElement: items.map(([code, v], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: code,
        alternateName: v.title,
        description: `${v.governs} Used by: ${v.tools.join(', ')}.`,
        publisher: { '@type': 'Organization', name: 'Bureau of Indian Standards' },
      },
    })),
  }
}

export function blogIndexSchema(articles: BlogArticle[]): Json {
  return {
    '@type': 'CollectionPage',
    name: 'Construction Knowledge — IS Code Guides',
    url: abs('/blog'),
    isPartOf: { '@id': SITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/blog/${a.slug}`),
        name: a.title,
      })),
    },
  }
}

export function templatesIndexSchema(): Json[] {
  return [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Site Templates', path: '/site-templates' },
    ]),
  ]
}

// DefinedTermSet for /glossary. Each term links to its on-page anchor, so an answer
// engine can quote a definition and point to the exact spot.
export function glossarySchema(groups: GlossaryGroup[], updated: string): Json {
  const page = abs('/glossary')
  return {
    '@type': 'DefinedTermSet',
    '@id': `${page}#termset`,
    name: 'NirmanShastra construction glossary',
    description:
      'Plain-English definitions of the construction, IS-code, structural, masonry, services and contract terms used across NirmanShastra.',
    url: page,
    inLanguage: 'en-IN',
    dateModified: updated,
    publisher: orgRef,
    hasDefinedTerm: groups.flatMap((g) =>
      g.terms.map((t) => ({
        '@type': 'DefinedTerm',
        '@id': `${page}#${t.id}`,
        name: t.term,
        description: t.definition,
        url: `${page}#${t.id}`,
        inDefinedTermSet: { '@id': `${page}#termset` },
      })),
    ),
  }
}

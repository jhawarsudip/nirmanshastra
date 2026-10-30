import type { MetadataRoute } from 'next'
import { BLOG_ARTICLES } from '@/lib/blog-content'
import { languageAlternates, localizePath } from '@/lib/i18n/paths'
import { isHindiReady } from '@/lib/i18n/translated'

const BASE_URL = 'https://www.nirmanshastra.in'

const HOME_ALTERNATES = {
  languages: {
    'en-IN': BASE_URL,
    'hi-IN': `${BASE_URL}/hi`,
    'x-default': BASE_URL,
  },
}

const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/site-templates', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/site-templates/cost-estimator', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/site-documentation', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/billing-measurement', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/bar-bending-schedule', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/labour-compliance', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/planning-progress', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/site-templates/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/compare-quote', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/is-codes-used', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/glossary', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-of-use', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
]

const TOOL_ROUTES = [
  '/tools/vastu-pro',
  '/tools/structopro',
  '/tools/masonpro',
  '/tools/electropro',
  '/tools/plumbpro',
  '/tools/interiorpro',
  '/tools/complete-house-pack',
  '/tools/bar-bending-schedule-calculator',
  '/tools/water-tank-size-calculator',
  '/tools/concrete-mix-ratio-calculator',
  '/tools/brick-calculator',
  '/tools/wire-size-calculator',
  '/tools/ra-bill-retention-tds-calculator',
  '/tools/concrete-cube-test-calculator',
  '/tools/daily-wage-pf-esi-calculator',
  '/tools/paint-tile-calculator',
  '/tools/earned-value-calculator',
]

/**
 * A page with real Hindi text is listed twice, once per language, each entry naming the other (hreflang).
 * A page that is still English only is listed once. See lib/i18n/translated.ts.
 */
function bothLanguages(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = []
  for (const e of entries) {
    const path = e.url.slice(BASE_URL.length) || '/'
    if (!isHindiReady(path)) { out.push(e); continue }
    const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([k, v]) => [k, `${BASE_URL}${v === '/' ? '' : v}`]))
    out.push({ ...e, alternates: { languages } })
    out.push({ ...e, url: `${BASE_URL}${localizePath(path, 'hi')}`, priority: Math.max(0.1, (e.priority ?? 0.5) - 0.1), alternates: { languages } })
  }
  return out
}

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      priority: 1.0,
      changeFrequency: 'weekly',
      alternates: HOME_ALTERNATES,
    },
    {
      url: `${BASE_URL}/hi`,
      priority: 0.9,
      changeFrequency: 'weekly',
      alternates: HOME_ALTERNATES,
    },
  ]

  const tools: MetadataRoute.Sitemap = TOOL_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    priority: 0.9,
    changeFrequency: 'monthly',
  }))

  const grandTotal: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/tools/grand-total`, priority: 0.8, changeFrequency: 'monthly' },
  ]

  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      priority,
      changeFrequency,
    })
  )

  const blogPosts: MetadataRoute.Sitemap = BLOG_ARTICLES.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.updatedDate ?? article.publishedDate),
    priority: 0.7,
    changeFrequency: 'monthly',
  }))

  return [...home, ...bothLanguages([...tools, ...grandTotal, ...staticPages, ...blogPosts])]
}

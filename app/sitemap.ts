import { MetadataRoute } from 'next'

const BASE_URL = 'https://nirmanshastra.in'

const BLOG_SLUGS = [
  'verify-contractor-quote-is-456-2000',
  'm20-vs-m25-concrete-grade',
  'steel-theft-construction-sites',
  'seismic-zones-india-is-1893',
  'per-sqft-pricing-contractor-fraud',
  'rccb-electrical-safety-is-732-2019',
  'water-requirements-is-1172-1993',
  'vastu-vedic-architecture-16-zones',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/pricing`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/how-it-works`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/vastu-pro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/structopro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/masonpro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/electropro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/plumbpro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/interiorpro`, priority: 0.9, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/tools/grand-total`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/blog`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/faq`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/contact`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/is-codes-used`, priority: 0.6, changeFrequency: 'monthly' },
  ]

  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }))

  return [...staticRoutes, ...blogRoutes]
}

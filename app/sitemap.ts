import type { MetadataRoute } from 'next'
import { BLOG_ARTICLES } from '@/lib/blog-content'

const BASE_URL = 'https://www.nirmanshastra.in'

const HOME_ALTERNATES = {
  languages: {
    en: BASE_URL,
    hi: `${BASE_URL}/hi`,
  },
}

const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/site-templates', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/compare-quote', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/is-codes-used', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-of-use', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
]

const TOOL_ROUTES = [
  '/tools/vastu-pro',
  '/tools/structopro',
  '/tools/masonpro',
  '/tools/electropro',
  '/tools/plumbpro',
  '/tools/interiorpro',
  '/tools/bar-bending-schedule-calculator',
]

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
    lastModified: new Date(article.publishedDate),
    priority: 0.7,
    changeFrequency: 'monthly',
  }))

  return [...home, ...tools, ...grandTotal, ...staticPages, ...blogPosts]
}

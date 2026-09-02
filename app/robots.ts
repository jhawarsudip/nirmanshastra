import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/account', '/auth', '/reports'],
    },
    sitemap: 'https://nirmanshastra.in/sitemap.xml',
  }
}

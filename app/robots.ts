import { MetadataRoute } from 'next'

// Private / transactional routes stay disallowed for every bot, named or not.
const PRIVATE = ['/account', '/auth', '/reports']
// The Hindi pages live under /hi, so each private page is closed there too.
const DISALLOW = ['/admin', '/api', ...PRIVATE, ...PRIVATE.map((p) => `/hi${p}`)]

// AI assistants and AI-search crawlers, welcomed by name. A named group REPLACES
// the "*" group for that bot, so the disallow list is repeated here on purpose.
const AI_BOTS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google (AI training/grounding controls)
  'Google-Extended',
  'GoogleOther',
  // Apple, Microsoft, Common Crawl, Meta, DuckDuckGo
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'meta-externalagent',
  'DuckAssistBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: 'https://www.nirmanshastra.in/sitemap.xml',
  }
}

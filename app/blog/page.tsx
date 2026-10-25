import type { Metadata } from 'next'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { BLOG_ARTICLES } from '@/lib/blog-content'
import JsonLd from '@/components/seo/JsonLd'
import { ToolHead } from '@/components/v2/inner/kit'
import ArticleCard from './ArticleCard'
import { CalcCta } from '@/components/v2/inner/calc'
import { blogIndexSchema, breadcrumbSchema } from '@/lib/seo/schema'
import { REVIEW_NOTE } from '@/lib/seo/site'

// The root layout's title template appends " | NirmanShastra", so the brand is not repeated in `title`.
const title = 'IS Code Guides: What the Indian Standards Say, in Plain English'
const description =
  'Plain-English guides to IS 456:2000, IS 1786:2008, IS 1893:2016 and more: what each standard fixes, which numbers it uses, and how to check a contractor’s quantities against them.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url: '/blog',
    title: `${title} | NirmanShastra`,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NirmanShastra: IS code guides' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | NirmanShastra`, description },
}

export default function BlogPage() {
  return (
    <div className="ns-i-page">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
          blogIndexSchema(BLOG_ARTICLES),
        ]}
      />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Guides"
          name="IS code guides"
          blurb={`${BLOG_ARTICLES.length} plain-English articles on what the Indian Standards say about concrete, steel, earthquakes, wiring and water, and what that means for the quantities in your house.`}
        />
        <p className="ns-r-tblnote">{REVIEW_NOTE}</p>

        <div className="ns-bl-grid">
          {BLOG_ARTICLES.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>

        <CalcCta
          kicker="Apply what you read"
          text="StructurePro works out the concrete, steel and cement for the frame of your house from a few answers, with the IS clause behind each rule. The first look at your zone, grades and frame is free."
          href="/tools/structopro"
          label="Open StructurePro"
        />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { BLOG_ARTICLES } from '@/lib/blog-content'
import BlogCard from './BlogCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Construction Knowledge — IS Code Guides | NirmanShastra',
  description:
    'Expert guides on IS 456:2000, IS 1786:2008, IS 1893:2016 and more — written in plain English for Indian homeowners and builders.',
}

export default function BlogPage() {
  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties

  return (
    <div className="sheet-frame" style={{ minHeight: '100vh', background: '#F4F4F0' }}>

      {/* Dark header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            SHEET 07 · KNOWLEDGE BASE
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.15, margin: 0, marginBottom: 14 }}>
            Construction Knowledge<br />
            <span style={{ color: '#1F4E79' }}>IS Code Guides</span>
          </h1>
          <p style={{ ...sans, fontSize: 16, color: 'rgba(244,244,240,0.6)', maxWidth: 540, margin: 0, lineHeight: 1.65 }}>
            Plain-English explanations of Indian Standards — what they say, what they mean for your home, and how to use them to protect yourself from contractor fraud.
          </p>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 32, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'ARTICLES', value: String(BLOG_ARTICLES.length) },
              { label: 'IS CODES COVERED', value: '8+' },
              { label: 'AVG READ TIME', value: '5 min' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ ...mono, fontSize: 22, fontWeight: 500, color: '#F4F4F0' }}>{s.value}</div>
                <div style={{ ...mono, fontSize: 9, color: 'rgba(244,244,240,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Articles grid */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 1,
          border: '1px solid rgba(30,34,39,0.12)',
        }}>
          {BLOG_ARTICLES.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </div>

      {/* Bottom CTA band */}
      <div style={{ background: '#1E2227', borderTop: '1px solid rgba(244,244,240,0.1)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              APPLY WHAT YOU LEARNED
            </div>
            <div style={{ ...serif, fontSize: 20, fontWeight: 600, color: '#F4F4F0' }}>
              Calculate your exact construction costs
            </div>
            <div style={{ ...sans, fontSize: 14, color: 'rgba(244,244,240,0.5)', marginTop: 6 }}>
              IS 456:2000 compliant BOQ — no guesswork, no contractor dependency.
            </div>
          </div>
          <Link
            href="/tools/structopro"
            style={{
              ...mono,
              background: '#8C3A22',
              color: '#F4F4F0',
              padding: '14px 28px',
              textDecoration: 'none',
              fontSize: 13,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            Try StructoPro Free →
          </Link>
        </div>
      </div>
    </div>
  )
}

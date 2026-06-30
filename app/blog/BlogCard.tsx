'use client'

import Link from 'next/link'
import type { BlogArticle } from '@/lib/blog-content'

const CATEGORY_COLORS: Record<string, string> = {
  Structural: '#1F4E79',
  'Cost & Transparency': '#8C3A22',
  Electrical: '#D99A06',
  Plumbing: '#14532D',
  Vastu: '#C9A84C',
}

export default function BlogCard({ article }: { article: BlogArticle }) {
  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties
  const catColor = CATEGORY_COLORS[article.category] ?? '#1F4E79'

  return (
    <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article
        style={{
          background: '#F4F4F0',
          border: '1px solid rgba(30,34,39,0.12)',
          padding: '24px',
          height: '100%',
          boxSizing: 'border-box',
          transition: 'background 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,34,39,0.04)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F4F4F0' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            ...mono,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: catColor,
            border: `1px solid ${catColor}`,
            padding: '2px 7px',
          }}>
            {article.category}
          </span>
          <span style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)' }}>
            {article.readTime} min read
          </span>
        </div>

        <h2 style={{
          ...serif,
          fontSize: 18,
          fontWeight: 600,
          color: '#1E2227',
          lineHeight: 1.35,
          margin: 0,
          flex: 1,
        }}>
          {article.title}
        </h2>

        <p style={{
          ...sans,
          fontSize: 14,
          color: 'rgba(30,34,39,0.65)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          {article.excerpt}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 12, borderTop: '1px solid rgba(30,34,39,0.08)' }}>
          <span style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.35)' }}>
            {new Date(article.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span style={{ ...mono, fontSize: 11, color: '#1F4E79', letterSpacing: '0.03em' }}>
            Read →
          </span>
        </div>
      </article>
    </Link>
  )
}

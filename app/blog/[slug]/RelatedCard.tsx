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

export default function RelatedCard({ article }: { article: BlogArticle }) {
  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const catColor = CATEGORY_COLORS[article.category] ?? '#1F4E79'

  return (
    <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          border: '1px solid rgba(30,34,39,0.12)',
          padding: '18px',
          background: '#F4F4F0',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,34,39,0.04)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F4F4F0' }}
      >
        <span style={{
          ...mono,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: catColor,
          border: `1px solid ${catColor}`,
          padding: '2px 6px',
          display: 'inline-block',
          marginBottom: 10,
        }}>
          {article.category}
        </span>
        <div style={{ ...serif, fontSize: 14, fontWeight: 600, color: '#1E2227', lineHeight: 1.4, marginBottom: 8 }}>
          {article.title}
        </div>
        <div style={{ ...mono, fontSize: 10, color: '#1F4E79' }}>Read →</div>
      </div>
    </Link>
  )
}

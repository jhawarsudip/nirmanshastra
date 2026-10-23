import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticleBySlug, getRelatedArticles, BLOG_ARTICLES } from '@/lib/blog-content'
import RelatedCard from './RelatedCard'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { articleSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { REVIEW_NOTE } from '@/lib/seo/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Article Not Found' }
  const url = `/blog/${article.slug}`
  const ogTitle = `${article.title} | NirmanShastra`
  return {
    // Root layout's title template appends " | NirmanShastra"; do not repeat it here.
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: article.language === 'hi-Latn' ? 'hi_IN' : 'en_IN',
      siteName: 'NirmanShastra',
      url,
      title: ogTitle,
      description: article.excerpt,
      publishedTime: article.publishedDate,
      modifiedTime: article.updatedDate ?? article.publishedDate,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: article.excerpt,
    },
  }
}

// ── Minimal markdown-to-JSX renderer ──────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  // **bold**  and  [label](/internal-path)  — internal links only, so a guide can
  // point readers to a calculator, another guide or the glossary.
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((\/[^)\s]*)\)/

  while (remaining.length > 0) {
    const m = remaining.match(re)
    if (m && m.index !== undefined) {
      if (m.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, m.index)}</span>)
      }
      if (m[1] !== undefined) {
        parts.push(<strong key={key++} style={{ fontWeight: 600, fontFamily: 'var(--font-plex-sans)' }}>{m[1]}</strong>)
      } else {
        parts.push(
          <Link key={key++} href={m[3]} style={{ color: '#1F4E79', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {m[2]}
          </Link>
        )
      }
      remaining = remaining.slice(m.index + m[0].length)
    } else {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
  }
  return parts
}

function isTableLine(line: string) {
  return line.startsWith('|') && line.endsWith('|')
}

function parseTable(lines: string[]): React.ReactNode {
  const rows = lines.map(l =>
    l.split('|').slice(1, -1).map(c => c.trim())
  )
  const header = rows[0]
  // skip separator row (rows[1])
  const body = rows.slice(2)

  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontFamily: 'var(--font-plex-sans)',
        fontSize: 14,
        border: '1px solid rgba(30,34,39,0.2)',
      }}>
        <thead>
          <tr style={{ background: 'rgba(30,34,39,0.06)' }}>
            {header.map((h, i) => (
              <th key={i} style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#1E2227',
                padding: '10px 14px',
                textAlign: 'left',
                borderBottom: '1px solid rgba(30,34,39,0.2)',
                borderRight: i < header.length - 1 ? '1px solid rgba(30,34,39,0.1)' : 'none',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 1 ? 'rgba(30,34,39,0.03)' : 'transparent' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  fontFamily: ci > 0 ? 'var(--font-plex-mono)' : 'var(--font-plex-sans)',
                  fontSize: ci > 0 ? 12 : 14,
                  color: '#1E2227',
                  padding: '9px 14px',
                  borderBottom: '1px solid rgba(30,34,39,0.07)',
                  borderRight: ci < row.length - 1 ? '1px solid rgba(30,34,39,0.07)' : 'none',
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // H2
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={key++} style={{
          fontFamily: 'var(--font-plex-serif)',
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 600,
          color: '#1E2227',
          marginTop: 40,
          marginBottom: 12,
          lineHeight: 1.3,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(30,34,39,0.1)',
        }}>
          {line.slice(3)}
        </h2>
      )
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={key++} style={{
          fontFamily: 'var(--font-plex-serif)',
          fontSize: 18,
          fontWeight: 600,
          color: '#1E2227',
          marginTop: 28,
          marginBottom: 8,
          lineHeight: 1.35,
        }}>
          {line.slice(4)}
        </h3>
      )
      i++
      continue
    }

    // Table block
    if (isTableLine(line)) {
      const tableLines: string[] = []
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i])
        i++
      }
      nodes.push(<div key={key++}>{parseTable(tableLines)}</div>)
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <ul key={key++} style={{ margin: '12px 0 20px', paddingLeft: 20, fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.85)', lineHeight: 1.7 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      nodes.push(
        <ol key={key++} style={{ margin: '12px 0 20px', paddingLeft: 20, fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.85)', lineHeight: 1.7 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>{renderInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule
    if (line === '---') {
      nodes.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid rgba(30,34,39,0.15)', margin: '32px 0' }} />)
      i++
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('- ') && !/^\d+\.\s/.test(lines[i]) && lines[i] !== '---' && !isTableLine(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} style={{
          fontFamily: 'var(--font-plex-sans)',
          fontSize: 15,
          color: 'rgba(30,34,39,0.85)',
          lineHeight: 1.75,
          margin: '0 0 18px',
        }}>
          {renderInline(paraLines.join(' '))}
        </p>
      )
    }
  }

  return nodes
}

// ── Page component ─────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = getRelatedArticles(article)
  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties

  const CATEGORY_COLORS: Record<string, string> = {
    Structural: '#1F4E79',
    'Cost & Transparency': '#8C3A22',
    Electrical: '#D99A06',
    Plumbing: '#14532D',
    Vastu: '#C9A84C',
  }
  const catColor = CATEGORY_COLORS[article.category] ?? '#1F4E79'

  return (
    <div className="sheet-frame" style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: article.title, path: `/blog/${article.slug}` },
          ]),
          articleSchema(article),
          ...(article.faq?.length ? [faqPageSchema(article.faq)] : []),
        ]}
      />

      {/* Article header */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20 }}>
            <Link href="/blog" style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Knowledge Base
            </Link>
            <span style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.2)' }}>›</span>
            <span style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {article.category}
            </span>
          </div>

          {/* Category chip */}
          <div style={{ marginBottom: 14 }}>
            <span style={{
              ...mono,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: catColor,
              border: `1px solid ${catColor}`,
              padding: '3px 8px',
            }}>
              {article.category}
            </span>
          </div>

          <h1 style={{ ...serif, fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.25, margin: '0 0 20px' }}>
            {article.title}
          </h1>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.45)' }}>
              Published{' '}
              <time dateTime={article.publishedDate}>
                {new Date(article.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </span>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.35)' }}>·</span>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.45)' }}>
              Last updated{' '}
              <time dateTime={article.updatedDate ?? article.publishedDate}>
                {new Date(article.updatedDate ?? article.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </span>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.35)' }}>·</span>
            <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.35)' }}>
              {article.readTime} min read
            </span>
          </div>
          <div style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.45)', marginTop: 12 }}>
            {REVIEW_NOTE}
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-12 pb-16">
        {/* Quick answer — the 40–60 word direct answer AI assistants quote */}
        {article.quickAnswer && (
          <div
            role="note"
            aria-label="Quick answer"
            style={{ border: '1px solid #1F4E79', background: 'rgba(31,78,121,0.05)', padding: '18px 20px', margin: '0 0 28px' }}
          >
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1F4E79', marginBottom: 8 }}>
              QUICK ANSWER
            </div>
            <p style={{ ...sans, fontSize: 16, fontWeight: 500, color: '#1E2227', lineHeight: 1.65, margin: 0 }}>
              {article.quickAnswer}
            </p>
          </div>
        )}

        {/* Excerpt lead */}
        <p style={{ ...sans, fontSize: 17, color: 'rgba(30,34,39,0.7)', lineHeight: 1.7, margin: '0 0 36px', borderLeft: '3px solid #1F4E79', paddingLeft: 16 }}>
          {article.excerpt}
        </p>

        {/* Content */}
        <div lang={article.language === 'hi-Latn' ? 'hi-Latn' : undefined}>{renderMarkdown(article.content)}</div>

        {/* FAQ — each question is its own heading; same data feeds FAQPage JSON-LD */}
        {article.faq && article.faq.length > 0 && (
          <section aria-labelledby="article-faq" style={{ marginTop: 40 }}>
            <h2 id="article-faq" style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 600, color: '#1E2227', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
              Frequently asked questions
            </h2>
            {article.faq.map((q) => (
              <div key={q.question} style={{ marginTop: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 17, fontWeight: 600, color: '#1E2227', marginBottom: 6, lineHeight: 1.35 }}>{q.question}</h3>
                <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.85)', lineHeight: 1.75, margin: 0 }}>{q.answer}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* CTA card */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pb-16">
        <div style={{
          border: '1px solid rgba(30,34,39,0.15)',
          padding: '28px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          background: 'rgba(30,34,39,0.03)',
        }}>
          <div>
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C3A22', marginBottom: 8 }}>
              APPLY THIS KNOWLEDGE
            </div>
            <div style={{ ...serif, fontSize: 18, fontWeight: 600, color: '#1E2227', marginBottom: 6 }}>
              Calculate your exact costs — Try StructurePro Free
            </div>
            <div style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.55)', lineHeight: 1.5 }}>
              IS 456:2000 compliant structural BOQ. Know your quantities before you speak to any contractor.
            </div>
          </div>
          <Link
            href="/tools/structopro"
            style={{
              ...mono,
              background: '#8C3A22',
              color: '#F4F4F0',
              padding: '13px 24px',
              textDecoration: 'none',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            Try StructurePro →
          </Link>
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(30,34,39,0.1)', padding: '48px 24px 64px' }}>
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              RELATED ARTICLES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1 }}>
              {related.map(rel => (
                <RelatedCard key={rel.slug} article={rel} />
              ))}
            </div>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <Link href="/blog" style={{ ...mono, fontSize: 12, color: '#1F4E79', textDecoration: 'none', letterSpacing: '0.05em', border: '1px solid #1F4E79', padding: '10px 20px', display: 'inline-block' }}>
                ← All Articles
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

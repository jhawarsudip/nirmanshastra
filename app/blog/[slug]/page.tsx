import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticleBySlug, getRelatedArticles, BLOG_ARTICLES } from '@/lib/blog-content'
import ArticleCard from '../ArticleCard'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { articleSchema, breadcrumbSchema, faqPageSchema } from '@/lib/seo/schema'
import { REVIEW_NOTE } from '@/lib/seo/site'
import Founder from '@/components/v2/Founder'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { ToolHead, IcArrow } from '@/components/v2/inner/kit'
import QuickAnswer from '@/components/seo/QuickAnswer'
import { CalcCta } from '@/components/v2/inner/calc'

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
// Articles are plain text in lib/blog-content.ts: ## and ### headings, - and 1. lists, | tables |, ---, **bold**
// and internal [links](/path). Everything is styled by the .ns-bl-art rules in styles/v2/content.css.

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
        parts.push(<strong key={key++}>{m[1]}</strong>)
      } else {
        parts.push(<Link key={key++} href={m[3]}>{m[2]}</Link>)
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

/** A table of up to five columns stacks into rows on a phone (column name above each figure); wider ones swipe. */
function parseTable(lines: string[]): React.ReactNode {
  const rows = lines.map(l => l.split('|').slice(1, -1).map(c => c.trim()))
  const header = rows[0]
  // skip separator row (rows[1])
  const body = rows.slice(2)
  const stacked = header.length <= 5

  return (
    <>
      {!stacked ? <p className="ns-i-swipe" aria-hidden="true">Swipe sideways to see every column &rarr;</p> : null}
      <div className="ns-i-tblw">
        <table className={`ns-i-tbl ns-r-tbl${stacked ? ' ns-r-tbl--stack' : ''}`}>
          <thead>
            <tr>{header.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) =>
                  ci === 0
                    ? <th key={ci} scope="row">{renderInline(cell)}</th>
                    : <td key={ci} data-label={header[ci]}>{renderInline(cell)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++}>{line.slice(3)}</h2>)
      i++
      continue
    }

    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++}>{line.slice(4)}</h3>)
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
      nodes.push(<div key={key++} className="ns-bl-art__tbl">{parseTable(tableLines)}</div>)
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
        <ul key={key++}>
          {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
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
        <ol key={key++}>
          {items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
        </ol>
      )
      continue
    }

    if (line === '---') {
      nodes.push(<hr key={key++} />)
      i++
      continue
    }

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
      nodes.push(<p key={key++}>{renderInline(paraLines.join(' '))}</p>)
    }
  }

  return nodes
}

// ── Page component ─────────────────────────────────────────────────────────────

const longDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = getRelatedArticles(article)

  return (
    <div className="ns-i-page">
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
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <Link href="/blog" className="ns-i-back"><IcArrow aria-hidden="true" /> All guides</Link>

        <ToolHead eyebrow={article.category} name={article.title} blurb={article.excerpt} />

        <p className="ns-r-tblnote">
          Published <time dateTime={article.publishedDate}>{longDate(article.publishedDate)}</time>
          {article.updatedDate ? <>{' · '}Updated <time dateTime={article.updatedDate}>{longDate(article.updatedDate)}</time></> : null}
          {' · '}{article.readTime} min read
          <br />
          {REVIEW_NOTE}
        </p>

        {/* Quick answer: the 40–60 word direct answer that search and AI assistants quote */}
        {article.quickAnswer ? (
          <div style={{ '--tc': 'var(--ns-laterite)' } as React.CSSProperties}>
            <QuickAnswer content={{ question: article.title, quickAnswer: article.quickAnswer }} />
          </div>
        ) : null}

        <article className="ns-plate ns-bl-art" lang={article.language === 'hi-Latn' ? 'hi-Latn' : undefined}>
          {renderMarkdown(article.content)}

          {/* FAQ — each question is its own heading; the same data feeds the FAQPage JSON-LD */}
          {article.faq && article.faq.length > 0 ? (
            <section aria-labelledby="article-faq" className="ns-bl-art__faq">
              <h2 id="article-faq">Frequently asked questions</h2>
              {article.faq.map((q) => (
                <div key={q.question}>
                  <h3>{q.question}</h3>
                  <p>{q.answer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </article>

        <Founder heading="Who wrote this" link />

        <CalcCta
          kicker="Apply this to your house"
          text="StructurePro works out the concrete, steel and cement for the frame of your house from a few answers, with the IS clause behind each rule. The first look at your zone, grades and frame is free."
          href="/tools/structopro"
          label="Open StructurePro"
        />

        {related.length > 0 ? (
          <section aria-labelledby="related-h" style={{ display: 'grid', gap: 16 }}>
            <h2 id="related-h" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>
              Related guides
            </h2>
            <div className="ns-bl-grid">
              {related.map((rel) => (
                <ArticleCard key={rel.slug} article={rel} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

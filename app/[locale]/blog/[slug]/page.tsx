import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getArticleBySlug, BLOG_ARTICLES } from '@/lib/blog-content'
import ArticleCard from '../ArticleCard'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { REVIEW_NOTE } from '@/lib/seo/site'
import { asLocale } from '@/lib/i18n/paths'
import { REVIEW_NOTE_HI } from '@/lib/i18n/labels/pages-common'
import { articleJsonLd } from '@/lib/i18n/labels/blog-jsonld'
import { BLOG_COPY, longDate } from '@/lib/blog-hi/copy'
import { blogArticleMetadata } from '@/lib/blog-hi/meta'
import { viewArticle, viewRelated } from '@/lib/blog-hi/pick'
import Founder from '@/components/v2/Founder'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { ToolHead, IcArrow } from '@/components/v2/inner/kit'
import QuickAnswer from '@/components/seo/QuickAnswer'
import { CalcCta } from '@/components/v2/inner/calc'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  return blogArticleMetadata(slug, asLocale(locale))
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
function parseTable(lines: string[], swipe: string): React.ReactNode {
  const rows = lines.map(l => l.split('|').slice(1, -1).map(c => c.trim()))
  const header = rows[0]
  // skip separator row (rows[1])
  const body = rows.slice(2)
  const stacked = header.length <= 5

  return (
    <>
      {!stacked ? <p className="ns-i-swipe" aria-hidden="true">{`${swipe} \u2192`}</p> : null}
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

function renderMarkdown(content: string, swipe: string): React.ReactNode[] {
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
      nodes.push(<div key={key++} className="ns-bl-art__tbl">{parseTable(tableLines, swipe)}</div>)
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

export default async function ArticlePage({ params }: PageProps) {
  const { locale: raw, slug } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const c = BLOG_COPY[locale]
  const found = getArticleBySlug(slug)
  if (!found) notFound()

  // The Hindi edition on /hi where one exists, else the English article unchanged (see lib/blog-hi/pick.ts).
  const article = viewArticle(found, locale)
  const related = viewRelated(found, locale)
  // The body's own language: Hindi edition = hi; an article still English on /hi says so; the English site's Roman-letter Hindi post keeps hi-Latn.
  const bodyLang = article.hi ? 'hi' : article.language === 'hi-Latn' ? 'hi-Latn' : locale === 'hi' ? 'en' : undefined

  return (
    <div className="ns-i-page">
      <JsonLd data={articleJsonLd(locale, article)} />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <Link href="/blog" className="ns-i-back"><IcArrow aria-hidden="true" /> {c.allGuides}</Link>

        <ToolHead eyebrow={article.category} name={article.title} blurb={article.excerpt} />

        <p className="ns-r-tblnote">
          {`${c.published} `}<time dateTime={article.publishedDate}>{longDate(article.publishedDate, locale)}</time>
          {article.updatedDate ? <>{' · '}{`${c.updated} `}<time dateTime={article.updatedDate}>{longDate(article.updatedDate, locale)}</time></> : null}
          {' · '}{c.minRead(article.readTime)}
          <br />
          {locale === 'hi' ? REVIEW_NOTE_HI : REVIEW_NOTE}
        </p>

        {/* Quick answer: the 40–60 word direct answer that search and AI assistants quote */}
        {article.quickAnswer ? (
          <div style={{ '--tc': 'var(--ns-laterite)' } as React.CSSProperties}>
            <QuickAnswer
              content={{
                question: article.title,
                quickAnswer: article.quickAnswer,
                // the Hindi box (Hindi label) only when the text is the Hindi edition
                hi: article.hi ? { question: article.title, quickAnswer: article.quickAnswer } : undefined,
              }}
            />
          </div>
        ) : null}

        <article className="ns-plate ns-bl-art" lang={bodyLang}>
          {renderMarkdown(article.content, c.swipe)}

          {/* FAQ — each question is its own heading; the same data feeds the FAQPage JSON-LD */}
          {article.faq && article.faq.length > 0 ? (
            <section aria-labelledby="article-faq" className="ns-bl-art__faq">
              <h2 id="article-faq">{c.faqHeading}</h2>
              {article.faq.map((q) => (
                <div key={q.question}>
                  <h3>{q.question}</h3>
                  <p>{q.answer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </article>

        <Founder heading={c.whoWrote} link loc={locale} />

        <CalcCta kicker={c.articleCta.kicker} text={c.articleCta.text} href="/tools/structopro" label={c.articleCta.label} />

        {related.length > 0 ? (
          <section aria-labelledby="related-h" style={{ display: 'grid', gap: 16 }}>
            <h2 id="related-h" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>
              {c.related}
            </h2>
            <div className="ns-bl-grid">
              {related.map((rel) => (
                <ArticleCard key={rel.slug} article={rel} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

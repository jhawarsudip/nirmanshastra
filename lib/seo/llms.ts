// ─────────────────────────────────────────────────────────────────────────────
// /llms.txt and /llms-full.txt — generated from the same data the site renders.
// Nothing is typed twice: prices come from the pricing libs (via site.ts), blog
// posts from lib/blog-content, FAQ from lib/faq-data, IS codes from
// lib/is-codes-data. Add a post or a tool and these files update on next build.
// ─────────────────────────────────────────────────────────────────────────────

import { WHATSAPP_DISPLAY } from '@/lib/site-contact'
import { BLOG_ARTICLES } from '@/lib/blog-content'
import { FAQ_CATEGORIES } from '@/lib/faq-data'
import { uniqueSources } from '@/lib/is-codes-data'
import { CALC_CONTENT } from '@/lib/seo/calc-content'
import { PAID_CONTENT } from '@/lib/seo/paid-content'
import {
  SITE_NAME,
  SITE_SUMMARY,
  SITE_URL,
  SUPPORT_EMAIL,
  TOOLS,
  TEMPLATES,
  BUNDLE,
  abs,
  inr,
  priceOfTool,
  REVIEW_NOTE,
} from '@/lib/seo/site'

// Evaluated at build time (these routes are force-static).
const BUILD_DATE = new Date().toISOString().slice(0, 10)

const link = (name: string, path: string, desc: string) => `- [${name}](${abs(path)}): ${desc}`

function uniqueCodes() {
  return uniqueSources().map((v) => [v.code, v] as const)
}

export function buildLlmsTxt(): string {
  const calculators = TOOLS.filter((t) => t.kind === 'free-calculator')
  const freeTools = TOOLS.filter((t) => t.kind === 'free-tool')
  const paid = TOOLS.filter((t) => t.kind === 'paid-report')

  const lines: string[] = []
  lines.push(`# ${SITE_NAME}`, '')
  lines.push(`> ${SITE_SUMMARY}`, '')
  lines.push(
    `Site: ${SITE_URL} · Languages: English (default) and Hindi (${abs('/hi')}) · Contact: ${SUPPORT_EMAIL}${WHATSAPP_DISPLAY ? ` · WhatsApp: ${WHATSAPP_DISPLAY}` : ''}`,
    ''
  )
  lines.push(
    `Quantities follow the Indian Standards (IS codes) listed at ${abs('/is-codes-used')}. Quantities are estimates worked out from a few answers and are not a structural design; see ${abs('/disclaimer')}. No rates, labour or contractor prices are given. ${REVIEW_NOTE}`,
    ''
  )
  lines.push(
    `Full text of calculators, guides, FAQ and IS codes in one file: ${abs('/llms-full.txt')}`,
    ''
  )

  lines.push('## Free calculators', '')
  for (const t of calculators) lines.push(link(t.name, t.path, t.summary))
  lines.push('')

  lines.push('## Other free tools', '')
  for (const t of freeTools) lines.push(link(t.name, t.path, t.summary))
  lines.push('')

  lines.push('## Quantity reports (paid, one-time price per report)', '')
  for (const t of paid) {
    const p = priceOfTool(t)
    lines.push(link(t.name, t.path, `${t.summary}${p !== null ? ` Price: ${inr(p)}.` : ''}`))
  }
  lines.push('')

  lines.push('## Excel site templates (paid, instant download)', '')
  for (const t of TEMPLATES) lines.push(link(t.name, t.path, `${t.summary} Price: ${inr(t.pricePaise)}.`))
  lines.push(link(BUNDLE.name, BUNDLE.path, `All six toolkits together. Price: ${inr(BUNDLE.pricePaise)}.`))
  lines.push('')

  lines.push('## Guides', '')
  for (const a of BLOG_ARTICLES) {
    lines.push(link(a.title, `/blog/${a.slug}`, `${a.excerpt}${a.language === 'hi-Latn' ? ' (Hindi, Roman script)' : ''}`))
  }
  lines.push('')

  lines.push('## Reference', '')
  lines.push(link('IS Codes Used', '/is-codes-used', `The Indian Standards behind every quantity and rate, with what each governs.`))
  lines.push(link('FAQ', '/faq', 'Questions about pricing, IS codes, accuracy and how reports work.'))
  lines.push(link('Glossary', '/glossary', 'Bill of quantities, bar bending schedule, cube test, M20/M25, curing and more.'))
  lines.push(link('About', '/about', 'Who builds NirmanShastra and why.'))
  lines.push(link('Contact', '/contact', 'Support, IS-code clarification and billing queries.'))
  lines.push('')

  lines.push('## Optional', '')
  lines.push(`- [llms-full.txt](${abs('/llms-full.txt')}): complete plain-text version of the above.`)
  lines.push('')
  lines.push(`Last updated: ${BUILD_DATE}`)
  return lines.join('\n') + '\n'
}

export function buildLlmsFullTxt(): string {
  const out: string[] = []
  out.push(`# ${SITE_NAME} — full text for AI assistants`, '')
  out.push(`> ${SITE_SUMMARY}`, '')
  out.push(`Source: ${SITE_URL} · Last updated: ${BUILD_DATE}`, '')

  // ── Tools ──
  out.push('# Tools', '')
  for (const t of TOOLS) {
    const p = priceOfTool(t)
    out.push(`## ${t.name}`, '')
    out.push(`URL: ${abs(t.path)}`)
    out.push(
      `Type: ${t.kind === 'paid-report' ? `paid quantity report${p !== null ? `, ${inr(p)}` : ''}` : 'free'}`
    )
    if (t.isCodes.length) out.push(`IS codes: ${t.isCodes.join(', ')}`)
    out.push('', t.summary, '')
    const c = CALC_CONTENT[t.path]
    if (c) {
      out.push(`Quick answer — ${c.question}`, c.quickAnswer, '')
      if (c.howTo) {
        out.push(`How to: ${c.howTo.name} (${c.howTo.description})`)
        c.howTo.steps.forEach((s, i) => out.push(`${i + 1}. ${s.name}: ${s.text}`))
        out.push('')
      }
      for (const f of c.faq) out.push(`Q: ${f.question}`, `A: ${f.answer}`, '')
    }
    const pc = PAID_CONTENT[t.path]
    if (pc) {
      out.push(pc.heading)
      for (const line of pc.whatsInside) out.push(`- ${line}`)
      out.push('', `Who it is for: ${pc.whoFor}`, '', `Worked example — ${pc.example.title}`, pc.example.intro)
      for (const r of pc.example.rows) out.push(`- ${r.label}: ${r.value}${r.note ? ` (${r.note})` : ''}`)
      out.push(pc.example.footnote, '')
      for (const f of pc.faq) out.push(`Q: ${f.question}`, `A: ${f.answer}`, '')
    }
  }

  out.push('# Excel site templates', '')
  for (const t of TEMPLATES) {
    out.push(`## ${t.name}`, '', `URL: ${abs(t.path)}`, `Price: ${inr(t.pricePaise)}`, '', t.summary, '')
  }
  out.push(`## ${BUNDLE.name}`, '', `URL: ${abs(BUNDLE.path)}`, `Price: ${inr(BUNDLE.pricePaise)}`, '')

  // ── FAQ ──
  out.push('# Frequently asked questions', '', `URL: ${abs('/faq')}`, '')
  for (const cat of FAQ_CATEGORIES) {
    out.push(`## ${cat.label}`, '')
    for (const q of cat.items) out.push(`### ${q.question}`, q.answer, '')
  }

  // ── IS codes ──
  out.push('# IS codes used', '', `URL: ${abs('/is-codes-used')}`, '')
  for (const [code, v] of uniqueCodes()) {
    out.push(`## ${code} — ${v.title}`, `Used by: ${v.tools.join(', ')}`, v.governs, ...(v.caveat ? [`Limit: ${v.caveat}`] : []), '')
  }

  // ── Guides ──
  out.push('# Guides', '')
  for (const a of BLOG_ARTICLES) {
    out.push(
      `## ${a.title}`,
      '',
      `URL: ${abs(`/blog/${a.slug}`)}`,
      `Published: ${a.publishedDate}${a.updatedDate ? ` · Updated: ${a.updatedDate}` : ''} · Language: ${a.language === 'hi-Latn' ? 'Hindi (Roman script)' : 'English'}`,
      '',
      a.quickAnswer ? `Quick answer: ${a.quickAnswer}\n` : '',
      a.content,
      ''
    )
  }
  return out.join('\n') + '\n'
}

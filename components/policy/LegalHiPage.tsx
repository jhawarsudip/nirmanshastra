import { Fragment, type ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import PrivacyChoices from '@/components/analytics/PrivacyChoices'
import SampleReportLink from '@/components/samples/SampleReportLink'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import { HI_NOTICE, type LegalBlock, type LegalDoc } from '@/lib/i18n/labels/legal-common'

/*
  Draws a Hindi legal page from a LegalDoc (lib/i18n/labels/legal-*.ts). The frame is the one the English legal pages use
  (head, plates with a heading, note boxes), so the Hindi page looks the same. Only the /hi route uses this; the English pages
  keep their own text in their page files.
*/

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

// **bold** and {kind|arg|arg} (see lib/i18n/labels/legal-common.ts for the list)
const TOKEN = /\*\*(.+?)\*\*|\{(en|mail|email|link|ext|choices)(?:\|([^}]*))?\}/g

export function rich(text: string, opts: { underline?: boolean; email?: string } = {}): ReactNode[] {
  const email = opts.email ?? CONTACT_EMAIL
  const out: ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    const key = n++
    if (m[1] !== undefined) {
      out.push(<b key={key}>{rich(m[1], opts)}</b>)
    } else {
      const kind = m[2]
      const arg = m[3] ?? ''
      if (kind === 'en') {
        out.push(<span key={key} lang="en">{arg}</span>)
      } else if (kind === 'mail' || kind === 'email') {
        out.push(<a key={key} href={`mailto:${email}${arg.startsWith('subject=') ? `?${arg}` : ''}`}>{email}</a>)
      } else if (kind === 'link') {
        const cut = arg.indexOf('|')
        const label = arg.slice(cut + 1)
        // a link whose text is an address ("/refund-policy") is a technical token: it stays Latin and is marked as English
        out.push(
          <Link key={key} href={arg.slice(0, cut)} lang={label.startsWith('/') ? 'en' : undefined} style={opts.underline ? { textDecoration: 'underline' } : undefined}>{label}</Link>,
        )
      } else if (kind === 'ext') {
        const cut = arg.indexOf('|')
        out.push(<a key={key} href={arg.slice(0, cut)} target="_blank" rel="noopener noreferrer">{arg.slice(cut + 1)}</a>)
      } else {
        out.push(<PrivacyChoices key={key}>{arg}</PrivacyChoices>)
      }
    }
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Block({ b, email }: { b: LegalBlock; email?: string }) {
  if ('p' in b) return <p>{rich(b.p, { email })}</p>
  if ('ul' in b) return <ul>{b.ul.map((li, i) => <li key={i}>{rich(li, { email })}</li>)}</ul>
  if ('ol' in b) return <ol>{b.ol.map((li, i) => <li key={i}>{rich(li, { email })}</li>)}</ol>
  return <SampleReportLink sample={b.sample} hi where={b.where} />
}

export default function LegalHiPage({ doc, email }: { doc: LegalDoc; email?: string }) {
  const noteOpts = { underline: true, email }
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={doc.eyebrow} name={doc.name} blurb={doc.blurb} />

        {/* The only line the English page does not have. Shown on the Hindi pages only. */}
        <p className="ns-i-fine" role="note" data-hi-notice="">{HI_NOTICE}</p>

        {doc.head ? <Note kind={doc.head.kind} title={doc.head.title}>{rich(doc.head.text, noteOpts)}</Note> : null}

        {doc.sections.map((s) => (
          <section
            key={s.id}
            className="ns-plate ns-r-sec ns-prose"
            {...(s.h ? { 'aria-labelledby': s.id } : { 'aria-label': s.aria })}
          >
            {s.h ? <h2 id={s.id} style={H2}>{rich(s.h)}</h2> : null}
            {s.blocks.map((b, i) => <Fragment key={i}><Block b={b} email={email} /></Fragment>)}
          </section>
        ))}

        {doc.foot?.kind === 'note' ? <Note>{rich(doc.foot.text, noteOpts)}</Note> : null}
        {doc.foot?.kind === 'fine' ? <p className="ns-i-fine">{rich(doc.foot.text, { email })}</p> : null}
      </div>
    </div>
  )
}

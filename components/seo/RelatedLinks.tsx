import Link from 'next/link'
import { relatedLinksFor } from '@/lib/seo/related'

// Related guides and glossary entries for a tool page. Plain server-rendered links, so
// they are in the delivered HTML for crawlers. Pure presentational: safe inside
// 'use client' pages. Dark-matte styling to match the calculator pages.

const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const MONO = 'var(--font-plex-mono)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const BSUB = 'rgba(255,255,255,0.08)'
const LINK = '#8FB8DE' // BLUEPRINT is too dark to read on the dark surface

export default function RelatedLinks({ path }: { path: string }) {
  const links = relatedLinksFor(path)
  if (links.length === 0) return null
  return (
    <nav aria-label="Related guides" data-related style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 'clamp(20px,2.4vw,24px)',
          fontWeight: 600,
          color: INK,
          lineHeight: 1.25,
          marginBottom: 12,
        }}
      >
        Related guides
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: `1px solid ${BSUB}` }}>
        {links.map((l) => (
          <li key={l.href} style={{ borderBottom: `1px solid ${BSUB}` }}>
            <Link
              href={l.href}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 0',
                fontFamily: SANS,
                fontSize: 15.5,
                color: INK_65,
                textDecoration: 'none',
              }}
            >
              <span style={{ color: INK }}>{l.label}</span>
              <span aria-hidden="true" style={{ fontFamily: MONO, color: LINK, flexShrink: 0 }}>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

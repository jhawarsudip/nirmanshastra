import { useLocale } from 'next-intl'
import { PAID_CONTENT, paidFaqBi, pickPaid } from '@/lib/seo/paid-content'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'

// Server-rendered explainer appended under each paid report's wizard (via the tool's
// layout.tsx). It answers "what is inside, who is it for, what does a worked example
// look like, and what do people ask" in plain HTML that crawlers and AI assistants
// can read without running the wizard. Worked examples use only numbers the free
// calculators already publish — see lib/seo/paid-content.ts.

const MONO = 'var(--font-plex-mono)'
const SANS = 'var(--font-plex-sans)'
const SERIF = 'var(--font-plex-serif)'
const INK = '#F4F4F0'
const INK_65 = 'rgba(244,244,240,0.65)'
const INK_45 = 'rgba(244,244,240,0.45)'
const SURF = '#171717'
const BSUB = 'rgba(255,255,255,0.08)'
const BLUEPRINT = '#1F4E79'

const h2Style: React.CSSProperties = {
  fontFamily: SERIF,
  fontSize: 'clamp(22px,2.6vw,28px)',
  fontWeight: 600,
  color: INK,
  lineHeight: 1.25,
  marginBottom: 14,
}

export default function PaidToolInfo({ path }: { path: string }) {
  const locale = useLocale()
  const hi = locale === 'hi'
  const paid = PAID_CONTENT[path]
  if (!paid) return null
  const c = pickPaid(paid, locale)
  return (
    <section
      aria-label={hi ? 'इस रिपोर्ट के बारे में' : 'About this report'}
      style={{ background: 'var(--bg-base, #0A0A0A)', borderTop: `1px solid ${BSUB}` }}
    >
      <div className="px-6 md:px-16 lg:px-24 py-16" style={{ maxWidth: 940 }}>
        <section style={{ marginBottom: 40 }}>
          <h2 style={h2Style}>{c.heading}</h2>
          <ul style={{ fontFamily: SANS, fontSize: 16, color: INK_65, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
            {c.whatsInside.map((line) => (
              <li key={line} style={{ marginBottom: 6 }}>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={h2Style}>{hi ? 'यह किसके लिए है' : 'Who it is for'}</h2>
          <p style={{ fontFamily: SANS, fontSize: 16, color: INK_65, lineHeight: 1.8, margin: 0 }}>{c.whoFor}</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={h2Style}>{hi ? 'हल किया हुआ उदाहरण' : 'Worked example'}</h2>
          <p style={{ fontFamily: MONO, fontSize: 12, color: BLUEPRINT, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            {c.example.title}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 16, color: INK_65, lineHeight: 1.8, margin: '0 0 14px' }}>{c.example.intro}</p>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: SURF,
              border: `1px solid ${BSUB}`,
              fontSize: 14,
            }}
          >
            <tbody>
              {c.example.rows.map((r) => (
                <tr key={r.label} style={{ borderBottom: `1px solid ${BSUB}` }}>
                  <th
                    scope="row"
                    style={{ fontFamily: SANS, fontWeight: 500, color: INK, textAlign: 'left', padding: '10px 14px', verticalAlign: 'top' }}
                  >
                    {r.label}
                  </th>
                  <td style={{ fontFamily: MONO, color: INK, padding: '10px 14px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{r.value}</td>
                  <td style={{ fontFamily: SANS, color: INK_45, padding: '10px 14px', fontSize: 13, verticalAlign: 'top' }}>{r.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontFamily: SANS, fontSize: 14, color: INK_45, lineHeight: 1.7, margin: '12px 0 0' }}>{c.example.footnote}</p>
        </section>

        <CalcFaq items={paidFaqBi(paid)} />

        <RelatedLinks path={path} />
      </div>
    </section>
  )
}

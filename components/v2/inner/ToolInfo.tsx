import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { PAID_CONTENT, pickPaid } from '@/lib/seo/paid-content'
import { relatedLinksFor } from '@/lib/seo/related'

/**
 * The explainer under a paid tool's wizard: what is inside, who it is for, a worked example, FAQ, related guides.
 * v2 look for components/seo/PaidToolInfo.tsx. It reads the same data, so the words crawlers and AI assistants
 * see in the delivered HTML are the same; native <details> keeps every FAQ answer in the markup while collapsed.
 * Worked examples use only numbers the free calculators already publish (see lib/seo/paid-content.ts).
 */
export default function ToolInfo({ path }: { path: string }) {
  const locale = useLocale()
  const hi = locale === 'hi'
  const paid = PAID_CONTENT[path]
  if (!paid) return null
  // the page words in the page language (each record carries its Hindi beside the English)
  const c = pickPaid(paid, locale)
  const related = relatedLinksFor(path, locale)
  return (
    <section aria-label={hi ? 'इस रिपोर्ट के बारे में' : 'About this report'} className="ns-i-info">
      <div className="ns-i-wrap">
        <div className="ns-i-info__in">
          <section>
            <h2>{c.heading}</h2>
            <ul className="ns-i-info__list">
              {c.whatsInside.map(line => <li key={line}>{line}</li>)}
            </ul>
          </section>

          <section>
            <h2>{hi ? 'यह किसके लिए है' : 'Who it is for'}</h2>
            <p>{c.whoFor}</p>
          </section>

          <section>
            <h2>{hi ? 'हल किया हुआ उदाहरण' : 'Worked example'}</h2>
            <p className="ns-i-info__kick">{c.example.title}</p>
            <p>{c.example.intro}</p>
            <div className="ns-i-tblw">
              <table className="ns-i-tbl ns-i-tbl--plain">
                <tbody>
                  {c.example.rows.map(r => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      <td className="ns-i-num">{r.value}</td>
                      <td className="ns-i-tbl__note">{r.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ns-i-fine" style={{ marginTop: 12 }}>{c.example.footnote}</p>
          </section>

          <section data-faq>
            <h2>{hi ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently asked questions'}</h2>
            <div className="ns-i-faq">
              {c.faq.map(item => (
                <details key={item.question} className="ns-i-faq__item">
                  <summary>
                    <h3>{item.question}</h3>
                    <span className="ns-i-faq__plus" aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <nav aria-label={hi ? 'संबंधित गाइड' : 'Related guides'} data-related>
              <h2>{hi ? 'संबंधित गाइड' : 'Related guides'}</h2>
              <ul className="ns-i-rel">
                {related.map(l => (
                  <li key={l.href}>
                    <Link href={l.href}><span>{l.label}</span><i aria-hidden="true">→</i></Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}

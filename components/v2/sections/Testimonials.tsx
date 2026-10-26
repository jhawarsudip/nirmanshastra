import { visibleTestimonials } from '@/lib/testimonials'
import '@/styles/v2/testimonials.css'

/*
  What customers said after using a report. Renders NOTHING until lib/testimonials.ts holds enough real, permitted entries
  (see that file). No ratings, no stars, no review markup.
*/
const H = { en: 'What people said after using it', hi: 'इस्तेमाल करने के बाद लोगों ने क्या कहा' } as const

export default function Testimonials({ loc }: { loc: 'en' | 'hi' }) {
  const list = visibleTestimonials()
  if (list.length === 0) return null
  return (
    <section className="ns-section ns-tst" id="testimonials" aria-labelledby="ns-tst-h">
      <div className="ns-wrap">
        <h2 className="ns-h2" id="ns-tst-h">{H[loc]}</h2>
        <ul className="ns-tst__grid">
          {list.map(t => (
            <li key={`${t.name}-${t.city}-${t.receivedOn}`}>
              <figure className="ns-plate ns-tst__card">
                <blockquote>{t.quote}</blockquote>
                <figcaption><b>{t.name}</b>, {t.city}{t.tool ? <> · <span>{t.tool}</span></> : null}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function CareersPage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Careers"
          name="We are not hiring"
          blurb="NirmanShastra is run by one person, with no outside funding. There are no open roles and no plan to open any soon."
        />

        <Note kind="warn" title="No open roles">
          A CV sent expecting a quick answer about an offer will not get one. If you still want to write, the people below are the ones whose notes are most useful.
        </Note>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="car-who">
          <h2 id="car-who" style={H2}>Who we would like to hear from</h2>
          <h3>Civil and structural engineers</h3>
          <p>You work to the Indian Standards, and you can read a bar bending schedule and spot where a quantity is off. Tell us which figure in a report you would not sign, and why.</p>
          <h3>Developers</h3>
          <p>You build careful, data-heavy interfaces in Next.js and TypeScript, and you care more about being correct than about being flashy. Construction knowledge helps but is not needed.</p>
          <h3>Writers</h3>
          <p>You can explain a technical subject to a homeowner without talking down to them, and without inventing a number.</p>
        </section>

        <section className="ns-plate ns-r-next" aria-labelledby="car-go">
          <p className="ns-r-hook__k">Write in</p>
          <h2 id="car-go" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>Say what you would fix first</h2>
          <p>Send a short note through the contact page. No CV template needed: tell us what you see.</p>
          <Link href="/contact" className="ns-btn">Write to us<IcArrow width={22} height={11} /></Link>
        </section>
      </div>
    </div>
  )
}

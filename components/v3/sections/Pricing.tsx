import Link from 'next/link'
import { Arrow, Check } from '../Icons'
import { PRICING, pick, type Loc } from '@/lib/v3/copy'

export default function Pricing({ loc }: { loc: Loc }) {
  const P = PRICING
  return (
    <section id="pricing" className="s3-section s3-section--alt s3-pricing" aria-labelledby="s3-pricing-h">
      <div className="s3-wrap">
        <div className="s3-head s3-rise">
          <h2 className="s3-h2" id="s3-pricing-h">{pick(P.title, loc)}</h2>
          <p className="s3-lede">{pick(P.lede, loc)}</p>
        </div>

        <div className="s3-pricing__grid">
          {/* free */}
          <article className="s3-card s3-plan s3-plan--free s3-rise">
            <span className="s3-plan__badge">{pick(P.free.badge, loc)}</span>
            <h3 className="s3-h3">{P.free.name}</h3>
            <p className="s3-plan__sub">{pick(P.free.sub, loc)}</p>
            <p className="s3-plan__price">{pick(P.free.price, loc)}</p>
            <ul className="s3-plan__list">
              {P.free.points.map((p, i) => <li key={i}><Check width={18} height={18} />{pick(p, loc)}</li>)}
            </ul>
            <Link href={P.free.href} className="s3-btn s3-btn--ghost">{pick(P.free.cta, loc)}</Link>
          </article>

          {/* one part */}
          <article className="s3-card s3-stitch s3-plan s3-plan--main s3-rise" style={{ ['--d' as string]: '.1s' }}>
            <span className="s3-plan__badge s3-plan__badge--hot">{pick(P.single.badge, loc)}</span>
            <h3 className="s3-h3">{pick(P.single.name, loc)}</h3>
            <p className="s3-plan__sub">{pick(P.single.sub, loc)}</p>
            <p className="s3-plan__price">{pick(P.single.price, loc)}</p>
            <ul className="s3-parts">
              {P.parts.map(p => (
                <li key={p.href}>
                  <Link href={p.href}>
                    <span className="s3-parts__name">{pick(p.name, loc)}<small>{p.tool}</small></span>
                    <span className="s3-parts__price s3-num">{p.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="s3-plan__list">
              {P.single.points.map((p, i) => <li key={i}><Check width={18} height={18} />{pick(p, loc)}</li>)}
            </ul>
            <Link href={P.single.href} className="s3-btn">{pick(P.single.cta, loc)}<Arrow width={22} height={22} /></Link>
          </article>

          {/* whole house */}
          <article className="s3-card s3-plan s3-plan--gt s3-rise" style={{ ['--d' as string]: '.2s' }}>
            <span className="s3-plan__badge">{pick(P.gt.badge, loc)}</span>
            <h3 className="s3-h3">{pick(P.gt.name, loc)}</h3>
            <p className="s3-plan__sub">{pick(P.gt.sub, loc)}</p>
            <p className="s3-plan__price">{P.gt.price}</p>
            <p className="s3-plan__free">{pick(P.gt.free, loc)}</p>
            <ul className="s3-plan__list">
              {P.gt.points.map((p, i) => <li key={i}><Check width={18} height={18} />{pick(p, loc)}</li>)}
            </ul>
            <Link href={P.gt.href} className="s3-btn s3-btn--ghost">{pick(P.gt.cta, loc)}</Link>
          </article>
        </div>
      </div>
    </section>
  )
}

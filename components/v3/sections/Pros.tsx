import Link from 'next/link'
import { Arrow } from '../Icons'
import { CALCULATORS } from '@/lib/v2/calculators'
import { SITE_TEMPLATES, TEMPLATES_BUNDLE } from '@/lib/v2/content'
import { MORE, PROS, pick, type Loc } from '@/lib/v3/copy'

/** The professionals' door: calculators and Excel toolkits, kept apart from the homeowner path. */
export default function Pros({ loc }: { loc: Loc }) {
  return (
    <section id="pros" className="s3-pros" aria-labelledby="s3-pros-h">
      <div className="s3-wrap s3-pros__wrap">
        <div className="s3-pros__head s3-rise">
          <p className="s3-note s3-pros__note">{pick(MORE.fromBuilders, loc)}</p>
          <h2 className="s3-h2" id="s3-pros-h">{pick(PROS.title, loc)}</h2>
          <p className="s3-lede">{pick(PROS.lede, loc)}</p>
        </div>

        <div className="s3-pros__cols">
          <div className="s3-rise">
            <h3 className="s3-pros__h">{pick(PROS.calcTitle, loc)} <small>{pick(PROS.calcNote, loc)}</small></h3>
            <ul className="s3-pros__calcs">
              {CALCULATORS.map(c => (
                <li key={c.href}>
                  <Link href={c.href}>
                    <span>{c.title[loc]}</span>
                    <em>{pick(MORE.free, loc)}</em>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="s3-rise" style={{ ['--d' as string]: '.12s' }}>
            <h3 className="s3-pros__h">{pick(PROS.kitTitle, loc)}</h3>
            <ul className="s3-pros__kits">
              {SITE_TEMPLATES.map(k => (
                <li key={k.href}>
                  <Link href={k.href}>
                    <span className="s3-pros__kitname">{k.title}<small className="s3-num">{k.sheets} {pick(PROS.sheets, loc)}</small></span>
                    <b className="s3-num">{k.price}</b>
                  </Link>
                </li>
              ))}
              <li className="s3-pros__bundle">
                <Link href={TEMPLATES_BUNDLE.href}>
                  <span className="s3-pros__kitname">{pick(PROS.kitBundle, loc)}</span>
                  <b className="s3-num">{TEMPLATES_BUNDLE.price}</b>
                </Link>
              </li>
            </ul>
            <Link href={TEMPLATES_BUNDLE.href} className="s3-btn s3-btn--sm s3-pros__all">{pick(PROS.seeAll, loc)}<Arrow width={20} height={20} /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { TOOLS } from '@/lib/v2/content'
import { TOOL_PRICE_PAISE, PRICE } from '@/lib/tool-pricing'
import { inr, REVIEW_FACT } from '@/lib/seo/site'
import Founder from '@/components/v2/Founder'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { ABOUT } from '@/lib/i18n/labels/pages-about'
import { REVIEW_FACT_HI } from '@/lib/i18n/labels/pages-common'

/*
  About. Written to say only what is true:
   - the product gives quantities and sets no prices of its own (a visitor may type their own rates to see the material cost);
   - the founder's name is private; the credential shown is the line in lib/founder.ts (B.Tech Civil, NIT; formerly at a leading
     real estate construction company), with the photo slot there left empty until an image is supplied;
   - the calculations have not been independently reviewed by a structural engineer (REVIEW_FACT in lib/seo/site.ts).
  Prices come from lib/tool-pricing.ts, never typed here.
  The Hindi (lib/i18n/labels/pages-about.ts) says exactly what the English says about the founder and the review: no more, no less.
*/

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default async function AboutPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const hi = locale === 'hi'
  const t = ABOUT[locale]
  const counts = t.counts
  const paid = TOOLS.filter(tl => !tl.free)
  const priceOf: Record<string, number> = {
    struct: TOOL_PRICE_PAISE.structopro, mason: TOOL_PRICE_PAISE.masonpro, elec: TOOL_PRICE_PAISE.electropro,
    plumb: TOOL_PRICE_PAISE.plumbpro, int: TOOL_PRICE_PAISE.interiorpro,
  }
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb} />

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="ab-why">
          <h2 id="ab-why" style={H2}>{t.whyH}</h2>
          <p>{t.why1}</p>
          <p>{t.why2}</p>
        </section>

        <section className="ns-plate ns-r-sec" aria-labelledby="ab-what">
          <h2 id="ab-what" style={H2}>{t.whatH}</h2>
          <p className="ns-r-sec__sub">{t.whatSub}</p>
          <ReportTable
            head={t.head}
            rows={[
              ...paid.map(tl => [tl.name, counts[tl.key], inr(priceOf[tl.key])]),
              [t.grandName, t.grandWhat, t.grandPrice(inr(TOOL_PRICE_PAISE.grandtotal))],
              [t.packName, t.packWhat, t.packPrice(PRICE.pack, PRICE.packSeparate)],
            ]}
          />
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="ab-sure">
          <h2 id="ab-sure" style={H2}>{t.sureH}</h2>
          <p>{t.sure1}</p>
          <p>{t.sure2a}<Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>{t.sure2link}</Link>{t.sure2b}</p>
        </section>

        <section aria-labelledby="ab-who" style={{ display: 'grid', gap: 14 }}>
          <h2 id="ab-who" style={H2}>{t.whoH}</h2>
          <Founder
            loc={locale}
            more={<>{t.who1} {hi ? REVIEW_FACT_HI : REVIEW_FACT}{t.who2a}<Link href="/privacy-policy" style={{ textDecoration: 'underline' }}>{t.who2link}</Link>{t.who2b}</>}
          />
        </section>

        <Note kind="warn" title={t.warnTitle}>
          {t.warn}
        </Note>

        <section className="ns-plate ns-r-next" aria-labelledby="ab-go">
          <p className="ns-r-hook__k">{t.goK}</p>
          <h2 id="ab-go" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>{t.goH}</h2>
          <p>{t.goA}<Link href="/compare-quote" style={{ textDecoration: 'underline' }}>{t.goLink}</Link>{t.goB}</p>
          <Link href="/tools/structopro" className="ns-btn">{t.goBtn}<IcArrow width={22} height={11} /></Link>
        </section>
      </div>
    </div>
  )
}

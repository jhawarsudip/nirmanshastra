import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { TOOLS } from '@/lib/v2/content'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { QUOTE_PAGE } from '@/lib/i18n/labels/quote-page'
import { Rich } from '../site-templates/_components/rich'

/*
  Check a contractor's quantities. A guide, not a calculator: the comparison itself runs inside the paid StructurePro report
  (it needs the quantities of the visitor's own frame). Nothing on this page is a rupee figure or a rate.
  The five verdicts below are the same five that app/tools/structopro/components/QuoteCheck.tsx uses (lib/structopro-qty/quoteCheck.ts).
*/

const TOOL = TOOLS.find(t => t.key === 'struct')!

export default async function CompareQuotePage({ params }: LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = QUOTE_PAGE[asLocale(locale)]
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow={t.eyebrow}
          name={t.name}
          blurb={t.blurb}
        />

        <section className="ns-plate ns-r-sec" aria-labelledby="cq-ask-t">
          <h2 id="cq-ask-t" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>{t.askTitle}</h2>
          <p className="ns-r-sec__sub">{t.askSub}</p>
          <ReportTable head={t.askHead} rows={t.askRows} />
        </section>

        <section className="ns-plate ns-r-sec" aria-labelledby="cq-read-t">
          <h2 id="cq-read-t" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>{t.readTitle}</h2>
          <p className="ns-r-sec__sub">{t.readSub}</p>
          <ReportTable head={t.readHead} rows={t.readRows} />
          <p className="ns-r-tblnote">
            <Rich text={t.readNote} />
          </p>
        </section>

        <section className="ns-plate ns-r-next" aria-labelledby="cq-go-t">
          <p className="ns-r-hook__k">{t.goKicker}</p>
          <h2 id="cq-go-t" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>{t.goTitle}</h2>
          <p>{t.goText(TOOL.price)}</p>
          <Link href={TOOL.href} className="ns-btn">{t.goButton}<IcArrow width={22} height={11} /></Link>
        </section>

        <Note>{t.note}</Note>
      </div>
    </div>
  )
}

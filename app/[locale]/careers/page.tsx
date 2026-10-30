import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { CAREERS } from '@/lib/i18n/labels/pages-about'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default async function CareersPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const t = CAREERS[asLocale(raw)]
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb} />

        <Note kind="warn" title={t.noteTitle}>
          {t.note}
        </Note>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="car-who">
          <h2 id="car-who" style={H2}>{t.whoH}</h2>
          <h3>{t.engH}</h3>
          <p>{t.eng}</p>
          <h3>{t.devH}</h3>
          <p>{t.dev}</p>
          <h3>{t.wrH}</h3>
          <p>{t.wr}</p>
        </section>

        <section className="ns-plate ns-r-next" aria-labelledby="car-go">
          <p className="ns-r-hook__k">{t.goK}</p>
          <h2 id="car-go" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>{t.goH}</h2>
          <p>{t.go}</p>
          <Link href="/contact" className="ns-btn">{t.goBtn}<IcArrow width={22} height={11} /></Link>
        </section>
      </div>
    </div>
  )
}

import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { sourceCounts } from '@/lib/is-codes-data'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { ISC_PAGE, codesFor } from '@/lib/i18n/labels/pages-iscodes'

/*
  The standards behind the quantities. Built from lib/is-codes-data, which lists only what the quantity models cite.
  Where a model says it could not read a document in full, the entry carries that caveat; nothing here claims more than the models do.
  On /hi the explanations come from lib/i18n/labels/pages-iscodes.ts (IS numbers, clause numbers and values are the same).
*/

export default async function ISCodesPage({ params }: LocaleParams) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = asLocale(raw)
  const t = ISC_PAGE[locale]
  const groups = codesFor(locale)
  const n = sourceCounts()
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb(n.total, n.indianStandards, n.other)} />

        <Note title={t.howTitle}>{t.how}</Note>

        {groups.map(tool => (
          <section key={tool.tool} className="ns-plate ns-r-sec" aria-labelledby={`isc-${tool.tool}`}>
            <h2 id={`isc-${tool.tool}`} style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>{tool.tool}</h2>
            <p className="ns-r-sec__sub">{tool.desc}</p>
            <ReportTable
              head={t.head}
              rows={tool.codes.map(c => [
                c.code,
                c.title,
                <span key="g">
                  {c.governs}
                  {c.caveat ? <span className="ns-isc-limit"><b>{t.limit}</b> {c.caveat}</span> : null}
                </span>,
              ])}
            />
          </section>
        ))}

        <Note kind="warn" title={t.editionTitle}>{t.edition}</Note>

        <p className="ns-r-tblnote">
          {t.seeA}<Link href="/disclaimer" style={{ textDecoration: 'underline' }}>{t.disclaimer}</Link>{t.seeB}<Link href="/terms-of-use" style={{ textDecoration: 'underline' }}>{t.terms}</Link>{t.seeC}
        </p>
      </div>
    </div>
  )
}

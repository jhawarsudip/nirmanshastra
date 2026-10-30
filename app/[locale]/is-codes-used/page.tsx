import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { CODES_BY_TOOL, sourceCounts } from '@/lib/is-codes-data'

/*
  The standards behind the quantities. Built from lib/is-codes-data, which lists only what the quantity models cite.
  Where a model says it could not read a document in full, the entry carries that caveat; nothing here claims more than the models do.
*/

export default function ISCodesPage() {
  const n = sourceCounts()
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Reference"
          name="The standards behind every quantity"
          blurb={`${n.total} sources feed the five reports: ${n.indianStandards} Indian Standards, counted by edition or part, and ${n.other} other documents. For each one, this page says what we take from it, so you can open the same clause and check.`}
        />

        <Note title="How to read this page">
          A source is listed only if one of the reports cites it. Where a report says it could not read a standard in full, or the figure it took is an assumption, the entry says so under the word &ldquo;Limit&rdquo;. A listing here does not mean the standard was read cover to cover.
        </Note>

        {CODES_BY_TOOL.map(tool => (
          <section key={tool.tool} className="ns-plate ns-r-sec" aria-labelledby={`isc-${tool.tool}`}>
            <h2 id={`isc-${tool.tool}`} style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>{tool.tool}</h2>
            <p className="ns-r-sec__sub">{tool.desc}</p>
            <ReportTable
              head={['Source', 'What it is', 'What we take from it']}
              rows={tool.codes.map(c => [
                c.code,
                c.title,
                <span key="g">
                  {c.governs}
                  {c.caveat ? <span className="ns-isc-limit"><b>Limit.</b> {c.caveat}</span> : null}
                </span>,
              ])}
            />
          </section>
        ))}

        <Note kind="warn" title="Check the edition before you rely on a clause">
          Standards are revised by the Bureau of Indian Standards, and the editions named here are the ones the reports use. Where a newer edition exists, the entry says which one is applied. This page is a map of our sources, not a substitute for the standard itself or for the engineer who signs your drawings.
        </Note>

        <p className="ns-r-tblnote">
          See also the <Link href="/disclaimer" style={{ textDecoration: 'underline' }}>disclaimer</Link> and the <Link href="/terms-of-use" style={{ textDecoration: 'underline' }}>terms of use</Link>.
        </p>
      </div>
    </div>
  )
}

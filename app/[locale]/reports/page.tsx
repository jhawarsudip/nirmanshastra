import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { createSupabaseClient } from '@/lib/supabase/server'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import DownloadButton from './DownloadButton'
import { PACK_APP_TYPE } from '@/lib/tool-pricing'
import { REPORTS, reportDateHi } from '@/lib/i18n/labels/pages-account'
import { placesHi } from '@/lib/i18n/labels/structopro-places'

// The six tool names are brand names and stay as they are. The two that are plain words come from the copy (Hindi on /hi).
const TOOL_BRANDS: Record<string, string> = {
  structopro: 'StructurePro',
  masonpro: 'MasonryPro',
  electropro: 'ElectricalPro',
  plumbpro: 'PlumbingPro',
  interiorpro: 'InteriorPro',
  vastupro: 'VastuPro',
}

// `key` is the status as stored; the words shown come from the copy.
const STATUS: Record<string, { key: 'draft' | 'complete' | 'paid'; tc?: boolean }> = {
  draft: { key: 'draft' },
  complete: { key: 'complete' },
  paid: { key: 'paid', tc: true },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export default async function ReportsPage({ params }: LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = REPORTS[asLocale(locale)]
  const hi = asLocale(locale) === 'hi'
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect({ href: '/auth?redirect=/reports', locale: asLocale(locale) })

  // result_data is not read here: it holds the paid quantities, which only the report routes may return.
  const { data: estimates, error } = await supabase
    .from('estimates')
    .select('id, app_type, project_name, city, state, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const count = estimates?.length ?? 0

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb} />

        {error ? <Note kind="err" title={t.errTitle}>{t.errBody}</Note> : null}

        {!error && count === 0 ? (
          <section className="ns-plate ns-r-sec ns-rp-empty">
            <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', margin: 0 }}>{t.emptyH}</h2>
            <p className="ns-r-sec__sub">{t.emptySub}</p>
            <Link href="/tools/structopro" className="ns-btn">{t.emptyGo}</Link>
          </section>
        ) : null}

        {!error && count > 0 ? (
          <>
            <ReportTable
              head={t.head}
              stack
              rows={(estimates ?? []).map((est) => {
                const st = STATUS[est.status] ?? STATUS.draft
                return [
                  TOOL_BRANDS[est.app_type] ?? (est.app_type === 'grandtotal' ? t.apps.grandtotal : est.app_type === 'completepack' ? t.apps.completepack : est.app_type),
                  est.project_name || '—',
                  // a state or listed town gets its Devanagari name on /hi; a city the visitor typed is shown as typed
                  (hi ? placesHi : (s: string) => s)([est.city, est.state].filter(Boolean).join(', ')) || '—',
                  hi ? reportDateHi(est.created_at) : formatDate(est.created_at),
                  <span key="s" className={`ns-i-pill${st.tc ? ' ns-i-pill--tc' : ''}`}>{t.status[st.key]}</span>,
                  est.status !== 'paid' ? '—'
                    : est.app_type === PACK_APP_TYPE ? <Link key="d" href={`/tools/complete-house-pack?pack=${est.id}`} className="ns-i-link">{t.openPack}</Link>
                    : <DownloadButton key="d" appType={est.app_type} estimateId={est.id} />,
                ]
              })}
            />
            <p className="ns-r-tblnote">{t.showing(count)}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

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

const APP_LABELS: Record<string, string> = {
  structopro: 'StructurePro',
  masonpro: 'MasonryPro',
  electropro: 'ElectricalPro',
  plumbpro: 'PlumbingPro',
  interiorpro: 'InteriorPro',
  vastupro: 'VastuPro',
  grandtotal: 'Grand Total',
  completepack: 'Complete House Pack',
}

const STATUS: Record<string, { label: string; tc?: boolean }> = {
  draft: { label: 'In progress' },
  complete: { label: 'Free view' },
  paid: { label: 'Paid', tc: true },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export default async function ReportsPage({ params }: LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
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
        <ToolHead eyebrow="Account" name="My reports" blurb="Every estimate you have saved. A paid report can be downloaded again here at any time." />

        {error ? <Note kind="err" title="Could not load your reports">Please refresh the page.</Note> : null}

        {!error && count === 0 ? (
          <section className="ns-plate ns-r-sec ns-rp-empty">
            <h2 style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', margin: 0 }}>No reports yet</h2>
            <p className="ns-r-sec__sub">Run any tool and your estimate is saved here.</p>
            <Link href="/tools/structopro" className="ns-btn">Start with StructurePro</Link>
          </section>
        ) : null}

        {!error && count > 0 ? (
          <>
            <ReportTable
              head={['Tool', 'Project', 'Location', 'Date', 'Status', 'Report']}
              stack
              rows={(estimates ?? []).map((est) => {
                const st = STATUS[est.status] ?? STATUS.draft
                return [
                  APP_LABELS[est.app_type] ?? est.app_type,
                  est.project_name || '—',
                  [est.city, est.state].filter(Boolean).join(', ') || '—',
                  formatDate(est.created_at),
                  <span key="s" className={`ns-i-pill${st.tc ? ' ns-i-pill--tc' : ''}`}>{st.label}</span>,
                  est.status !== 'paid' ? '—'
                    : est.app_type === PACK_APP_TYPE ? <Link key="d" href={`/tools/complete-house-pack?pack=${est.id}`} className="ns-i-link">Open your pack</Link>
                    : <DownloadButton key="d" appType={est.app_type} estimateId={est.id} />,
                ]
              })}
            />
            <p className="ns-r-tblnote">Showing {count} estimate{count === 1 ? '' : 's'}, most recent first.</p>
          </>
        ) : null}
      </div>
    </div>
  )
}

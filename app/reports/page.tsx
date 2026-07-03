import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/server'

const APP_LABELS: Record<string, string> = {
  structopro:  'StructurePro',
  masonpro:    'MasonryPro',
  electropro:  'ElectricalPro',
  plumbpro:    'PlumbingPro',
  interiorpro: 'InteriorPro',
  vastupro:    'VastuPro',
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'DRAFT',     color: 'rgba(30,34,39,0.45)', bg: 'rgba(30,34,39,0.06)' },
  complete: { label: 'COMPLETE',  color: '#1F4E79',             bg: 'rgba(31,78,121,0.08)' },
  paid:     { label: 'PAID',      color: '#14532D',             bg: 'rgba(20,83,45,0.08)'  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function extractGrandTotal(resultData: Record<string, unknown> | null, appType: string): string {
  if (!resultData) return '—'
  // Each tool stores grand total differently; try common keys
  const v =
    (resultData.grandTotal as number | undefined) ??
    (resultData.grand_total as number | undefined) ??
    (resultData.totalCost as number | undefined) ??
    (resultData.total as number | undefined)
  if (typeof v === 'number') return `₹${v.toLocaleString('en-IN')}`
  // Fallback: look inside a nested 'summary' key
  const summary = resultData.summary as Record<string, unknown> | undefined
  if (summary) {
    const sv =
      (summary.grandTotal as number | undefined) ??
      (summary.total as number | undefined)
    if (typeof sv === 'number') return `₹${sv.toLocaleString('en-IN')}`
  }
  return appType === 'vastupro' ? 'N/A' : '—'
}

export default async function ReportsPage() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth?redirect=/reports')

  const { data: estimates, error } = await supabase
    .from('estimates')
    .select('id, app_type, project_name, city, state, status, created_at, result_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const mono: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)' }
  const sans: React.CSSProperties = { fontFamily: 'var(--font-plex-sans)' }
  const serif: React.CSSProperties = { fontFamily: 'var(--font-plex-serif)' }

  return (
    <div className="min-h-screen" style={{ background: '#F4F4F0' }}>
      {/* Page header */}
      <div
        style={{
          borderBottom: '1px solid rgba(30,34,39,0.12)',
          background: '#F4F4F0',
          padding: '32px 24px 24px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            MY ACCOUNT · ESTIMATES &amp; REPORTS
          </p>
          <h1 style={{ ...serif, fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
            My Reports
          </h1>
          <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.55)', marginTop: 6 }}>
            All your saved estimates. Download paid PDF reports anytime.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {error && (
          <div style={{ border: '1px solid #8C3A22', borderRadius: 2, padding: '12px 16px', marginBottom: 24, background: 'rgba(140,58,34,0.05)' }}>
            <p style={{ ...mono, fontSize: 12, color: '#8C3A22' }}>⚠ Failed to load estimates. Please refresh.</p>
          </div>
        )}

        {!error && (!estimates || estimates.length === 0) ? (
          <div
            style={{
              border: '1px solid rgba(30,34,39,0.15)',
              borderRadius: 2,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              NO ESTIMATES YET
            </p>
            <p style={{ ...sans, fontSize: 14, color: 'rgba(30,34,39,0.5)', marginBottom: 24 }}>
              Run any tool to generate your first estimate.
            </p>
            <Link
              href="/tools/structopro"
              style={{
                ...mono,
                background: '#8C3A22',
                color: '#F4F4F0',
                padding: '10px 24px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13,
                letterSpacing: '0.04em',
              }}
            >
              Start with StructurePro →
            </Link>
          </div>
        ) : (
          /* BOQ-style table */
          <div style={{ border: '1px solid rgba(30,34,39,0.18)', borderRadius: 2, overflow: 'hidden' }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 100px 120px',
                background: 'rgba(30,34,39,0.05)',
                borderBottom: '1px solid rgba(30,34,39,0.15)',
                padding: '10px 16px',
                gap: 12,
              }}
            >
              {['TOOL', 'PROJECT', 'LOCATION', 'DATE', 'STATUS', 'ACTION'].map(h => (
                <span key={h} style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {h}
                </span>
              ))}
            </div>

            {estimates?.map((est, idx) => {
              const statusInfo = STATUS_STYLE[est.status] ?? STATUS_STYLE.draft
              const label = APP_LABELS[est.app_type] ?? est.app_type
              const grandTotal = extractGrandTotal(est.result_data as Record<string, unknown> | null, est.app_type)
              const location = [est.city, est.state].filter(Boolean).join(', ') || '—'

              return (
                <div
                  key={est.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr 1fr 100px 120px',
                    padding: '14px 16px',
                    gap: 12,
                    borderBottom: idx < (estimates.length - 1) ? '1px solid rgba(30,34,39,0.07)' : undefined,
                    alignItems: 'center',
                    background: idx % 2 === 1 ? 'rgba(30,34,39,0.02)' : 'transparent',
                  }}
                >
                  {/* Tool */}
                  <span style={{ ...mono, fontSize: 12, color: '#1F4E79', fontWeight: 500 }}>
                    {label}
                  </span>

                  {/* Project + grand total */}
                  <div>
                    <div style={{ ...sans, fontSize: 13, color: '#1E2227', fontWeight: 500 }}>
                      {est.project_name || '—'}
                    </div>
                    <div style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.45)', marginTop: 2 }}>
                      {grandTotal}
                    </div>
                  </div>

                  {/* Location */}
                  <span style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.6)' }}>
                    {location}
                  </span>

                  {/* Date */}
                  <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)' }}>
                    {formatDate(est.created_at)}
                  </span>

                  {/* Status badge */}
                  <span
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: statusInfo.color,
                      background: statusInfo.bg,
                      padding: '3px 8px',
                      letterSpacing: '0.06em',
                      border: `1px solid ${statusInfo.color}`,
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      display: 'inline-block',
                    }}
                  >
                    {statusInfo.label}
                  </span>

                  {/* Action */}
                  {est.status === 'paid' ? (
                    <a
                      href={`/api/${est.app_type}/generate-pdf?estimateId=${est.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...mono,
                        fontSize: 11,
                        color: '#14532D',
                        border: '1px solid #14532D',
                        padding: '5px 10px',
                        borderRadius: 4,
                        textDecoration: 'none',
                        display: 'inline-block',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Download PDF
                    </a>
                  ) : (
                    <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.3)' }}>
                      —
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.3)', marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SHOWING {estimates?.length ?? 0} ESTIMATE{estimates?.length !== 1 ? 'S' : ''} · MOST RECENT FIRST
        </p>
      </div>
    </div>
  )
}

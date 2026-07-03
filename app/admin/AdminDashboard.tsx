'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'vastupro' | 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro'

interface CityEntry  { city: string; count: number }
interface RoomEntry  { room: string; count: number }
interface IssueEntry { label: string; count: number }

interface VastuRecentRow {
  name: string; mobile: string; city: string; status: string; createdAt: string
}
interface PaidRecentRow {
  name: string; mobile: string; city: string; project: string
  totalEstimate: number; paid: boolean; createdAt: string
}

interface VastuStats {
  totalRegistrations: number
  totalAnalyses:      number
  totalDownloads:     number
  totalPDFs:          number
  cityDistribution:   CityEntry[]
  mostPlacedRooms:    RoomEntry[]
  mostCriticalIssues: IssueEntry[]
  recentReports:      VastuRecentRow[]
}

interface PaidStats {
  totalEstimates:   number
  totalPaid:        number
  conversionRate:   number
  totalPDFs:        number
  avgEstimateValue: number
  cityDistribution: CityEntry[]
  recentReports:    PaidRecentRow[]
}

type ToolStats = VastuStats | PaidStats

// ── Styles ───────────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-plex-serif)' }

const TABS: { id: Tab; label: string }[] = [
  { id: 'vastupro',   label: 'VastuPro'   },
  { id: 'structopro', label: 'StructurePro'  },
  { id: 'masonpro',   label: 'MasonryPro'   },
  { id: 'electropro', label: 'ElectricalPro' },
  { id: 'plumbpro',   label: 'PlumbingPro'  },
  { id: 'interiorpro',label: 'InteriorPro'},
]

function fmtINR(n: number) {
  if (!n) return '—'
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── City bar chart ────────────────────────────────────────────────────────────

function CityChart({ data }: { data: CityEntry[] }) {
  if (!data.length) return <p style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.4)' }}>No data yet</p>
  const max = data[0].count
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(({ city, count }) => (
        <div key={city} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 36px', alignItems: 'center', gap: 10 }}>
          <span style={{ ...mono, fontSize: 12, color: '#1E2227', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city}</span>
          <div style={{ height: 14, background: 'rgba(31,78,121,0.1)', border: '1px solid rgba(31,78,121,0.15)' }}>
            <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: '#1F4E79' }} />
          </div>
          <span style={{ ...mono, fontSize: 12, color: '#1F4E79', textAlign: 'right' }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      border: '1px solid rgba(30,34,39,0.18)',
      padding: '16px 20px',
      background: '#fff',
    }}>
      <div style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ ...mono, fontSize: 28, color: '#1E2227', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const keys   = Object.keys(rows[0])
  const header = keys.join(',')
  const body   = rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')).join('\n')
  const blob   = new Blob([header + '\n' + body], { type: 'text/csv' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── VastuPro funnel ──────────────────────────────────────────────────────────

function VastuFunnel({ reg, ana, dl }: { reg: number; ana: number; dl: number }) {
  const max = reg || 1
  const steps = [
    { label: 'REGISTERED', count: reg, color: '#1F4E79' },
    { label: 'ANALYSED',   count: ana, color: '#14532D' },
    { label: 'DOWNLOADED', count: dl,  color: '#8C3A22' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map(({ label, count, color }) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', alignItems: 'center', gap: 12 }}>
          <span style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          <div style={{ height: 20, background: 'rgba(30,34,39,0.06)', border: '1px solid rgba(30,34,39,0.1)' }}>
            <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: color, opacity: 0.85 }} />
          </div>
          <span style={{ ...mono, fontSize: 14, color, textAlign: 'right' }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── VastuPro tab ─────────────────────────────────────────────────────────────

function VastuTab({ stats }: { stats: VastuStats }) {
  const csvRows = stats.recentReports.map(r => ({
    Name: r.name, Mobile: r.mobile, City: r.city, Status: r.status, Date: r.createdAt,
  }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Total Registrations" value={stats.totalRegistrations} />
        <StatCard label="Total Analyses"       value={stats.totalAnalyses} sub={`${stats.totalRegistrations ? Math.round((stats.totalAnalyses / stats.totalRegistrations) * 100) : 0}% of reg.`} />
        <StatCard label="Total Downloads"      value={stats.totalDownloads}  sub={`${stats.totalRegistrations ? Math.round((stats.totalDownloads / stats.totalRegistrations) * 100) : 0}% of reg.`} />
        <StatCard label="PDF Reports"          value={stats.totalPDFs} />
      </div>

      {/* Funnel */}
      <Section title="REGISTRATION FUNNEL — CL. 2.0">
        <VastuFunnel reg={stats.totalRegistrations} ana={stats.totalAnalyses} dl={stats.totalDownloads} />
      </Section>

      {/* City distribution */}
      <Section title="CITY DISTRIBUTION — CL. 3.0">
        <CityChart data={stats.cityDistribution} />
      </Section>

      {/* Most placed rooms + critical issues — side by side on wide screens */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Section title="MOST PLACED ROOMS — CL. 4.0">
          {!stats.mostPlacedRooms.length
            ? <EmptyNote />
            : <RankTable rows={stats.mostPlacedRooms.map(r => ({ label: r.room, count: r.count }))} />
          }
        </Section>
        <Section title="MOST COMMON CRITICAL ISSUES — CL. 5.0">
          {!stats.mostCriticalIssues.length
            ? <EmptyNote />
            : <RankTable rows={stats.mostCriticalIssues.map(r => ({ label: r.label, count: r.count }))} />
          }
        </Section>
      </div>

      {/* Recent reports */}
      <Section title="RECENT REGISTRATIONS — CL. 6.0" action={
        <ExportBtn onClick={() => exportCSV(csvRows, 'vastupro-registrations.csv')} />
      }>
        <VastuTable rows={stats.recentReports} />
      </Section>
    </div>
  )
}

// ── Paid tool tab ─────────────────────────────────────────────────────────────

function PaidTab({ stats }: { stats: PaidStats }) {
  const csvRows = stats.recentReports.map(r => ({
    Name: r.name, Mobile: r.mobile, City: r.city, Project: r.project,
    'Total Estimate (₹)': r.totalEstimate, Paid: r.paid ? 'Yes' : 'No', Date: r.createdAt,
  }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Total Estimates"   value={stats.totalEstimates} />
        <StatCard label="Total Paid"        value={stats.totalPaid} />
        <StatCard label="Conversion Rate"   value={`${stats.conversionRate}%`} />
        <StatCard label="PDF Reports"       value={stats.totalPDFs} />
        <StatCard label="Avg. Est. Value"   value={fmtINR(stats.avgEstimateValue)} sub="standard grade" />
      </div>

      {/* City distribution */}
      <Section title="CITY DISTRIBUTION — CL. 2.0">
        <CityChart data={stats.cityDistribution} />
      </Section>

      {/* Recent reports */}
      <Section title="RECENT REPORTS — CL. 3.0" action={
        <ExportBtn onClick={() => exportCSV(csvRows as unknown as Record<string, unknown>[], 'reports.csv')} />
      }>
        <PaidTable rows={stats.recentReports} />
      </Section>
    </div>
  )
}

// ── Small shared components ───────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid rgba(30,34,39,0.12)', paddingBottom: 8 }}>
        <span style={{ ...mono, fontSize: 11, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function EmptyNote() {
  return <p style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.35)', fontStyle: 'italic' }}>No data yet — will populate as users complete analyses.</p>
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ ...mono, fontSize: 11, border: '1px solid rgba(30,34,39,0.25)', background: 'none', color: '#1E2227', padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.04em' }}
    >
      Export CSV
    </button>
  )
}

function RankTable({ rows }: { rows: Array<{ label: string; count: number }> }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.07)' }}>
            <td style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.35)', padding: '6px 8px 6px 0', width: 28 }}>{i + 1}</td>
            <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '6px 8px 6px 0' }}>{r.label}</td>
            <td style={{ ...mono, fontSize: 13, color: '#1F4E79', textAlign: 'right', padding: '6px 0' }}>{r.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function VastuTable({ rows }: { rows: VastuRecentRow[] }) {
  if (!rows.length) return <EmptyNote />
  const STATUS_COLOR: Record<string, string> = {
    registered: '#1F4E79',
    analysed:   '#14532D',
    downloaded: '#8C3A22',
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(30,34,39,0.2)' }}>
            {['Name', 'Mobile', 'City', 'Status', 'Date'].map(h => (
              <th key={h} style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', padding: '0 10px 8px 0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
              <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.6)', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.mobile}</td>
              <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.city}</td>
              <td style={{ ...mono, fontSize: 11, padding: '8px 10px 8px 0' }}>
                <span style={{ color: STATUS_COLOR[r.status] ?? '#1E2227', border: `1px solid ${STATUS_COLOR[r.status] ?? '#1E2227'}`, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>
                  {r.status}
                </span>
              </td>
              <td style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.4)', padding: '8px 0', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaidTable({ rows }: { rows: PaidRecentRow[] }) {
  if (!rows.length) return <EmptyNote />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(30,34,39,0.2)' }}>
            {['Name', 'Mobile', 'City', 'Project', 'Est. Value', 'Paid', 'Date'].map(h => (
              <th key={h} style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', padding: '0 10px 8px 0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(30,34,39,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.02)' }}>
              <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{ ...mono, fontSize: 12, color: 'rgba(30,34,39,0.6)', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.mobile}</td>
              <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{r.city}</td>
              <td style={{ ...mono, fontSize: 12, color: '#1E2227', padding: '8px 10px 8px 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.project}</td>
              <td style={{ ...mono, fontSize: 12, color: '#1F4E79', padding: '8px 10px 8px 0', whiteSpace: 'nowrap' }}>{fmtINR(r.totalEstimate)}</td>
              <td style={{ ...mono, fontSize: 11, padding: '8px 10px 8px 0' }}>
                {r.paid
                  ? <span style={{ color: '#14532D', border: '1px solid #14532D', padding: '2px 6px', fontSize: 10 }}>PAID</span>
                  : <span style={{ color: 'rgba(30,34,39,0.35)', border: '1px solid rgba(30,34,39,0.2)', padding: '2px 6px', fontSize: 10 }}>UNPAID</span>
                }
              </td>
              <td style={{ ...mono, fontSize: 11, color: 'rgba(30,34,39,0.4)', padding: '8px 0', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab,  setActiveTab]  = useState<Tab>('vastupro')
  const [cache,      setCache]      = useState<Partial<Record<Tab, ToolStats>>>({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchStats = useCallback(async (tab: Tab) => {
    if (cache[tab]) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/admin/stats?tool=${tab}`)
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setCache(prev => ({ ...prev, [tab]: data }))
    } catch {
      setError('Could not load data. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [cache])

  useEffect(() => { fetchStats(activeTab) }, [activeTab, fetchStats])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab)
  }

  const stats = cache[activeTab]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F0' }}>
      {/* Header */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 12 }}>DRG NO. NS-ADM</span>
          <span style={{ ...serif, fontSize: 18, color: '#F4F4F0', fontWeight: 700 }}>Admin Dashboard</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ ...mono, fontSize: 11, border: '1px solid rgba(244,244,240,0.2)', color: 'rgba(244,244,240,0.6)', background: 'none', padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}
        >
          Log Out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(30,34,39,0.12)', padding: '0 28px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(({ id, label }) => {
          const active = id === activeTab
          return (
            <button
              key={id}
              onClick={() => switchTab(id)}
              style={{
                ...mono,
                fontSize:        12,
                padding:         '12px 18px',
                background:      'none',
                border:          'none',
                borderBottom:    active ? '2px solid #1F4E79' : '2px solid transparent',
                color:           active ? '#1F4E79' : 'rgba(30,34,39,0.45)',
                cursor:          'pointer',
                letterSpacing:   '0.04em',
                whiteSpace:      'nowrap',
                marginBottom:    -1,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
        {loading && (
          <div style={{ ...mono, fontSize: 13, color: 'rgba(30,34,39,0.4)', textAlign: 'center', padding: 60 }}>
            Loading…
          </div>
        )}
        {error && !loading && (
          <div style={{ ...mono, fontSize: 13, color: '#8C3A22', textAlign: 'center', padding: 60 }}>
            {error}
          </div>
        )}
        {!loading && !error && stats && (
          <>
            {activeTab === 'vastupro'
              ? <VastuTab stats={stats as VastuStats} />
              : <PaidTab  stats={stats as PaidStats}  />
            }
          </>
        )}
      </div>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('adminSession')?.value !== 'valid') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tool = request.nextUrl.searchParams.get('tool') ?? ''
  const supabase = createServiceClient()

  if (tool === 'vastupro') {
    return NextResponse.json(await getVastuStats(supabase))
  }

  const PAID = ['structopro', 'masonpro', 'electropro', 'plumbpro', 'interiorpro']
  if (!PAID.includes(tool)) {
    return NextResponse.json({ error: 'Invalid tool' }, { status: 400 })
  }
  return NextResponse.json(await getPaidStats(supabase, tool))
}

async function getVastuStats(supabase: ReturnType<typeof createServiceClient>) {
  const { data: contactsRaw } = await supabase
    .from('contacts')
    .select('id, name, mobile, city, status, created_at')
    .eq('source', 'VastuPro')
    .order('created_at', { ascending: false })
  const contacts = contactsRaw ?? []

  const totalRegistrations = contacts.length
  const totalAnalyses      = contacts.filter(c => ['analysed', 'downloaded'].includes(c.status)).length
  const totalDownloads     = contacts.filter(c => c.status === 'downloaded').length

  const cityMap: Record<string, number> = {}
  contacts.forEach(c => {
    const city = c.city || 'Unknown'
    cityMap[city] = (cityMap[city] || 0) + 1
  })
  const cityDistribution = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const { data: vastuEstimatesRaw } = await supabase
    .from('estimates')
    .select('id, result_data, created_at')
    .eq('app_type', 'vastupro')
  const estimates = vastuEstimatesRaw ?? []

  const roomCounts: Record<string, number>    = {}
  const criticalMap: Record<string, number>   = {}
  estimates.forEach(e => {
    const findings: Array<{ roomLabel: string; zoneName: string; severity: string }> =
      (e.result_data as Record<string, unknown> | null)?.findings as never[] ?? []
    findings.forEach(f => {
      roomCounts[f.roomLabel] = (roomCounts[f.roomLabel] || 0) + 1
      if (f.severity === 'CRITICAL') {
        const key = `${f.roomLabel} → ${f.zoneName}`
        criticalMap[key] = (criticalMap[key] || 0) + 1
      }
    })
  })

  const mostPlacedRooms = Object.entries(roomCounts)
    .map(([room, count]) => ({ room, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const mostCriticalIssues = Object.entries(criticalMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  let totalPDFs = 0
  if (estimates.length > 0) {
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .in('estimate_id', estimates.map(e => e.id))
    totalPDFs = count ?? 0
  }

  const recentReports = contacts.slice(0, 20).map(c => ({
    name:      c.name      || '—',
    mobile:    c.mobile    || '—',
    city:      c.city      || '—',
    status:    c.status    || 'registered',
    createdAt: c.created_at,
  }))

  return {
    totalRegistrations,
    totalAnalyses,
    totalDownloads,
    totalPDFs,
    cityDistribution,
    mostPlacedRooms,
    mostCriticalIssues,
    recentReports,
  }
}

async function getPaidStats(supabase: ReturnType<typeof createServiceClient>, tool: string) {
  const { data: estimatesRaw } = await supabase
    .from('estimates')
    .select('id, contact_id, project_name, city, state, status, result_data, created_at')
    .eq('app_type', tool)
    .order('created_at', { ascending: false })
  const estimates = estimatesRaw ?? []

  const totalEstimates = estimates.length
  const totalPaid      = estimates.filter(e => e.status === 'paid').length
  const conversionRate = totalEstimates > 0 ? Math.round((totalPaid / totalEstimates) * 100) : 0

  const cityMap: Record<string, number> = {}
  estimates.forEach(e => {
    const city = e.city || 'Unknown'
    cityMap[city] = (cityMap[city] || 0) + 1
  })
  const cityDistribution = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const paidEstimates = estimates.filter(e => e.status === 'paid')
  const avgEstimateValue = paidEstimates.length > 0
    ? Math.round(
        paidEstimates.reduce((sum, e) => {
          const rd = e.result_data as Record<string, unknown> | null
          const gt = rd?.grandTotal as Record<string, number> | undefined
          return sum + (gt?.standard ?? 0)
        }, 0) / paidEstimates.length
      )
    : 0

  let totalPDFs = 0
  if (estimates.length > 0) {
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .in('estimate_id', estimates.map(e => e.id))
    totalPDFs = count ?? 0
  }

  const recentSlice   = estimates.slice(0, 20)
  const contactIds    = [...new Set(recentSlice.map(e => e.contact_id).filter(Boolean))]
  let contactMap: Record<string, { name: string; mobile: string }> = {}
  if (contactIds.length > 0) {
    const { data: contactsRaw2 } = await supabase
      .from('contacts')
      .select('id, name, mobile')
      .in('id', contactIds)
    contactMap = Object.fromEntries((contactsRaw2 ?? []).map(c => [c.id, c]))
  }

  const recentReports = recentSlice.map(e => {
    const c  = contactMap[e.contact_id] ?? {}
    const rd = e.result_data as Record<string, unknown> | null
    const gt = rd?.grandTotal as Record<string, number> | undefined
    return {
      name:          (c as Record<string, string>).name   || '—',
      mobile:        (c as Record<string, string>).mobile || '—',
      city:          e.city         || '—',
      project:       e.project_name || '—',
      totalEstimate: gt?.standard   ?? 0,
      paid:          e.status === 'paid',
      createdAt:     e.created_at,
    }
  })

  return {
    totalEstimates,
    totalPaid,
    conversionRate,
    totalPDFs,
    avgEstimateValue,
    cityDistribution,
    recentReports,
  }
}

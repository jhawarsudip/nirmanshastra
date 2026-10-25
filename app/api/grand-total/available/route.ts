import { NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { PHASES, phaseByAppType, type PhaseKey } from '@/lib/qty/grand'
import { SQFT_TO_M2 } from '@/lib/qty/util'

// GET /api/grand-total/available
// The visitor's own paid quantity reports, grouped by project. Nothing here is a quantity:
// only which phases exist, for how many floors and how much floor area. The visitor already knows these, they typed them.
// Who is asking is decided by the session, never by anything in the request.

export const runtime = 'nodejs'

interface PhaseEntry { key: PhaseKey; label: string; short: string; stage: string; estimateId: string; floors: number; builtUpM2: number; createdAt: string }
interface Group { projectKey: string; projectName: string; where: string; floors: number; builtUpM2: number; newest: string; phases: Map<PhaseKey, PhaseEntry> }

export async function GET() {
  try {
    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ signedIn: false, projects: [], older: 0 })

    const supabase = createServiceClient()
    const statuses = PAYMENT_BYPASS ? ['paid', 'complete'] : ['paid']
    const { data, error } = await supabase
      .from('estimates')
      .select('id, app_type, project_id, project_name, state, city, input_data, created_at')
      .eq('user_id', user.id)
      .in('app_type', PHASES.map(p => p.appType))
      .in('status', statuses)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Grand Total available: query failed', error)
      return NextResponse.json({ error: 'We could not look up your reports. Please try again.' }, { status: 500 })
    }

    const groups = new Map<string, Group>()
    let older = 0
    for (const e of data ?? []) {
      const def = phaseByAppType(e.app_type)
      const inp = e.input_data as { engine?: string; floorAreasSqft?: unknown; state?: string; city?: string } | null
      const areas = Array.isArray(inp?.floorAreasSqft) ? (inp!.floorAreasSqft as unknown[]).map(Number) : []
      const ok = def && inp && (inp.engine === 'qty-v2' || inp.engine === 'trade-v1') && areas.length > 0 && areas.every(Number.isFinite)
      if (!def || !ok) { older++; continue }

      const projectName = (e.project_name ?? '').trim() || 'My project'
      const key = e.project_id ?? `name:${projectName.toLowerCase()}`
      const builtUpM2 = areas.reduce((s, a) => s + a, 0) * SQFT_TO_M2
      let g = groups.get(key)
      if (!g) {
        g = {
          projectKey: key,
          projectName,
          where: [(inp?.city ?? e.city ?? '').toString().trim(), (inp?.state ?? e.state ?? '').toString().trim()].filter(Boolean).join(', '),
          floors: areas.length,
          builtUpM2,
          newest: e.created_at,
          phases: new Map(),
        }
        groups.set(key, g)
      }
      if (g.phases.has(def.key)) continue // newest first: keep the latest report of each phase
      g.phases.set(def.key, { key: def.key, label: def.label, short: def.short, stage: def.stage, estimateId: e.id, floors: areas.length, builtUpM2, createdAt: e.created_at })
    }

    const projects = [...groups.values()]
      .map(g => ({
        projectKey: g.projectKey,
        projectName: g.projectName,
        where: g.where,
        floors: g.floors,
        builtUpM2: Math.round(g.builtUpM2),
        phases: PHASES.map(p => g.phases.get(p.key)).filter((x): x is PhaseEntry => !!x).map(x => ({ ...x, builtUpM2: Math.round(x.builtUpM2) })),
        newest: g.newest,
      }))
      .sort((a, b) => b.phases.length - a.phases.length || (a.newest < b.newest ? 1 : -1))

    return NextResponse.json({ signedIn: true, projects, older })
  } catch (err) {
    console.error('Grand Total available error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

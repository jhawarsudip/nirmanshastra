import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { buildGrand, disagreement, phaseByAppType, type PhaseSource } from '@/lib/qty/grand'
import { loadPhase } from '@/lib/qty/grand-server'

// POST /api/grand-total/create-estimate  { selectedEstimateIds: string[] }
// Saves a Grand Total estimate that links the chosen paid phase reports, and returns the free summary.
// The reports must belong to the visitor's own session: who is asking is never read from the request body.
// The quantities are added only when the Grand Total itself is paid for (see ../report).

export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const ids: unknown = body?.selectedEstimateIds
    if (!Array.isArray(ids) || ids.some(i => typeof i !== 'string')) return bad('Choose the reports to add together.')
    const selected = [...new Set(ids as string[])]
    if (selected.length < 2) return bad('Choose at least two reports to add together.')
    if (selected.length > 5) return bad('There are only five phases.')

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return bad('We could not find your session. Open the report from the same browser you bought it in, or log in.', 401)

    const supabase = createServiceClient()
    const statuses = PAYMENT_BYPASS ? ['paid', 'complete'] : ['paid']
    const { data: estimates, error } = await supabase
      .from('estimates')
      .select('id, app_type, project_id, project_name, state, city, contact_id, input_data, result_data, status')
      .in('id', selected)
      .eq('user_id', user.id)
      .in('status', statuses)
    if (error) {
      console.error('Grand Total create-estimate: query failed', error)
      return bad('We could not check your reports. Please try again.', 500)
    }
    if (!estimates || estimates.length !== selected.length) return bad('We could not find all of those reports on your account, or one has not been paid for.', 404)

    // One report per phase.
    const types = estimates.map(e => e.app_type)
    if (new Set(types).size !== types.length || types.some(t => !phaseByAppType(t))) return bad('Choose one report for each phase.')

    // Each report is read the way the Grand Total will read it, so a report that cannot be read is found now, before payment.
    const srcs: PhaseSource[] = []
    for (const e of estimates) {
      const r = loadPhase(e)
      if (!r.ok) return bad(r.error, 422)
      srcs.push(r.src)
    }

    // The same building: same project when every report names one, then the same floors, state and floor area.
    const projectIds = estimates.map(e => e.project_id).filter((p): p is string => !!p)
    if (projectIds.length === estimates.length && new Set(projectIds).size > 1) return bad('These reports are for different projects. Pick the reports of one project.', 422)
    const mismatch = disagreement(srcs)
    if (mismatch) return bad(mismatch, 422)

    const { free } = buildGrand(srcs)
    const sortedIds = [...selected].sort()
    const first = estimates[0]
    const projectName = `Grand Total: ${(first.project_name ?? '').trim() || 'My project'}`
    const projectId = projectIds.length === estimates.length ? projectIds[0] : null

    // Look for this visitor's earlier Grand Totals with the same reports.
    const { data: earlier } = await supabase
      .from('estimates')
      .select('id, status, input_data')
      .eq('user_id', user.id)
      .eq('app_type', 'grandtotal')
      .order('created_at', { ascending: false })
      .limit(25)
    const match = (earlier ?? []).filter(g => {
      const ids2 = (g.input_data as { selectedEstimateIds?: string[] } | null)?.selectedEstimateIds
      return Array.isArray(ids2) && [...ids2].sort().join(',') === sortedIds.join(',')
    })
    if (match.some(g => g.status === 'paid')) {
      return bad('You already have a Grand Total for exactly these reports. Open it from Your reports, or add another phase and make a new one.', 409)
    }

    const input_data = { engine: 'grand-v1', selectedEstimateIds: sortedIds, phases: srcs.map(s => s.key) }
    const result_data = { engine: 'grand-v1', free }
    const reusable = match[0]
    if (reusable) {
      const { error: upErr } = await supabase.from('estimates').update({ input_data, result_data, project_name: projectName }).eq('id', reusable.id)
      if (upErr) {
        console.error('Grand Total create-estimate: update failed', upErr)
        return bad('We could not save your Grand Total. Please try again.', 500)
      }
      return NextResponse.json({ estimateId: reusable.id, free })
    }

    const { data: created, error: insErr } = await supabase
      .from('estimates')
      .insert({
        user_id: user.id,
        contact_id: first.contact_id ?? null,
        app_type: 'grandtotal',
        project_name: projectName,
        state: first.state ?? null,
        city: first.city ?? null,
        input_data,
        result_data,
        project_id: projectId,
        status: 'complete',
      })
      .select('id')
      .single()
    if (insErr || !created) {
      console.error('Grand Total create-estimate: insert failed', insErr)
      return bad('We could not save your Grand Total. Please try again.', 500)
    }
    return NextResponse.json({ estimateId: created.id, free })
  } catch (err) {
    console.error('Grand Total create-estimate error:', err)
    return bad('Something went wrong. Please try again.', 500)
  }
}

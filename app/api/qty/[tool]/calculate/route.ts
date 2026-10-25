import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'
import { modelFor } from '@/lib/qty/registry'
import { TRADE_META, isTradeSlug } from '@/lib/qty/meta'

// Runs a trade model on the server. The browser gets the FREE part only (counts, sizes, IS-code checks).
// Every quantity stays here until payment is verified (see ../report). The site is quantity-only.
export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params
    const model = isTradeSlug(tool) ? modelFor(tool) : null
    if (!model || !isTradeSlug(tool)) return bad('This tool is not available yet.', 404)
    const meta = TRADE_META[tool]

    const body = await req.json().catch(() => ({}))
    const { contactId, projectId } = body ?? {}
    if (typeof contactId !== 'string' || !contactId) return bad('Please start from the first step.')
    const projectName = typeof body?.projectName === 'string' && body.projectName.trim() ? body.projectName.trim().slice(0, 120) : 'My project'

    const parsed = model.parse(body?.input)
    if (!parsed.ok) return bad(parsed.error)
    const ran = model.run(parsed.input)
    if (!ran.ok) return bad(ran.error, 422)
    const free = ran.result.free

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    const supabase = createServiceClient()

    const input = parsed.input as { floorAreasSqft: number[]; state: string; city?: string }

    // Only the answers and the free summary are stored now. The paid quantities are produced, and frozen,
    // when the report is first unlocked.
    const { data, error } = await supabase
      .from('estimates')
      .insert({
        contact_id: contactId,
        user_id: user?.id ?? null,
        app_type: meta.appType,
        project_name: projectName,
        state: input.state,
        city: input.city ?? null,
        input_data: { engine: 'trade-v1', tool, ...parsed.input },
        result_data: { engine: 'trade-v1', tool, free },
        project_id: typeof projectId === 'string' && projectId ? projectId : null,
        status: 'complete',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error(`${meta.label} calculate: save failed`, error)
      return bad('We could not save your estimate. Please try again.', 500)
    }

    await supabase.from('contacts').update({ status: 'analysed' }).eq('id', contactId)
    return NextResponse.json({ estimateId: data.id, free })
  } catch (err) {
    console.error('Trade calculate error:', err)
    return bad('Something went wrong while calculating. Please try again.', 500)
  }
}

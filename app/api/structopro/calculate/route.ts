import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'
import { runQuantityModel, toFree, readInput } from '@/lib/structopro-qty'

// Runs the quantity model on the server. The browser gets the FREE part only (zone, grades, IS-code checks,
// the frame at a glance, a simplified 3D preview). No rupee figure and no quantity leaves before payment is
// verified (see ../report). The site is quantity-only.

export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, projectName, projectId } = body ?? {}
    const raw = body?.input ?? {}

    if (typeof contactId !== 'string' || !contactId) return bad('Please start from the registration step.')
    if (typeof projectName !== 'string' || !projectName.trim()) return bad('Project name is required.')

    const read = readInput(raw)
    if (!read.ok) return bad(read.error)
    const input = read.input
    const { state, city } = input

    const result = runQuantityModel(input)
    if (!result.ok) return bad(result.error, 422)

    const free = toFree(result)

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    const supabase = createServiceClient()

    // Only inputs and the free summary are stored now. The paid quantities are produced (and frozen) when the report is first unlocked.
    const { data, error } = await supabase
      .from('estimates')
      .insert({
        contact_id: contactId,
        user_id: user?.id ?? null,
        app_type: 'structopro',
        project_name: projectName,
        state,
        city: city || null,
        input_data: { engine: 'qty-v2', ...input },
        result_data: {
          engine: 'qty-v2',
          seismicZone: free.zone,
          totalBUA: Math.round(free.builtUpSqft),
          glance: free.glance,
        },
        project_id: projectId ?? null,
        status: 'complete',
      })
      .select('id')
      .single()

    if (error) {
      console.error('StructoPro calculate: save failed', error)
      return bad('We could not save your estimate. Please try again.', 500)
    }

    await supabase.from('contacts').update({ status: 'analysed' }).eq('id', contactId)

    return NextResponse.json({ estimateId: data.id, free })
  } catch (err) {
    console.error('StructoPro calculate error:', err)
    return bad('Something went wrong while calculating. Please try again.', 500)
  }
}

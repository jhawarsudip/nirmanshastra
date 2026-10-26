import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { PACK_APP_TYPE } from '@/lib/tool-pricing'

// First step of buying the Complete House Pack: who is buying and where the house is.
// This saves a contact and an unpaid pack record. The price is NOT read from the request: /api/payments/create-order
// looks it up on the server from the pack's app_type, like every other report.
export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : ''
    const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : ''
    const state = typeof body?.state === 'string' ? body.state.trim().slice(0, 80) : ''
    const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 80) : ''
    const projectName = typeof body?.projectName === 'string' && body.projectName.trim() ? body.projectName.trim().slice(0, 120) : 'My house'

    if (!name || !email || !state || !city) return bad('Name, email, state and city are needed.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email address.')

    let userId: string | null = null
    let mobile: string | null = null
    try {
      const authClient = await createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      userId = user?.id ?? null
      mobile = user?.user_metadata?.mobile || null
    } catch { /* not signed in: the pack is not tied to a session, the pack link is the key */ }

    const supabase = createServiceClient()
    const { data: contact, error: cErr } = await supabase
      .from('contacts')
      .insert({ name, mobile, email, city, state, source: 'Complete House Pack', status: 'registered' })
      .select('id')
      .single()
    if (cErr || !contact) {
      console.error('Pack register: contact insert failed', cErr)
      return bad('We could not save your details. Please try again.', 500)
    }

    const { data: pack, error: pErr } = await supabase
      .from('estimates')
      .insert({
        contact_id: contact.id,
        user_id: userId,
        app_type: PACK_APP_TYPE,
        project_name: projectName,
        state,
        city,
        input_data: { engine: 'pack-v1', name, state, city },
        result_data: { engine: 'pack-v1', rev: 0, claims: {} },
        status: 'complete',
      })
      .select('id')
      .single()
    if (pErr || !pack) {
      console.error('Pack register: pack insert failed', pErr)
      return bad('We could not save your details. Please try again.', 500)
    }

    return NextResponse.json({ packId: pack.id, contactId: contact.id, success: true })
  } catch (err) {
    console.error('Pack register error:', err)
    return bad('Something went wrong. Please try again.', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { scheduleEmailSequences } from '@/lib/email-sequences'
import { TRADE_META, isTradeSlug } from '@/lib/qty/meta'

// First step of a trade tool: who is asking and where the plot is. The project name is optional.
export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params
    if (!isTradeSlug(tool)) return bad('Unknown tool.', 404)
    const meta = TRADE_META[tool]

    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : ''
    const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : ''
    const state = typeof body?.state === 'string' ? body.state.trim().slice(0, 80) : ''
    const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 80) : ''

    if (!name || !email || !state || !city) return bad('Name, email, state and city are needed.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email address.')

    // The mobile number comes from the signed-in account when there is one.
    let mobile: string | null = null
    try {
      const authClient = await createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      mobile = user?.user_metadata?.mobile || null
    } catch { /* not signed in: the mobile stays empty */ }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('contacts')
      .insert({ name, mobile, email, city, state, source: meta.label, status: 'registered' })
      .select('id')
      .single()

    if (error || !data) {
      console.error(`${meta.label} register: insert failed`, error)
      return bad('We could not save your details. Please try again.', 500)
    }

    await scheduleEmailSequences(data.id, meta.appType, supabase)
    return NextResponse.json({ contactId: data.id, success: true })
  } catch (err) {
    console.error('Trade register error:', err)
    return bad('Something went wrong. Please try again.', 500)
  }
}

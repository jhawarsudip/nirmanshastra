import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'
import { scheduleEmailSequences } from '@/lib/email-sequences'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, state, city, propertyType, plotSize } = body

    if (!name || !email || !state || !city) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    let mobile: string | null = null
    try {
      const authClient = await createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      mobile = user?.user_metadata?.mobile || null
    } catch { /* unauthenticated — mobile stays null */ }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name,
        mobile,
        email,
        city,
        state,
        property_type: propertyType || null,
        plot_size:     plotSize     || null,
        source:        'VastuPro',
        status:        'registered',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 })
    }

    await scheduleEmailSequences(data.id, 'vastupro', supabase)

    return NextResponse.json({ contactId: data.id, success: true })
  } catch (err) {
    console.error('Register route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

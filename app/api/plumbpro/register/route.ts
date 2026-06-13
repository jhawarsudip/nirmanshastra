import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scheduleEmailSequences } from '@/lib/email-sequences'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, mobile, email, projectName, state, city, pinCode, address } = body

    if (!name || !mobile || !email || !projectName || !state || !city || !pinCode || !address) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name,
        mobile,
        email,
        address,
        city,
        pin_code: pinCode,
        state,
        source:   'PlumbPro',
        status:   'registered',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 })
    }

    await scheduleEmailSequences(data.id, 'plumbpro', supabase)

    return NextResponse.json({ contactId: data.id, success: true })
  } catch (err) {
    console.error('PlumbPro register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

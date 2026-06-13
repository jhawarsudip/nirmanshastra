import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, mobile, email, address, city, pinCode, state, propertyType, plotSize } = body

    if (!name || !mobile || !email || !city) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name,
        mobile,
        email,
        address: address || null,
        city,
        pin_code: pinCode || null,
        state: state || null,
        property_type: propertyType || null,
        plot_size: plotSize || null,
        source: 'VastuPro',
        status: 'registered',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 })
    }

    return NextResponse.json({ contactId: data.id, success: true })
  } catch (err) {
    console.error('Register route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

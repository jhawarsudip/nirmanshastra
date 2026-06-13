import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { contactId, status } = await req.json()
    if (!contactId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('contacts')
      .update({ status })
      .eq('id', contactId)
    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

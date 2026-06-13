import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('razorpay_order_id', orderId)
      .single()

    if (error || !data) {
      return NextResponse.json({ status: 'pending' })
    }

    return NextResponse.json({ status: data.status })
  } catch (err) {
    console.error('Payment status error:', err)
    return NextResponse.json({ status: 'pending' })
  }
}

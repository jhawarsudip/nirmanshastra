import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

// HMAC SHA256 verification — Build Reference Section 6.
// Key Secret used ONLY here, never exposed to client.
function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  if (!keySecret) return false
  const expected = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return expected === signature
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, estimateId } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !estimateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify HMAC SHA256 signature
    const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Update payment record
    const { error: payError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature:  razorpaySignature,
        status: 'success',
      })
      .eq('razorpay_order_id', razorpayOrderId)

    if (payError) {
      console.error('Payment update error:', payError)
    }

    // Update estimate status to 'paid' — quantities now authorised for reveal
    const { error: estError } = await supabase
      .from('estimates')
      .update({ status: 'paid' })
      .eq('id', estimateId)

    if (estError) {
      console.error('Estimate update error:', estError)
    }

    // Update contact status to 'paid'
    const { data: estimate } = await supabase
      .from('estimates')
      .select('contact_id')
      .eq('id', estimateId)
      .single()

    if (estimate?.contact_id) {
      await supabase
        .from('contacts')
        .update({ status: 'paid' })
        .eq('id', estimate.contact_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Verify payment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

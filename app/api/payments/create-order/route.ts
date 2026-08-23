import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { priceForAppType } from '@/lib/tool-pricing'

// Razorpay REST API — server-side only. Key Secret never exposed to client.
async function createRazorpayOrder(amount: number, receiptId: string) {
  const keyId     = process.env.RAZORPAY_KEY_ID!
  const keySecret = process.env.RAZORPAY_KEY_SECRET!

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt:  receiptId,
      notes: {
        source: 'NirmanShastra StructoPro',
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay API error: ${text}`)
  }

  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { estimateId } = body

    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId is required' }, { status: 400 })
    }

    // Validate estimate exists. The app_type on the estimate is the ONLY thing
    // that decides the charge — any `amount` sent by the client is ignored, so a
    // tampered request cannot lower (or change) the price.
    const supabase = createServiceClient()
    const { data: estimate, error: estError } = await supabase
      .from('estimates')
      .select('id, status, app_type')
      .eq('id', estimateId)
      .single()

    if (estError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    if (estimate.status === 'paid') {
      return NextResponse.json({ error: 'Estimate already paid' }, { status: 409 })
    }

    // Server-trusted price, derived from the estimate's tool type — never the client.
    const amount = priceForAppType(estimate.app_type)
    if (amount === null) {
      return NextResponse.json({ error: 'This estimate is not a paid product' }, { status: 400 })
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(amount, `SP-${estimateId.substring(0, 8)}`)

    // Save pending payment record
    const { error: payError } = await supabase
      .from('payments')
      .insert({
        estimate_id:        estimateId,
        razorpay_order_id:  order.id,
        amount,
        status: 'pending',
      })

    if (payError) {
      console.error('Payment insert error:', payError)
      // Non-fatal — continue
    }

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment order' },
      { status: 500 }
    )
  }
}

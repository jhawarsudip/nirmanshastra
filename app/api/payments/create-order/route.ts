import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { priceForAppType } from '@/lib/tool-pricing'
import { sanitizeAttribution, saveAttributionOnEstimate, type CleanAttribution } from '@/lib/analytics/attribution-server'

// Razorpay REST API — server-side only. Key Secret never exposed to client.
async function createRazorpayOrder(amount: number, receiptId: string, appType: string, attribution: CleanAttribution) {
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
        source: 'NirmanShastra',
        // which product this order is for, so the Razorpay dashboard tells a pack from a single report
        product: appType,
        // which reel, ad or link brought this sale (shown on the payment in the Razorpay dashboard)
        ...attribution,
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
    // campaign tags (utm_source / utm_medium / utm_campaign) from the visitor's first tagged visit; anything else is dropped
    const attribution = sanitizeAttribution(body?.attribution)

    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId is required' }, { status: 400 })
    }

    // Validate estimate exists. The app_type on the estimate is the ONLY thing
    // that decides the charge — any `amount` sent by the client is ignored, so a
    // tampered request cannot lower (or change) the price.
    const supabase = createServiceClient()
    const { data: estimate, error: estError } = await supabase
      .from('estimates')
      .select('id, status, app_type, contact_id')
      .eq('id', estimateId)
      .single()

    if (estError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    if (estimate.status === 'paid') {
      return NextResponse.json({ error: 'Estimate already paid' }, { status: 409 })
    }

    // The report is emailed to the contact on the estimate, so an estimate with no contact (name and email not given
    // yet) cannot be paid for: the customer would pay and have nowhere to receive the PDF.
    if (!estimate.contact_id) {
      return NextResponse.json({ error: 'Please add your name and email first, so we know where to send your report.' }, { status: 400 })
    }

    // Server-trusted price, derived from the estimate's tool type — never the client.
    const amount = priceForAppType(estimate.app_type)
    if (amount === null) {
      return NextResponse.json({ error: 'This estimate is not a paid product' }, { status: 400 })
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(amount, `SP-${estimateId.substring(0, 8)}`, estimate.app_type, attribution)

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
      // Fatal: /api/payments/verify matches the paid order to this estimate through this row.
      // Nothing has been charged yet, so stopping here is safe.
      console.error('Payment insert error:', payError)
      return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
    }

    // Keep the campaign tags with the estimate too (no database change: they go in its saved inputs). Never blocks the payment.
    await saveAttributionOnEstimate(supabase, estimateId, attribution)

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      // lets the page report the sale to analytics with the amount that was actually charged
      product:  estimate.app_type,
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

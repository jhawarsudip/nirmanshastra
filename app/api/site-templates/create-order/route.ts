import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  BUNDLE_ID,
  priceForProduct,
  titleForProduct,
} from '@/lib/site-templates'

// Razorpay REST API — server-side only. Key Secret never exposed to client.
// Modeled on app/api/payments/create-order/route.ts.
async function createRazorpayOrder(
  amount: number,
  receiptId: string,
  notes: Record<string, string>,
) {
  const keyId = process.env.RAZORPAY_KEY_ID!
  const keySecret = process.env.RAZORPAY_KEY_SECRET!

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: receiptId,
      notes,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Razorpay API error: ${text}`)
  }

  return res.json()
}

// POST /api/site-templates/create-order
// Body: { productId: string (one of 6 ids, or 'bundle'), email?: string }
// Amount is derived SERVER-SIDE from the catalog — never trusted from the client.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const productId: string = body.productId
    const email: string = typeof body.email === 'string' ? body.email.trim() : ''

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Server-trusted price: 6 products at ₹1,499 (149900 p), bundle at ₹6,999 (699900 p).
    const amount = priceForProduct(productId)
    if (amount === null) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
    }

    // Create Razorpay order — product carried in metadata (notes).
    const receiptId =
      productId === BUNDLE_ID ? 'ST-BUNDLE' : `ST-${productId.slice(0, 18)}`
    const order = await createRazorpayOrder(amount, receiptId, {
      source: 'NirmanShastra Site Templates',
      productId,
      productTitle: titleForProduct(productId),
    })

    // Record a pending purchase keyed by the order id. verify/ looks this row up
    // by razorpay_order_id so the delivered product is decided server-side
    // (the client cannot claim a bundle after paying for one toolkit).
    const supabase = createServiceClient()
    const { error: insErr } = await supabase.from('site_template_purchases').insert({
      email: email || null,
      product_id: productId,
      amount,
      razorpay_order_id: order.id,
      status: 'pending',
    })

    if (insErr) {
      console.error('Site template purchase insert error:', insErr)
      // Non-fatal — continue; verify falls back to order notes if the row is missing.
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Site template create-order error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment order' },
      { status: 500 },
    )
  }
}

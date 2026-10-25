import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { runQuantityModel, toFree, toPaid, legacyShape, savedInput, type QtyInput } from '@/lib/structopro-qty'

// The paid report. Nothing is returned until the estimate is marked paid on the server (after Razorpay HMAC
// verification in /api/payments/verify). The first successful call freezes the numbers into the estimate record,
// so the report the customer paid for never changes if the model is improved later.

export const runtime = 'nodejs'

function reRun(input: QtyInput) {
  const r = runQuantityModel(savedInput(input as unknown as Record<string, unknown>))
  if (!r.ok) throw new Error(r.error)
  return r
}

export async function GET(req: NextRequest) {
  try {
    const estimateId = req.nextUrl.searchParams.get('estimateId')
    if (!estimateId) return NextResponse.json({ error: 'estimateId is required' }, { status: 400 })

    const supabase = createServiceClient()
    const { data: est, error } = await supabase
      .from('estimates')
      .select('id, app_type, status, input_data, result_data')
      .eq('id', estimateId)
      .single()

    if (error || !est || est.app_type !== 'structopro') return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    const input = est.input_data as (QtyInput & { engine?: string }) | null
    if (!input || input.engine !== 'qty-v2') return NextResponse.json({ error: 'This estimate was made with an earlier version of the tool.' }, { status: 409 })

    if (est.status !== 'paid' && !PAYMENT_BYPASS) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    const prior = est.result_data as { engine?: string; paid?: unknown } | null
    const result = reRun(input)
    if (prior?.paid) return NextResponse.json({ report: prior.paid, free: toFree(result) })

    const report = toPaid(result)

    // Freeze the paid numbers (not in bypass mode, so a test run does not lock a half-tested model).
    if (est.status === 'paid') {
      const frozen = { ...(prior ?? {}), engine: 'qty-v2', ...legacyShape(result), paid: report }
      const { error: upErr } = await supabase.from('estimates').update({ result_data: frozen }).eq('id', estimateId)
      if (upErr) console.error('StructoPro report: could not freeze result', upErr)
    }

    return NextResponse.json({ report, free: toFree(result) })
  } catch (err) {
    console.error('StructoPro report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

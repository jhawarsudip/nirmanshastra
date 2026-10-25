import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { modelFor } from '@/lib/qty/registry'
import { TRADE_META, isTradeSlug } from '@/lib/qty/meta'
import type { TradePaid } from '@/lib/qty/types'

// The paid report of a trade tool. Nothing is returned until the estimate is marked paid on the server
// (after the Razorpay HMAC check in /api/payments/verify). The first successful call freezes the numbers
// into the estimate record, so the report the customer paid for never changes if the model is improved later.
export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function GET(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params
    const model = isTradeSlug(tool) ? modelFor(tool) : null
    if (!model || !isTradeSlug(tool)) return bad('This tool is not available yet.', 404)
    const meta = TRADE_META[tool]

    const estimateId = req.nextUrl.searchParams.get('estimateId')
    if (!estimateId) return bad('estimateId is required')

    const supabase = createServiceClient()
    const { data: est, error } = await supabase
      .from('estimates')
      .select('id, app_type, status, input_data, result_data')
      .eq('id', estimateId)
      .single()

    if (error || !est || est.app_type !== meta.appType) return bad('Estimate not found', 404)
    const input = est.input_data as { engine?: string } | null
    if (!input || input.engine !== 'trade-v1') return bad('This estimate was made with an earlier version of the tool.', 409)

    if (est.status !== 'paid' && !PAYMENT_BYPASS) return bad('Payment required', 402)

    // Work the model again from the saved answers: it is deterministic, and it gives the free part too.
    const parsed = model.parse(input)
    if (!parsed.ok) return bad(parsed.error, 422)
    const ran = model.run(parsed.input)
    if (!ran.ok) return bad(ran.error, 422)

    const prior = est.result_data as { paid?: TradePaid } | null
    if (prior?.paid) return NextResponse.json({ report: prior.paid, free: ran.result.free })

    const report = ran.result.paid

    // Freeze the paid numbers. Not done in bypass mode, so a test run cannot lock a half-tested model.
    if (est.status === 'paid') {
      const frozen = { ...(prior ?? {}), engine: 'trade-v1', tool, free: ran.result.free, paid: report }
      const { error: upErr } = await supabase.from('estimates').update({ result_data: frozen }).eq('id', estimateId)
      if (upErr) console.error(`${meta.label} report: could not freeze the result`, upErr)
    }

    return NextResponse.json({ report, free: ran.result.free })
  } catch (err) {
    console.error('Trade report error:', err)
    return bad('Internal server error', 500)
  }
}

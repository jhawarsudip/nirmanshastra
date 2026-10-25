import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { buildGrand, type GrandFree, type GrandPaid, type PhaseSource } from '@/lib/qty/grand'
import { loadPhase } from '@/lib/qty/grand-server'

// The paid Grand Total. Nothing is returned until the Grand Total is marked paid on the server (after the Razorpay
// HMAC check in /api/payments/verify). The first successful call freezes the combined list into the estimate record,
// so the report the customer paid for never changes if a model is improved later.

export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function GET(req: NextRequest) {
  try {
    const estimateId = req.nextUrl.searchParams.get('estimateId')
    if (!estimateId) return bad('estimateId is required')

    const supabase = createServiceClient()
    const { data: est, error } = await supabase
      .from('estimates')
      .select('id, app_type, status, user_id, input_data, result_data')
      .eq('id', estimateId)
      .single()
    if (error || !est || est.app_type !== 'grandtotal') return bad('Estimate not found', 404)

    const input = est.input_data as { engine?: string; selectedEstimateIds?: string[] } | null
    if (!input || input.engine !== 'grand-v1' || !Array.isArray(input.selectedEstimateIds)) return bad('This Grand Total was made with an earlier version of the tool.', 409)
    if (est.status !== 'paid' && !PAYMENT_BYPASS) return bad('Payment required', 402)

    const prior = est.result_data as { free?: GrandFree; paid?: GrandPaid } | null
    if (prior?.paid) return NextResponse.json({ report: prior.paid, free: prior.free })

    // The phase reports are read from the same owner's account, as they were when the Grand Total was made.
    const { data: rows, error: rowsErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, state, city, input_data, result_data')
      .in('id', input.selectedEstimateIds)
      .eq('user_id', est.user_id)
    if (rowsErr) {
      console.error('Grand Total report: query failed', rowsErr)
      return bad('We could not read your reports. Please try again.', 500)
    }
    if (!rows || rows.length !== input.selectedEstimateIds.length) return bad('One of the reports in this Grand Total could not be found.', 409)

    const srcs: PhaseSource[] = []
    for (const r of rows) {
      const loaded = loadPhase(r)
      if (!loaded.ok) return bad(loaded.error, 422)
      srcs.push(loaded.src)
    }

    const { free, paid } = buildGrand(srcs)

    // Freeze the combined list. Not done in bypass mode, so a test run cannot lock a half-tested model.
    if (est.status === 'paid') {
      const frozen = { ...(prior ?? {}), engine: 'grand-v1', free, paid }
      const { error: upErr } = await supabase.from('estimates').update({ result_data: frozen }).eq('id', estimateId)
      if (upErr) console.error('Grand Total report: could not freeze the result', upErr)
    }

    return NextResponse.json({ report: paid, free })
  } catch (err) {
    console.error('Grand Total report error:', err)
    return bad('Internal server error', 500)
  }
}

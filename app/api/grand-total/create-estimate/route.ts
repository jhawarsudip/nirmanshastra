import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/grand-total/create-estimate
// Creates a grandtotal estimate record that links selected phase estimate IDs.
// Called before opening the Razorpay payment for ₹999.
export async function POST(req: NextRequest) {
  try {
    const { selectedEstimateIds, userId } = await req.json()

    if (!selectedEstimateIds || !Array.isArray(selectedEstimateIds) || selectedEstimateIds.length < 2) {
      return NextResponse.json({ error: 'At least 2 estimates required' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify all selected estimates exist, are paid, and belong to this user
    const { data: estimates, error: estErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, result_data, contact_id')
      .in('id', selectedEstimateIds)
      .eq('user_id', userId)
      .eq('status', 'paid')

    if (estErr || !estimates || estimates.length < 2) {
      return NextResponse.json({ error: 'Could not verify estimates' }, { status: 400 })
    }

    // Compute combined grand totals
    let combinedBasic = 0, combinedStandard = 0, combinedPremium = 0
    const phaseBreakdown: { appType: string; basic: number; standard: number; premium: number }[] = []

    for (const est of estimates) {
      const gt = (est.result_data as { grandTotal?: { basic: number; standard: number; premium: number } } | null)?.grandTotal
      if (gt) {
        combinedBasic    += gt.basic
        combinedStandard += gt.standard
        combinedPremium  += gt.premium
        phaseBreakdown.push({ appType: est.app_type, basic: gt.basic, standard: gt.standard, premium: gt.premium })
      }
    }

    // Use the first estimate's contact_id
    const contactId = estimates[0]?.contact_id

    // Build project name from phase list
    const phaseNames = estimates.map(e => e.app_type).join(' + ')
    const projectName = `Grand Total — ${phaseNames}`

    const inputData = { selectedEstimateIds, phaseCount: estimates.length }
    const resultData = {
      combinedTotal: { basic: combinedBasic, standard: combinedStandard, premium: combinedPremium },
      phaseBreakdown,
    }

    // Check if a grandtotal estimate already exists for this user with the same selection
    const { data: existing } = await supabase
      .from('estimates')
      .select('id, status')
      .eq('user_id', userId)
      .eq('app_type', 'grandtotal')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing && existing.status !== 'paid') {
      // Reuse and update the unpaid estimate
      await supabase
        .from('estimates')
        .update({ input_data: inputData, result_data: resultData, project_name: projectName })
        .eq('id', existing.id)
      return NextResponse.json({ estimateId: existing.id })
    }

    // Create new grand total estimate
    const { data: newEst, error: insertErr } = await supabase
      .from('estimates')
      .insert({
        user_id:      userId,
        contact_id:   contactId ?? null,
        app_type:     'grandtotal',
        project_name: projectName,
        input_data:   inputData,
        result_data:  resultData,
        status:       'complete',
      })
      .select('id')
      .single()

    if (insertErr || !newEst) {
      console.error('Insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 })
    }

    return NextResponse.json({ estimateId: newEst.id })
  } catch (err) {
    console.error('create-estimate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

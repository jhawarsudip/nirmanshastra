import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redeemClaim } from '@/lib/pack/server'

// POST /api/pack/redeem  { packId, estimateId }
// Unlocks one report (or the Grand Total) with a paid Complete House Pack. All rules are in lib/pack/server.ts.
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const packId = typeof body?.packId === 'string' ? body.packId : ''
    const estimateId = typeof body?.estimateId === 'string' ? body.estimateId : ''
    if (!packId || !estimateId) return NextResponse.json({ error: 'packId and estimateId are required' }, { status: 400 })

    const r = await redeemClaim(createServiceClient(), packId, estimateId)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.code, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ success: true, already: r.already, status: r.status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Pack redeem error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

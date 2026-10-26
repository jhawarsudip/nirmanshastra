import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { statusOfPack } from '@/lib/pack/server'

// How many reports of each kind a pack can still unlock. Counts only: no report ids leave the server.
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const packId = req.nextUrl.searchParams.get('packId') ?? ''
    const status = await statusOfPack(createServiceClient(), packId)
    if (!status) return NextResponse.json({ error: 'We could not find that pack.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Pack status error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

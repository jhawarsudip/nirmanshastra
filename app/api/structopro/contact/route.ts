import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { attachContactToEstimate } from '@/lib/structopro-contact'
import { allow, clientKey } from '@/lib/throttle'

export const runtime = 'nodejs'

/*
  POST /api/structopro/contact: the name and email, given at the pay step or to save the project.
  The structure and the free frame preview are shown without them; this ties them to the estimate. A paid estimate is left alone.
*/
export async function POST(req: NextRequest) {
  try {
    if (!allow(`struct:contact:${clientKey(req)}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many tries. Please wait a little while and try again.' }, { status: 429 })
    }
    const body = await req.json().catch(() => ({}))
    const r = await attachContactToEstimate(createServiceClient(), { estimateId: body?.estimateId, email: body?.email, name: body?.name })
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.code })
    return NextResponse.json({ success: true, contactId: r.contactId })
  } catch (err) {
    console.error('StructoPro contact error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

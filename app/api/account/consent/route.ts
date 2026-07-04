import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const authClient = await createSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const value = body?.consent_material_partners
  if (typeof value !== 'boolean') {
    return NextResponse.json({ error: 'consent_material_partners must be a boolean' }, { status: 400 })
  }

  const service = createServiceClient()

  const { error: authErr } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, consent_material_partners: value },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  await service
    .from('users')
    .upsert({ id: user.id, consent_material_partners: value }, { onConflict: 'id' })

  return NextResponse.json({ ok: true })
}

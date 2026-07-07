import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const authClient = await createSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const cityValue = body?.consent_material_partners
  const contactValue = body?.consent_material_partners_contact

  const hasCity = typeof cityValue === 'boolean'
  const hasContact = typeof contactValue === 'boolean'

  if (!hasCity && !hasContact) {
    return NextResponse.json(
      { error: 'Provide consent_material_partners and/or consent_material_partners_contact as boolean' },
      { status: 400 },
    )
  }

  const metaUpdate: Record<string, boolean> = {}
  const dbUpdate: Record<string, boolean> = {}
  if (hasCity) { metaUpdate.consent_material_partners = cityValue; dbUpdate.consent_material_partners = cityValue }
  if (hasContact) { metaUpdate.consent_material_partners_contact = contactValue; dbUpdate.consent_material_partners_contact = contactValue }

  const service = createServiceClient()

  const { error: authErr } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, ...metaUpdate },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  await service
    .from('users')
    .upsert({ id: user.id, ...dbUpdate }, { onConflict: 'id' })

  return NextResponse.json({ ok: true })
}

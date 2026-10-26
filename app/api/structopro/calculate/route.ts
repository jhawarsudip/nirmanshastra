import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'
import { runQuantityModel, toFree, readInput } from '@/lib/structopro-qty'
import { cleanEmail, cleanMobile, cleanName, upsertContact } from '@/lib/contacts'
import { STRUCT_SEQUENCE_DAYS } from '@/lib/structopro-contact'

// Runs the quantity model on the server. The browser gets the FREE part only (zone, grades, IS-code checks,
// the frame at a glance, a simplified 3D preview). No rupee figure and no quantity leaves before payment is
// verified (see ../report). The site is quantity-only.

export const runtime = 'nodejs'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, projectName, projectId } = body ?? {}
    const raw = body?.input ?? {}

    // No contact is needed to see the structure: name and email are asked later, at payment or to save the project.
    // (An older page may still send one; it is kept.)
    if (contactId != null && typeof contactId !== 'string') return bad('That contact is not valid.')
    if (typeof projectName !== 'string' || !projectName.trim()) return bad('Project name is required.')

    const read = readInput(raw)
    if (!read.ok) return bad(read.error)
    const input = read.input
    const { state, city } = input

    const result = runQuantityModel(input)
    if (!result.ok) return bad(result.error, 422)

    const free = toFree(result)

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    const supabase = createServiceClient()

    // A signed-in visitor (not the silent anonymous session) already has a name and email: keep them as the contact.
    let contactRef: string | null = typeof contactId === 'string' && contactId ? contactId : null
    let fromAccount = false
    const accountEmail = user && !user.is_anonymous ? cleanEmail(user.email) : null
    if (!contactRef && accountEmail) {
      const meta = user?.user_metadata ?? {}
      const mobile = cleanMobile(typeof meta.mobile === 'string' ? meta.mobile : undefined)
      const saved = await upsertContact(supabase, {
        email: accountEmail,
        name: cleanName(meta.full_name || meta.name),
        mobile: mobile.ok ? mobile.value : null,
        city: city || null,
        state,
        source: 'StructoPro',
        status: 'analysed',
        sequence: { type: 'structopro', days: STRUCT_SEQUENCE_DAYS },
      })
      if (saved.ok) { contactRef = saved.id; fromAccount = true }
      else console.error('StructoPro calculate: could not keep the account contact', saved.error)
    }

    // Only inputs and the free summary are stored now. The paid quantities are produced (and frozen) when the report is first unlocked.
    const { data, error } = await supabase
      .from('estimates')
      .insert({
        contact_id: contactRef,
        user_id: user?.id ?? null,
        app_type: 'structopro',
        project_name: projectName,
        state,
        city: city || null,
        input_data: { engine: 'qty-v2', ...input },
        result_data: {
          engine: 'qty-v2',
          seismicZone: free.zone,
          totalBUA: Math.round(free.builtUpSqft),
          glance: free.glance,
        },
        project_id: projectId ?? null,
        status: 'complete',
      })
      .select('id')
      .single()

    if (error) {
      console.error('StructoPro calculate: save failed', error)
      return bad('We could not save your estimate. Please try again.', 500)
    }

    if (contactRef && !fromAccount) await supabase.from('contacts').update({ status: 'analysed' }).eq('id', contactRef)

    // `hasContact` tells the page whether to ask for a name and email before payment.
    return NextResponse.json({ estimateId: data.id, free, hasContact: !!contactRef, contactFromAccount: fromAccount })
  } catch (err) {
    console.error('StructoPro calculate error:', err)
    return bad('Something went wrong while calculating. Please try again.', 500)
  }
}

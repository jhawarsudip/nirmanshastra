import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'

// PATCH /api/projects/[id] — update shared fields of an existing project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Project id required' }, { status: 400 })

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const allowed = ['project_name', 'city', 'state', 'num_floors', 'per_floor_areas', 'site_condition']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' })
    }

    const supabase = createServiceClient()

    // Verify ownership before updating
    const { data: existing } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)

    if (error) {
      console.error('projects PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('projects PATCH exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

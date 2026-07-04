import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/projects — list logged-in user's projects
export async function GET() {
  try {
    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ projects: [] })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, city, state, num_floors, per_floor_areas, site_condition, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('projects GET error:', error)
      return NextResponse.json({ projects: [] })
    }

    return NextResponse.json({ projects: data ?? [] })
  } catch (err) {
    console.error('projects GET exception:', err)
    return NextResponse.json({ projects: [] })
  }
}

// POST /api/projects — create a new project for the logged-in user
export async function POST(req: NextRequest) {
  try {
    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const { projectName, city, state, numFloors, perFloorAreas, siteCondition } = body

    if (!projectName || !city || !state) {
      return NextResponse.json({ error: 'projectName, city and state are required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id:         user.id,
        project_name:    projectName,
        city,
        state,
        num_floors:      numFloors ?? null,
        per_floor_areas: perFloorAreas ?? null,
        site_condition:  siteCondition ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('projects POST error:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ projectId: data.id, success: true })
  } catch (err) {
    console.error('projects POST exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

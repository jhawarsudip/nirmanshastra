import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contactId, projectName, state, city, inputData, resultData } = body

    if (!contactId || !projectName || !inputData || !resultData) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const sessionClient = await createSupabaseClient()
    const { data: { user } } = await sessionClient.auth.getUser()

    const supabase = createServiceClient()

    const { projectId } = body

    const { data, error } = await supabase
      .from('estimates')
      .insert({
        contact_id:   contactId,
        user_id:      user?.id ?? null,
        app_type:     'structopro',
        project_name: projectName,
        state:        state || null,
        city:         city || null,
        input_data:   inputData,
        result_data:  resultData,
        project_id:   projectId ?? null,
        status:       'complete',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Save estimate error:', error)
      return NextResponse.json({ error: 'Failed to save estimate' }, { status: 500 })
    }

    // Update contact status to 'analysed'
    await supabase
      .from('contacts')
      .update({ status: 'analysed' })
      .eq('id', contactId)

    return NextResponse.json({ estimateId: data.id, success: true })
  } catch (err) {
    console.error('Save estimate route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { SupabaseClient } from '@supabase/supabase-js'

const SEQUENCE_DAYS = [0, 7, 45, 75, 120]

export async function scheduleEmailSequences(
  contactId: string,
  sequenceType: string,
  supabase: SupabaseClient
): Promise<void> {
  const now = new Date()

  const rows = SEQUENCE_DAYS.map((day) => {
    const scheduledAt = new Date(now)
    scheduledAt.setDate(scheduledAt.getDate() + day)
    return {
      contact_id: contactId,
      sequence_type: sequenceType.toLowerCase(),
      day_number: day,
      status: 'pending',
      scheduled_at: scheduledAt.toISOString(),
    }
  })

  const { error } = await supabase.from('email_sequences').insert(rows)
  if (error) {
    console.error(`Failed to schedule email sequences for ${sequenceType}:`, error)
  }
}

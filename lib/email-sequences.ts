import { SupabaseClient } from '@supabase/supabase-js'

export const SEQUENCE_DAYS = [0, 7, 45, 75, 120]

/**
 * Schedules the follow-up emails for a contact. `days` picks which of them (default: all five).
 * A contact who saved a StructurePro project but has not bought gets days 7 onward only: the day-0 email says "your report is ready".
 */
export async function scheduleEmailSequences(
  contactId: string,
  sequenceType: string,
  supabase: SupabaseClient,
  days: number[] = SEQUENCE_DAYS
): Promise<void> {
  const now = new Date()

  const rows = days.map((day) => {
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

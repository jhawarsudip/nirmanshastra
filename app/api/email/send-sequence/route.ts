import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { getEmailContent } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'reports@nirmanshastra.in'

// Vercel cron jobs call GET and attach Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()

  // Fetch all pending emails due now
  const { data: pending, error: fetchError } = await supabase
    .from('email_sequences')
    .select(`
      id,
      contact_id,
      sequence_type,
      day_number,
      contacts (
        name,
        email
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (fetchError) {
    console.error('Failed to fetch pending email sequences:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No pending emails' })
  }

  let sent = 0
  let failed = 0

  for (const row of pending) {
    const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts
    if (!contact?.email || !contact?.name) {
      await supabase
        .from('email_sequences')
        .update({ status: 'failed' })
        .eq('id', row.id)
      failed++
      continue
    }

    const content = getEmailContent(row.sequence_type, row.day_number, contact.name)
    if (!content) {
      // No template defined for this combination — mark as sent to avoid retrying
      await supabase
        .from('email_sequences')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      continue
    }

    try {
      const { error: sendError } = await resend.emails.send({
        from: `NirmanShastra <${FROM_EMAIL}>`,
        to: contact.email,
        subject: content.subject,
        html: content.html,
      })

      if (sendError) {
        console.error(`Resend error for sequence ${row.id}:`, sendError)
        await supabase
          .from('email_sequences')
          .update({ status: 'failed' })
          .eq('id', row.id)
        failed++
      } else {
        await supabase
          .from('email_sequences')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', row.id)
        sent++
      }
    } catch (err) {
      console.error(`Unexpected error sending sequence ${row.id}:`, err)
      await supabase
        .from('email_sequences')
        .update({ status: 'failed' })
        .eq('id', row.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: pending.length })
}

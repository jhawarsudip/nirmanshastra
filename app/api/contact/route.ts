import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'reports@nirmanshastra.in'
const FOUNDER_EMAIL = 'reports@nirmanshastra.in'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const nameStr = String(name).slice(0, 200)
    const emailStr = String(email).slice(0, 200)
    const subjectStr = String(subject).slice(0, 300)
    const messageStr = String(message).slice(0, 4000)

    const supabase = createServiceClient()
    await supabase.from('contacts').insert({
      name: nameStr,
      email: emailStr,
      source: 'contact_form',
      status: 'registered',
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: FOUNDER_EMAIL,
      subject: `[NirmanShastra Contact] ${subjectStr}`,
      html: `
        <p><strong>From:</strong> ${nameStr} &lt;${emailStr}&gt;</p>
        <p><strong>Subject:</strong> ${subjectStr}</p>
        <hr />
        <p>${messageStr.replace(/\n/g, '<br />')}</p>
      `,
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: emailStr,
      subject: 'We received your message — NirmanShastra',
      html: `
        <p>Hi ${nameStr},</p>
        <p>Thank you for reaching out. We have received your message and will reply within 24–48 hours on business days.</p>
        <p>— The NirmanShastra Team</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

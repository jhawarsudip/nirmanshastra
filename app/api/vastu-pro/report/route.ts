import React from 'react'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { Resend } from 'resend'
import VastuReportPDF from '@/lib/pdf/vastu-pdf'
import { readPlan } from '@/app/[locale]/tools/vastu-pro/vastu-reading'
import { parseVastuPlan } from '@/lib/vastu-plan'
import { cleanEmail, cleanName, upsertContact } from '@/lib/contacts'
import { allow, clientKey } from '@/lib/throttle'
import { createServiceClient } from '@/lib/supabase/server'
import { CONTACT_EMAIL } from '@/lib/site-contact'

export const runtime = 'nodejs'
// The findings PDF carries a calculation appendix; laying it out can take longer than the 10 s default.
export const maxDuration = 60

const HOUR = 60 * 60 * 1000

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function emailHtml(name: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nirmanshastra.in'
  const first = name.split(' ')[0]
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A2622;line-height:1.6;font-size:15px;">
<h2 style="font-size:21px;margin:0 0 14px;">Your Vastu findings are attached</h2>
<p style="margin:0 0 12px;">${first ? `Hello ${esc(first)},` : 'Hello,'}</p>
<p style="margin:0 0 12px;">The PDF has your plan turned to your North, every door and room you marked read against the old texts and today’s teachers, where each rule comes from, and what could be done about each concern if the plan can still change. There is no overall mark out of 100, because no text gives one.</p>
<p style="margin:0 0 12px;">It reads your plan against Vastu rules. It is not a structural or safety check, and neither Vastu nor this PDF says what will happen to anyone who lives there.</p>
<p style="margin:0 0 12px;">Once the layout is settled, the next question is how much material the frame needs. <a href="${esc(base)}/tools/structopro" style="color:#B5502D;">See your frame, free</a>: your earthquake zone, the concrete and steel grades, the IS-code checks and a 3D model.</p>
<p style="margin:18px 0 0;font-size:12px;color:#5B544B;">You asked for this PDF on nirmanshastra.in. We will send you a few construction tips after this. To stop them, write to ${esc(CONTACT_EMAIL)}. You can reply to this email with any question.</p>
</div>`
}

/*
  POST /api/vastu-pro/report: the free findings PDF, sent to the email the visitor gives and handed back to the page to save.
  The reading is on screen first and free; the email is asked only here, to send the PDF.
  The page sends the outline of the house, where North lies, where each door and room was drawn, and the email (the name is
  optional; no phone number is asked for). Every reading is worked out again here from the same rule table the page uses, so the PDF
  always agrees with the screen. The page never sends a verdict, and the plan is not stored.
  The visitor is saved as a contact once, by email address. A failure to save or to email never stops the PDF reaching them;
  the X-NS-Emailed header says whether the email went.
*/
export async function POST(req: NextRequest) {
  try {
    if (!allow(`vastu:ip:${clientKey(req)}`, 12, HOUR)) return bad('That is a lot of PDFs in a short time. Please try again in a little while.', 429)

    const body = await req.json().catch(() => ({}))

    const email = cleanEmail(body?.email)
    if (!email) return bad('Please enter a valid email address.')
    const name = cleanName(body?.name)

    const parsed = parseVastuPlan(body)
    if (!parsed.ok) return bad(parsed.error)
    const { northDeg, house, items, doors } = parsed.plan

    const reading = readPlan({ house, northDeg, items, doors })
    const date = new Date()
    // The date printed on the report is the Indian date, so the id and file name use it too.
    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date).replace(/-/g, '')
    const reportId = `VP-${stamp}-${randomBytes(2).toString('hex').toUpperCase()}`

    const buffer = await renderToBuffer(
      React.createElement(VastuReportPDF, { name, reportId, date, northDeg, house, items, doors, reading }) as React.ReactElement<DocumentProps>,
    )
    const fileName = `VastuPro-findings-${stamp}.pdf`

    // Save the lead and send the email. Neither may stop the download.
    let emailed = false
    if (allow(`vastu:email:${email}`, 3, HOUR)) {
      try {
        const saved = await upsertContact(createServiceClient(), {
          email,
          name,
          source: 'VastuPro',
          status: 'downloaded',
          sequence: { type: 'vastupro' },
        })
        if (!saved.ok) console.error('VastuPro report: contact not saved', saved.error)
      } catch (e) {
        console.error('VastuPro report: contact step failed', e)
      }

      const from = process.env.RESEND_FROM_EMAIL
      if (process.env.RESEND_API_KEY && from) {
        try {
          const sent = await new Resend(process.env.RESEND_API_KEY).emails.send({
            from,
            to: email,
            replyTo: CONTACT_EMAIL,
            subject: `Your Vastu findings (PDF), ${reportId}`,
            html: emailHtml(name),
            attachments: [{ filename: fileName, content: buffer }],
          })
          if (sent.error) console.error('VastuPro report: email failed', sent.error)
          else emailed = true
        } catch (e) {
          console.error('VastuPro report: email threw', e)
        }
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
        'X-NS-Emailed': emailed ? '1' : '0',
      },
    })
  } catch (err) {
    console.error('VastuPro report error:', err)
    return bad('We could not make the PDF. Please try again.', 500)
  }
}

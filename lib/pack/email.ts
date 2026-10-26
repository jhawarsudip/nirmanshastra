/*
  The "your pack is ready" email. Sent once, from the server, right after the pack's payment is verified
  (see app/api/payments/verify/route.ts). The link in it carries the pack id, so the pack still works if the
  buyer opens it on another phone or computer.
*/

import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { PACK_CLAIMS_PER_REPORT, PACK_CONTAINS, PRICE } from '@/lib/tool-pricing'
import { PACK_LABEL, PACK_TOOL_PATH, readPackState } from './shared'
import { emailAssuranceHtml } from '../email-parts'
import { CONTACT_EMAIL } from '../site-contact'

type Db = ReturnType<typeof createServiceClient>

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildPackEmail(rawName: string, packId: string): string {
  const name = esc(rawName || 'there')
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nirmanshastra.in'
  const open = `${base}/tools/complete-house-pack?pack=${encodeURIComponent(packId)}`
  const rows = PACK_CONTAINS.map(k => `<li><a href="${esc(base)}${PACK_TOOL_PATH[k]}?pack=${encodeURIComponent(packId)}" style="color:#B5502D;">${esc(PACK_LABEL[k])}</a></li>`).join('\n                      ')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your Complete House Pack</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EC;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EC;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FAF6EC;border:1px solid #2A2622;max-width:580px;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #2A2622;">
          <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#B5502D;letter-spacing:2px;">NIRMANSHASTRA</p>
          <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
        </td></tr>
        <tr><td style="padding:28px 28px 20px;">
          <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">PAYMENT RECEIVED</p>
          <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#2A2622;font-weight:700;">Your Complete House Pack is ready</h1>
          <p style="margin:0 0 14px;font-size:14px;color:#2A2622;line-height:1.6;">Dear ${name},</p>
          <p style="margin:0 0 14px;font-size:14px;color:#2A2622;line-height:1.6;">
            Thank you. The pack (${esc(PRICE.pack)}) unlocks all five quantity reports and the Grand Total for one house.
            Open each tool as usual, enter your house, and press <strong>Use my Complete House Pack</strong> instead of paying.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
            <td style="background:#F2E9D8;border:1px solid #B5502D;padding:14px 20px;">
              <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#B5502D;letter-spacing:1px;">YOUR PACK UNLOCKS:</p>
              <ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:#2A2622;line-height:1.8;">
                      ${rows}
              </ul>
            </td>
          </tr></table>
          <p style="margin:0 0 14px;font-size:13px;color:#2A2622;line-height:1.6;">
            A pack covers one house. Each report can be made up to ${PACK_CLAIMS_PER_REPORT} times, so you can correct a figure you typed wrongly.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
            <a href="${esc(open)}" target="_blank" style="display:inline-block;background:#B5502D;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px;">Open my pack</a>
          </td></tr></table>
          <p style="margin:0 0 6px;font-size:12px;color:#888;line-height:1.6;">Keep this email. The link above is how your pack is found if you open it on another phone or computer:</p>
          <p style="margin:0 0 20px;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;color:#B5502D;word-break:break-all;">${esc(open)}</p>
          ${emailAssuranceHtml({ feedback: false })}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E4DAC6;background:#FAF6EC;">
          <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
            NirmanShastra &middot; India&apos;s IS-code construction quantities platform<br/>
            These reports count quantities for planning. They are not a substitute for drawings by a licensed professional.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Sends the pack email once. Never throws: a failed email must not undo a verified payment. */
export async function sendPackEmailOnce(db: Db, packId: string): Promise<void> {
  try {
    const { data: pack } = await db.from('estimates').select('id, contact_id, result_data').eq('id', packId).maybeSingle()
    if (!pack) return
    const state = readPackState(pack.result_data)
    if (state.emailSentAt) return
    if (!pack.contact_id) return
    const { data: contact } = await db.from('contacts').select('name, email').eq('id', pack.contact_id).maybeSingle()
    if (!contact?.email) return
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.error('[NS-PACK-EMAIL] RESEND_API_KEY or RESEND_FROM_EMAIL is not set; the pack email was not sent for pack', packId)
      return
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const sent = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: contact.email,
      replyTo: CONTACT_EMAIL,
      subject: 'Your Complete House Pack is ready',
      html: buildPackEmail(contact.name ?? '', packId),
    })
    if (sent.error) {
      console.error(`[NS-PACK-EMAIL] pack email FAILED for ${contact.email}. Resend error:`, sent.error)
      return
    }
    // Remember it was sent. Skipped quietly if a claim changed the pack at the same moment: the worst case is one repeat.
    await db.from('estimates')
      .update({ result_data: { ...state, emailSentAt: new Date().toISOString() } })
      .eq('id', packId)
      .eq('result_data->>rev', String(state.rev))
  } catch (err) {
    console.error('[NS-PACK-EMAIL] pack email error:', err)
  }
}

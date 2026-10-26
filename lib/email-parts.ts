/*
  Pieces shared by the report emails: the "did it help?" question and the refund promise.
  Plain strings of HTML with inline styles (email clients ignore stylesheets). Wording comes from lib/policy.ts.
*/

import { FEEDBACK_QUESTION, FEEDBACK_REQUEST, REFUND_SHORT_EN } from './policy'

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The block at the foot of a report-ready email.
 * `feedback` adds the question people reply to. The pack's purchase email leaves it out: no report exists to judge yet.
 */
export function emailAssuranceHtml(opts: { feedback: boolean }): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nirmanshastra.in'
  return `<hr style="border:none;border-top:1px solid #E4DAC6;margin:20px 0;"/>
              ${opts.feedback ? `<p style="margin:0 0 10px;font-size:13px;color:#2A2622;line-height:1.6;"><strong>${esc(FEEDBACK_QUESTION)}</strong> ${esc(FEEDBACK_REQUEST)}</p>` : ''}
              <p style="margin:0 0 6px;font-size:12px;color:#5B544B;line-height:1.6;">${esc(REFUND_SHORT_EN)} <a href="${esc(base)}/refund-policy" style="color:#B5502D;text-decoration:underline;">Refund policy</a></p>`
}

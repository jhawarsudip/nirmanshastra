/*
  The "your report is ready" email for the trade tools. One template, filled from the tool's meta.
  Quantities only: nothing here mentions a price of work or a rate.
*/

import type { TradeMeta } from './meta'
import { emailAssuranceHtml } from '../email-parts'

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildTradeEmail(meta: Pick<TradeMeta, 'label' | 'heading' | 'tag' | 'includes' | 'next'>, rawName: string, reportId: string, pdfUrl: string): string {
  const name = esc(rawName || 'there')
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nirmanshastra.in'
  const includes = meta.includes.map(i => `<li>${esc(i)}</li>`).join('\n                      ')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your ${esc(meta.label)} report</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EC;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EC;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FAF6EC;border:1px solid #2A2622;max-width:580px;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #2A2622;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#B5502D;letter-spacing:2px;">NIRMANSHASTRA</p>
                    <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;border:1px solid #B5502D;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#B5502D;">${esc(meta.tag)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#2A2622;font-weight:700;">Your ${esc(meta.label)} report is ready</h1>
              <p style="margin:0 0 14px;font-size:14px;color:#2A2622;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-size:14px;color:#2A2622;line-height:1.6;">
                Thank you for using ${esc(meta.label)}. Your ${esc(meta.heading.toLowerCase())} report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${esc(reportId)}</strong>) is ready to download.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#F2E9D8;border:1px solid #B5502D;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#B5502D;letter-spacing:1px;">YOUR REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:#2A2622;line-height:1.8;">
                      ${includes}
                    </ul>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${esc(pdfUrl)}" target="_blank" style="display:inline-block;background:#B5502D;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px;">
                      Download the PDF report
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;color:#888;line-height:1.6;">If the button does not work, copy this link into your browser:</p>
              <p style="margin:0 0 20px;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;color:#B5502D;word-break:break-all;">${esc(pdfUrl)}</p>
              <hr style="border:none;border-top:1px solid #E4DAC6;margin:20px 0;"/>
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NEXT STEP</p>
              <p style="margin:0 0 10px;font-size:13px;color:#2A2622;line-height:1.6;">${esc(meta.next.text)}</p>
              <a href="${esc(base)}${esc(meta.next.href)}" style="font-size:13px;color:#B5502D;text-decoration:underline;">Open ${esc(meta.next.name)} &rarr;</a>
              ${emailAssuranceHtml({ feedback: true })}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #E4DAC6;background:#FAF6EC;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-code construction quantities platform<br/>
                This report counts quantities for planning. It is not a substitute for drawings by a licensed professional.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

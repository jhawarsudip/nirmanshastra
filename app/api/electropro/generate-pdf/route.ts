import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import ElectroProPDF from '@/lib/pdf/electropro-pdf'
import type { ContactInfo } from '@/lib/pdf/electropro-pdf'
import type { ElectroInput, ElectroResult } from '@/app/tools/electropro/electropro-engine'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/electropro/generate-pdf
// Verifies estimate is 'paid' server-side before generating PDF.
export async function POST(req: NextRequest) {
  console.log('PDF generation starting, bypass mode: true')
  try {
    const { estimateId } = await req.json()
    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Fetch estimate — must be 'paid'
    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('id, project_name, input_data, result_data, status, contact_id')
      .eq('id', estimateId)
      .single()

    if (estErr || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }
    if (!PAYMENT_BYPASS && estimate.status !== 'paid') {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 403 })
    }

    // 2. Fetch contact
    const { data: contact, error: contErr } = await supabase
      .from('contacts')
      .select('name, email, mobile, address, city, state')
      .eq('id', estimate.contact_id)
      .single()

    if (contErr || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const contactInfo: ContactInfo = {
      name:    contact.name    ?? '',
      email:   contact.email   ?? '',
      mobile:  contact.mobile  ?? '',
      address: contact.address ?? '',
      city:    contact.city    ?? '',
      state:   contact.state   ?? '',
    }

    const input       = estimate.input_data  as ElectroInput
    const result      = estimate.result_data as ElectroResult
    const reportId    = `NS-EP-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My Project'

    // 3. Generate PDF
    let pdfBuffer: Buffer
    try {
      const pdfElement = React.createElement(ElectroProPDF, {
        input,
        result,
        contact: contactInfo,
        reportId,
        projectName,
        date: new Date(),
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(pdfElement as any)
    } catch (pdfErr) {
      console.error('PDF render error:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      console.error('PDF render stack:', pdfErr instanceof Error ? pdfErr.stack : '')
      console.error('PDF input snapshot:', JSON.stringify(input, null, 2).slice(0, 2000))
      console.error('PDF result snapshot:', JSON.stringify(result, null, 2).slice(0, 2000))
      return NextResponse.json({ error: 'PDF generation failed — estimate data may be malformed' }, { status: 500 })
    }

    // 4. Ensure storage bucket
    const { error: bucketErr } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760,
    })
    if (bucketErr && !bucketErr.message.includes('already exists') && !bucketErr.message.includes('already exist')) {
      console.error('Bucket creation error:', bucketErr.message)
    }

    // 5. Upload PDF
    const storagePath = `electropro/${estimateId}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    // 6. Get public URL
    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(storagePath)
    const pdfUrl = urlData.publicUrl

    // 7. Upsert reports table
    const { error: reportErr } = await supabase
      .from('reports')
      .upsert({
        estimate_id:    estimateId,
        pdf_url:        pdfUrl,
        email_sent:     false,
        download_count: 0,
      }, { onConflict: 'estimate_id' })

    if (reportErr) {
      console.error('Report table upsert error:', reportErr)
    }

    // 8. Send email via Resend
    let emailSent = false
    if (contactInfo.email) {
      try {
        console.log('[NS-PDF-EMAIL] Attempting email send to:', contactInfo.email)
        console.log('[NS-PDF-EMAIL] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY)
        console.log('[NS-PDF-EMAIL] RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL)
        const emailResult = await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL!,
          to:      contactInfo.email,
          subject: `Your ElectricalPro Report is Ready — ${reportId}`,
          html:    buildEmailHtml(contactInfo.name, reportId, pdfUrl),
        })
        console.log('[NS-PDF-EMAIL] Email result:', JSON.stringify(emailResult))
        if (emailResult.error) {
          console.error('Resend error:', emailResult.error)
        } else {
          emailSent = true
          await supabase
            .from('reports')
            .update({ email_sent: true })
            .eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error('[NS-PDF-EMAIL] Email send exception:', emailEx)
        // Email failure is silent to user — PDF download still works
      }
    }

    // 9. Update contact status
    await supabase
      .from('contacts')
      .update({ status: 'downloaded' })
      .eq('id', estimate.contact_id)

    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('electropro generate-pdf error:', err instanceof Error ? err.message : err)
    console.error('electropro generate-pdf stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET /api/electropro/generate-pdf?estimateId=xxx
// Returns existing PDF URL if already generated.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estimateId = searchParams.get('estimateId')
  if (!estimateId) return NextResponse.json({ error: 'estimateId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('status')
    .eq('id', estimateId)
    .single()

  if (!PAYMENT_BYPASS && (!estimate || estimate.status !== 'paid')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { data: report } = await supabase
    .from('reports')
    .select('pdf_url')
    .eq('estimate_id', estimateId)
    .single()

  if (report?.pdf_url) {
    return NextResponse.json({ pdfUrl: report.pdf_url, success: true })
  }
  return NextResponse.json({ pdfUrl: null, success: false })
}

// ─── Email template — ElectricalPro D0 PDF + PlumbingPro cross-sell ──────────
function buildEmailHtml(name: string, reportId: string, pdfUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your ElectricalPro Report</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#F4F4F0;border:1px solid #1E2227;max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #1E2227;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#1F4E79;letter-spacing:2px;">NIRMANSHASTRA</p>
                    <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;border:1px solid #1F4E79;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;">PHASE 3 &middot; ELECTRICALPRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">Your ElectricalPro Report is Ready</h1>

              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
                Thank you for using NirmanShastra ElectricalPro. Your Phase 3 Electrical cost estimate report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready for download.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EBF0F7;border:1px solid #1F4E79;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;letter-spacing:1px;">10+ PAGE IS 732:2019 + IS 3043:2018 REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>Load analysis — point schedule by type and floor</li>
                      <li>Single line diagram (SLD) schematic</li>
                      <li>DB panel schedule — ways, MCB ratings, RCCB advisory</li>
                      <li>Floor-wise wiring schematic</li>
                      <li>Wire schedule — 1.5 to 10 sqmm (IS 694:2010)</li>
                      <li>Material schedule with CPWD labour rates</li>
                      <li>IS Compliance Panel — 8 checks (IS 732 + IS 3043)</li>
                      <li>Cost summary — Basic / Standard / Premium</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${pdfUrl}" target="_blank" style="display:inline-block;background:#8C3A22;color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px;">
                      Download PDF Report
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 20px;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;color:#1F4E79;word-break:break-all;">
                ${pdfUrl}
              </p>

              <hr style="border:none;border-top:1px solid #D0D2D4;margin:20px 0;"/>

              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NEXT STEP — PHASE 4</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Serif',Georgia,serif;font-size:16px;color:#1E2227;font-weight:600;">
                Electrical conduit is done. Now estimate your plumbing.
              </p>
              <p style="margin:0 0 12px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.6;">
                Plumbing must be coordinated with electrical conduit layout before plastering begins.
                Use PlumbingPro to estimate water demand (IS 1172:1993), tank sizes, pump HP,
                pipe schedule by diameter, and fixture counts — before your plumber quotes you.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border:1px solid #1E2227;padding:12px 16px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">PLUMBINGPRO PHASE 4 INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>IS 1172:1993 water demand calculation</li>
                      <li>Overhead + sump tank sizing</li>
                      <li>Pipe schedule — CPVC hot/cold + SWR drainage</li>
                      <li>Motor/pump HP recommendation</li>
                      <li>IS 4853:2004 + IS 12235 sanitary fixture schedule</li>
                      <li>CPWD labour (plumber + helper)</li>
                      <li>Contractor comparison table</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;">
                <a href="${appUrl}/tools/plumbpro" style="color:#1F4E79;text-decoration:underline;font-weight:600;">
                  Try PlumbingPro Phase 4 &rarr; Rs.499
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
                IS 732:2019 &middot; IS 3043:2018 &middot; IS 694:2010 &middot; IS 8828:2007<br/>
                This report is for estimation purposes only. Not a substitute for licensed engineer&apos;s drawings.
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

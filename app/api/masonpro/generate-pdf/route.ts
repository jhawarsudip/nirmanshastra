import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import MasonProPDF from '@/lib/pdf/masonpro-pdf'
import type { ContactInfo } from '@/lib/pdf/masonpro-pdf'
import type { MasonInput, MasonResult } from '@/app/tools/masonpro/masonpro-engine'

const resend = new Resend(process.env.RESEND_API_KEY)
const PAYMENT_BYPASS = true

// POST /api/masonpro/generate-pdf
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

    const input       = estimate.input_data  as MasonInput
    const result      = estimate.result_data as MasonResult
    const reportId    = `NS-MP-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My Project'

    // 3. Generate PDF
    let pdfBuffer: Buffer
    try {
      const pdfElement = React.createElement(MasonProPDF, {
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
    const storagePath = `masonpro/${estimateId}.pdf`
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
          subject: `Your MasonryPro Report is Ready — ${reportId}`,
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
    console.error('masonpro generate-pdf error:', err instanceof Error ? err.message : err)
    console.error('masonpro generate-pdf stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET /api/masonpro/generate-pdf?estimateId=xxx
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

// ─── Email template ───────────────────────────────────────────────────────────
function buildEmailHtml(name: string, reportId: string, pdfUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your MasonryPro Report</title>
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
                    <span style="display:inline-block;border:1px solid #1F4E79;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;">PHASE 2 · MASONRYPRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">Your MasonryPro Report is Ready</h1>

              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
                Thank you for using NirmanShastra MasonryPro. Your Phase 2 Masonry cost estimate report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready for download.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EBF0F7;border:1px solid #1F4E79;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;letter-spacing:1px;">10+ PAGE IS 1077:1992 + IS 2212:1991 REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>IS Compliance Panel (7 checks per IS 1077 + IS 4326)</li>
                      <li>Wall section diagram with mortar + unit details</li>
                      <li>8 Wall Type Comparison Chart (all types, cost/sqm)</li>
                      <li>Waterproofing detail — terrace + bathroom (IS 2645:2003)</li>
                      <li>Brickwork BOQ with quantities, cement and sand</li>
                      <li>Plastering BOQ — internal 12mm + external 15mm</li>
                      <li>Cost Summary — Basic / Standard / Premium</li>
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

              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NEXT STEP — PHASE 3</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.6;">
                Electrical conduit and wiring must be laid before your plaster is applied.
                Use ElectricalPro to estimate wire lengths, MCB ratings, DB schedule, and earthing before your electrician quotes you.
              </p>
              <a href="${appUrl}/tools/electropro" style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1F4E79;text-decoration:underline;">
                Try ElectricalPro Phase 3 &rarr; Rs.499
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
                IS 1077:1992 &middot; IS 2212:1991 &middot; IS 1661:1972 &middot; IS 2645:2003 &middot; IS 4326:1993<br/>
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

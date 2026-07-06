import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import InteriorProPDF from '@/lib/pdf/interiorpro-pdf'
import type { ContactInfo } from '@/lib/pdf/interiorpro-pdf'
import type { InteriorInput, InteriorResult } from '@/app/tools/interiorpro/interiorpro-engine'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/interiorpro/generate-pdf
// Verifies estimate is 'paid' server-side before generating PDF.
export async function POST(req: NextRequest) {
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

    const input       = estimate.input_data  as InteriorInput
    const result      = estimate.result_data as InteriorResult
    const reportId    = `NS-IP-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My Project'

    // 3. Generate PDF
    const pdfElement = React.createElement(InteriorProPDF, {
      input,
      result,
      contact: contactInfo,
      reportId,
      projectName,
      date: new Date(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // 4. Ensure storage bucket
    const { error: bucketErr } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760,
    })
    if (bucketErr && !bucketErr.message.includes('already exists') && !bucketErr.message.includes('already exist')) {
      console.error('Bucket creation error:', bucketErr.message)
    }

    // 5. Upload PDF
    const storagePath = `interiorpro/${estimateId}.pdf`
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

    // 8. Send email via Resend — InteriorPro: D0 PDF + Bundle cross-sell (Section 21)
    let emailSent = false
    if (contactInfo.email) {
      try {
        const { error: emailErr } = await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL!,
          to:      contactInfo.email,
          subject: `Your InteriorPro Report is Ready — ${reportId}`,
          html:    buildEmailHtml(contactInfo.name, reportId, pdfUrl),
        })
        if (emailErr) {
          console.error('Resend error:', emailErr)
        } else {
          emailSent = true
          await supabase
            .from('reports')
            .update({ email_sent: true })
            .eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error('Email send exception:', emailEx)
      }
    }

    // 9. Update contact status
    await supabase
      .from('contacts')
      .update({ status: 'downloaded' })
      .eq('id', estimate.contact_id)

    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('interiorpro generate-pdf error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET /api/interiorpro/generate-pdf?estimateId=xxx
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

// ─── Email template — InteriorPro D0 PDF + Bundle cross-sell (Section 21) ─────
function buildEmailHtml(name: string, reportId: string, pdfUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your InteriorPro Report</title>
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
                    <span style="display:inline-block;border:1px solid #1F4E79;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;">PHASE 5 &middot; INTERIORPRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">Your InteriorPro Report is Ready</h1>

              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
                Thank you for using NirmanShastra InteriorPro. Your Phase 5 Interior fit-out estimate report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready for download.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EBF0F7;border:1px solid #1F4E79;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;letter-spacing:1px;">9-PAGE IS-CODE INTERIOR REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>Grade comparison — Basic vs Standard vs Premium vs Luxury (IS 15477:2004)</li>
                      <li>Flooring schedule — tiles, adhesive bags, polymer grout (IS 15477:2004)</li>
                      <li>Paint schedule — primer + putty + emulsion coats (IS 2395:1994)</li>
                      <li>Room-by-room area and flooring cost breakdown</li>
                      <li>Kitchen running-foot estimate with CPWD carpentry rates</li>
                      <li>False ceiling — MS frame area + IS 277:2003 specification</li>
                      <li>Complete BOQ — materials + CPWD labour + overhead</li>
                      <li>Site Quality Control Checklist (12 items, IS codes)</li>
                      <li>Cost summary + contractor comparison</li>
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

              <!-- Bundle cross-sell — Section 21: InteriorPro D0 PDF + Bundle -->
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">COMPLETE YOUR BUILD ESTIMATE</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Serif',Georgia,serif;font-size:16px;color:#1E2227;font-weight:600;">
                Interior is done. Run the full NirmanShastra build estimate bundle.
              </p>
              <p style="margin:0 0 12px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.6;">
                Each phase of construction has hidden overcharging risks. NirmanShastra tools cover all 6 phases —
                from structure (StructurePro) to masonry, electrical, plumbing, and now interiors.
                Each report pays for itself the first time you catch a contractor overcharging.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border:1px solid #1E2227;padding:12px 16px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NIRMANSHASTRA PHASE TOOLS:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>Phase 1: StructurePro — RCC frame, beam-column, slab (IS 456:2000) — ₹999</li>
                      <li>Phase 2: MasonryPro — brickwork, plaster, block masonry (IS 1905:1987) — ₹699</li>
                      <li>Phase 3: ElectricalPro — wiring, DB, earthing, solar (IS 732:1989) — ₹499</li>
                      <li>Phase 4: PlumbingPro — water supply, drainage, tanks (IS 1742:1983) — ₹499</li>
                      <li>Phase 5: InteriorPro — flooring, paint, kitchen, false ceiling ✓ Done — ₹899</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;">
                <a href="${appUrl}/tools" style="color:#1F4E79;text-decoration:underline;font-weight:600;">
                  Explore All Phase Tools &rarr; nirmanshastra.in/tools
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
                IS 15477:2004 &middot; IS 2395:1994 &middot; IS 277:2003 &middot; IS 2645:2003 &middot; NBC 2016<br/>
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

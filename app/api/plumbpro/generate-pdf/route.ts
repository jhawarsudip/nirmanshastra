import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import PlumbProPDF from '@/lib/pdf/plumbpro-pdf'
import type { ContactInfo } from '@/lib/pdf/plumbpro-pdf'
import type { PlumbInput, PlumbResult } from '@/app/tools/plumbpro/plumbpro-engine'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/plumbpro/generate-pdf
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
    if (estimate.status !== 'paid') {
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

    const input       = estimate.input_data  as PlumbInput
    const result      = estimate.result_data as PlumbResult
    const reportId    = `NS-PP-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My Project'

    // 3. Generate PDF
    const pdfElement = React.createElement(PlumbProPDF, {
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
    const storagePath = `plumbpro/${estimateId}.pdf`
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

    // 8. Send email via Resend — PlumbPro: D0 PDF + InteriorPro cross-sell
    let emailSent = false
    if (contactInfo.email) {
      try {
        const { error: emailErr } = await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL!,
          to:      contactInfo.email,
          subject: `Your PlumbPro Report is Ready — ${reportId}`,
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
    console.error('plumbpro generate-pdf error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET /api/plumbpro/generate-pdf?estimateId=xxx
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

  if (!estimate || estimate.status !== 'paid') {
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

// ─── Email template — PlumbPro D0 PDF + InteriorPro cross-sell ───────────────
function buildEmailHtml(name: string, reportId: string, pdfUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmanshastra.in'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your PlumbPro Report</title>
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
                    <span style="display:inline-block;border:1px solid #1F4E79;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;">PHASE 4 &middot; PLUMBPRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">Your PlumbPro Report is Ready</h1>

              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
                Thank you for using NirmanShastra PlumbPro. Your Phase 4 Plumbing cost estimate report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready for download.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EBF0F7;border:1px solid #1F4E79;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;letter-spacing:1px;">9-PAGE IS 1172:1993 + IS 1742:1983 REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>Water demand calculation — IS 1172:1993 (daily demand, tank size, pump HP)</li>
                      <li>Water supply riser diagram — IS 1742:1983 pipe diameters</li>
                      <li>Drainage layout SVG — IS 1742:1983 mandatory slopes</li>
                      <li>Tank + pump schematic — IS 12701 food-grade HDPE</li>
                      <li>Pipe schedule — CPVC 25/32mm + SWR 75/110mm + uPVC 110mm</li>
                      <li>Fixture schedule — EWC, basins, sink, shower, taps, traps</li>
                      <li>Site Quality Control Checklist (10 items, IS codes)</li>
                      <li>Cost summary — Basic / Standard / Premium + contractor comparison</li>
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

              <!-- InteriorPro cross-sell — Section 21: PlumbPro D0 PDF + Interior -->
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NEXT STEP — PHASE 5</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Serif',Georgia,serif;font-size:16px;color:#1E2227;font-weight:600;">
                Plumbing is done. Now estimate your interior fit-out.
              </p>
              <p style="margin:0 0 12px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.6;">
                Interior work starts after plumbing inspection sign-off. Use InteriorPro to estimate
                flooring, kitchen, false ceiling, paint, and doors — with grade comparisons across
                Basic, Standard, Premium, and Luxury. Stop guessing. Get IS-code quantities.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border:1px solid #1E2227;padding:12px 16px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">INTERIORPRO PHASE 5 INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>IS-code flooring schedule — vitrified / natural stone / hardwood</li>
                      <li>Kitchen running-foot estimate — modular vs carpenter-made</li>
                      <li>False ceiling area + carpentry schedule</li>
                      <li>CPWD paint quantities — primer + putty + 2 coats</li>
                      <li>Door + window frame + shutter schedule</li>
                      <li>Grade × grade cost comparison (Basic → Luxury)</li>
                      <li>Contractor comparison table + overcharging risks</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;">
                <a href="${appUrl}/tools/interiorpro" style="color:#1F4E79;text-decoration:underline;font-weight:600;">
                  Try InteriorPro Phase 5 &rarr; Rs.499
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
                IS 1172:1993 &middot; IS 1742:1983 &middot; IS 12701 &middot; IS 15778:2007 &middot; NBC 2016 Part 9<br/>
                This report is for estimation purposes only. Not a substitute for licensed plumbing engineer&apos;s drawings.
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

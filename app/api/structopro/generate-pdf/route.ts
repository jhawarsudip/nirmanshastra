import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import StructoProQtyPDF from '@/lib/pdf/structopro-qty-pdf'
import { runQuantityModel, toPaid, savedInput, type PaidPayload, type QtyInput } from '@/lib/structopro-qty'
import { buildStructoCalc } from '@/lib/structopro-qty/calc'
import { SITE } from '@/lib/structopro-qty/sites'
import type { ContactInfo } from '@/lib/pdf/qty-kit'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { emailAssuranceHtml } from '@/lib/email-parts'
import { CONTACT_EMAIL } from '@/lib/site-contact'

// The report carries a calculation sheet of several dozen pages; laying it out takes longer than the 10 s default.
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/structopro/generate-pdf
// Called from ResultsPage after payment is confirmed.
// Verifies estimate is paid server-side before generating.
export async function POST(req: NextRequest) {
  try {
    const { estimateId } = await req.json()
    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Fetch estimate — must be in 'paid' status
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

    // 2. Fetch contact info
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

    if (!estimate.input_data || !estimate.result_data) {
      return NextResponse.json(
        { error: 'Estimate data incomplete — please recalculate and pay again' },
        { status: 400 }
      )
    }

    const reportId = `NS-SP-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My Project'

    // Only the quantities model (qty-v2) has a report. Estimates saved by the earlier thumb-rule engine are not rebuilt.
    const qtyInput = estimate.input_data as (QtyInput & { engine?: string }) | null
    if (qtyInput?.engine !== 'qty-v2') {
      return NextResponse.json({ error: 'This estimate was made with an earlier version of StructurePro. Please run it again.' }, { status: 410 })
    }

    // 3. Generate PDF buffer
    let pdfBuffer: Buffer
    try {
      let pdfElement: React.ReactElement
      {
        // Use the numbers frozen when the customer first opened the paid report; otherwise work them out again (deterministic).
        const frozen = (estimate.result_data as { paid?: PaidPayload } | null)?.paid
        let report = frozen
        if (!report) {
          const run = runQuantityModel(savedInput(qtyInput as unknown as Record<string, unknown>))
          if (!run.ok) return NextResponse.json({ error: run.error }, { status: 422 })
          report = toPaid(run)
        }
        // The calculation sheet is rebuilt from the saved answers and checked against the report as it will be printed.
        // If it cannot be made to agree, the report goes out without it rather than with working that does not match.
        const calc = buildStructoCalc(qtyInput, report)
        if (!calc) console.error(`[CRITICAL][NS-CALC] StructurePro calculation sheet was left out of report ${estimateId}: it did not reconcile with the report.`)
        pdfElement = React.createElement(StructoProQtyPDF, {
          calc,
          report,
          contact: contactInfo,
          reportId,
          projectName,
          date: new Date(),
          where: [qtyInput.city, qtyInput.state].filter(Boolean).join(', '),
          siteLabel: SITE[qtyInput.site ?? 'flat']?.label ?? 'Flat ground',
          wallLabel: qtyInput.wall === 'block' ? 'Concrete or AAC block walls' : 'Burnt clay brick walls',
        })
      }
      // renderToBuffer expects ReactElement<DocumentProps>; our component returns Document
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(pdfElement as any)
    } catch (pdfErr) {
      console.error('PDF render error:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      console.error('PDF render stack:', pdfErr instanceof Error ? pdfErr.stack : '')
      return NextResponse.json({ error: 'PDF generation failed — estimate data may be malformed' }, { status: 500 })
    }

    // 4. Ensure storage bucket exists (public — reports identified by UUID)
    const { error: bucketErr } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    })
    if (bucketErr && !bucketErr.message.includes('already exists') && !bucketErr.message.includes('already exist')) {
      console.error('Bucket creation error:', bucketErr.message)
    }

    // 5. Upload PDF to Supabase storage
    const storagePath = `structopro/${estimateId}.pdf`
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

    // 7. Save the report row. The table has no unique key on estimate_id, so look first, then update or insert
    //    (an ON CONFLICT upsert fails with 42P10 and the row, and the "already generated" lookup, were lost).
    const { data: existingRows, error: lookErr } = await supabase
      .from('reports')
      .select('id')
      .eq('estimate_id', estimateId)
      .limit(1)
    if (lookErr) console.error('Report table lookup error:', lookErr)
    const reportRow = { estimate_id: estimateId, pdf_url: pdfUrl, email_sent: false, download_count: 0 }
    const { error: reportErr } = existingRows && existingRows.length > 0
      ? await supabase.from('reports').update({ pdf_url: pdfUrl, email_sent: false }).eq('estimate_id', estimateId)
      : await supabase.from('reports').insert(reportRow)
    if (reportErr) {
      console.error('Report table write error:', reportErr)
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
          replyTo: CONTACT_EMAIL,
          subject: `Your StructurePro Report is Ready — ${reportId}`,
          html:    buildEmailHtml(contactInfo.name, reportId, pdfUrl),
        })
        console.log('[NS-PDF-EMAIL] Email result:', JSON.stringify(emailResult))
        if (emailResult.error) {
          console.error('[CRITICAL][NS-PDF-EMAIL] Report delivery email FAILED to', contactInfo.email, '— a guest user has no login to recover this later. Resend error:', emailResult.error)
        } else {
          emailSent = true
          await supabase
            .from('reports')
            .update({ email_sent: true })
            .eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error('[CRITICAL][NS-PDF-EMAIL] Report delivery email THREW for', contactInfo.email, '— a guest user has no login to recover this later:', emailEx)
        // Email may be a guest's only durable record. Failure is surfaced to the
        // user on-page (emailSent flag + GuestPurchaseNotice); PDF download still works.
      }
    }

    // 9. Update contact status to 'downloaded'
    await supabase
      .from('contacts')
      .update({ status: 'downloaded' })
      .eq('id', estimate.contact_id)

    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('generate-pdf error:', err instanceof Error ? err.message : err)
    console.error('generate-pdf stack:', err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET /api/structopro/generate-pdf?estimateId=xxx
// Returns existing PDF URL if already generated (avoids re-generation on page refresh).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estimateId = searchParams.get('estimateId')
  if (!estimateId) return NextResponse.json({ error: 'estimateId required' }, { status: 400 })

  const supabase = createServiceClient()

  // Verify paid
  const { data: estimate } = await supabase
    .from('estimates')
    .select('status')
    .eq('id', estimateId)
    .single()

  if (!PAYMENT_BYPASS && (!estimate || estimate.status !== 'paid')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { data: rows } = await supabase
    .from('reports')
    .select('pdf_url')
    .eq('estimate_id', estimateId)
    .limit(1)

  const found = rows?.[0]?.pdf_url
  if (found) {
    return NextResponse.json({ pdfUrl: found, success: true })
  }
  return NextResponse.json({ pdfUrl: null, success: false })
}

// ─── Email template ───────────────────────────────────────────────────────────
function escHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildEmailHtml(rawName: string, reportId: string, pdfUrl: string): string {
  const name = escHtml(rawName || 'there')
  const includes = ['Concrete, steel, cement, sand, aggregate and shuttering totals', 'Steel by bar diameter with 12 m bar counts', 'Column and beam sizes, bars and stirrups, floor by floor', 'IS code checks, assumptions and what is not counted', 'How far off the numbers can be']
  const includesHtml = includes.map(i => `<li>${i}</li>`).join('\n                      ')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your StructurePro Report</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EC;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EC;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FAF6EC;border:1px solid #2A2622;max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #2A2622;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#B5502D;letter-spacing:2px;">NIRMANSHASTRA</p>
                    <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;border:1px solid #B5502D;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#B5502D;">PHASE 1 · STRUCTUREPRO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#2A2622;font-weight:700;">Your StructurePro Report is Ready</h1>

              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#2A2622;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#2A2622;line-height:1.6;">
                Thank you for using NirmanShastra StructurePro. Your RCC frame quantities report
                (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready for download.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#F2E9D8;border:1px solid #B5502D;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#B5502D;letter-spacing:1px;">YOUR REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#2A2622;line-height:1.8;">
                      ${includesHtml}
                    </ul>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${pdfUrl}" target="_blank" style="display:inline-block;background:#B5502D;color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px;">
                      Download PDF Report
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 20px;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;color:#B5502D;word-break:break-all;">
                ${pdfUrl}
              </p>

              <hr style="border:none;border-top:1px solid #E4DAC6;margin:20px 0;"/>

              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">NEXT STEP — PHASE 2</p>
              <p style="margin:0 0 10px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#2A2622;line-height:1.6;">
                With the frame sized, MasonryPro works out the bricks or blocks and the mortar for the walls of the same building,
                so you can order them before the masons arrive on site.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tools/masonpro" style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#B5502D;text-decoration:underline;">
                Open MasonryPro for Phase 2 &rarr;
              </a>
              ${emailAssuranceHtml({ feedback: true })}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #E4DAC6;background:#FAF6EC;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-code construction quantities platform<br/>
                IS 456:2000 &middot; IS 13920 &middot; IS 1904 &middot; IS 1893 &middot; IS 875<br/>
                This report is for estimation purposes only. Not a substitute for licensed structural engineer&apos;s drawings.
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

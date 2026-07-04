import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import GrandTotalPDF from '@/lib/pdf/grand-total-pdf'
import type { ContactInfo, PhaseEstimate, GrandTotalData } from '@/lib/pdf/grand-total-pdf'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

const resend = new Resend(process.env.RESEND_API_KEY)

function fmtLakhs(n: number): string {
  if (n >= 10_000_000) return `Rs.${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `Rs.${(n / 100_000).toFixed(1)} L`
  return `Rs.${n.toLocaleString('en-IN')}`
}

const PHASE_ORDER = ['structopro', 'masonpro', 'electropro', 'plumbpro', 'interiorpro']

// POST /api/grand-total/generate-pdf
export async function POST(req: NextRequest) {
  try {
    const { estimateId } = await req.json()
    if (!estimateId) {
      return NextResponse.json({ error: 'estimateId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verify grand total estimate is paid
    const { data: gtEstimate, error: gtErr } = await supabase
      .from('estimates')
      .select('id, project_name, input_data, result_data, status, contact_id')
      .eq('id', estimateId)
      .eq('app_type', 'grandtotal')
      .single()

    if (gtErr || !gtEstimate) {
      return NextResponse.json({ error: 'Grand total estimate not found' }, { status: 404 })
    }
    if (!PAYMENT_BYPASS && gtEstimate.status !== 'paid') {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 403 })
    }

    // 2. Fetch contact info
    const { data: contact, error: contErr } = await supabase
      .from('contacts')
      .select('name, email, mobile, city, state')
      .eq('id', gtEstimate.contact_id)
      .single()

    if (contErr || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const contactInfo: ContactInfo = {
      name:   contact.name   ?? '',
      email:  contact.email  ?? '',
      mobile: contact.mobile ?? '',
      city:   contact.city   ?? '',
      state:  contact.state  ?? '',
    }

    // 3. Fetch all selected phase estimates
    const inputData = gtEstimate.input_data as { selectedEstimateIds?: string[] } | null
    const selectedIds = inputData?.selectedEstimateIds ?? []

    const { data: phaseEstimates, error: phErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, result_data')
      .in('id', selectedIds)
      .eq('status', 'paid')

    if (phErr || !phaseEstimates) {
      return NextResponse.json({ error: 'Failed to fetch phase estimates' }, { status: 500 })
    }

    // Sort phases in canonical order
    const phases: PhaseEstimate[] = PHASE_ORDER
      .map(key => phaseEstimates.find(e => e.app_type === key))
      .filter(Boolean)
      .map(e => ({
        appType:     e!.app_type,
        projectName: e!.project_name,
        resultData:  e!.result_data as Record<string, unknown>,
      }))

    const resultData = gtEstimate.result_data as GrandTotalData | null
    if (!resultData) {
      return NextResponse.json({ error: 'Result data missing' }, { status: 500 })
    }

    const reportId    = `NS-GT-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = gtEstimate.project_name ?? 'Master Project Report'

    // 4. Generate PDF
    const pdfElement = React.createElement(GrandTotalPDF, {
      contact:     contactInfo,
      reportId,
      projectName,
      date:        new Date(),
      phases,
      grandTotal:  resultData,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any)

    // 5. Upload to Supabase storage
    const { error: bucketErr } = await supabase.storage.createBucket('reports', { public: true, fileSizeLimit: 10485760 })
    if (bucketErr && !bucketErr.message.includes('already exist')) {
      console.error('Bucket error:', bucketErr.message)
    }

    const storagePath = `grandtotal/${estimateId}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(storagePath)
    const pdfUrl = urlData.publicUrl

    // 6. Upsert reports table
    await supabase
      .from('reports')
      .upsert({ estimate_id: estimateId, pdf_url: pdfUrl, email_sent: false, download_count: 0 }, { onConflict: 'estimate_id' })

    // 7. Send email
    let emailSent = false
    if (contactInfo.email) {
      try {
        const { error: emailErr } = await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL!,
          to:      contactInfo.email,
          subject: `Your Master Project Report is Ready — ${reportId}`,
          html:    buildEmailHtml(contactInfo.name, reportId, pdfUrl, resultData),
        })
        if (!emailErr) {
          emailSent = true
          await supabase.from('reports').update({ email_sent: true }).eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error('Email error:', emailEx)
      }
    }

    // 8. Update contact status
    if (gtEstimate.contact_id) {
      await supabase.from('contacts').update({ status: 'downloaded' }).eq('id', gtEstimate.contact_id)
    }

    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('grand-total generate-pdf error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// GET — return existing PDF if already generated
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estimateId = searchParams.get('estimateId')
  if (!estimateId) return NextResponse.json({ error: 'estimateId required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('status')
    .eq('id', estimateId)
    .eq('app_type', 'grandtotal')
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

function buildEmailHtml(name: string, reportId: string, pdfUrl: string, gtData: GrandTotalData): string {
  const std = fmtLakhs(gtData.combinedTotal.standard)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your Master Project Report</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#F4F4F0;border:1px solid #1E2227;max-width:580px;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #1E2227;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#1F4E79;letter-spacing:2px;">NIRMANSHASTRA</p>
                    <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;border:1px solid #8C3A22;padding:4px 10px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#8C3A22;">MASTER PROJECT REPORT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">REPORT READY</p>
              <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">Your Master Project Report is Ready</h1>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">Dear ${name},</p>
              <p style="margin:0 0 14px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
                Your Grand Total Master Project Report (<strong style="font-family:'IBM Plex Mono',Courier,monospace;">${reportId}</strong>) is ready.
                Combined Standard estimate: <strong style="font-family:'IBM Plex Mono',Courier,monospace;">${std}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="background:#EBF0F7;border:1px solid #1F4E79;padding:14px 20px;">
                    <p style="margin:0 0 4px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#1F4E79;letter-spacing:1px;">12-PAGE REPORT INCLUDES:</p>
                    <ul style="margin:8px 0 0;padding:0 0 0 18px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;color:#1E2227;line-height:1.8;">
                      <li>Phase-wise cost breakdown (Basic / Standard / Premium)</li>
                      <li>Construction Timeline Gantt chart</li>
                      <li>One summary page per included phase</li>
                      <li>Master Material Summary across all phases</li>
                      <li>Combined IS Code Compliance (all phases)</li>
                      <li>Complete Engineering Picture — phase interdependencies</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${pdfUrl}" target="_blank" style="display:inline-block;background:#8C3A22;color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px;">
                      Download Master Project Report
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;">
                If the button above does not work, copy this link into your browser:
              </p>
              <p style="margin:0 0 20px;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;color:#1F4E79;word-break:break-all;">${pdfUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
              <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
                NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
                This report is for estimation purposes only. Not a substitute for licensed structural engineer drawings.
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

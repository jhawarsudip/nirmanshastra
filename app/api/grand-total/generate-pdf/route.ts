import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import GrandTotalQtyPDF from '@/lib/pdf/grand-total-qty-pdf'
import type { ContactInfo } from '@/lib/pdf/qty-kit'
import { GRAND_META, buildGrand, type GrandFree, type GrandPaid, type PhaseSource } from '@/lib/qty/grand'
import { loadPhase } from '@/lib/qty/grand-server'
import { buildTradeEmail } from '@/lib/qty/email'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// POST /api/grand-total/generate-pdf { estimateId }: called by the page once the payment is confirmed.
// The Grand Total must be paid on the server (or the server must be in payment bypass) before anything is built.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const estimateId = body?.estimateId
    if (typeof estimateId !== 'string' || !estimateId) return bad('estimateId required')

    const supabase = createServiceClient()
    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, state, city, user_id, input_data, result_data, status, contact_id')
      .eq('id', estimateId)
      .single()
    if (estErr || !estimate || estimate.app_type !== 'grandtotal') return bad('Estimate not found', 404)
    if (!PAYMENT_BYPASS && estimate.status !== 'paid') return bad('Payment not verified', 403)

    const input = estimate.input_data as { engine?: string; selectedEstimateIds?: string[] } | null
    if (!input || input.engine !== 'grand-v1' || !Array.isArray(input.selectedEstimateIds)) return bad('This Grand Total was made with an earlier version of the tool. Please make a new one.', 409)

    const { data: contact, error: contErr } = await supabase
      .from('contacts')
      .select('name, email, mobile, address, city, state')
      .eq('id', estimate.contact_id)
      .single()
    if (contErr || !contact) return bad('Contact not found', 404)

    const contactInfo: ContactInfo = {
      name: contact.name ?? '',
      email: contact.email ?? '',
      mobile: contact.mobile ?? '',
      address: contact.address ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
    }

    // The list frozen when the customer first opened the report; otherwise add the phases again (deterministic).
    const prior = estimate.result_data as { paid?: GrandPaid; free?: GrandFree } | null
    let paid = prior?.paid
    let free = prior?.free
    if (!paid || !free) {
      const { data: rows, error: rowsErr } = await supabase
        .from('estimates')
        .select('id, app_type, project_name, state, city, input_data, result_data')
        .in('id', input.selectedEstimateIds)
        .eq('user_id', estimate.user_id)
      if (rowsErr || !rows || rows.length !== input.selectedEstimateIds.length) return bad('One of the reports in this Grand Total could not be found.', 409)
      const srcs: PhaseSource[] = []
      for (const r of rows) {
        const loaded = loadPhase(r)
        if (!loaded.ok) return bad(loaded.error, 422)
        srcs.push(loaded.src)
      }
      const built = buildGrand(srcs)
      paid = built.paid
      free = built.free
    }

    const reportId = `NS-${GRAND_META.code}-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = (estimate.project_name ?? 'My project').replace(/^Grand Total:\s*/i, '') || 'My project'
    const where = [estimate.city, estimate.state].filter(Boolean).join(', ')

    let pdfBuffer: Buffer
    try {
      const el = React.createElement(GrandTotalQtyPDF, { free, paid, contact: contactInfo, reportId, projectName, date: new Date(), where })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(el as any)
    } catch (pdfErr) {
      console.error('Grand Total PDF render error:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      return bad('The PDF could not be built.', 500)
    }

    // Public bucket, reports are named by their UUID.
    const { error: bucketErr } = await supabase.storage.createBucket('reports', { public: true, fileSizeLimit: 10485760 })
    if (bucketErr && !bucketErr.message.includes('already exist')) console.error('Bucket creation error:', bucketErr.message)

    const storagePath = `grandtotal/${estimateId}.pdf`
    const { error: uploadErr } = await supabase.storage.from('reports').upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return bad('The PDF could not be saved.', 500)
    }
    const pdfUrl = supabase.storage.from('reports').getPublicUrl(storagePath).data.publicUrl

    // The reports table has no unique key on estimate_id, so look first, then update or insert.
    const { data: existing, error: lookErr } = await supabase.from('reports').select('id').eq('estimate_id', estimateId).limit(1)
    if (lookErr) console.error('Report lookup error:', lookErr)
    const { error: reportErr } = existing && existing.length > 0
      ? await supabase.from('reports').update({ pdf_url: pdfUrl, email_sent: false }).eq('estimate_id', estimateId)
      : await supabase.from('reports').insert({ estimate_id: estimateId, pdf_url: pdfUrl, email_sent: false, download_count: 0 })
    if (reportErr) console.error('Report table write error:', reportErr)

    let emailSent = false
    if (contactInfo.email) {
      try {
        const sent = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: contactInfo.email,
          subject: `Your Grand Total report is ready — ${reportId}`,
          html: buildTradeEmail(GRAND_META, contactInfo.name, reportId, pdfUrl),
        })
        if (sent.error) {
          console.error(`[CRITICAL][NS-PDF-EMAIL] Grand Total delivery email FAILED for ${contactInfo.email}. A guest has no login to recover the report later. Resend error:`, sent.error)
        } else {
          emailSent = true
          await supabase.from('reports').update({ email_sent: true }).eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error(`[CRITICAL][NS-PDF-EMAIL] Grand Total delivery email THREW for ${contactInfo.email}:`, emailEx)
      }
    }

    await supabase.from('contacts').update({ status: 'downloaded' }).eq('id', estimate.contact_id)
    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('Grand Total generate-pdf error:', err instanceof Error ? err.message : err)
    return bad('PDF generation failed', 500)
  }
}

// GET /api/grand-total/generate-pdf?estimateId=...: the PDF if it was already built, so a page refresh does not build it again.
export async function GET(req: NextRequest) {
  const estimateId = req.nextUrl.searchParams.get('estimateId')
  if (!estimateId) return bad('estimateId required')

  const supabase = createServiceClient()
  const { data: estimate } = await supabase.from('estimates').select('status, app_type').eq('id', estimateId).single()
  if (!estimate || estimate.app_type !== 'grandtotal') return bad('Estimate not found', 404)
  if (!PAYMENT_BYPASS && estimate.status !== 'paid') return bad('Not authorised', 403)

  const { data: rows } = await supabase.from('reports').select('pdf_url').eq('estimate_id', estimateId).limit(1)
  const found = rows?.[0]?.pdf_url
  return NextResponse.json(found ? { pdfUrl: found, success: true } : { pdfUrl: null, success: false })
}

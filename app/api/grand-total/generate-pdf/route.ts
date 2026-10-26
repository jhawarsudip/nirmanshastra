import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import GrandTotalQtyPDF from '@/lib/pdf/grand-total-qty-pdf'
import type { ContactInfo } from '@/lib/pdf/qty-kit'
import { GRAND_META, buildGrand, type GrandFree, type GrandPaid, type PhaseSource } from '@/lib/qty/grand'
import { loadPhase } from '@/lib/qty/grand-server'
import { buildGrandCalcFromRows } from '@/lib/qty/grand-calc'
import type { CalcSheet } from '@/lib/calcsheet'
import { buildTradeEmail } from '@/lib/qty/email'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import { RUPEE_PDF_HEADERS, ratesRequest } from '@/lib/rates/server'

export const runtime = 'nodejs'
// The report now carries a calculation sheet of 20 to 40 pages; laying it out takes several seconds, longer than the 10 s default.
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// POST /api/grand-total/generate-pdf { estimateId }: called by the page once the payment is confirmed.
// The Grand Total must be paid on the server (or the server must be in payment bypass) before anything is built.
// With { estimateId, rates } (the customer's own rates) the same report is built with a rupee table and sent straight back: not stored, not emailed, rates not kept.
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

    // The reports in this Grand Total, as saved. They are needed twice: to add the phases again when no list was frozen, and to
    // rebuild the calculation sheet, which is checked against the list as it will be printed (frozen or fresh).
    const { data: rows, error: rowsErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, state, city, input_data, result_data')
      .in('id', input.selectedEstimateIds)
      .eq('user_id', estimate.user_id)
    const haveRows = !rowsErr && !!rows && rows.length === input.selectedEstimateIds.length

    // The list frozen when the customer first opened the report; otherwise add the phases again (deterministic).
    const prior = estimate.result_data as { paid?: GrandPaid; free?: GrandFree } | null
    let paid = prior?.paid
    let free = prior?.free
    if (!paid || !free) {
      if (!haveRows || !rows) return bad('One of the reports in this Grand Total could not be found.', 409)
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

    // The calculation sheet is rebuilt from the saved reports and reconciled with the list as it will be printed.
    // If it cannot be made to agree, the report goes out without it rather than with working that does not match.
    let calc: CalcSheet | null = null
    if (haveRows && rows) {
      try {
        calc = buildGrandCalcFromRows(rows, free, paid)
      } catch (calcErr) {
        console.error(`[NS-CALC] Grand Total calculation sheet threw for ${estimateId}:`, calcErr instanceof Error ? calcErr.message : calcErr)
      }
    }
    if (!calc) console.error(`[CRITICAL][NS-CALC] Grand Total calculation sheet was left out of report ${estimateId}: it did not reconcile with the report.`)

    const asked = ratesRequest(body?.rates, paid.lines)
    if (asked.kind === 'empty') return bad('Type at least one rate to put rupees in the PDF.')
    const rupees = asked.kind === 'ok' ? asked.result : null

    const reportId = `NS-${GRAND_META.code}-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = (estimate.project_name ?? 'My project').replace(/^Grand Total:\s*/i, '') || 'My project'
    const where = [estimate.city, estimate.state].filter(Boolean).join(', ')

    let pdfBuffer: Buffer
    try {
      const el = React.createElement(GrandTotalQtyPDF, { free, paid, contact: contactInfo, reportId, projectName, date: new Date(), where, calc, rupees })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(el as any)
    } catch (pdfErr) {
      console.error('Grand Total PDF render error:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      return bad('The PDF could not be built.', 500)
    }

    // The rupee copy goes back to this browser only. It never replaces the stored report or the emailed one.
    if (rupees) return new NextResponse(new Uint8Array(pdfBuffer), { headers: RUPEE_PDF_HEADERS('NirmanShastra-Grand-Total-Report-with-rupees.pdf') })

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
          replyTo: CONTACT_EMAIL,
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

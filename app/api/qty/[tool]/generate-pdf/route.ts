import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import QtyReportPDF from '@/lib/pdf/qty-report-pdf'
import type { ContactInfo } from '@/lib/pdf/qty-kit'
import { modelFor } from '@/lib/qty/registry'
import { TRADE_META, isTradeSlug } from '@/lib/qty/meta'
import { buildTradeEmail } from '@/lib/qty/email'
import type { TradeFree, TradePaid } from '@/lib/qty/types'
import type { CalcSheet } from '@/lib/calcsheet'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import { RUPEE_PDF_HEADERS, ratesRequest } from '@/lib/rates/server'

export const runtime = 'nodejs'
// The report now carries a calculation sheet of 15 to 40 pages; laying it out takes several seconds, longer than the 10 s default.
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// POST /api/qty/<tool>/generate-pdf: called by the results page once the payment is confirmed.
// The estimate must be paid on the server (or the server must be in payment bypass) before anything is built.
// With { estimateId, rates } (the customer's own rates, from the rupee panel) the same report is built with a rupee table and sent straight
// back as the response: it is not stored, not emailed, and the rates are not kept. Without rates it behaves exactly as before.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  try {
    const { tool } = await params
    const model = isTradeSlug(tool) ? modelFor(tool) : null
    if (!model || !isTradeSlug(tool)) return bad('This tool is not available yet.', 404)
    const meta = TRADE_META[tool]

    const body = await req.json().catch(() => ({}))
    const estimateId = body?.estimateId
    if (typeof estimateId !== 'string' || !estimateId) return bad('estimateId required')

    const supabase = createServiceClient()

    const { data: estimate, error: estErr } = await supabase
      .from('estimates')
      .select('id, app_type, project_name, input_data, result_data, status, contact_id')
      .eq('id', estimateId)
      .single()
    if (estErr || !estimate || estimate.app_type !== meta.appType) return bad('Estimate not found', 404)
    if (!PAYMENT_BYPASS && estimate.status !== 'paid') return bad('Payment not verified', 403)

    const input = estimate.input_data as { engine?: string; state?: string; city?: string } | null
    if (!input || input.engine !== 'trade-v1') return bad('This estimate was made with an earlier version of the tool. Please start a new one.', 409)

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

    // The numbers frozen when the customer first opened the paid report; otherwise work them out again (deterministic).
    const prior = estimate.result_data as { paid?: TradePaid; free?: TradeFree } | null
    let paid = prior?.paid
    let free = prior?.free
    if (!paid || !free) {
      const parsed = model.parse(input)
      if (!parsed.ok) return bad(parsed.error, 422)
      const ran = model.run(parsed.input)
      if (!ran.ok) return bad(ran.error, 422)
      paid = ran.result.paid
      free = ran.result.free
    }

    // The calculation sheet is rebuilt from the saved answers and checked against the report as it will be printed.
    // If it cannot be made to agree, the report goes out without it rather than with working that does not match.
    let calc: CalcSheet | null = null
    if (model.calc) {
      try {
        const parsedAgain = model.parse(input)
        if (parsedAgain.ok) calc = model.calc(parsedAgain.input, { free, paid })
      } catch (calcErr) {
        console.error(`[NS-CALC] ${meta.label} calculation sheet threw for ${estimateId}:`, calcErr instanceof Error ? calcErr.message : calcErr)
      }
      if (!calc) console.error(`[CRITICAL][NS-CALC] ${meta.label} calculation sheet was left out of report ${estimateId}: it did not reconcile with the report.`)
    }

    const asked = ratesRequest(body?.rates, paid.lines)
    if (asked.kind === 'empty') return bad('Type at least one rate to put rupees in the PDF.')
    const rupees = asked.kind === 'ok' ? asked.result : null

    const reportId = `NS-${meta.code}-${estimateId.slice(0, 8).toUpperCase()}`
    const projectName = estimate.project_name ?? 'My project'
    const where = [input.city, input.state].filter(Boolean).join(', ')

    let pdfBuffer: Buffer
    try {
      const el = React.createElement(QtyReportPDF, { meta, free, paid, contact: contactInfo, reportId, projectName, date: new Date(), where, calc, rupees })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await renderToBuffer(el as any)
    } catch (pdfErr) {
      console.error(`${meta.label} PDF render error:`, pdfErr instanceof Error ? pdfErr.message : pdfErr)
      return bad('The PDF could not be built.', 500)
    }

    // The rupee copy goes back to this browser only. It never replaces the stored report or the emailed one.
    if (rupees) return new NextResponse(new Uint8Array(pdfBuffer), { headers: RUPEE_PDF_HEADERS(`NirmanShastra-${meta.label}-Report-with-rupees.pdf`) })

    // Public bucket, reports are named by their UUID.
    const { error: bucketErr } = await supabase.storage.createBucket('reports', { public: true, fileSizeLimit: 10485760 })
    if (bucketErr && !bucketErr.message.includes('already exist')) console.error('Bucket creation error:', bucketErr.message)

    const storagePath = `${meta.appType}/${estimateId}.pdf`
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
          subject: `Your ${meta.label} report is ready — ${reportId}`,
          html: buildTradeEmail(meta, contactInfo.name, reportId, pdfUrl),
        })
        if (sent.error) {
          console.error(`[CRITICAL][NS-PDF-EMAIL] ${meta.label} delivery email FAILED for ${contactInfo.email}. A guest has no login to recover the report later. Resend error:`, sent.error)
        } else {
          emailSent = true
          await supabase.from('reports').update({ email_sent: true }).eq('estimate_id', estimateId)
        }
      } catch (emailEx) {
        console.error(`[CRITICAL][NS-PDF-EMAIL] ${meta.label} delivery email THREW for ${contactInfo.email}:`, emailEx)
      }
    }

    await supabase.from('contacts').update({ status: 'downloaded' }).eq('id', estimate.contact_id)
    return NextResponse.json({ pdfUrl, reportId, emailSent, success: true })
  } catch (err) {
    console.error('Trade generate-pdf error:', err instanceof Error ? err.message : err)
    return bad('PDF generation failed', 500)
  }
}

// GET /api/qty/<tool>/generate-pdf?estimateId=...: the PDF if it was already built, so a page refresh does not build it again.
export async function GET(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  if (!isTradeSlug(tool)) return bad('Unknown tool.', 404)
  const estimateId = req.nextUrl.searchParams.get('estimateId')
  if (!estimateId) return bad('estimateId required')

  const supabase = createServiceClient()
  const { data: estimate } = await supabase.from('estimates').select('status, app_type').eq('id', estimateId).single()
  if (!estimate || estimate.app_type !== TRADE_META[tool].appType) return bad('Estimate not found', 404)
  if (!PAYMENT_BYPASS && estimate.status !== 'paid') return bad('Not authorised', 403)

  const { data: rows } = await supabase.from('reports').select('pdf_url').eq('estimate_id', estimateId).limit(1)
  const found = rows?.[0]?.pdf_url
  return NextResponse.json(found ? { pdfUrl: found, success: true } : { pdfUrl: null, success: false })
}

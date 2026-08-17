import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import {
  SITE_TEMPLATES_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  BUNDLE_ID,
  filesForProduct,
  priceForProduct,
  titleForProduct,
} from '@/lib/site-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

// HMAC SHA256 verification — Build Reference Section 6. Same proven pattern as
// app/api/payments/verify/route.ts. Key Secret used ONLY here, never client-side.
function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  if (!keySecret) return false
  const expected = createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return expected === signature
}

type Download = { productId: string; title: string; filename: string; url: string }

// Generate a fresh, time-limited signed URL for each file the purchase unlocks.
// The bucket `site-templates` stays PRIVATE — links expire after SIGNED_URL_TTL_SECONDS.
async function buildSignedDownloads(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
): Promise<Download[]> {
  const files = filesForProduct(productId)
  const downloads: Download[] = []

  for (const f of files) {
    const { data, error } = await supabase.storage
      .from(SITE_TEMPLATES_BUCKET)
      .createSignedUrl(f.file, SIGNED_URL_TTL_SECONDS, { download: f.file })

    if (error || !data?.signedUrl) {
      console.error('[ST-VERIFY] Signed URL error for', f.file, error?.message)
      continue
    }
    downloads.push({
      productId: f.id,
      title: f.title,
      filename: f.file,
      url: data.signedUrl,
    })
  }

  return downloads
}

// POST /api/site-templates/verify
// Real mode : { razorpayOrderId, razorpayPaymentId, razorpaySignature, email? }
// Bypass    : { productId, email? }   (PAYMENT_BYPASS only — skips Razorpay)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()

    let productId: string
    let email: string = typeof body.email === 'string' ? body.email.trim() : ''
    let razorpayOrderId: string | null = null
    let razorpayPaymentId: string | null = null
    let razorpaySignature: string | null = null

    if (PAYMENT_BYPASS && body.productId && !body.razorpayOrderId) {
      // Preview / test path — no real payment. Product taken directly from body.
      productId = body.productId
      if (priceForProduct(productId) === null) {
        return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
      }
    } else {
      razorpayOrderId = body.razorpayOrderId
      razorpayPaymentId = body.razorpayPaymentId
      razorpaySignature = body.razorpaySignature

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Verify HMAC SHA256 signature (skipped only in bypass mode).
      if (!PAYMENT_BYPASS) {
        if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
          return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
        }
      }

      // Product is decided SERVER-SIDE from the pending row created at order time —
      // never from the client. This is what stops a one-toolkit payment from
      // unlocking the whole bundle.
      const { data: purchase } = await supabase
        .from('site_template_purchases')
        .select('product_id, email')
        .eq('razorpay_order_id', razorpayOrderId)
        .single()

      if (!purchase) {
        return NextResponse.json(
          { error: 'Purchase record not found for this order' },
          { status: 404 },
        )
      }
      productId = purchase.product_id
      if (!email) email = purchase.email ?? ''
    }

    // ── Record the successful purchase ──────────────────────────────────────
    if (razorpayOrderId) {
      await supabase
        .from('site_template_purchases')
        .update({
          status: 'success',
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          email: email || null,
          purchased_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpayOrderId)
    } else {
      // Bypass path — no pre-existing order row.
      await supabase.from('site_template_purchases').insert({
        email: email || null,
        product_id: productId,
        amount: priceForProduct(productId) ?? 0,
        status: 'success',
        purchased_at: new Date().toISOString(),
      })
    }

    // ── Task 3: fresh, time-limited signed URLs (bucket stays private) ──────
    const downloads = await buildSignedDownloads(supabase, productId)
    if (downloads.length === 0) {
      return NextResponse.json(
        { error: 'Could not prepare download links. Please contact support.' },
        { status: 500 },
      )
    }

    // ── Task 4: email the same links via Resend (best-effort) ──────────────
    let emailSent = false
    if (email) {
      try {
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: email,
          subject:
            productId === BUNDLE_ID
              ? 'Your Site Operations Suite — download links inside'
              : `Your ${titleForProduct(productId)} toolkit — download link inside`,
          html: buildEmailHtml(productId, downloads),
        })
        if (result.error) {
          console.error('[CRITICAL][ST-VERIFY] Toolkit delivery email FAILED to', email, '— a guest buyer has no login to recover this purchase. Resend error:', result.error)
        } else {
          emailSent = true
        }
      } catch (emailEx) {
        console.error('[CRITICAL][ST-VERIFY] Toolkit delivery email THREW for', email, '— a guest buyer has no login to recover this purchase:', emailEx)
        // Email is the buyer's only durable record. Failure is surfaced to the
        // user on-page via the emailSent flag; the on-page download links still work.
      }
    } else {
      console.error('[CRITICAL][ST-VERIFY] No email captured for order', razorpayOrderId, '— the buyer has NO durable record of this purchase beyond the on-page links.')
    }

    return NextResponse.json({
      success: true,
      productId,
      title: titleForProduct(productId),
      downloads: downloads.map((d) => ({ title: d.title, url: d.url })),
      expiresInHours: Math.round(SIGNED_URL_TTL_SECONDS / 3600),
      emailSent,
    })
  } catch (err) {
    console.error('Site template verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Email template ─────────────────────────────────────────────────────────
function buildEmailHtml(productId: string, downloads: Download[]): string {
  const isBundle = productId === BUNDLE_ID
  const heading = isBundle
    ? 'Your Site Operations Suite is ready'
    : `Your ${titleForProduct(productId)} toolkit is ready`

  const rows = downloads
    .map(
      (d) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #D0D2D4;">
          <p style="margin:0 0 8px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;font-weight:600;">${d.title}</p>
          <a href="${d.url}" style="display:inline-block;background:#8C3A22;color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;padding:10px 22px;border-radius:4px;">Download .zip</a>
        </td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Your NirmanShastra Toolkit</title></head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#F4F4F0;border:1px solid #1E2227;max-width:580px;">
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #1E2227;">
            <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:13px;font-weight:700;color:#1F4E79;letter-spacing:2px;">NIRMANSHASTRA</p>
            <p style="margin:2px 0 0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;">Build With Certainty</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 20px;">
            <p style="margin:0 0 6px;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;letter-spacing:1px;">PURCHASE CONFIRMED</p>
            <h1 style="margin:0 0 16px;font-family:'IBM Plex Serif',Georgia,serif;font-size:22px;color:#1E2227;font-weight:700;">${heading}</h1>
            <p style="margin:0 0 8px;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;color:#1E2227;line-height:1.6;">
              Thank you for your purchase. Your Excel toolkit${isBundle ? 's are' : ' is'} ready to download below.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows}</table>
            <p style="margin:16px 0 0;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;color:#888;line-height:1.6;">
              These download links are secure and expire in 48 hours. Save the files to your device after downloading.
              If a link has expired, reply to this email and we will re-issue it.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #D0D2D4;background:#F4F4F0;">
            <p style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:9px;color:#888;line-height:1.6;">
              NirmanShastra &middot; India&apos;s IS-Code Construction Cost Platform<br/>
              Toolkits are delivered as Excel (.xlsx) files inside a .zip. For estimation and site-management use.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

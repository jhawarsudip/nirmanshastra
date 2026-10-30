'use client'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PURCHASE FLOW — one copy, used by the Site Templates index and the six
// product pages. The steps and every request are unchanged from before:
// email capture → create-order → Razorpay checkout → server HMAC verify → signed
// download links. The amount is always worked out on the server; the browser only
// sends the product id and the email. Only the look of the dialog is new.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useId, useState } from 'react'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { SUPPORT_EMAIL } from '@/lib/seo/site'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Phase = 'idle' | 'email' | 'processing' | 'success' | 'error'
type Download = { title: string; url: string }

/** The Buy button. */
export function BuyButton({
  label,
  onClick,
  busy = false,
}: {
  label: string
  onClick: () => void
  busy?: boolean
}) {
  return (
    <button
      type="button"
      className="ns-btn"
      onClick={() => { if (!busy) onClick() }}
      disabled={busy}
      aria-live="polite"
    >
      {busy ? 'Processing…' : label}
      {!busy ? <IcArrow width={22} height={11} /> : null}
    </button>
  )
}

/** A standard code, as a small tag. */
export function CodeTag({ code }: { code: string }) {
  return <li className="ns-i-pill ns-st-code">{code}</li>
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT DIALOG — email → processing → download links.
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutDialog({
  phase,
  productTitle,
  email,
  setEmail,
  downloads,
  emailSent,
  error,
  onSubmitEmail,
  onClose,
}: {
  phase: Phase
  productTitle: string
  email: string
  setEmail: (v: string) => void
  downloads: Download[]
  emailSent: boolean
  error: string
  onSubmitEmail: () => void
  onClose: () => void
}) {
  const titleId = useId()

  // Escape closes the dialog, except while a payment is being confirmed.
  useEffect(() => {
    if (phase === 'idle' || phase === 'processing') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  if (phase === 'idle') return null

  const emailValid = EMAIL_RE.test(email.trim())
  const many = downloads.length > 1

  return (
    <div
      className="ns-st-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={phase === 'processing' ? undefined : onClose}
    >
      <div className="ns-plate ns-st-modal__box" onClick={(e) => e.stopPropagation()}>
        {/* ── EMAIL CAPTURE ── */}
        {phase === 'email' && (
          <form
            className="ns-st-modal__body"
            onSubmit={(e) => { e.preventDefault(); if (emailValid) onSubmitEmail() }}
          >
            <p className="ns-st-k">Checkout · Site Templates</p>
            <h2 id={titleId}>{productTitle}</h2>
            <p className="ns-st-modal__p">
              Enter your email. Your download link is shown here after payment and also emailed to you, so you have it even if you close this tab.
            </p>
            <Field id="st-email" label="Email address" required error={error || undefined}>
              <Input
                type="email"
                value={email}
                autoFocus
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <p className="ns-st-fine">
              By paying you accept the <a href="/site-templates/terms" target="_blank" rel="noopener noreferrer">Site Templates Terms</a>.
              A downloaded file cannot be returned; a faulty one is fixed or refunded.
            </p>
            <button type="submit" className="ns-btn ns-st-modal__go" disabled={!emailValid}>
              {PAYMENT_BYPASS ? 'Get download (preview mode)' : 'Continue to payment'}
              <IcArrow width={22} height={11} />
            </button>
            <button type="button" className="ns-st-modal__x" onClick={onClose}>Cancel</button>
          </form>
        )}

        {/* ── PROCESSING ── */}
        {phase === 'processing' && (
          <div className="ns-st-modal__body" role="status">
            <p className="ns-st-k">Verifying payment</p>
            <h2 id={titleId}>One moment</h2>
            <p className="ns-st-modal__p">Confirming your payment and preparing your secure download link…</p>
          </div>
        )}

        {/* ── SUCCESS — DOWNLOAD LINKS ── */}
        {phase === 'success' && (
          <div className="ns-st-modal__body">
            <p className="ns-st-k">Payment confirmed</p>
            <h2 id={titleId}>Your toolkit{many ? 's are' : ' is'} ready</h2>
            <p className="ns-st-modal__p">
              {emailSent
                ? `We've also emailed ${many ? 'these links' : 'this link'} to ${email}. `
                : `We tried to email ${many ? 'these links' : 'this link'} to ${email} but delivery may have failed — download now to be safe. `}
              Save your download link or check your email now — there is no login to retrieve this purchase later. Links are secure and expire in 48 hours; save the file{many ? 's' : ''} after downloading.
            </p>
            <ul className="ns-st-dls">
              {downloads.map((d) => (
                <li key={d.url}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="ns-st-dl">
                    <span>{d.title}</span>
                    <b>Download .zip ↓</b>
                  </a>
                </li>
              ))}
            </ul>
            <p className="ns-st-fine">
              Lost the link? Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the email you bought with.
              <a href="/site-templates/terms" target="_blank" rel="noopener noreferrer"> Terms and refunds</a>.
            </p>
            <button type="button" className="ns-st-modal__x" onClick={onClose}>Done</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="ns-st-modal__body">
            <h2 id={titleId}>Something went wrong</h2>
            <Note kind="err">
              {error || 'Your payment could not be completed. If money was deducted it will be refunded automatically.'}
            </Note>
            <button type="button" className="ns-btn ns-st-modal__go" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — purchase state machine. `open(productId, title)` starts a checkout for
// any product (including the bundle); `overlay` is the dialog to render once near
// the page root.
// ─────────────────────────────────────────────────────────────────────────────
export function useToolkitCheckout() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [product, setProduct] = useState<{ id: string; title: string }>({ id: '', title: '' })
  const [email, setEmail] = useState('')
  const [downloads, setDownloads] = useState<Download[]>([])
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  // Load Razorpay checkout script once
  useEffect(() => {
    if (PAYMENT_BYPASS) return
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const open = useCallback((id: string, title: string) => {
    setProduct({ id, title })
    setEmail('')
    setError('')
    setDownloads([])
    setEmailSent(false)
    setPhase('email')
  }, [])

  const onClose = useCallback(() => {
    setPhase('idle')
    setError('')
  }, [])

  const deliver = useCallback(async (payload: Record<string, unknown>) => {
    const vRes = await fetch('/api/site-templates/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const vJson = await vRes.json()
    if (!vRes.ok || !vJson.success) throw new Error(vJson.error || 'Verification failed')
    setDownloads(vJson.downloads || [])
    setEmailSent(!!vJson.emailSent)
    setPhase('success')
  }, [])

  const onSubmitEmail = useCallback(async () => {
    const cleanEmail = email.trim()
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setPhase('processing')

    try {
      // Preview / bypass mode — skip Razorpay entirely.
      if (PAYMENT_BYPASS) {
        await deliver({ productId: product.id, email: cleanEmail })
        return
      }

      // 1. Create the order server-side (amount is derived server-side).
      const res = await fetch('/api/site-templates/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, email: cleanEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not create order')

      if (!window.Razorpay) {
        throw new Error('Payment SDK not loaded. Please refresh and try again.')
      }

      // 2. Open Razorpay checkout with the Key ID only.
      const options = {
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || 'INR',
        name: 'NirmanShastra',
        description: `Site Templates — ${product.title}`,
        order_id: json.orderId,
        prefill: { email: cleanEmail },
        notes: { productId: product.id },
        theme: { color: '#B5472B' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          setPhase('processing')
          try {
            await deliver({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              email: cleanEmail,
            })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed.')
            setPhase('error')
          }
        },
        modal: {
          ondismiss: () => {
            // Return to the email step so the user can retry.
            setError('Payment was not completed. You can try again.')
            setPhase('email')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }, [email, product, deliver])

  const busy = phase === 'processing'

  const overlay = (
    <CheckoutDialog
      phase={phase}
      productTitle={product.title}
      email={email}
      setEmail={setEmail}
      downloads={downloads}
      emailSent={emailSent}
      error={error}
      onSubmitEmail={onSubmitEmail}
      onClose={onClose}
    />
  )

  return { busy, open, overlay }
}

/** Single-product pages: the same flow with the product fixed. */
export function useToolkitPurchase(productId: string, productTitle: string) {
  const { busy, open, overlay } = useToolkitCheckout()
  const openCheckout = useCallback(() => open(productId, productTitle), [open, productId, productTitle])
  return { busy, openCheckout, overlay }
}

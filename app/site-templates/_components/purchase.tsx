'use client'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PURCHASE FLOW — used by the six individual product pages under
// /site-templates/*. Ported VERBATIM from the combined /site-templates page so
// the Razorpay flow is identical: email capture → create-order → Razorpay
// checkout → server HMAC verify → signed download links. Scoped to a single
// productId (no bundle). The combined page keeps its own inlined copy untouched.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

// Design tokens — matte dark-mode system (matches the combined /site-templates page)
export const BG   = '#0A0A0A'
export const SURF = '#171717'
export const GOLD = '#C5A059'
export const TP   = '#FFFFFF'
export const TS   = '#A3A3A3'
export const BSub = 'rgba(255,255,255,0.08)'
export const FI   = 'var(--font-inter)'
export const FP   = 'var(--font-playfair)'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Phase = 'idle' | 'email' | 'processing' | 'success' | 'error'
type Download = { title: string; url: string }

// ─────────────────────────────────────────────────────────────────────────────
// BUY BUTTON — identical styling to the combined page's card button.
// ─────────────────────────────────────────────────────────────────────────────
export function BuyButton({
  label,
  onClick,
  busy = false,
  variant = 'card',
}: {
  label: string
  onClick: () => void
  busy?: boolean
  variant?: 'card' | 'bundle'
}) {
  const isBundle = variant === 'bundle'
  return (
    <button
      type="button"
      onClick={() => { if (!busy) onClick() }}
      disabled={busy}
      aria-live="polite"
      className="btn-3d"
      style={{
        fontFamily: FI,
        fontSize: isBundle ? 14 : 13,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: isBundle ? '13px 26px' : '11px 22px',
        borderRadius: 2,
        cursor: busy ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        border: busy ? `1px solid ${BSub}` : '1px solid transparent',
        background: busy ? 'transparent' : GOLD,
        color: busy ? TS : '#000000',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {busy ? 'Processing…' : label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CODE TAG — identical to the combined page.
// ─────────────────────────────────────────────────────────────────────────────
export function CodeTag({ code }: { code: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-plex-mono)',
        fontSize: 10,
        color: TS,
        border: `1px solid ${BSub}`,
        borderRadius: 2,
        padding: '3px 7px',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}
    >
      {code}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE OVERLAY — identical to the combined page's overlay.
// ─────────────────────────────────────────────────────────────────────────────
function PurchaseOverlay({
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
  if (phase === 'idle') return null

  const emailValid = EMAIL_RE.test(email.trim())

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={phase === 'processing' ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: SURF,
          border: `1px solid ${GOLD}`,
          borderRadius: 2,
          padding: '32px 30px',
        }}
      >
        {/* ── EMAIL CAPTURE ── */}
        {phase === 'email' && (
          <>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Checkout · Site Templates
            </p>
            <h3 style={{ fontFamily: FI, fontSize: 20, fontWeight: 600, color: TP, marginBottom: 8, lineHeight: 1.25 }}>
              {productTitle}
            </h3>
            <p style={{ fontFamily: FI, fontSize: 13.5, color: TS, lineHeight: 1.6, marginBottom: 20 }}>
              Enter your email. Your download link is shown here after payment and also emailed to you, so you have it even if you close this tab.
            </p>
            <label style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: TS, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && emailValid) onSubmitEmail() }}
              placeholder="you@example.com"
              style={{
                width: '100%',
                marginTop: 6,
                marginBottom: 8,
                padding: '11px 13px',
                borderRadius: 6,
                background: BG,
                border: `1px solid ${BSub}`,
                color: TP,
                fontFamily: FI,
                fontSize: 14,
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ fontFamily: FI, fontSize: 12, color: '#E0704E', marginBottom: 8 }}>{error}</p>
            )}
            <button
              type="button"
              onClick={onSubmitEmail}
              disabled={!emailValid}
              className="btn-3d"
              style={{
                width: '100%',
                marginTop: 12,
                padding: '13px 22px',
                borderRadius: 2,
                fontFamily: FI,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.02em',
                border: '1px solid transparent',
                background: emailValid ? GOLD : 'transparent',
                color: emailValid ? '#000' : TS,
                cursor: emailValid ? 'pointer' : 'default',
              }}
            >
              {PAYMENT_BYPASS ? 'Get download (preview mode)' : 'Continue to payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', marginTop: 10, padding: 8, background: 'none', border: 'none', color: TS, fontFamily: FI, fontSize: 12, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </>
        )}

        {/* ── PROCESSING ── */}
        {phase === 'processing' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Verifying payment
            </p>
            <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6 }}>
              Confirming your payment and preparing your secure download link…
            </p>
          </div>
        )}

        {/* ── SUCCESS — DOWNLOAD LINKS ── */}
        {phase === 'success' && (
          <>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Payment confirmed
            </p>
            <h3 style={{ fontFamily: FI, fontSize: 20, fontWeight: 600, color: TP, marginBottom: 8, lineHeight: 1.25 }}>
              Your toolkit{downloads.length > 1 ? 's are' : ' is'} ready
            </h3>
            <p style={{ fontFamily: FI, fontSize: 13.5, color: TS, lineHeight: 1.6, marginBottom: 18 }}>
              {emailSent
                ? `We've also emailed ${downloads.length > 1 ? 'these links' : 'this link'} to ${email}. `
                : `We tried to email ${downloads.length > 1 ? 'these links' : 'this link'} to ${email} but delivery may have failed — download now to be safe. `}
              Save your download link or check your email now — there is no login to retrieve this purchase later. Links are secure and expire in 48 hours; save the file{downloads.length > 1 ? 's' : ''} after downloading.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {downloads.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '13px 16px',
                    borderRadius: 2,
                    border: `1px solid ${GOLD}`,
                    background: 'rgba(197,160,89,0.08)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontFamily: FI, fontSize: 13.5, color: TP, fontWeight: 500 }}>{d.title}</span>
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: GOLD, whiteSpace: 'nowrap' }}>Download .zip ↓</span>
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', marginTop: 14, padding: 8, background: 'none', border: 'none', color: TS, fontFamily: FI, fontSize: 12, cursor: 'pointer' }}
            >
              Done
            </button>
          </>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#E0704E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Something went wrong
            </p>
            <p style={{ fontFamily: FI, fontSize: 14, color: TS, lineHeight: 1.6, marginBottom: 18 }}>
              {error || 'Your payment could not be completed. If money was deducted it will be refunded automatically.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-3d"
              style={{ padding: '11px 26px', borderRadius: 2, fontFamily: FI, fontSize: 13, fontWeight: 600, background: GOLD, color: '#000', border: '1px solid transparent', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — single-product purchase state machine. Returns an openCheckout()
// trigger (shareable across multiple Buy buttons on the page) and the overlay
// element to render once near the page root.
// ─────────────────────────────────────────────────────────────────────────────
export function useToolkitPurchase(productId: string, productTitle: string) {
  const [phase, setPhase] = useState<Phase>('idle')
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

  const openCheckout = useCallback(() => {
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
        await deliver({ productId, email: cleanEmail })
        return
      }

      // 1. Create the order server-side (amount is derived server-side).
      const res = await fetch('/api/site-templates/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email: cleanEmail }),
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
        description: `Site Templates — ${productTitle}`,
        order_id: json.orderId,
        prefill: { email: cleanEmail },
        notes: { productId },
        theme: { color: '#C5A059' },
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
  }, [email, productId, productTitle, deliver])

  const busy = phase === 'processing'

  const overlay = (
    <PurchaseOverlay
      phase={phase}
      productTitle={productTitle}
      email={email}
      setEmail={setEmail}
      downloads={downloads}
      emailSent={emailSent}
      error={error}
      onSubmitEmail={onSubmitEmail}
      onClose={onClose}
    />
  )

  return { busy, openCheckout, overlay }
}

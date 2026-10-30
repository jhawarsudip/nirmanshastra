'use client'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PURCHASE FLOW — one copy, used by the Site Templates index and the six
// product pages. The steps and every request are unchanged from before:
// email capture → create-order → Razorpay checkout → server HMAC verify → signed
// download links. The amount is always worked out on the server; the browser only
// sends the product id and the email. Only the look of the dialog is new.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { Field, Input, Note, IcArrow } from '@/components/v2/inner/kit'
import { SUPPORT_EMAIL } from '@/lib/seo/site'
import { SITE_TEMPLATES, displayTitleForProduct } from '@/lib/site-templates'
import { useCopy } from '@/lib/i18n/use-copy'
import { useTr } from '@/lib/i18n/use-tr'
import { CHECKOUT, CHECKOUT_DICT, LINK_HOURS } from '@/lib/i18n/labels/templates-ui'
import { Rich } from './rich'

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
  const t = useCopy(CHECKOUT)
  return (
    <button
      type="button"
      className="ns-btn"
      onClick={() => { if (!busy) onClick() }}
      disabled={busy}
      aria-live="polite"
    >
      {busy ? t.processing : label}
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
export function CheckoutDialog({
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
  const locale = useLocale()
  const t = useCopy(CHECKOUT)
  // Messages are kept as English strings in the flow (and some come from the API); the Hindi page looks each one up.
  const tr = useTr(CHECKOUT_DICT)

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

  // The page's sticky header (z-index 80) and its poured lip sit above anything inside <main>, so a dialog rendered in
  // place would have its top lines covered by the drip (CLAUDE.md: no text may be blocked). The dialog is therefore
  // drawn as a child of the .ns2 wrapper instead, where its own z-index (100) wins. It only mounts after a click,
  // so reading the DOM here cannot disagree with the server render. `--tc` is repeated on the dialog because <main class="ns-i"> is what sets it.
  const host = typeof document === 'undefined' ? null : document.querySelector('.ns2')

  const dialog = (
    <div
      className="ns-st-modal"
      style={{ ['--tc' as string]: 'var(--ns-t-struct)' }}
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
            <p className="ns-st-k">{t.kicker}</p>
            <h2 id={titleId}>{productTitle}</h2>
            <p className="ns-st-modal__p">
              {t.emailIntro}
            </p>
            <Field id="st-email" label={t.emailLabel} required error={error ? tr(error) : undefined}>
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
              {t.termsBefore}<Link href="/site-templates/terms" target="_blank" rel="noopener noreferrer">{t.termsLink}</Link>{t.termsAfter}
            </p>
            <button type="submit" className="ns-btn ns-st-modal__go" disabled={!emailValid}>
              {PAYMENT_BYPASS ? t.getPreview : t.toPayment}
              <IcArrow width={22} height={11} />
            </button>
            <button type="button" className="ns-st-modal__x" onClick={onClose}>{t.cancel}</button>
          </form>
        )}

        {/* ── PROCESSING ── */}
        {phase === 'processing' && (
          <div className="ns-st-modal__body" role="status">
            <p className="ns-st-k">{t.verifying}</p>
            <h2 id={titleId}>{t.oneMoment}</h2>
            <p className="ns-st-modal__p">{t.confirming}</p>
          </div>
        )}

        {/* ── SUCCESS — DOWNLOAD LINKS ── */}
        {phase === 'success' && (
          <div className="ns-st-modal__body">
            <p className="ns-st-k">{t.confirmed}</p>
            <h2 id={titleId}>{t.ready(many)}</h2>
            <p className="ns-st-modal__p">
              {emailSent ? t.emailedOk(many, email) : t.emailedFail(many, email)}
              {t.saveLink(many, LINK_HOURS)}
            </p>
            <ul className="ns-st-dls">
              {downloads.map((d) => (
                <li key={d.url}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="ns-st-dl">
                    <span>{locale === 'hi' ? (SITE_TEMPLATES.find((p) => p.title === d.title)?.titleHi ?? d.title) : d.title}</span>
                    <b><Rich text={t.downloadZip} /></b>
                  </a>
                </li>
              ))}
            </ul>
            <p className="ns-st-fine">
              {t.lostBefore}<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{t.lostAfter}
              <Link href="/site-templates/terms" target="_blank" rel="noopener noreferrer">{t.termsRefunds}</Link>{t.termsRefundsAfter}
            </p>
            <button type="button" className="ns-st-modal__x" onClick={onClose}>{t.done}</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="ns-st-modal__body">
            <h2 id={titleId}>{t.wentWrong}</h2>
            <Note kind="err">
              {error ? tr(error) : t.failed}
            </Note>
            <button type="button" className="ns-btn ns-st-modal__go" onClick={onClose}>{t.close}</button>
          </div>
        )}
      </div>
    </div>
  )
  return host ? createPortal(dialog, host) : dialog
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — purchase state machine. `open(productId, title)` starts a checkout for
// any product (including the bundle); `overlay` is the dialog to render once near
// the page root.
// ─────────────────────────────────────────────────────────────────────────────
export function useToolkitCheckout() {
  const locale = useLocale()
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
      productTitle={locale === 'hi' ? displayTitleForProduct(product.id, locale) : product.title}
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

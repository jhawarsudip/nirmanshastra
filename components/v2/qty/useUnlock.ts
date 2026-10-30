'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { getAttribution } from '@/lib/analytics/attribution'
import { orderCreated, paymentVerified } from '@/lib/analytics/checkout'
import { useCopy } from '@/lib/i18n/use-copy'
import { QTY_UNLOCK } from '@/lib/i18n/labels/qty-ui'

/*
  The pay, load-the-report, make-the-PDF sequence that every paid tool shares.
  The amount is decided on the server from the estimate; the browser only says which estimate to unlock.
  The report is fetched only after the server confirms the payment, so no quantity is ever sent early.
*/

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

type PayStatus = 'idle' | 'creating' | 'open' | 'verifying' | 'polling' | 'paid' | 'error'
type PdfStatus = 'idle' | 'generating' | 'ready' | 'error'
type ReportStatus = 'idle' | 'loading' | 'ready' | 'error'

export function useUnlock<R>({ api, estimateId, contactName, description, fileName, reportless }: {
  /** the tool's route prefix, for example "/api/qty/plumbpro" */
  api: string
  estimateId: string | null
  contactName: string
  /** shown in the payment window */
  description: string
  fileName: string
  /** true when there is nothing to load after payment (the Complete House Pack itself has no report) */
  reportless?: boolean
}) {
  const k = useCopy(QTY_UNLOCK)
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')
  const [payError, setPayError] = useState('')
  const [isPaid, setIsPaid] = useState(PAYMENT_BYPASS)
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle')
  const [report, setReport] = useState<R | null>(null)
  const [reportError, setReportError] = useState('')

  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)
  const [downloading, setDownloading] = useState(false)

  // the payment window's script
  useEffect(() => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  // after the payment window closes, wait for the server to record the verified payment
  useEffect(() => {
    if (!orderId || payStatus !== 'polling') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${orderId}`)
        const json = await res.json()
        if (json.status === 'success') {
          if (pollRef.current) clearInterval(pollRef.current)
          paymentVerified(orderId) // no-op when the success handler already reported this order
          setIsPaid(true)
          setPayStatus('paid')
        } else if (json.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPayStatus('error')
          setPayError(k.payFailed)
        }
      } catch { /* a dropped request is fine, the next tick tries again */ }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId, payStatus, k])

  const loadReport = useCallback(async () => {
    if (!estimateId) return
    setReportStatus('loading')
    setReportError('')
    try {
      const res = await fetch(`${api}/report?estimateId=${encodeURIComponent(estimateId)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || k.couldNotLoad)
      setReport(json.report as R)
      setReportStatus('ready')
    } catch (e) {
      setReportStatus('error')
      setReportError(e instanceof Error ? e.message : k.couldNotLoad)
    }
  }, [api, estimateId, k])

  useEffect(() => { if (isPaid && !reportless) loadReport() }, [isPaid, reportless, loadReport])

  const generatePdf = useCallback(async () => {
    if (!estimateId) return
    setPdfStatus('generating')
    try {
      const g = await fetch(`${api}/generate-pdf?estimateId=${encodeURIComponent(estimateId)}`)
      const gj = await g.json().catch(() => ({}))
      if (gj.pdfUrl) { setPdfUrl(gj.pdfUrl); setPdfStatus('ready'); return }
      const p = await fetch(`${api}/generate-pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estimateId }) })
      const pj = await p.json().catch(() => ({}))
      if (pj.pdfUrl) { setPdfUrl(pj.pdfUrl); setEmailSent(typeof pj.emailSent === 'boolean' ? pj.emailSent : null); setPdfStatus('ready') } else setPdfStatus('error')
    } catch {
      setPdfStatus('error')
    }
  }, [api, estimateId])

  useEffect(() => { if (reportStatus === 'ready') generatePdf() }, [reportStatus, generatePdf])

  const downloadPdf = useCallback(async () => {
    if (!pdfUrl || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(pdfUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(pdfUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }, [pdfUrl, downloading, fileName])

  const unlock = useCallback(async () => {
    if (!estimateId) { setPayError(k.notSaved); return }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // the amount is decided on the server; the campaign tags say which reel or ad brought this sale
        body: JSON.stringify({ estimateId, attribution: getAttribution() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || k.couldNotStart)
      orderCreated(json) // begin_checkout / InitiateCheckout, with the amount the server will charge
      setOrderId(json.orderId)
      setPayStatus('open')
      if (!window.Razorpay) throw new Error(k.windowNotLoaded)
      const rzp = new window.Razorpay({
        key: json.keyId,
        amount: json.amount,
        currency: json.currency || 'INR',
        name: 'NirmanShastra',
        description,
        order_id: json.orderId,
        prefill: { name: contactName },
        notes: { estimateId },
        theme: { color: '#B5502D' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPayStatus('verifying')
          try {
            const vRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                estimateId,
              }),
            })
            const vJson = await vRes.json()
            if (!vRes.ok) throw new Error(vJson.error || k.verifyFailed)
            paymentVerified(response.razorpay_order_id) // purchase / Purchase, once per order
            setPayStatus('polling')
          } catch (err) {
            setPayStatus('error')
            setPayError(err instanceof Error ? err.message : k.couldNotVerify)
          }
        },
        modal: {
          ondismiss: () => {
            setPayStatus(prev => (prev === 'open' || prev === 'creating' ? 'idle' : prev))
            setPayError(k.notCompleted)
          },
        },
      })
      rzp.open()
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : k.wentWrong)
    }
  }, [estimateId, contactName, description, k])

  const busy = payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'

  /** the server has already marked this estimate paid (a Complete House Pack unlock): open the report */
  const markPaid = useCallback(() => { setIsPaid(true); setPayStatus('paid') }, [])

  return {
    isPaid, payStatus, payError, busy, unlock, markPaid,
    report, reportStatus, reportError, loadReport,
    pdfStatus, pdfUrl, emailSent, downloading, downloadPdf, generatePdf,
    /** true when the page is open only because the server is in preview mode, not because someone paid */
    previewOnly: PAYMENT_BYPASS && payStatus !== 'paid',
  }
}

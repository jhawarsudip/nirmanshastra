'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PAYMENT_BYPASS } from '@/lib/payment-config'

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

export function useUnlock<R>({ api, estimateId, contactName, description, fileName }: {
  /** the tool's route prefix, for example "/api/qty/plumbpro" */
  api: string
  estimateId: string | null
  contactName: string
  /** shown in the payment window */
  description: string
  fileName: string
}) {
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
          setIsPaid(true)
          setPayStatus('paid')
        } else if (json.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPayStatus('error')
          setPayError('The payment did not go through. Please try again.')
        }
      } catch { /* a dropped request is fine, the next tick tries again */ }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [orderId, payStatus])

  const loadReport = useCallback(async () => {
    if (!estimateId) return
    setReportStatus('loading')
    setReportError('')
    try {
      const res = await fetch(`${api}/report?estimateId=${encodeURIComponent(estimateId)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load the report')
      setReport(json.report as R)
      setReportStatus('ready')
    } catch (e) {
      setReportStatus('error')
      setReportError(e instanceof Error ? e.message : 'Could not load the report')
    }
  }, [api, estimateId])

  useEffect(() => { if (isPaid) loadReport() }, [isPaid, loadReport])

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
    if (!estimateId) { setPayError('Your estimate is not saved yet. Please wait a moment and try again.'); return }
    setPayStatus('creating')
    setPayError('')
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }), // the amount is decided on the server
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not start the payment')
      setOrderId(json.orderId)
      setPayStatus('open')
      if (!window.Razorpay) throw new Error('The payment window did not load. Please refresh the page and try again.')
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
            if (!vRes.ok) throw new Error(vJson.error || 'Verification failed')
            setPayStatus('polling')
          } catch (err) {
            setPayStatus('error')
            setPayError(err instanceof Error ? err.message : 'We could not verify the payment.')
          }
        },
        modal: {
          ondismiss: () => {
            setPayStatus(prev => (prev === 'open' || prev === 'creating' ? 'idle' : prev))
            setPayError('The payment was not completed. Press the button to try again.')
          },
        },
      })
      rzp.open()
    } catch (err) {
      setPayStatus('error')
      setPayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }, [estimateId, contactName, description])

  const busy = payStatus === 'creating' || payStatus === 'verifying' || payStatus === 'polling'

  return {
    isPaid, payStatus, payError, busy, unlock,
    report, reportStatus, reportError, loadReport,
    pdfStatus, pdfUrl, emailSent, downloading, downloadPdf, generatePdf,
    /** true when the page is open only because the server is in preview mode, not because someone paid */
    previewOnly: PAYMENT_BYPASS && payStatus !== 'paid',
  }
}

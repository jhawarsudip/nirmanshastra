'use client'

import { useState } from 'react'
import { useCopy } from '@/lib/i18n/use-copy'
import { DOWNLOAD } from '@/lib/i18n/labels/pages-account'

/**
 * Fetches the address of a report that was already built and opens it. Each tool keeps its own route:
 * StructurePro and Grand Total have theirs, the four trade tools share /api/qty/<tool>.
 * The route answers { pdfUrl, success }; pdfUrl is null when the PDF was never built.
 */
function routeFor(appType: string): string | null {
  if (appType === 'structopro') return '/api/structopro/generate-pdf'
  if (appType === 'grandtotal') return '/api/grand-total/generate-pdf'
  if (['masonpro', 'electropro', 'plumbpro', 'interiorpro'].includes(appType)) return `/api/qty/${appType}/generate-pdf`
  return null
}

export default function DownloadButton({ appType, estimateId }: { appType: string; estimateId: string }) {
  const c = useCopy(DOWNLOAD)
  const [state, setState] = useState<'idle' | 'busy' | 'none' | 'err'>('idle')
  const route = routeFor(appType)
  if (!route) return <span className="ns-rp-none">{c.none}</span>

  async function go() {
    setState('busy')
    try {
      const res = await fetch(`${route}?estimateId=${encodeURIComponent(estimateId)}`)
      const json = (await res.json().catch(() => ({}))) as { pdfUrl?: string | null }
      if (res.ok && json.pdfUrl) {
        const w = window.open(json.pdfUrl, '_blank', 'noopener')
        if (!w) window.location.assign(json.pdfUrl)
        setState('idle')
      } else {
        setState(res.ok ? 'none' : 'err')
      }
    } catch {
      setState('err')
    }
  }

  return (
    <span className="ns-rp-dl">
      <button type="button" className="ns-btn ns-btn--sm" onClick={go} disabled={state === 'busy'}>
        {state === 'busy' ? c.busy : c.go}
      </button>
      <span role="status" aria-live="polite" className="ns-rp-dl__msg">
        {state === 'none' ? c.notBuilt : null}
        {state === 'err' ? c.failed : null}
      </span>
    </span>
  )
}

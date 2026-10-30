'use client'

import { useCallback, useEffect, useState } from 'react'
import { PACK_STORAGE_KEY, type PackStatus } from '@/lib/pack/shared'
import type { PaidAppType } from '@/lib/tool-pricing'
import { useCopy } from '@/lib/i18n/use-copy'
import { QTY_PACK } from '@/lib/i18n/labels/qty-ui'

/*
  The Complete House Pack, seen from a tool page.
  The pack id is a private key: it is kept in this browser (and in the buyer's confirmation email, as ?pack=…).
  Whether it can unlock a report, and how many claims are left, is always decided by the server.
*/

export function readStoredPackId(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('pack')
    if (fromUrl && /^[0-9a-f-]{36}$/i.test(fromUrl)) {
      window.localStorage.setItem(PACK_STORAGE_KEY, fromUrl)
      return fromUrl
    }
    const stored = window.localStorage.getItem(PACK_STORAGE_KEY)
    return stored && /^[0-9a-f-]{36}$/i.test(stored) ? stored : null
  } catch {
    return null
  }
}

export function rememberPackId(id: string) {
  try { window.localStorage.setItem(PACK_STORAGE_KEY, id) } catch { /* private window: the emailed link still works */ }
}

export function usePack(appType: PaidAppType) {
  const k = useCopy(QTY_PACK)
  const [packId, setPackId] = useState<string | null>(null)
  const [status, setStatus] = useState<PackStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pack/status?packId=${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (!res.ok) { setStatus(null); return }
      const json = await res.json()
      setStatus(json.status as PackStatus)
    } catch { /* offline: the normal payment button still works */ }
  }, [])

  useEffect(() => {
    const id = readStoredPackId()
    if (!id) return
    setPackId(id)
    refresh(id)
  }, [refresh])

  /** Unlocks this estimate with the pack. Resolves true when the server has marked it paid. */
  const redeem = useCallback(async (estimateId: string | null): Promise<boolean> => {
    if (!packId || !estimateId) { setError(k.notSaved); return false }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/pack/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, estimateId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || k.couldNot)
      if (json.status) setStatus(json.status as PackStatus)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : k.couldNot)
      return false
    } finally {
      setBusy(false)
    }
  }, [packId, k])

  const left = status?.paid ? status.remaining[appType] : 0
  return {
    /** the visitor has a paid pack that can still unlock this kind of report */
    available: !!packId && left > 0,
    /** the visitor has a paid pack, but it has made all the reports of this kind it includes */
    exhausted: !!packId && !!status?.paid && left === 0,
    left,
    perReport: status?.perReport ?? 0,
    busy, error, redeem,
  }
}

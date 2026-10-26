'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackCalculatorUsed } from '@/lib/analytics/events'

/**
 * Renders nothing. A free calculator shows its answer live as the numbers change, so "produced a result" means the
 * visitor changed a number inside <CalcPage>. Sent once per page view, a moment after they stop typing.
 */
export default function CalcTracker() {
  const pathname = usePathname()
  useEffect(() => {
    let timer: number | undefined
    let fired = false
    const name = pathname.split('/').filter(Boolean).pop() || 'calculator'
    function onEdit(e: Event) {
      if (fired) return
      const t = e.target as Element | null
      if (!t?.closest?.('[data-ns-calc]') || !t.matches('input, select, textarea')) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { fired = true; trackCalculatorUsed(name) }, 1200)
    }
    document.addEventListener('input', onEdit, true)
    document.addEventListener('change', onEdit, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('input', onEdit, true)
      document.removeEventListener('change', onEdit, true)
    }
  }, [pathname])
  return null
}

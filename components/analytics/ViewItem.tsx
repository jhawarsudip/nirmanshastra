'use client'

import { useEffect, useRef } from 'react'
import { itemFor } from '@/lib/analytics/items'
import { trackViewItem } from '@/lib/analytics/events'

/** Renders nothing. Reports that a paid tool page opened (view_item / ViewContent) with the report name and price. */
export default function ViewItem({ appType }: { appType: string }) {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    const item = itemFor(appType)
    if (!item) return
    sent.current = true
    trackViewItem(item)
  }, [appType])
  return null
}

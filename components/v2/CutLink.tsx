'use client'

import { Link, useRouter } from '@/i18n/navigation'
import type { ComponentProps, MouseEvent } from 'react'

/**
 * Internal link that plays the 450 ms section-cut hatch wipe before navigating.
 * Falls back to a plain link for hash links, modified clicks and reduced motion.
 */
export default function CutLink({ href, onClick, children, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter()

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const target = typeof href === 'string' ? href : (href.pathname ?? '')
    if (!target.startsWith('/') || target.startsWith('/#') || target.startsWith('//')) return
    if (rest.target && rest.target !== '_self') return
    const d = document.documentElement
    if (d.getAttribute('data-reduce-motion') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wipe = document.querySelector('.ns-cutwipe')
    if (!wipe) return
    e.preventDefault()
    wipe.classList.add('is-on')
    window.setTimeout(() => router.push(target), 430)
    // safety: never leave the page covered if navigation stalls
    window.setTimeout(() => wipe.classList.remove('is-on'), 6000)
  }

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  )
}

'use client'

import { useEffect } from 'react'

/** One observer for the whole page: adds .is-in to every .s3-rise element as it scrolls into view. */
export default function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.s3-rise'))
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}

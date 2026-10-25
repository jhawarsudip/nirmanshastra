'use client'

import { useId, useState, type ReactNode } from 'react'

/**
 * A section of a long form that can be folded away. The heading is a button that says whether it is open.
 * Folded sections are removed from the page (like the old form), so their answers stay in the parent's state.
 */
export default function Disclosure({ n, title, badge, defaultOpen = true, children }: {
  n?: string
  title: string
  badge?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="ns-plate ns-i-sect" data-open={open ? '1' : '0'}>
      <h3 className="ns-i-sect__h">
        <button type="button" id={`${id}-b`} aria-expanded={open} aria-controls={open ? `${id}-p` : undefined} onClick={() => setOpen(o => !o)}>
          {n ? <span className="ns-i-sect__n" aria-hidden="true">{n}</span> : null}
          <span className="ns-i-sect__t">{title}</span>
          {badge ? <span className="ns-i-tag ns-i-tag--ok">{badge}</span> : null}
          <span className="ns-i-sect__chev" aria-hidden="true" />
        </button>
      </h3>
      {open ? <div className="ns-i-sect__b" id={`${id}-p`} role="region" aria-labelledby={`${id}-b`}>{children}</div> : null}
    </section>
  )
}

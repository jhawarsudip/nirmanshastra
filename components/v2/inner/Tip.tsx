'use client'

import { useId, useState } from 'react'
import { IcInfo } from './kit'

export type TipInfo = { title: string; body: string; is?: string }

/**
 * The small "i" that explains a question in plain words.
 * Put it inside a label row (Field's `aside`); the explanation opens on its own line under the label.
 * It is a real button, so it works with a keyboard and a screen reader, and Escape closes it.
 */
export function Tip({ info }: { info: TipInfo }) {
  const [open, setOpen] = useState(false)
  const pid = useId()
  return (
    <>
      <button
        type="button"
        className="ns-i-tipbtn"
        aria-expanded={open}
        aria-controls={open ? pid : undefined}
        aria-label={`About ${info.title}`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
      >
        <IcInfo />
      </button>
      {open && (
        <div className="ns-i-tip" id={pid} role="note">
          <p className="ns-i-tip__t">{info.title}</p>
          <p className="ns-i-tip__b">{info.body}</p>
          {info.is ? <p className="ns-i-tip__is ns-i-mono">{info.is}</p> : null}
        </div>
      )}
    </>
  )
}

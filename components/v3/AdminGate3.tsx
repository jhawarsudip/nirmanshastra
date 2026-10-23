'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MORE, pick, type Loc } from '@/lib/v3/copy'

/**
 * Hidden admin entry (5 quick clicks on the logo). Same /api/admin/login contract as before.
 * The password is verified on the server only; nothing is stored here.
 */
export default function AdminGate3({ onClose, loc }: { onClose: () => void; loc: Loc }) {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [bad, setBad] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = (await res.json()) as { ok?: boolean }
      if (data.ok) { onClose(); router.push('/admin'); return }
    } catch { /* fall through to the error state */ }
    setBusy(false)
    setPw('')
    setBad(true)
    window.setTimeout(() => setBad(false), 500)
    input.current?.focus()
  }

  return (
    <div className="s3-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Admin">
      <form className={`s3-modal__box s3-card${bad ? ' is-bad' : ''}`} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <input
          ref={input}
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder={pick(MORE.pwPlaceholder, loc)}
          autoComplete="off"
          className="s3-input"
        />
        <button type="submit" className="s3-btn s3-btn--indigo s3-btn--sm" disabled={busy || !pw}>
          {busy ? pick(MORE.checking, loc) : pick(MORE.enter, loc)}
        </button>
      </form>
    </div>
  )
}

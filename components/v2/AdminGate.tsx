'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hidden admin entry (5 rapid brand clicks), same /api/admin/login contract as the legacy Navbar modal.
 * Password is verified server-side only; nothing is stored here.
 */
export default function AdminGate({ onClose }: { onClose: () => void }) {
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
    <div className="ns-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Admin access">
      <form className={`ns-modal__box${bad ? ' is-bad' : ''}`} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="ns-eyebrow">ADMIN ACCESS · NS-ADM</div>
        <input
          ref={input}
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Password"
          autoComplete="off"
          className="ns-input ns-mono"
        />
        <button type="submit" className="ns-btn ns-btn--ink ns-btn--sm" disabled={busy || !pw}>
          {busy ? 'Verifying…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}

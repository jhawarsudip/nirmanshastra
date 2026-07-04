'use client'

import { useState } from 'react'

export default function ConsentToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  async function toggle() {
    const next = !checked
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/account/consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_material_partners: next }),
      })
      if (!res.ok) throw new Error('Update failed')
      setChecked(next)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.18)', borderRadius: 2, padding: '20px 24px', background: 'rgba(31,78,121,0.04)' }}>
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
        OPTIONAL · DATA SHARING PREFERENCE
      </p>
      <label style={{ display: 'flex', gap: 12, cursor: saving ? 'not-allowed' : 'pointer', alignItems: 'flex-start' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={toggle}
          disabled={saving}
          style={{ marginTop: 3, accentColor: '#1F4E79', flexShrink: 0, width: 16, height: 16 }}
        />
        <div>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: '#1E2227', lineHeight: 1.55, marginBottom: 6 }}>
            Share my city with construction material partners for relevant offers
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.55)', lineHeight: 1.7 }}>
            If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this consent at any time by unchecking this box.
          </p>
        </div>
      </label>
      {saving && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.4)', marginTop: 10 }}>
          Saving…
        </p>
      )}
      {status === 'saved' && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#14532D', marginTop: 10 }}>
          ✓ Preference saved
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#8C3A22', marginTop: 10 }}>
          ⚠ Failed to save — please try again
        </p>
      )}
    </div>
  )
}

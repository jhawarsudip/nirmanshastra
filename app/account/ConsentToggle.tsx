'use client'

import { useState } from 'react'

interface Props {
  initialCity: boolean
  initialContact: boolean
}

function SingleToggle({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  async function toggle() {
    setSaving(true)
    setStatus('idle')
    try {
      await onToggle()
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
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
            {label}
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.55)', lineHeight: 1.7 }}>
            {description}
          </p>
        </div>
      </label>
      {saving && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.4)', marginTop: 8, marginLeft: 28 }}>
          Saving…
        </p>
      )}
      {status === 'saved' && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#14532D', marginTop: 8, marginLeft: 28 }}>
          ✓ Preference saved
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#8C3A22', marginTop: 8, marginLeft: 28 }}>
          ⚠ Failed to save — please try again
        </p>
      )}
    </div>
  )
}

export default function ConsentToggle({ initialCity, initialContact }: Props) {
  const [cityChecked, setCityChecked] = useState(initialCity)
  const [contactChecked, setContactChecked] = useState(initialContact)

  async function patchConsent(field: 'consent_material_partners' | 'consent_material_partners_contact', value: boolean) {
    const res = await fetch('/api/account/consent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (!res.ok) throw new Error('Update failed')
  }

  async function toggleCity() {
    const next = !cityChecked
    await patchConsent('consent_material_partners', next)
    setCityChecked(next)
  }

  async function toggleContact() {
    const next = !contactChecked
    await patchConsent('consent_material_partners_contact', next)
    setContactChecked(next)
  }

  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.18)', borderRadius: 2, padding: '20px 24px', background: 'rgba(31,78,121,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        SHARE WITH MATERIAL PARTNERS (OPTIONAL)
      </p>

      <SingleToggle
        label="Share my city with construction material partners for relevant offers"
        description="If checked, we may share your city (not your phone number or exact address) with cement, steel, or other construction material companies for partnership offers. You can withdraw this consent at any time by unchecking this box."
        checked={cityChecked}
        onToggle={toggleCity}
      />

      <div style={{ height: 1, background: 'rgba(30,34,39,0.1)' }} />

      <SingleToggle
        label="Also share my name, phone number, and email with construction material partners for offers"
        description="If checked, we may share your name, phone number, and email with cement, steel, or other construction material companies for partnership offers. You can withdraw this anytime by unchecking this box."
        checked={contactChecked}
        onToggle={toggleContact}
      />
    </div>
  )
}

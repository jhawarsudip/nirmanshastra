'use client'

import { useId, useState } from 'react'
import { IcAlert, IcCheck } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { CONSENT } from '@/lib/i18n/labels/pages-account'

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
  onToggle: () => Promise<void>
}) {
  const id = useId()
  const c = useCopy(CONSENT)
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
    <div className="ns-ac-opt">
      <label className="ns-i-chk" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={toggle} disabled={saving} aria-describedby={`${id}-d`} />
        <span>{label}</span>
      </label>
      <p className="ns-i-hint" id={`${id}-d`}>{description}</p>
      <p className="ns-ac-status" role="status" aria-live="polite">
        {saving ? c.saving : null}
        {status === 'saved' ? <span className="ns-ac-status--ok"><IcCheck width={16} height={16} aria-hidden="true" /> {c.saved}</span> : null}
        {status === 'error' ? <span className="ns-ac-status--err"><IcAlert width={16} height={16} aria-hidden="true" /> {c.failed}</span> : null}
      </p>
    </div>
  )
}

export default function ConsentToggle({ initialCity, initialContact }: Props) {
  const c = useCopy(CONSENT)
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
    <section className="ns-plate ns-r-sec" aria-labelledby="ac-share">
      <h2 id="ac-share" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>
        {c.h}
      </h2>

      <SingleToggle
        label={c.cityLabel}
        description={c.cityDesc}
        checked={cityChecked}
        onToggle={toggleCity}
      />

      <hr className="ns-ac-rule" />

      <SingleToggle
        label={c.contactLabel}
        description={c.contactDesc}
        checked={contactChecked}
        onToggle={toggleContact}
      />
    </section>
  )
}

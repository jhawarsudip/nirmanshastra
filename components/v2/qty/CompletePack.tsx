'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Field, Input, Select, Note, ToolHead, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { STATES } from '@/lib/qty/states'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { PACK_CLAIMS_PER_REPORT, PACK_CONTAINS, PRICE, TOOL_PRICE_PAISE, rupees } from '@/lib/tool-pricing'
import { PACK_LABEL, PACK_TOOL_PATH, type PackStatus } from '@/lib/pack/shared'
import { useUnlock } from './useUnlock'
import { readStoredPackId, rememberPackId } from './usePack'
import { trackLead } from '@/lib/analytics/events'
import ViewItem from '@/components/analytics/ViewItem'
import '@/styles/v2/results.css'

/*
  The Complete House Pack page. Two states:
   - no pack yet: what it holds, what it saves, a short form, then the payment (the same verified Razorpay path as a single report);
   - a paid pack: which reports it has unlocked and which are left, with a link into each tool.
  The price on this page is read from lib/tool-pricing.ts; the amount charged is looked up on the server from the pack record.
*/

interface Form { name: string; email: string; projectName: string; state: string; city: string }
const EMPTY: Form = { name: '', email: '', projectName: '', state: '', city: '' }

export default function CompletePack() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Partial<Form>>({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [packId, setPackId] = useState<string | null>(null)
  const [status, setStatus] = useState<PackStatus | null>(null)
  const [checked, setChecked] = useState(false)

  const u = useUnlock<unknown>({
    api: '/api/pack',
    estimateId: packId,
    contactName: form.name,
    description: 'Complete House Pack: five reports and the Grand Total',
    fileName: '',
    reportless: true,
  })

  // A pack this browser already holds (or one opened from the email link, ?pack=…)
  useEffect(() => {
    const id = readStoredPackId()
    if (!id) { setChecked(true); return }
    fetch(`/api/pack/status?packId=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.status?.paid) { setPackId(id); setStatus(j.status as PackStatus) }
      })
      .catch(() => { /* offline: show the offer */ })
      .finally(() => setChecked(true))
  }, [])

  // Right after the payment is verified, keep the pack in this browser and read what it holds.
  useEffect(() => {
    if (!packId || PAYMENT_BYPASS || u.payStatus !== 'paid') return
    rememberPackId(packId)
    fetch(`/api/pack/status?packId=${encodeURIComponent(packId)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.status) setStatus(j.status as PackStatus) })
      .catch(() => { /* the buttons below still work */ })
  }, [packId, u.payStatus])

  function set<K extends keyof Form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Form> = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!form.state) e.state = 'Please choose your state'
    if (!form.city.trim()) e.city = 'Please enter your city'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/pack/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.packId) throw new Error(json.error || 'We could not save your details.')
      trackLead('completepack', 'email') // generate_lead / Lead: an email address was given
      setPackId(json.packId)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const ready = !!status?.paid || (PAYMENT_BYPASS && !!packId)

  return (
    <div className="ns-i-page" style={{ ['--tc' as string]: 'var(--ns-laterite)' }}>
      <ViewItem appType="completepack" />
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Best value · all six reports"
          name="Complete House Pack"
          price={PRICE.pack}
          blurb="All five quantity reports for one house: structure, masonry, electrical, plumbing and interior, plus the Grand Total buying list. Pay once, then use it where you would otherwise pay."
        />

        {ready ? (
          <section className="ns-plate ns-r-sec" aria-labelledby="pk-ready">
            <h2 id="pk-ready" style={{ margin: 0 }}>Your pack is ready</h2>
            {PAYMENT_BYPASS && !status?.paid && <Note kind="info" title="Preview mode">Payment is switched off on this copy of the site, so the pack is open for testing.</Note>}
            <p className="ns-r-sec__sub">Open a tool, enter your house, and press <b>Use my Complete House Pack</b> where you would otherwise pay. A pack covers one house.</p>
            <ul className="ns-pk-list">
              {PACK_CONTAINS.map(k => {
                const used = status?.used[k] ?? 0
                const left = status?.remaining[k] ?? 0
                return (
                  <li key={k}>
                    <span><IcCheck width={18} height={18} /> <b>{PACK_LABEL[k]}</b></span>
                    <span className="ns-i-fine">{status ? `${used} made · ${left} left` : ''}</span>
                    <Link href={PACK_TOOL_PATH[k]} className="ns-i-link">Open {PACK_LABEL[k]} <IcArrow width={18} height={9} /></Link>
                  </li>
                )
              })}
            </ul>
            <p className="ns-i-fine">We have emailed you a link to this page. Keep it: it opens your pack on another phone or computer.</p>
          </section>
        ) : (
          <>
            <section className="ns-plate ns-r-sec" aria-labelledby="pk-save">
              <h2 id="pk-save" style={{ margin: 0 }}>What you get, and what you save</h2>
              <table className="ns-i-tbl ns-i-tbl--plain" style={{ width: '100%' }}>
                <tbody>
                  {PACK_CONTAINS.map(k => (
                    <tr key={k}><th scope="row">{PACK_LABEL[k]}</th><td style={{ textAlign: 'right' }}>{rupees(TOOL_PRICE_PAISE[k])}</td></tr>
                  ))}
                  <tr><th scope="row">Bought one by one</th><td style={{ textAlign: 'right' }}><b>{PRICE.packSeparate}</b></td></tr>
                  <tr><th scope="row">Complete House Pack</th><td style={{ textAlign: 'right' }}><b>{PRICE.pack}</b></td></tr>
                  <tr><th scope="row">You save</th><td style={{ textAlign: 'right' }}><b>{PRICE.packSavings}</b> ({PRICE.packSavingsPercent})</td></tr>
                </tbody>
              </table>
              <p className="ns-i-fine">A pack covers one house. Every report must match the same building: the same floors, the same state and a floor area within 10%. Each report can be made up to {PACK_CLAIMS_PER_REPORT} times, so you can correct a figure you typed wrongly.</p>
            </section>

            {checked && !packId && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="ns-plate ns-i-card">
                  <p className="ns-i-card__eyebrow">Step 1 of 2</p>
                  <h2>Tell us who and where</h2>
                  <p className="ns-i-card__sub">We send your pack link to this email. It takes under a minute.</p>
                  <div className="ns-i-card__body">
                    <div className="ns-i-fields">
                      <Field id="pk-name" label="Your name" required error={errors.name} wide>
                        <Input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Sharma" autoComplete="name" />
                      </Field>
                      <Field id="pk-email" label="Email" required error={errors.email} hint="Your pack link is sent here." wide>
                        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ramesh@example.com" autoComplete="email" inputMode="email" />
                      </Field>
                      <Field id="pk-state" label="State" required error={errors.state}>
                        <Select value={form.state} onChange={e => set('state', e.target.value)}>
                          <option value="">Select your state</option>
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </Field>
                      <Field id="pk-city" label="City" required error={errors.city}>
                        <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pune" autoComplete="address-level2" />
                      </Field>
                      <Field id="pk-project" label="House name (optional)" hint="To find your reports again. You can skip it." wide>
                        <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="e.g. Sharma Residence, Kothrud" />
                      </Field>
                    </div>
                  </div>
                  <div className="ns-i-card__foot">
                    {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title="That did not go through">{apiError}</Note></div>}
                    <button type="submit" disabled={saving} className="ns-btn">
                      {saving ? 'Saving…' : 'Continue to payment'}
                      {!saving && <IcArrow width={22} height={11} />}
                    </button>
                    <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>We save your details securely and email you only your pack link and a few IS-code construction tips.</p>
                  </div>
                </div>
              </form>
            )}

            {packId && (
              <section className="ns-plate ns-r-unlock" aria-labelledby="pk-pay">
                <div>
                  <p className="ns-r-hook__k">Step 2 of 2</p>
                  <h3 id="pk-pay">Pay once for the whole house</h3>
                </div>
                <ul className="ns-r-unlock__list">
                  {PACK_CONTAINS.map(k => <li key={k}><IcCheck />{PACK_LABEL[k]}</li>)}
                </ul>
                <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy}>
                  {u.payStatus === 'creating' ? 'Starting the payment…' : u.payStatus === 'verifying' ? 'Checking your payment…' : u.payStatus === 'polling' ? 'Confirming your payment…' : `Pay ${PRICE.pack} for the Complete House Pack`}
                  {!u.busy && <IcArrow width={22} height={11} />}
                </button>
                {u.payError && <Note kind="err">{u.payError}</Note>}
                <p className="ns-i-fine">One payment, no subscription. Paid through Razorpay; we never see your card details.</p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

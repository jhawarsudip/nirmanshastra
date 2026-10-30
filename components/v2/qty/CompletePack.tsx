'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Field, Input, Select, Note, ToolHead, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { STATES } from '@/lib/qty/states'
import { PAYMENT_BYPASS } from '@/lib/payment-config'
import { PACK_CLAIMS_PER_REPORT, PACK_CONTAINS, PRICE, TOOL_PRICE_PAISE, rupees } from '@/lib/tool-pricing'
import { PACK_LABEL, PACK_TOOL_PATH, type PackStatus } from '@/lib/pack/shared'
import { useCopy } from '@/lib/i18n/use-copy'
import { useQtyTr } from '@/lib/i18n/use-qty-tr'
import { stateLabel } from '@/lib/i18n/states'
import { PACK_PAGE } from '@/lib/i18n/labels/calc-pack'
import { QTY_REG, QTY_RES } from '@/lib/i18n/labels/qty-ui'
import { useUnlock } from './useUnlock'
import { readStoredPackId, rememberPackId } from './usePack'
import { trackLead } from '@/lib/analytics/events'
import ViewItem from '@/components/analytics/ViewItem'
import SampleReportLink from '@/components/samples/SampleReportLink'
import PayAssurance from '@/components/policy/PayAssurance'
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
  const k = useCopy(PACK_PAGE)
  const reg = useCopy(QTY_REG)
  const rs = useCopy(QTY_RES)
  const t = useQtyTr('none')
  const locale = useLocale()
  const nameOf = (key: keyof typeof PACK_LABEL) => (PACK_LABEL[key] === 'Grand Total' ? k.grandTotal : PACK_LABEL[key])
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
    if (!form.name.trim()) e.name = reg.errName
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = reg.errEmail
    if (!form.state) e.state = reg.errState
    if (!form.city.trim()) e.city = reg.errCity
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
      if (!res.ok || !json.packId) throw new Error(json.error || k.couldNotSave)
      trackLead('completepack', 'email') // generate_lead / Lead: an email address was given
      setPackId(json.packId)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : k.wentWrong)
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
          eyebrow={k.eyebrow}
          name={k.name}
          price={PRICE.pack}
          blurb={k.blurb}
          after={<SampleReportLink sample="completepack" hi={locale === 'hi'} where="tool_head" />}
        />

        {ready ? (
          <section className="ns-plate ns-r-sec" aria-labelledby="pk-ready">
            <h2 id="pk-ready" style={{ margin: 0 }}>{k.readyTitle}</h2>
            {PAYMENT_BYPASS && !status?.paid && <Note kind="info" title={k.previewTitle}>{k.previewText}</Note>}
            <p className="ns-r-sec__sub">{k.readyBefore}<b>{k.readyButton}</b>{k.readyAfter}</p>
            <ul className="ns-pk-list">
              {PACK_CONTAINS.map(key => {
                const used = status?.used[key] ?? 0
                const left = status?.remaining[key] ?? 0
                return (
                  <li key={key}>
                    <span><IcCheck width={18} height={18} /> <b>{nameOf(key)}</b></span>
                    <span className="ns-i-fine">{status ? k.madeLeft(used, left) : ''}</span>
                    <Link href={PACK_TOOL_PATH[key]} className="ns-i-link">{k.open(nameOf(key))} <IcArrow width={18} height={9} /></Link>
                  </li>
                )
              })}
            </ul>
            <p className="ns-i-fine">{k.emailed}</p>
          </section>
        ) : (
          <>
            <section className="ns-plate ns-r-sec" aria-labelledby="pk-save">
              <h2 id="pk-save" style={{ margin: 0 }}>{k.saveTitle}</h2>
              <table className="ns-i-tbl ns-i-tbl--plain" style={{ width: '100%' }}>
                <tbody>
                  {PACK_CONTAINS.map(key => (
                    <tr key={key}><th scope="row">{nameOf(key)}</th><td style={{ textAlign: 'right' }}>{rupees(TOOL_PRICE_PAISE[key])}</td></tr>
                  ))}
                  <tr><th scope="row">{k.oneByOne}</th><td style={{ textAlign: 'right' }}><b>{PRICE.packSeparate}</b></td></tr>
                  <tr><th scope="row">{k.packRow}</th><td style={{ textAlign: 'right' }}><b>{PRICE.pack}</b></td></tr>
                  <tr><th scope="row">{k.youSave}</th><td style={{ textAlign: 'right' }}><b>{PRICE.packSavings}</b> ({PRICE.packSavingsPercent})</td></tr>
                </tbody>
              </table>
              <p className="ns-i-fine">{k.fine(PACK_CLAIMS_PER_REPORT)}</p>
            </section>

            {checked && !packId && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="ns-plate ns-i-card">
                  <p className="ns-i-card__eyebrow">{k.step1}</p>
                  <h2>{reg.title}</h2>
                  <p className="ns-i-card__sub">{k.formSub}</p>
                  <div className="ns-i-card__body">
                    <div className="ns-i-fields">
                      <Field id="pk-name" label={reg.yourName} required error={errors.name} wide>
                        <Input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder={reg.namePh} autoComplete="name" />
                      </Field>
                      <Field id="pk-email" label={reg.email} required error={errors.email} hint={k.emailHint} wide>
                        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={reg.emailPh} autoComplete="email" inputMode="email" />
                      </Field>
                      <Field id="pk-state" label={reg.state} required error={errors.state}>
                        <Select value={form.state} onChange={e => set('state', e.target.value)}>
                          <option value="">{reg.selectState}</option>
                          {STATES.map(s => <option key={s} value={s}>{stateLabel(s, locale)}</option>)}
                        </Select>
                      </Field>
                      <Field id="pk-city" label={reg.city} required error={errors.city}>
                        <Input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder={reg.cityPh} autoComplete="address-level2" />
                      </Field>
                      <Field id="pk-project" label={k.houseName} hint={k.houseHint} wide>
                        <Input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder={reg.projectPh} />
                      </Field>
                    </div>
                  </div>
                  <div className="ns-i-card__foot">
                    {apiError && <div style={{ flexBasis: '100%' }}><Note kind="err" title={reg.didNotGoThrough}>{t(apiError)}</Note></div>}
                    <button type="submit" disabled={saving} className="ns-btn">
                      {saving ? reg.saving : k.toPayment}
                      {!saving && <IcArrow width={22} height={11} />}
                    </button>
                    <p className="ns-i-fine" style={{ flex: '1 1 260px' }}>{k.formFine}</p>
                  </div>
                </div>
              </form>
            )}

            {packId && (
              <section className="ns-plate ns-r-unlock" aria-labelledby="pk-pay">
                <div>
                  <p className="ns-r-hook__k">{k.step2}</p>
                  <h3 id="pk-pay">{k.payTitle}</h3>
                </div>
                <ul className="ns-r-unlock__list">
                  {PACK_CONTAINS.map(key => <li key={key}><IcCheck />{nameOf(key)}</li>)}
                </ul>
                <button type="button" className="ns-btn" onClick={u.unlock} disabled={u.busy}>
                  {u.payStatus === 'creating' ? rs.starting : u.payStatus === 'verifying' ? rs.checkingPay : u.payStatus === 'polling' ? rs.confirmingPay : k.payButton(PRICE.pack)}
                  {!u.busy && <IcArrow width={22} height={11} />}
                </button>
                {u.payError && <Note kind="err">{u.payError}</Note>}
                <PayAssurance sample="completepack" hi={locale === 'hi'} />
                <p className="ns-i-fine">{k.payFine}</p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

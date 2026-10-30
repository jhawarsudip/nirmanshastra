'use client'

import { useEffect, useMemo, useState } from 'react'
import { STATES } from '@/lib/qty/states'
import type { TradeMeta } from '@/lib/qty/meta'
import type { Cond, FieldSpec, FormSpec, Values } from '@/lib/qty/forms/types'
import type { SelectedProject } from '@/components/v2/inner/ProjectPicker'
import { Field, Input, Select, Note, IcArrow, IcAlert } from '@/components/v2/inner/kit'
import { Tip } from '@/components/v2/inner/Tip'
import Disclosure from '@/components/v2/inner/Disclosure'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { stateLabel } from '@/lib/i18n/states'
import { QTY_FORM } from '@/lib/i18n/labels/qty-ui'

/*
  One form for every trade tool. The first section (plot, floors, area) is the same for all of them;
  the rest is drawn from the tool's FormSpec. Only plain questions are asked: no rates, no quantities, no product names.
*/

const MAX_FLOORS = 10

function holds(c: Cond | undefined, v: Values): boolean {
  if (!c) return true
  const cur = v[c.id]
  if ('in' in c) return c.in.includes(String(cur))
  return cur === c.is
}

function defaults(spec: FormSpec): Values {
  const out: Values = {}
  for (const g of spec.groups) for (const f of g.fields) {
    if (f.kind === 'number') out[f.id] = f.def !== undefined ? String(f.def) : ''
    else out[f.id] = f.def
  }
  return out
}

interface Props {
  spec: FormSpec
  meta: TradeMeta
  price: string
  state: string
  city: string
  initialProject?: SelectedProject
  onSubmit: (input: Record<string, unknown>) => void
  onRows: (rows: [string, string][]) => void
  onBack?: () => void
}

export default function QtyForm({ spec, meta, price, state: initState, city: initCity, initialProject, onSubmit, onRows, onBack }: Props) {
  const k = useCopy(QTY_FORM)
  const locale = useLocale()
  const floorLabel = (n: number) => (n === 1 ? k.gOnly : k.gPlus(n - 1))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localState, setLocalState] = useState(initState || '')
  const [localCity, setLocalCity] = useState(initCity || '')

  // The project stores the total number of floors (G = 1) and the area of each.
  const initFloors = initialProject?.numFloors != null ? Math.min(MAX_FLOORS, Math.max(1, initialProject.numFloors)) : 2
  const initAreas = initialProject?.perFloorAreas ?? null
  const [numFloors, setNumFloors] = useState(initFloors)
  const [sameArea, setSameArea] = useState(!initAreas || initAreas.length <= 1 || initAreas.every(a => a === initAreas[0]))
  const [groundArea, setGroundArea] = useState(initAreas && initAreas.length > 0 && initAreas[0] > 0 ? String(initAreas[0]) : '')
  const [areas, setAreas] = useState<string[]>(() =>
    initAreas && initAreas.length > 1 ? initAreas.map(a => (a > 0 ? String(a) : '')) : Array(initFloors).fill(''),
  )
  const [vals, setVals] = useState<Values>(() => defaults(spec))

  useEffect(() => {
    setAreas(prev => (prev.length === numFloors ? prev : [...prev, ...Array(Math.max(0, numFloors - prev.length)).fill('')].slice(0, numFloors)))
  }, [numFloors])

  const floorAreas = useMemo(
    () => (sameArea ? Array(numFloors).fill(parseFloat(groundArea) || 0) : areas.slice(0, numFloors).map(a => parseFloat(a) || 0)),
    [sameArea, numFloors, groundArea, areas],
  )
  const total = floorAreas.reduce((s, a) => s + a, 0)

  // "Your project so far"
  useEffect(() => {
    onRows(spec.summary(vals, { floors: numFloors, areaSqft: total }))
  }, [vals, numFloors, total]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id: string, v: string | number | boolean) => {
    setVals(prev => ({ ...prev, [id]: v }))
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!localState) errs.state = k.errState
    if (sameArea && (!(parseFloat(groundArea) >= 100) || parseFloat(groundArea) > 30000)) errs.area = k.errArea
    if (!sameArea && floorAreas.some(a => !(a >= 100) || a > 30000)) errs.floors = k.errFloors
    for (const g of spec.groups) for (const f of g.fields) {
      if (!holds(f.showIf, vals)) continue
      if (f.kind === 'number') {
        const raw = String(vals[f.id] ?? '').trim()
        if (raw === '') { if (!f.optional) errs[f.id] = k.errEnter(f.label); continue }
        const n = Number(raw)
        if (!Number.isFinite(n) || n < f.min || n > f.max) errs[f.id] = k.errRange(f.label, f.min, f.max)
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const input: Record<string, unknown> = { floorAreasSqft: floorAreas, state: localState, city: localCity.trim() || undefined }
    for (const g of spec.groups) for (const f of g.fields) {
      const v = vals[f.id]
      if (f.kind === 'number') {
        const raw = String(v ?? '').trim()
        if (raw !== '') input[f.id] = Number(raw)
      } else input[f.id] = v
    }
    onSubmit(input)
  }

  const errorList = Object.values(errors).filter(Boolean)

  return (
    <form onSubmit={e => e.preventDefault()} noValidate className="ns-i-form">
      {onBack && <button type="button" className="ns-i-back" onClick={onBack}><IcArrow />{k.back}</button>}

      <div className="ns-plate ns-i-card">
        <p className="ns-i-card__eyebrow">{k.step}</p>
        <h2>{spec.heading}</h2>
        <p className="ns-i-card__sub">{spec.sub}</p>
      </div>

      {/* 1 ─ the plot and the floors, the same for every tool */}
      <Disclosure n="1" title={k.plotTitle}>
        <div className="ns-i-fields">
          <Field id="qf-state" label={k.state} required error={errors.state}>
            <Select value={localState} onChange={e => setLocalState(e.target.value)}>
              <option value="">{k.selectState}</option>
              {STATES.map(s => <option key={s} value={s}>{stateLabel(s, locale)}</option>)}
            </Select>
          </Field>
          <Field id="qf-city" label={k.city}>
            <Input value={localCity} onChange={e => setLocalCity(e.target.value)} placeholder={k.cityPh} autoComplete="address-level2" />
          </Field>
          <Field id="qf-floors" label={k.numFloors} hint={k.numFloorsHint}>
            <Select value={numFloors} onChange={e => setNumFloors(parseInt(e.target.value))}>
              {Array.from({ length: MAX_FLOORS }, (_, i) => i + 1).map(n => <option key={n} value={n}>{floorLabel(n)}</option>)}
            </Select>
          </Field>
          <fieldset className="ns-i-fs">
            <legend className="ns-i-lab">{k.sameArea}</legend>
            <div className="ns-i-seg">
              {(['Yes', 'No'] as const).map(opt => (
                <label key={opt} className="ns-i-segopt">
                  <input type="radio" name="qf-samearea" checked={sameArea === (opt === 'Yes')} onChange={() => setSameArea(opt === 'Yes')} />
                  <span>{opt === 'Yes' ? k.yes : k.no}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {sameArea ? (
          <div className="ns-i-fields">
            <Field id="qf-area" label={k.areaOne} required hint={k.areaOneHint} error={errors.area}>
              <Input type="number" inputMode="numeric" min="100" placeholder={k.areaPh} value={groundArea} onChange={e => { setGroundArea(e.target.value); if (errors.area) setErrors(p => ({ ...p, area: '' })) }} />
            </Field>
          </div>
        ) : (
          <>
            <ul className="ns-i-floors">
              {floorAreas.map((a, idx) => {
                const bad = !!errors.floors && !(a >= 100 && a <= 30000)
                return (
                  <li key={idx} className="ns-i-floor">
                    <p className="ns-i-floor__t">{k.floorNames[idx] ?? k.floorN(idx)}</p>
                    <div className="ns-i-floor__g">
                      <Field id={`qf-fa-${idx}`} label={k.areaFloor} invalid={bad}>
                        <Input type="number" inputMode="numeric" min="0" placeholder={k.areaPh} value={areas[idx] ?? ''} onChange={e => setAreas(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))} />
                      </Field>
                    </div>
                  </li>
                )
              })}
            </ul>
            {errors.floors && <p className="ns-i-err" role="alert"><IcAlert />{errors.floors}</p>}
          </>
        )}
      </Disclosure>

      {/* 2… ─ the tool's own questions */}
      {spec.groups.map((g, gi) => (
        <Disclosure key={g.title} n={String(gi + 2)} title={g.title}>
          {g.intro ? <Note kind="info">{g.intro}</Note> : null}
          {g.fields.filter(f => holds(f.showIf, vals)).map(f => (
            <Ask key={f.id} f={f} v={vals[f.id]} onChange={val => set(f.id, val)} error={errors[f.id]} />
          ))}
        </Disclosure>
      ))}

      <div className="ns-i-actions">
        {errorList.length > 0 && (
          <div className="ns-i-note ns-i-note--err ns-i-errsum" role="alert">
            <IcAlert />
            <div>
              <p><b>{k.checkThese}</b></p>
              <ul>{errorList.map(m => <li key={m}>{m}</li>)}</ul>
            </div>
          </div>
        )}
        <div className="ns-i-actions__r">
          <button type="button" className="ns-btn" onClick={handleSubmit}>
            {k.work}
            <IcArrow width={22} height={11} />
          </button>
        </div>
        <p className="ns-i-fine">{spec.freeLine} ({price}){locale === 'hi' ? '।' : '.'}</p>
      </div>
    </form>
  )
}

// ─── one question ─────────────────────────────────────────────────────────────

function Ask({ f, v, onChange, error }: { f: FieldSpec; v: string | number | boolean | undefined; onChange: (v: string | number | boolean) => void; error?: string }) {
  const k = useCopy(QTY_FORM)
  const id = `qf-${f.id}`
  const legend = (
    <legend className="ns-i-lab" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {f.label}
      {f.tip ? <Tip info={f.tip} /> : null}
    </legend>
  )
  const hint = f.hint ? <p className="ns-i-hint" id={`${id}-h`} style={{ margin: '0 0 8px' }}>{f.hint}</p> : null

  if (f.kind === 'choice') {
    return (
      <fieldset className="ns-i-fs" aria-describedby={f.hint ? `${id}-h` : undefined}>
        {legend}
        {hint}
        <div className={`ns-i-choices${f.options.length === 2 ? ' ns-i-choices--2' : ''}`}>
          {f.options.map(o => (
            <label key={o.value} className="ns-i-choice">
              <input type="radio" name={id} checked={v === o.value} onChange={() => onChange(o.value)} />
              <span>
                <span className="ns-i-choice__t">{o.label}</span>
                {o.note ? <span className="ns-i-choice__d">{o.note}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (f.kind === 'yesno') {
    return (
      <fieldset className="ns-i-fs" aria-describedby={f.hint ? `${id}-h` : undefined}>
        {legend}
        {hint}
        <div className="ns-i-seg">
          {([[k.yes, true], [k.no, false]] as const).map(([label, val]) => (
            <label key={label} className="ns-i-segopt">
              <input type="radio" name={id} checked={v === val} onChange={() => onChange(val)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (f.kind === 'count') {
    const n = typeof v === 'number' ? v : f.def
    return (
      <fieldset className="ns-i-fs" aria-describedby={f.hint ? `${id}-h` : undefined}>
        {legend}
        {hint}
        <div className="ns-i-qty">
          <button type="button" aria-label={k.oneFewer(f.label)} disabled={n <= f.min} onClick={() => onChange(Math.max(f.min, n - 1))}>−</button>
          <output className="ns-i-qty__v" aria-live="polite" htmlFor={id}>{n}</output>
          <button type="button" id={id} aria-label={k.oneMore(f.label)} disabled={n >= f.max} onClick={() => onChange(Math.min(f.max, n + 1))}>+</button>
        </div>
      </fieldset>
    )
  }

  // a typed number
  return (
    <div className="ns-i-fields">
      <Field id={id} label={f.label} hint={f.hint} error={error} aside={f.tip ? <Tip info={f.tip} /> : undefined}>
        <Input type="number" inputMode="numeric" min={f.min} max={f.max} placeholder={f.placeholder} value={String(v ?? '')} onChange={e => onChange(e.target.value)} />
      </Field>
    </div>
  )
}

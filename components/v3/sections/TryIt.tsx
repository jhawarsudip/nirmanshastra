'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Arrow } from '../Icons'
import { MORE, TRY, pick, type Loc } from '@/lib/v3/copy'
import { useTween } from '@/lib/v2/store'

// Rule of thumb for the RCC frame, from the structural engine's cross-check: 0.4 bag cement and 4 kg steel per sq ft of built-up area.
const BAG_PER_SQFT = 0.4
const KG_PER_SQFT = 4
const MIN = 300
const MAX = 5000

const inr = (n: number) => Math.round(n).toLocaleString('en-IN')

function Sack() {
  return (
    <svg viewBox="0 0 28 34" className="s3-sack" aria-hidden="true">
      <path d="M5 8c0-2.5 2-4 4.500-4h9c2.500 0 4.500 1.500 4.500 4l1.500 19c.2 2-1.300 3.500-3.300 3.500H6.800C4.800 30.500 3.300 29 3.500 27z" fill="#E9E1D2" stroke="#2A1E16" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 5.500c2.500 1.800 5 2 8 2s5.500-.2 8-2" fill="none" stroke="#2A1E16" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8.500" y="14" width="11" height="7" rx="1.500" fill="#2E3F94" />
      <path d="M10.500 17.500h7" stroke="#FFFCF3" strokeWidth="1.400" strokeLinecap="round" />
    </svg>
  )
}

function Bundle() {
  return (
    <svg viewBox="0 0 30 34" className="s3-bundle" aria-hidden="true">
      {[5, 9, 13, 17, 21, 25].map(x => (
        <path key={x} d={`M${x} 3V31`} stroke="#B5472B" strokeWidth="2.600" strokeLinecap="round" />
      ))}
      <path d="M3 12h24M3 22h24" stroke="#2A1E16" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** A little house with one storey per floor, so the floors control visibly does something. */
function Storeys({ n }: { n: number }) {
  const h = 22
  return (
    <svg viewBox="0 0 96 140" className="s3-storeys" aria-hidden="true" key={n}>
      <rect x="6" y="130" width="84" height="6" rx="3" fill="#7DB36B" stroke="#2A1E16" strokeWidth="1.800" />
      {Array.from({ length: n }, (_, i) => {
        const y = 130 - (i + 1) * h
        return (
          <g key={i} className="s3-storeys__f" style={{ animationDelay: `${i * 90}ms` }}>
            <rect x="18" y={y} width="60" height={h} fill="#D98A5F" stroke="#2A1E16" strokeWidth="1.800" />
            <rect x="26" y={y + 5} width="11" height="12" fill="#CFE5F2" stroke="#2A1E16" strokeWidth="1.400" />
            <rect x="59" y={y + 5} width="11" height="12" fill="#CFE5F2" stroke="#2A1E16" strokeWidth="1.400" />
            <rect x="14" y={y - 3} width="68" height="5" fill="#D3CCBF" stroke="#2A1E16" strokeWidth="1.400" />
          </g>
        )
      })}
    </svg>
  )
}

export default function TryIt({ loc, rates }: { loc: Loc; rates: { cement: number; steel: number } }) {
  const id = useId()
  const [area, setArea] = useState(1500)
  const [floors, setFloors] = useState(2)
  const [cr, setCr] = useState(String(rates.cement))
  const [sr, setSr] = useState(String(rates.steel))

  const bags = Math.ceil(area * BAG_PER_SQFT)
  const kg = Math.round(area * KG_PER_SQFT)
  const cRate = Math.max(0, Number(cr) || 0)
  const sRate = Math.max(0, Number(sr) || 0)
  const cost = bags * cRate + kg * sRate

  const vBags = useTween(bags)
  const vKg = useTween(kg)
  const vCost = useTween(cost)

  const sacks = Math.ceil(bags / 50)
  const bundles = Math.ceil(kg / 500)
  const pct = ((area - MIN) / (MAX - MIN)) * 100
  const outside = floors < 1 || floors > 3

  const setAreaSafe = (v: number) => setArea(Math.min(MAX, Math.max(MIN, Math.round(v) || MIN)))

  return (
    <section id="try" className="s3-section s3-section--alt s3-try" aria-labelledby={`${id}-h`}>
      <div className="s3-wrap">
        <div className="s3-head s3-rise">
          <h2 className="s3-h2" id={`${id}-h`}>{pick(TRY.title, loc)}</h2>
          <p className="s3-lede">{pick(TRY.lede, loc)}</p>
        </div>

        <div className="s3-try__card s3-card s3-rise">
          <div className="s3-try__controls">
            <div className="s3-field">
              <label htmlFor={`${id}-area`} className="s3-label">{pick(TRY.area, loc)}</label>
              <div className="s3-try__areaRow">
                <input
                  id={`${id}-area`}
                  className="s3-input s3-try__areaNum s3-num"
                  type="number"
                  inputMode="numeric"
                  min={MIN}
                  max={MAX}
                  step={50}
                  value={area}
                  onChange={e => setArea(Number(e.target.value) || 0)}
                  onBlur={e => setAreaSafe(Number(e.target.value))}
                />
                <span className="s3-try__unit">{pick(TRY.sqft, loc)}</span>
              </div>
              <input
                className="s3-range"
                type="range"
                min={MIN}
                max={MAX}
                step={50}
                value={Math.min(MAX, Math.max(MIN, area))}
                onChange={e => setArea(Number(e.target.value))}
                aria-label={pick(TRY.area, loc)}
                style={{ ['--p' as string]: `${pct}%` }}
              />
              <div className="s3-range__ends s3-num" aria-hidden="true"><span>{MIN}</span><span>{inr(MAX)}</span></div>
            </div>

            <div className="s3-field">
              <span className="s3-label" id={`${id}-fl`}>{pick(TRY.floors, loc)}</span>
              <div className="s3-try__floorRow">
                <div className="s3-pills" role="radiogroup" aria-labelledby={`${id}-fl`}>
                  {TRY.floorOpts.map(o => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={floors === o.v}
                      className={`s3-pill${floors === o.v ? ' is-on' : ''}`}
                      onClick={() => setFloors(o.v)}
                    >
                      {pick(o, loc)}
                    </button>
                  ))}
                </div>
                <Storeys n={floors + 1} />
              </div>
              <p className="s3-try__hint">{pick(MORE.floorsHint, loc)}</p>
            </div>

            <fieldset className="s3-field s3-try__rates">
              <legend className="s3-label">{pick(TRY.rates, loc)}</legend>
              <label className="s3-rate">
                <span>{pick(TRY.perBag, loc)}</span>
                <span className="s3-rate__box"><b>₹</b><input className="s3-input s3-num" type="number" inputMode="decimal" min={0} value={cr} onChange={e => setCr(e.target.value)} /></span>
              </label>
              <label className="s3-rate">
                <span>{pick(TRY.perKg, loc)}</span>
                <span className="s3-rate__box"><b>₹</b><input className="s3-input s3-num" type="number" inputMode="decimal" min={0} value={sr} onChange={e => setSr(e.target.value)} /></span>
              </label>
            </fieldset>
          </div>

          <div className="s3-try__sheet">
            <output className="s3-sr">{`${inr(bags)} ${pick(TRY.bags, loc)} ${pick(TRY.cement, loc)}, ${inr(kg)} ${pick(TRY.kg, loc)} ${pick(TRY.steel, loc)}, ₹${inr(cost)}`}</output>

            <div className="s3-try__row" aria-hidden="true">
              <p className="s3-try__what">{pick(TRY.cement, loc)}</p>
              <p className="s3-try__big s3-num">{inr(vBags)} <small>{pick(TRY.bags, loc)}</small></p>
              <div className="s3-try__stack">{Array.from({ length: sacks }, (_, i) => <Sack key={i} />)}</div>
              <p className="s3-try__legend">{pick(MORE.legendCement, loc)}</p>
            </div>

            <div className="s3-try__row" aria-hidden="true">
              <p className="s3-try__what">{pick(TRY.steel, loc)}</p>
              <p className="s3-try__big s3-num">{inr(vKg)} <small>{pick(TRY.kg, loc)}</small> <em>({(vKg / 1000).toFixed(1)} {pick(MORE.fmtTonnes, loc)})</em></p>
              <div className="s3-try__stack">{Array.from({ length: bundles }, (_, i) => <Bundle key={i} />)}</div>
              <p className="s3-try__legend">{pick(MORE.legendSteel, loc)}</p>
            </div>

            <div className="s3-try__total" aria-hidden="true">
              <span>{pick(TRY.total, loc)}</span>
              <strong className="s3-num">₹{inr(vCost)}</strong>
            </div>

            <p className="s3-try__fine">{pick(outside ? TRY.noteOutside : TRY.note, loc)}</p>
            <p className="s3-note s3-try__frame">{pick(MORE.onlyFrame, loc)}</p>
            <div className="s3-try__next">
              <p>{pick(TRY.next, loc)}</p>
              <Link href="/tools/structopro" className="s3-btn s3-btn--indigo">{pick(TRY.nextCta, loc)}<Arrow width={22} height={22} /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useId, useRef, useState } from 'react'
import CutLink from './CutLink'
import Calc from './Calc'
import { Arrow } from './Icons'
import { EST, pick, type Loc } from '@/lib/v2/copy'
import { TOOLS } from '@/lib/v2/content'
import { useReveal, useTween } from '@/lib/v2/store'

// The hero widget. The frame is worked out by the real quantity model on the server (/api/structopro/glance), so the
// grid, the column count and the plan drawing are the same ones the paid report starts from. Nothing here is a material
// quantity or a price: those are in the full report.
const STRUCT = TOOLS.find(t => t.key === 'struct')!
const MIN = 300
const MAX = 3000
const SQFT_TO_M2 = 0.09290304

const inr = (n: number) => Math.round(n).toLocaleString('en-IN')

interface Glance {
  floors: number
  builtUpSqft: number
  foundation: 'isolated' | 'raft'
  glance: {
    lengthM: number
    widthM: number
    baysX: number
    baysY: number
    spanXM: number
    spanYM: number
    columnsPerStorey: number
    footings: number
    beamsPerFloor: number
    slabPanelsPerFloor: number
  }
  plan: {
    lengthM: number
    widthM: number
    columns: { x: number; y: number }[]
    beams: { x0: number; y0: number; x1: number; y1: number }[]
  }
}

/** A little house with one storey per floor, so the floors control visibly does something. */
function Storeys({ n }: { n: number }) {
  const h = 20
  return (
    <svg viewBox="0 0 96 130" className="ns-est__storeys" aria-hidden="true">
      <rect x="4" y="118" width="88" height="7" rx="3.500" fill="#7DB36B" stroke="#2A1E16" strokeWidth="1.800" />
      {Array.from({ length: n }, (_, i) => {
        const y = 118 - (i + 1) * h
        return (
          <g key={i} className="ns-est__storey" style={{ animationDelay: `${i * 90}ms` }}>
            <rect x="18" y={y} width="60" height={h} fill="#D98A5F" stroke="#2A1E16" strokeWidth="1.800" />
            <rect x="26" y={y + 5} width="11" height="11" rx="2" fill="#CFE5F2" stroke="#2A1E16" strokeWidth="1.400" />
            <rect x="59" y={y + 5} width="11" height="11" rx="2" fill="#CFE5F2" stroke="#2A1E16" strokeWidth="1.400" />
            <rect x="14" y={y - 3} width="68" height="5" rx="2" fill="#D3CCBF" stroke="#2A1E16" strokeWidth="1.400" />
          </g>
        )
      })}
    </svg>
  )
}

/** The ground-floor plan: columns as squares, beams as lines. Drawn in metres.
 *  The two dimension lines stand off the building by a clear gap (about two text heights), so the numbers sit between the wall
 *  and their own line and never touch the drawing. */
function PlanSketch({ plan, label }: { plan: Glance['plan']; label: string }) {
  const L = plan.lengthM
  const W = plan.widthM
  const fs = Math.max(0.8, Math.min(L, W) * 0.08)   // dimension text height
  const cs = Math.max(0.32, Math.min(L, W) * 0.034) // column square
  const gap = fs * 2.2                                // wall to dimension line
  const tick = fs * 0.4
  const m = cs * 0.9                                  // room for the corner columns and the wall stroke
  const dx = L + gap
  const dy = W + gap
  const vw = L + m + gap + tick + fs * 0.6
  const vh = W + m + gap + tick + fs * 0.6
  return (
    <svg className="ns-est__plan" viewBox={`${-m} ${-m} ${vw} ${vh}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={L} height={W} className="ns-est__plan-wall" />
      {plan.beams.map((b, i) => (
        <line key={i} x1={b.x0} y1={b.y0} x2={b.x1} y2={b.y1} className="ns-est__plan-beam" vectorEffect="non-scaling-stroke" />
      ))}
      {plan.columns.map((c, i) => (
        <rect key={i} x={c.x - cs / 2} y={c.y - cs / 2} width={cs} height={cs} className="ns-est__plan-col" />
      ))}
      <g className="ns-est__plan-dim" fontSize={fs}>
        {/* across: line below the building, ticks at both ends, number above the line */}
        <line x1={0} y1={dy} x2={L} y2={dy} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={dy - tick} x2={0} y2={dy + tick} vectorEffect="non-scaling-stroke" />
        <line x1={L} y1={dy - tick} x2={L} y2={dy + tick} vectorEffect="non-scaling-stroke" />
        <text x={L / 2} y={dy - fs * 0.4} textAnchor="middle">{L.toFixed(1)} m</text>
        {/* down: line right of the building, number to the left of the line, turned to read upward */}
        <line x1={dx} y1={0} x2={dx} y2={W} vectorEffect="non-scaling-stroke" />
        <line x1={dx - tick} y1={0} x2={dx + tick} y2={0} vectorEffect="non-scaling-stroke" />
        <line x1={dx - tick} y1={W} x2={dx + tick} y2={W} vectorEffect="non-scaling-stroke" />
        <text x={dx - fs * 0.4} y={W / 2} textAnchor="middle" transform={`rotate(-90 ${dx - fs * 0.4} ${W / 2})`}>{W.toFixed(1)} m</text>
      </g>
    </svg>
  )
}

export default function HeroEstimator({ loc }: { loc: Loc }) {
  const id = useId()
  const { ref } = useReveal<HTMLDivElement>()
  const [area, setArea] = useState(750)
  const [floors, setFloors] = useState(2)
  const [data, setData] = useState<Glance | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const seq = useRef(0)

  const built = area * floors
  const vBuilt = useTween(built)
  const pct = ((area - MIN) / (MAX - MIN)) * 100
  const setAreaSafe = (v: number) => setArea(Math.min(MAX, Math.max(MIN, Math.round(v) || MIN)))

  // ask the server for the frame; wait a moment after the last change so a drag is one request, not fifty
  useEffect(() => {
    const a = Math.min(MAX, Math.max(MIN, Math.round(area) || MIN))
    const mine = ++seq.current
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/structopro/glance?area=${a}&floors=${floors}`, { signal: ctl.signal })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as Glance
        if (mine === seq.current) { setData(json); setState('ready') }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        if (mine === seq.current) setState('failed')
      }
    }, 280)
    return () => { clearTimeout(t); ctl.abort() }
  }, [area, floors])

  const g = data?.glance
  const T = EST.tiles

  return (
    <div className="ns-est ns-plate" id="estimate" ref={ref} aria-labelledby={`${id}-h`}>
      <div className="ns-est__head">
        <h2 className="ns-h3" id={`${id}-h`}>{pick(EST.title, loc)}</h2>
        <p className="ns-est__lede">{pick(EST.lede, loc)}</p>
      </div>

      <div className="ns-est__grid">
        <div className="ns-est__ctl">
          <div className="ns-field">
            <label htmlFor={`${id}-area`} className="ns-label">{pick(EST.area, loc)}</label>
            <div className="ns-est__areaRow">
              <input
                id={`${id}-area`}
                className="ns-input ns-est__num"
                type="number"
                inputMode="numeric"
                min={MIN}
                max={MAX}
                step={50}
                value={area}
                onChange={e => setArea(Number(e.target.value) || 0)}
                onBlur={e => setAreaSafe(Number(e.target.value))}
              />
              <span className="ns-est__unit">{pick(EST.sqft, loc)}</span>
            </div>
            <input
              className="ns-range"
              type="range"
              min={MIN}
              max={MAX}
              step={50}
              value={Math.min(MAX, Math.max(MIN, area))}
              onChange={e => setArea(Number(e.target.value))}
              aria-label={pick(EST.area, loc)}
              style={{ ['--p' as string]: `${pct}%` }}
            />
            <div className="ns-est__ends" aria-hidden="true"><span>{MIN}</span><span>{inr(MAX)}</span></div>
          </div>

          <div className="ns-field">
            <span className="ns-label" id={`${id}-fl`}>{pick(EST.floors, loc)}</span>
            <div className="ns-est__floorRow">
              <div className="ns-pills" role="radiogroup" aria-labelledby={`${id}-fl`}>
                {EST.floorOpts.map(o => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={floors === o.v}
                    className={`ns-pill${floors === o.v ? ' is-on' : ''}`}
                    onClick={() => setFloors(o.v)}
                  >
                    {pick(o, loc)}
                  </button>
                ))}
              </div>
              <Storeys n={floors} />
            </div>
          </div>

          <p className="ns-est__built">
            <span>{pick(EST.builtUp, loc)}</span>
            <b className="ns-mono">{inr(vBuilt)} {pick(EST.sqft, loc)}</b>
          </p>
        </div>

        <div className="ns-est__out" aria-busy={state === 'loading'}>
          <p className="ns-est__what">{pick(EST.planTitle, loc)}</p>

          <div className={`ns-est__planbox${state === 'loading' && data ? ' is-loading' : ''}`}>
            {data ? (
              <PlanSketch plan={data.plan} label={`${pick(EST.planTitle, loc)}: ${g?.columnsPerStorey ?? ''} ${pick(EST.tiles.cols, loc)}`} />
            ) : (
              <p className="ns-est__plan-msg">{pick(state === 'failed' ? EST.failed : EST.loading, loc)}</p>
            )}
          </div>
          {data && <p className="ns-est__legend"><i className="ns-est__key-col" aria-hidden="true" /> {pick(EST.planKey, loc)}</p>}
          {data && state === 'failed' && <p className="ns-est__legend" role="status">{pick(EST.failed, loc)}</p>}

          {g && (
            <dl className="ns-est__tiles" aria-label={pick(EST.title, loc)}>
              <div><dt>{pick(T.size, loc)}</dt><dd className="ns-mono">{g.lengthM.toFixed(1)} × {g.widthM.toFixed(1)} m</dd></div>
              <div><dt>{pick(T.grid, loc)}</dt><dd className="ns-mono">{g.baysX} × {g.baysY} {pick(EST.bays, loc)}</dd></div>
              <div><dt>{pick(T.cols, loc)}</dt><dd className="ns-mono">{g.columnsPerStorey}</dd></div>
              <div><dt>{data?.foundation === 'raft' ? pick(T.raft, loc) : pick(T.foot, loc)}</dt><dd className="ns-mono">{data?.foundation === 'raft' ? pick(EST.oneRaft, loc) : g.footings}</dd></div>
              <div><dt>{pick(T.beams, loc)}</dt><dd className="ns-mono">{g.beamsPerFloor}</dd></div>
              <div><dt>{pick(T.slabs, loc)}</dt><dd className="ns-mono">{g.slabPanelsPerFloor}</dd></div>
            </dl>
          )}
        </div>
      </div>

      <p className="ns-est__fine">{pick(EST.fine, loc)}</p>

      <div className="ns-est__cta">
        <div className="ns-est__ctaTxt">
          <p className="ns-est__ctaH">{pick(EST.ctaH, loc)}</p>
          <p className="ns-est__ctaP">{pick(EST.ctaP, loc)}</p>
        </div>
        <div className="ns-est__ctaAct">
          <CutLink href={STRUCT.href} className="ns-btn ns-btn--verd" data-snap>{pick(EST.next, loc)}<Arrow /></CutLink>
          <span className="ns-est__price">{STRUCT.name} · {STRUCT.price}</span>
        </div>
      </div>

      <div className="ns-est__foot">
        <Calc
          loc={loc}
          className="ns-est__calc"
          rows={[
            { label: pick(EST.calcRows.built, loc), how: `${inr(area)} ${pick(EST.sqft, loc)} × ${floors}`, value: `${inr(built)} ${pick(EST.sqft, loc)}` },
            { label: pick(EST.calcRows.one, loc), how: `${inr(area)} ${pick(EST.sqft, loc)} × 0.0929`, value: `${(area * SQFT_TO_M2).toFixed(1)} m²` },
            ...(g ? [
              { label: pick(EST.calcRows.plan, loc), how: '1.3 : 1', value: `${g.lengthM.toFixed(1)} × ${g.widthM.toFixed(1)} m` },
              { label: pick(EST.calcRows.grid, loc), how: `${g.lengthM.toFixed(1)} ÷ 3.75, ${g.widthM.toFixed(1)} ÷ 3.75`, value: `${g.baysX + 1} × ${g.baysY + 1}` },
              { label: pick(EST.calcRows.cols, loc), how: `${g.baysX + 1} × ${g.baysY + 1}`, value: String(g.columnsPerStorey), strong: true },
            ] : []),
          ]}
          note={pick(EST.calcNote, loc)}
          standards={['IS 456:2000', 'IS 875:2015', 'IS 1893:2016']}
        />
      </div>
    </div>
  )
}

'use client'

import type { SceneModel } from '@/lib/structopro-qty/scene'
import { useCopy } from '@/lib/i18n/use-copy'
import { COPY } from './copy'

/**
 * The plan of the frame as a drawing. Shown when the 3D view cannot start (no WebGL, a graphics-driver crash, an old phone),
 * so the person still sees their grid of footings, columns and beams, and the stair well.
 */
export default function PlanFallback({ model, onRetry }: { model: SceneModel; onRetry?: () => void }) {
  const t = useCopy(COPY)
  const pad = 1.2
  const w = model.lengthM + pad * 2
  const h = model.widthM + pad * 2
  const x = (v: number) => v + pad
  const y = (v: number) => v + pad
  const cols = model.columns.filter(c => c.storey === 0)
  const beams = model.beams.filter(b => b.floor === 0)
  const st = model.stair
  const label = t.planAria(model.lengthM.toFixed(1), model.widthM.toFixed(1), cols.length, model.storeys)
  return (
    <figure className="ns-r-plan">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        {model.footings.map((f, i) => (
          <rect key={`f${i}`} className="ns-r-plan__ft" x={x(f.cx - f.sx / 2)} y={y(f.cy - f.sy / 2)} width={f.sx} height={f.sy} />
        ))}
        {model.raft && <rect className="ns-r-plan__ft" x={x(model.raft.cx - model.raft.sx / 2)} y={y(model.raft.cy - model.raft.sy / 2)} width={model.raft.sx} height={model.raft.sy} />}
        {beams.map((b, i) => (
          <rect key={`b${i}`} className="ns-r-plan__bm" x={x(b.cx - b.sx / 2)} y={y(b.cy - b.sy / 2)} width={b.sx} height={b.sy} />
        ))}
        <rect className="ns-r-plan__well" x={x(st.x0)} y={y(st.y0)} width={st.lengthM} height={st.widthM} />
        <text className="ns-r-plan__t" x={x(st.x0 + st.lengthM / 2)} y={y(st.y0 + st.widthM / 2) + 0.12} textAnchor="middle">{t.stair}</text>
        {cols.map((c, i) => (
          <rect key={`c${i}`} className="ns-r-plan__col" x={x(c.cx - c.sx / 2)} y={y(c.cy - c.sy / 2)} width={c.sx} height={c.sy} />
        ))}
        <text className="ns-r-plan__t" x={w / 2} y={h - 0.3} textAnchor="middle">{model.lengthM.toFixed(1)} m</text>
        <text className="ns-r-plan__t" x={0.5} y={h / 2} textAnchor="middle" transform={`rotate(-90 0.5 ${h / 2})`}>{model.widthM.toFixed(1)} m</text>
      </svg>
      <figcaption className="ns-i-fine">
        {onRetry ? t.planNoLoad : t.planNoStart}{t.planWhat}
        {onRetry ? <> <button type="button" className="ns-i-link" onClick={onRetry}>{t.planRetry}</button></> : null}
      </figcaption>
    </figure>
  )
}

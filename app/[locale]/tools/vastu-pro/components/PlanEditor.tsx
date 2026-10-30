'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import {
  SHEET_UNITS,
  type DoorMark,
  type PlacedItem,
  type PlanImage,
} from '../vastu-model'
import {
  brahmasthan,
  compassBearing,
  minAreaRect,
  placeRoom,
  polygonArea,
  polygonCentroid,
  rectPoly,
  type Pt,
  type Poly,
} from '../vastu-geometry'
import { PADA_RING } from '../vastu-rules'
import { ringSides } from '../vastu-reading'
import { kindAbbrevOf, kindLabelOf, padaNameOf } from '../vastu-hi'
import { COPY } from '../copy'

export type EditorMode = 'outline' | 'rooms' | 'door' | 'view'

export interface CatalogueEntry {
  key: string
  label: string
  abbrev: string
  /** default size on the sheet, in sheet units */
  w: number
  h: number
}

interface Props {
  mode: EditorMode
  house: Poly
  onHouse: (p: Poly) => void
  northDeg: number
  items: PlacedItem[]
  onItems: (next: PlacedItem[]) => void
  doors: DoorMark[]
  onDoors: (next: DoorMark[]) => void
  catalogue: Record<string, CatalogueEntry>
  /** which door kind a tap on the outline places or moves */
  activeDoorKind: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  image: PlanImage | null
  /** colour for an item or door once it has been read; the editor draws it neutral when this is not given */
  colourOf?: (id: string) => string | undefined
  zoneNames: string[]
  /** the name shown on each room's chip, e.g. "NE" */
  chipOf?: (id: string) => string | undefined
  /** outline mode: which corner of the house is selected, if any */
  selectedVertex?: number | null
  onSelectVertex?: (i: number | null) => void
}

const MIN_SIDE = 18
const EDGE = 8
const ZONE_RAY_COLOUR = 'rgba(42,38,34,0.24)'
const INK = '#2A2622'
const INK2 = '#5B544B'
const GREEN = '#2F7A4F'
const NORTH = '#B5502D'
const PAPER = '#FAF6EC'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Nearest point on the closed outline to p, and the distance to it. */
export function snapToOutline(p: Pt, poly: Poly): { pt: Pt; dist: number } {
  let best = { pt: poly[0], dist: Infinity }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len2 = dx * dx + dy * dy || 1
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1)
    const q = { x: a.x + t * dx, y: a.y + t * dy }
    const d = Math.hypot(p.x - q.x, p.y - q.y)
    if (d < best.dist) best = { pt: q, dist: d }
  }
  return best
}

type Drag =
  | { kind: 'vertex'; index: number }
  | { kind: 'move'; id: string; dx: number; dy: number }
  | { kind: 'resize'; id: string }
  | { kind: 'image'; dx: number; dy: number }

/*
  The plan sheet. One SVG, 600 x 600 sheet units, so a tap or a drag means the same thing at any screen size.
  - outline mode: drag the corners of the house, tap a "+" on an edge to add a corner
  - rooms mode: drag a room to move it, drag its corner dot to resize it
  - door mode: tap the outline to put the door there
  The 16 zones, the Brahmasthan and the North arrow are always drawn from the centre of the house outline.
*/
export default function PlanEditor(props: Props) {
  const {
    mode, house, onHouse, northDeg, items, onItems, doors, onDoors, catalogue, activeDoorKind,
    selectedId, onSelect, image, colourOf, zoneNames, chipOf, selectedVertex = null, onSelectVertex,
  } = props
  const t = useCopy(COPY).sheet
  const hi = useLocale() === 'hi'
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const moved = useRef(false)

  // Zones and the Brahmasthan are measured on the completed rectangle: the smallest rectangle that holds the outline.
  const ref = useMemo(() => minAreaRect(house), [house])
  const centre = useMemo(() => polygonCentroid(ref), [ref])
  const core = useMemo(() => brahmasthan(ref), [ref])
  const completed = useMemo(() => polygonArea(house) < polygonArea(ref) * 0.97, [house, ref])

  // The nine-part bars along the boundary, drawn in door mode: eight positions on each side, coloured by what the old text says of them.
  const bars = useMemo(() => {
    if (mode !== 'door') return []
    const sides = ringSides(ref, northDeg)
    if (!sides) return []
    const out: { key: string; x1: number; y1: number; x2: number; y2: number; tone: 'favourable' | 'mixed' | 'cautioned'; name: string; lx: number; ly: number }[] = []
    for (let i = 0; i < 4; i++) {
      const a = ref[i]
      const b = ref[(i + 1) % 4]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      let nx = -dy / len
      let ny = dx / len
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      if ((mx - centre.x) * nx + (my - centre.y) * ny < 0) { nx = -nx; ny = -ny }
      for (let k = 0; k < 8; k++) {
        const t0 = k / 9
        const t1 = (k + 1) / 9
        const pad = PADA_RING[sides[i]!][k]
        out.push({
          key: `${i}-${k}`,
          x1: a.x + dx * t0 + nx * 9, y1: a.y + dy * t0 + ny * 9,
          x2: a.x + dx * t1 + nx * 9, y2: a.y + dy * t1 + ny * 9,
          tone: pad.tone,
          name: padaNameOf(hi, pad.name),
          lx: a.x + dx * (t0 + t1) / 2 + nx * 24, ly: a.y + dy * (t0 + t1) / 2 + ny * 24,
        })
      }
    }
    return out
  }, [mode, ref, northDeg, centre, hi])

  const toSheet = useCallback((clientX: number, clientY: number): Pt => {
    const svg = svgRef.current!
    const m = svg.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }, [])

  // ---- zone rays and labels ----
  const rays = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const a = ((northDeg + i * 22.5 - 11.25) * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const tx = Math.abs(dx) < 1e-9 ? Infinity : (dx > 0 ? SHEET_UNITS - centre.x : centre.x) / Math.abs(dx)
    const ty = Math.abs(dy) < 1e-9 ? Infinity : (dy > 0 ? SHEET_UNITS - centre.y : centre.y) / Math.abs(dy)
    const t = Math.min(tx, ty)
    return { i, x2: centre.x + dx * t, y2: centre.y + dy * t }
  }), [centre, northDeg])

  const labels = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const a = ((northDeg + i * 22.5) * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const tx = Math.abs(dx) < 1e-9 ? Infinity : (dx > 0 ? SHEET_UNITS - centre.x : centre.x) / Math.abs(dx)
    const ty = Math.abs(dy) < 1e-9 ? Infinity : (dy > 0 ? SHEET_UNITS - centre.y : centre.y) / Math.abs(dy)
    const t = Math.min(tx, ty) - 15
    const px = hi ? 30 : 14
    return { i, x: clamp(centre.x + dx * t, px, SHEET_UNITS - px), y: clamp(centre.y + dy * t, 12, SHEET_UNITS - 12) }
  }), [centre, northDeg, hi])

  // ---- pointer handling ----
  function startDrag(e: React.PointerEvent, d: Drag) {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag.current = d
    moved.current = false
  }

  function onMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    moved.current = true
    const p = toSheet(e.clientX, e.clientY)
    if (d.kind === 'vertex') {
      const next = house.map((q, i) => (i === d.index ? { x: clamp(p.x, EDGE, SHEET_UNITS - EDGE), y: clamp(p.y, EDGE, SHEET_UNITS - EDGE) } : q))
      onHouse(next)
    } else if (d.kind === 'move') {
      onItems(items.map(it => {
        if (it.id !== d.id) return it
        return { ...it, x: clamp(p.x - d.dx, 0, SHEET_UNITS - it.w), y: clamp(p.y - d.dy, 0, SHEET_UNITS - it.h) }
      }))
    } else if (d.kind === 'resize') {
      onItems(items.map(it => {
        if (it.id !== d.id) return it
        return {
          ...it,
          w: clamp(p.x - it.x, MIN_SIDE, SHEET_UNITS - it.x),
          h: clamp(p.y - it.y, MIN_SIDE, SHEET_UNITS - it.y),
        }
      }))
    }
  }

  function endDrag(e: React.PointerEvent) {
    drag.current = null
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch { /* already released */ }
  }

  // a tap on empty sheet: clear the selection, or in door mode put the door on the nearest bit of outline
  function onSheetPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (moved.current) { moved.current = false; return }
    const p = toSheet(e.clientX, e.clientY)
    if (mode === 'door') {
      const { pt } = snapToOutline(p, house)
      const existing = doors.find(d => d.kind === activeDoorKind)
      if (existing) onDoors(doors.map(d => (d.id === existing.id ? { ...d, pt } : d)))
      else onDoors([...doors, { id: activeDoorKind, kind: activeDoorKind, pt }])
      onSelect(activeDoorKind)
    } else {
      onSelect(null)
      onSelectVertex?.(null)
    }
  }

  // ---- keyboard: arrows move the selected room, shift+arrows resize it ----
  function onItemKey(e: React.KeyboardEvent, it: PlacedItem) {
    const step = e.altKey ? 1 : 6
    let dx = 0, dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else return
    e.preventDefault()
    onItems(items.map(o => {
      if (o.id !== it.id) return o
      if (e.shiftKey) return { ...o, w: clamp(o.w + dx, MIN_SIDE, SHEET_UNITS - o.x), h: clamp(o.h + dy, MIN_SIDE, SHEET_UNITS - o.y) }
      return { ...o, x: clamp(o.x + dx, 0, SHEET_UNITS - o.w), y: clamp(o.y + dy, 0, SHEET_UNITS - o.h) }
    }))
  }

  const outlinePath = house.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  const corePath = core.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
  const northRad = (northDeg * Math.PI) / 180
  const arrowLen = 70
  const nx = centre.x + arrowLen * Math.sin(northRad)
  const ny = centre.y - arrowLen * Math.cos(northRad)

  return (
    <svg
      ref={svgRef}
      className="ns-v-svg"
      viewBox={`0 0 ${SHEET_UNITS} ${SHEET_UNITS}`}
      data-mode={mode}
      role="application"
      aria-label={
        mode === 'outline'
          ? t.ariaOutline
          : mode === 'door'
            ? t.ariaDoor
            : mode === 'view'
              ? t.ariaView
              : t.ariaRooms
      }
      onPointerMove={onMove}
      onPointerUp={onSheetPointerUp}
    >
      <rect x={0} y={0} width={SHEET_UNITS} height={SHEET_UNITS} fill={PAPER} />

      {/* the picture of the plan, if the visitor added one */}
      {image && (
        <g opacity={0.42} pointerEvents="none">
          <image
            href={image.src}
            x={image.x}
            y={image.y}
            width={image.w * image.scale}
            height={image.h * image.scale}
            transform={`rotate(${image.rot} ${image.x + (image.w * image.scale) / 2} ${image.y + (image.h * image.scale) / 2})`}
            preserveAspectRatio="none"
          />
        </g>
      )}

      {/* house outline and the Brahmasthan */}
      {completed && (
        <path d={ref.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'} fill="none" stroke={INK2} strokeWidth={1.4} strokeDasharray="7 5" pointerEvents="none" />
      )}
      <path d={outlinePath} fill="rgba(42,38,34,0.045)" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" pointerEvents="none" />
      <path d={corePath} fill="rgba(47,122,79,0.14)" stroke={GREEN} strokeWidth={1.6} strokeDasharray="5 4" pointerEvents="none" />

      {/* the 16 zones, from the centre of the house */}
      <g pointerEvents="none">
        {rays.map(r => (
          <line key={r.i} x1={centre.x} y1={centre.y} x2={r.x2} y2={r.y2} stroke={ZONE_RAY_COLOUR} strokeWidth={1} strokeDasharray="2 4" />
        ))}
        {labels.map(l => (
          <text
            key={l.i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="ns-v-zl"
            fill={l.i === 0 ? NORTH : INK2}
            fontSize={hi ? (l.i % 2 === 0 ? 15.5 : 12.5) : l.i % 2 === 0 ? 14 : 11.5}
            fontWeight={700}
            stroke={PAPER}
            strokeWidth={3.5}
            paintOrder="stroke"
          >
            {zoneNames[l.i]}
          </text>
        ))}
        <circle cx={centre.x} cy={centre.y} r={3.5} fill={GREEN} />
        <text x={centre.x} y={centre.y + 15} textAnchor="middle" fontSize={hi ? 12 : 11} fontWeight={700} fill={GREEN} stroke={PAPER} strokeWidth={3} paintOrder="stroke">{t.brahmasthan}</text>
        {/* North arrow */}
        <line x1={centre.x} y1={centre.y} x2={nx} y2={ny} stroke={NORTH} strokeWidth={2.4} />
        <circle cx={nx} cy={ny} r={4.5} fill={NORTH} />
        <text x={centre.x + (arrowLen + 14) * Math.sin(northRad)} y={centre.y - (arrowLen + 14) * Math.cos(northRad)} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={800} fill={NORTH} stroke={PAPER} strokeWidth={3.5} paintOrder="stroke">{t.north}</text>
      </g>

      {/* door mode: the eight positions on each side of the boundary, favourable ones in green */}
      {bars.length > 0 && (
        <g pointerEvents="none">
          {bars.map(b => (
            <g key={b.key}>
              <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={b.tone === 'favourable' ? GREEN : b.tone === 'mixed' ? '#C99A2B' : 'rgba(42,38,34,0.30)'} strokeWidth={b.tone === 'favourable' ? 7 : 5} strokeLinecap="butt" />
              {b.tone === 'favourable' && (
                <text x={b.lx} y={b.ly} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800} fill={GREEN} stroke={PAPER} strokeWidth={3} paintOrder="stroke">{b.name}</text>
              )}
            </g>
          ))}
        </g>
      )}

      {/* rooms */}
      {items.map(it => {
        const c = catalogue[it.kind]
        const sel = it.id === selectedId
        const col = colourOf?.(it.id) ?? GREEN
        const chip = chipOf?.(it.id)
        const label = kindLabelOf(hi, it.kind, c?.label ?? it.kind)
        const abbrev = kindAbbrevOf(hi, it.kind, c?.abbrev ?? it.kind.slice(0, 2).toUpperCase())
        const movable = mode === 'rooms'
        return (
          <g
            key={it.id}
            className="ns-v-item"
            data-selected={sel ? '1' : '0'}
            data-movable={movable ? '1' : '0'}
            tabIndex={movable ? 0 : -1}
            role="button"
            aria-label={t.item(label, chip)}
            onKeyDown={movable ? e => onItemKey(e, it) : undefined}
            onFocus={() => { if (movable) onSelect(it.id) }}
          >
            <rect
              x={it.x}
              y={it.y}
              width={it.w}
              height={it.h}
              rx={3}
              fill={col}
              fillOpacity={0.2}
              stroke={col}
              strokeWidth={sel ? 3 : 2}
              strokeDasharray={sel ? '6 3' : undefined}
              onPointerDown={movable ? e => {
                onSelect(it.id)
                const p = toSheet(e.clientX, e.clientY)
                startDrag(e, { kind: 'move', id: it.id, dx: p.x - it.x, dy: p.y - it.y })
              } : undefined}
              style={{ touchAction: movable ? 'none' : undefined, cursor: movable ? 'move' : 'default' }}
              pointerEvents={movable ? 'all' : 'none'}
              onPointerMoveCapture={undefined}
              onPointerUpCapture={e => { if (drag.current) endDrag(e) }}
            />
            <text x={it.x + it.w / 2} y={it.y + it.h / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(15, Math.max(10, it.h / 3))} fontWeight={800} fill={INK} stroke={PAPER} strokeWidth={3} paintOrder="stroke" pointerEvents="none">
              {abbrev}
            </text>
            {chip && (
              <g pointerEvents="none">
                <rect x={it.x + 2} y={it.y + 2} width={chip.length * (hi ? 9.2 : 7.6) + 8} height={15} rx={3} fill={col} />
                <text x={it.x + 6} y={it.y + 9.5} dominantBaseline="central" fontSize={10.5} fontWeight={800} fill="#fff">{chip}</text>
              </g>
            )}
            {movable && sel && (
              <circle
                cx={it.x + it.w}
                cy={it.y + it.h}
                r={11}
                fill={PAPER}
                stroke={col}
                strokeWidth={3}
                style={{ touchAction: 'none', cursor: 'nwse-resize' }}
                onPointerDown={e => startDrag(e, { kind: 'resize', id: it.id })}
                onPointerUpCapture={e => { if (drag.current) endDrag(e) }}
              />
            )}
          </g>
        )
      })}

      {/* doors sit on the outline */}
      {doors.map(d => {
        const sel = d.id === selectedId
        const col = colourOf?.(d.id) ?? INK
        const c = catalogue[d.kind]
        return (
          <g key={d.id} pointerEvents="none">
            <circle cx={d.pt.x} cy={d.pt.y} r={sel ? 13 : 11} fill={col} stroke="#fff" strokeWidth={2} />
            <text x={d.pt.x} y={d.pt.y} textAnchor="middle" dominantBaseline="central" fontSize={10.5} fontWeight={800} fill="#fff">{kindAbbrevOf(hi, d.kind, c?.abbrev ?? 'D')}</text>
            {chipOf?.(d.id) && (
              <text x={d.pt.x} y={d.pt.y - 19} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill={INK} stroke={PAPER} strokeWidth={3} paintOrder="stroke">{chipOf(d.id)}</text>
            )}
          </g>
        )
      })}

      {/* outline mode: corner handles and "+" handles on the edges */}
      {mode === 'outline' && (
        <g>
          {house.map((p, i) => {
            const q = house[(i + 1) % house.length]
            const mx = (p.x + q.x) / 2
            const my = (p.y + q.y) / 2
            const len = Math.hypot(q.x - p.x, q.y - p.y)
            if (len < 60) return null
            return (
              <g
                key={`add${i}`}
                className="ns-v-add"
                role="button"
                aria-label={t.addCorner(i + 1)}
                onPointerUp={e => {
                  e.stopPropagation()
                  const next = [...house]
                  next.splice(i + 1, 0, { x: mx, y: my })
                  onHouse(next)
                }}
                style={{ cursor: 'copy' }}
              >
                <circle cx={mx} cy={my} r={13} fill={PAPER} stroke={GREEN} strokeWidth={2} />
                <path d={`M${mx - 5} ${my}H${mx + 5}M${mx} ${my - 5}V${my + 5}`} stroke={GREEN} strokeWidth={2.2} strokeLinecap="round" />
              </g>
            )
          })}
          {house.map((p, i) => (
            <circle
              key={`v${i}`}
              className="ns-v-vertex"
              cx={p.x}
              cy={p.y}
              r={selectedVertex === i ? 13 : 11}
              fill={selectedVertex === i ? INK : GREEN}
              stroke="#fff"
              strokeWidth={2.5}
              tabIndex={0}
              role="slider"
              aria-label={t.corner(i + 1)}
              onKeyDown={e => {
                const step = e.altKey ? 1 : 6
                const d = e.key === 'ArrowLeft' ? [-step, 0] : e.key === 'ArrowRight' ? [step, 0] : e.key === 'ArrowUp' ? [0, -step] : e.key === 'ArrowDown' ? [0, step] : null
                if (!d) return
                e.preventDefault()
                onHouse(house.map((q, j) => (j === i ? { x: clamp(q.x + d[0], EDGE, SHEET_UNITS - EDGE), y: clamp(q.y + d[1], EDGE, SHEET_UNITS - EDGE) } : q)))
              }}
              style={{ touchAction: 'none', cursor: 'grab' }}
              onPointerDown={e => { onSelectVertex?.(i); startDrag(e, { kind: 'vertex', index: i }) }}
              onPointerUpCapture={e => { if (drag.current) endDrag(e) }}
            />
          ))}
        </g>
      )}
    </svg>
  )
}

/** Helper used by the page: the placement of one item against the current outline. */
export function placementOf(it: PlacedItem, house: Poly, northDeg: number) {
  return placeRoom(rectPoly(it.x, it.y, it.w, it.h), minAreaRect(house), northDeg)
}

/** Bearing of a point on the outline, for a door. */
export function bearingOfDoor(d: DoorMark, house: Poly, northDeg: number) {
  return compassBearing(polygonCentroid(minAreaRect(house)), d.pt, northDeg)
}

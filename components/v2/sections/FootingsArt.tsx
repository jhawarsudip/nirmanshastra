// The ground under the page, drawn as a cut section: seven different foundations, each with its own column and its own reinforcement.
// Purely decorative (aria-hidden). Left to right: isolated pad, stepped footing, sloped footing, combined footing, strap footing,
// pile cap on piles, and a raft with a thickened edge. Columns differ in shape (rectangular and round), in size, in how many bars they
// carry, in bar thickness (thin 12 mm to heavy 25 mm lines) and in how their ties are spaced (plain ties, a spiral, closer ties at the ends).
// Above each column floats a small plan of its cross-section, so the shapes of the steel show too: square ties, a diamond tie, a ring,
// an L-shaped corner column, a rectangle with a cross-tie.
// Everything is plain SVG shapes so it is cheap to draw and scales with the page.

import type { ReactNode } from 'react'

const INK = '#2A1E16'
const CONC = '#FFFCF3'
const BAR = '#B5472B'
const TIE = '#8E3A22'

/** Ground line. Everything above it stands in the air; everything below is the cut through the soil. */
const G = 112

const outline = { stroke: INK, strokeWidth: 1.5, strokeOpacity: 0.6 } as const

/** Evenly spread bar positions across a rectangular column. */
function rectBars(x: number, w: number, n: number): number[] {
  const a = x - w / 2 + 5
  const b = x + w / 2 - 5
  return Array.from({ length: n }, (_, i) => (n === 1 ? x : a + ((b - a) * i) / (n - 1)))
}

/** A round column ring seen from the side: bars bunch up towards the edges, like the real ring does. */
function ringBars(x: number, w: number, n: number): number[] {
  const r = w / 2 - 5
  return Array.from({ length: n }, (_, i) => x + r * Math.cos((Math.PI * i) / (n - 1)))
}

type ColumnSpec = {
  x: number
  w: number
  top: number
  /** where the column meets the footing */
  base: number
  round?: boolean
  bars: number
  barW: number
  /** y of the footing's lower bar layer: the column bars turn outward just above it */
  hookY: number
  /** y positions of the ties (closed stirrups) */
  ties?: number[]
  /** round columns can carry a spiral instead of separate ties */
  spiral?: number
  /** the small cross-section drawn above the column */
  plan: PlanSpec
}

type PlanSpec =
  | { kind: 'sq4'; d: number }
  | { kind: 'sq8'; d: number }
  | { kind: 'round'; n: number }
  | { kind: 'rect'; d: number; rows: number; sides: number }
  | { kind: 'L'; d: number }

/** centre of the cross-section drawings, in the same units as the rest (above the starter bars) */
const PLAN_CY = -30

function range(from: number, to: number, step: number): number[] {
  const out: number[] = []
  for (let y = from; y <= to + 0.01; y += step) out.push(y)
  return out
}


const bit = (cx: number, cy: number, r: number, key: string | number) => <circle key={key} cx={cx} cy={cy} r={r} fill={BAR} />

/** The cross-section of a column: the concrete outline, the ties as thin lines, the bars as dots. */
function PlanGlyph({ x, w, barW, plan }: { x: number; w: number; barW: number; plan: PlanSpec }) {
  const r = Math.max(1.5, barW * 0.5)
  const cy = PLAN_CY
  const tie = { stroke: TIE, strokeWidth: 1.3, fill: 'none', strokeLinejoin: 'round' as const }
  const body = { fill: CONC, ...outline }
  const x0 = x - w / 2
  const x1 = x + w / 2

  if (plan.kind === 'round') {
    const ring = w / 2 - 5.5
    return (
      <g>
        <circle cx={x} cy={cy} r={w / 2} {...body} />
        <circle cx={x} cy={cy} r={w / 2 - 3} {...tie} />
        {Array.from({ length: plan.n }, (_, i) => {
          const a = (2 * Math.PI * i) / plan.n - Math.PI / 2
          return bit(x + ring * Math.cos(a), cy + ring * Math.sin(a), r, i)
        })}
      </g>
    )
  }

  if (plan.kind === 'L') {
    const d = plan.d
    const y0 = cy - d / 2
    const a = Math.round(w * 0.5)
    const pts = (i: number) => [[x0 + i, y0 + i], [x1 - i, y0 + i], [x1 - i, y0 + a - i], [x0 + a - i, y0 + a - i], [x0 + a - i, y0 + d - i], [x0 + i, y0 + d - i]].map((q) => q.join(',')).join(' ')
    return (
      <g>
        <polygon points={pts(0)} {...body} strokeLinejoin="round" />
        <polygon points={pts(2.6)} {...tie} />
        {[[x0 + 5, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, y0 + a - 5], [x0 + a - 5, y0 + a - 5], [x0 + a - 5, y0 + d - 5], [x0 + 5, y0 + d - 5]].map(([bx, by], i) => bit(bx, by, r, i))}
      </g>
    )
  }

  const d = plan.d
  const y0 = cy - d / 2
  const y1 = cy + d / 2
  if (plan.kind === 'sq4') {
    return (
      <g>
        <rect x={x0} y={y0} width={w} height={d} rx="1.5" {...body} />
        <rect x={x0 + 3.2} y={y0 + 3.2} width={w - 6.4} height={d - 6.4} {...tie} />
        {[[x0 + 5.4, y0 + 5.4], [x1 - 5.4, y0 + 5.4], [x0 + 5.4, y1 - 5.4], [x1 - 5.4, y1 - 5.4]].map(([bx, by], i) => bit(bx, by, r, i))}
      </g>
    )
  }
  if (plan.kind === 'sq8') {
    return (
      <g>
        <rect x={x0} y={y0} width={w} height={d} rx="1.5" {...body} />
        <rect x={x0 + 2.6} y={y0 + 2.6} width={w - 5.2} height={d - 5.2} {...tie} />
        <polygon points={`${x},${y0 + 5} ${x1 - 5},${cy} ${x},${y1 - 5} ${x0 + 5},${cy}`} {...tie} />
        {[[x0 + 5, y0 + 5], [x, y0 + 5], [x1 - 5, y0 + 5], [x1 - 5, cy], [x1 - 5, y1 - 5], [x, y1 - 5], [x0 + 5, y1 - 5], [x0 + 5, cy]].map(([bx, by], i) => bit(bx, by, r, i))}
      </g>
    )
  }
  // rectangle: a row of bars on each long face, optional bars on the short faces, a cross-tie through the middle when there are three or more
  const rows = plan.rows
  const xs = Array.from({ length: rows }, (_, i) => (rows === 1 ? x : x0 + 5.2 + ((w - 10.4) * i) / (rows - 1)))
  return (
    <g>
      <rect x={x0} y={y0} width={w} height={d} rx="1.5" {...body} />
      <rect x={x0 + 2.8} y={y0 + 2.8} width={w - 5.6} height={d - 5.6} {...tie} />
      {rows >= 3 ? <line x1={x} x2={x} y1={y0 + 5} y2={y1 - 5} {...tie} /> : null}
      {xs.map((bx, i) => bit(bx, y0 + 5.2, r, `t${i}`))}
      {xs.map((bx, i) => bit(bx, y1 - 5.2, r, `b${i}`))}
      {plan.sides > 0 ? [bit(x0 + 5.2, cy, r, 'l'), bit(x1 - 5.2, cy, r, 'r')] : null}
    </g>
  )
}

function planDepth(p: PlanSpec, w: number): number {
  return p.kind === 'round' ? w : p.d
}

function Column({ c }: { c: ColumnSpec }) {
  const half = c.w / 2
  const xs = c.round ? ringBars(c.x, c.w, c.bars) : rectBars(c.x, c.w, c.bars)
  const starterTop = c.top - 26
  const planBottom = PLAN_CY + planDepth(c.plan, c.w) / 2
  return (
    <g>
      <line x1={c.x} x2={c.x} y1={planBottom + 3} y2={starterTop - 3} stroke={INK} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="2 3" />
      <PlanGlyph x={c.x} w={c.w} barW={c.barW} plan={c.plan} />
      <rect x={c.x - half} y={c.top} width={c.w} height={c.base - c.top} rx={c.round ? 3 : 2} fill={CONC} {...outline} />
      {c.round ? <ellipse cx={c.x} cy={c.top} rx={half} ry={4} fill={CONC} {...outline} /> : null}
      {c.ties?.map((y) => (
        <line key={y} x1={c.x - half + 2.5} x2={c.x + half - 2.5} y1={y} y2={y} stroke={TIE} strokeWidth={1.3} />
      ))}
      {c.spiral
        ? range(c.top + 8, c.base - 6, c.spiral).map((y) => (
            <line key={y} x1={c.x - half + 2.5} x2={c.x + half - 2.5} y1={y} y2={y - 6} stroke={TIE} strokeWidth={1.4} />
          ))
        : null}
      {xs.map((bx, i) => {
        const hook = bx < c.x - 0.5 || (Math.abs(bx - c.x) <= 0.5 && i % 2 === 0) ? -13 : 13
        return (
          <path
            key={i}
            d={`M${bx.toFixed(1)} ${starterTop} V${c.hookY} h${hook}`}
            stroke={BAR}
            strokeWidth={c.barW}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )
      })}
    </g>
  )
}

/** One layer of footing steel in section: the bars that run along the cut as a line, the ones that run across it as dots. */
function Mesh({ x0, x1, y, bw, pitch, dots = 'above', ends = true }: { x0: number; x1: number; y: number; bw: number; pitch: number; dots?: 'above' | 'below'; ends?: boolean }) {
  const dotY = dots === 'above' ? y - bw - 2.4 : y + bw + 2.4
  const count = Math.max(1, Math.floor((x1 - x0 - 8) / pitch))
  return (
    <g>
      <path
        d={ends ? `M${x0 + 4} ${y - 9} V${y} H${x1 - 4} V${y - 9}` : `M${x0 + 4} ${y} H${x1 - 4}`}
        stroke={BAR}
        strokeWidth={bw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {Array.from({ length: count + 1 }, (_, i) => (
        <circle key={i} cx={x0 + 4 + ((x1 - x0 - 8) * i) / count} cy={dotY} r={Math.max(1.4, bw * 0.5)} fill={BAR} />
      ))}
    </g>
  )
}

function Station({ k, children }: { k: number; children: ReactNode }) {
  return (
    <g className="ns-foot__col" style={{ ['--k' as string]: k }}>
      {children}
    </g>
  )
}

export default function FootingsArt() {
  return (
    <svg viewBox="0 0 1440 346" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      {/* the drawing is laid out with the ground line at 112; the top 56 units are room for the cross-sections above the columns */}
      <g transform="translate(0 56)">
      {/* soil: topsoil, laterite, rock */}
      <rect x="0" y={G} width="1440" height={290 - G} fill="#9C4A2E" />
      <rect x="0" y={G} width="1440" height="34" fill="#E7C48A" />
      <rect x="0" y={G + 34} width="1440" height="56" fill="#C56A43" />
      <g fill="#FBF4E4" opacity=".22">
        {Array.from({ length: 64 }, (_, i) => (
          <circle key={i} cx={(i * 197) % 1440} cy={G + 8 + ((i * 53) % 160)} r={2 + (i % 3)} />
        ))}
      </g>
      <line x1="0" x2="1440" y1={G} y2={G} stroke={INK} strokeWidth="2" strokeOpacity=".5" />

      {/* 1. isolated pad, plain 12 mm steel, a slim square column */}
      <Station k={0}>
        <rect x="20" y="158" width="100" height="32" rx="3" fill={CONC} {...outline} />
        <Mesh x0={20} x1={120} y={182} bw={2.4} pitch={10} />
        <Column c={{ x: 70, w: 26, top: 40, base: 158, bars: 4, barW: 2.4, hookY: 177, ties: range(52, 150, 15), plan: { kind: 'sq4', d: 26 } }} />
      </Station>

      {/* 2. stepped footing, a round column with a spiral and six bars */}
      <Station k={1}>
        <rect x="155" y="176" width="120" height="22" rx="3" fill={CONC} {...outline} />
        <rect x="183" y="150" width="64" height="26" rx="3" fill={CONC} {...outline} />
        <Mesh x0={155} x1={275} y={192} bw={3.2} pitch={12} />
        <Mesh x0={183} x1={247} y={170} bw={2.4} pitch={11} ends={false} />
        <Column c={{ x: 215, w: 32, top: 52, base: 150, round: true, bars: 6, barW: 3.2, hookY: 165, spiral: 9, plan: { kind: 'round', n: 6 } }} />
      </Station>

      {/* 3. sloped footing, a broad column with eight heavy bars and ties packed closer at both ends */}
      <Station k={2}>
        <path d="M330 196 V182 L373 152 H417 L460 182 V196 Z" fill={CONC} {...outline} strokeLinejoin="round" />
        <Mesh x0={330} x1={460} y={188} bw={4} pitch={13} />
        <Column
          c={{
            x: 395, w: 44, top: 30, base: 152, bars: 6, barW: 3.8, hookY: 183, plan: { kind: 'rect', d: 30, rows: 3, sides: 1 },
            ties: [...range(36, 64, 7), ...range(80, 110, 16), ...range(120, 146, 7)],
          }}
        />
      </Station>

      {/* 4. combined footing under two columns of different shape, with steel at the top and the bottom */}
      <Station k={3}>
        <rect x="495" y="164" width="230" height="32" rx="3" fill={CONC} {...outline} />
        {range(515, 705, 19).map((x) => (
          <line key={x} x1={x} x2={x} y1={172} y2={189} stroke={TIE} strokeWidth={1.2} />
        ))}
        <Mesh x0={495} x1={725} y={190} bw={4} pitch={14} />
        <Mesh x0={510} x1={710} y={171} bw={3.2} pitch={16} dots="below" ends={false} />
        <Column c={{ x: 555, w: 30, top: 44, base: 164, bars: 4, barW: 3.2, hookY: 184, ties: range(56, 156, 13), plan: { kind: 'sq8', d: 30 } }} />
        <Column c={{ x: 670, w: 34, top: 36, base: 164, round: true, bars: 6, barW: 3.2, hookY: 184, spiral: 10, plan: { kind: 'round', n: 8 } }} />
      </Station>

      {/* 5. strap footing: two pads of different size tied together by a beam, two different columns */}
      <Station k={4}>
        <rect x="777" y="162" width="76" height="32" rx="3" fill={CONC} {...outline} />
        <rect x="957" y="162" width="56" height="32" rx="3" fill={CONC} {...outline} />
        <rect x="853" y="170" width="104" height="22" fill={CONC} {...outline} />
        {range(860, 950, 9).map((x) => (
          <line key={x} x1={x} x2={x} y1={176} y2={188} stroke={TIE} strokeWidth={1.2} />
        ))}
        <path d="M855 176 H955" stroke={BAR} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M855 187 H955" stroke={BAR} strokeWidth="4" strokeLinecap="round" />
        <Mesh x0={777} x1={853} y={188} bw={3.2} pitch={11} />
        <Mesh x0={957} x1={1013} y={188} bw={3.2} pitch={11} />
        <Column c={{ x: 800, w: 28, top: 46, base: 162, bars: 4, barW: 3, hookY: 182, ties: range(58, 154, 12), plan: { kind: 'L', d: 28 } }} />
        <Column c={{ x: 985, w: 36, top: 34, base: 162, bars: 6, barW: 3.6, hookY: 182, ties: range(46, 154, 11), plan: { kind: 'rect', d: 24, rows: 3, sides: 0 } }} />
      </Station>

      {/* 6. pile cap on three piles, a big column with heavy 25 mm bars */}
      <Station k={5}>
        {[1105, 1135, 1165].map((x, i) => (
          <g key={x}>
            <rect x={x - 8} y="186" width="16" height={i === 1 ? 84 : 76} fill={CONC} {...outline} />
            <path d={`M${x - 4} 190 V${i === 1 ? 266 : 258} M${x + 4} 190 V${i === 1 ? 266 : 258}`} stroke={BAR} strokeWidth="2.2" strokeLinecap="round" />
            {range(196, i === 1 ? 262 : 254, 9).map((y) => (
              <line key={y} x1={x - 6} x2={x + 6} y1={y} y2={y} stroke={TIE} strokeWidth={1} />
            ))}
          </g>
        ))}
        <rect x="1085" y="156" width="100" height="30" rx="3" fill={CONC} {...outline} />
        <Mesh x0={1085} x1={1185} y={180} bw={4.6} pitch={12} />
        <Mesh x0={1092} x1={1178} y={162} bw={3} pitch={14} dots="below" ends={false} />
        <Column c={{ x: 1135, w: 46, top: 34, base: 156, bars: 6, barW: 5, hookY: 175, ties: range(46, 148, 11), plan: { kind: 'rect', d: 34, rows: 4, sides: 1 } }} />
      </Station>

      {/* 7. raft with a deeper edge, steel in two layers, a narrow column and a round one */}
      <Station k={6}>
        <path d="M1235 210 V168 H1393 V198 H1253 V210 Z" fill={CONC} {...outline} strokeLinejoin="round" />
        <Mesh x0={1235} x1={1393} y={192} bw={3.2} pitch={11} ends={false} />
        <Mesh x0={1235} x1={1393} y={175} bw={2.4} pitch={11} dots="below" ends={false} />
        <path d="M1239 174 V204 H1257" stroke={BAR} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Column c={{ x: 1280, w: 26, top: 44, base: 168, bars: 4, barW: 2.6, hookY: 186, ties: range(56, 160, 14), plan: { kind: 'rect', d: 16, rows: 2, sides: 0 } }} />
        <Column c={{ x: 1350, w: 38, top: 38, base: 168, round: true, bars: 6, barW: 3.6, hookY: 186, spiral: 12, plan: { kind: 'round', n: 6 } }} />
      </Station>
      </g>
    </svg>
  )
}

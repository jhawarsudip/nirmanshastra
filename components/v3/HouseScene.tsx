'use client'

import { useId } from 'react'

/**
 * The storybook house: a two-storey RCC house, cut away below ground, that builds itself in seven stages.
 * `stage` 0..7 is controlled by the parent (hero auto-plays it; the story section ties it to scroll).
 * Stage 7 also brings the paint, wiring, tank and the family.
 * Colours come from --sc-* custom properties so day and night both work (night = lit windows).
 */

const COLS = [200, 340, 480, 620] as const
const BAYS = [212, 352, 492] as const // wall bay left edges (116 wide)

type Props = { stage: number; label: string; className?: string }

function Person({ x, scale = 1, cloth, skin = '#E3AE84', kind = 'adult', hair = '#2A1E16', delay = 0 }: {
  x: number; scale?: number; cloth: string; skin?: string; kind?: 'adult' | 'child' | 'saree'; hair?: string; delay?: number
}) {
  const h = kind === 'child' ? 46 : 72
  const headR = kind === 'child' ? 7.5 : 7
  return (
    <g transform={`translate(${x} 440) scale(${scale})`}>
      <g className="hs-bob" style={{ animationDelay: `${delay}s` }}>
        {kind === 'saree' ? (
          <path d={`M-9 ${-h + 22} L9 ${-h + 22} L15 0 L-15 0 Z`} fill={cloth} stroke="#2A1E16" strokeWidth="2" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="-7" y={-h * 0.4} width="5.5" height={h * 0.4} rx="2" fill="#2A1E16" opacity=".78" />
            <rect x="1.5" y={-h * 0.4} width="5.5" height={h * 0.4} rx="2" fill="#2A1E16" opacity=".78" />
            <path d={`M-10 ${-h + 22} Q0 ${-h + 17} 10 ${-h + 22} L8 ${-h * 0.4} L-8 ${-h * 0.4} Z`} fill={cloth} stroke="#2A1E16" strokeWidth="2" strokeLinejoin="round" />
          </>
        )}
        <circle cx="0" cy={-h + 10} r={headR} fill={skin} stroke="#2A1E16" strokeWidth="2" />
        <path d={`M${-headR} ${-h + 9} Q0 ${-h - 4} ${headR} ${-h + 9} Q0 ${-h + 4} ${-headR} ${-h + 9}Z`} fill={hair} />
      </g>
    </g>
  )
}

export default function HouseScene({ stage, label, className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const brick = `s3brick${uid}`
  const wob = `s3wob${uid}`
  const g = (n: number) => `hs hs-${n}${stage >= n ? ' on' : ''}`

  return (
    <svg
      className={`s3-house${className ? ' ' + className : ''}`}
      viewBox="0 0 800 600"
      role="img"
      aria-label={label}
      data-stage={stage}
    >
      <defs>
        <pattern id={brick} patternUnits="userSpaceOnUse" width="30" height="14">
          <rect width="30" height="14" fill="var(--sc-brick)" />
          <path d="M0 0H30M0 7H30M0 14H30M0 0V7M15 7V14" stroke="var(--sc-mortar)" strokeWidth="1.6" fill="none" />
        </pattern>
        <filter id={wob} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* ---- sky, sun, clouds, hills ---- */}
      <rect x="-800" y="-400" width="2400" height="852" fill="var(--sc-sky)" />
      <rect x="-800" y="-400" width="2400" height="600" fill="var(--sc-sky-2)" opacity=".55" />
      <g className="hs-sun">
        <g className="hs-rays" style={{ transformOrigin: '400px 78px' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M400 20 V34" stroke="var(--sc-sun)" strokeWidth="5" strokeLinecap="round" transform={`rotate(${i * 30} 400 78)`} />
          ))}
        </g>
        <circle cx="400" cy="78" r="34" fill="var(--sc-sun)" />
      </g>
      <g className="hs-cloud hs-cloud--a">
        <path d="M0 40 Q0 24 18 24 Q24 6 46 10 Q62 2 72 18 Q92 14 92 34 Q92 44 80 44 H12 Q0 44 0 40Z" fill="var(--sc-cloud)" opacity=".95" />
      </g>
      <g className="hs-cloud hs-cloud--b">
        <path d="M0 34 Q0 20 16 20 Q22 4 42 8 Q56 0 66 14 Q82 12 82 30 Q82 38 72 38 H10 Q0 38 0 34Z" fill="var(--sc-cloud)" opacity=".9" />
      </g>
      <g className="hs-birds" stroke="#2A1E16" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6">
        <path d="M0 0 q6 -7 12 0 q6 -7 12 0" />
        <path d="M30 14 q5 -6 10 0 q5 -6 10 0" />
      </g>
      <path d="M-800 400 H0 Q90 340 200 380 T400 372 T620 372 T800 350 H1600 V452 H-800Z" fill="var(--sc-hill)" />
      <path d="M-800 424 H0 Q120 386 260 414 T520 410 T800 396 H1600 V452 H-800Z" fill="var(--sc-hill-2)" />

      {/* ---- ground, soil ---- */}
      <rect x="-800" y="440" width="2400" height="14" fill="var(--sc-grass)" />
      <rect x="-800" y="454" width="2400" height="400" fill="var(--sc-soil)" />
      <g fill="var(--sc-soil-deep)" opacity=".55">
        {[
          [40, 470], [96, 520], [150, 484], [250, 566], [300, 480], [392, 560], [430, 500], [560, 574], [690, 488], [742, 540], [720, 580], [60, 568],
        ].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={i % 3 === 0 ? 7 : 4.5} ry={i % 3 === 0 ? 4 : 2.8} />)}
      </g>

      {/* ---- the house, drawn slightly wobbly like pencil ---- */}
      <g filter={`url(#${wob})`} stroke="#2A1E16" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {/* 1 · footings: trench, pad, rebar mesh, starter bars */}
        <g className={g(1)}>
          {COLS.map(cx => (
            <g key={cx}>
              <rect x={cx - 54} y="500" width="108" height="58" rx="6" fill="var(--sc-soil-deep)" stroke="none" opacity=".7" />
              <rect x={cx - 44} y="520" width="88" height="28" fill="var(--sc-concrete)" />
              <path d={`M${cx - 38} 528H${cx + 38}M${cx - 38} 540H${cx + 38}M${cx - 30} 522V546M${cx - 15} 522V546M${cx} 522V546M${cx + 15} 522V546M${cx + 30} 522V546`} strokeWidth="1.3" opacity=".45" fill="none" />
              <path d={`M${cx - 6} 520V496M${cx + 6} 520V496`} stroke="var(--c-tomato)" strokeWidth="2.4" fill="none" />
            </g>
          ))}
        </g>

        {/* 2 · columns: concrete with steel bars and ties */}
        <g className={g(2)}>
          {COLS.map(cx => (
            <g key={cx}>
              <rect x={cx - 12} y="200" width="24" height="320" fill="var(--sc-concrete)" />
              <path d={`M${cx - 6} 204V516M${cx + 6} 204V516`} strokeWidth="1.6" opacity=".5" fill="none" />
              <path d={Array.from({ length: 11 }, (_, k) => `M${cx - 9} ${222 + k * 26}H${cx + 9}`).join('')} strokeWidth="1.2" opacity=".32" fill="none" />
            </g>
          ))}
        </g>

        {/* 3 · plinth beam: ties the columns together at ground level */}
        <g className={g(3)}>
          <rect x="188" y="424" width="444" height="20" fill="var(--sc-concrete)" />
          <path d="M192 430H628M192 438H628" strokeWidth="1.3" opacity=".42" fill="none" />
        </g>

        {/* 4 · brick walls (door and window openings stay dark until they are fitted) */}
        <g className={g(4)}>
          {BAYS.map(x => (
            <g key={x}>
              <rect x={x} y="334" width="116" height="90" fill={`url(#${brick})`} />
              <rect x={x} y="212" width="116" height="100" fill={`url(#${brick})`} />
            </g>
          ))}
          <rect x="250" y="352" width="40" height="72" fill="var(--sc-hole)" strokeWidth="2" />
          {[372, 512].map(x => <rect key={`g${x}`} x={x} y="358" width="76" height="44" fill="var(--sc-hole)" strokeWidth="2" />)}
          {[232, 372, 512].map(x => <rect key={`u${x}`} x={x} y="240" width="76" height="50" fill="var(--sc-hole)" strokeWidth="2" />)}
        </g>

        {/* 5 · first-floor beam and the lintels over every door and window */}
        <g className={g(5)}>
          <rect x="176" y="312" width="468" height="22" fill="var(--sc-concrete)" />
          <path d="M182 318H638M182 328H638" strokeWidth="1.3" opacity=".42" fill="none" />
          <rect x="242" y="344" width="56" height="8" fill="var(--sc-concrete)" />
          {[364, 504].map(x => <rect key={`lg${x}`} x={x} y="350" width="92" height="8" fill="var(--sc-concrete)" />)}
          {[224, 364, 504].map(x => <rect key={`lu${x}`} x={x} y="232" width="92" height="8" fill="var(--sc-concrete)" />)}
        </g>

        {/* 6 · roof slab and parapet */}
        <g className={g(6)}>
          <rect x="172" y="172" width="476" height="18" fill="var(--sc-concrete-d)" />
          <rect x="164" y="190" width="492" height="22" fill="var(--sc-concrete)" />
          <path d="M170 196H650M170 206H650" strokeWidth="1.3" opacity=".42" fill="none" />
        </g>

        {/* 7a · paint, frames and glass */}
        <g className={`hs hs-7 hs-7a${stage >= 7 ? ' on' : ''}`}>
          {BAYS.map(x => (
            <g key={x}>
              <rect x={x} y="334" width="116" height="90" fill="var(--sc-paint)" opacity=".94" stroke="none" />
              <rect x={x} y="212" width="116" height="100" fill="var(--sc-paint)" opacity=".94" stroke="none" />
            </g>
          ))}
          <rect x="250" y="352" width="40" height="72" fill="var(--c-indigo)" strokeWidth="2.4" />
          <circle cx="282" cy="390" r="2.6" fill="var(--c-marigold)" stroke="none" />
          {[372, 512].map(x => (
            <g key={`wg${x}`}>
              <rect x={x} y="358" width="76" height="44" fill="var(--sc-glass)" strokeWidth="2.4" />
              <path d={`M${x + 38} 358V402M${x} 380H${x + 76}`} strokeWidth="2" fill="none" />
            </g>
          ))}
          {[232, 372, 512].map(x => (
            <g key={`wu${x}`}>
              <rect x={x} y="240" width="76" height="50" fill="var(--sc-glass)" strokeWidth="2.4" />
              <path d={`M${x + 38} 240V290M${x} 265H${x + 76}`} strokeWidth="2" fill="none" />
              <rect x={x - 4} y="290" width="84" height="6" fill="var(--sc-concrete)" strokeWidth="2" />
            </g>
          ))}
        </g>
      </g>

      {/* 7b · wiring (yellow, inside the walls), water tank and pipe */}
      <g className={`hs hs-7 hs-7b${stage >= 7 ? ' on' : ''}`} fill="none" strokeLinecap="round">
        <path d="M222 212V380M362 236V376M502 236V376" stroke="var(--c-marigold-deep)" strokeWidth="3" strokeDasharray="1 7" />
        {[[222, 380], [362, 376], [502, 376]].map(([x, y], i) => (
          <rect key={i} x={x - 6} y={y - 6} width="12" height="12" rx="2.5" fill="var(--c-card)" stroke="#2A1E16" strokeWidth="2" />
        ))}
        <g stroke="#2A1E16" strokeWidth="2.6" strokeLinejoin="round">
          <path d="M532 172V148M584 172V148" strokeWidth="3" />
          <rect x="524" y="108" width="68" height="46" rx="10" fill="var(--c-indigo-soft)" />
          <path d="M524 126H592" strokeWidth="1.8" opacity=".5" />
          <ellipse cx="558" cy="108" rx="34" ry="7" fill="var(--c-indigo)" />
        </g>
        <path d="M592 132H668V436" stroke="var(--c-indigo)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M668 414h16" stroke="var(--c-indigo)" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* 7c · tree, and the family who moved in */}
      <g className={`hs hs-7 hs-7c${stage >= 7 ? ' on' : ''}`}>
        <g stroke="#2A1E16" strokeWidth="2.4" strokeLinejoin="round">
          <rect x="722" y="370" width="14" height="72" rx="3" fill="#8A5A3A" />
          <circle cx="729" cy="352" r="38" fill="var(--c-leaf)" />
          <circle cx="702" cy="372" r="26" fill="var(--c-leaf)" />
          <circle cx="758" cy="374" r="24" fill="var(--c-leaf)" />
        </g>
        <Person x={80} cloth="var(--c-tomato)" kind="saree" delay={0} />
        <Person x={118} scale={0.98} cloth="var(--c-indigo)" delay={0.4} />
        <Person x={150} cloth="var(--c-marigold)" kind="child" delay={0.8} hair="#2A1E16" />
      </g>
    </svg>
  )
}

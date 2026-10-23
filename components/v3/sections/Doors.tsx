import Link from 'next/link'
import { Arrow } from '../Icons'
import { DOORS, MORE, pick, type Loc } from '@/lib/v3/copy'

const INK = '#2A1E16'

/** One small hand-drawn scene per door. Pastel fills with ink outlines read on both the day and night cards. */
function DoorArt({ kind }: { kind: string }) {
  const stroke = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

  if (kind === 'material') {
    return (
      <svg className="s3-door__icon" viewBox="0 0 300 160" aria-hidden="true">
        <path d="M6 136H294" {...stroke} />
        {/* sand heap */}
        <path d="M222 136 Q252 70 292 136Z" fill="#EBC98C" {...stroke} />
        <path d="M244 118c8 2 16 2 24 0M236 128c14 3 30 3 44 0" fill="none" stroke="#B88B4A" strokeWidth="2" strokeLinecap="round" />
        {/* cement sacks */}
        {[[14, 98], [64, 98], [39, 62]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y + 8}c0-5 3-8 8-8h28c5 0 8 3 8 8l2 28c0 3-2 5-5 5H${x + 3}c-3 0-5-2-5-5z`} fill="#F3EBDB" {...stroke} />
            <path d={`M${x + 4} ${y + 4}c9 4 29 4 38 0`} fill="none" {...stroke} strokeWidth="1.8" />
            <rect x={x + 12} y={y + 16} width="26" height="14" rx="3" fill="#2E3F94" stroke={INK} strokeWidth="1.8" />
            <path d={`M${x + 17} ${y + 23}h16`} stroke="#FFFCF3" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ))}
        {/* brick pile */}
        {[[122, 123, 3], [135, 110, 2], [148, 97, 1]].map(([x, y, n], r) =>
          Array.from({ length: n as number }, (_, i) => (
            <rect key={`${r}-${i}`} x={(x as number) + i * 27} y={y as number} width="25" height="12" rx="2" fill="#D98A5F" {...stroke} strokeWidth="2" />
          )),
        )}
        {/* steel bundle */}
        {[100, 108, 116, 124].map(y => (
          <path key={y} d={`M170 ${y}H236`} stroke="#B5472B" strokeWidth="6" strokeLinecap="round" />
        ))}
        <path d="M186 96V128M220 96V128" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M268 22l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#F2A516" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }

  if (kind === 'quote') {
    return (
      <svg className="s3-door__icon" viewBox="0 0 300 160" aria-hidden="true">
        <g transform="rotate(-4 110 80)">
          <rect x="52" y="14" width="124" height="132" rx="8" fill="#FFFCF3" {...stroke} />
          {[38, 62, 86, 110].map((y, i) => (
            <g key={y}>
              {i === 2 && <rect x="58" y={y - 10} width="112" height="22" rx="5" fill="#FCE4A8" />}
              <path d={`M66 ${y}h${[52, 40, 58, 36][i]}`} stroke={INK} strokeOpacity=".3" strokeWidth="4" strokeLinecap="round" />
              <path d={`M146 ${y}h14`} stroke={INK} strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
            </g>
          ))}
          <path d="M66 138l6 6 12-14" fill="none" stroke="#2F7A4F" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -18) scale(.8) translate(14 18)" />
        </g>
        {/* magnifier over the suspicious line */}
        <circle cx="206" cy="82" r="38" fill="#CFE5F2" fillOpacity=".62" stroke={INK} strokeWidth="4.400" />
        <path d="M233 110l32 30" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <path d="M233 110l32 30" stroke="#F2A516" strokeWidth="3.200" strokeLinecap="round" />
        <text x="206" y="94" textAnchor="middle" fontFamily="var(--f-display)" fontSize="34" fill="#D8432B">₹?</text>
        <path d="M184 52c6-8 16-12 26-11" fill="none" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth="3.600" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="s3-door__icon" viewBox="0 0 300 160" aria-hidden="true">
      {/* compass ring */}
      <circle cx="150" cy="82" r="68" fill="#FFFCF3" fillOpacity=".55" stroke={INK} strokeWidth="2.400" strokeDasharray="3 7" strokeLinecap="round" />
      {/* the plan: 3 x 3 rooms */}
      <g>
        <rect x="104" y="36" width="92" height="92" fill="#FFFCF3" {...stroke} strokeWidth="3" />
        <rect x="104" y="36" width="30.600" height="30.600" fill="#CFE5F2" />
        <rect x="165.400" y="36" width="30.600" height="30.600" fill="#FCE4A8" />
        <rect x="104" y="97.400" width="30.600" height="30.600" fill="#D5EBDD" />
        <rect x="165.400" y="97.400" width="30.600" height="30.600" fill="#F8D9CF" />
        <path d="M134.600 36V128M165.400 36V128M104 66.600H196M104 97.400H196" stroke={INK} strokeWidth="2" />
        <path d="M143 128v-10a7 7 0 0 1 14 0v10" fill="#FFFCF3" stroke={INK} strokeWidth="2" />
        <circle cx="180.700" cy="51.300" r="5" fill="#F2A516" stroke={INK} strokeWidth="1.800" />
      </g>
      {/* north arrow */}
      <path d="M150 6l10 18-10-5-10 5z" fill="#D8432B" {...stroke} strokeWidth="2" />
      <text x="150" y="156" textAnchor="middle" fontFamily="var(--f-hand)" fontSize="15" fontWeight="700" fill={INK} opacity=".7">S</text>
      <text x="16" y="88" fontFamily="var(--f-hand)" fontSize="15" fontWeight="700" fill={INK} opacity=".7">W</text>
      <text x="274" y="88" fontFamily="var(--f-hand)" fontSize="15" fontWeight="700" fill={INK} opacity=".7">E</text>
      <text x="168" y="16" fontFamily="var(--f-hand)" fontSize="15" fontWeight="700" fill={INK} opacity=".7">N</text>
    </svg>
  )
}

export default function Doors({ loc }: { loc: Loc }) {
  const home = loc === 'hi' ? '/hi' : '/'
  return (
    <section className="s3-section s3-doors" aria-labelledby="s3-doors-h">
      <div className="s3-wrap">
        <div className="s3-head s3-head--center s3-rise">
          <h2 className="s3-h2" id="s3-doors-h">{pick(DOORS.title, loc)}</h2>
        </div>
        <ul className="s3-doors__grid">
          {DOORS.items.map((d, i) => {
            const href = d.href.startsWith('#') ? `${home}${d.href}` : d.href
            return (
              <li key={d.key} className={`s3-door s3-door--${d.tone} s3-rise`} style={{ ['--d' as string]: `${i * 0.12}s` }}>
                <Link href={href} className="s3-door__link">
                  <span className="s3-door__art" aria-hidden="true">
                    <span className="s3-door__blob" />
                    <DoorArt kind={d.key} />
                    {d.key === 'vastu' && <span className="s3-door__sticker">{pick(MORE.free, loc)}</span>}
                  </span>
                  <span className="s3-h3 s3-door__title">{pick(d.title, loc)}</span>
                  <span className="s3-door__body">{pick(d.body, loc)}</span>
                  <span className="s3-door__cta">{pick(d.cta, loc)}<Arrow width={22} height={22} /></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { Arrow } from '../Icons'
import { QUOTE, pick, type Loc } from '@/lib/v3/copy'

/** Three little doodles, one per way a quote hides the truth. */
function Doodle({ kind }: { kind: number }) {
  const ink = '#2A1E16'
  if (kind === 0) {
    return (
      <svg viewBox="0 0 160 110" aria-hidden="true">
        <g transform="rotate(-4 80 55)">
          <rect x="34" y="12" width="92" height="88" rx="6" fill="#FFFCF3" stroke={ink} strokeWidth="2.400" />
          <path d="M46 34h68M46 46h50M46 58h60" stroke={ink} strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
          <text x="80" y="92" textAnchor="middle" fontFamily="var(--f-hand)" fontSize="26" fill="#D8432B">₹ ??</text>
        </g>
        <path d="M120 20c10-6 22-2 22 10" fill="none" stroke={ink} strokeWidth="2.200" strokeLinecap="round" />
        <path d="M137 24l5 7 6-7" fill="none" stroke={ink} strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 1) {
    return (
      <svg viewBox="0 0 160 110" aria-hidden="true">
        <g transform="rotate(7 80 55)">
          <path d="M30 56 L58 24 H128 a8 8 0 0 1 8 8 V80 a8 8 0 0 1-8 8 H58 Z" fill="#FCE4A8" stroke={ink} strokeWidth="2.400" strokeLinejoin="round" />
          <circle cx="56" cy="56" r="6" fill="#FFFCF3" stroke={ink} strokeWidth="2.200" />
          <text x="92" y="52" textAnchor="middle" fontFamily="var(--f-display)" fontSize="22" fill={ink}>₹1,800</text>
          <text x="92" y="74" textAnchor="middle" fontFamily="var(--f-hand)" fontSize="17" fill={ink}>/ sq ft</text>
        </g>
        <path d="M18 92c14 8 30 8 44 0" fill="none" stroke="#2E3F94" strokeWidth="2.200" strokeLinecap="round" strokeDasharray="1 7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 110" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i} transform={`translate(${14 + i * 5} ${10 + i * 15}) rotate(${(i - 2) * 2.500} 60 12)`}>
          <rect width="112" height="24" rx="5" fill={['#DFE4F8', '#FCE4A8', '#D5EBDD', '#F8D9CF', '#CFE5F2'][i]} stroke={ink} strokeWidth="2.200" />
          <path d="M12 12h54" stroke={ink} strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
          <text x="100" y="17" textAnchor="end" fontFamily="var(--f-hand)" fontSize="15" fill={ink}>₹?</text>
        </g>
      ))}
    </svg>
  )
}

export default function Quote({ loc }: { loc: Loc }) {
  return (
    <section className="s3-section s3-section--alt s3-quote" aria-labelledby="s3-quote-h">
      <div className="s3-wrap">
        <div className="s3-head s3-rise">
          <h2 className="s3-h2" id="s3-quote-h">{pick(QUOTE.title, loc)}</h2>
          <p className="s3-lede">{pick(QUOTE.lede, loc)}</p>
        </div>
        <ul className="s3-quote__grid">
          {QUOTE.cards.map((c, i) => (
            <li key={i} className="s3-card s3-stitch s3-quote__card s3-rise" style={{ ['--d' as string]: `${i * 0.12}s` }}>
              <div className="s3-quote__art"><Doodle kind={i} /></div>
              <h3 className="s3-h3">{pick(c.title, loc)}</h3>
              <p>{pick(c.body, loc)}</p>
            </li>
          ))}
        </ul>
        <div className="s3-quote__cta s3-rise">
          <Link href="/compare-quote" className="s3-btn s3-btn--indigo">{pick(QUOTE.cta, loc)}<Arrow width={22} height={22} /></Link>
        </div>
      </div>
    </section>
  )
}

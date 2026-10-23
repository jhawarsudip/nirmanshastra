import Link from 'next/link'
import { Shield } from '../Icons'
import { MORE, TRUST, pick, type Loc } from '@/lib/v3/copy'

/** A rubber stamp: the codes are a badge of care, not the headline. */
function Stamp({ text }: { text: string }) {
  return (
    <svg className="s3-stamp" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="s3-stamp-ring" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" strokeWidth="2.500" strokeDasharray="2 6" strokeLinecap="round" />
      <g className="s3-stamp__ring">
        <text fontFamily="var(--f-body)" fontWeight="700" fontSize="17" fill="currentColor">
          <textPath href="#s3-stamp-ring" startOffset="0" textLength="458" lengthAdjust="spacing">{text}</textPath>
        </text>
      </g>
      <text x="100" y="116" textAnchor="middle" fontFamily="var(--f-display)" fontSize="50" fill="currentColor">IS</text>
    </svg>
  )
}

export default function Trust({ loc }: { loc: Loc }) {
  return (
    <section className="s3-section s3-trust" aria-labelledby="s3-trust-h">
      <div className="s3-wrap s3-trust__wrap">
        <div className="s3-trust__stamp s3-rise"><Stamp text={pick(MORE.stamp, loc)} /></div>
        <div className="s3-trust__copy s3-rise" style={{ ['--d' as string]: '.1s' }}>
          <h2 className="s3-h2" id="s3-trust-h">{pick(TRUST.title, loc)}</h2>
          <p className="s3-lede">{pick(TRUST.body, loc)}</p>
          <p className="s3-trust__honest"><Shield width={26} height={26} /><span>{pick(TRUST.honest, loc)}</span></p>
          <Link href="/is-codes-used" className="s3-link">{pick(TRUST.more, loc)}</Link>
        </div>
      </div>
    </section>
  )
}

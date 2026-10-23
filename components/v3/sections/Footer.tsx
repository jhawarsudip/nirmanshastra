'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Arrow, BrandMark } from '../Icons'
import { CALCULATORS } from '@/lib/v2/calculators'
import { SITE_TEMPLATES, TEMPLATES_BUNDLE, TOOLS } from '@/lib/v2/content'
import { FOOT, MORE, PROS, pick, type Loc } from '@/lib/v3/copy'

/** A little town at dusk. Windows light up at random in night mode. */
function Skyline() {
  const homes = [
    { x: 20, w: 90, h: 70, roof: 'flat' },
    { x: 130, w: 70, h: 104, roof: 'tank' },
    { x: 220, w: 110, h: 62, roof: 'gable' },
    { x: 350, w: 80, h: 120, roof: 'flat' },
    { x: 450, w: 100, h: 84, roof: 'tank' },
    { x: 570, w: 120, h: 58, roof: 'gable' },
    { x: 710, w: 76, h: 110, roof: 'flat' },
    { x: 806, w: 96, h: 76, roof: 'gable' },
    { x: 922, w: 84, h: 126, roof: 'tank' },
    { x: 1026, w: 110, h: 66, roof: 'flat' },
    { x: 1156, w: 78, h: 96, roof: 'gable' },
    { x: 1254, w: 96, h: 112, roof: 'flat' },
    { x: 1370, w: 70, h: 72, roof: 'tank' },
  ]
  return (
    <svg className="s3-foot__sky" viewBox="0 0 1440 190" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {homes.map((b, i) => {
        const top = 190 - b.h
        const cols = Math.max(2, Math.floor(b.w / 28))
        const rows = Math.max(1, Math.floor((b.h - 14) / 30))
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h + 2} fill="currentColor" />
            {b.roof === 'flat' && <rect x={b.x - 4} y={top - 6} width={b.w + 8} height="8" rx="2" fill="currentColor" />}
            {b.roof === 'gable' && <path d={`M${b.x - 6} ${top + 2} L${b.x + b.w / 2} ${top - 26} L${b.x + b.w + 6} ${top + 2}Z`} fill="currentColor" />}
            {b.roof === 'tank' && (
              <>
                <rect x={b.x - 4} y={top - 6} width={b.w + 8} height="8" rx="2" fill="currentColor" />
                <rect x={b.x + b.w - 34} y={top - 28} width="24" height="22" rx="5" fill="currentColor" />
              </>
            )}
            {Array.from({ length: rows * cols }, (_, k) => {
              const r = Math.floor(k / cols)
              const c = k % cols
              const wx = b.x + 10 + c * ((b.w - 20) / cols) + 2
              const wy = top + 14 + r * 30
              const lit = (i * 7 + k * 3) % 5 !== 0
              return (
                <rect
                  key={k}
                  className={`s3-win${lit ? ' is-lit' : ''}`}
                  style={{ animationDelay: `${((i * 13 + k * 7) % 11) * 0.7}s` }}
                  x={wx}
                  y={wy}
                  width="12"
                  height="16"
                  rx="2"
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

export default function Footer({ loc }: { loc: Loc }) {
  const [yr, setYr] = useState(2026)
  useEffect(() => setYr(new Date().getFullYear()), [])

  const company: [string, string][] = [
    [pick(MORE.about, loc), '/about'], [pick(MORE.contact, loc), '/contact'], [pick(MORE.blog, loc), '/blog'], [pick(MORE.careers, loc), '/careers'],
  ]
  const legal: [string, string][] = [
    [pick(MORE.privacy, loc), '/privacy-policy'], [pick(MORE.terms, loc), '/terms-of-use'], [pick(MORE.disclaimer, loc), '/disclaimer'],
    [pick(MORE.isCodes, loc), '/is-codes-used'], [pick(MORE.glossary, loc), '/glossary'], [pick(MORE.llms, loc), '/llms.txt'],
  ]

  return (
    <footer className="s3-foot">
      <Skyline />
      <div className="s3-foot__body">
        <div className="s3-wrap">
          <p className="s3-foot__big">{pick(FOOT.tagline, loc)}</p>
          <div className="s3-foot__cols">
            <div className="s3-foot__brand">
              <BrandMark className="s3-foot__mark" />
              <p className="s3-foot__name">Nirman<b>Shastra</b></p>
              <p className="s3-foot__note">{pick(FOOT.note, loc)}</p>
            </div>
            <nav aria-label={pick(FOOT.tools, loc)}>
              <h2>{pick(FOOT.tools, loc)}</h2>
              <ul>{TOOLS.map(k => <li key={k.key}><Link href={k.href}>{k.name}{k.free ? <em>{pick(MORE.free, loc)}</em> : null}</Link></li>)}</ul>
            </nav>
            <nav aria-label={pick(FOOT.calcs, loc)}>
              <h2>{pick(FOOT.calcs, loc)}</h2>
              <ul>{CALCULATORS.map(c => <li key={c.href}><Link href={c.href}>{c.title[loc]}</Link></li>)}</ul>
            </nav>
            <nav aria-label={pick(FOOT.kits, loc)}>
              <h2>{pick(FOOT.kits, loc)}</h2>
              <ul>
                {SITE_TEMPLATES.map(s => <li key={s.href}><Link href={s.href}>{s.title}<em>{s.price}</em></Link></li>)}
                <li><Link href={TEMPLATES_BUNDLE.href}>{pick(PROS.kitBundle, loc)}<em>{TEMPLATES_BUNDLE.price}</em></Link></li>
              </ul>
            </nav>
            <nav aria-label={pick(FOOT.company, loc)}>
              <h2>{pick(FOOT.company, loc)}</h2>
              <ul>{company.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
              <h2 className="s3-foot__h2b">{pick(FOOT.legal, loc)}</h2>
              <ul>{legal.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
            </nav>
          </div>
          <div className="s3-foot__base">
            <span>&copy; {yr} NirmanShastra</span>
            <button type="button" className="s3-foot__top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {pick(FOOT.top, loc)}<Arrow width={20} height={20} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

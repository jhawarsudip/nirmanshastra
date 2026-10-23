'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HouseScene from '../HouseScene'
import { Arrow, Check, Squiggle } from '../Icons'
import { HERO, MORE, STORY, pick, type Loc } from '@/lib/v3/copy'
import { useMotionOK } from '@/lib/v2/store'

// When each of the 7 build stages appears (ms after the page settles).
const TIMES = [500, 1300, 2100, 2900, 3800, 4600, 5600]

/** A string of mango leaves and marigolds hung over the doorway of the picture. */
function Toran() {
  const xs = Array.from({ length: 13 }, (_, i) => 40 + i * 40)
  const y = (x: number) => {
    const t = (x - 10) / 540
    return (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 44 + t * t * 8
  }
  return (
    <svg className="s3-toran" viewBox="0 0 560 84" aria-hidden="true">
      <path d="M10 8 Q280 44 550 8" fill="none" stroke="#7A5A3A" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="10" cy="8" r="4.5" fill="#7A5A3A" />
      <circle cx="550" cy="8" r="4.5" fill="#7A5A3A" />
      {xs.map((x, i) => (
        <g key={x} transform={`translate(${x} ${y(x)})`}>
          <g className="s3-toran__sway" style={{ animationDelay: `${-i * 0.37}s` }}>
            {i % 2 === 0 ? (
              <>
                <path d="M0 0 C11 8 11 28 0 38 C-11 28 -11 8 0 0Z" fill="#2F7A4F" stroke="#2A1E16" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M0 5 V32" stroke="#D5EBDD" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
              </>
            ) : (
              <>
                <path d="M0 0 V10" stroke="#7A5A3A" strokeWidth="1.6" />
                <circle cx="0" cy="18" r="9" fill="#F2A516" stroke="#2A1E16" strokeWidth="1.6" />
                <circle cx="0" cy="18" r="3.6" fill="#D8432B" />
              </>
            )}
          </g>
        </g>
      ))}
    </svg>
  )
}

export default function Hero({ loc }: { loc: Loc }) {
  const ok = useMotionOK()
  const [stage, setStage] = useState(0)
  const [run, setRun] = useState(0)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(id => window.clearTimeout(id)); timers.current = [] }

  useEffect(() => {
    clear()
    if (!ok) { setStage(7); return }
    setStage(0)
    timers.current = TIMES.map((ms, i) => window.setTimeout(() => setStage(i + 1), ms))
    return clear
  }, [ok, run])

  const jump = useCallback((n: number) => { clear(); setStage(n) }, [])

  const home = loc === 'hi' ? '/hi' : '/'
  const cur = stage === 0 ? null : STORY.stages[stage - 1]

  return (
    <section className="s3-hero" aria-labelledby="s3-hero-h">
      <div className="s3-wrap s3-hero__grid">
        <div className="s3-hero__copy">
          <p className="s3-note s3-hero__hello">{pick(MORE.hello, loc)}<Squiggle className="s3-hero__squig" /></p>
          <h1 className="s3-h1" id="s3-hero-h">
            <span>{pick(HERO.h1a, loc)}</span>{' '}
            <span className="s3-mark">{pick(HERO.h1b, loc)}</span>
          </h1>
          <p className="s3-lede s3-hero__sub">{pick(HERO.sub, loc)}</p>
          <div className="s3-hero__cta">
            <Link href={`${home}#try`} className="s3-btn">{pick(HERO.cta1, loc)}<Arrow width={22} height={22} /></Link>
            <Link href="/compare-quote" className="s3-btn s3-btn--ghost">{pick(HERO.cta2, loc)}</Link>
          </div>
          <ul className="s3-hero__chips" aria-label="Highlights">
            {HERO.chips.map((c, i) => (
              <li key={i} className="s3-chip"><Check width={16} height={16} style={{ color: 'var(--c-leaf)' }} />{pick(c, loc)}</li>
            ))}
          </ul>
          <p className="s3-hero__pros"><Link href={`${home}#pros`} className="s3-link">{pick(MORE.prosHint, loc)}</Link></p>
        </div>

        <div className="s3-hero__art">
          <Toran />
          <figure className="s3-frame">
            <div className="s3-frame__window">
              <HouseScene stage={stage} label={pick(HERO.sceneLabel, loc)} />
            </div>
            <figcaption className="s3-frame__note" aria-live="polite">
              <span className="s3-frame__step">
                {cur ? `${pick(MORE.stepOf, loc)} ${stage} ${pick(MORE.ofSeven, loc)}` : pick(HERO.note, loc)}
              </span>
              <strong className="s3-frame__title">{cur ? pick(cur.title, loc) : pick(MORE.emptyPlot, loc)}</strong>
            </figcaption>
          </figure>
          <div className="s3-dots" role="group" aria-label={pick(MORE.jump, loc)}>
            {STORY.stages.map((s, i) => (
              <button
                key={s.n}
                type="button"
                className={`s3-dot${stage >= i + 1 ? ' is-on' : ''}${stage === i + 1 ? ' is-cur' : ''}`}
                aria-label={`${pick(MORE.jump, loc)} ${i + 1}: ${pick(s.title, loc)}`}
                aria-pressed={stage === i + 1}
                onClick={() => jump(i + 1)}
              />
            ))}
            <button type="button" className="s3-replay" onClick={() => setRun(r => r + 1)} disabled={!ok}>
              ↻ {pick(MORE.replay, loc)}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import HouseScene from '../HouseScene'
import { HERO, MORE, STORY, pick, type Loc } from '@/lib/v3/copy'

/** Scroll down, the house grows. Each step says what is being built and one question worth asking the contractor. */
export default function Story({ loc }: { loc: Loc }) {
  const refs = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const line = window.innerHeight * 0.58
      let found = 0
      refs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top <= line) found = i + 1
      })
      setActive(prev => (prev === found ? prev : found))
    }
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  const cur = active > 0 ? STORY.stages[active - 1] : null

  return (
    <section id="story" className="s3-section s3-story" aria-labelledby="s3-story-h">
      <div className="s3-wrap">
        <div className="s3-head s3-rise">
          <h2 className="s3-h2" id="s3-story-h">{pick(STORY.title, loc)}</h2>
          <p className="s3-lede">{pick(STORY.lede, loc)}</p>
        </div>

        <div className="s3-story__grid">
          <div className="s3-story__scene">
            <div className="s3-story__window">
              <HouseScene stage={active} label={pick(HERO.sceneLabel, loc)} />
            </div>
            <p className="s3-story__tag" aria-hidden="true">
              <span>{cur ? `${pick(MORE.stepOf, loc)} ${active} ${pick(MORE.ofSeven, loc)}` : pick(MORE.emptyPlot, loc)}</span>
              {cur && <strong>{pick(cur.title, loc)}</strong>}
            </p>
          </div>

          <ol className="s3-story__steps">
            {STORY.stages.map((s, i) => (
              <li
                key={s.n}
                ref={el => { refs.current[i] = el }}
                className={`s3-step${active === s.n ? ' is-active' : ''}${active > s.n ? ' is-done' : ''}`}
              >
                <span className="s3-step__num" aria-hidden="true">{s.n}</span>
                <div className="s3-step__body">
                  <h3 className="s3-h3">{pick(s.title, loc)}</h3>
                  <p className="s3-step__what">{pick(s.what, loc)}</p>
                  <p className="s3-step__ask">
                    <span className="s3-step__askLabel">{pick(STORY.askLabel, loc)}</span>
                    {pick(s.ask, loc)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

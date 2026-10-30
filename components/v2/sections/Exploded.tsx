'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { LAYERS } from '@/lib/v2/content'
import { CALC } from '@/lib/v2/copy'
import { useMotionOK } from '@/lib/v2/store'
import '@/styles/v2/story.css'
import Pour from '../Pour'

const COPY = {
  en: {
    eyebrow: 'The house, step by step',
    title: 'Eight steps. One list.',
    lede: 'Watch a small house go up in the order it is really built: the concrete frame first, the walls after, the finish last. Every step is something you have to order, so you know what a quote should count.',
    hintStart: 'Scroll to build the house, or pick a step from the list.',
    hintBuilt: 'Built. Keep scrolling to pull it apart and see every layer.',
    step: 'Step',
    onQuote: 'What to count',
    note: 'Illustration · not to scale',
    list: 'Steps',
    standards: 'Standards behind it',
  },
  hi: {
    eyebrow: 'घर, चरण-दर-चरण',
    title: 'आठ चरण। एक सूची।',
    lede: 'एक छोटा घर उसी क्रम में बनते देखिए जिसमें वह सच में बनता है: पहले कंक्रीट का ढाँचा, फिर दीवारें, सबसे आख़िर में फ़िनिशिंग। हर चरण में कुछ ऐसा है जो आपको मँगवाना पड़ता है, इसलिए आपको पता रहता है कि कोटेशन में क्या गिना जाना चाहिए।',
    hintStart: 'स्क्रॉल कीजिए, घर बनेगा। या सूची से कोई चरण चुनिए।',
    hintBuilt: 'घर बन गया। स्क्रॉल करते रहिए, परतें अलग होंगी।',
    step: 'चरण',
    onQuote: 'क्या गिनना है',
    note: 'चित्र · पैमाने पर नहीं',
    list: 'चरण',
    standards: 'इसके पीछे के मानक',
  },
} as const

const HEADER = 68
const N = LAYERS.length
// One step owns one slice of the scroll. The list highlight and the layer that is moving read the SAME slice, so the step
// that is lit is always the one arriving, and every earlier step is already in place (scrolling back up reverses it exactly).
const START = 0.012           // scroll progress where step 1 begins
const STEP = 0.062            // the slice of scroll each step owns
const LAND = 0.82             // share of its slice a step spends arriving; the rest is a short rest before the next step
const BUILD_LEN = STEP * LAND
const BUILT_AT = START + N * STEP
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function Exploded() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const ok = useMotionOK()
  const outer = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const layers = useRef<(HTMLDivElement | null)[]>([])
  const pickRef = useRef<number | null>(null)
  const prog = useRef(0)
  const lastAct = useRef<number | null | undefined>(undefined)
  const lastLate = useRef(false)
  const [active, setActive] = useState<number | null>(null)
  const [late, setLate] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const [showCalc, setShowCalc] = useState(false)
  // The eight layer images are ~950 KB. Do not request them until the scene is ~1400px from the viewport,
  // so they never compete with the hero for bandwidth (the stack has a fixed aspect-ratio, so nothing shifts).
  const [near, setNear] = useState(false)

  // DOM order is the physical stacking order (so a later layer correctly covers an earlier one);
  // the build order is the order of LAYERS and drives the timing.
  const stackOrder = useMemo(() => LAYERS.map((_, i) => i).sort((a, b) => LAYERS[a].z - LAYERS[b].z), [])

  useEffect(() => {
    const el = outer.current
    if (!el || near) return
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect() } }, { rootMargin: '1400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  const apply = useCallback(() => {
    const p = prog.current
    const pk = pickRef.current
    const h = stack.current?.clientHeight ?? 400
    const gap = Math.min(80, h * 0.075)
    const ex = pk !== null ? 1 : ease(clamp((p - 0.55) / 0.25))
    // Pulling the layers apart makes the house taller than its box. Zoom the whole scene out by exactly that much as it
    // spreads, so the spread-out house always fits above the panel and never slides under it.
    const sMin = h / (h + 6 * gap)
    if (scene.current) scene.current.style.transform = `scale(${(1 - (1 - sMin) * ex).toFixed(4)})`
    // act: which step the panel talks about. focus: which layer stays bright while the others fade (only when picked or pulled apart).
    let act: number | null = null
    let focus: number | null = null
    if (pk !== null) { act = pk; focus = pk }
    else if (p > 0.8) { act = focus = Math.min(N - 1, Math.floor(((p - 0.8) / 0.2) * N)) }
    else if (p >= START && p < BUILT_AT) { act = Math.min(N - 1, Math.floor((p - START) / STEP)) }
    LAYERS.forEach((l, i) => {
      const el = layers.current[i]
      if (!el) return
      const t = pk !== null ? 1 : ease(clamp((p - START - i * STEP) / BUILD_LEN))
      const dim = focus === null || focus === i ? 1 : 0.2
      const fall = l.enter === 'drop' ? -(1 - t) * h * 0.55 : 0
      const dy = fall + (3 - l.z) * gap * ex
      el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`
      if (l.enter === 'rise') {
        // columns are cast upward and walls are laid course by course: they grow from the bottom instead of dropping in
        el.style.opacity = (t > 0 ? dim : 0).toFixed(3)
        el.style.clipPath = t >= 1 ? 'none' : `inset(${((1 - t) * 100).toFixed(1)}% 0 0 0)`
      } else if (l.enter === 'paint') {
        // the finish goes on from the top down, like a roller
        el.style.opacity = (t > 0 ? dim : 0).toFixed(3)
        el.style.clipPath = t >= 1 ? 'none' : `inset(0 0 ${((1 - t) * 100).toFixed(1)}% 0)`
      } else {
        el.style.opacity = (t * dim).toFixed(3)
        el.style.clipPath = ''
      }
    })
    if (act !== lastAct.current) { lastAct.current = act; setActive(act) }
    const isLate = p > 0.4
    if (isLate !== lastLate.current) { lastLate.current = isLate; setLate(isLate) }
  }, [])

  // the box changes height when the calculation opens or the window resizes: re-fit the scene
  useEffect(() => {
    const el = stack.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [apply])

  // static mode (reduced motion): fully exploded, layer chosen from the list
  useEffect(() => {
    pickRef.current = ok ? pick : (pick ?? 0)
    if (!ok) prog.current = 1
    apply()
  }, [pick, ok, apply])

  useEffect(() => {
    if (!ok) return
    let raf = 0
    const read = () => {
      raf = 0
      const el = outer.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const inner = window.innerHeight - HEADER
      prog.current = clamp((HEADER - r.top) / Math.max(1, r.height - inner))
      apply()
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [ok, apply])

  const cur = active !== null ? LAYERS[active] : null
  const stepNo = (i: number) => String(i + 1).padStart(2, '0')

  return (
    <section className="ns-ex" id="structure" aria-labelledby="ns-ex-h" data-motion={ok ? '1' : '0'}>
      <div className="ns-ex__outer" ref={outer}>
        <div className="ns-ex__stick">
          <div className="ns-wrap ns-ex__grid">
            <div className="ns-ex__copy">
              <p className="ns-eyebrow">{c.eyebrow}</p>
              <h2 className="ns-h2" id="ns-ex-h">{c.title}</h2>
              <p className="ns-lede ns-ex__lede">{c.lede}</p>
              <ol className="ns-ex__list" aria-label={c.list}>
                {LAYERS.map((l, i) => (
                  <li key={l.id}>
                    <button type="button" aria-pressed={active === i} onClick={() => setPick(p => (p === i ? null : i))} data-snap>
                      <span className="ns-ex__no">{stepNo(i)}</span>
                      <span>{l.name[loc]}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`ns-ex__stage${showCalc && cur ? ' is-calc' : ''}`}>
              <div className="ns-ex__stack" ref={stack}>
                <div className="ns-ex__scene" ref={scene}>
                  {stackOrder.map(i => (
                    <div key={LAYERS[i].id} className="ns-ex__layer" ref={el => { layers.current[i] = el }}>
                      {near && <Image src={LAYERS[i].src} alt={`${c.step} ${i + 1}: ${LAYERS[i].name[loc]}`} width={1500} height={1232} unoptimized sizes="(max-width: 1000px) 92vw, 52vw" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ns-plate ns-ex__panel" aria-live="polite">
                {cur ? (
                  <div className="ns-ex__ph">
                    <span className="ns-ex__id">{c.step} {active! + 1}</span>
                    <h3 className="ns-h3">{cur.name[loc]}</h3>
                  </div>
                ) : <div className="ns-ex__ph" />}
                <div className="ns-ex__body">
                  {cur ? (
                    showCalc ? (
                      <div className="ns-ex__work">
                        {cur.rows.length > 0 ? (
                          <ul className="ns-calc__rows">
                            {cur.rows.map((r, k) => (
                              <li key={k}>
                                <span className="ns-calc__lab">{r.label[loc]}</span>
                                <code className="ns-calc__how">{r.how[loc]}</code>
                                <b className="ns-calc__val">{r.value}</b>
                              </li>
                            ))}
                          </ul>
                        ) : cur.note ? <p className="ns-ex__fact">{cur.note[loc]}</p> : null}
                        <p className="ns-calc__std">
                          <span>{c.standards}</span>
                          {cur.codes.map(code => <code key={code}>{code}</code>)}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="ns-ex__fact">{cur.what[loc]}</p>
                        <p className="ns-ex__quote"><b>{c.onQuote}:</b> {cur.onQuote[loc]}</p>
                      </>
                    )
                  ) : (
                    <p className="ns-ex__fact ns-muted">{late ? c.hintBuilt : c.hintStart}</p>
                  )}
                </div>
                <div className="ns-ex__foot">
                  {cur && (
                    <button type="button" className="ns-calc__btn ns-ex__calcbtn" aria-expanded={showCalc} onClick={() => setShowCalc(v => !v)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="ns-calc__ico">
                        <rect x="4.5" y="2.5" width="15" height="19" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="currentColor" opacity=".85" />
                        <g fill="currentColor"><circle cx="8.6" cy="13.2" r="1.15" /><circle cx="12" cy="13.2" r="1.15" /><circle cx="15.4" cy="13.2" r="1.15" /><circle cx="8.6" cy="17" r="1.15" /><circle cx="12" cy="17" r="1.15" /><circle cx="15.4" cy="17" r="1.15" /></g>
                      </svg>
                      <span>{(showCalc ? CALC.hide : CALC.show)[loc]}</span>
                    </button>
                  )}
                  <span className="ns-ex__note">{c.note}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pour tone="alt" v={2} />
    </section>
  )
}

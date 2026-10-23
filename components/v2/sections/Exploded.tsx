'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { LAYERS } from '@/lib/v2/content'
import { useMotionOK } from '@/lib/v2/store'
import '@/styles/v2/story.css'

const COPY = {
  en: {
    eyebrow: 'The structure, taken apart',
    title: 'Seven layers. One bill.',
    lede: 'Scroll to build a small RCC house from the footing up, then pull it apart. Every layer carries the locked IS values the estimator actually uses.',
    hint: 'Scroll to build it, keep scrolling to pull it apart. Or pick a layer.',
    note: 'Illustration · not to scale',
    codes: 'Codes',
    list: 'Layers',
  },
  hi: {
    eyebrow: 'ढाँचा, परत-दर-परत',
    title: 'सात परतें। एक बिल।',
    lede: 'स्क्रॉल कीजिए: फुटिंग से छत तक एक छोटा RCC घर बनता है, फिर परतें अलग हो जाती हैं। हर परत वही लॉक IS मान दिखाती है जो अनुमान में लगते हैं।',
    hint: 'स्क्रॉल करें तो घर बनेगा, और स्क्रॉल करें तो परतें खुलेंगी। या कोई परत चुनें।',
    note: 'चित्र · पैमाने पर नहीं',
    codes: 'कोड',
    list: 'परतें',
  },
} as const

const HEADER = 68
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function Exploded() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const ok = useMotionOK()
  const outer = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const layers = useRef<(HTMLDivElement | null)[]>([])
  const pickRef = useRef<number | null>(null)
  const prog = useRef(0)
  const lastAct = useRef<number | null | undefined>(undefined)
  const [active, setActive] = useState<number | null>(null)
  const [pick, setPick] = useState<number | null>(null)
  // The seven layer images are ~860 KB. Do not request them until the scene is ~1400px from the viewport,
  // so they never compete with the hero for bandwidth (the stack has a fixed aspect-ratio, so nothing shifts).
  const [near, setNear] = useState(false)

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
    const gap = Math.min(80, h * 0.1)
    const ex = pk !== null ? 1 : ease(clamp((p - 0.55) / 0.25))
    let act: number | null = null
    if (pk !== null) act = pk
    else if (p > 0.8) act = Math.min(LAYERS.length - 1, Math.floor(((p - 0.8) / 0.2) * LAYERS.length))
    LAYERS.forEach((_, i) => {
      const el = layers.current[i]
      if (!el) return
      const s = i * 0.065
      const t = pk !== null ? 1 : ease(clamp((p - s) / 0.12))
      const dy = -(1 - t) * h * 0.55 + (3 - i) * gap * ex
      const dim = act === null || act === i ? 1 : 0.2
      el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`
      el.style.opacity = (t * dim).toFixed(3)
    })
    if (act !== lastAct.current) { lastAct.current = act; setActive(act) }
  }, [])

  // static mode (Calm / reduced motion): fully exploded, layer chosen from the list
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
                      <span className="ns-mono">{l.id}</span>
                      <span>{l.name[loc]}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="ns-ex__stage">
              <div className="ns-ex__stack" ref={stack}>
                {LAYERS.map((l, i) => (
                  <div key={l.id} className="ns-ex__layer" ref={el => { layers.current[i] = el }}>
                    {near && <Image src={l.src} alt={`${l.id} ${l.name.en}`} width={1500} height={1232} unoptimized sizes="(max-width: 1000px) 92vw, 52vw" />}
                  </div>
                ))}
              </div>
              <div className="ns-plate ns-ex__panel" aria-live="polite">
                {cur ? (
                  <>
                    <div className="ns-ex__ph">
                      <span className="ns-mono ns-ex__id">{cur.id}</span>
                      <h3 className="ns-h3">{cur.name[loc]}</h3>
                    </div>
                    <p className="ns-ex__fact">{cur.fact[loc]}</p>
                    <div className="ns-ex__meta">
                      <strong className="ns-mono">{cur.factNum}</strong>
                      <span className="ns-ex__chips">
                        {cur.codes.map(code => <span key={code} className="ns-chip">{code}</span>)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="ns-ex__fact ns-muted">{c.hint}</p>
                )}
                <span className="ns-mono ns-ex__note">{c.note}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

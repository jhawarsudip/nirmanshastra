'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import CutLink from '../CutLink'
import { Arrow } from '../Icons'
import { TOOLS } from '@/lib/v2/content'
import { useMotionOK } from '@/lib/v2/store'
import '@/styles/v2/story.css'

const COPY = {
  en: { eyebrow: 'Five disciplines, one estimate', open: 'Open', start: 'Start free', progress: 'of', pin: 'Scroll sideways through the five phases', shelf: 'Swipe through the five phases', gt: 'Master report', gtCta: 'Generate Grand Total Report →', gtLink: 'See the Grand Total Report', phase: 'Phase' },
  hi: { eyebrow: 'पाँच विधाएँ, एक अनुमान', open: 'खोलें', start: 'मुफ़्त शुरू करें', progress: '/', pin: 'पाँचों चरण देखने के लिए स्क्रॉल करें', shelf: 'पाँचों चरण देखने के लिए स्वाइप करें', gt: 'मास्टर रिपोर्ट', gtCta: 'ग्रैंड टोटल रिपोर्ट बनाएँ →', gtLink: 'ग्रैंड टोटल रिपोर्ट देखें', phase: 'चरण' },
} as const

const HEADER = 68

export default function Disciplines() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const tt = useTranslations('tools')
  const tp = useTranslations('pricing')
  const ok = useMotionOK()

  const outer = useRef<HTMLDivElement>(null)
  const stick = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(false)
  const [idx, setIdx] = useState(0)

  const paid = TOOLS.filter(t => !t.free)
  const vastu = TOOLS.find(t => t.free)!
  const total = paid.length + 1

  // pinned horizontal scroll on large screens with motion allowed; native snap shelf everywhere else
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px) and (hover: hover)')
    const sync = () => setPinned(ok && mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [ok])

  useEffect(() => {
    const o = outer.current, t = track.current, s = stick.current
    if (!o || !t || !s) return
    if (!pinned) {
      o.style.height = ''
      t.style.transform = ''
      return
    }
    let raf = 0
    let dist = 0
    const measure = () => {
      const sh = window.innerHeight - HEADER
      dist = Math.max(0, t.scrollWidth - window.innerWidth)
      o.style.height = `${sh + dist}px`
    }
    const paint = () => {
      raf = 0
      const r = o.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (HEADER - r.top) / Math.max(1, dist)))
      t.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`
      setIdx(Math.min(total - 1, Math.round(p * (total - 1))))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(paint) }
    measure(); paint()
    const ro = new ResizeObserver(() => { measure(); on() })
    ro.observe(t)
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', () => { measure(); on() })
    return () => { ro.disconnect(); window.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [pinned, total])

  const onShelfScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (pinned) return
    const el = e.currentTarget
    const card = el.querySelector<HTMLElement>('.ns-dis__card')
    if (!card) return
    setIdx(Math.min(total - 1, Math.round(el.scrollLeft / (card.offsetWidth + 20))))
  }

  return (
    <section className="ns-stage ns-section ns-dis" id="tools" aria-labelledby="ns-dis-h">
      <div className="ns-wrap">
        <p className="ns-eyebrow">{c.eyebrow}</p>
        <h2 className="ns-h2 ns-dis__h" id="ns-dis-h">{tt('sectionTitle')}</h2>
        <p className="ns-lede ns-dis__lede">{tt('sectionNote')} · {tt('sectionSub')}</p>

        {/* suite 1: the free, gold-accented VastuPro lives apart from the five cost tools */}
        <p className="ns-label ns-dis__suite">{tt('suite1Label')}</p>
        <article className="ns-plate ns-plate--paper ns-dis__vastu" style={{ ['--tc' as string]: 'var(--ns-t-vastu)' }}>
          <div className="ns-dis__vimg">
            <Image src={vastu.plate} alt={vastu.plateAlt} width={1100} height={1100} sizes="(max-width: 900px) 70vw, 320px" />
          </div>
          <div className="ns-dis__vbody">
            <span className="ns-mono ns-dis__ph">P0 · {c.start.toUpperCase()}</span>
            <h3 className="ns-h3">{vastu.name}</h3>
            <p className="ns-dis__desc"><strong>{tt(vastu.descriptorKey)}</strong><br />{tt(vastu.descKey)}</p>
            <div className="ns-dis__chips">{vastu.chips.map(ch => <span className="ns-chip" key={ch}>{ch}</span>)}</div>
            <CutLink href={vastu.href} className="ns-btn ns-btn--paper ns-btn--sm" data-snap>{tp('vastuCta')}</CutLink>
          </div>
        </article>

        <p className="ns-label ns-dis__suite">{tt('suite2Label')}</p>
        <p className="ns-dis__sub2">{tt('suite2Sub')} · <span className="ns-mono">{tt('fromPrice')}</span></p>
      </div>

      <div className="ns-dis__outer" ref={outer}>
        <div className="ns-dis__stick" ref={stick} data-pinned={pinned ? '1' : '0'}>
          <div className="ns-dis__track" ref={track} onScroll={onShelfScroll} tabIndex={pinned ? -1 : 0} aria-label={pinned ? c.pin : c.shelf}>
            {paid.map(tool => (
              <article key={tool.key} className="ns-plate ns-plate--paper ns-dis__card" style={{ ['--tc' as string]: `var(${tool.accent})` }}>
                <header className="ns-dis__top">
                  <span className="ns-mono ns-dis__ph">{c.phase} {tool.phase.replace('P', '')}</span>
                  <span className="ns-mono ns-dis__price">{tool.price}</span>
                </header>
                <div className="ns-dis__img">
                  <Image src={tool.plate} alt={tool.plateAlt} width={1100} height={1100} sizes="(max-width: 900px) 78vw, 380px" />
                </div>
                <h3 className="ns-h3">{tool.name}</h3>
                <p className="ns-dis__desc"><strong>{tt(tool.descriptorKey)}</strong><br />{tt(tool.descKey)}</p>
                <div className="ns-dis__chips">{tool.chips.map(ch => <span className="ns-chip" key={ch}>{ch}</span>)}</div>
                <CutLink href={tool.href} className="ns-btn ns-btn--sm" aria-label={`${c.open} ${tool.name}`} data-snap>{c.open} <Arrow /></CutLink>
              </article>
            ))}
            <article className="ns-plate ns-plate--paper ns-dis__card ns-dis__card--gt" style={{ ['--tc' as string]: 'var(--ns-laterite)' }}>
              <header className="ns-dis__top">
                <span className="ns-mono ns-dis__ph">{tp('gtLabel')}</span>
                <span className="ns-mono ns-dis__price">5 + 1</span>
              </header>
              <div className="ns-dis__gt">
                {paid.map(t2 => <i key={t2.key} style={{ background: `var(${t2.accent})` }} />)}
              </div>
              <h3 className="ns-h3">{tp('gtName')}</h3>
              <p className="ns-dis__desc"><strong>{tt('grandTotalDescriptor')}</strong><br />{tp('gtDesc')}</p>
              <p className="ns-dis__gtfree ns-mono">{tp('gtFree')}</p>
              <CutLink href="/tools/grand-total" className="ns-btn ns-btn--ink ns-btn--sm" data-snap>{tp('gtCta')}</CutLink>
            </article>
          </div>
          <div className="ns-dis__prog" aria-hidden="true">
            <span className="ns-mono">{String(idx + 1).padStart(2, '0')} {c.progress} {String(total).padStart(2, '0')}</span>
            <span className="ns-dis__bar"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></span>
          </div>
        </div>
      </div>
    </section>
  )
}

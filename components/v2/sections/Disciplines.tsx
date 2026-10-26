'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import CutLink from '../CutLink'
import { Arrow } from '../Icons'
import { TOOLS } from '@/lib/v2/content'
import { PRICE } from '@/lib/tool-pricing'
import { TOOL_PLAIN, pick, type Bi } from '@/lib/v2/copy'
import { useMotionOK } from '@/lib/v2/store'
import '@/styles/v2/story.css'
import Pour from '../Pour'

const COPY = {
  en: {
    eyebrow: 'Your reports', h: 'A quantities report for every stage of your build',
    lede: 'Pick the part you are planning. Each report tells you what to order and exactly how much of it, in plain words, ready to hand to your contractor or your dealer. Quantities only: no prices, no labour. You pay per report.',
    suite1: 'Start here, free', suite2: 'Quantity reports, one per stage',
    sub2: 'Exact quantities · item by item · a PDF for your contractor', from: `from ${PRICE.from} a report`,
    open: 'Open', start: 'Start free', free: 'Free', progress: 'of',
    pin: 'Scroll sideways through the five reports', shelf: 'Swipe through the five reports',
    gt: 'Master report', gtName: 'Grand Total Report', gtHead: 'One buying list for the whole house',
    gtDesc: 'Adds the reports you have already bought for one house into a single list. Cement, sand and stone are added across the stages and each stage keeps its own items, in the order a house is built.',
    gtFree: `An add-on · ${PRICE.grandtotal} · uses the reports you already have · included in the Complete House Pack`, gtCta: 'Make my Grand Total Report', phase: 'Stage',
    get: 'You get quantities and a PDF.',
  },
  hi: {
    eyebrow: 'आपकी रिपोर्टें', h: 'आपके निर्माण के हर चरण की एक मात्रा-रिपोर्ट',
    lede: 'जिस हिस्से की योजना बना रहे हैं, उसे चुनिए। हर रिपोर्ट सरल शब्दों में बताती है कि क्या मँगवाना है और ठीक कितना, ठेकेदार या डीलर को देने के लिए तैयार। सिर्फ़ मात्राएँ: न दाम, न मज़दूरी। आप हर रिपोर्ट का अलग भुगतान करते हैं।',
    suite1: 'यहाँ से शुरू कीजिए, मुफ़्त', suite2: 'मात्रा रिपोर्टें, हर चरण की एक',
    sub2: 'सटीक मात्रा · चीज़-दर-चीज़ · ठेकेदार के लिए PDF', from: `${PRICE.from} प्रति रिपोर्ट से`,
    open: 'खोलें', start: 'मुफ़्त शुरू करें', free: 'मुफ़्त', progress: '/',
    pin: 'पाँचों रिपोर्ट देखने के लिए बगल में स्क्रॉल करें', shelf: 'पाँचों रिपोर्ट देखने के लिए स्वाइप करें',
    gt: 'मास्टर रिपोर्ट', gtName: 'ग्रैंड टोटल रिपोर्ट', gtHead: 'पूरे घर की एक खरीद-सूची',
    gtDesc: 'एक ही घर की जो रिपोर्टें आप ले चुके हैं, उन्हें एक सूची में जोड़ती है। सीमेंट, रेत और पत्थर चरणों में जुड़ते हैं और हर चरण की अपनी चीज़ें उसी क्रम में रहती हैं जिसमें घर बनता है।',
    gtFree: `एक ऐड-ऑन · ${PRICE.grandtotal} · आपकी ली हुई रिपोर्टों पर · कम्प्लीट हाउस पैक में शामिल`, gtCta: 'मेरी ग्रैंड टोटल रिपोर्ट बनाइए', phase: 'चरण',
    get: 'आपको मात्राएँ और PDF मिलता है।',
  },
} as const

const DESC: Record<string, Bi> = {
  vastu: { en: 'See how the old Vastu texts and today’s teachers read each door and room of your plan, and where each rule comes from. Free, with a PDF report.', hi: 'देखिए पुराने वास्तु ग्रंथ और आज के जानकार आपके नक्शे के हर दरवाज़े और कमरे को कैसे पढ़ते हैं, और हर नियम कहाँ से आया है। मुफ़्त, PDF रिपोर्ट के साथ।' },
  struct: { en: 'How much concrete, steel and cement your frame needs, member by member and bar size by bar size.', hi: 'आपके ढाँचे को कितना कंक्रीट, स्टील और सीमेंट चाहिए, हिस्सा-दर-हिस्सा और सरिया साइज़ के हिसाब से।' },
  mason: { en: 'How many bricks or blocks, and how much cement and sand for your walls and plaster. Covers brick, AAC and hollow blocks.', hi: 'कितनी ईंटें या ब्लॉक, और दीवारों व प्लास्टर के लिए कितना सीमेंट और रेत। ईंट, AAC और खोखले ब्लॉक शामिल।' },
  elec: { en: 'Every circuit planned, with the metres of wire, the points and switches and the distribution board you will need.', hi: 'हर सर्किट की योजना, साथ में तार के मीटर, पॉइंट, स्विच और डिस्ट्रीब्यूशन बोर्ड जो आपको चाहिए।' },
  plumb: { en: 'Metres of pipe by size, the fittings and fixtures, and the right tank size for your home.', hi: 'साइज़ के हिसाब से पाइप के मीटर, फ़िटिंग और फ़िक्सचर, और आपके घर के लिए सही टंकी का आकार।' },
  int: { en: 'Pick a finish level and see how much flooring, tile, paint and false ceiling your rooms need.', hi: 'फ़िनिश का स्तर चुनिए और देखिए आपके कमरों को कितना फ़र्श, टाइल, पेंट और फ़ॉल्स सीलिंग चाहिए।' },
}

const HEADER = 68

export default function Disciplines() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
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
        <h2 className="ns-h2 ns-dis__h" id="ns-dis-h">{c.h}</h2>
        <p className="ns-lede ns-dis__lede">{c.lede}</p>

        {/* the free VastuPro lives apart from the five paid reports */}
        <p className="ns-label ns-dis__suite">{c.suite1}</p>
        <article className="ns-plate ns-plate--paper ns-dis__vastu" style={{ ['--tc' as string]: 'var(--ns-t-vastu)' }}>
          <div className="ns-dis__vimg">
            <Image src={vastu.plate} alt={vastu.plateAlt} width={1100} height={1100} sizes="(max-width: 900px) 70vw, 320px" />
          </div>
          <div className="ns-dis__vbody">
            <span className="ns-mono ns-dis__ph">{c.free}</span>
            <h3 className="ns-h3">{vastu.name}</h3>
            <p className="ns-dis__desc"><strong>{pick(TOOL_PLAIN.vastu, loc)}</strong><br />{pick(DESC.vastu, loc)}</p>
            <CutLink href={vastu.href} className="ns-btn ns-btn--paper ns-btn--sm" data-snap>{c.start}</CutLink>
          </div>
        </article>

        <p className="ns-label ns-dis__suite">{c.suite2}</p>
        <p className="ns-dis__sub2">{c.sub2} · <span className="ns-mono">{c.from}</span></p>
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
                <p className="ns-dis__desc"><strong>{pick(TOOL_PLAIN[tool.key], loc)}</strong><br />{pick(DESC[tool.key], loc)}</p>
                <CutLink href={tool.href} className="ns-btn ns-btn--sm" aria-label={`${c.open} ${tool.name}`} data-snap>{c.open} <Arrow /></CutLink>
              </article>
            ))}
            <article className="ns-plate ns-plate--paper ns-dis__card ns-dis__card--gt" style={{ ['--tc' as string]: 'var(--ns-laterite)' }}>
              <header className="ns-dis__top">
                <span className="ns-mono ns-dis__ph">{c.gt}</span>
                <span className="ns-mono ns-dis__price">5 + 1</span>
              </header>
              <div className="ns-dis__gt">
                {paid.map(t2 => <i key={t2.key} style={{ background: `var(${t2.accent})` }} />)}
              </div>
              <h3 className="ns-h3">{c.gtName}</h3>
              <p className="ns-dis__desc"><strong>{c.gtHead}</strong><br />{c.gtDesc}</p>
              <p className="ns-dis__gtfree ns-mono">{c.gtFree}</p>
              <CutLink href="/tools/grand-total" className="ns-btn ns-btn--ink ns-btn--sm" data-snap>{c.gtCta} →</CutLink>
            </article>
          </div>
          <div className="ns-dis__prog" aria-hidden="true">
            <span className="ns-mono">{String(idx + 1).padStart(2, '0')} {c.progress} {String(total).padStart(2, '0')}</span>
            <span className="ns-dis__bar"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></span>
          </div>
        </div>
      </div>
      <Pour tone="stage" v={3} />
    </section>
  )
}

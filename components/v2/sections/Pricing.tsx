'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

const COPY = {
  en: {
    h: 'Pay per report. Start free.',
    free: {
      tag: 'Start here', name: 'VastuPro', sub: 'Check your plan against Vastu', price: 'FREE', per: 'always free · no payment needed',
      f: ['Vastu check of your plan', '33 room types', '16-zone Vastu compass', 'A score with simple fixes', 'Full PDF report', 'Earthquake-safety warnings'],
      cta: 'Start free',
    },
    one: {
      tag: 'One report at a time', name: 'Single report', sub: 'A quantities report for one stage of your build', price: 'from ₹499',
      per: 'Electrical or plumbing ₹499 · Masonry ₹699 · Interior ₹899 · Structure ₹999',
      f: ['Exact quantities of every material', 'Item by item, member by member', 'Checked against Indian Standards', 'A most-likely figure with an honest range', 'Check your contractor’s quantities', 'A PDF report you can hand over'],
      cta: 'Start with the structure report',
    },
    all: {
      tag: 'All of them together', name: 'Grand Total Report',
      sub: 'Already bought reports for the same house? The Grand Total adds them into one buying list. Cement, sand and stone are added across the stages, and anything two reports count is counted once.',
      price: '₹999', per: 'an add-on to the reports you have bought', cta: 'Make my Grand Total Report',
    },
  },
  hi: {
    h: 'हर रिपोर्ट का अलग दाम। शुरुआत मुफ़्त।',
    free: {
      tag: 'यहाँ से शुरू कीजिए', name: 'VastuPro', sub: 'अपने नक्शे को वास्तु पर जाँचिए', price: 'मुफ़्त', per: 'हमेशा मुफ़्त · कोई भुगतान नहीं',
      f: ['आपके नक्शे की वास्तु जाँच', '33 तरह के कमरे', '16-ज़ोन वास्तु कंपास', 'स्कोर और आसान उपाय', 'पूरी PDF रिपोर्ट', 'भूकंप-सुरक्षा की चेतावनियाँ'],
      cta: 'मुफ़्त शुरू करें',
    },
    one: {
      tag: 'एक बार में एक रिपोर्ट', name: 'सिंगल रिपोर्ट', sub: 'आपके निर्माण के एक चरण की मात्रा-रिपोर्ट', price: '₹499 से',
      per: 'इलेक्ट्रिकल या प्लंबिंग ₹499 · मेसनरी ₹699 · इंटीरियर ₹899 · स्ट्रक्चर ₹999',
      f: ['हर सामग्री की सटीक मात्रा', 'चीज़-दर-चीज़, हिस्सा-दर-हिस्सा', 'भारतीय मानकों से जाँचा हुआ', 'सबसे संभावित आँकड़ा, ईमानदार दायरे के साथ', 'ठेकेदार की मात्राएँ जाँचिए', 'हाथ में देने लायक PDF रिपोर्ट'],
      cta: 'स्ट्रक्चर रिपोर्ट से शुरू करें',
    },
    all: {
      tag: 'सब एक साथ', name: 'ग्रैंड टोटल रिपोर्ट',
      sub: 'एक ही घर की रिपोर्टें पहले ले चुके हैं? ग्रैंड टोटल उन्हें एक खरीद-सूची में जोड़ देती है। सीमेंट, रेत और पत्थर चरणों में जुड़ते हैं, और जो चीज़ दो रिपोर्टें गिनती हैं वह एक ही बार गिनी जाती है।',
      price: '₹999', per: 'आपकी ली हुई रिपोर्टों पर एक ऐड-ऑन', cta: 'मेरी ग्रैंड टोटल रिपोर्ट बनाइए',
    },
  },
} as const

/** Three price cards. Prices carried over from the live page; the words are plain. */
export default function Pricing() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-prc" id="pricing" aria-labelledby="ns-prc-h">
      <div className="ns-wrap" ref={ref}>
        <h2 className="ns-h2 ns-rise" id="ns-prc-h">{c.h}</h2>
        <div className="ns-prc__grid">
          <article className="ns-plate ns-prc__card ns-rise" style={{ ['--d' as string]: '.1s', ['--tc' as string]: 'var(--ns-t-vastu)' }}>
            <p className="ns-prc__phase ns-mono">{c.free.tag}</p>
            <h3 className="ns-prc__name">{c.free.name}</h3>
            <p className="ns-prc__sub">{c.free.sub}</p>
            <p className="ns-prc__price"><span>{c.free.price}</span><em className="ns-mono">{c.free.per}</em></p>
            <ul>{c.free.f.map(x => <li key={x}>{x}</li>)}</ul>
            <Link href="/tools/vastu-pro" className="ns-btn ns-btn--paper" data-snap>{c.free.cta}<Arrow /></Link>
          </article>

          <article className="ns-plate ns-prc__card ns-prc__card--main ns-tape-corner ns-rise" style={{ ['--d' as string]: '.2s', ['--tc' as string]: 'var(--ns-laterite)' }}>
            <p className="ns-prc__phase ns-mono">{c.one.tag}</p>
            <h3 className="ns-prc__name">{c.one.name}</h3>
            <p className="ns-prc__sub">{c.one.sub}</p>
            <p className="ns-prc__price"><span>{c.one.price}</span></p>
            <p className="ns-prc__sub2 ns-mono">{c.one.per}</p>
            <ul>{c.one.f.map(x => <li key={x}>{x}</li>)}</ul>
            <Link href="/tools/structopro" className="ns-btn" data-snap>{c.one.cta}<Arrow /></Link>
          </article>

          <article className="ns-plate ns-prc__card ns-prc__card--gt ns-rise" style={{ ['--d' as string]: '.3s', ['--tc' as string]: 'var(--ns-verdigris)' }}>
            <p className="ns-prc__phase ns-mono">{c.all.tag}</p>
            <h3 className="ns-prc__name">{c.all.name}</h3>
            <p className="ns-prc__sub">{c.all.sub}</p>
            <p className="ns-prc__price"><span>{c.all.price}</span><em className="ns-mono">{c.all.per}</em></p>
            <Link href="/tools/grand-total" className="ns-btn ns-btn--paper" data-snap>{c.all.cta}<Arrow /></Link>
          </article>
        </div>
      </div>
    </section>
  )
}

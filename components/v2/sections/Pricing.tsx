'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { Arrow } from '../Icons'
import { PRICE } from '@/lib/tool-pricing'
import '@/styles/v2/closing.css'

const COPY = {
  en: {
    h: 'Pay per report. Start free.',
    lakh: 'On a house costing ₹30–80 lakh, a single wrong line in a quote (10 extra bags of cement, or 100 kg of extra steel) usually costs more than the report.',
    pack: {
      tag: 'Best value', name: 'Complete House Pack', price: PRICE.pack, per: 'one purchase · one house',
      sub: 'All five quantity reports for one house: structure, masonry, electrical, plumbing and interior, plus the Grand Total buying list.',
      save: `Bought one by one: ${PRICE.packSeparate}. You save ${PRICE.packSavings}.`,
      f: ['StructurePro: the RCC frame', 'MasonryPro: walls, mortar and plaster', 'ElectricalPro: points, wire and earthing', 'PlumbingPro: pipes, tanks and drains', 'InteriorPro: finishes, doors and windows', 'Grand Total: one buying list for the whole house'],
      cta: 'Get the Complete House Pack',
    },
    free: {
      tag: 'Start here', name: 'VastuPro', sub: 'Check your plan against Vastu', price: 'FREE', per: 'always free · no payment needed',
      f: ['Vastu reading of your plan', '24 kinds of room', '16-zone compass, 32 door positions', 'Every rule traced to its source', 'Simple fixes where a rule is raised', 'Full PDF with the working and sources'],
      cta: 'Start free',
    },
    one: {
      tag: 'One report at a time', name: 'Single report', sub: 'A quantities report for one stage of your build', price: `from ${PRICE.from}`,
      per: `Electrical or plumbing ${PRICE.electropro} · Masonry ${PRICE.masonpro} · Interior ${PRICE.interiorpro} · Structure ${PRICE.structopro}`,
      f: ['Exact quantities of every material', 'Item by item, member by member', 'Checked against Indian Standards', 'A most-likely figure with an honest range', 'Check your contractor’s quantities', 'A PDF report you can hand over'],
      cta: 'Start with the structure report',
    },
    all: {
      tag: 'All of them together', name: 'Grand Total Report',
      sub: 'Already bought reports for the same house? The Grand Total adds them into one buying list. Cement, sand and stone are added across the stages, and anything two reports count is counted once.',
      price: PRICE.grandtotal, per: 'an add-on to the reports you have bought', inc: 'Included in the Complete House Pack', cta: 'Make my Grand Total Report',
    },
  },
  hi: {
    h: 'हर रिपोर्ट का अलग दाम। शुरुआत मुफ़्त।',
    lakh: '₹30–80 लाख के घर में, कोटेशन की एक भी ग़लत लाइन (10 बोरी सीमेंट ज़्यादा, या 100 किलो स्टील ज़्यादा) आमतौर पर रिपोर्ट की क़ीमत से ज़्यादा का नुकसान करती है।',
    pack: {
      tag: 'सबसे किफ़ायती', name: 'कम्प्लीट हाउस पैक', price: PRICE.pack, per: 'एक खरीद · एक घर',
      sub: 'एक घर की पाँचों मात्रा रिपोर्टें: स्ट्रक्चर, मेसनरी, इलेक्ट्रिकल, प्लंबिंग और इंटीरियर, साथ में ग्रैंड टोटल खरीद-सूची।',
      save: `एक-एक करके खरीदने पर: ${PRICE.packSeparate}। आपकी बचत: ${PRICE.packSavings}।`,
      f: ['स्ट्रक्चरप्रो: RCC ढाँचा', 'मेसनरीप्रो: दीवारें, मसाला और प्लास्टर', 'इलेक्ट्रिकलप्रो: पॉइंट, तार और अर्थिंग', 'प्लंबिंगप्रो: पाइप, टंकी और नालियाँ', 'इंटीरियरप्रो: फ़िनिशिंग, दरवाज़े और खिड़कियाँ', 'ग्रैंड टोटल: पूरे घर की एक खरीद-सूची'],
      cta: 'कम्प्लीट हाउस पैक लीजिए',
    },
    free: {
      tag: 'यहाँ से शुरू कीजिए', name: 'VastuPro', sub: 'अपने नक्शे को वास्तु पर जाँचिए', price: 'मुफ़्त', per: 'हमेशा मुफ़्त · कोई भुगतान नहीं',
      f: ['आपके नक्शे की वास्तु रीडिंग', '24 तरह के कमरे', '16-ज़ोन कंपास, दरवाज़े की 32 स्थितियाँ', 'हर नियम का स्रोत बताया गया', 'जहाँ नियम उठे, वहाँ आसान उपाय', 'काम और स्रोतों के साथ पूरी PDF'],
      cta: 'मुफ़्त शुरू करें',
    },
    one: {
      tag: 'एक बार में एक रिपोर्ट', name: 'सिंगल रिपोर्ट', sub: 'आपके निर्माण के एक चरण की मात्रा-रिपोर्ट', price: `${PRICE.from} से`,
      per: `इलेक्ट्रिकल या प्लंबिंग ${PRICE.electropro} · मेसनरी ${PRICE.masonpro} · इंटीरियर ${PRICE.interiorpro} · स्ट्रक्चर ${PRICE.structopro}`,
      f: ['हर सामग्री की सटीक मात्रा', 'चीज़-दर-चीज़, हिस्सा-दर-हिस्सा', 'भारतीय मानकों से जाँचा हुआ', 'सबसे संभावित आँकड़ा, ईमानदार दायरे के साथ', 'ठेकेदार की मात्राएँ जाँचिए', 'हाथ में देने लायक PDF रिपोर्ट'],
      cta: 'स्ट्रक्चर रिपोर्ट से शुरू करें',
    },
    all: {
      tag: 'सब एक साथ', name: 'ग्रैंड टोटल रिपोर्ट',
      sub: 'एक ही घर की रिपोर्टें पहले ले चुके हैं? ग्रैंड टोटल उन्हें एक खरीद-सूची में जोड़ देती है। सीमेंट, रेत और पत्थर चरणों में जुड़ते हैं, और जो चीज़ दो रिपोर्टें गिनती हैं वह एक ही बार गिनी जाती है।',
      price: PRICE.grandtotal, per: 'आपकी ली हुई रिपोर्टों पर एक ऐड-ऑन', inc: 'कम्प्लीट हाउस पैक में शामिल', cta: 'मेरी ग्रैंड टोटल रिपोर्ट बनाइए',
    },
  },
} as const

/** The Complete House Pack (best value), then three price cards. Every price is read from lib/tool-pricing.ts. */
export default function Pricing() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const c = COPY[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-prc" id="pricing" aria-labelledby="ns-prc-h">
      <div className="ns-wrap" ref={ref}>
        <h2 className="ns-h2 ns-rise" id="ns-prc-h">{c.h}</h2>
        <p className="ns-prc__lakh ns-rise">{c.lakh}</p>

        <article className="ns-plate ns-prc__pack ns-tape-corner ns-rise" style={{ ['--tc' as string]: 'var(--ns-laterite)' }} aria-labelledby="ns-prc-pack-h">
          <p className="ns-prc__stamp ns-mono">{c.pack.tag}</p>
          <div className="ns-prc__packL">
            <h3 className="ns-prc__name" id="ns-prc-pack-h">{c.pack.name}</h3>
            <p className="ns-prc__price"><span>{c.pack.price}</span><em className="ns-mono">{c.pack.per}</em></p>
            <p className="ns-prc__sub">{c.pack.sub}</p>
            <p className="ns-prc__save">{c.pack.save}</p>
          </div>
          <div className="ns-prc__packR">
            <ul>{c.pack.f.map(x => <li key={x}>{x}</li>)}</ul>
            <Link href="/tools/complete-house-pack" className="ns-btn" data-snap>{c.pack.cta}<Arrow /></Link>
          </div>
        </article>

        <div className="ns-prc__grid">
          <article className="ns-plate ns-prc__card ns-rise" style={{ ['--d' as string]: '.1s', ['--tc' as string]: 'var(--ns-t-vastu)' }}>
            <p className="ns-prc__phase ns-mono">{c.free.tag}</p>
            <h3 className="ns-prc__name">{c.free.name}</h3>
            <p className="ns-prc__sub">{c.free.sub}</p>
            <p className="ns-prc__price"><span>{c.free.price}</span><em className="ns-mono">{c.free.per}</em></p>
            <ul>{c.free.f.map(x => <li key={x}>{x}</li>)}</ul>
            <Link href="/tools/vastu-pro" className="ns-btn ns-btn--paper" data-snap>{c.free.cta}<Arrow /></Link>
          </article>

          <article className="ns-plate ns-prc__card ns-rise" style={{ ['--d' as string]: '.2s', ['--tc' as string]: 'var(--ns-laterite)' }}>
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
            <p className="ns-prc__inc">{c.all.inc}</p>
            <Link href="/tools/grand-total" className="ns-btn ns-btn--paper" data-snap>{c.all.cta}<Arrow /></Link>
          </article>
        </div>
      </div>
    </section>
  )
}

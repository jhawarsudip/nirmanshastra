'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { IS_CODES } from '@/lib/v2/content'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

/** Twenty-five codes as rubber stamps. Press one to stamp it. */
export default function IsCodes() {
  const t = useTranslations('isCodes')
  const hi = useLocale() === 'hi'
  const [on, setOn] = useState<Set<string>>(new Set())
  const { ref } = useReveal<HTMLDivElement>()
  const flip = (c: string) => setOn(s => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n })

  return (
    <section className="ns-section ns-stage ns-isc" id="is-codes" aria-labelledby="ns-isc-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{t('dimLabel')}</p>
        <h2 className="ns-h2 ns-rise" id="ns-isc-h" style={{ ['--d' as string]: '.05s' }}>{t('title')}</h2>
        <ul className="ns-isc__grid">
          {IS_CODES.map((c, i) => (
            <li key={c} className="ns-rise" style={{ ['--d' as string]: `${Math.min(i, 16) * 0.03 + 0.1}s` }}>
              <button type="button" className="ns-isc__chip ns-mono" aria-pressed={on.has(c)} onClick={() => flip(c)} data-snap>{c}</button>
            </li>
          ))}
        </ul>
        <div className="ns-isc__foot">
          <span className="ns-mono ns-isc__count" aria-live="polite">{hi ? 'ठप्पा लगे' : 'Stamped'} · {on.size} / {IS_CODES.length}</span>
          <Link href="/is-codes-used" className="ns-link ns-isc__all">{hi ? 'हर क्लॉज़ देखें' : 'See every clause'} <Arrow /></Link>
        </div>
        <p className="ns-isc__info">
          {t('infoText')} <b>{t('infoM20')}</b> ({hi ? 'न कि' : 'not'} <s>{t('infoM20Not')}</s>). {t('infoDry')} <b className="ns-mono">{t('infoDryVal')}</b>. {t('infoDryMortar')} <b className="ns-mono">{t('infoDryMortarVal')}</b>.
        </p>
      </div>
    </section>
  )
}

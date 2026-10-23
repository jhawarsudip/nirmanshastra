'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useReveal } from '@/lib/v2/store'
import { Arrow } from '../Icons'
import '@/styles/v2/closing.css'

const F = [0, 1, 2, 3, 4, 5] as const

/** Three price plates, set like drawing-office rate cards. Prices carried over from the live page. */
export default function Pricing() {
  const t = useTranslations('pricing')
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-prc" id="pricing" aria-labelledby="ns-prc-h">
      <div className="ns-wrap" ref={ref}>
        <h2 className="ns-h2 ns-rise" id="ns-prc-h">{t('sectionTitle')}</h2>
        <div className="ns-prc__grid">
          <article className="ns-plate ns-prc__card ns-rise" style={{ ['--d' as string]: '.1s', ['--tc' as string]: 'var(--ns-t-vastu)' }}>
            <p className="ns-prc__phase ns-mono">{t('vastuPhase')}</p>
            <h3 className="ns-prc__name">{t('vastuName')}</h3>
            <p className="ns-prc__sub">{t('vastuSub')}</p>
            <p className="ns-prc__price"><span>FREE</span><em className="ns-mono">{t('vastuFreePer')}</em></p>
            <ul>{F.map(i => <li key={i}>{t(`vastuF${i}` as 'vastuF0')}</li>)}</ul>
            <Link href="/tools/vastu-pro" className="ns-btn ns-btn--paper" data-snap>{t('vastuCta').replace(/\s*→\s*$/, '')}<Arrow /></Link>
          </article>

          <article className="ns-plate ns-prc__card ns-prc__card--main ns-tape-corner ns-rise" style={{ ['--d' as string]: '.2s', ['--tc' as string]: 'var(--ns-laterite)' }}>
            <p className="ns-prc__phase ns-mono">{t('singlePhase')}</p>
            <h3 className="ns-prc__name">{t('singleName')}</h3>
            <p className="ns-prc__sub">{t('singleSub')}</p>
            <p className="ns-prc__price"><span>{t('singleFrom')}</span></p>
            <p className="ns-prc__sub2 ns-mono">{t('singleSub2')}</p>
            <ul>{F.map(i => <li key={i}>{t(`singleF${i}` as 'singleF0')}</li>)}</ul>
            <Link href="/tools/structopro" className="ns-btn" data-snap>{t('singleCta').replace(/\s*→\s*$/, '')}<Arrow /></Link>
          </article>

          <article className="ns-plate ns-prc__card ns-prc__card--gt ns-rise" style={{ ['--d' as string]: '.3s', ['--tc' as string]: 'var(--ns-verdigris)' }}>
            <p className="ns-prc__phase ns-mono">{t('gtLabel')} · {t('gtPhase')}</p>
            <h3 className="ns-prc__name">{t('gtName')}</h3>
            <p className="ns-prc__sub">{t('gtDesc')}</p>
            <p className="ns-prc__price"><span>₹999</span><em className="ns-mono">{t('gtFree')}</em></p>
            <Link href="/tools/grand-total" className="ns-btn ns-btn--paper" data-snap>{t('gtCta').replace(/\s*→\s*$/, '')}<Arrow /></Link>
          </article>
        </div>
      </div>
    </section>
  )
}

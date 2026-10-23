'use client'

import { useTranslations } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import '@/styles/v2/closing.css'

const ROWS = [0, 1, 2, 3, 4, 5, 6, 7] as const

/** The comparison, set as a bill of quantities: the left column is what you get, the right is what you pay for. */
export default function Compare() {
  const t = useTranslations('comparison')
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-section--alt ns-cmp" id="compare" aria-labelledby="ns-cmp-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{t('dimLabel')}</p>
        <h2 className="ns-h2 ns-rise" id="ns-cmp-h" style={{ ['--d' as string]: '.05s' }}>{t('sectionTitle')}</h2>
        <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{t('intro')}</p>

        <div className="ns-plate ns-cmp__sheet ns-rise" style={{ ['--d' as string]: '.18s' }} role="table" aria-label={t('sectionTitle')}>
          <div className="ns-cmp__row ns-cmp__row--h ns-mono" role="row">
            <span role="columnheader">{t('colFeature')}</span>
            <span role="columnheader">{t('colFree')}</span>
            <span role="columnheader" className="ns-cmp__ns">{t('colNS')}</span>
          </div>
          {ROWS.map(i => (
            <div key={i} className="ns-cmp__row" role="row" tabIndex={0} style={{ ['--i' as string]: i }}>
              <span role="rowheader" className="ns-cmp__f">{t(`${i}feature` as '0feature')}</span>
              <span role="cell" className="ns-cmp__no"><i aria-hidden="true">✕</i>{t(`${i}free` as '0free')}</span>
              <span role="cell" className="ns-cmp__ns"><i aria-hidden="true">✓</i>{t(`${i}ns` as '0ns')}</span>
            </div>
          ))}
        </div>
        <p className="ns-cmp__foot ns-rise">{t('footnote')}</p>
      </div>
    </section>
  )
}

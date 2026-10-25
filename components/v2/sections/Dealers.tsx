'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import { DEALER_QUERIES } from '@/lib/v2/content'
import { STATE_CITIES, INDIAN_STATES_LIST } from '@/lib/state-cities'
import '@/styles/v2/closing.css'
import Pour from '../Pour'

const CATS = ['cat0', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat7'] as const

/** Opens a Google Maps search; nothing is stored or listed by us. Behaviour carried over from the live page. */
export default function Dealers() {
  const t = useTranslations('dealers')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [cat, setCat] = useState('')
  const { ref } = useReveal<HTMLDivElement>()
  const ready = Boolean(city && cat !== '')

  const go = () => {
    if (!ready) return
    const place = area.trim() ? `${area.trim()}, ${city}` : city
    const q = encodeURIComponent(`${DEALER_QUERIES[Number(cat)]} ${place}`)
    window.open(`https://www.google.com/maps/search/${q}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="ns-section ns-dlr" id="dealers" aria-labelledby="ns-dlr-h">
      <div className="ns-wrap" ref={ref}>
        <div className="ns-dlr__grid">
          <div>
            <p className="ns-eyebrow ns-rise">{t('eyebrow')}</p>
            <h2 className="ns-h2 ns-rise" id="ns-dlr-h" style={{ ['--d' as string]: '.05s' }}>
              {t('dealersTitlePrefix')} <span className="ns-accent">{t('dealersTitleHighlight')}</span>
            </h2>
            <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{t('desc')}</p>
            <svg className={`ns-dlr__map${ready ? ' is-set' : ''}`} viewBox="0 0 320 170" aria-hidden="true">
              <rect x="1" y="1" width="318" height="168" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
              <g stroke="var(--ns-hair-strong)" strokeWidth="1" fill="none">
                {[40, 80, 120].map(y => <line key={y} x1="1" x2="319" y1={y} y2={y} />)}
                {[64, 128, 192, 256].map(x => <line key={x} x1={x} x2={x} y1="1" y2="169" />)}
              </g>
              <path d="M1 128 C70 100 120 150 190 96 S290 60 319 40" fill="none" stroke="var(--ns-verdigris)" strokeWidth="5" opacity=".5" />
              <path d="M40 169 V110 H150 V60 H260 V1" fill="none" stroke="var(--ns-ink)" strokeWidth="2.4" strokeDasharray="10 6" />
              <g transform="translate(190 96)">
                <g className="ns-dlr__pin">
                  <path d="M0 0 C-14 -20 -16 -34 0 -42 C16 -34 14 -20 0 0Z" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="2" />
                  <circle cy="-26" r="5" fill="var(--ns-paper)" />
                </g>
              </g>
              <ellipse className="ns-dlr__sh" cx="190" cy="98" rx="11" ry="3.5" fill="var(--ns-ink)" opacity=".3" />
            </svg>
          </div>

          <form className="ns-plate ns-dlr__form ns-rise" style={{ ['--d' as string]: '.16s' }} onSubmit={e => { e.preventDefault(); go() }}>
            <label className="ns-field"><span>{t('labelState')}</span>
              <select className="ns-select" value={state} onChange={e => { setState(e.target.value); setCity('') }}>
                <option value="">{t('stateDefault')}</option>
                {INDIAN_STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="ns-field"><span>{t('labelCity')}</span>
              <select className="ns-select" value={city} disabled={!state} onChange={e => setCity(e.target.value)}>
                <option value="">{t('cityDefault')}</option>
                {(STATE_CITIES[state] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="ns-field"><span>{t('labelLocality')} <small>({t('localityOptional')})</small></span>
              <input className="ns-input" value={area} placeholder={t('localityPlaceholder')} onChange={e => setArea(e.target.value.slice(0, 60))} />
            </label>
            <label className="ns-field"><span>{t('labelCategory')}</span>
              <select className="ns-select" value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">{t('categoryDefault')}</option>
                {CATS.map((k, i) => <option key={k} value={i}>{t(k)}</option>)}
              </select>
            </label>
            <button type="submit" className="ns-btn" disabled={!ready} data-snap>{t('cta').replace(/\s*→\s*$/, '')}</button>
            <p className="ns-sc__note">{t('disclaimer')}</p>
          </form>
        </div>
      </div>
      <Pour tone="bg" v={10} />
    </section>
  )
}

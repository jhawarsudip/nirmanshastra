'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import Sticker from '../Sticker'
import '@/styles/v2/closing.css'

/** Four small drafted marks, one per step. Each answers hover / focus. */
function Mark({ i }: { i: number }) {
  const p = { viewBox: '0 0 120 84', className: 'ns-how__mark', 'aria-hidden': true } as const
  if (i === 0) return (
    <svg {...p}>
      <rect x="22" y="6" width="76" height="72" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      {[20, 38, 56].map(y => <g key={y}><rect x="32" y={y} width="10" height="10" fill="none" stroke="var(--ns-ink)" strokeWidth="1.6" /><line x1="50" x2="88" y1={y + 5} y2={y + 5} stroke="var(--ns-ink)" strokeWidth="2" /></g>)}
      <path className="ns-how__tick" d="M34 25 l3 3 l6 -8 M34 43 l3 3 l6 -8" fill="none" stroke="var(--ns-laterite)" strokeWidth="2.6" />
    </svg>
  )
  if (i === 1) return (
    <svg {...p}>
      <path d="M60 6 L104 22 V46 C104 62 84 74 60 80 C36 74 16 62 16 46 V22 Z" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      <text x="60" y="38" textAnchor="middle" className="ns-how__t">IS 456</text>
      <path className="ns-how__tick" d="M44 52 l10 10 l22 -22" fill="none" stroke="var(--ns-verdigris)" strokeWidth="4" />
    </svg>
  )
  if (i === 2) return (
    <svg {...p}>
      <path d="M10 42 L34 14 H100 V70 H34 Z" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      <circle cx="30" cy="42" r="4" fill="none" stroke="var(--ns-ink)" strokeWidth="1.8" />
      <text x="66" y="50" textAnchor="middle" className="ns-how__big">₹</text>
      <g className="ns-how__slide"><rect x="44" y="60" width="44" height="3" fill="var(--ns-ink)" /><rect x="56" y="55" width="8" height="13" fill="var(--ns-laterite)" stroke="var(--ns-ink)" strokeWidth="1.4" /></g>
    </svg>
  )
  return (
    <svg {...p}>
      <rect x="18" y="8" width="84" height="68" fill="var(--ns-paper)" stroke="var(--ns-ink)" strokeWidth="2" />
      {[24, 38, 52].map((y, k) => <g key={y}><line x1="28" x2="62" y1={y} y2={y} stroke="var(--ns-ink)" strokeWidth="2" /><rect className="ns-how__bar" x="68" y={y - 5} width={[22, 14, 28][k]} height="9" fill="var(--ns-laterite)" style={{ ['--k' as string]: k }} /></g>)}
      <line x1="26" x2="94" y1="64" y2="64" stroke="var(--ns-ink)" strokeWidth="2.4" /><line x1="26" x2="94" y1="68" y2="68" stroke="var(--ns-ink)" strokeWidth="1" />
    </svg>
  )
}

export default function HowItWorks() {
  const t = useTranslations('howItWorks')
  const hi = useLocale() === 'hi'
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-how" id="how-it-works" aria-labelledby="ns-how-h">
      <div className="ns-wrap" ref={ref}>
        <p className="ns-eyebrow ns-rise">{hi ? 'तरीका' : 'The method'}</p>
        <h2 className="ns-h2 ns-rise" id="ns-how-h" style={{ ['--d' as string]: '.05s' }}>{t('sectionTitle')}</h2>
        <ol className="ns-how__list">
          {[0, 1, 2, 3].map(i => (
            <li key={i} className="ns-plate ns-how__step ns-rise" tabIndex={0} data-snap style={{ ['--d' as string]: `${0.1 * i + 0.12}s` }}>
              <span className="ns-how__no ns-mono" aria-hidden="true">0{i + 1}</span>
              <Mark i={i} />
              <h3 className="ns-how__h">{t(`${i}heading` as '0heading')}</h3>
              <p>{t(`${i}body` as '0body')}</p>
            </li>
          ))}
        </ol>
        <Sticker src="/v2/cutouts/o09-rolled-drawings.webp" w={820} h={535} width="clamp(62px, 13vw, 200px)" rot={-8} pos={{ right: '3%', top: '0px' }} />
        <Sticker src="/v2/cutouts/o05-auto-level-tripod.webp" w={519} h={820} width="clamp(48px, 6.4vw, 96px)" rot={6} pos={{ right: '14%', bottom: '16px' }} />
        <Sticker src="/v2/cutouts/o08-binding-wire-pliers.webp" w={820} h={496} width="clamp(80px, 10vw, 150px)" rot={-12} pos={{ left: '2%', bottom: '14px' }} />
      </div>
    </section>
  )
}

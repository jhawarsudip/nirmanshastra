'use client'

import { useLocale } from 'next-intl'
import { useReveal } from '@/lib/v2/store'
import Sticker from '../Sticker'
import RebarLab from '../lab/RebarLab'
import BrickLab from '../lab/BrickLab'
import MixLab from '../lab/MixLab'
import '@/styles/v2/labs.css'

const L = {
  en: { eye: 'The site lab', h: 'Touch the numbers', p: 'Three benches, three code lookups. Move a control and the quantities follow — the same locked IS values the calculators use.' },
  hi: { eye: 'साइट लैब', h: 'संख्याओं को छूकर देखिए', p: 'तीन बेंच, तीन कोड-लुकअप। कोई कंट्रोल हिलाइए, मात्राएँ साथ बदलती हैं — वही IS मान जो कैलकुलेटर इस्तेमाल करते हैं।' },
} as const

export default function Lab() {
  const loc = useLocale() === 'hi' ? 'hi' : 'en'
  const t = L[loc]
  const { ref } = useReveal<HTMLDivElement>()
  return (
    <section className="ns-section ns-section--alt ns-lab" id="lab" aria-labelledby="ns-lab-h">
      <div className="ns-wrap" ref={ref}>
        <div className="ns-lab__top">
          <p className="ns-eyebrow ns-rise">{t.eye}</p>
          <h2 className="ns-h2 ns-rise" id="ns-lab-h" style={{ ['--d' as string]: '.05s' }}>{t.h}</h2>
          <p className="ns-lede ns-rise" style={{ ['--d' as string]: '.12s' }}>{t.p}</p>
          <Sticker src="/v2/cutouts/o04-tagari-pan.webp" w={820} h={481} width="clamp(110px, 17vw, 260px)" rot={-6} pos={{ right: '1%', top: '4%' }} />
        </div>
        <div className="ns-lab__benches">
          <div className="ns-plate ns-lab__plate"><RebarLab /></div>
          <div className="ns-plate ns-lab__plate">
            <BrickLab />
            <Sticker src="/v2/cutouts/o10-brick-and-closer.webp" w={820} h={441} width="clamp(84px, 11vw, 170px)" rot={8} pos={{ right: '14px', top: '-26px' }} />
          </div>
          <div className="ns-plate ns-lab__plate">
            <MixLab />
            <Sticker src="/v2/cutouts/o06-concrete-cubes.webp" w={820} h={474} width="clamp(84px, 11vw, 170px)" rot={-5} pos={{ right: '12px', top: '-28px' }} />
            <Sticker src="/v2/cutouts/o07-slump-cone.webp" w={535} h={820} width="clamp(48px, 6vw, 92px)" rot={9} pos={{ right: 'clamp(110px, 14vw, 210px)', top: '-30px' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

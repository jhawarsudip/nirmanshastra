'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { ToolHead, Field, Input, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  SAMPLING_BANDS,
  CUBES_PER_SAMPLE,
  EXTRA_CUBES_PER_SAMPLE,
  calculate,
} from './cube-test-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { CUBE_CONTENT } from '@/lib/seo/calc-content'

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

function bandOf(v: number, hi: boolean): string {
  if (v <= 5) return hi ? '1 से 5 m³' : '1 to 5 m³'
  if (v <= 15) return hi ? '6 से 15 m³' : '6 to 15 m³'
  if (v <= 30) return hi ? '16 से 30 m³' : '16 to 30 m³'
  if (v <= 50) return hi ? '31 से 50 m³' : '31 to 50 m³'
  return hi ? '51 m³ और उससे ऊपर' : '51 m³ and over'
}

export default function ConcreteCubeTestCalculatorPage() {
  const { hi, L } = useL()
  const [volume, setVolume] = useState('20')
  const v = Math.max(0, parseFloat(volume || '0') || 0)
  const r = useMemo(() => calculate(v), [v])
  const valid = v > 0
  const band = bandOf(r.volume, hi)
  const aboveFifty = L(SAMPLING_BANDS[4].samples, '4, और हर अतिरिक्त 50 m³ या उसके हिस्से पर 1 और')

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Concrete Cube Test Calculator', 'कंक्रीट क्यूब टेस्ट कैलकुलेटर')}
        blurb={L(
          'Count the cube samples a pour needs. Enter the volume of one grade of concrete; IS 456 gives the least number of samples, and each sample is three cubes tested at 28 days.',
          'एक ढलाई के लिए ज़रूरी क्यूब सैंपल गिनिए। एक ग्रेड के कंक्रीट का आयतन डालिए; IS 456 सैंपलों की सबसे कम संख्या देता है, और हर सैंपल तीन क्यूब का होता है, जिन्हें 28 दिन पर टेस्ट किया जाता है।',
        )}
      />
      <QuickAnswer content={CUBE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The pour', 'ढलाई')}</CalcLabel>
            <div className="ns-i-fields">
              <Field
                id="cb-vol"
                label={L('Volume of concrete of one grade (m³)', 'एक ग्रेड के कंक्रीट का आयतन (m³)')}
                wide
                hint={L(
                  'Length × width × thickness, all in metres. Count each grade of concrete on its own: M20 and M25 in the same building are counted separately.',
                  'लंबाई × चौड़ाई × मोटाई, सब मीटर में। हर ग्रेड का कंक्रीट अलग गिनिए: एक ही इमारत में M20 और M25 अलग-अलग गिने जाते हैं।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="0.5" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big
                k={L('Samples to take, at least', 'कम से कम इतने सैंपल लीजिए')}
                v={num(r.samples, 0)}
                unit={L(r.samples === 1 ? 'sample' : 'samples', 'सैंपल')}
                sub={L(
                  `${num(r.volume, 1)} m³ falls in the ${band} band of IS 456 cl 15.2.2`,
                  `${num(r.volume, 1)} m³ IS 456 cl 15.2.2 के ${band} वाले बैंड में आता है`,
                )}
              />
              <Figures
                items={[
                  { k: L('Cubes to test at 28 days', '28 दिन पर टेस्ट होने वाले क्यूब'), v: num(r.cubes28, 0), unit: L('cubes', 'क्यूब'), tone: 'ok' },
                  { k: L('With a 7-day check too', '7 दिन की जाँच के साथ'), v: num(r.cubesWithEarly, 0), unit: L('cubes', 'क्यूब') },
                ]}
              />
              <Note kind="info" title={L('At least one sample from each shift', 'हर शिफ़्ट से कम से कम एक सैंपल')} foot="IS 456:2000 cl 15.2.2">
                {L(
                  'However small the volume, take at least one sample from each shift of concreting. A ready-mixed concrete plant may agree another frequency with the buyer. Neither is added to the count above.',
                  'आयतन कितना भी छोटा हो, कंक्रीटिंग की हर शिफ़्ट से कम से कम एक सैंपल लीजिए। रेडी-मिक्स कंक्रीट प्लांट ख़रीदार के साथ सैंपल लेने की कोई और दर तय कर सकता है। इनमें से कोई भी ऊपर की गिनती में नहीं जोड़ा गया है।',
                )}
              </Note>
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Concrete of this grade', 'इस ग्रेड का कंक्रीट'), value: `${num(r.volume, 1)} m³` },
                  {
                    label: L('Samples', 'सैंपल'),
                    detail: `${band}${r.volume > 50 ? L(': 4, and 1 more for each further 50 m³ or part of it', ': 4, और हर अतिरिक्त 50 m³ या उसके हिस्से पर 1 और') : ''}`,
                    value: num(r.samples, 0),
                    tone: 'ok',
                  },
                  {
                    label: L('Cubes for the 28-day test', '28 दिन के टेस्ट के क्यूब'),
                    detail: L(`${CUBES_PER_SAMPLE} a sample (IS 456 cl 15.3)`, `प्रति सैंपल ${CUBES_PER_SAMPLE} (IS 456 cl 15.3)`),
                    value: num(r.cubes28, 0),
                  },
                  {
                    label: L('Cubes for a 7-day check', '7 दिन की जाँच के क्यूब'),
                    detail: L(`${EXTRA_CUBES_PER_SAMPLE} more a sample, your choice`, `प्रति सैंपल ${EXTRA_CUBES_PER_SAMPLE} और, आपकी मर्ज़ी`),
                    value: num(r.cubesEarly, 0),
                    tone: 'dim',
                  },
                  { label: L('Cubes in all, with the check', 'जाँच सहित कुल क्यूब'), value: num(r.cubesWithEarly, 0) },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  'The cubes are the standard 150 mm cubes of IS 516. IS 456 asks for the 28-day test; the 7-day cubes only give an early sign of how the concrete is going.',
                  'क्यूब IS 516 के मानक 150 mm के क्यूब हैं। IS 456 28 दिन का टेस्ट माँगता है; 7 दिन के क्यूब सिर्फ़ यह शुरुआती संकेत देते हैं कि कंक्रीट कैसा चल रहा है।',
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">
              {L(
                'Enter the volume of concrete to see how many samples and cubes the pour needs.',
                'ढलाई के लिए कितने सैंपल और क्यूब चाहिए, यह देखने के लिए कंक्रीट का आयतन डालिए।',
              )}
            </p>
          )
        }
      />

      <CalcCta
        kicker={L('Not sure of the volume?', 'आयतन का पक्का पता नहीं?')}
        text={L(
          'StructurePro works out the volume of concrete in every footing, column, beam and slab of your house from a few answers, so you know what each pour holds before you count the samples.',
          'StructurePro कुछ जवाबों से आपके घर की हर फुटिंग, कॉलम, बीम और स्लैब का कंक्रीट आयतन निकालता है, ताकि सैंपल गिनने से पहले आपको पता हो कि हर ढलाई में कितना कंक्रीट आता है।',
        )}
        href="/tools/structopro"
        label={L('Open StructurePro', 'StructurePro खोलिए')}
      />

      <CalcSection
        title={L('How many samples for how much concrete', 'कितने कंक्रीट के लिए कितने सैंपल')}
        sub={L('The IS 456:2000 table for each grade of concrete.', 'हर ग्रेड के कंक्रीट के लिए IS 456:2000 की तालिका।')}
      >
        <ReportTable
          head={[L('Concrete in the work (m³)', 'काम में कंक्रीट (m³)'), L('Samples', 'सैंपल'), L('Cubes at 28 days', '28 दिन पर क्यूब')]}
          labelRow
          num={[1, 2]}
          rows={[
            [L('1 to 5', '1 से 5'), '1', '3'],
            [L('6 to 15', '6 से 15'), '2', '6'],
            [L('16 to 30', '16 से 30'), '3', '9'],
            [L('31 to 50', '31 से 50'), '4', '12'],
            [L('51 to 100', '51 से 100'), '5', '15'],
            [L('101 to 150', '101 से 150'), '6', '18'],
          ]}
        />
        <p className="ns-r-tblnote">
          {L(
            `Above 50 m³ the table is ${SAMPLING_BANDS[4].samples}, so 51 m³ already needs 5 samples and 101 m³ needs 6.`,
            `50 m³ से ऊपर तालिका है ${aboveFifty}, इसलिए 51 m³ में ही 5 सैंपल लगते हैं और 101 m³ में 6।`,
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('What a sample is', 'सैंपल क्या होता है')}>
          {hi ? (
            <>
              <p>
                <strong>सैंपल</strong> मिक्सर या ट्रक से लिया गया कंक्रीट का एक हिस्सा है, जिससे क्यूब ढाले जाते हैं। IS 456:2000 का क्लॉज़ 15.3 हर सैंपल से <strong>तीन टेस्ट नमूने</strong> माँगता है, जिन्हें 28 दिन पर टेस्ट किया जाता है। तीनों एक ही बैच से ढाले जाते हैं, और सैंपल की मज़बूती उनका औसत है।
              </p>
              <p>
                कई साइटें हर सैंपल से तीन क्यूब और ढालती हैं और उन्हें 7 दिन पर तोड़ती हैं। IS 456 इस तरह की जाँच के लिए अतिरिक्त क्यूब की इजाज़त देता है पर उन्हें माँगता नहीं; 7 दिन का नतीजा सिर्फ़ जल्दी बता देता है कि कंक्रीट सही राह पर है या नहीं। इसीलिए पेज दोनों गिनतियाँ दिखाता है।
              </p>
            </>
          ) : (
            <>
              <p>
                A <strong>sample</strong> is a lot of concrete taken from the mixer or the truck, from which cubes are cast. IS 456:2000 clause 15.3 asks for <strong>three test specimens</strong> from each sample, tested at 28 days. The three are cast from the same batch, and the strength of the sample is their average.
              </p>
              <p>
                Many sites cast three more cubes from each sample and break them at 7 days. IS 456 allows extra cubes for this kind of check but does not ask for them; the 7-day result only tells you early whether the concrete is on course. That is why the page shows both counts.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Each grade, and each shift', 'हर ग्रेड, और हर शिफ़्ट')}>
          {hi ? (
            <>
              <p>
                क्लॉज़ 15.2.2 की तालिका <strong>हर ग्रेड</strong> के कंक्रीट के लिए है। M25 के कॉलम और M20 के स्लैब वाली इमारत में दोनों अलग-अलग गिने जाते हैं, हर एक अपने आयतन के हिसाब से।
              </p>
              <p>
                क्लॉज़ यह भी माँगता है कि कंक्रीटिंग की हर शिफ़्ट से कम से कम एक सैंपल लिया जाए, और रेडी-मिक्स कंक्रीट प्लांट को ख़रीदार के साथ अपनी दर तय करने देता है। लंबे दिन पर छोटी ढलाई में उसके आयतन के संकेत से ज़्यादा सैंपल लग सकते हैं।
              </p>
            </>
          ) : (
            <>
              <p>
                The table in clause 15.2.2 is for concrete <strong>of each grade</strong>. A building with M25 columns and M20 slabs counts the two separately, each against its own volume.
              </p>
              <p>
                The clause also asks that at least one sample be taken from each shift of concreting, and lets a ready-mixed concrete plant agree its own frequency with the buyer. A small pour on a long day can need more samples than its volume suggests.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Past 50 m³: or part of it', '50 m³ के बाद: या उसका हिस्सा')}>
          {hi ? (
            <p>
              51 m³ और उससे ऊपर के लिए तालिका कहती है <strong>4 सैंपल, और हर अतिरिक्त 50 m³ या उसके हिस्से के लिए एक और</strong>। यानी गिनती हर 50 m³ पर एक बढ़ती है और किसी ब्लॉक का कोई भी हिस्सा पूरा ब्लॉक गिना जाता है: 51 m³ में 5 सैंपल, 100 m³ में 5, 101 m³ में 6।
            </p>
          ) : (
            <p>
              For 51 m³ and over, the table says <strong>4 samples, plus one more for each additional 50 m³ or part thereof</strong>. So the count steps up every 50 m³ and any part of a block counts as a whole one: 51 m³ takes 5 samples, 100 m³ takes 5, 101 m³ takes 6.
            </p>
          )}
        </Prose>

        <Prose title={L('Worked example: 120 m³ of M25', 'हल किया उदाहरण: 120 m³ M25')}>
          <p>
            {L(
              '120 m³ is 70 m³ over the first 50. The further 70 m³ is one block of 50 and part of another, which is 2 more samples:',
              '120 m³ पहले 50 से 70 m³ ऊपर है। ये 70 m³ एक पूरा 50 का ब्लॉक और दूसरे का हिस्सा हैं, यानी 2 सैंपल और:',
            )}
          </p>
          <Formula>
            {L(
              '4 + 2 = 6 samples · 6 × 3 = 18 cubes at 28 days · 36 cubes with a 7-day check',
              '4 + 2 = 6 सैंपल · 6 × 3 = 28 दिन पर 18 क्यूब · 7 दिन की जाँच सहित 36 क्यूब',
            )}
          </Formula>
          <p>
            {L(
              'A 45 m³ pour of one grade falls in the 31 to 50 m³ band: 4 samples, 12 cubes at 28 days, 24 with the 7-day check.',
              'एक ग्रेड की 45 m³ की ढलाई 31 से 50 m³ के बैंड में आती है: 4 सैंपल, 28 दिन पर 12 क्यूब, 7 दिन की जाँच सहित 24।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={CUBE_CONTENT.faq} />
      <RelatedLinks path="/tools/concrete-cube-test-calculator" />

      <Chips codes={['IS 456:2000', 'IS 516', 'IS 1199']} />
      <CalcFine>
        {L(
          'For planning the sampling of a pour. The count is the least IS 456 asks for; the engineer in charge or the contract can ask for more. Cubes are made, cured and tested as IS 516 says, and the strength is judged by the acceptance rules of IS 456. Not a substitute for the quality plan of the job.',
          'ढलाई के सैंपल की योजना बनाने के लिए। यह गिनती वह सबसे कम है जो IS 456 माँगता है; प्रभारी इंजीनियर या अनुबंध ज़्यादा माँग सकता है। क्यूब IS 516 के अनुसार बनाए, क्योर किए और टेस्ट किए जाते हैं, और मज़बूती को IS 456 के स्वीकृति नियमों से परखा जाता है। यह काम की क्वालिटी प्लान की जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

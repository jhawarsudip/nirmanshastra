'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { MIX_DICT } from '@/lib/i18n/labels/calc-mix'
import { ToolHead, Field, Input, Select, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  GRADE_ORDER,
  EXPOSURE_ORDER,
  EXPOSURE_LABEL,
  NOMINAL_RATIO,
  GRADE_NOTE,
  CEMENT_CEILING,
  calculate,
  type Grade,
  type Exposure,
} from './concrete-mix-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { MIX_CONTENT } from '@/lib/seo/calc-content'

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

const EXPOSURE_SHORT: Record<Exposure, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
  very_severe: 'Very severe',
  extreme: 'Extreme',
}

const EXPOSURE_SHORT_HI: Record<Exposure, string> = {
  mild: 'हल्का',
  moderate: 'मध्यम',
  severe: 'कठोर',
  very_severe: 'बहुत कठोर',
  extreme: 'अत्यंत कठोर',
}

/** the adjective in front of "साइट" (site), which is feminine */
const EXPOSURE_SITE_HI: Record<Exposure, string> = {
  mild: 'हल्की',
  moderate: 'मध्यम',
  severe: 'कठोर',
  very_severe: 'बहुत कठोर',
  extreme: 'अत्यंत कठोर',
}

export default function ConcreteMixRatioCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(MIX_DICT)
  const [volume, setVolume] = useState('2.5')
  const [grade, setGrade] = useState<Grade>('M20')
  const [exposure, setExposure] = useState<Exposure>('mild')

  const volumeM3 = Math.max(0, parseFloat(volume || '0') || 0)
  const r = useMemo(() => calculate({ volumeM3, grade, exposure }), [volumeM3, grade, exposure])
  const valid = volumeM3 > 0
  const plain = parseFloat(grade.replace('M', '')) < 20
  const short = (e: Exposure) => (hi ? EXPOSURE_SHORT_HI : EXPOSURE_SHORT)[e]

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Concrete Mix Calculator', 'कंक्रीट मिक्स कैलकुलेटर')}
        blurb={L(
          'Work out the cement, sand and coarse aggregate for a pour. Enter the volume of finished concrete, choose the grade and say how exposed the site is. M20 and below come from the CPWD nominal mixes; M25 and above are worked out the IS 10262 way.',
          'ढलाई के लिए सीमेंट, रेत और मोटी गिट्टी निकालिए। तैयार कंक्रीट का आयतन डालिए, ग्रेड चुनिए और बताइए कि साइट कितनी एक्सपोज़्ड है। M20 और उससे नीचे CPWD के नामिनल मिक्स से आते हैं; M25 और ऊपर IS 10262 के तरीक़े से निकलते हैं।',
        )}
      />
      <QuickAnswer content={MIX_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The pour', 'ढलाई')}</CalcLabel>
            <div className="ns-i-fields">
              <Field
                id="mx-vol"
                label={L('Volume of concrete (m³)', 'कंक्रीट का आयतन (m³)')}
                wide
                hint={L(
                  'Length × width × thickness, all in metres. A slab 5 m × 4 m and 125 mm thick is 5 × 4 × 0.125 = 2.5 m³. One cubic metre is 35.3 cubic feet.',
                  'लंबाई × चौड़ाई × मोटाई, सब मीटर में। 5 m × 4 m और 125 mm मोटा स्लैब 5 × 4 × 0.125 = 2.5 m³ है। एक घन मीटर 35.3 घन फ़ुट होता है।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0" />
              </Field>
              <Field id="mx-grade" label={L('Grade of concrete', 'कंक्रीट का ग्रेड')} wide hint={t(GRADE_NOTE[grade])}>
                <Select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {g} · {NOMINAL_RATIO[g] ? `${L('nominal mix', 'नामिनल मिक्स')} ${NOMINAL_RATIO[g]}` : L('design mix', 'डिज़ाइन मिक्स')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="mx-exp"
                label={L('How exposed is the site?', 'साइट कितनी एक्सपोज़्ड है?')}
                wide
                hint={L(
                  'IS 456 Table 5 sets the lowest grade, the least cement and the most water for each. If you are not sure, ‘mild’ is a dry inland site with normal weather.',
                  'IS 456 Table 5 हर एक के लिए सबसे कम ग्रेड, सबसे कम सीमेंट और सबसे ज़्यादा पानी तय करती है। पक्का न हो तो ‘हल्का’ वह सूखी भीतरी साइट है जहाँ मौसम सामान्य रहता है।',
                )}
              >
                <Select value={exposure} onChange={(e) => setExposure(e.target.value as Exposure)}>
                  {EXPOSURE_ORDER.map((e) => (
                    <option key={e} value={e}>{t(EXPOSURE_LABEL[e])}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big
                k={L(
                  `Cement · ${grade}, ${r.nominal ? `mix ${r.ratio}` : 'design mix'}`,
                  `सीमेंट · ${grade}, ${r.nominal ? `मिक्स ${r.ratio}` : 'डिज़ाइन मिक्स'}`,
                )}
                v={num(r.total.cementBags, 1)}
                unit={L('bags of 50 kg', '50 kg के बैग')}
                sub={L(`${num(r.total.cementKg, 0)} kg for ${num(volumeM3, 2)} m³ of concrete`, `${num(volumeM3, 2)} m³ कंक्रीट के लिए ${num(r.total.cementKg, 0)} kg`)}
              />
              <Figures
                items={[
                  { k: L(`Sand · ${num(r.total.sandCft, 1)} cft`, `रेत · ${num(r.total.sandCft, 1)} cft`), v: num(r.total.sandM3, 2), unit: 'm³' },
                  { k: L(`Coarse aggregate · ${num(r.total.aggregateCft, 1)} cft`, `मोटी गिट्टी · ${num(r.total.aggregateCft, 1)} cft`), v: num(r.total.aggregateM3, 2), unit: 'm³' },
                  ...(r.total.waterL !== null ? [{ k: L('Water in the design', 'डिज़ाइन में पानी'), v: num(r.total.waterL, 0), unit: L('litres', 'लीटर') }] : []),
                ]}
              />

              {r.belowMinimum && !plain ? (
                <Note
                  kind="warn"
                  title={L(`${grade} is below the lowest grade IS 456 allows here`, `${grade} यहाँ IS 456 के सबसे कम ग्रेड से नीचे है`)}
                  foot="IS 456:2000 Table 5"
                >
                  {hi
                    ? `${EXPOSURE_SITE_HI[exposure]} साइट पर रीइन्फ़ोर्स्ड कंक्रीट के लिए कोड ${r.minGrade} या बेहतर, प्रति घन मीटर कम से कम ${r.minCementKg} kg सीमेंट और ${r.maxWc.toFixed(2)} या उससे कम का जल-सीमेंट अनुपात माँगता है। नीचे की मात्राएँ आपके चुने ${grade} की हैं।`
                    : `For reinforced concrete on a ${EXPOSURE_SHORT[exposure].toLowerCase()} site the code asks for ${r.minGrade} or better, at least ${r.minCementKg} kg of cement a cubic metre and a water-cement ratio of ${r.maxWc.toFixed(2)} or less. The quantities below are for ${grade} as chosen.`}
                </Note>
              ) : null}
              {plain ? (
                <Note kind="warn" title={L(`${grade} is plain concrete`, `${grade} सादा कंक्रीट है`)} foot="IS 456:2000">
                  {L(
                    `IS 456 starts reinforced concrete at M20. Use ${grade} for the levelling course under footings and floors, not for anything with steel in it.`,
                    `IS 456 रीइन्फ़ोर्स्ड कंक्रीट की शुरुआत M20 से मानता है। ${grade} का इस्तेमाल फुटिंग और फ़र्श के नीचे की लेवलिंग परत के लिए कीजिए, किसी भी ऐसी चीज़ के लिए नहीं जिसमें स्टील लगना हो।`,
                  )}
                </Note>
              ) : null}
              {r.atCeiling && r.cementForTargetKg !== null && r.targetWc !== null ? (
                <Note
                  kind="warn"
                  title={L(`Cement reaches the ${CEMENT_CEILING} kg ceiling`, `सीमेंट ${CEMENT_CEILING} kg की सीमा छू लेता है`)}
                  foot="IS 456:2000 cl 8.2.4.2"
                >
                  {L(
                    `With ${num(r.perM3.waterL ?? 0, 0)} litres of water, holding a water-cement ratio of ${r.targetWc.toFixed(2)} would need about ${num(r.cementForTargetKg, 0)} kg of cement, and the code stops at ${CEMENT_CEILING} kg. Mixes at this grade are made with a water-reducing admixture. This page assumes none, so treat the cement shown as the most you would buy.`,
                    `${num(r.perM3.waterL ?? 0, 0)} लीटर पानी के साथ ${r.targetWc.toFixed(2)} का जल-सीमेंट अनुपात रखने में लगभग ${num(r.cementForTargetKg, 0)} kg सीमेंट लगेगा, और कोड ${CEMENT_CEILING} kg पर रुकता है। इस ग्रेड के मिक्स पानी घटाने वाले एडमिक्सचर के साथ बनते हैं। यह पेज कोई एडमिक्सचर नहीं मानता, इसलिए दिखाए गए सीमेंट को वह सबसे ज़्यादा समझिए जो आप ख़रीदेंगे।`,
                  )}
                </Note>
              ) : null}
              {!r.nominal ? (
                <Note
                  kind="info"
                  title={L('This is a design mix, worked out on paper', 'यह काग़ज़ पर निकाला गया डिज़ाइन मिक्स है')}
                  foot="IS 456:2000 cl 9.2 · IS 10262:2009"
                >
                  {L(
                    'A real design mix is proportioned from trial batches of your own cement, sand and aggregate. Use these quantities to plan the purchase, not to batch the concrete.',
                    'असली डिज़ाइन मिक्स आपके अपने सीमेंट, रेत और गिट्टी के ट्रायल बैच से तय होता है। इन मात्राओं को ख़रीद की योजना के लिए इस्तेमाल कीजिए, कंक्रीट बनाने के लिए नहीं।',
                  )}
                </Note>
              ) : null}

              <CalcLabel>{L('The working, for one cubic metre', 'हिसाब, एक घन मीटर के लिए')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Mix', 'मिक्स'), detail: t(r.basis), value: r.ratio ?? L('Design mix', 'डिज़ाइन मिक्स') },
                  { label: L('Cement', 'सीमेंट'), detail: `${num(r.perM3.cementKg, 0)} kg`, value: `${num(r.perM3.cementBags, 2)} ${L('bags', 'बैग')}` },
                  { label: L('Sand', 'रेत'), detail: `${num(r.perM3.sandCft, 1)} cft`, value: `${num(r.perM3.sandM3, 3)} m³` },
                  { label: L('Coarse aggregate', 'मोटी गिट्टी'), detail: `${num(r.perM3.aggregateCft, 1)} cft`, value: `${num(r.perM3.aggregateM3, 3)} m³` },
                  ...(r.perM3.waterL !== null ? [{ label: L('Water', 'पानी'), detail: L('in the design', 'डिज़ाइन में'), value: `${num(r.perM3.waterL, 0)} L`, tone: 'dim' as const }] : []),
                  {
                    label: L(`Your pour of ${num(volumeM3, 2)} m³`, `आपकी ${num(volumeM3, 2)} m³ की ढलाई`),
                    detail: L('every figure × the volume', 'हर आँकड़ा × आयतन'),
                    value: `${num(r.total.cementBags, 1)} ${L('bags', 'बैग')}`,
                    tone: 'ok',
                  },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  'The quantities are for finished concrete in place. They do not include what is spilled, left in the mixer or lost to an over-dug trench; add what your site loses. Sand and aggregate are loose, dry volumes.',
                  'मात्राएँ अपनी जगह पर लगे तैयार कंक्रीट की हैं। इनमें गिरा हुआ, मिक्सर में बचा हुआ या ज़्यादा खुदी खाई में गया कंक्रीट शामिल नहीं है; जितना आपकी साइट पर जाता है, जोड़ लीजिए। रेत और गिट्टी ढीले, सूखे आयतन हैं।',
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">
              {L(
                'Enter the volume of concrete to see the cement, sand and coarse aggregate for the pour.',
                'ढलाई के लिए सीमेंट, रेत और मोटी गिट्टी देखने के लिए कंक्रीट का आयतन डालिए।',
              )}
            </p>
          )
        }
      />

      <CalcCta
        kicker={L('Pouring a whole house?', 'पूरे घर की ढलाई करनी है?')}
        text={L(
          'This page works one pour. StructurePro works out the volume of concrete in every footing, column, beam and slab of your house from a few answers, and then the cement, sand, aggregate and steel for the whole frame.',
          'यह पेज एक ढलाई निकालता है। StructurePro कुछ जवाबों से आपके घर की हर फुटिंग, कॉलम, बीम और स्लैब का कंक्रीट आयतन निकालता है, और फिर पूरे ढाँचे का सीमेंट, रेत, गिट्टी और स्टील।',
        )}
        href="/tools/structopro"
        label={L('Open StructurePro', 'StructurePro खोलिए')}
      />

      <CalcSection
        title={L('Cement in a cubic metre of reinforced concrete', 'एक घन मीटर रीइन्फ़ोर्स्ड कंक्रीट में सीमेंट')}
        sub={L(
          'Bags of 50 kg, for each grade and each kind of site. A dash means IS 456 does not allow that grade at that exposure.',
          '50 kg के बैग, हर ग्रेड और हर तरह की साइट के लिए। डैश का मतलब है कि IS 456 उस एक्सपोज़र पर वह ग्रेड नहीं मानता।',
        )}
      >
        <ReportTable
          head={[L('Grade', 'ग्रेड'), L('Mix', 'मिक्स'), ...EXPOSURE_ORDER.map((e) => short(e))]}
          sticky
          num={[2, 3, 4, 5, 6]}
          rows={GRADE_ORDER.filter((g) => parseFloat(g.replace('M', '')) >= 20).map((g) => [
            g,
            (NOMINAL_RATIO[g] ?? L('Design', 'डिज़ाइन')).replace(/ /g, ' '),
            ...EXPOSURE_ORDER.map((e) => {
              const x = calculate({ volumeM3: 1, grade: g, exposure: e })
              return x.belowMinimum ? '—' : num(x.perM3.cementBags, 2)
            }),
          ])}
        />
        <p className="ns-r-tblnote">
          {L(
            `M20 is the CPWD nominal mix, 8.00 bags wherever the code allows it. M25 and above are worked out by the IS 10262 method with 20 mm aggregate, Zone II sand and a 100 mm slump, and the cement is capped at ${CEMENT_CEILING} kg a cubic metre (9 bags). The water-cement ratio and cement floor come from IS 456 Table 5.`,
            `M20 CPWD का नामिनल मिक्स है, जहाँ भी कोड इजाज़त दे वहाँ 8.00 बैग। M25 और ऊपर IS 10262 के तरीक़े से निकले हैं, 20 mm गिट्टी, ज़ोन II रेत और 100 mm स्लंप के साथ, और सीमेंट प्रति घन मीटर ${CEMENT_CEILING} kg (9 बैग) पर रोका गया है। जल-सीमेंट अनुपात और सीमेंट की निचली सीमा IS 456 Table 5 से आती हैं।`,
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('Nominal mix and design mix', 'नामिनल मिक्स और डिज़ाइन मिक्स')}>
          {hi ? (
            <>
              <p>
                <strong>नामिनल मिक्स</strong> एक तय नुस्ख़ा है: एक घन मीटर के लिए इतना सीमेंट, रेत और गिट्टी, किसी जाँच की ज़रूरत नहीं। IS 456:2000 इसे सिर्फ़ M20 तक मानता है। CPWD दिल्ली दर विश्लेषण 2014 आम मिक्सों का विश्लेषण देता है: <strong>M20, 1 : 1.5 : 3 पर</strong>, एक घन मीटर में 400 kg सीमेंट, 0.425 m³ रेत और 0.85 m³ मोटी गिट्टी लेता है; 1 : 2 : 4 पर M15 में 320 kg; 1 : 3 : 6 पर M10 में 220 kg।
              </p>
              <p>
                M20 से ऊपर कोड <strong>डिज़ाइन मिक्स</strong> माँगता है: इंजीनियर या प्रयोगशाला ताक़त के लिए ज़रूरी जल-सीमेंट अनुपात चुनती है, उससे सीमेंट और पानी निकालती है, घन मीटर का बाक़ी हिस्सा रेत और गिट्टी से निरपेक्ष आयतन के हिसाब से भरती है, और नतीजे को ट्रायल क्यूब से साबित करती है। यह पेज वही क़दम काग़ज़ पर चलता है (IS 10262:2009) ताकि आप देख सकें कि कितने सीमेंट की उम्मीद रखें, पर असली आँकड़े सिर्फ़ ट्रायल बैच तय करता है।
              </p>
            </>
          ) : (
            <>
              <p>
                A <strong>nominal mix</strong> is a fixed recipe: so much cement, sand and aggregate for a cubic metre, no testing needed. IS 456:2000 allows it only up to M20. The CPWD Delhi Analysis of Rates 2014 prices the common ones: <strong>M20 at 1 : 1.5 : 3</strong> takes 400 kg of cement, 0.425 m³ of sand and 0.85 m³ of coarse aggregate in a cubic metre; M15 at 1 : 2 : 4 takes 320 kg; M10 at 1 : 3 : 6 takes 220 kg.
              </p>
              <p>
                Above M20 the code asks for a <strong>design mix</strong>: the engineer or a laboratory picks the water-cement ratio the strength needs, works the cement and water from it, fills the rest of the cubic metre with sand and aggregate by absolute volume, and proves the result with trial cubes. This page follows those steps on paper (IS 10262:2009) so that you can see how much cement to expect, but only the trial batch settles the real figures.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Why a 1 : 1 : 2 ‘M25’ is gone', 'क्यों 1 : 1 : 2 वाला ‘M25’ अब नहीं रहा')}>
          <p>
            {L(
              'This page used to offer M25 as a nominal mix of 1 : 1 : 2, which takes about 550 kg of cement, 11 bags, in a cubic metre. IS 456 does not give M25 a nominal mix, and 550 kg is above the 450 kg a cubic metre the code allows (cl 8.2.4.2). Too much cement shrinks and cracks as it cures and gives off heat. The M25 on this page takes 8.2 to 8.8 bags, not 11.',
              'यह पेज पहले M25 को 1 : 1 : 2 के नामिनल मिक्स के रूप में देता था, जिसमें प्रति घन मीटर लगभग 550 kg सीमेंट, यानी 11 बैग, लगता है। IS 456 M25 को कोई नामिनल मिक्स नहीं देता, और 550 kg कोड की प्रति घन मीटर 450 kg की सीमा से ऊपर है (cl 8.2.4.2)। बहुत ज़्यादा सीमेंट जमते समय सिकुड़ता है, चटकता है और गरमी छोड़ता है। इस पेज का M25 11 नहीं, 8.2 से 8.8 बैग लेता है।',
            )}
          </p>
        </Prose>

        <Prose title={L('What the site does to the grade', 'साइट ग्रेड पर क्या असर डालती है')}>
          <p>
            {L(
              'Weather, damp and salts attack concrete and the steel inside it. IS 456 Table 5 answers with five exposure classes. Each sets the lowest grade for reinforced concrete, the least cement, and the most water relative to cement:',
              'मौसम, नमी और लवण कंक्रीट पर और उसके अंदर के स्टील पर हमला करते हैं। IS 456 Table 5 इसका जवाब पाँच एक्सपोज़र वर्गों से देती है। हर एक रीइन्फ़ोर्स्ड कंक्रीट का सबसे कम ग्रेड, सबसे कम सीमेंट, और सीमेंट के मुक़ाबले सबसे ज़्यादा पानी तय करता है:',
            )}
          </p>
          <ul>
            {EXPOSURE_ORDER.map((e) => {
              const x = calculate({ volumeM3: 1, grade: 'M20', exposure: e })
              return (
                <li key={e}>
                  <strong>{short(e)}</strong>
                  {hi
                    ? `: कम से कम ${x.minGrade}, कम से कम ${x.minCementKg} kg सीमेंट, जल-सीमेंट अनुपात ${x.maxWc.toFixed(2)} से ज़्यादा नहीं।`
                    : `: at least ${x.minGrade}, at least ${x.minCementKg} kg of cement, water-cement ratio no more than ${x.maxWc.toFixed(2)}.`}
                </li>
              )
            })}
          </ul>
          <p>
            {L(
              'A tighter water-cement ratio means more cement for the same water, which is why a design mix for a severe site takes about 438 kg where one for a mild site takes about 411 kg.',
              'कसा हुआ जल-सीमेंट अनुपात यानी उतने ही पानी के लिए ज़्यादा सीमेंट, इसीलिए कठोर साइट के डिज़ाइन मिक्स में लगभग 438 kg लगता है जहाँ हल्की साइट के मिक्स में लगभग 411 kg।',
            )}
          </p>
        </Prose>

        <Prose title={L('Why M30 and above stop at 450 kg', 'M30 और ऊपर 450 kg पर क्यों रुकते हैं')}>
          <p>
            {L(
              'Holding a water-cement ratio of 0.43 or less with 197 litres of water would take more than 450 kg of cement. The code caps cement at 450 kg a cubic metre, so every design from M30 up reaches that cap on paper. Real M30 to M40 concrete gets there by adding a water-reducing admixture, which lowers the water and with it the cement. This calculator assumes no admixture, so for M30 and above the cement it shows is the most you would buy. Your supplier’s mix design will usually be lower.',
              '197 लीटर पानी के साथ 0.43 या उससे कम का जल-सीमेंट अनुपात रखने में 450 kg से ज़्यादा सीमेंट लगेगा। कोड सीमेंट को प्रति घन मीटर 450 kg पर रोकता है, इसलिए M30 से ऊपर का हर डिज़ाइन काग़ज़ पर उस सीमा तक पहुँच जाता है। असली M30 से M40 कंक्रीट पानी घटाने वाला एडमिक्सचर डालकर वहाँ पहुँचता है, जो पानी घटाता है और उसके साथ सीमेंट भी। यह कैलकुलेटर कोई एडमिक्सचर नहीं मानता, इसलिए M30 और ऊपर के लिए दिखाया सीमेंट वह सबसे ज़्यादा है जो आप ख़रीदेंगे। आपके सप्लायर का मिक्स डिज़ाइन आम तौर पर इससे कम होगा।',
            )}
          </p>
        </Prose>

        <Prose title={L('Worked example: a 5 m × 4 m slab, 125 mm thick', 'हल किया उदाहरण: 5 m × 4 m का स्लैब, 125 mm मोटा')}>
          <p>{L('The slab holds 5 × 4 × 0.125 = 2.5 m³ of concrete. In M20:', 'स्लैब में 5 × 4 × 0.125 = 2.5 m³ कंक्रीट आता है। M20 में:')}</p>
          <Formula>
            {L(
              '2.5 m³ × 8.0 bags = 20 bags of cement · 2.5 × 0.425 = 1.06 m³ of sand (37.5 cft) · 2.5 × 0.85 = 2.13 m³ of aggregate (75.0 cft)',
              '2.5 m³ × 8.0 बैग = 20 बैग सीमेंट · 2.5 × 0.425 = 1.06 m³ रेत (37.5 cft) · 2.5 × 0.85 = 2.13 m³ गिट्टी (75.0 cft)',
            )}
          </Formula>
          <p>
            {L(
              'In M25 on a mild site the same slab takes 2.5 × 8.22 = 20.6 bags, 1.05 m³ of sand and 1.89 m³ of aggregate: a little more cement and about 11% less aggregate, because a design mix fills the cubic metre by absolute volume.',
              'हल्की साइट पर M25 में यही स्लैब 2.5 × 8.22 = 20.6 बैग, 1.05 m³ रेत और 1.89 m³ गिट्टी लेता है: थोड़ा ज़्यादा सीमेंट और लगभग 11% कम गिट्टी, क्योंकि डिज़ाइन मिक्स घन मीटर को निरपेक्ष आयतन से भरता है।',
            )}
          </p>
        </Prose>

        <Prose title={L('What these quantities assume', 'ये मात्राएँ क्या मानकर चलती हैं')}>
          <p>
            {L(
              'Cement is in 50 kg bags. Design-mix sand is taken as 1,600 kg a cubic metre loose and dry, coarse aggregate as 1,500 kg a cubic metre, specific gravity 3.15 for cement, 2.65 for sand and 2.7 for aggregate; the first is from the IS 10262 worked example, the rest are common values and not from a standard, so a test of your own materials will differ a little. Water for the design mix is 197 litres, the 186 litres IS 10262 gives for 20 mm aggregate plus 6% for a 100 mm slump.',
              'सीमेंट 50 kg के बैग में है। डिज़ाइन मिक्स की रेत ढीली और सूखी 1,600 kg प्रति घन मीटर मानी गई है, मोटी गिट्टी 1,500 kg प्रति घन मीटर, विशिष्ट गुरुत्व सीमेंट का 3.15, रेत का 2.65 और गिट्टी का 2.7; पहला IS 10262 के हल किए उदाहरण से है, बाक़ी आम मान हैं और किसी मानक से नहीं, इसलिए आपकी अपनी सामग्री की जाँच थोड़ी अलग आएगी। डिज़ाइन मिक्स के लिए पानी 197 लीटर है, यानी 20 mm गिट्टी के लिए IS 10262 के 186 लीटर और 100 mm स्लंप के लिए 6% ऊपर।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={MIX_CONTENT.faq} />
      <RelatedLinks path="/tools/concrete-mix-ratio-calculator" />

      <Chips codes={hi ? ['IS 456:2000', 'IS 10262:2009', 'CPWD दर विश्लेषण 2014'] : ['IS 456:2000', 'IS 10262:2009', 'CPWD DAR 2014']} />
      <CalcFine>
        {L(
          'For planning and for checking a quote. M10 to M20 use the CPWD nominal mixes; M25 and above are an IS 10262 working on stated assumptions and are not a mix design. A concrete mix for a building is designed and approved by the engineer in charge, from trial batches. Not a substitute for that.',
          'योजना बनाने और कोटेशन जाँचने के लिए। M10 से M20 CPWD के नामिनल मिक्स लेते हैं; M25 और ऊपर बताई गई मान्यताओं पर IS 10262 की गणना हैं और मिक्स डिज़ाइन नहीं हैं। किसी इमारत का कंक्रीट मिक्स ट्रायल बैच से प्रभारी इंजीनियर डिज़ाइन और मंज़ूर करता है। यह उसकी जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { TANK_DICT } from '@/lib/i18n/labels/calc-tank'
import { ToolHead, Field, Input, Select, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  SOURCE_ORDER,
  SOURCE_LABEL,
  SHARES,
  WATER_DEMAND_LPCD,
  STANDARD_TANK_SIZES,
  calculate,
  type WaterSource,
  type TankChoice,
} from './water-tank-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { TANK_CONTENT } from '@/lib/seo/calc-content'

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

/** "500", or "2 × 5,000" when the overhead need is met by equal ready tanks. */
function show(c: TankChoice) {
  return c.count > 1 ? `${c.count} × ${num(c.each, 0)}` : num(c.each, 0)
}

const SHARE_TEXT: Record<WaterSource, { ugt: string; oht: string }> = {
  municipal: { ugt: 'two-thirds of a day', oht: 'one-third of a day' },
  borewell: { ugt: '', oht: 'half a day' },
  tanker: { ugt: 'a day and a half', oht: 'one-third of a day' },
}

const SHARE_TEXT_HI: Record<WaterSource, { ugt: string; oht: string }> = {
  municipal: { ugt: 'दिन का दो-तिहाई', oht: 'दिन का एक-तिहाई' },
  borewell: { ugt: '', oht: 'आधा दिन' },
  tanker: { ugt: 'डेढ़ दिन', oht: 'दिन का एक-तिहाई' },
}

const HELP: Record<WaterSource, string> = {
  municipal:
    'The town supply fills an underground tank, and a pump lifts the water to a tank on the roof. If the supply does not run every day, choose Tanker, which holds more underground, and ask for an overhead tank of at least half a day’s water (IS 2065 cl 11.11).',
  borewell:
    'A borewell pump can fill the roof tank whenever it is needed, so there is no underground tank: one overhead tank holds half a day’s water.',
  tanker:
    'A tanker comes in lots, so the underground tank holds a day and a half of water and the roof tank a third of a day.',
}

const HELP_HI: Record<WaterSource, string> = {
  municipal:
    'शहर की सप्लाई ज़मीन के नीचे की टंकी भरती है, और पंप पानी को छत की टंकी तक चढ़ाता है। अगर सप्लाई रोज़ नहीं आती, तो टैंकर चुनिए, जिसमें ज़मीन के नीचे ज़्यादा पानी रखा जाता है, और छत की टंकी कम से कम आधे दिन के पानी की रखवाइए (IS 2065 cl 11.11)।',
  borewell:
    'बोरवेल का पंप ज़रूरत पड़ने पर छत की टंकी भर सकता है, इसलिए ज़मीन के नीचे टंकी नहीं होती: एक ओवरहेड टंकी में आधे दिन का पानी रहता है।',
  tanker:
    'टैंकर खेप में आता है, इसलिए ज़मीन के नीचे की टंकी में डेढ़ दिन का पानी रहता है और छत की टंकी में दिन का एक-तिहाई।',
}

export default function WaterTankSizeCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(TANK_DICT)
  const [people, setPeople] = useState('5')
  const [water, setWater] = useState<WaterSource>('municipal')

  const n = Math.max(0, Math.floor(parseFloat(people || '0') || 0))
  const r = useMemo(() => calculate({ people: n, water }), [n, water])
  const valid = n > 0
  const share = SHARES[water]
  const text = (hi ? SHARE_TEXT_HI : SHARE_TEXT)[water]
  const textOf = (src: WaterSource) => (hi ? SHARE_TEXT_HI : SHARE_TEXT)[src]
  const built = r.ugt !== null && r.ugt.kind.startsWith('built')
  const sizes = STANDARD_TANK_SIZES.map((s) => num(s, 0)).join(', ')

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Water Tank Size Calculator', 'वॉटर टैंक साइज़ कैलकुलेटर')}
        blurb={L(
          'Find the size of the underground and overhead tanks for a house. Say how many people live there and where the water comes from; the day’s water use, the share each tank holds and the ready-made size to buy follow.',
          'घर की अंडरग्राउंड और ओवरहेड टंकियों का साइज़ निकालिए। बताइए कि घर में कितने लोग रहते हैं और पानी कहाँ से आता है; दिन भर का पानी, हर टंकी का हिस्सा और ख़रीदने का तैयार साइज़ निकल आते हैं।',
        )}
      />
      <QuickAnswer content={TANK_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The household', 'घर के लोग')}</CalcLabel>
            <div className="ns-i-fields">
              <Field
                id="wt-people"
                label={L('How many people live in the house?', 'घर में कितने लोग रहते हैं?')}
                wide
                hint={L(
                  'Count everyone who lives there. If you are not sure, take the number of bedrooms plus three. For a block of flats, add up all the homes.',
                  'वहाँ रहने वाले सभी को गिनिए। पक्का न हो तो बेडरूम की संख्या में तीन जोड़ लीजिए। फ़्लैटों के ब्लॉक के लिए सभी घर जोड़ लीजिए।',
                )}
              >
                <Input type="number" inputMode="numeric" min={1} step="1" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="0" />
              </Field>
              <Field id="wt-src" label={L('Where does the water come from?', 'पानी कहाँ से आता है?')} wide hint={(hi ? HELP_HI : HELP)[water]}>
                <Select value={water} onChange={(e) => setWater(e.target.value as WaterSource)}>
                  {SOURCE_ORDER.map((s) => (
                    <option key={s} value={s}>{t(SOURCE_LABEL[s])}</option>
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
                k={L('Water the house uses in a day', 'घर में रोज़ इस्तेमाल होने वाला पानी')}
                v={num(r.dailyDemandL, 0)}
                unit={L('litres', 'लीटर')}
                sub={L(
                  `${num(r.people, 0)} ${r.people === 1 ? 'person' : 'people'} × ${r.lpcd} litres`,
                  `${num(r.people, 0)} ${r.people === 1 ? 'व्यक्ति' : 'लोग'} × ${r.lpcd} लीटर`,
                )}
              />
              <Figures
                items={[
                  ...(r.ugt ? [{ k: L(`Underground tank · ${num(r.ugt.neededL, 0)} L needed`, `अंडरग्राउंड टंकी · ${num(r.ugt.neededL, 0)} L चाहिए`), v: show(r.ugt), unit: 'L', tone: 'ok' as const }] : []),
                  { k: L(`Overhead tank · ${num(r.oht.neededL, 0)} L needed`, `ओवरहेड टंकी · ${num(r.oht.neededL, 0)} L चाहिए`), v: show(r.oht), unit: 'L', tone: 'ok' as const },
                ]}
              />
              {!r.ugt ? (
                <Note kind="info" title={L('No underground tank', 'अंडरग्राउंड टंकी नहीं')}>
                  {L(
                    'With a borewell the pump fills the overhead tank when it is needed, so one tank on the roof is enough.',
                    'बोरवेल में पंप ज़रूरत पड़ने पर ओवरहेड टंकी भर देता है, इसलिए छत पर एक टंकी काफ़ी है।',
                  )}
                </Note>
              ) : null}
              {built ? (
                <Note
                  kind="info"
                  title={L('Too big for a ready-made tank', 'तैयार टंकी के लिए बहुत बड़ा')}
                  foot={L('Ready-made tanks stop at 5,000 litres', 'तैयार टंकियाँ 5,000 लीटर पर रुक जाती हैं')}
                >
                  {L(
                    `An underground tank of this size is usually built in concrete or masonry. The ${num(r.ugt!.each, 0)} litres is its inside volume, measured to the working water level.`,
                    `इस साइज़ की अंडरग्राउंड टंकी आम तौर पर कंक्रीट या चिनाई में बनाई जाती है। ${num(r.ugt!.each, 0)} लीटर उसका भीतरी आयतन है, काम के पानी के लेवल तक नापा हुआ।`,
                  )}
                </Note>
              ) : null}
              {r.oht.count > 1 ? (
                <Note kind="info" title={L('Overhead water in several tanks', 'कई टंकियों में ओवरहेड पानी')}>
                  {L(
                    `The roof holds ${r.oht.count} ready-made tanks of ${num(r.oht.each, 0)} litres each, because no single ready-made tank is large enough.`,
                    `छत पर ${num(r.oht.each, 0)} लीटर की ${r.oht.count} तैयार टंकियाँ रहती हैं, क्योंकि कोई एक तैयार टंकी इतनी बड़ी नहीं है।`,
                  )}
                </Note>
              ) : null}

              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Water used in a day', 'रोज़ इस्तेमाल होने वाला पानी'), detail: L(`${num(r.people, 0)} × ${r.lpcd} litres`, `${num(r.people, 0)} × ${r.lpcd} लीटर`), value: `${num(r.dailyDemandL, 0)} L` },
                  ...(r.ugt
                    ? [
                        { label: L('Underground tank, need', 'अंडरग्राउंड टंकी, ज़रूरत'), detail: text.ugt, value: `${num(r.ugt.neededL, 0)} L`, tone: 'dim' as const },
                        { label: L('Underground tank, to buy', 'अंडरग्राउंड टंकी, ख़रीदनी'), detail: t(r.ugt.kind), value: `${num(r.ugt.totalL, 0)} L`, tone: 'ok' as const },
                      ]
                    : []),
                  { label: L('Overhead tank, need', 'ओवरहेड टंकी, ज़रूरत'), detail: text.oht, value: `${num(r.oht.neededL, 0)} L`, tone: 'dim' },
                  { label: L('Overhead tank, to buy', 'ओवरहेड टंकी, ख़रीदनी'), detail: r.oht.count > 1 ? `${r.oht.count} × ${num(r.oht.each, 0)} L, ${t(r.oht.kind)}` : t(r.oht.kind), value: `${num(r.oht.totalL, 0)} L`, tone: 'ok' },
                  { label: L('Tanks to buy, together', 'ख़रीदने वाली टंकियाँ, कुल'), detail: L('both tanks, rounded up', 'दोनों टंकियाँ, ऊपर गोल'), value: `${num(r.totalL, 0)} L` },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  `Each tank is rounded up to the next size that is sold (${sizes} litres), never down. These are the common ready-made sizes; no standard lists them, so check what your supplier stocks.`,
                  `हर टंकी बिकने वाले अगले साइज़ तक ऊपर गोल की जाती है (${sizes} लीटर), कभी नीचे नहीं। ये आम तैयार साइज़ हैं; इन्हें कोई मानक नहीं गिनाता, इसलिए देख लीजिए कि आपके सप्लायर के पास क्या रहता है।`,
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">
              {L(
                'Enter the number of people to see the water the house uses in a day and the size of each tank.',
                'घर का रोज़ का पानी और हर टंकी का साइज़ देखने के लिए लोगों की संख्या डालिए।',
              )}
            </p>
          )
        }
      />

      <CalcCta
        kicker={L('Planning the whole plumbing?', 'पूरी प्लंबिंग की योजना बनानी है?')}
        text={L(
          'This page sizes the tanks. PlumbingPro counts the rest from your plan: the supply pipe floor by floor, the drain and soil pipes, every fitting, the pump, and the septic tank and soak pit when there is no sewer.',
          'यह पेज टंकियों का साइज़ तय करता है। बाक़ी सब PlumbingPro आपके नक्शे से गिनता है: मंज़िल-दर-मंज़िल सप्लाई पाइप, ड्रेन और सॉइल पाइप, हर फ़िटिंग, पंप, और सीवर न हो तो सेप्टिक टैंक और सोक पिट।',
        )}
        href="/tools/plumbpro"
        label={L('Open PlumbingPro', 'PlumbingPro खोलिए')}
      />

      <CalcSection
        title={L('Tanks for a household', 'घर के हिसाब से टंकियाँ')}
        sub={L(
          'The tanks this calculator gives for each household size, by where the water comes from. Litres.',
          'पानी के स्रोत के हिसाब से, हर घरेलू साइज़ के लिए यह कैलकुलेटर जो टंकियाँ देता है। लीटर में।',
        )}
      >
        <ReportTable
          head={[
            L('People', 'लोग'),
            L('Water a day', 'रोज़ का पानी'),
            L('Piped: underground', 'पाइप: अंडरग्राउंड'),
            L('Piped: overhead', 'पाइप: ओवरहेड'),
            L('Borewell: overhead', 'बोरवेल: ओवरहेड'),
            L('Tanker: underground', 'टैंकर: अंडरग्राउंड'),
            L('Tanker: overhead', 'टैंकर: ओवरहेड'),
          ]}
          sticky
          num={[0, 1, 2, 3, 4, 5, 6]}
          rows={[2, 4, 5, 6, 8, 10, 12, 20].map((p) => {
            const m = calculate({ people: p, water: 'municipal' })
            const b = calculate({ people: p, water: 'borewell' })
            const tk = calculate({ people: p, water: 'tanker' })
            return [
              String(p),
              `${num(m.dailyDemandL, 0)} / ${num(b.dailyDemandL, 0)}`,
              show(m.ugt!),
              show(m.oht),
              show(b.oht),
              show(tk.ugt!),
              show(tk.oht),
            ]
          })}
        />
        <p className="ns-r-tblnote">
          {L(
            `Water a day is shown for piped or tanker water (${WATER_DEMAND_LPCD.municipal} litres a person) and then for a borewell (${WATER_DEMAND_LPCD.borewell} litres). The sizes are the smallest ready-made tank that holds the need; a built tank or several tanks appear in the larger rows where one ready-made tank is not enough.`,
            `रोज़ का पानी पहले पाइप या टैंकर के पानी के लिए (${WATER_DEMAND_LPCD.municipal} लीटर प्रति व्यक्ति) दिखाया है, फिर बोरवेल के लिए (${WATER_DEMAND_LPCD.borewell} लीटर)। साइज़ वह सबसे छोटी तैयार टंकी है जिसमें ज़रूरत समा जाए; जहाँ एक तैयार टंकी काफ़ी नहीं, वहाँ बड़ी पंक्तियों में बनी हुई टंकी या कई टंकियाँ दिखती हैं।`,
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('How much water a house uses', 'घर कितना पानी इस्तेमाल करता है')}>
          {hi ? (
            <>
              <p>
                इमारतों में पानी की सप्लाई का भारतीय मानक IS 1172:1993 फ़्लश वाले शौचालयों वाले घर में एक व्यक्ति का पानी <strong>रोज़ 135 लीटर</strong> रखता है: लगभग 45 लीटर फ़्लश के लिए, और 90 बाक़ी सबके लिए। उस 90 में मोटे तौर पर 5 पीने के, 5 खाना पकाने के, 30 नहाने के, 25 कपड़े धोने के और 25 बर्तन और फ़र्श धोने के हैं।
              </p>
              <p>
                एक लाख से ज़्यादा आबादी वाले शहरों को 150 से 200 लीटर दिए गए हैं। यह कैलकुलेटर अपने बोरवेल वाले घर के लिए <strong>150 लीटर</strong> लेता है, जो उस सीमा का सबसे कम आँकड़ा है। मानक माँग को शहर के साइज़ से तय करता है, स्रोत की क़िस्म से नहीं, इसलिए बोरवेल का आँकड़ा कैलकुलेटर की अपनी चुनी हुई बात है। आपका घर ज़्यादा इस्तेमाल करता हो तो ज़्यादा लोग डाल दीजिए।
              </p>
            </>
          ) : (
            <>
              <p>
                IS 1172:1993, the Indian standard for water supply in buildings, puts the water a person uses at <strong>135 litres a day</strong> in a house with flushing toilets: about 45 litres for flushing, and 90 for everything else. That 90 is roughly 5 for drinking, 5 for cooking, 30 for bathing, 25 for washing clothes and 25 for washing utensils and floors.
              </p>
              <p>
                Towns of over a lakh people are given 150 to 200 litres. This calculator uses <strong>150 litres</strong> for a house on its own borewell, the lowest figure of that range. The standard sets demand by the size of the town, not by the kind of source, so the borewell figure is a choice the calculator makes. If your household uses more, enter more people.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Two tanks, and what each holds', 'दो टंकियाँ, और हर एक में क्या रहता है')}>
          {hi ? (
            <p>
              पाइप सप्लाई वाले घर में आम तौर पर दो टंकियाँ होती हैं: <strong>अंडरग्राउंड टंकी</strong>, जो शहर का पानी आने पर भरती है, और छत पर <strong>ओवरहेड टंकी</strong>, जिसे पंप भरा रखता है और जो नलों को गुरुत्व से पानी देती है। NBC भाग 9 खंड 1 का मसौदा (BIS का नवंबर 2024 का प्रारंभिक मसौदा, जिसमें पुराने IS 12183 और IS 2065 के नियम शामिल हैं) दिन भर के पानी को इनमें बाँटता है:
            </p>
          ) : (
            <p>
              A house on piped supply usually has two tanks: an <strong>underground tank</strong> that fills when the town water comes, and an <strong>overhead tank</strong> on the roof that a pump keeps filled and that feeds the taps by gravity. The NBC Part 9 Section 1 draft (the BIS preliminary draft of November 2024, which carries the older IS 12183 and IS 2065 rules) splits the day’s water between them:
            </p>
          )}
          <ul>
            {SOURCE_ORDER.map((s) => (
              <li key={s}>
                <strong>{s === 'municipal' ? L('Piped supply', 'पाइप सप्लाई') : s === 'borewell' ? L('Borewell', 'बोरवेल') : L('Tanker', 'टैंकर')}</strong>:{' '}
                {hi
                  ? SHARES[s].ugt > 0 ? `अंडरग्राउंड ${textOf(s).ugt}, ओवरहेड ${textOf(s).oht}।` : `सिर्फ़ ओवरहेड, ${textOf(s).oht}।`
                  : SHARES[s].ugt > 0 ? `underground ${textOf(s).ugt}, overhead ${textOf(s).oht}.` : `overhead only, ${textOf(s).oht}.`}
              </li>
            ))}
          </ul>
          <p>
            {L(
              'The draft allows an overhead tank alone to hold one-third to one-half of a day; the calculator takes the half. For a tanker the draft’s apartment clause does not say plainly which tank holds which part, so the split above is a reading, not a quotation. The printed NBC 2016 may differ from the draft. Water kept back for fire fighting is not counted; IS 12183 sends that to NBC Part 4.',
              'मसौदा अकेली ओवरहेड टंकी को दिन का एक-तिहाई से आधा रखने देता है; कैलकुलेटर आधा लेता है। टैंकर के लिए मसौदे की अपार्टमेंट वाली धारा साफ़ नहीं कहती कि कौन-सी टंकी कौन-सा हिस्सा रखे, इसलिए ऊपर का बँटवारा एक व्याख्या है, उद्धरण नहीं। छपा हुआ NBC 2016 मसौदे से अलग हो सकता है। आग बुझाने के लिए रखा पानी गिना नहीं गया है; IS 12183 उसे NBC भाग 4 को सौंपता है।',
            )}
          </p>
        </Prose>

        <Prose title={L('Rounding up to a tank you can buy', 'ख़रीदी जा सकने वाली टंकी तक ऊपर गोल करना')}>
          <p>
            {L(
              `Ready-made tanks come in set sizes, commonly ${sizes} litres. No Indian Standard lists those sizes, so the list is an assumption. The calculator always rounds up: a tank that is a little too big costs a little more, and one that is too small runs dry.`,
              `तैयार टंकियाँ तय साइज़ में आती हैं, आम तौर पर ${sizes} लीटर। कोई भारतीय मानक ये साइज़ नहीं गिनाता, इसलिए यह सूची एक मान्यता है। कैलकुलेटर हमेशा ऊपर गोल करता है: थोड़ी बड़ी टंकी थोड़ी महँगी पड़ती है, और छोटी टंकी सूख जाती है।`,
            )}
          </p>
          <p>
            {L(
              'Above 5,000 litres underground, the tank is usually built, so the calculator gives the inside volume rounded up to the next 500 litres. Above 5,000 litres overhead, it gives equal ready-made tanks.',
              'ज़मीन के नीचे 5,000 लीटर से ऊपर टंकी आम तौर पर बनाई जाती है, इसलिए कैलकुलेटर भीतरी आयतन को अगले 500 लीटर तक ऊपर गोल करके देता है। छत पर 5,000 लीटर से ऊपर यह बराबर की तैयार टंकियाँ देता है।',
            )}
          </p>
        </Prose>

        <Prose title={L('Worked example: five people on piped supply', 'हल किया उदाहरण: पाइप सप्लाई पर पाँच लोग')}>
          <p>
            {L(
              'Five people use 5 × 135 = 675 litres a day. The underground tank takes two-thirds of that and the overhead tank a third:',
              'पाँच लोग रोज़ 5 × 135 = 675 लीटर इस्तेमाल करते हैं। अंडरग्राउंड टंकी इसका दो-तिहाई लेती है और ओवरहेड टंकी एक-तिहाई:',
            )}
          </p>
          <Formula>
            {L(
              '675 × ⅔ = 450 L → buy 500 L underground · 675 × ⅓ = 225 L → buy 500 L overhead',
              '675 × ⅔ = 450 L → 500 L अंडरग्राउंड ख़रीदिए · 675 × ⅓ = 225 L → 500 L ओवरहेड ख़रीदिए',
            )}
          </Formula>
          <p>
            {L(
              'On a borewell the same five people use 5 × 150 = 750 litres, and the single overhead tank holds half: 375 litres, so a 500 litre tank. If the water comes by tanker, the underground tank has to hold a day and a half, 5 × 135 × 1.5 = 1,013 litres, which rounds up to a 1,500 litre tank, with a 500 litre tank on the roof.',
              'बोरवेल पर यही पाँच लोग 5 × 150 = 750 लीटर इस्तेमाल करते हैं, और अकेली ओवरहेड टंकी आधा रखती है: 375 लीटर, यानी 500 लीटर की टंकी। पानी टैंकर से आए तो अंडरग्राउंड टंकी को डेढ़ दिन का पानी रखना होता है, 5 × 135 × 1.5 = 1,013 लीटर, जो ऊपर गोल होकर 1,500 लीटर की टंकी बनता है, और छत पर 500 लीटर की टंकी।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={TANK_CONTENT.faq} />
      <RelatedLinks path="/tools/water-tank-size-calculator" />

      <Chips codes={hi ? ['IS 1172:1993', 'IS 2065:1983', 'IS 12183 (Part 1):1987', 'NBC भाग 9 (मसौदा)'] : ['IS 1172:1993', 'IS 2065:1983', 'IS 12183 (Part 1):1987', 'NBC Part 9 (draft)']} />
      <CalcFine>
        {L(
          'For planning. Tank sizes follow the NBC Part 9 Section 1 preliminary draft and common ready-made sizes, and the real need depends on how the household lives, on gardens and on how reliable the supply is. The tanks for a building are sized by the plumbing designer. Not a substitute for that.',
          'योजना बनाने के लिए। टंकी के साइज़ NBC भाग 9 खंड 1 के प्रारंभिक मसौदे और आम तैयार साइज़ों पर चलते हैं, और असली ज़रूरत इस पर निर्भर है कि घर कैसे रहता है, बगीचों पर, और सप्लाई कितनी भरोसेमंद है। किसी इमारत की टंकियों का साइज़ प्लंबिंग डिज़ाइनर तय करता है। यह उसकी जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

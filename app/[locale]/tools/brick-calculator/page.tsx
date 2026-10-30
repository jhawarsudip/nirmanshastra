'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { BRICK_DICT } from '@/lib/i18n/labels/calc-brick'
import { ToolHead, Field, Input, Select } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  BRICK_KINDS,
  BRICK_SPECS,
  MORTAR_JOINT_MM,
  BREAKAGE_LOW,
  BREAKAGE_HIGH,
  MORTAR_ALLOW,
  calculate,
  type BrickKind,
  type WallKind,
} from './brick-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { BRICK_CONTENT } from '@/lib/seo/calc-content'

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export default function BrickCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(BRICK_DICT)
  const [length, setLength] = useState('10')
  const [height, setHeight] = useState('3')
  const [kind, setKind] = useState<BrickKind>('brick')
  const [wall, setWall] = useState<WallKind>('one')
  const [openings, setOpenings] = useState('0')

  const lengthM = Math.max(0, parseFloat(length || '0') || 0)
  const heightM = Math.max(0, parseFloat(height || '0') || 0)
  const openingsM2 = Math.max(0, parseFloat(openings || '0') || 0)

  const r = useMemo(
    () => calculate({ lengthM, heightM, kind, wall, openingsAreaM2: openingsM2 }),
    [lengthM, heightM, kind, wall, openingsM2],
  )
  const spec = BRICK_SPECS[kind]
  const valid = r.netAreaM2 > 0
  const low = Math.round(BREAKAGE_LOW * 100)
  const high = Math.round(BREAKAGE_HIGH * 100)

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Brick Calculator', 'ईंट कैलकुलेटर')}
        blurb={L(
          'Count the bricks in one wall before you order. Pick the brick you will buy and the thickness of the wall, take out the doors and windows, and the count follows from the size of the brick and the joint.',
          'ऑर्डर देने से पहले एक दीवार की ईंटें गिन लीजिए। जो ईंट ख़रीदनी है और दीवार की मोटाई चुनिए, दरवाज़े-खिड़कियाँ घटा दीजिए; गिनती ईंट के साइज़ और जोड़ से निकल आती है।',
        )}
      />
      <QuickAnswer content={BRICK_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The wall', 'दीवार')}</CalcLabel>
            <div className="ns-i-fields">
              <Field id="bk-len" label={L('Wall length (m)', 'दीवार की लंबाई (m)')}>
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="0" />
              </Field>
              <Field id="bk-ht" label={L('Wall height (m)', 'दीवार की ऊँचाई (m)')}>
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" />
              </Field>
              <Field id="bk-kind" label={L('Brick', 'ईंट')} wide hint={`${spec.size}. ${t(spec.source)}`}>
                <Select value={kind} onChange={(e) => setKind(e.target.value as BrickKind)}>
                  {BRICK_KINDS.map((k) => (
                    <option key={k} value={k}>{t(BRICK_SPECS[k].label)} · {BRICK_SPECS[k].size}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <fieldset className="ns-calc-opts">
              <legend>{L('How thick is the wall?', 'दीवार कितनी मोटी है?')}</legend>
              <label className="ns-calc-opt">
                <input type="radio" name="bk-wall" value="one" checked={wall === 'one'} onChange={() => setWall('one')} />
                <span>{L('One brick', 'एक ईंट')} · {spec.oneMm} mm</span>
              </label>
              <label className="ns-calc-opt">
                <input type="radio" name="bk-wall" value="half" checked={wall === 'half'} onChange={() => setWall('half')} />
                <span>{L('Half brick', 'आधी ईंट')} · {spec.halfMm} mm</span>
              </label>
            </fieldset>
            <p className="ns-calc-help">
              {L(
                'A one-brick wall is the usual outer wall. A half-brick wall is an inner partition, laid with the long face of the brick showing.',
                'एक ईंट की दीवार आम तौर पर बाहरी दीवार होती है। आधी ईंट की दीवार भीतर की पार्टीशन दीवार होती है, जिसमें ईंट का लंबा हिस्सा सामने दिखता है।',
              )}
            </p>

            <div className="ns-i-fields">
              <Field
                id="bk-open"
                label={L('Doors and windows to take out (m²)', 'घटाने के लिए दरवाज़े और खिड़कियाँ (m²)')}
                wide
                hint={L(
                  'Add up the area of every opening in this wall. A 0.9 × 2.1 m door is about 1.9 m². A 1.2 × 1.2 m window is about 1.44 m². Leave at 0 for a solid wall.',
                  'इस दीवार के हर खुले हिस्से का एरिया जोड़ लीजिए। 0.9 × 2.1 m का दरवाज़ा लगभग 1.9 m² होता है। 1.2 × 1.2 m की खिड़की लगभग 1.44 m²। ठोस दीवार हो तो 0 रहने दीजिए।',
                )}
              >
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={openings} onChange={(e) => setOpenings(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big
                k={hi
                  ? `दीवार में ईंटें · ${t(spec.label)}, ${wall === 'one' ? 'एक ईंट' : 'आधी ईंट'} मोटी`
                  : `Bricks in the wall · ${spec.label.toLowerCase()}, ${wall === 'one' ? 'one brick' : 'half brick'} thick`}
                v={num(r.bricks, 0)}
                unit={L('bricks', 'ईंटें')}
                sub={L(`before breakage · ${num(r.netAreaM2, 2)} m² of wall`, `टूट-फूट जोड़ने से पहले · दीवार ${num(r.netAreaM2, 2)} m²`)}
              />
              <Figures
                items={[
                  { k: L('Bricks in each m²', 'हर m² में ईंटें'), v: num(r.perM2, 1) },
                  { k: L(`Order, +${low}% to +${high}%`, `ऑर्डर, +${low}% से +${high}%`), v: L(`${num(r.orderLow, 0)} to ${num(r.orderHigh, 0)}`, `${num(r.orderLow, 0)} से ${num(r.orderHigh, 0)}`), tone: 'ok' },
                ]}
              />
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Wall area', 'दीवार का एरिया'), detail: `${num(lengthM, 2)} m × ${num(heightM, 2)} m`, value: `${num(r.grossAreaM2, 2)} m²` },
                  { label: L('Take out openings', 'खुले हिस्से घटाइए'), detail: L('doors and windows', 'दरवाज़े और खिड़कियाँ'), value: `− ${num(r.openingsAreaM2, 2)} m²`, tone: 'dim' },
                  { label: L('Wall to be laid', 'जो दीवार चिननी है'), value: `${num(r.netAreaM2, 2)} m²` },
                  { label: L('Bricks', 'ईंटें'), detail: L(`× ${num(r.perM2, 1)} in each m²`, `× हर m² में ${num(r.perM2, 1)}`), value: num(r.bricks, 0), tone: 'ok' },
                  { label: L(`With ${low}% breakage`, `${low}% टूट-फूट के साथ`), detail: L('a clean, straight wall', 'साफ़, सीधी दीवार'), value: num(r.orderLow, 0), tone: 'dim' },
                  { label: L(`With ${high}% breakage`, `${high}% टूट-फूट के साथ`), detail: L('a wall with a lot of cutting', 'बहुत कटाई वाली दीवार'), value: num(r.orderHigh, 0), tone: 'dim' },
                ]}
              />
              <CalcLabel>{L('The mortar between them', 'उनके बीच का मसाला')}</CalcLabel>
              <Figures
                items={[
                  { k: L('Joint mortar', 'जोड़ का मसाला'), v: num(r.mortarM3, 2), unit: 'm³' },
                  { k: L(`Cement, 1 : ${r.mix} mix`, `सीमेंट, 1 : ${r.mix} मिक्स`), v: num(r.cementBags, 1), unit: L('bags', 'बैग') },
                  { k: L('Sand', 'रेत'), v: num(r.sandM3, 2), unit: 'm³' },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  `The joint mortar is the true volume of the joints plus ${Math.round((MORTAR_ALLOW - 1) * 100)}% for uneven bricks and waste. Cement is in 50 kg bags. The mix is the one the MasonryPro report uses: 1 : 6 for a one-brick wall, 1 : 4 for a half-brick wall.`,
                  `जोड़ का मसाला जोड़ों का असली आयतन है, ऊपर से ऊबड़-खाबड़ ईंटों और बर्बादी के लिए ${Math.round((MORTAR_ALLOW - 1) * 100)}% और। सीमेंट 50 kg के बैग में है। मिक्स वही है जो MasonryPro रिपोर्ट इस्तेमाल करती है: एक ईंट की दीवार के लिए 1 : 6, आधी ईंट की दीवार के लिए 1 : 4।`,
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">
              {L(
                'Enter the wall length and height to see the brick count, the order with breakage, and the mortar between the bricks.',
                'ईंटों की गिनती, टूट-फूट के साथ ऑर्डर और ईंटों के बीच का मसाला देखने के लिए दीवार की लंबाई और ऊँचाई डालिए।',
              )}
            </p>
          )
        }
      />

      <CalcCta
        kicker={L('Counting a whole house?', 'पूरे घर की गिनती करनी है?')}
        text={L(
          'This page counts one wall. MasonryPro works from your rooms: it counts the bricks or blocks in every wall, takes out the real openings, and adds the joint mortar, the plaster on every face, the lintels, and the cement and sand under all of it.',
          'यह पेज एक दीवार गिनता है। MasonryPro आपके कमरों से शुरू करता है: हर दीवार की ईंटें या ब्लॉक गिनता है, असली खुले हिस्से घटाता है, और जोड़ का मसाला, हर तरफ़ का प्लास्टर, लिंटल और इन सबके नीचे लगने वाला सीमेंट और रेत जोड़ता है।',
        )}
        href="/tools/masonpro"
        label={L('Open MasonryPro', 'MasonryPro खोलिए')}
      />

      <CalcSection
        title={L('Bricks in a square metre of wall', 'एक वर्ग मीटर दीवार में ईंटें')}
        sub={L(
          'The same formula for every brick: the thickness of the wall over the size of one brick with its joint, in all three directions.',
          'हर ईंट के लिए एक ही फ़ॉर्मूला: दीवार की मोटाई ÷ जोड़ समेत एक ईंट का साइज़, तीनों दिशाओं में।',
        )}
      >
        <ReportTable
          head={[
            L('Brick', 'ईंट'),
            L('Size (mm)', 'साइज़ (mm)'),
            L('One brick thick', 'एक ईंट मोटी'),
            L('Half brick thick', 'आधी ईंट मोटी'),
            L('Where the size comes from', 'साइज़ कहाँ से लिया'),
          ]}
          num={[2, 3]}
          rows={BRICK_KINDS.map((k) => {
            const s = BRICK_SPECS[k]
            const one = calculate({ lengthM: 1, heightM: 1, kind: k, wall: 'one', openingsAreaM2: 0 }).perM2
            const half = calculate({ lengthM: 1, heightM: 1, kind: k, wall: 'half', openingsAreaM2: 0 }).perM2
            return [t(s.label), s.size, `${num(one, 1)} (${s.oneMm} mm)`, `${num(half, 1)} (${s.halfMm} mm)`, t(s.source)]
          })}
        />
        <p className="ns-r-tblnote">
          {L(
            `Bricks in each square metre of wall, with a ${MORTAR_JOINT_MM} mm joint. The red brick of 230 × 115 × 75 mm is the size most kilns make; it is not a BIS size, so measure a few of the bricks you will actually be sent and compare.`,
            `दीवार के हर वर्ग मीटर में ईंटें, ${MORTAR_JOINT_MM} mm के जोड़ के साथ। 230 × 115 × 75 mm की लाल ईंट वह साइज़ है जो ज़्यादातर भट्ठे बनाते हैं; यह BIS साइज़ नहीं है, इसलिए जो ईंटें आपको असल में भेजी जाएँगी उनमें से कुछ नापकर मिला लीजिए।`,
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('Three bricks, three counts', 'तीन ईंटें, तीन गिनतियाँ')}>
          {hi ? (
            <>
              <p>
                भारतीय मानक IS 1077:1992 मिट्टी की ईंट के दो तरह तय करता है। <strong>मॉड्यूलर</strong> ईंट 190 × 90 × 90 mm की होती है, और 10 mm के जोड़ के साथ वह 200 × 100 × 100 mm की सधी हुई इकाई बन जाती है, इसलिए एक ईंट की दीवार में एक वर्ग मीटर में ठीक 100 ईंटें लगती हैं। <strong>नॉन-मॉड्यूलर</strong> ईंट 230 × 110 × 70 mm की होती है; यही साइज़ उसी मानक और IS 12894:2002 (फ्लाई-ऐश ईंटें) में दिया है।
              </p>
              <p>
                कई भट्ठे आज भी 230 × 115 × 75 mm की लाल ईंट बनाते हैं। यह BIS साइज़ नहीं है, और हर भट्ठे में थोड़ा अलग होता है। इसीलिए यह कैलकुलेटर सिर्फ़ दीवार नहीं, ईंट भी पूछता है: एक ही दीवार में ऐसी लगभग 94 ईंटें लगती हैं, मॉड्यूलर की 100, और 230 × 110 × 70 mm वाली की लगभग 104।
              </p>
            </>
          ) : (
            <>
              <p>
                Indian Standard IS 1077:1992 fixes two kinds of clay brick. The <strong>modular</strong> brick is 190 × 90 × 90 mm, and with a 10 mm joint it lays as a neat 200 × 100 × 100 mm unit, so a one-brick wall takes exactly 100 bricks in a square metre. The <strong>non-modular</strong> brick is 230 × 110 × 70 mm; the same standard and IS 12894:2002 (fly-ash bricks) list that size.
              </p>
              <p>
                Many kilns still make a red brick of 230 × 115 × 75 mm. It is not a BIS size, and it varies from kiln to kiln. That is why this calculator asks for the brick, not just the wall: the same wall takes about 94 of these, 100 of the modular brick, and about 104 of the 230 × 110 × 70 mm brick.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Why the joint matters', 'जोड़ क्यों मायने रखता है')}>
          {hi ? (
            <>
              <p>
                ईंट कभी पड़ोसी ईंट से सटाकर नहीं बिछाई जाती। IS 2212:1991 कहता है कि कोई भी बेड जोड़ 12 mm से मोटा नहीं होगा, और उसकी अपनी जाँच — मॉड्यूलर ईंट की चार परतें और तीन जोड़ मिलकर 39 cm — 10 mm का जोड़ निकालती है, यही आँकड़ा यहाँ लिया गया है।
              </p>
              <Formula>हर m² में ईंटें = (दीवार की मोटाई + 10 mm) ÷ ((L + 10) × (W + 10) × (H + 10)), हर साइज़ मीटर में</Formula>
              <p>
                जो राजमिस्त्री ईंटें बचाने के लिए 15 से 20 mm के मोटे जोड़ लगाता है, उसमें इस गिनती से कम ईंटें लगती हैं, और ज़्यादा मसाला कमज़ोर होता है और ज़्यादा चटकता है। गिनती पतला, एक-सा जोड़ मानकर चलती है।
              </p>
            </>
          ) : (
            <>
              <p>
                A brick is never laid tight against its neighbour. IS 2212:1991 says no bed joint is thicker than 12 mm, and its own check — four courses and three joints measuring 39 cm for modular brick — works out to a 10 mm joint, which is the figure used here.
              </p>
              <Formula>Bricks in 1 m² = (wall thickness + 10 mm) ÷ ((L + 10) × (W + 10) × (H + 10)) with every size in metres</Formula>
              <p>
                A mason who lays fat 15 to 20 mm joints to stretch the bricks uses fewer bricks than this count, and the extra mortar is weaker and cracks more. A thin, even joint is what the count assumes.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Taking out doors and windows', 'दरवाज़े और खिड़कियाँ घटाना')}>
          {hi ? (
            <>
              <p>
                ईंटें दीवार के ठोस हिस्से में ही लगती हैं, इसलिए हर दरवाज़ा और खिड़की पहले एरिया में से घटती है। हर खुले हिस्से की चौड़ाई को उसकी ऊँचाई से गुणा कीजिए, सबको जोड़िए और कुल डालिए। IS 1200 (Part 3), जो ईंट की चिनाई नापने का मानक है, 0.1 m² या उससे छोटे खुले हिस्से को नहीं घटाता, इसलिए छोटा रोशनदान दीवार में गिना रह सकता है। कैलकुलेटर वही एरिया घटाता है जो आप डालते हैं, इसलिए उस नियम पर चलना हो तो छोटे खुले हिस्से कुल में मत जोड़िए।
              </p>
              <ul>
                <li><strong>दरवाज़ा</strong> 0.9 × 2.1 m का लगभग 1.9 m² होता है।</li>
                <li><strong>खिड़की</strong> 1.2 × 1.2 m की लगभग 1.44 m² होती है।</li>
                <li><strong>बाथरूम का रोशनदान</strong> 0.6 × 0.45 m का लगभग 0.27 m² होता है।</li>
              </ul>
              <p>
                एक दरवाज़े और दो खिड़कियों वाली दीवार में आसानी से 5 m² घट जाता है, यानी लाल ईंट की लगभग 470 ईंटें, जो न घटाने पर आप ख़रीद लेते और कभी लगाते नहीं।
              </p>
            </>
          ) : (
            <>
              <p>
                Bricks are only laid in the solid part of the wall, so every door and window comes out of the area first. Multiply each opening’s width by its height, add them up, and enter the total. IS 1200 (Part 3), the standard for measuring brickwork, does not take out an opening of 0.1 m² or less, so a small ventilator can stay in. The calculator takes out whatever area you enter, so leave small openings out of the total if you want to follow that rule.
              </p>
              <ul>
                <li><strong>A door</strong> of 0.9 × 2.1 m is about 1.9 m².</li>
                <li><strong>A window</strong> of 1.2 × 1.2 m is about 1.44 m².</li>
                <li><strong>A bathroom ventilator</strong> of 0.6 × 0.45 m is about 0.27 m².</li>
              </ul>
              <p>
                On a wall with a door and two windows you can easily take out 5 m², which is about 470 bricks of the red kind that you would otherwise buy and never lay.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Worked example: a 10 m × 3 m outer wall', 'हल किया उदाहरण: 10 m × 3 m की बाहरी दीवार')}>
          {hi ? (
            <>
              <p>
                10 m लंबी और 3 m ऊँची दीवार, एक लाल ईंट मोटी, बिना किसी खुले हिस्से के, का एरिया 30 m² है। हर वर्ग मीटर में लगभग 94.1 ईंटों के हिसाब से:
              </p>
              <Formula>30 m² × 94.1 ईंटें प्रति m² = 2,824 ईंटें → 5% से 10% टूट-फूट के साथ 2,965 से 3,106 का ऑर्डर</Formula>
              <p>
                उस दीवार में 0.9 × 2.1 m का दरवाज़ा रखकर 1.9 m² घटाइए, तो 28.1 m² बचता है, जो टूट-फूट से पहले 2,645 ईंटें हैं। यही दीवार मॉड्यूलर ईंट की हो तो ठीक 3,000 लगती हैं; 230 × 110 × 70 mm ईंट की हो तो 3,125।
              </p>
            </>
          ) : (
            <>
              <p>
                A wall 10 m long and 3 m high, one red brick thick, with no openings, has an area of 30 m². At about 94.1 bricks to each square metre:
              </p>
              <Formula>30 m² × 94.1 bricks per m² = 2,824 bricks → order 2,965 to 3,106 with 5% to 10% breakage</Formula>
              <p>
                Put a 0.9 × 2.1 m door in that wall and take out 1.9 m², and 28.1 m² is left, which is 2,645 bricks before breakage. The same wall of modular brick takes exactly 3,000; of 230 × 110 × 70 mm brick, 3,125.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('How much to order on top', 'ऊपर से कितना मँगवाएँ')}>
          <p>
            {L(
              'No standard gives a breakage figure. The MasonryPro report allows 5% for a plain, straight wall, and this page shows 10% as the figure for a wall with a lot of cutting, such as many corners and small openings. They are stated assumptions, not rules; if your supplier delivers a lot of cracked bricks, count what arrives.',
              'टूट-फूट का कोई आँकड़ा किसी मानक में नहीं है। MasonryPro रिपोर्ट सादी, सीधी दीवार के लिए 5% मानती है, और यह पेज बहुत कटाई वाली दीवार के लिए, जैसे कई कोने और छोटे खुले हिस्से, 10% दिखाता है। ये बताई गई मान्यताएँ हैं, नियम नहीं; अगर आपका सप्लायर बहुत सारी चटकी ईंटें भेजे, तो जो आए उसे गिन लीजिए।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={BRICK_CONTENT.faq} />
      <RelatedLinks path="/tools/brick-calculator" />

      <Chips codes={['IS 1077:1992', 'IS 12894:2002', 'IS 2212:1991', 'IS 1200 (Part 3):1976']} />
      <CalcFine>
        {L(
          `For planning and for checking an order. The count is for one straight wall of the brick and thickness you choose, with a ${MORTAR_JOINT_MM} mm joint. Block masonry, other brick sizes and bonds that change the thickness give different counts. Cement and sand are for the joint mortar only; plaster is not included. Not a substitute for measurement on site by the person who will build.`,
          `योजना बनाने और ऑर्डर जाँचने के लिए। गिनती आपकी चुनी ईंट और मोटाई की एक सीधी दीवार के लिए है, ${MORTAR_JOINT_MM} mm के जोड़ के साथ। ब्लॉक की चिनाई, दूसरे ईंट साइज़ और ऐसी बॉन्ड जो मोटाई बदल दें, अलग गिनती देते हैं। सीमेंट और रेत सिर्फ़ जोड़ के मसाले के लिए हैं; प्लास्टर शामिल नहीं है। साइट पर बनाने वाले के नापने की जगह यह नहीं ले सकता।`,
        )}
      </CalcFine>
    </CalcPage>
  )
}

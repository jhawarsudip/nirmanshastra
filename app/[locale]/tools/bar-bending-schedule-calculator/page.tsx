'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { BBS_DICT } from '@/lib/i18n/labels/calc-bbs'
import { ToolHead, Field, Input, Select } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  SHAPES,
  BAR_SIZES,
  PROCURE,
  calculate,
  type ShapeKey,
  type DimKey,
} from './bbs-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { BBS_CONTENT } from '@/lib/seo/calc-content'

function num(n: number, dp: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export default function BarBendingScheduleCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(BBS_DICT)
  const [shapeKey, setShapeKey] = useState<ShapeKey>('stirrup')
  const [diameter, setDiameter] = useState(8)
  const [count, setCount] = useState('1')
  const [vals, setVals] = useState<Record<DimKey, string>>({ A: '300', B: '200', C: '500' })

  const shape = SHAPES.find((s) => s.key === shapeKey) ?? SHAPES[0]
  const dims = useMemo(() => {
    const o: Record<DimKey, number> = { A: 0, B: 0, C: 0 }
    for (const s of shape.dims) o[s.key] = Math.max(0, parseFloat(vals[s.key] || '0') || 0)
    return o
  }, [shape, vals])
  const n = Math.max(1, Math.floor(parseFloat(count || '1') || 1))
  const filled = shape.dims.every((s) => dims[s.key] > 0)
  const r = useMemo(() => calculate(shapeKey, diameter, dims, n), [shapeKey, diameter, dims, n])
  const closed = shapeKey === 'stirrup' || shapeKey === 'square'
  const buyPct = Math.round((PROCURE - 1) * 100)

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Bar Bending Calculator', 'बार बेंडिंग कैलकुलेटर')}
        blurb={L(
          'Work out the length to cut and the weight of one bar shape. Choose the shape, the bar size and the lengths, and the calculator takes off the bends, adds the hooks, rounds up to the next 25 mm and weighs the bar.',
          'एक आकार के बार की काटने की लंबाई और वज़न निकालिए। आकार, बार का साइज़ और लंबाइयाँ चुनिए, और कैलकुलेटर बेंड घटाता है, हुक जोड़ता है, अगले 25 mm तक ऊपर गोल करता है और बार का वज़न निकालता है।',
        )}
      />
      <QuickAnswer content={BBS_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The bar', 'बार')}</CalcLabel>
            <div className="ns-i-fields">
              <Field id="bb-shape" label={L('Shape of the bar', 'बार का आकार')} wide hint={t(shape.note)}>
                <Select value={shapeKey} onChange={(e) => setShapeKey(e.target.value as ShapeKey)}>
                  {SHAPES.map((s) => (
                    <option key={s.key} value={s.key}>{t(s.name)}</option>
                  ))}
                </Select>
              </Field>
              <Field id="bb-dia" label={L('Bar size (mm)', 'बार का साइज़ (mm)')}>
                <Select value={String(diameter)} onChange={(e) => setDiameter(parseInt(e.target.value, 10))}>
                  {BAR_SIZES.map((d) => (
                    <option key={d} value={d}>{d} mm</option>
                  ))}
                </Select>
              </Field>
              <Field id="bb-n" label={L('How many bars?', 'कितने बार?')}>
                <Input type="number" inputMode="numeric" min={1} step="1" value={count} onChange={(e) => setCount(e.target.value)} placeholder="1" />
              </Field>
              {shape.dims.map((s) => (
                <Field key={s.key} id={`bb-${s.key}`} label={t(s.label)} hint={t(s.hint)} wide={shape.dims.length === 1}>
                  <Input type="number" inputMode="decimal" min={0} step="1" value={vals[s.key]} onChange={(e) => setVals((v) => ({ ...v, [s.key]: e.target.value }))} placeholder="0" />
                </Field>
              ))}
            </div>
          </>
        }
        result={
          filled ? (
            <>
              <Big
                k={L(`Length to cut · ${shape.name.split(':')[0]}, ${diameter} mm`, `काटने की लंबाई · ${t(shape.name).split(':')[0]}, ${diameter} mm`)}
                v={num(r.cutMm, 0)}
                unit="mm"
                sub={L(
                  `${num(r.cutMm / 1000, 3)} m a bar, rounded up from ${num(r.exactMm, 0)} mm to the next 25 mm`,
                  `प्रति बार ${num(r.cutMm / 1000, 3)} m, ${num(r.exactMm, 0)} mm से अगले 25 mm तक ऊपर गोल`,
                )}
              />
              <Figures
                items={[
                  { k: L('Weight of one bar', 'एक बार का वज़न'), v: num(r.weightPerBar, r.weightPerBar < 1 ? 3 : 2), unit: 'kg' },
                  { k: L(`All ${num(n, 0)} ${n === 1 ? 'bar' : 'bars'}`, `सभी ${num(n, 0)} बार`), v: num(r.totalKg, r.totalKg < 10 ? 2 : 1), unit: 'kg', tone: 'ok' },
                  { k: L(`To buy, +${buyPct}%`, `ख़रीदने के लिए, +${buyPct}%`), v: num(r.buyKg, r.buyKg < 10 ? 2 : 1), unit: 'kg' },
                ]}
              />
              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  {
                    label: closed ? L('Perimeter', 'परिमाप') : L('Lengths added up', 'लंबाइयों का जोड़'),
                    detail: closed
                      ? (shapeKey === 'square' ? `4 × ${num(dims.A, 0)}` : `2 × (${num(dims.A, 0)} + ${num(dims.B, 0)})`)
                      : shapeKey === 'crank'
                        ? L('overall length', 'कुल लंबाई')
                        : shape.dims.map((s) => num(dims[s.key], 0)).join(' + '),
                    value: `${num(r.runMm, 0)} mm`,
                  },
                  ...(closed
                    ? [{
                        label: L('Hooks and corners', 'हुक और कोने'),
                        detail: L(
                          '12 × bar size (two 10d hook tails less the corners), tails 75 mm at least',
                          '12 × बार का साइज़ (दो 10d हुक टेल, कोनों को घटाकर), टेल कम से कम 75 mm',
                        ),
                        value: `+ ${num(r.hookMm, 0)} mm`,
                      }]
                    : []),
                  ...(r.slopeMm > 0
                    ? [{
                        label: L('Slope of the crank', 'क्रैंक की ढलान'),
                        detail: L(`0.414 × the rise of ${num(dims.B, 0)}`, `0.414 × ${num(dims.B, 0)} की ऊँचाई`),
                        value: `+ ${num(r.slopeMm, 0)} mm`,
                      }]
                    : []),
                  ...(r.bendMm > 0
                    ? [{
                        label: L('Bends', 'बेंड'),
                        detail:
                          shapeKey === 'crank'
                            ? L('two 45° bends', 'दो 45° बेंड')
                            : shapeKey === 'U'
                              ? L('two right-angle bends, 3 × bar size each', 'दो समकोण बेंड, हर एक 3 × बार का साइज़')
                              : L('a right-angle bend, 3 × bar size', 'एक समकोण बेंड, 3 × बार का साइज़'),
                        value: `− ${num(r.bendMm, 0)} mm`,
                        tone: 'dim' as const,
                      }]
                    : []),
                  { label: L('Length before rounding', 'गोल करने से पहले की लंबाई'), value: `${num(r.exactMm, 0)} mm`, tone: 'dim' },
                  { label: L('Rounded up to the next 25 mm', 'अगले 25 mm तक ऊपर गोल'), detail: 'IS 2502 cl 5.1.1', value: `${num(r.cutMm, 0)} mm`, tone: 'ok' },
                  {
                    label: L('Weight of one bar', 'एक बार का वज़न'),
                    detail: L(`${num(r.cutMm / 1000, 3)} m × ${num(r.massPerM, 3)} kg a metre`, `${num(r.cutMm / 1000, 3)} m × ${num(r.massPerM, 3)} kg प्रति मीटर`),
                    value: `${num(r.weightPerBar, 3)} kg`,
                  },
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  `The weight is that of the bar placed. Steel is bought with ${buyPct}% more, the allowance CPWD uses for cutting waste; your yard may differ.`,
                  `वज़न लगे हुए बार का है। स्टील ${buyPct}% ज़्यादा ख़रीदा जाता है, यह वह अतिरिक्त मात्रा है जो CPWD कटिंग की बर्बादी के लिए रखता है; आपका यार्ड इससे अलग रख सकता है।`,
                )}
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">{L('Enter the lengths of the bar to see the length to cut and its weight.', 'काटने की लंबाई और वज़न देखने के लिए बार की लंबाइयाँ डालिए।')}</p>
          )
        }
      />

      <CalcCta
        kicker={L('Need the steel of a whole house?', 'पूरे घर का स्टील चाहिए?')}
        text={L(
          'This page works one bar. StructurePro works out every bar of the footings, columns, beams and slabs of your house from a few answers, bar by bar, and gives the steel to buy for each size.',
          'यह पेज एक बार निकालता है। StructurePro कुछ जवाबों से आपके घर की फुटिंग, कॉलम, बीम और स्लैब का हर बार, एक-एक करके, निकालता है और हर साइज़ का ख़रीदने वाला स्टील बताता है।',
        )}
        href="/tools/structopro"
        label={L('Open StructurePro', 'StructurePro खोलिए')}
      />

      <CalcSection
        title={L('Weight of a metre of bar', 'एक मीटर बार का वज़न')}
        sub={L(
          'Kilograms a metre for each bar size, the weight d² ÷ 162.2 that gives the IS 1786 table.',
          'हर बार साइज़ के लिए किलोग्राम प्रति मीटर, वज़न d² ÷ 162.2 से, जो IS 1786 की तालिका देता है।',
        )}
      >
        <ReportTable
          head={[
            L('Bar size', 'बार का साइज़'),
            L('Kilograms a metre', 'किलोग्राम प्रति मीटर'),
            L('Metres in 100 kg', '100 kg में मीटर'),
            L('A 12 m bar weighs', '12 m के बार का वज़न'),
          ]}
          num={[1, 2, 3]}
          rows={BAR_SIZES.map((d) => {
            const m = calculate('straight', d, { A: 1000, B: 0, C: 0 }, 1).massPerM
            return [`${d} mm`, num(m, 3), num(100 / m, 0), `${num(m * 12, 1)} kg`]
          })}
        />
        <p className="ns-r-tblnote">
          {L(
            'The IS 1786:2008 table gives 0.222, 0.395, 0.617, 0.888, 1.58, 2.47, 3.85, 4.83 and 6.31 kg a metre for 6, 8, 10, 12, 16, 20, 25, 28 and 32 mm bar. Bars are sold in lengths of about 12 m, but no standard fixes that length.',
            'IS 1786:2008 की तालिका 6, 8, 10, 12, 16, 20, 25, 28 और 32 mm के बार के लिए 0.222, 0.395, 0.617, 0.888, 1.58, 2.47, 3.85, 4.83 और 6.31 kg प्रति मीटर देती है। बार लगभग 12 m की लंबाई में बिकते हैं, पर कोई मानक यह लंबाई तय नहीं करता।',
          )}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('What a cutting length is', 'कटिंग लेंथ क्या होती है')}>
          {hi ? (
            <p>
              बार बेंडिंग शेड्यूल में काम का हर बार दर्ज होता है: उसका साइज़, आकार, कितने हैं, काटने की लंबाई और वज़न। <strong>कटिंग लेंथ</strong> सीधे बार की वह लंबाई है जो यार्ड बार मोड़ने से पहले काटता है। मुड़ा हुआ बार उसके लिए बनाई गई लंबाइयों से ज़्यादा या कम बार लेता है, इसलिए कटिंग लेंथ सिर्फ़ लंबाइयों का जोड़ नहीं होती।
            </p>
          ) : (
            <p>
              A bar bending schedule lists every bar of a job: its size, its shape, how many there are, the length to cut and the weight. The <strong>cutting length</strong> is the length of straight bar the yard cuts before it bends the bar. A bar that is bent uses more or less bar than the lengths drawn for it, so the cutting length is not simply the lengths added up.
            </p>
          )}
        </Prose>

        <Prose title={L('Why a stirrup is not just its perimeter', 'स्टिरप सिर्फ़ अपना परिमाप क्यों नहीं होता')}>
          {hi ? (
            <>
              <p>
                स्टिरप या टाई बार का बंद आयत होता है जिसके हर सिरे पर हुक है, और हुक अतिरिक्त बार हैं। भुजाओं को बाहर से बाहर लेने पर लंबाई <strong>2 × (A + B) + 12d</strong> निकलती है, जहाँ d बार का साइज़ है। दो 135° के हुक टेल लगभग 20d जोड़ते हैं, और तीन कोने तथा दो हुक बेंड लगभग 8d वापस ले लेते हैं, क्योंकि मोड़ पर घूमता बार उस तेज़ कोने से छोटा होता है जिसकी जगह वह लेता है।
              </p>
              <p>
                IS 13920 हुक टेल 10d की माँगता है, और 75 mm से कम नहीं। 6 mm की टाई की 10d टेल सिर्फ़ 60 mm होती है, इसलिए 75 mm तक पहुँचने के लिए हर हुक पर उसे अतिरिक्त 15 mm मिलता है; 8 mm के बार में पहले से 80 mm है। कैलकुलेटर यह जोड़ देता है।
              </p>
            </>
          ) : (
            <>
              <p>
                A stirrup or tie is a closed rectangle of bar with a hook at each end, and the hooks are extra bar. Taking the sides out to out, the length works out at <strong>2 × (A + B) + 12d</strong>, where d is the bar size. The two 135° hook tails add about 20d, and the three corners and two hook bends take back about 8d, because a bar going round a curve is shorter than the sharp corner it replaces.
              </p>
              <p>
                IS 13920 asks for a hook tail of 10d, and not under 75 mm. A 6 mm tie has a 10d tail of only 60 mm, so it gets the extra 15 mm on each hook to reach 75 mm; an 8 mm bar already has 80 mm. The calculator adds that.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Bends take bar off', 'बेंड बार घटा देते हैं')}>
          {hi ? (
            <>
              <p>
                बाहर से बाहर बनाई गई लंबाइयाँ तेज़ कोने पर मिलती हैं, पर बार एक मोड़ पर घूमकर मुड़ता है और इसलिए कम लेता है। 4d त्रिज्या की पिन के चारों ओर समकोण बेंड अपनी दोनों भुजाओं के जोड़ में से <strong>3d</strong> घटा देता है (IS 2502 Table V), इसलिए 1,000 और 500 mm का 12 mm का L-बार 1,500 − 36 = 1,464 mm पर कटता है। 45° का बेंड लगभग 0.6d घटाता है।
              </p>
              <p>
                45° का क्रैंक अपनी ढलान से इसका उलटा करता है: ढलान वाला हिस्सा ऊँचाई का 1.414 गुना होता है, इसलिए बार अपनी सिरे-से-सिरे की लंबाई से ऊँचाई का 0.414 गुना ज़्यादा लंबा होता है, दोनों बेंड घटाकर।
              </p>
            </>
          ) : (
            <>
              <p>
                Lengths drawn out to out meet at a sharp corner, but a bar bends round a curve and so needs less. A right-angle bend round a pin of radius 4d takes <strong>3d</strong> off the sum of its two legs (IS 2502 Table V), so a 12 mm L-bar of 1,000 and 500 mm cuts at 1,500 − 36 = 1,464 mm. A 45° bend takes about 0.6d.
              </p>
              <p>
                A crank at 45° does the opposite with its slope: the sloping part is 1.414 times the rise, so the bar is 0.414 × the rise longer than its run, less the two bends.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Rounded up, and bought with 5% more', 'ऊपर गोल, और 5% ज़्यादा ख़रीदा')}>
          {hi ? (
            <>
              <p>
                IS 2502 cl 5.1.1 हर कटिंग लेंथ को अगले पूरे 25 mm तक ऊपर गोल करता है, जैसे यार्ड नापता है। इस पेज का वज़न गोल किए हुए बार का है।
              </p>
              <p>
                कटिंग की बर्बादी और बार के सिरों को पूरा करने के लिए स्टील शेड्यूल के वज़न से ज़्यादा ख़रीदा जाता है। CPWD हर लगाए गए क्विंटल के लिए 1.05 क्विंटल बार ख़रीदता है (दिल्ली दर विश्लेषण 2014, आइटम 5.22.1), और यह पेज उसी आँकड़े को ख़रीदने वाले स्टील के रूप में दिखाता है। यह CPWD की अतिरिक्त मात्रा है, निजी काम के लिए कोई नियम नहीं।
              </p>
            </>
          ) : (
            <>
              <p>
                IS 2502 cl 5.1.1 rounds each cutting length up to the next whole 25 mm, which is how the yard measures. The weight on this page is that of the rounded bar.
              </p>
              <p>
                Steel is bought with more than the schedule weight, to cover cutting waste and the ends of bars. CPWD buys 1.05 quintals of bar for each quintal placed (Delhi Analysis of Rates 2014, item 5.22.1), and this page shows that figure as the steel to buy. It is CPWD’s allowance, not a rule for a private job.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Worked example: the stirrups of a 230 × 350 mm beam', 'हल किया उदाहरण: 230 × 350 mm बीम के स्टिरप')}>
          <p>
            {L(
              'With 25 mm of cover on each side, the stirrup is 230 − 50 = 180 mm wide and 350 − 50 = 300 mm deep, out to out. In 8 mm bar:',
              'हर तरफ़ 25 mm कवर के साथ स्टिरप बाहर से बाहर 230 − 50 = 180 mm चौड़ा और 350 − 50 = 300 mm गहरा है। 8 mm के बार में:',
            )}
          </p>
          <Formula>
            {L(
              '2 × (180 + 300) + 12 × 8 = 1,056 mm → 1,075 mm · 1.075 m × 0.395 kg = 0.424 kg a stirrup',
              '2 × (180 + 300) + 12 × 8 = 1,056 mm → 1,075 mm · 1.075 m × 0.395 kg = 0.424 kg प्रति स्टिरप',
            )}
          </Formula>
          <p>
            {L(
              'A beam with 60 stirrups needs about 25.5 kg placed, and 26.7 kg bought at 5% more. Cut at the perimeter, 960 mm, every stirrup would be 96 mm short of closing.',
              '60 स्टिरप वाले बीम में लगाने के लिए लगभग 25.5 kg चाहिए, और 5% ज़्यादा पर 26.7 kg ख़रीदना होगा। परिमाप, 960 mm, पर काटने से हर स्टिरप बंद होने से 96 mm छोटा रह जाएगा।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={BBS_CONTENT.faq} />
      <RelatedLinks path="/tools/bar-bending-schedule-calculator" />

      <Chips codes={hi ? ['IS 2502:1963', 'IS 1786:2008', 'IS 13920', 'CPWD दर विश्लेषण 2014'] : ['IS 2502:1963', 'IS 1786:2008', 'IS 13920', 'CPWD DAR 2014']} />
      <CalcFine>
        {L(
          'For planning and for checking a schedule. The stirrup length is worked out from the geometry of the bar (a 2d pin, 10d hook tails, 135° hooks) and the bend rules are partly read from a poor scan of IS 2502, so a bar detailed to a drawing follows the drawing. Bar shapes not listed here, and bends round a pin other than 4d, give different lengths. The schedule for a building is prepared by the engineer in charge. Not a substitute for that.',
          'योजना बनाने और शेड्यूल जाँचने के लिए। स्टिरप की लंबाई बार की ज्यामिति से निकाली गई है (2d की पिन, 10d के हुक टेल, 135° के हुक) और बेंड के नियम कुछ हद तक IS 2502 के एक ख़राब स्कैन से पढ़े गए हैं, इसलिए ड्रॉइंग के हिसाब से बना बार ड्रॉइंग का ही पालन करता है। यहाँ न दिए गए बार आकार, और 4d के अलावा किसी और पिन के चारों ओर बेंड, अलग लंबाइयाँ देते हैं। किसी इमारत का शेड्यूल प्रभारी इंजीनियर तैयार करता है। यह उसकी जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

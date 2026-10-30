'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { WIRE_DICT } from '@/lib/i18n/labels/calc-wire'
import { ToolHead, Field, Input, Select, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  CHOICE_ORDER,
  CIRCUIT_RULES,
  DRAFT_MAINS_LIMIT_KW,
  bands,
  calculate,
  choiceLabel,
  type Phase,
  type WireChoice,
} from './wire-size-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { WIRE_CONTENT } from '@/lib/seo/calc-content'

const mm = (n: number) => `${n} mm²`

const BASIS = { code: 'Draft IS 4648 Table 4', assumed: 'Assumed' } as const
const lower = (t: string) => t.replace(/^Up/, 'up').replace(/^Over/, 'over')

const CIRCUIT_ROWS = (['lights', 'sockets6', 'sockets16', 'heater', 'ac'] as const).map((k) => CIRCUIT_RULES[k])

export default function WireSizeCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(WIRE_DICT)
  const [choice, setChoice] = useState<WireChoice>('lights')
  const [kwText, setKwText] = useState('7.5')
  const [phase, setPhase] = useState<Phase>('single')

  const kw = Math.max(0, parseFloat(kwText || '0') || 0)
  const mains = choice === 'mains'
  const valid = !mains || kw > 0
  const r = useMemo(() => calculate({ choice, kw, phase }), [choice, kw, phase])
  const hint = mains
    ? L(
        'The load the home could draw at once. If you do not know it, take 75 watts for every m² of floor: a 100 m² home is 7.5 kW. Your electricity board’s sanctioned load is the other number to use.',
        'घर एक साथ जितना लोड खींच सकता है। न पता हो तो फ़र्श के हर m² के लिए 75 वाट लीजिए: 100 m² का घर 7.5 kW। दूसरा आँकड़ा आपके बिजली बोर्ड का स्वीकृत लोड है।',
      )
    : t(CIRCUIT_RULES[choice as Exclude<WireChoice, 'mains'>].examples)

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Wire Size Calculator', 'वायर साइज़ कैलकुलेटर')}
        blurb={L(
          'Find the least copper wire for a circuit in a home: lights, sockets, a geyser, an air conditioner, or the supply from the meter. Pick what you are wiring, and the size, the breaker, the cable set and the conduit follow.',
          'घर के किसी सर्किट के लिए तांबे का न्यूनतम तार निकालिए: लाइट, सॉकेट, गीज़र, एयर कंडीशनर, या मीटर से आने वाली सप्लाई। जो वायरिंग कर रहे हैं वह चुनिए, तो साइज़, ब्रेकर, केबल सेट और कंड्यूट निकल आते हैं।',
        )}
      />
      <QuickAnswer content={WIRE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('What you are wiring', 'आप क्या वायरिंग कर रहे हैं')}</CalcLabel>
            <div className="ns-i-fields">
              <Field id="ws-circuit" label={L('Which circuit?', 'कौन-सा सर्किट?')} wide hint={hint}>
                <Select value={choice} onChange={(e) => setChoice(e.target.value as WireChoice)}>
                  {CHOICE_ORDER.map((c) => (
                    <option key={c} value={c}>{t(choiceLabel(c))}</option>
                  ))}
                </Select>
              </Field>
              {mains ? (
                <>
                  <Field id="ws-kw" label={L('Load of the home, in kW', 'घर का लोड, kW में')}>
                    <Input type="number" inputMode="decimal" min={0} step="0.5" value={kwText} onChange={(e) => setKwText(e.target.value)} placeholder="0" />
                  </Field>
                  <Field id="ws-phase" label={L('Supply', 'सप्लाई')}>
                    <Select value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
                      <option value="single">{L('Single-phase', 'सिंगल फ़ेज़')}</option>
                      <option value="three">{L('Three-phase', 'थ्री फ़ेज़')}</option>
                    </Select>
                  </Field>
                </>
              ) : null}
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big k={L('Least copper wire', 'तांबे का न्यूनतम तार')} v={String(r.mm2)} unit="mm²" sub={t(r.label)} />
              <Figures
                items={[
                  { k: mains ? L('Main breaker, usually', 'मेन ब्रेकर, आम तौर पर') : L('Breaker', 'ब्रेकर'), v: t(r.mcb), tone: 'ok' },
                  { k: L('Conduit', 'कंड्यूट'), v: String(r.conduitMm), unit: 'mm' },
                ]}
              />
              {r.status === 'assumed' ? (
                <Note
                  kind="warn"
                  title={L('This size is an assumption', 'यह साइज़ एक मान्यता है')}
                  foot={L('Where the draft IS 4648 gives no figure', 'जहाँ मसौदा IS 4648 कोई आँकड़ा नहीं देता')}
                >
                  {t(r.source)}
                </Note>
              ) : null}
              {r.beyondDraft ? (
                <Note kind="info" title={L('A home this large needs a designer', 'इतने बड़े घर के लिए डिज़ाइनर चाहिए')}>
                  {L(
                    `Above ${DRAFT_MAINS_LIMIT_KW} kW the supply is designed for the load, with diversity, the cable’s current rating, derating, and one size up. Take the size above as a guide only.`,
                    `${DRAFT_MAINS_LIMIT_KW} kW से ऊपर सप्लाई लोड के हिसाब से डिज़ाइन की जाती है, डाइवर्सिटी, केबल की करंट रेटिंग, डिरेटिंग और एक साइज़ ऊपर के साथ। ऊपर के साइज़ को सिर्फ़ एक मोटा अंदाज़ा मानिए।`,
                  )}
                </Note>
              ) : null}

              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Copper wire', 'तांबे का तार'), detail: L('least size', 'न्यूनतम साइज़'), value: mm(r.mm2), tone: 'ok' },
                  { label: L('Cable set', 'केबल सेट'), detail: '', value: t(r.cable) },
                  { label: L('Earth wire', 'अर्थ तार'), detail: L('same size up to 16 mm²', '16 mm² तक वही साइज़'), value: mm(r.earthMm2) },
                  {
                    label: mains ? L('Main breaker', 'मेन ब्रेकर') : L('Breaker', 'ब्रेकर'),
                    detail: mains ? L('usual', 'आम तौर पर') : L('for this wire', 'इस तार के लिए'),
                    value: t(r.mcb),
                  },
                  { label: L('Conduit', 'कंड्यूट'), detail: L('CPWD analysis', 'CPWD विश्लेषण'), value: `${r.conduitMm} mm` },
                  { label: L('Colours', 'रंग'), detail: 'CPWD GS 3.5', value: t(r.colours) },
                ]}
              />
              <p className="ns-calc-help">
                <strong>{L('Basis.', 'आधार।')}</strong> {t(r.source)} {t(r.limit)}
              </p>
              <p className="ns-calc-help">
                <strong>{L('Below this size.', 'इस साइज़ से नीचे।')}</strong> {t(r.risk)}
              </p>
              <Note kind="info" title={L('This is the least size, not the size for every run', 'यह न्यूनतम साइज़ है, हर रन का साइज़ नहीं')}>
                {L(
                  'A long cable loses voltage and needs a larger wire than the minimum. This calculator does not work out the voltage drop, so ask the electrician about a long run, such as to an outhouse or a far corner of a big house.',
                  'लंबी केबल में वोल्टेज गिरता है और न्यूनतम से बड़ा तार चाहिए। यह कैलकुलेटर वोल्टेज ड्रॉप नहीं निकालता, इसलिए लंबे रन के बारे में, जैसे अलग बने कमरे तक या बड़े घर के दूर के कोने तक, इलेक्ट्रीशियन से पूछिए।',
                )}
              </Note>
            </>
          ) : (
            <p className="ns-calc-empty">
              {L(
                'Enter the load of the home in kW to see the size of the supply cable.',
                'सप्लाई केबल का साइज़ देखने के लिए घर का लोड kW में डालिए।',
              )}
            </p>
          )
        }
      />

      <CalcCta
        kicker={L('Wiring the whole home?', 'पूरे घर की वायरिंग करनी है?')}
        text={L(
          'This page sizes the wire for one circuit. ElectricalPro counts the rest from your plan: the points room by room, the circuits and boards, every size of wire by colour, the conduit, the accessories and the earthing.',
          'यह पेज एक सर्किट का तार तय करता है। बाक़ी सब ElectricalPro आपके नक्शे से गिनता है: कमरे-दर-कमरे पॉइंट, सर्किट और बोर्ड, रंग के हिसाब से तार का हर साइज़, कंड्यूट, एक्सेसरी और अर्थिंग।',
        )}
        href="/tools/electropro"
        label={L('Open ElectricalPro', 'ElectricalPro खोलिए')}
      />

      <CalcSection
        title={L('Wire for each circuit', 'हर सर्किट का तार')}
        sub={L(
          'The least copper size and the breaker that goes with it. Every circuit also carries an earth wire of the same size.',
          'तांबे का न्यूनतम साइज़ और उसके साथ का ब्रेकर। हर सर्किट में उसी साइज़ का अर्थ तार भी जाता है।',
        )}
      >
        <ReportTable
          head={[L('Circuit', 'सर्किट'), L('Copper', 'तांबा'), L('Breaker', 'ब्रेकर'), L('Where it comes from', 'कहाँ से आया')]}
          num={[1, 2]}
          rows={CIRCUIT_ROWS.map((c) => [t(c.label), mm(c.mm2), c.mcb, t(c.key === 'lights' ? 'CPWD GS 3.12 and draft IS 4648' : BASIS[c.status])])}
        />
        <p className="ns-r-tblnote">
          {L(
            'Lights, fans and the bell use 1.5 mm², the same as CPWD asks for light wiring. For sockets, CPWD asks for 4 mm² on power wiring in its own works, and the draft IS 4648 allows 2.5 mm², which is the figure used here.',
            'लाइट, पंखे और बेल 1.5 mm² लेते हैं, वही जो CPWD लाइट वायरिंग के लिए माँगता है। सॉकेट के लिए CPWD अपने कामों में पावर वायरिंग पर 4 mm² माँगता है, और मसौदा IS 4648 2.5 mm² की इजाज़त देता है, जो आँकड़ा यहाँ लिया गया है।',
          )}
        </p>
      </CalcSection>

      <CalcSection
        title={L('Supply cable by load', 'लोड के हिसाब से सप्लाई केबल')}
        sub={L(
          'The cable from the meter to the main board follows the load of the home, not a fixed size.',
          'मीटर से मेन बोर्ड तक की केबल घर के लोड के हिसाब से चलती है, कोई तय साइज़ नहीं।',
        )}
      >
        <ReportTable
          head={[L('Single-phase load', 'सिंगल फ़ेज़ लोड'), L('Copper', 'तांबा'), L('Where it comes from', 'कहाँ से आया')]}
          labelRow
          num={[1]}
          rows={bands('single').map((b) => [t(b.range), mm(b.mm2), t(BASIS[b.status])])}
        />
        <p className="ns-r-tblnote">
          {hi
            ? `थ्री फ़ेज़ सप्लाई: ${bands('three').map((b) => `${t(b.range)} ${mm(b.mm2)}`).join(', ')}। ये थ्री फ़ेज़ साइज़ मान्यताएँ हैं; मसौदा IS 4648 इनका सिर्फ़ इशारा करता है।`
            : `Three-phase supply: ${bands('three').map((b) => `${lower(b.range)} ${mm(b.mm2)}`).join(', ')}. These three-phase sizes are assumptions; the draft IS 4648 only hints at them.`}
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title={L('How wire is sized in a home', 'घर में तार का साइज़ कैसे तय होता है')}>
          {hi ? (
            <>
              <p>
                तार को अपना करंट बिना गरम हुए ढोना होता है, और लंबे रन में उसमें वोल्टेज बहुत नहीं गिरना चाहिए। घर की वायरिंग में हर तरह के सर्किट का <strong>न्यूनतम</strong> साइज़ दो दस्तावेज़ तय करते हैं: CPWD की विद्युत कार्यों के लिए सामान्य विनिर्देश (भाग I, भीतरी, 2013), और रिहायशी इमारतों के बिजली लेआउट की गाइड IS 4648 का BIS <strong>मसौदा</strong> (पहला संशोधन, सितंबर 2024 में तैयार)। मसौदा अभी प्रकाशित मानक नहीं है, इसलिए जारी होने पर उसके आँकड़े बदल सकते हैं।
              </p>
              <p>
                न्यूनतम साइज़ एक निचली सीमा है। 10 kW से ऊपर के लोड के लिए मसौदा डिज़ाइनर को IS 732:2019 की करंट-रेटिंग तालिकाओं के पास भेजता है, डिरेटिंग फ़ैक्टर और एक साइज़ ऊपर के साथ; यह पेज वे तालिकाएँ नहीं पढ़ता, इसलिए बड़ी सप्लाई का साइज़ नहीं निकालता।
              </p>
            </>
          ) : (
            <>
              <p>
                A wire has to carry its current without getting hot, and over a long run it must not lose too much voltage. For the wiring of a home, two documents set the <strong>least</strong> size for each kind of circuit: the CPWD General Specifications for Electrical Works (Part I, Internal, 2013), and the BIS <strong>draft</strong> of IS 4648, the guide to the electrical layout of residential buildings (the first revision, drafted in September 2024). The draft is not yet a published standard, so its figures may change when it is issued.
              </p>
              <p>
                The least size is a floor. For loads above 10 kW the draft sends the designer to the current-rating tables of IS 732:2019, with a derating factor and a size up; this page does not read those tables, and so it does not size a large supply.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Why the supply cable follows the load', 'सप्लाई केबल लोड के हिसाब से क्यों चलती है')}>
          {hi ? (
            <>
              <p>
                लाइट, सॉकेट और एयर कंडीशनर, हर एक का सर्किट पर अपना काम और अपनी सीमा है, इसलिए हर एक का एक साइज़ है। घर में बिजली लाने वाली केबल इन <em>सबको</em> एक साथ ढोती है, इसलिए उसका साइज़ इस पर टिका है कि घर कितना खींच सकता है। मसौदा फ़र्श के <strong>हर m² के लिए 75 वाट</strong> का न्यूनतम डिज़ाइन लोड तय करता है, और सिंगल फ़ेज़ की सप्लाई केबल 5 kW तक 4 mm², 5 से ऊपर 7 kW तक 6 mm², और 7 से ऊपर 10 kW तक 10 mm² देता है।
              </p>
              <Formula>100 m² × 75 W = 7,500 W = 7.5 kW → 7 से ऊपर 10 kW तक → 10 mm² तांबा</Formula>
              <p>
                मसौदे की तालिका ठीक 7 kW को छोड़ देती है, क्योंकि उसके दो बैंड “5 से ऊपर और 7 से नीचे” और “7 से ऊपर और 10 से नीचे” पढ़ते हैं। यह कैलकुलेटर 7 kW को 6 mm² वाले बैंड में रखता है। स्वीकृत लोड और सप्लाई सिंगल फ़ेज़ हो या थ्री फ़ेज़, यह आपका बिजली बोर्ड तय करता है, और केबल उसके नियमों से तय होती है।
              </p>
            </>
          ) : (
            <>
              <p>
                Lights, sockets and an air conditioner each have a job and a limit on the circuit, so each has one size. The cable that brings power into the home carries <em>all</em> of them at once, so its size depends on how much the home can draw. The draft sets a minimum design load of <strong>75 watts for every m²</strong> of floor, and gives the supply cable for single phase as 4 mm² up to 5 kW, 6 mm² over 5 up to 7 kW, and 10 mm² over 7 up to 10 kW.
              </p>
              <Formula>100 m² × 75 W = 7,500 W = 7.5 kW → over 7 up to 10 kW → 10 mm² copper</Formula>
              <p>
                The draft’s table leaves out exactly 7 kW, because its two bands read “over 5 and under 7” and “over 7 and under 10”. This calculator puts 7 kW with the 6 mm² band. Your electricity board fixes the sanctioned load and whether the supply is single or three phase, and its rules decide the cable.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Sockets: 2.5 mm² or 4 mm²', 'सॉकेट: 2.5 mm² या 4 mm²')}>
          {hi ? (
            <>
              <p>
                यहाँ दोनों स्रोत अलग हैं। CPWD का विनिर्देश अपने कामों में पावर वायरिंग पर <strong>4 mm²</strong> और लाइट वायरिंग पर 1.5 mm² माँगता है। मसौदा IS 4648 बोर्ड से दो सॉकेट तक के, या 3 kW तक के एक उपकरण वाले, सर्किट के लिए <strong>2.5 mm²</strong> की इजाज़त देता है, और 2 से 3 TR के एक एयर कंडीशनर (5 kW तक के पॉइंट) के लिए 4 mm²।
              </p>
              <p>
                यह कैलकुलेटर मसौदे को मानता है, इसलिए सॉकेट के लिए 2.5 mm² देता है। अगर सर्किट दूर तक जाता है, या आगे चलकर भारी उपकरणों की गुंजाइश चाहिए, तो 4 mm² उस दीवार में ज़्यादा गुंजाइश देता है जिसमें वायरिंग सिर्फ़ एक बार होती है।
              </p>
            </>
          ) : (
            <>
              <p>
                The two sources differ here. CPWD’s specification asks for <strong>4 mm²</strong> on power wiring in its own works, and 1.5 mm² on light wiring. The draft IS 4648 allows <strong>2.5 mm²</strong> from the board to a circuit of up to two sockets or one appliance of up to 3 kW, and 4 mm² for one air conditioner of 2 to 3 TR (a point of up to 5 kW).
              </p>
              <p>
                This calculator follows the draft, so it gives 2.5 mm² for sockets. If the circuit runs a long way, or you want room for heavier appliances later, 4 mm² gives more room in a wall that is wired only once.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('What this page does not work out', 'यह पेज क्या नहीं निकालता')}>
          <p>
            {L(
              'It gives the least size for each kind of circuit. It does not read the current ratings of cables, the derating for cables run together in one conduit, or the voltage drop, because no document read for this page gives those figures. It sizes copper only, as CPWD asks, and does not size aluminium, an earth electrode or the cable for an EV charger.',
              'यह हर तरह के सर्किट का न्यूनतम साइज़ देता है। यह केबलों की करंट रेटिंग, एक कंड्यूट में साथ चलाई केबलों की डिरेटिंग, या वोल्टेज ड्रॉप नहीं पढ़ता, क्योंकि इस पेज के लिए पढ़े किसी दस्तावेज़ में ये आँकड़े नहीं हैं। यह सिर्फ़ तांबे का साइज़ तय करता है, जैसा CPWD माँगता है, और एल्युमिनियम, अर्थ इलेक्ट्रोड या EV चार्जर की केबल का साइज़ नहीं निकालता।',
            )}
          </p>
        </Prose>
      </article>

      <CalcFaq items={WIRE_CONTENT.faq} />
      <RelatedLinks path="/tools/wire-size-calculator" />

      <Chips
        codes={hi
          ? ['CPWD GS विद्युत भाग I 2013', 'IS 4648 (मसौदा संशोधन, 2024)', 'CPWD दर-विश्लेषण E&M 2016']
          : ['CPWD GS Electrical Part I 2013', 'IS 4648 (draft revision, 2024)', 'CPWD DAR E&M 2016']}
      />
      <CalcFine>
        {L(
          'For planning. The sizes are the least that CPWD’s specification and the BIS draft of IS 4648 give, and the draft may change before it is published. The wire a home needs depends on its load, the length of each run and the supply rules of your electricity board. The electrician’s design decides the cable. Not a substitute for that.',
          'योजना बनाने के लिए। ये साइज़ वे न्यूनतम हैं जो CPWD का विनिर्देश और IS 4648 का BIS मसौदा देते हैं, और मसौदा प्रकाशित होने से पहले बदल सकता है। घर को कौन-सा तार चाहिए, यह उसके लोड, हर रन की लंबाई और आपके बिजली बोर्ड की सप्लाई के नियमों पर निर्भर है। केबल इलेक्ट्रीशियन का डिज़ाइन तय करता है। यह उसकी जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}

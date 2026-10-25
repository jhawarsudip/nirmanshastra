'use client'

import { useMemo, useState } from 'react'
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

export default function ConcreteMixRatioCalculatorPage() {
  const [volume, setVolume] = useState('2.5')
  const [grade, setGrade] = useState<Grade>('M20')
  const [exposure, setExposure] = useState<Exposure>('mild')

  const volumeM3 = Math.max(0, parseFloat(volume || '0') || 0)
  const r = useMemo(() => calculate({ volumeM3, grade, exposure }), [volumeM3, grade, exposure])
  const valid = volumeM3 > 0
  const plain = parseFloat(grade.replace('M', '')) < 20

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Concrete Mix Calculator"
        blurb="Work out the cement, sand and coarse aggregate for a pour. Enter the volume of finished concrete, choose the grade and say how exposed the site is. M20 and below come from the CPWD nominal mixes; M25 and above are worked out the IS 10262 way."
      />
      <QuickAnswer content={MIX_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The pour</CalcLabel>
            <div className="ns-i-fields">
              <Field id="mx-vol" label="Volume of concrete (m³)" wide hint="Length × width × thickness, all in metres. A slab 5 m × 4 m and 125 mm thick is 5 × 4 × 0.125 = 2.5 m³. One cubic metre is 35.3 cubic feet.">
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0" />
              </Field>
              <Field id="mx-grade" label="Grade of concrete" wide hint={GRADE_NOTE[grade]}>
                <Select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>{g} · {NOMINAL_RATIO[g] ? `nominal mix ${NOMINAL_RATIO[g]}` : 'design mix'}</option>
                  ))}
                </Select>
              </Field>
              <Field id="mx-exp" label="How exposed is the site?" wide hint="IS 456 Table 5 sets the lowest grade, the least cement and the most water for each. If you are not sure, ‘mild’ is a dry inland site with normal weather.">
                <Select value={exposure} onChange={(e) => setExposure(e.target.value as Exposure)}>
                  {EXPOSURE_ORDER.map((e) => (
                    <option key={e} value={e}>{EXPOSURE_LABEL[e]}</option>
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
                k={`Cement · ${grade}, ${r.nominal ? `mix ${r.ratio}` : 'design mix'}`}
                v={num(r.total.cementBags, 1)}
                unit="bags of 50 kg"
                sub={`${num(r.total.cementKg, 0)} kg for ${num(volumeM3, 2)} m³ of concrete`}
              />
              <Figures
                items={[
                  { k: `Sand · ${num(r.total.sandCft, 1)} cft`, v: num(r.total.sandM3, 2), unit: 'm³' },
                  { k: `Coarse aggregate · ${num(r.total.aggregateCft, 1)} cft`, v: num(r.total.aggregateM3, 2), unit: 'm³' },
                  ...(r.total.waterL !== null ? [{ k: 'Water in the design', v: num(r.total.waterL, 0), unit: 'litres' }] : []),
                ]}
              />

              {r.belowMinimum && !plain ? (
                <Note kind="warn" title={`${grade} is below the lowest grade IS 456 allows here`} foot="IS 456:2000 Table 5">
                  For reinforced concrete on a {EXPOSURE_SHORT[exposure].toLowerCase()} site the code asks for {r.minGrade} or better, at least {r.minCementKg} kg of cement a cubic metre and a water-cement ratio of {r.maxWc.toFixed(2)} or less. The quantities below are for {grade} as chosen.
                </Note>
              ) : null}
              {plain ? (
                <Note kind="warn" title={`${grade} is plain concrete`} foot="IS 456:2000">
                  IS 456 starts reinforced concrete at M20. Use {grade} for the levelling course under footings and floors, not for anything with steel in it.
                </Note>
              ) : null}
              {r.atCeiling && r.cementForTargetKg !== null && r.targetWc !== null ? (
                <Note kind="warn" title={`Cement reaches the ${CEMENT_CEILING} kg ceiling`} foot="IS 456:2000 cl 8.2.4.2">
                  With {num(r.perM3.waterL ?? 0, 0)} litres of water, holding a water-cement ratio of {r.targetWc.toFixed(2)} would need about {num(r.cementForTargetKg, 0)} kg of cement, and the code stops at {CEMENT_CEILING} kg. Mixes at this grade are made with a water-reducing admixture. This page assumes none, so treat the cement shown as the most you would buy.
                </Note>
              ) : null}
              {!r.nominal ? (
                <Note kind="info" title="This is a design mix, worked out on paper" foot="IS 456:2000 cl 9.2 · IS 10262:2009">
                  A real design mix is proportioned from trial batches of your own cement, sand and aggregate. Use these quantities to plan the purchase, not to batch the concrete.
                </Note>
              ) : null}

              <CalcLabel>The working, for one cubic metre</CalcLabel>
              <Rows
                rows={[
                  { label: 'Mix', detail: r.basis, value: r.ratio ?? 'Design mix' },
                  { label: 'Cement', detail: `${num(r.perM3.cementKg, 0)} kg`, value: `${num(r.perM3.cementBags, 2)} bags` },
                  { label: 'Sand', detail: `${num(r.perM3.sandCft, 1)} cft`, value: `${num(r.perM3.sandM3, 3)} m³` },
                  { label: 'Coarse aggregate', detail: `${num(r.perM3.aggregateCft, 1)} cft`, value: `${num(r.perM3.aggregateM3, 3)} m³` },
                  ...(r.perM3.waterL !== null ? [{ label: 'Water', detail: 'in the design', value: `${num(r.perM3.waterL, 0)} L`, tone: 'dim' as const }] : []),
                  { label: `Your pour of ${num(volumeM3, 2)} m³`, detail: 'every figure × the volume', value: `${num(r.total.cementBags, 1)} bags`, tone: 'ok' },
                ]}
              />
              <p className="ns-calc-help">
                The quantities are for finished concrete in place. They do not include what is spilled, left in the mixer or lost to an over-dug trench; add what your site loses. Sand and aggregate are loose, dry volumes.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the volume of concrete to see the cement, sand and coarse aggregate for the pour.</p>
          )
        }
      />

      <CalcCta
        kicker="Pouring a whole house?"
        text="This page works one pour. StructurePro works out the volume of concrete in every footing, column, beam and slab of your house from a few answers, and then the cement, sand, aggregate and steel for the whole frame."
        href="/tools/structopro"
        label="Open StructurePro"
      />

      <CalcSection title="Cement in a cubic metre of reinforced concrete" sub="Bags of 50 kg, for each grade and each kind of site. A dash means IS 456 does not allow that grade at that exposure.">
        <ReportTable
          head={['Grade', 'Mix', ...EXPOSURE_ORDER.map((e) => EXPOSURE_SHORT[e])]}
          sticky
          num={[2, 3, 4, 5, 6]}
          rows={GRADE_ORDER.filter((g) => parseFloat(g.replace('M', '')) >= 20).map((g) => [
            g,
            (NOMINAL_RATIO[g] ?? 'Design').replace(/ /g, '\u00a0'),
            ...EXPOSURE_ORDER.map((e) => {
              const x = calculate({ volumeM3: 1, grade: g, exposure: e })
              return x.belowMinimum ? '—' : num(x.perM3.cementBags, 2)
            }),
          ])}
        />
        <p className="ns-r-tblnote">
          M20 is the CPWD nominal mix, 8.00 bags wherever the code allows it. M25 and above are worked out by the IS 10262 method with 20 mm aggregate, Zone II sand and a 100 mm slump, and the cement is capped at {CEMENT_CEILING} kg a cubic metre (9 bags). The water-cement ratio and cement floor come from IS 456 Table 5.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="Nominal mix and design mix">
          <p>
            A <strong>nominal mix</strong> is a fixed recipe: so much cement, sand and aggregate for a cubic metre, no testing needed. IS 456:2000 allows it only up to M20. The CPWD Delhi Analysis of Rates 2014 prices the common ones: <strong>M20 at 1 : 1.5 : 3</strong> takes 400 kg of cement, 0.425 m³ of sand and 0.85 m³ of coarse aggregate in a cubic metre; M15 at 1 : 2 : 4 takes 320 kg; M10 at 1 : 3 : 6 takes 220 kg.
          </p>
          <p>
            Above M20 the code asks for a <strong>design mix</strong>: the engineer or a laboratory picks the water-cement ratio the strength needs, works the cement and water from it, fills the rest of the cubic metre with sand and aggregate by absolute volume, and proves the result with trial cubes. This page follows those steps on paper (IS 10262:2009) so that you can see how much cement to expect, but only the trial batch settles the real figures.
          </p>
        </Prose>

        <Prose title="Why a 1 : 1 : 2 ‘M25’ is gone">
          <p>
            This page used to offer M25 as a nominal mix of 1 : 1 : 2, which takes about 550 kg of cement, 11 bags, in a cubic metre. IS 456 does not give M25 a nominal mix, and 550 kg is above the 450 kg a cubic metre the code allows (cl 8.2.4.2). Too much cement shrinks and cracks as it cures and gives off heat. The M25 on this page takes 8.2 to 8.8 bags, not 11.
          </p>
        </Prose>

        <Prose title="What the site does to the grade">
          <p>
            Weather, damp and salts attack concrete and the steel inside it. IS 456 Table 5 answers with five exposure classes. Each sets the lowest grade for reinforced concrete, the least cement, and the most water relative to cement:
          </p>
          <ul>
            {EXPOSURE_ORDER.map((e) => (
              <li key={e}>
                <strong>{EXPOSURE_SHORT[e]}</strong>: at least {calculate({ volumeM3: 1, grade: 'M20', exposure: e }).minGrade}, at least {calculate({ volumeM3: 1, grade: 'M20', exposure: e }).minCementKg} kg of cement, water-cement ratio no more than {calculate({ volumeM3: 1, grade: 'M20', exposure: e }).maxWc.toFixed(2)}.
              </li>
            ))}
          </ul>
          <p>
            A tighter water-cement ratio means more cement for the same water, which is why a design mix for a severe site takes about 438 kg where one for a mild site takes about 411 kg.
          </p>
        </Prose>

        <Prose title="Why M30 and above stop at 450 kg">
          <p>
            Holding a water-cement ratio of 0.43 or less with 197 litres of water would take more than 450 kg of cement. The code caps cement at 450 kg a cubic metre, so every design from M30 up reaches that cap on paper. Real M30 to M40 concrete gets there by adding a water-reducing admixture, which lowers the water and with it the cement. This calculator assumes no admixture, so for M30 and above the cement it shows is the most you would buy. Your supplier’s mix design will usually be lower.
          </p>
        </Prose>

        <Prose title="Worked example: a 5 m × 4 m slab, 125 mm thick">
          <p>
            The slab holds 5 × 4 × 0.125 = 2.5 m³ of concrete. In M20:
          </p>
          <Formula>2.5 m³ × 8.0 bags = 20 bags of cement · 2.5 × 0.425 = 1.06 m³ of sand (37.5 cft) · 2.5 × 0.85 = 2.13 m³ of aggregate (75.0 cft)</Formula>
          <p>
            In M25 on a mild site the same slab takes 2.5 × 8.22 = 20.6 bags, 1.05 m³ of sand and 1.89 m³ of aggregate: a little more cement and about 11% less aggregate, because a design mix fills the cubic metre by absolute volume.
          </p>
        </Prose>

        <Prose title="What these quantities assume">
          <p>
            Cement is in 50 kg bags. Design-mix sand is taken as 1,600 kg a cubic metre loose and dry, coarse aggregate as 1,500 kg a cubic metre, specific gravity 3.15 for cement, 2.65 for sand and 2.7 for aggregate; the first is from the IS 10262 worked example, the rest are common values and not from a standard, so a test of your own materials will differ a little. Water for the design mix is 197 litres, the 186 litres IS 10262 gives for 20 mm aggregate plus 6% for a 100 mm slump.
          </p>
        </Prose>
      </article>

      <CalcFaq items={MIX_CONTENT.faq} />
      <RelatedLinks path="/tools/concrete-mix-ratio-calculator" />

      <Chips codes={['IS 456:2000', 'IS 10262:2009', 'CPWD DAR 2014']} />
      <CalcFine>
        For planning and for checking a quote. M10 to M20 use the CPWD nominal mixes; M25 and above are an IS 10262 working on stated assumptions and are not a mix design. A concrete mix for a building is designed and approved by the engineer in charge, from trial batches. Not a substitute for that.
      </CalcFine>
    </CalcPage>
  )
}

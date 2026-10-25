'use client'

import { useMemo, useState } from 'react'
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

function bandOf(v: number): string {
  if (v <= 5) return '1 to 5 m³'
  if (v <= 15) return '6 to 15 m³'
  if (v <= 30) return '16 to 30 m³'
  if (v <= 50) return '31 to 50 m³'
  return '51 m³ and over'
}

export default function ConcreteCubeTestCalculatorPage() {
  const [volume, setVolume] = useState('20')
  const v = Math.max(0, parseFloat(volume || '0') || 0)
  const r = useMemo(() => calculate(v), [v])
  const valid = v > 0

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Concrete Cube Test Calculator"
        blurb="Count the cube samples a pour needs. Enter the volume of one grade of concrete; IS 456 gives the least number of samples, and each sample is three cubes tested at 28 days."
      />
      <QuickAnswer content={CUBE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The pour</CalcLabel>
            <div className="ns-i-fields">
              <Field id="cb-vol" label="Volume of concrete of one grade (m³)" wide hint="Length × width × thickness, all in metres. Count each grade of concrete on its own: M20 and M25 in the same building are counted separately.">
                <Input type="number" inputMode="decimal" min={0} step="0.5" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big
                k="Samples to take, at least"
                v={num(r.samples, 0)}
                unit={r.samples === 1 ? 'sample' : 'samples'}
                sub={`${num(r.volume, 1)} m³ falls in the ${bandOf(r.volume)} band of IS 456 cl 15.2.2`}
              />
              <Figures
                items={[
                  { k: 'Cubes to test at 28 days', v: num(r.cubes28, 0), unit: 'cubes', tone: 'ok' },
                  { k: 'With a 7-day check too', v: num(r.cubesWithEarly, 0), unit: 'cubes' },
                ]}
              />
              <Note kind="info" title="At least one sample from each shift" foot="IS 456:2000 cl 15.2.2">
                However small the volume, take at least one sample from each shift of concreting. A ready-mixed concrete plant may agree another frequency with the buyer. Neither is added to the count above.
              </Note>
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Concrete of this grade', value: `${num(r.volume, 1)} m³` },
                  { label: 'Samples', detail: `${bandOf(r.volume)}${r.volume > 50 ? ': 4, and 1 more for each further 50 m³ or part of it' : ''}`, value: num(r.samples, 0), tone: 'ok' },
                  { label: 'Cubes for the 28-day test', detail: `${CUBES_PER_SAMPLE} a sample (IS 456 cl 15.3)`, value: num(r.cubes28, 0) },
                  { label: 'Cubes for a 7-day check', detail: `${EXTRA_CUBES_PER_SAMPLE} more a sample, your choice`, value: num(r.cubesEarly, 0), tone: 'dim' },
                  { label: 'Cubes in all, with the check', value: num(r.cubesWithEarly, 0) },
                ]}
              />
              <p className="ns-calc-help">
                The cubes are the standard 150 mm cubes of IS 516. IS 456 asks for the 28-day test; the 7-day cubes only give an early sign of how the concrete is going.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the volume of concrete to see how many samples and cubes the pour needs.</p>
          )
        }
      />

      <CalcCta
        kicker="Not sure of the volume?"
        text="StructurePro works out the volume of concrete in every footing, column, beam and slab of your house from a few answers, so you know what each pour holds before you count the samples."
        href="/tools/structopro"
        label="Open StructurePro"
      />

      <CalcSection title="How many samples for how much concrete" sub="The IS 456:2000 table for each grade of concrete.">
        <ReportTable
          head={['Concrete in the work (m³)', 'Samples', 'Cubes at 28 days']}
          labelRow
          num={[1, 2]}
          rows={[
            ['1 to 5', '1', '3'],
            ['6 to 15', '2', '6'],
            ['16 to 30', '3', '9'],
            ['31 to 50', '4', '12'],
            ['51 to 100', '5', '15'],
            ['101 to 150', '6', '18'],
          ]}
        />
        <p className="ns-r-tblnote">
          Above 50 m³ the table is {SAMPLING_BANDS[4].samples}, so 51 m³ already needs 5 samples and 101 m³ needs 6.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="What a sample is">
          <p>
            A <strong>sample</strong> is a lot of concrete taken from the mixer or the truck, from which cubes are cast. IS 456:2000 clause 15.3 asks for <strong>three test specimens</strong> from each sample, tested at 28 days. The three are cast from the same batch, and the strength of the sample is their average.
          </p>
          <p>
            Many sites cast three more cubes from each sample and break them at 7 days. IS 456 allows extra cubes for this kind of check but does not ask for them; the 7-day result only tells you early whether the concrete is on course. That is why the page shows both counts.
          </p>
        </Prose>

        <Prose title="Each grade, and each shift">
          <p>
            The table in clause 15.2.2 is for concrete <strong>of each grade</strong>. A building with M25 columns and M20 slabs counts the two separately, each against its own volume.
          </p>
          <p>
            The clause also asks that at least one sample be taken from each shift of concreting, and lets a ready-mixed concrete plant agree its own frequency with the buyer. A small pour on a long day can need more samples than its volume suggests.
          </p>
        </Prose>

        <Prose title="Past 50 m³: or part of it">
          <p>
            For 51 m³ and over, the table says <strong>4 samples, plus one more for each additional 50 m³ or part thereof</strong>. So the count steps up every 50 m³ and any part of a block counts as a whole one: 51 m³ takes 5 samples, 100 m³ takes 5, 101 m³ takes 6.
          </p>
        </Prose>

        <Prose title="Worked example: 120 m³ of M25">
          <p>
            120 m³ is 70 m³ over the first 50. The further 70 m³ is one block of 50 and part of another, which is 2 more samples:
          </p>
          <Formula>4 + 2 = 6 samples · 6 × 3 = 18 cubes at 28 days · 36 cubes with a 7-day check</Formula>
          <p>
            A 45 m³ pour of one grade falls in the 31 to 50 m³ band: 4 samples, 12 cubes at 28 days, 24 with the 7-day check.
          </p>
        </Prose>
      </article>

      <CalcFaq items={CUBE_CONTENT.faq} />
      <RelatedLinks path="/tools/concrete-cube-test-calculator" />

      <Chips codes={['IS 456:2000', 'IS 516', 'IS 1199']} />
      <CalcFine>
        For planning the sampling of a pour. The count is the least IS 456 asks for; the engineer in charge or the contract can ask for more. Cubes are made, cured and tested as IS 516 says, and the strength is judged by the acceptance rules of IS 456. Not a substitute for the quality plan of the job.
      </CalcFine>
    </CalcPage>
  )
}

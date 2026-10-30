'use client'

import { useMemo, useState } from 'react'
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

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Bar Bending Calculator"
        blurb="Work out the length to cut and the weight of one bar shape. Choose the shape, the bar size and the lengths, and the calculator takes off the bends, adds the hooks, rounds up to the next 25 mm and weighs the bar."
      />
      <QuickAnswer content={BBS_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The bar</CalcLabel>
            <div className="ns-i-fields">
              <Field id="bb-shape" label="Shape of the bar" wide hint={shape.note}>
                <Select value={shapeKey} onChange={(e) => setShapeKey(e.target.value as ShapeKey)}>
                  {SHAPES.map((s) => (
                    <option key={s.key} value={s.key}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field id="bb-dia" label="Bar size (mm)">
                <Select value={String(diameter)} onChange={(e) => setDiameter(parseInt(e.target.value, 10))}>
                  {BAR_SIZES.map((d) => (
                    <option key={d} value={d}>{d} mm</option>
                  ))}
                </Select>
              </Field>
              <Field id="bb-n" label="How many bars?">
                <Input type="number" inputMode="numeric" min={1} step="1" value={count} onChange={(e) => setCount(e.target.value)} placeholder="1" />
              </Field>
              {shape.dims.map((s) => (
                <Field key={s.key} id={`bb-${s.key}`} label={s.label} hint={s.hint} wide={shape.dims.length === 1}>
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
                k={`Length to cut · ${shape.name.split(':')[0]}, ${diameter} mm`}
                v={num(r.cutMm, 0)}
                unit="mm"
                sub={`${num(r.cutMm / 1000, 3)} m a bar, rounded up from ${num(r.exactMm, 0)} mm to the next 25 mm`}
              />
              <Figures
                items={[
                  { k: 'Weight of one bar', v: num(r.weightPerBar, r.weightPerBar < 1 ? 3 : 2), unit: 'kg' },
                  { k: `All ${num(n, 0)} ${n === 1 ? 'bar' : 'bars'}`, v: num(r.totalKg, r.totalKg < 10 ? 2 : 1), unit: 'kg', tone: 'ok' },
                  { k: `To buy, +${Math.round((PROCURE - 1) * 100)}%`, v: num(r.buyKg, r.buyKg < 10 ? 2 : 1), unit: 'kg' },
                ]}
              />
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  {
                    label: closed ? 'Perimeter' : 'Lengths added up',
                    detail: closed ? (shapeKey === 'square' ? `4 × ${num(dims.A, 0)}` : `2 × (${num(dims.A, 0)} + ${num(dims.B, 0)})`) : shapeKey === 'crank' ? 'overall length' : shape.dims.map((s) => num(dims[s.key], 0)).join(' + '),
                    value: `${num(r.runMm, 0)} mm`,
                  },
                  ...(closed ? [{ label: 'Hooks and corners', detail: '12 × bar size (two 10d hook tails less the corners), tails 75 mm at least', value: `+ ${num(r.hookMm, 0)} mm` }] : []),
                  ...(r.slopeMm > 0 ? [{ label: 'Slope of the crank', detail: `0.414 × the rise of ${num(dims.B, 0)}`, value: `+ ${num(r.slopeMm, 0)} mm` }] : []),
                  ...(r.bendMm > 0 ? [{ label: 'Bends', detail: shapeKey === 'crank' ? 'two 45° bends' : shapeKey === 'U' ? 'two right-angle bends, 3 × bar size each' : 'a right-angle bend, 3 × bar size', value: `− ${num(r.bendMm, 0)} mm`, tone: 'dim' as const }] : []),
                  { label: 'Length before rounding', value: `${num(r.exactMm, 0)} mm`, tone: 'dim' },
                  { label: 'Rounded up to the next 25 mm', detail: 'IS 2502 cl 5.1.1', value: `${num(r.cutMm, 0)} mm`, tone: 'ok' },
                  { label: 'Weight of one bar', detail: `${num(r.cutMm / 1000, 3)} m × ${num(r.massPerM, 3)} kg a metre`, value: `${num(r.weightPerBar, 3)} kg` },
                ]}
              />
              <p className="ns-calc-help">
                The weight is that of the bar placed. Steel is bought with {Math.round((PROCURE - 1) * 100)}% more, the allowance CPWD uses for cutting waste; your yard may differ.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the lengths of the bar to see the length to cut and its weight.</p>
          )
        }
      />

      <CalcCta
        kicker="Need the steel of a whole house?"
        text="This page works one bar. StructurePro works out every bar of the footings, columns, beams and slabs of your house from a few answers, bar by bar, and gives the steel to buy for each size."
        href="/tools/structopro"
        label="Open StructurePro"
      />

      <CalcSection title="Weight of a metre of bar" sub="Kilograms a metre for each bar size, the weight d² ÷ 162.2 that gives the IS 1786 table.">
        <ReportTable
          head={['Bar size', 'Kilograms a metre', 'Metres in 100 kg', 'A 12 m bar weighs']}
          num={[1, 2, 3]}
          rows={BAR_SIZES.map((d) => {
            const m = calculate('straight', d, { A: 1000, B: 0, C: 0 }, 1).massPerM
            return [`${d} mm`, num(m, 3), num(100 / m, 0), `${num(m * 12, 1)} kg`]
          })}
        />
        <p className="ns-r-tblnote">
          The IS 1786:2008 table gives 0.222, 0.395, 0.617, 0.888, 1.58, 2.47, 3.85, 4.83 and 6.31 kg a metre for 6, 8, 10, 12, 16, 20, 25, 28 and 32 mm bar. Bars are sold in lengths of about 12 m, but no standard fixes that length.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="What a cutting length is">
          <p>
            A bar bending schedule lists every bar of a job: its size, its shape, how many there are, the length to cut and the weight. The <strong>cutting length</strong> is the length of straight bar the yard cuts before it bends the bar. A bar that is bent uses more or less bar than the lengths drawn for it, so the cutting length is not simply the lengths added up.
          </p>
        </Prose>

        <Prose title="Why a stirrup is not just its perimeter">
          <p>
            A stirrup or tie is a closed rectangle of bar with a hook at each end, and the hooks are extra bar. Taking the sides out to out, the length works out at <strong>2 × (A + B) + 12d</strong>, where d is the bar size. The two 135° hook tails add about 20d, and the three corners and two hook bends take back about 8d, because a bar going round a curve is shorter than the sharp corner it replaces.
          </p>
          <p>
            IS 13920 asks for a hook tail of 10d, and not under 75 mm. A 6 mm tie has a 10d tail of only 60 mm, so it gets the extra 15 mm on each hook to reach 75 mm; an 8 mm bar already has 80 mm. The calculator adds that.
          </p>
        </Prose>

        <Prose title="Bends take bar off">
          <p>
            Lengths drawn out to out meet at a sharp corner, but a bar bends round a curve and so needs less. A right-angle bend round a pin of radius 4d takes <strong>3d</strong> off the sum of its two legs (IS 2502 Table V), so a 12 mm L-bar of 1,000 and 500 mm cuts at 1,500 − 36 = 1,464 mm. A 45° bend takes about 0.6d.
          </p>
          <p>
            A crank at 45° does the opposite with its slope: the sloping part is 1.414 times the rise, so the bar is 0.414 × the rise longer than its run, less the two bends.
          </p>
        </Prose>

        <Prose title="Rounded up, and bought with 5% more">
          <p>
            IS 2502 cl 5.1.1 rounds each cutting length up to the next whole 25 mm, which is how the yard measures. The weight on this page is that of the rounded bar.
          </p>
          <p>
            Steel is bought with more than the schedule weight, to cover cutting waste and the ends of bars. CPWD buys 1.05 quintals of bar for each quintal placed (Delhi Analysis of Rates 2014, item 5.22.1), and this page shows that figure as the steel to buy. It is CPWD’s allowance, not a rule for a private job.
          </p>
        </Prose>

        <Prose title="Worked example: the stirrups of a 230 × 350 mm beam">
          <p>
            With 25 mm of cover on each side, the stirrup is 230 − 50 = 180 mm wide and 350 − 50 = 300 mm deep, out to out. In 8 mm bar:
          </p>
          <Formula>2 × (180 + 300) + 12 × 8 = 1,056 mm → 1,075 mm · 1.075 m × 0.395 kg = 0.424 kg a stirrup</Formula>
          <p>
            A beam with 60 stirrups needs about 25.5 kg placed, and 26.7 kg bought at 5% more. Cut at the perimeter, 960 mm, every stirrup would be 96 mm short of closing.
          </p>
        </Prose>
      </article>

      <CalcFaq items={BBS_CONTENT.faq} />
      <RelatedLinks path="/tools/bar-bending-schedule-calculator" />

      <Chips codes={['IS 2502:1963', 'IS 1786:2008', 'IS 13920', 'CPWD DAR 2014']} />
      <CalcFine>
        For planning and for checking a schedule. The stirrup length is worked out from the geometry of the bar (a 2d pin, 10d hook tails, 135° hooks) and the bend rules are partly read from a poor scan of IS 2502, so a bar detailed to a drawing follows the drawing. Bar shapes not listed here, and bends round a pin other than 4d, give different lengths. The schedule for a building is prepared by the engineer in charge. Not a substitute for that.
      </CalcFine>
    </CalcPage>
  )
}

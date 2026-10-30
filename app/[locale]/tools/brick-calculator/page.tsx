'use client'

import { useMemo, useState } from 'react'
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
        eyebrow="Free calculator · no sign-in"
        name="Brick Calculator"
        blurb="Count the bricks in one wall before you order. Pick the brick you will buy and the thickness of the wall, take out the doors and windows, and the count follows from the size of the brick and the joint."
      />
      <QuickAnswer content={BRICK_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The wall</CalcLabel>
            <div className="ns-i-fields">
              <Field id="bk-len" label="Wall length (m)">
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="0" />
              </Field>
              <Field id="bk-ht" label="Wall height (m)">
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" />
              </Field>
              <Field id="bk-kind" label="Brick" wide hint={`${spec.size}. ${spec.source}`}>
                <Select value={kind} onChange={(e) => setKind(e.target.value as BrickKind)}>
                  {BRICK_KINDS.map((k) => (
                    <option key={k} value={k}>{BRICK_SPECS[k].label} · {BRICK_SPECS[k].size}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <fieldset className="ns-calc-opts">
              <legend>How thick is the wall?</legend>
              <label className="ns-calc-opt">
                <input type="radio" name="bk-wall" value="one" checked={wall === 'one'} onChange={() => setWall('one')} />
                <span>One brick · {spec.oneMm} mm</span>
              </label>
              <label className="ns-calc-opt">
                <input type="radio" name="bk-wall" value="half" checked={wall === 'half'} onChange={() => setWall('half')} />
                <span>Half brick · {spec.halfMm} mm</span>
              </label>
            </fieldset>
            <p className="ns-calc-help">
              A one-brick wall is the usual outer wall. A half-brick wall is an inner partition, laid with the long face of the brick showing.
            </p>

            <div className="ns-i-fields">
              <Field id="bk-open" label="Doors and windows to take out (m²)" wide hint="Add up the area of every opening in this wall. A 0.9 × 2.1 m door is about 1.9 m². A 1.2 × 1.2 m window is about 1.44 m². Leave at 0 for a solid wall.">
                <Input type="number" inputMode="decimal" min={0} step="0.1" value={openings} onChange={(e) => setOpenings(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </>
        }
        result={
          valid ? (
            <>
              <Big k={`Bricks in the wall · ${spec.label.toLowerCase()}, ${wall === 'one' ? 'one brick' : 'half brick'} thick`} v={num(r.bricks, 0)} unit="bricks" sub={`before breakage · ${num(r.netAreaM2, 2)} m² of wall`} />
              <Figures
                items={[
                  { k: 'Bricks in each m²', v: num(r.perM2, 1) },
                  { k: `Order, +${low}% to +${high}%`, v: `${num(r.orderLow, 0)} to ${num(r.orderHigh, 0)}`, tone: 'ok' },
                ]}
              />
              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Wall area', detail: `${num(lengthM, 2)} m × ${num(heightM, 2)} m`, value: `${num(r.grossAreaM2, 2)} m²` },
                  { label: 'Take out openings', detail: 'doors and windows', value: `− ${num(r.openingsAreaM2, 2)} m²`, tone: 'dim' },
                  { label: 'Wall to be laid', value: `${num(r.netAreaM2, 2)} m²` },
                  { label: 'Bricks', detail: `× ${num(r.perM2, 1)} in each m²`, value: num(r.bricks, 0), tone: 'ok' },
                  { label: `With ${low}% breakage`, detail: 'a clean, straight wall', value: num(r.orderLow, 0), tone: 'dim' },
                  { label: `With ${high}% breakage`, detail: 'a wall with a lot of cutting', value: num(r.orderHigh, 0), tone: 'dim' },
                ]}
              />
              <CalcLabel>The mortar between them</CalcLabel>
              <Figures
                items={[
                  { k: 'Joint mortar', v: num(r.mortarM3, 2), unit: 'm³' },
                  { k: `Cement, 1 : ${r.mix} mix`, v: num(r.cementBags, 1), unit: 'bags' },
                  { k: 'Sand', v: num(r.sandM3, 2), unit: 'm³' },
                ]}
              />
              <p className="ns-calc-help">
                The joint mortar is the true volume of the joints plus {Math.round((MORTAR_ALLOW - 1) * 100)}% for uneven bricks and waste. Cement is in 50 kg bags. The mix is the one the MasonryPro report uses: 1 : 6 for a one-brick wall, 1 : 4 for a half-brick wall.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the wall length and height to see the brick count, the order with breakage, and the mortar between the bricks.</p>
          )
        }
      />

      <CalcCta
        kicker="Counting a whole house?"
        text="This page counts one wall. MasonryPro works from your rooms: it counts the bricks or blocks in every wall, takes out the real openings, and adds the joint mortar, the plaster on every face, the lintels, and the cement and sand under all of it."
        href="/tools/masonpro"
        label="Open MasonryPro"
      />

      <CalcSection title="Bricks in a square metre of wall" sub="The same formula for every brick: the thickness of the wall over the size of one brick with its joint, in all three directions.">
        <ReportTable
          head={['Brick', 'Size (mm)', 'One brick thick', 'Half brick thick', 'Where the size comes from']}
          num={[2, 3]}
          rows={BRICK_KINDS.map((k) => {
            const s = BRICK_SPECS[k]
            const one = calculate({ lengthM: 1, heightM: 1, kind: k, wall: 'one', openingsAreaM2: 0 }).perM2
            const half = calculate({ lengthM: 1, heightM: 1, kind: k, wall: 'half', openingsAreaM2: 0 }).perM2
            return [s.label, s.size, `${num(one, 1)} (${s.oneMm} mm)`, `${num(half, 1)} (${s.halfMm} mm)`, s.source]
          })}
        />
        <p className="ns-r-tblnote">
          Bricks in each square metre of wall, with a {MORTAR_JOINT_MM} mm joint. The red brick of 230 × 115 × 75 mm is the size most kilns make; it is not a BIS size, so measure a few of the bricks you will actually be sent and compare.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="Three bricks, three counts">
          <p>
            Indian Standard IS 1077:1992 fixes two kinds of clay brick. The <strong>modular</strong> brick is 190 × 90 × 90 mm, and with a 10 mm joint it lays as a neat 200 × 100 × 100 mm unit, so a one-brick wall takes exactly 100 bricks in a square metre. The <strong>non-modular</strong> brick is 230 × 110 × 70 mm; the same standard and IS 12894:2002 (fly-ash bricks) list that size.
          </p>
          <p>
            Many kilns still make a red brick of 230 × 115 × 75 mm. It is not a BIS size, and it varies from kiln to kiln. That is why this calculator asks for the brick, not just the wall: the same wall takes about 94 of these, 100 of the modular brick, and about 104 of the 230 × 110 × 70 mm brick.
          </p>
        </Prose>

        <Prose title="Why the joint matters">
          <p>
            A brick is never laid tight against its neighbour. IS 2212:1991 says no bed joint is thicker than 12 mm, and its own check — four courses and three joints measuring 39 cm for modular brick — works out to a 10 mm joint, which is the figure used here.
          </p>
          <Formula>Bricks in 1 m² = (wall thickness + 10 mm) ÷ ((L + 10) × (W + 10) × (H + 10)) with every size in metres</Formula>
          <p>
            A mason who lays fat 15 to 20 mm joints to stretch the bricks uses fewer bricks than this count, and the extra mortar is weaker and cracks more. A thin, even joint is what the count assumes.
          </p>
        </Prose>

        <Prose title="Taking out doors and windows">
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
        </Prose>

        <Prose title="Worked example: a 10 m × 3 m outer wall">
          <p>
            A wall 10 m long and 3 m high, one red brick thick, with no openings, has an area of 30 m². At about 94.1 bricks to each square metre:
          </p>
          <Formula>30 m² × 94.1 bricks per m² = 2,824 bricks → order 2,965 to 3,106 with 5% to 10% breakage</Formula>
          <p>
            Put a 0.9 × 2.1 m door in that wall and take out 1.9 m², and 28.1 m² is left, which is 2,645 bricks before breakage. The same wall of modular brick takes exactly 3,000; of 230 × 110 × 70 mm brick, 3,125.
          </p>
        </Prose>

        <Prose title="How much to order on top">
          <p>
            No standard gives a breakage figure. The MasonryPro report allows 5% for a plain, straight wall, and this page shows 10% as the figure for a wall with a lot of cutting, such as many corners and small openings. They are stated assumptions, not rules; if your supplier delivers a lot of cracked bricks, count what arrives.
          </p>
        </Prose>
      </article>

      <CalcFaq items={BRICK_CONTENT.faq} />
      <RelatedLinks path="/tools/brick-calculator" />

      <Chips codes={['IS 1077:1992', 'IS 12894:2002', 'IS 2212:1991', 'IS 1200 (Part 3):1976']} />
      <CalcFine>
        For planning and for checking an order. The count is for one straight wall of the brick and thickness you choose, with a {MORTAR_JOINT_MM} mm joint. Block masonry, other brick sizes and bonds that change the thickness give different counts. Cement and sand are for the joint mortar only; plaster is not included. Not a substitute for measurement on site by the person who will build.
      </CalcFine>
    </CalcPage>
  )
}

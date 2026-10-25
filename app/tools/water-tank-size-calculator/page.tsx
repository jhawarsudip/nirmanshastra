'use client'

import { useMemo, useState } from 'react'
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

const HELP: Record<WaterSource, string> = {
  municipal:
    'The town supply fills an underground tank, and a pump lifts the water to a tank on the roof. If the supply does not run every day, choose Tanker, which holds more underground, and ask for an overhead tank of at least half a day’s water (IS 2065 cl 11.11).',
  borewell:
    'A borewell pump can fill the roof tank whenever it is needed, so there is no underground tank: one overhead tank holds half a day’s water.',
  tanker:
    'A tanker comes in lots, so the underground tank holds a day and a half of water and the roof tank a third of a day.',
}

export default function WaterTankSizeCalculatorPage() {
  const [people, setPeople] = useState('5')
  const [water, setWater] = useState<WaterSource>('municipal')

  const n = Math.max(0, Math.floor(parseFloat(people || '0') || 0))
  const r = useMemo(() => calculate({ people: n, water }), [n, water])
  const valid = n > 0
  const share = SHARES[water]
  const text = SHARE_TEXT[water]
  const built = r.ugt !== null && r.ugt.kind.startsWith('built')

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Water Tank Size Calculator"
        blurb="Find the size of the underground and overhead tanks for a house. Say how many people live there and where the water comes from; the day’s water use, the share each tank holds and the ready-made size to buy follow."
      />
      <QuickAnswer content={TANK_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The household</CalcLabel>
            <div className="ns-i-fields">
              <Field id="wt-people" label="How many people live in the house?" wide hint="Count everyone who lives there. If you are not sure, take the number of bedrooms plus three. For a block of flats, add up all the homes.">
                <Input type="number" inputMode="numeric" min={1} step="1" value={people} onChange={(e) => setPeople(e.target.value)} placeholder="0" />
              </Field>
              <Field id="wt-src" label="Where does the water come from?" wide hint={HELP[water]}>
                <Select value={water} onChange={(e) => setWater(e.target.value as WaterSource)}>
                  {SOURCE_ORDER.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
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
                k="Water the house uses in a day"
                v={num(r.dailyDemandL, 0)}
                unit="litres"
                sub={`${num(r.people, 0)} ${r.people === 1 ? 'person' : 'people'} × ${r.lpcd} litres`}
              />
              <Figures
                items={[
                  ...(r.ugt ? [{ k: `Underground tank · ${num(r.ugt.neededL, 0)} L needed`, v: show(r.ugt), unit: 'L', tone: 'ok' as const }] : []),
                  { k: `Overhead tank · ${num(r.oht.neededL, 0)} L needed`, v: show(r.oht), unit: 'L', tone: 'ok' as const },
                ]}
              />
              {!r.ugt ? (
                <Note kind="info" title="No underground tank">
                  With a borewell the pump fills the overhead tank when it is needed, so one tank on the roof is enough.
                </Note>
              ) : null}
              {built ? (
                <Note kind="info" title="Too big for a ready-made tank" foot="Ready-made tanks stop at 5,000 litres">
                  An underground tank of this size is usually built in concrete or masonry. The {num(r.ugt!.each, 0)} litres is its inside volume, measured to the working water level.
                </Note>
              ) : null}
              {r.oht.count > 1 ? (
                <Note kind="info" title="Overhead water in several tanks">
                  The roof holds {r.oht.count} ready-made tanks of {num(r.oht.each, 0)} litres each, because no single ready-made tank is large enough.
                </Note>
              ) : null}

              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Water used in a day', detail: `${num(r.people, 0)} × ${r.lpcd} litres`, value: `${num(r.dailyDemandL, 0)} L` },
                  ...(r.ugt
                    ? [
                        { label: 'Underground tank, need', detail: text.ugt, value: `${num(r.ugt.neededL, 0)} L`, tone: 'dim' as const },
                        { label: 'Underground tank, to buy', detail: r.ugt.kind, value: `${num(r.ugt.totalL, 0)} L`, tone: 'ok' as const },
                      ]
                    : []),
                  { label: 'Overhead tank, need', detail: text.oht, value: `${num(r.oht.neededL, 0)} L`, tone: 'dim' },
                  { label: 'Overhead tank, to buy', detail: r.oht.count > 1 ? `${r.oht.count} × ${num(r.oht.each, 0)} L, ${r.oht.kind}` : r.oht.kind, value: `${num(r.oht.totalL, 0)} L`, tone: 'ok' },
                  { label: 'Tanks to buy, together', detail: 'both tanks, rounded up', value: `${num(r.totalL, 0)} L` },
                ]}
              />
              <p className="ns-calc-help">
                Each tank is rounded up to the next size that is sold ({STANDARD_TANK_SIZES.map((s) => num(s, 0)).join(', ')} litres), never down. These are the common ready-made sizes; no standard lists them, so check what your supplier stocks.
              </p>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the number of people to see the water the house uses in a day and the size of each tank.</p>
          )
        }
      />

      <CalcCta
        kicker="Planning the whole plumbing?"
        text="This page sizes the tanks. PlumbingPro counts the rest from your plan: the supply pipe floor by floor, the drain and soil pipes, every fitting, the pump, and the septic tank and soak pit when there is no sewer."
        href="/tools/plumbpro"
        label="Open PlumbingPro"
      />

      <CalcSection title="Tanks for a household" sub="The tanks this calculator gives for each household size, by where the water comes from. Litres.">
        <ReportTable
          head={['People', 'Water a day', 'Piped: underground', 'Piped: overhead', 'Borewell: overhead', 'Tanker: underground', 'Tanker: overhead']}
          sticky
          num={[0, 1, 2, 3, 4, 5, 6]}
          rows={[2, 4, 5, 6, 8, 10, 12, 20].map((p) => {
            const m = calculate({ people: p, water: 'municipal' })
            const b = calculate({ people: p, water: 'borewell' })
            const t = calculate({ people: p, water: 'tanker' })
            return [
              String(p),
              `${num(m.dailyDemandL, 0)} / ${num(b.dailyDemandL, 0)}`,
              show(m.ugt!),
              show(m.oht),
              show(b.oht),
              show(t.ugt!),
              show(t.oht),
            ]
          })}
        />
        <p className="ns-r-tblnote">
          Water a day is shown for piped or tanker water ({WATER_DEMAND_LPCD.municipal} litres a person) and then for a borewell ({WATER_DEMAND_LPCD.borewell} litres). The sizes are the smallest ready-made tank that holds the need; a built tank or several tanks appear in the larger rows where one ready-made tank is not enough.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="How much water a house uses">
          <p>
            IS 1172:1993, the Indian standard for water supply in buildings, puts the water a person uses at <strong>135 litres a day</strong> in a house with flushing toilets: about 45 litres for flushing, and 90 for everything else. That 90 is roughly 5 for drinking, 5 for cooking, 30 for bathing, 25 for washing clothes and 25 for washing utensils and floors.
          </p>
          <p>
            Towns of over a lakh people are given 150 to 200 litres. This calculator uses <strong>150 litres</strong> for a house on its own borewell, the lowest figure of that range. The standard sets demand by the size of the town, not by the kind of source, so the borewell figure is a choice the calculator makes. If your household uses more, enter more people.
          </p>
        </Prose>

        <Prose title="Two tanks, and what each holds">
          <p>
            A house on piped supply usually has two tanks: an <strong>underground tank</strong> that fills when the town water comes, and an <strong>overhead tank</strong> on the roof that a pump keeps filled and that feeds the taps by gravity. The NBC Part 9 Section 1 draft (the BIS preliminary draft of November 2024, which carries the older IS 12183 and IS 2065 rules) splits the day’s water between them:
          </p>
          <ul>
            {SOURCE_ORDER.map((s) => (
              <li key={s}>
                <strong>{s === 'municipal' ? 'Piped supply' : s === 'borewell' ? 'Borewell' : 'Tanker'}</strong>:{' '}
                {SHARES[s].ugt > 0 ? `underground ${SHARE_TEXT[s].ugt}, overhead ${SHARE_TEXT[s].oht}.` : `overhead only, ${SHARE_TEXT[s].oht}.`}
              </li>
            ))}
          </ul>
          <p>
            The draft allows an overhead tank alone to hold one-third to one-half of a day; the calculator takes the half. For a tanker the draft’s apartment clause does not say plainly which tank holds which part, so the split above is a reading, not a quotation. The printed NBC 2016 may differ from the draft. Water kept back for fire fighting is not counted; IS 12183 sends that to NBC Part 4.
          </p>
        </Prose>

        <Prose title="Rounding up to a tank you can buy">
          <p>
            Ready-made tanks come in set sizes, commonly {STANDARD_TANK_SIZES.map((s) => num(s, 0)).join(', ')} litres. No Indian Standard lists those sizes, so the list is an assumption. The calculator always rounds up: a tank that is a little too big costs a little more, and one that is too small runs dry.
          </p>
          <p>
            Above 5,000 litres underground, the tank is usually built, so the calculator gives the inside volume rounded up to the next 500 litres. Above 5,000 litres overhead, it gives equal ready-made tanks.
          </p>
        </Prose>

        <Prose title="Worked example: five people on piped supply">
          <p>
            Five people use 5 × 135 = 675 litres a day. The underground tank takes two-thirds of that and the overhead tank a third:
          </p>
          <Formula>675 × ⅔ = 450 L → buy 500 L underground · 675 × ⅓ = 225 L → buy 500 L overhead</Formula>
          <p>
            On a borewell the same five people use 5 × 150 = 750 litres, and the single overhead tank holds half: 375 litres, so a 500 litre tank. If the water comes by tanker, the underground tank has to hold a day and a half, 5 × 135 × 1.5 = 1,013 litres, which rounds up to a 1,500 litre tank, with a 500 litre tank on the roof.
          </p>
        </Prose>
      </article>

      <CalcFaq items={TANK_CONTENT.faq} />
      <RelatedLinks path="/tools/water-tank-size-calculator" />

      <Chips codes={['IS 1172:1993', 'IS 2065:1983', 'IS 12183 (Part 1):1987', 'NBC Part 9 (draft)']} />
      <CalcFine>
        For planning. Tank sizes follow the NBC Part 9 Section 1 preliminary draft and common ready-made sizes, and the real need depends on how the household lives, on gardens and on how reliable the supply is. The tanks for a building are sized by the plumbing designer. Not a substitute for that.
      </CalcFine>
    </CalcPage>
  )
}

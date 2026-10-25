'use client'

import { useMemo, useState } from 'react'
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
  const [choice, setChoice] = useState<WireChoice>('lights')
  const [kwText, setKwText] = useState('7.5')
  const [phase, setPhase] = useState<Phase>('single')

  const kw = Math.max(0, parseFloat(kwText || '0') || 0)
  const mains = choice === 'mains'
  const valid = !mains || kw > 0
  const r = useMemo(() => calculate({ choice, kw, phase }), [choice, kw, phase])
  const hint = mains
    ? 'The load the home could draw at once. If you do not know it, take 75 watts for every m² of floor: a 100 m² home is 7.5 kW. Your electricity board’s sanctioned load is the other number to use.'
    : CIRCUIT_RULES[choice as Exclude<WireChoice, 'mains'>].examples

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Wire Size Calculator"
        blurb="Find the least copper wire for a circuit in a home: lights, sockets, a geyser, an air conditioner, or the supply from the meter. Pick what you are wiring, and the size, the breaker, the cable set and the conduit follow."
      />
      <QuickAnswer content={WIRE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>What you are wiring</CalcLabel>
            <div className="ns-i-fields">
              <Field id="ws-circuit" label="Which circuit?" wide hint={hint}>
                <Select value={choice} onChange={(e) => setChoice(e.target.value as WireChoice)}>
                  {CHOICE_ORDER.map((c) => (
                    <option key={c} value={c}>{choiceLabel(c)}</option>
                  ))}
                </Select>
              </Field>
              {mains ? (
                <>
                  <Field id="ws-kw" label="Load of the home, in kW">
                    <Input type="number" inputMode="decimal" min={0} step="0.5" value={kwText} onChange={(e) => setKwText(e.target.value)} placeholder="0" />
                  </Field>
                  <Field id="ws-phase" label="Supply">
                    <Select value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
                      <option value="single">Single-phase</option>
                      <option value="three">Three-phase</option>
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
              <Big k="Least copper wire" v={String(r.mm2)} unit="mm²" sub={r.label} />
              <Figures
                items={[
                  { k: mains ? 'Main breaker, usually' : 'Breaker', v: r.mcb, tone: 'ok' },
                  { k: 'Conduit', v: String(r.conduitMm), unit: 'mm' },
                ]}
              />
              {r.status === 'assumed' ? (
                <Note kind="warn" title="This size is an assumption" foot="Where the draft IS 4648 gives no figure">
                  {r.source}
                </Note>
              ) : null}
              {r.beyondDraft ? (
                <Note kind="info" title="A home this large needs a designer">
                  Above {DRAFT_MAINS_LIMIT_KW} kW the supply is designed for the load, with diversity, the cable’s current rating, derating, and one size up. Take the size above as a guide only.
                </Note>
              ) : null}

              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Copper wire', detail: 'least size', value: mm(r.mm2), tone: 'ok' },
                  { label: 'Cable set', detail: '', value: r.cable },
                  { label: 'Earth wire', detail: 'same size up to 16 mm²', value: mm(r.earthMm2) },
                  { label: mains ? 'Main breaker' : 'Breaker', detail: mains ? 'usual' : 'for this wire', value: r.mcb },
                  { label: 'Conduit', detail: 'CPWD analysis', value: `${r.conduitMm} mm` },
                  { label: 'Colours', detail: 'CPWD GS 3.5', value: r.colours },
                ]}
              />
              <p className="ns-calc-help">
                <strong>Basis.</strong> {r.source} {r.limit}
              </p>
              <p className="ns-calc-help">
                <strong>Below this size.</strong> {r.risk}
              </p>
              <Note kind="info" title="This is the least size, not the size for every run">
                A long cable loses voltage and needs a larger wire than the minimum. This calculator does not work out the voltage drop, so ask the electrician about a long run, such as to an outhouse or a far corner of a big house.
              </Note>
            </>
          ) : (
            <p className="ns-calc-empty">Enter the load of the home in kW to see the size of the supply cable.</p>
          )
        }
      />

      <CalcCta
        kicker="Wiring the whole home?"
        text="This page sizes the wire for one circuit. ElectricalPro counts the rest from your plan: the points room by room, the circuits and boards, every size of wire by colour, the conduit, the accessories and the earthing."
        href="/tools/electropro"
        label="Open ElectricalPro"
      />

      <CalcSection title="Wire for each circuit" sub="The least copper size and the breaker that goes with it. Every circuit also carries an earth wire of the same size.">
        <ReportTable
          head={['Circuit', 'Copper', 'Breaker', 'Where it comes from']}
          num={[1, 2]}
          rows={CIRCUIT_ROWS.map((c) => [c.label, mm(c.mm2), c.mcb, c.key === 'lights' ? 'CPWD GS 3.12 and draft IS 4648' : BASIS[c.status]])}
        />
        <p className="ns-r-tblnote">
          Lights, fans and the bell use 1.5 mm², the same as CPWD asks for light wiring. For sockets, CPWD asks for 4 mm² on power wiring in its own works, and the draft IS 4648 allows 2.5 mm², which is the figure used here.
        </p>
      </CalcSection>

      <CalcSection title="Supply cable by load" sub="The cable from the meter to the main board follows the load of the home, not a fixed size.">
        <ReportTable
          head={['Single-phase load', 'Copper', 'Where it comes from']}
          labelRow
          num={[1]}
          rows={bands('single').map((b) => [b.range, mm(b.mm2), BASIS[b.status]])}
        />
        <p className="ns-r-tblnote">
          Three-phase supply: {bands('three').map((b) => `${lower(b.range)} ${mm(b.mm2)}`).join(', ')}. These three-phase sizes are assumptions; the draft IS 4648 only hints at them.
        </p>
      </CalcSection>

      <article className="ns-calc-articles">
        <Prose title="How wire is sized in a home">
          <p>
            A wire has to carry its current without getting hot, and over a long run it must not lose too much voltage. For the wiring of a home, two documents set the <strong>least</strong> size for each kind of circuit: the CPWD General Specifications for Electrical Works (Part I, Internal, 2013), and the BIS <strong>draft</strong> of IS 4648, the guide to the electrical layout of residential buildings (the first revision, drafted in September 2024). The draft is not yet a published standard, so its figures may change when it is issued.
          </p>
          <p>
            The least size is a floor. For loads above 10 kW the draft sends the designer to the current-rating tables of IS 732, with a derating factor and a size up; this page does not read those tables, and so it does not size a large supply.
          </p>
        </Prose>

        <Prose title="Why the supply cable follows the load">
          <p>
            Lights, sockets and an air conditioner each have a job and a limit on the circuit, so each has one size. The cable that brings power into the home carries <em>all</em> of them at once, so its size depends on how much the home can draw. The draft sets a minimum design load of <strong>75 watts for every m²</strong> of floor, and gives the supply cable for single phase as 4 mm² up to 5 kW, 6 mm² over 5 up to 7 kW, and 10 mm² over 7 up to 10 kW.
          </p>
          <Formula>100 m² × 75 W = 7,500 W = 7.5 kW → over 7 up to 10 kW → 10 mm² copper</Formula>
          <p>
            The draft’s table leaves out exactly 7 kW, because its two bands read “over 5 and under 7” and “over 7 and under 10”. This calculator puts 7 kW with the 6 mm² band. Your electricity board fixes the sanctioned load and whether the supply is single or three phase, and its rules decide the cable.
          </p>
        </Prose>

        <Prose title="Sockets: 2.5 mm² or 4 mm²">
          <p>
            The two sources differ here. CPWD’s specification asks for <strong>4 mm²</strong> on power wiring in its own works, and 1.5 mm² on light wiring. The draft IS 4648 allows <strong>2.5 mm²</strong> from the board to a circuit of up to two sockets or one appliance of up to 3 kW, and 4 mm² for one air conditioner of 2 to 3 TR (a point of up to 5 kW).
          </p>
          <p>
            This calculator follows the draft, so it gives 2.5 mm² for sockets. If the circuit runs a long way, or you want room for heavier appliances later, 4 mm² gives more room in a wall that is wired only once.
          </p>
        </Prose>

        <Prose title="What this page does not work out">
          <p>
            It gives the least size for each kind of circuit. It does not read the current ratings of cables, the derating for cables run together in one conduit, or the voltage drop, because no document read for this page gives those figures. It sizes copper only, as CPWD asks, and does not size aluminium, an earth electrode or the cable for an EV charger.
          </p>
        </Prose>
      </article>

      <CalcFaq items={WIRE_CONTENT.faq} />
      <RelatedLinks path="/tools/wire-size-calculator" />

      <Chips codes={['CPWD GS Electrical Part I 2013', 'IS 4648 (draft revision, 2024)', 'CPWD DAR E&M 2016']} />
      <CalcFine>
        For planning. The sizes are the least that CPWD’s specification and the BIS draft of IS 4648 give, and the draft may change before it is published. The wire a home needs depends on its load, the length of each run and the supply rules of your electricity board. The electrician’s design decides the cable. Not a substitute for that.
      </CalcFine>
    </CalcPage>
  )
}

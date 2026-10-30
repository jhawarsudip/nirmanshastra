import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { TOOLS } from '@/lib/v2/content'

/*
  Check a contractor's quantities. A guide, not a calculator: the comparison itself runs inside the paid StructurePro report
  (it needs the quantities of the visitor's own frame). Nothing on this page is a rupee figure or a rate.
  The five verdicts below are the same five that app/tools/structopro/components/QuoteCheck.tsx uses (lib/structopro-qty/quoteCheck.ts).
*/

const TOOL = TOOLS.find(t => t.key === 'struct')!

export default function CompareQuotePage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Check a quote"
          name="Check a contractor’s quantities"
          blurb="Two quotes mean nothing until you know what each one counts. Ask for four quantities, then set them beside what the Indian Standards need for your frame."
        />

        <section className="ns-plate ns-r-sec" aria-labelledby="cq-ask-t">
          <h2 id="cq-ask-t" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>Ask for these four figures</h2>
          <p className="ns-r-sec__sub">Any contractor or engineer who has priced your frame has worked these out. If they cannot give you the quantity behind a price, that is the first thing to learn.</p>
          <ReportTable
            head={['Material', 'Unit it is quoted in', 'What to ask for']}
            rows={[
              ['Concrete', 'cubic metres (m³) or cubic feet (cft)', 'The volume member by member: footings, columns, beams, slabs, stairs. One cubic metre is about 35.3 cubic feet.'],
              ['Steel', 'kilograms, quintals (100 kg) or tonnes', 'The bar bending schedule, which lists every bar by member, diameter, length and weight. Ask whether the total is the steel in the drawing or the steel to be ordered, which has cutting waste on top.'],
              ['Cement', '50 kg bags', 'The concrete mix assumed (M20, M25) and the bags allowed for each cubic metre of it.'],
              ['Shuttering', 'square feet or square metres of contact area', 'The area worked out for each member, and how many times the plates are expected to be reused.'],
            ]}
          />
        </section>

        <section className="ns-plate ns-r-sec" aria-labelledby="cq-read-t">
          <h2 id="cq-read-t" style={{ fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 }}>How a figure is read</h2>
          <p className="ns-r-sec__sub">Your StructurePro report gives each quantity with a range around it. The check places the contractor&rsquo;s figure against that range and against the range found in real buildings. It never says anyone overcharged: every answer is a question to ask.</p>
          <ReportTable
            head={['Reads as', 'It means', 'What to do']}
            rows={[
              ['Low', 'Below the lowest this frame should need.', 'Ask whether something is left out, such as the staircase, lintels, balcony slabs or foundations, or whether a smaller building was priced.'],
              ['Close', 'From the low end of the range up to about 10% above the code figure.', 'In line with a frame designed to the Indian Standards. Built houses usually use a little more, so this is normal.'],
              ['Common', 'Above the code figure but inside the range real buildings fall in.', 'Site practice adds margin that no code asks for. Ask how much is built in and where.'],
              ['High', 'Above everything we would expect for this frame.', 'Ask for the working behind it. Check the scope: this report counts the reinforced-concrete frame only, not a boundary wall, a tank or a septic tank.'],
              ['Unit?', 'More than four times, or less than a quarter of, the report figure.', 'Almost always a unit slip: cubic feet read as cubic metres, or quintals as kilograms. Check the unit, then ask what the figure covers.'],
            ]}
          />
          <p className="ns-r-tblnote">
            The range for real buildings comes from a published study of 26 residential buildings completed since 2020, with quantities taken from their Bills of Quantities: GKSPL, Building the Baseline: Embodied Carbon in India&rsquo;s Urban Housing, v1, March 2026, as reported by Conserve Consultants, 29 April 2026. The study does not publish how many buildings fell in each class, so the range is orientation, not a prediction for your house.
          </p>
        </section>

        <section className="ns-plate ns-r-next" aria-labelledby="cq-go-t">
          <p className="ns-r-hook__k">Do it for your own house</p>
          <h2 id="cq-go-t" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>The check sits at the bottom of your StructurePro report</h2>
          <p>It needs the quantities of your own frame, so it is part of the {TOOL.price} StructurePro report. Get the report, then type your contractor&rsquo;s concrete, steel, cement and shuttering figures into the panel. It runs in your browser; nothing you type is sent or stored.</p>
          <Link href={TOOL.href} className="ns-btn">Get my frame&rsquo;s quantities<IcArrow width={22} height={11} /></Link>
        </section>

        <Note>This covers the reinforced-concrete frame only. It is not a quotation, a price check or a structural approval. For the final bar bending schedule, go to the structural engineer who signs your drawings.</Note>
      </div>
    </div>
  )
}

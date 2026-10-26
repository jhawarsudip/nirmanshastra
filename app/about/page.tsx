import Link from 'next/link'
import '@/styles/v2/results.css'
import { ToolHead, Note, IcArrow } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import { TOOLS } from '@/lib/v2/content'
import { TOOL_PRICE_PAISE, PRICE } from '@/lib/tool-pricing'
import { inr, REVIEW_FACT } from '@/lib/seo/site'
import Founder from '@/components/v2/Founder'

/*
  About. Written to say only what is true:
   - the product gives quantities and sets no prices of its own (a visitor may type their own rates to see the material cost);
   - the founder's name is private; the credential shown is the line in lib/founder.ts (B.Tech Civil, NIT; formerly at a leading
     real estate construction company), with the photo slot there left empty until an image is supplied;
   - the calculations have not been independently reviewed by a structural engineer (REVIEW_FACT in lib/seo/site.ts).
  Prices come from lib/tool-pricing.ts, never typed here.
*/

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

const counts: Record<string, string> = {
  struct: 'Concrete, steel, cement, sand, aggregate and shuttering for the reinforced-concrete frame: footings, columns, beams, slabs, stairs, balconies and an open parking floor.',
  mason: 'Bricks or blocks, mortar, plaster and lintels for the walls.',
  elec: 'Points, wire by size, conduit, switches, boards and circuits.',
  plumb: 'Water and drain pipe, fittings, tanks, pump, septic tank and soak pit.',
  int: 'Paint, putty, tiles, false ceiling, doors, windows and plywood.',
}

export default function AboutPage() {
  const paid = TOOLS.filter(t => !t.free)
  const priceOf: Record<string, number> = {
    struct: TOOL_PRICE_PAISE.structopro, mason: TOOL_PRICE_PAISE.masonpro, elec: TOOL_PRICE_PAISE.electropro,
    plumb: TOOL_PRICE_PAISE.plumbpro, int: TOOL_PRICE_PAISE.interiorpro,
  }
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="About"
          name="Quantities, worked out in the open"
          blurb="NirmanShastra tells you how much of each material a house needs, before you order or sign. It does not tell you what anything costs, and that is on purpose."
        />

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="ab-why">
          <h2 id="ab-why" style={H2}>Why it exists</h2>
          <p>A homeowner in India is usually handed a rate per square foot and little else. Behind any rate sits a list of quantities: cubic metres of concrete, kilograms of steel, bags of cement, bricks, metres of wire and pipe. The quantities are what can be checked against the Indian Standards. A rate cannot.</p>
          <p>So NirmanShastra works out the quantities first. We put no prices of our own on them, because prices change by town, by month and by who you buy from, and because a price laid over a wrong quantity is worse than no number at all. If you want the rupees, you can type the rates your dealer quotes into a report and it multiplies them by the quantities; labour, transport and taxes are not included.</p>
        </section>

        <section className="ns-plate ns-r-sec" aria-labelledby="ab-what">
          <h2 id="ab-what" style={H2}>What you get</h2>
          <p className="ns-r-sec__sub">You answer a few plain questions about the plot and the plan. The quantities are worked out on our server, to the Indian Standards, and shown with a range around each one. Free calculators cover single questions such as the bricks in a wall or the size of a water tank.</p>
          <ReportTable
            head={['Report', 'What it counts', 'Price']}
            rows={[
              ...paid.map(t => [t.name, counts[t.key], inr(priceOf[t.key])]),
              ['Grand Total', 'The five reports together, with the overlaps counted once.', `${inr(TOOL_PRICE_PAISE.grandtotal)} add-on, or included in the pack`],
              ['Complete House Pack', 'All five reports and the Grand Total, for one house, in one purchase.', `${PRICE.pack} (${PRICE.packSeparate} bought one by one)`],
            ]}
          />
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="ab-sure">
          <h2 id="ab-sure" style={H2}>How sure it is, and what it cannot tell you</h2>
          <p>Every quantity comes with a low and a high figure, because a few answers cannot fix every dimension of a building. Real buildings also use more steel and concrete than a code minimum, so the StructurePro report sets its figures beside what 26 published bills of quantities show.</p>
          <p>Every standard a report relies on is named on the <Link href="/is-codes-used" style={{ textDecoration: 'underline' }}>IS Codes Used</Link> page, with what we take from it. Where we could not read a standard in full, or a figure is our assumption, that page says so.</p>
        </section>

        <section aria-labelledby="ab-who" style={{ display: 'grid', gap: 14 }}>
          <h2 id="ab-who" style={H2}>Who builds it</h2>
          <Founder
            more={<>NirmanShastra is built and run by one person, with no outside funding. The founder spent a little over a year as a site engineer before moving to other work. {REVIEW_FACT} Your project details are not sold to contractors, builders or material suppliers; the <Link href="/privacy-policy" style={{ textDecoration: 'underline' }}>privacy policy</Link> has the exact terms.</>}
          />
        </section>

        <Note kind="warn" title="Not a structural design">
          A NirmanShastra report is for planning and for asking better questions. It is not a drawing, an approval or a quotation. Have the engineer who signs your drawings give the final bar bending schedule and confirm the earthquake zone for your town.
        </Note>

        <section className="ns-plate ns-r-next" aria-labelledby="ab-go">
          <p className="ns-r-hook__k">Start</p>
          <h2 id="ab-go" style={{ margin: 0, fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(21px, 2.2vw, 28px)' }}>See the frame of your house first</h2>
          <p>The StructurePro form takes a few minutes, and you see your house in 3D before you pay. Already have a quote? <Link href="/compare-quote" style={{ textDecoration: 'underline' }}>Check what it counts</Link>.</p>
          <Link href="/tools/structopro" className="ns-btn">Start with StructurePro<IcArrow width={22} height={11} /></Link>
        </section>
      </div>
    </div>
  )
}

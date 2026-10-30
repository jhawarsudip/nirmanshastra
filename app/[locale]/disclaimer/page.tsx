import { Link } from '@/i18n/navigation'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { REVIEW_NOTE, REVIEW_FACT } from '@/lib/seo/site'
import { CONTACT_EMAIL } from '@/lib/site-contact'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function DisclaimerPage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal"
          name="Disclaimer"
          blurb="NirmanShastra works out material quantities from a few answers. It is not a structural engineering service, and it sets no prices of its own: rupees appear only if you type in your own rates."
        />

        <Note kind="warn" title="Read before you rely on a report">
          No output from NirmanShastra is a structural design, an approval, an engineering certificate or a building plan submission.
        </Note>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-1">
          <h2 id="dc-1" style={H2}>1. Structural engineering</h2>
          <p>The sizes of columns, beams, slabs and footings behind a StructurePro report, and the steel and concrete that follow from them, are worked out to the Indian Standards so that the quantities can be counted. They are typical for the floors, area, earthquake zone and soil you entered. They are not a structural design.</p>
          <p>The sizes, reinforcement and concrete grades for your building must be decided by a licensed structural engineer who has:</p>
          <ul>
            <li>reviewed or carried out an investigation of the soil at your site;</li>
            <li>confirmed the earthquake zone and soil type there;</li>
            <li>prepared drawings with column schedules, reinforcement details and the foundation design; and</li>
            <li>certified the design under their professional registration.</li>
          </ul>
          <p><b>Before any construction, a licensed structural engineer must review and certify the design for your site.</b> NirmanShastra is not liable for any construction outcome based on its reports.</p>
          <p>{REVIEW_NOTE} {REVIEW_FACT}</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-2">
          <h2 id="dc-2" style={H2}>2. Quantities and ranges</h2>
          <p>Every quantity is an estimate. A few answers cannot fix every dimension of a building, so each quantity is shown with a low and a high figure, and the true quantity for your building can fall outside them. Real buildings usually use more steel and concrete than a code minimum.</p>
          <p>A report is only as good as the answers behind it. Each report lists what it assumed and what it left out. Check that list against your plan before you order, and ask your engineer for the final bar bending schedule.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-3">
          <h2 id="dc-3" style={H2}>3. Indian Standards</h2>
          <p>The reports use the editions of the Indian Standards named on the <Link href="/is-codes-used">IS Codes Used</Link> page, published by the Bureau of Indian Standards (BIS). Standards are revised, and a newer edition may differ. Where a report could not read a standard in full, used a published draft, or took a figure as an assumption, that page and the report say so.</p>
          <p>The earthquake zone is read from a town table and may differ from the current map for some towns. Confirm the zone for your site with a local structural engineer.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-4">
          <h2 id="dc-4" style={H2}>4. Quantities first, and rupees only at your own rates</h2>
          <p>The NirmanShastra reports for homeowners are quantity reports. They contain no material rates, labour costs, dealer prices or contractor rates of ours, and nothing in a report says what your building should cost.</p>
          <p>Every paid report has an optional panel, “Want this in rupees? Enter your local rates.” If you type rates there, the page multiplies each quantity by the rate you typed and shows the result as “Material cost at the rates you entered. Labour, transport and taxes are not included.” The rates are yours: we do not supply, check or update them, and the figure is not a quotation, a bid or an estimate of what the house will cost. A “typical” range beside a box, where there is one, is only a guide with the date it was last updated; ask your dealer for today’s rate. The PDF carries the rupee table only if you typed rates and asked for it. Any other rupee figure on this site is the price of a report or of a downloadable template.</p>
          <p>The Excel toolkits are for contractors and site engineers, and they work differently: the Residential Construction Cost Estimator, for one, prices a house from the rates the contractor enters. Those rates are the contractor’s own, not NirmanShastra’s.</p>
          <p>The free payroll, running-account bill and earned-value calculators work only on the figures you type in.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-5">
          <h2 id="dc-5" style={H2}>5. VastuPro</h2>
          <p>VastuPro reads a plan against rules taken from the traditional Vastu Shastra texts and from what teachers commonly teach today; each finding says which. Some rules are modern conventions with no basis in the old texts, and the teachers differ on several. Vastu Shastra is a traditional architectural practice, not a science with controlled empirical validation. NirmanShastra makes no claim about the measurable effect of following or not following Vastu on any person, household or outcome. VastuPro is offered for information and planning only.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="dc-6">
          <h2 id="dc-6" style={H2}>6. General</h2>
          <p>NirmanShastra is not responsible for errors that arise from incorrect answers, changes in local rules, site conditions the answers did not cover, or events outside its control.</p>
          <p>Using the site means you accept the <Link href="/terms-of-use">Terms of Use</Link> and the <Link href="/privacy-policy">Privacy Policy</Link>. Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </section>
      </div>
    </div>
  )
}

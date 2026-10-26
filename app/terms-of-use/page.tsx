import Link from 'next/link'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import { TOOL_PRICE_PAISE, PRICE } from '@/lib/tool-pricing'
import { inr } from '@/lib/seo/site'

// Last changed when the site became quantity-only. A fixed date, so the page does not say "today" every time it is built.
const UPDATED = '25 October 2026'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function TermsOfUsePage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal"
          name="Terms of Use"
          blurb={`By using NirmanShastra you agree to these terms. If you do not agree, please do not use the service. These terms are governed by Indian law. Last updated ${UPDATED}.`}
        />

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-1">
          <h2 id="tu-1" style={H2}>1. What NirmanShastra provides</h2>
          <p>NirmanShastra provides tools that work out material quantities for residential projects in India, using the Indian Standards (IS codes) published by the Bureau of Indian Standards (BIS). The quantities are worked out from the answers you give.</p>
          <p>NirmanShastra is a quantity estimation tool. It is not:</p>
          <ul>
            <li>a licensed structural engineering service;</li>
            <li>a substitute for site-specific structural design by a qualified engineer;</li>
            <li>a quotation, or a statement of what anything costs;</li>
            <li>a substitute for a soil investigation; or</li>
            <li>a replacement for local municipal approvals and building plan sanction.</li>
          </ul>
          <p>Estimates are for planning, and for checking the quantities in a contractor&rsquo;s quote. Construction must be designed, supervised and certified by a licensed structural engineer registered with the relevant state or central authority.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-2">
          <h2 id="tu-2" style={H2}>2. Payment and refunds</h2>
          <p>Current prices:</p>
          <ul>
            <li>VastuPro and the free calculators: free, no payment needed</li>
            <li>ElectricalPro and PlumbingPro: {inr(TOOL_PRICE_PAISE.electropro)} a report</li>
            <li>MasonryPro: {inr(TOOL_PRICE_PAISE.masonpro)} a report</li>
            <li>InteriorPro: {inr(TOOL_PRICE_PAISE.interiorpro)} a report</li>
            <li>StructurePro: {inr(TOOL_PRICE_PAISE.structopro)} a report</li>
            <li>Grand Total Report, which puts the phase reports you have already bought into one buying list: {inr(TOOL_PRICE_PAISE.grandtotal)}, on top of those reports, or included in the Complete House Pack</li>
            <li>Complete House Pack, which unlocks all five reports and the Grand Total for one house: {PRICE.pack} (bought one by one they cost {PRICE.packSeparate})</li>
          </ul>
          <p>Payments are processed by Razorpay and are subject to its terms. NirmanShastra does not store your payment card details.</p>
          <p><b>Refunds.</b> Once a PDF report has been generated and delivered to your registered email, the payment is not refundable. The quantities are worked out and the PDF is generated at the time of payment, so there is nothing to return. If a PDF fails to generate because of a technical fault on our side and cannot be delivered within 48 hours of payment, we will refund you in full. To ask for a refund for a failed delivery, email <a href="mailto:nirmanshastraindia@gmail.com">nirmanshastraindia@gmail.com</a> within 7 days of payment.</p>
          <p><b>Excel Site Templates.</b> The Excel files sold at <Link href="/site-templates">/site-templates</Link> have their own licence, delivery and refund terms: see the <Link href="/site-templates/terms">Site Templates Terms and Licence</Link>.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-3">
          <h2 id="tu-3" style={H2}>3. Accuracy of estimates</h2>
          <p>NirmanShastra quantities are worked out from the Indian Standards and the answers you provide. How close a quantity is to what your building needs depends on:</p>
          <ul>
            <li>how accurate the dimensions and choices you enter are;</li>
            <li>site conditions, such as soil and access, that no software can assess from a distance;</li>
            <li>whether the editions of the standards used are still current (BIS revises them from time to time); and</li>
            <li>how your engineer and builder choose to design and build, which can differ from a code minimum.</li>
          </ul>
          <p>Every quantity is shown with a low and a high figure, and the true quantity can fall outside them. NirmanShastra does not certify, approve or guarantee the structural adequacy of any building. The structural design for your site, soil and earthquake zone must be completed by a licensed structural engineer. See the <Link href="/disclaimer">Disclaimer</Link>.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-4">
          <h2 id="tu-4" style={H2}>4. Your account and data</h2>
          <p>You are responsible for keeping your account credentials confidential, and for all activity under your account.</p>
          <p>You agree to give accurate information when you register. Giving false information, including a false email address or phone number, may lead to your account being suspended.</p>
          <p>You may not create more than one account to avoid paying for the same project.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-5">
          <h2 id="tu-5" style={H2}>5. What you may not do</h2>
          <ul>
            <li>Generate estimates for projects you do not own or have no real interest in, in order to gather competitive intelligence or market research at scale.</li>
            <li>Reverse-engineer, copy or redistribute our calculation logic or templates.</li>
            <li>Use automated scripts or bots to access or scrape the tools.</li>
            <li>Present a NirmanShastra estimate as a certified structural engineering document or a building plan submission.</li>
            <li>Resell access to the tools without our written permission.</li>
          </ul>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-6">
          <h2 id="tu-6" style={H2}>6. Limitation of liability</h2>
          <p>To the maximum extent the law allows, NirmanShastra and its operator are not liable for:</p>
          <ul>
            <li>any construction outcome, structural failure, over-ordering, shortfall or defect that arises from relying on our estimates without an independent structural engineer&rsquo;s review;</li>
            <li>any loss of data, revenue or profit from using, or being unable to use, the service;</li>
            <li>any damage that arises from third-party services we use to deliver the service (Razorpay, Resend, Supabase, Vercel); or</li>
            <li>indirect, incidental, consequential or punitive damages of any kind.</li>
          </ul>
          <p>Our total liability to you for any claim arising from your use of NirmanShastra will not exceed the amount you paid for the report the claim is about.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-7">
          <h2 id="tu-7" style={H2}>7. Governing law and disputes</h2>
          <p>These terms are governed by the laws of India. Any dispute that arises from your use of NirmanShastra is subject to the exclusive jurisdiction of the courts of Uttar Pradesh, India.</p>
          <p>Please write to <a href="mailto:nirmanshastraindia@gmail.com">nirmanshastraindia@gmail.com</a> before any formal legal step. Most issues can be settled directly.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="tu-8">
          <h2 id="tu-8" style={H2}>8. Changes to these terms</h2>
          <p>We may update these terms as the service changes. We will tell registered users of material changes by email. Using NirmanShastra after that notice means you accept the updated terms.</p>
        </section>

        <Note>See also the <Link href="/privacy-policy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link> and the <Link href="/disclaimer" style={{ textDecoration: 'underline' }}>Disclaimer</Link>.</Note>
      </div>
    </div>
  )
}

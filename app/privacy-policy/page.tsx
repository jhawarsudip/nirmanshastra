import Link from 'next/link'
import '@/styles/v2/results.css'
import { ToolHead, Note } from '@/components/v2/inner/kit'
import PrivacyChoices from '@/components/analytics/PrivacyChoices'
import { CONTACT_EMAIL } from '@/lib/site-contact'

// Last changed when the site became quantity-only. A fixed date, so the page does not say "today" every time it is built.
const UPDATED = '26 October 2026'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default function PrivacyPolicyPage() {
  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead
          eyebrow="Legal"
          name="Privacy Policy"
          blurb={`What we collect, why, who sees it and what you can ask us to do about it. Last updated ${UPDATED}.`}
        />

        <Note kind="warn" title="Written to be clear, not exhaustive">
          This policy is written to be clear and honest, not as complete legal documentation. For full compliance with Indian and international privacy law, consult a qualified legal professional. We refer to the Digital Personal Data Protection Act, 2023 (DPDP Act) in general terms and will update this policy as its rules are notified.
        </Note>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-1">
          <h2 id="pp-1" style={H2}>1. Who we are</h2>
          <p>NirmanShastra is operated by The Founder, an individual based in Uttar Pradesh, India. When you use the tools, you share your data with us as the data controller.</p>
          <p>Privacy contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-2">
          <h2 id="pp-2" style={H2}>2. What we collect</h2>
          <p>We collect these kinds of personal data:</p>
          <ul>
            <li>Name and email address, when you register to use a tool.</li>
            <li>Phone number (an Indian mobile), home city and PIN code, if you create a full account on the sign-up page. They are stored against your profile.</li>
            <li>Project name (optional), state and city for each project, so the report can use the earthquake zone and wind speed for your town.</li>
            <li>The answers you enter in a tool: plot and floor sizes, number of floors, rooms, finishes and the other choices the form asks for.</li>
            <li>Payment information: we do not store card details. Razorpay takes the payment directly.</li>
            <li>Usage data, such as pages visited, tool steps completed, browser type and device type, collected automatically by our hosting provider, Vercel.</li>
            <li>Only if you press Accept on the analytics banner: how you use the site (pages, clicks, scrolling, device and browser, an approximate location from your IP address), which ad, reel or link brought you (the utm_source, utm_medium and utm_campaign tags in the link you followed), and anonymous identifiers set by Google, Microsoft and Meta. See section 6.</li>
          </ul>
          <p>If you use a paid tool without creating an account, we start a temporary guest session so your report can be attached to you. A guest cannot log back in later, so the emailed link and the download are the only copies of the report.</p>
          <p>We do not collect Aadhaar numbers, PAN, bank account details or any other sensitive financial or government identification.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-21">
          <h2 id="pp-21" style={H2}>2.1 Optional sharing with material partners</h2>
          <p>On the sign-up page, and later in your Account Settings, you may opt into one or both of the arrangements below. Both are optional, and neither is needed to register or to use any tool. Both start unticked, and nothing is shared unless you turn it on. Each consent is independent: you may turn on either, both or neither.</p>
          <p><b>Consent 1: city sharing.</b> If you tick the first box, we may share your home city (the city you gave at sign-up) with cement makers, steel suppliers or other construction material companies who partner with us to offer relevant deals or information to people building in your city. Only your city name is shared under this consent. Your name, phone number, PIN code, email address, project answers and every other detail are never shared under it.</p>
          <p><b>Consent 2: contact detail sharing.</b> This is separate. If you tick the second box (&ldquo;Also share my name, phone number, and email with construction material partners for offers&rdquo;), we may share your name, phone number and email address, as well as your city, with cement, steel or other construction material companies for partnership offers. Ticking or unticking one box does not change the other.</p>
          <p><b>Withdrawing.</b> You can withdraw either or both at any time on your <Link href="/account">Account Settings</Link> page by unticking the box. A withdrawal takes effect at once and on its own. We will not start new sharing under a withdrawn consent, though we cannot recall data already sent to a partner before you withdrew.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-3">
          <h2 id="pp-3" style={H2}>3. How we use it</h2>
          <ul>
            <li>To work out your quantity report and generate the PDF.</li>
            <li>To email you the PDF through Resend.</li>
            <li>To send helpful construction-stage reminders related to your project (you can opt out at any time).</li>
            <li>To improve our quantity models and the standards they rely on.</li>
            <li>To answer support and contact requests.</li>
            <li>If you accept the analytics banner: to see which pages and tools are used, which ad or reel brought a visit or a sale, and to measure our own advertising.</li>
          </ul>
          <p>We do not sell your data. We do not sell your project information to contractors, builders or material suppliers. Your estimate is your property. If you accept the analytics banner, the Meta Pixel lets Meta match your visit to its own records so that we can measure our ads, and Meta may use that match to show our ads to people who visited. If you decline, the Pixel never loads.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-4">
          <h2 id="pp-4" style={H2}>4. Where it is stored</h2>
          <p>Your data is stored in Supabase, a PostgreSQL database service. The Supabase hosting region may vary; we choose regions that suit applicable data residency considerations, and will move to an India region when one is available.</p>
          <p>PDF reports are kept in Supabase Storage and can be opened only by you, through a secure link. We do not make reports publicly accessible.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-5">
          <h2 id="pp-5" style={H2}>5. Third parties we use</h2>
          <ul>
            <li>Razorpay: payment processing. Razorpay is PCI-DSS compliant, and your card data never passes through NirmanShastra servers.</li>
            <li>Resend: sends transactional email (your PDF report, contact confirmations). It processes your email address to deliver messages for us.</li>
            <li>Supabase: database and sign-in. It processes your registration data to provide the service.</li>
            <li>Vercel: hosting. It may log request details such as IP address and browser as part of normal infrastructure logging.</li>
            <li>Google (Google Analytics 4), Microsoft (Clarity) and Meta (Meta Pixel): visit measurement and advertising measurement. They are used only if you press Accept on the analytics banner, and nothing is requested from them before that.</li>
          </ul>
          <p>We do not use data brokers, and we do not share your data with any party not listed here, other than as set out in 2.1 if you opt in.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-6">
          <h2 id="pp-6" style={H2}>6. Cookies, analytics and your choice</h2>
          <p><b>Always on.</b> NirmanShastra uses cookies and browser storage to keep you signed in during your session and to remember your project in this browser. The admin session cookie (adminSession) is used only to run the site and expires after 24 hours.</p>
          <p><b>Only if you press Accept.</b> The first time you visit, a bar at the bottom of the page asks whether we may count how the site is used. It does not block the page. <b>Accept</b> and <b>Decline</b> are equally easy to press, and the site works the same either way. Until you choose, nothing is requested from Google, Microsoft or Meta.</p>
          <ul>
            <li>Google Analytics 4 counts visits, pages, clicks and purchases, and sets its own cookies (for example _ga).</li>
            <li>Microsoft Clarity records how a page is used, as a replay of clicks, scrolling and movement. Everything typed into a form field is hidden from the recording.</li>
            <li>The Meta Pixel reports visits, sign-ups and purchases to Meta so that we can see which ads work, and sets its own cookies (for example _fbp).</li>
            <li>Campaign tags (utm_source, utm_medium, utm_campaign) in the link you followed are kept in your browser for up to 90 days, and are saved with an order if you buy, so we can see which reel or ad brought the sale.</li>
          </ul>
          <p>Google, Microsoft and Meta process this data under their own policies: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google</a>, <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft</a>, <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Meta</a>.</p>
          <p><b>Changing your mind.</b> Press <PrivacyChoices>Privacy choices</PrivacyChoices> here or in the footer of any page. Declining after you accepted stops the services, removes the cookies they set on this site and reloads the page. Your choice is remembered in this browser only.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-7">
          <h2 id="pp-7" style={H2}>7. Your rights (DPDP Act 2023)</h2>
          <p>Under the Digital Personal Data Protection Act, 2023, and applicable privacy principles, you have the right to:</p>
          <ul>
            <li>ask for a summary of the personal data we hold about you;</li>
            <li>ask us to correct inaccurate personal data;</li>
            <li>ask us to delete your personal data and all estimates attached to it;</li>
            <li>withdraw consent to marketing emails at any time, using the unsubscribe link in any email we send;</li>
            <li>withdraw your consent to analytics and advertising measurement at any time, with &ldquo;Privacy choices&rdquo; in the footer; and</li>
            <li>complain to the Data Protection Board of India once the Board is constituted under the Act.</li>
          </ul>
          <p>To use any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject &ldquo;Privacy Request: [your name]&rdquo;. We will reply within 30 days.</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-8">
          <h2 id="pp-8" style={H2}>8. How long we keep it</h2>
          <p>Registration and estimate data is kept for up to 3 years from your last activity, so you can fetch older reports. After that it is deleted, unless you ask for earlier deletion.</p>
          <p>Resend keeps email delivery logs under its own retention policy (typically 30 days).</p>
        </section>

        <section className="ns-plate ns-r-sec ns-prose" aria-labelledby="pp-9">
          <h2 id="pp-9" style={H2}>9. Changes to this policy</h2>
          <p>We may update this policy as our services change, or as rules under the DPDP Act 2023 are notified. We will email registered users about material changes. The date at the top of this page shows the latest update.</p>
        </section>

        <Note>See also the <Link href="/terms-of-use" style={{ textDecoration: 'underline' }}>Terms of Use</Link> and the <Link href="/disclaimer" style={{ textDecoration: 'underline' }}>Disclaimer</Link>.</Note>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — NirmanShastra',
  description: 'NirmanShastra privacy policy — what data we collect, how we use it, who we share it with, and your rights under Indian law.',
}

const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

function Section({ clause, title, children }: { clause: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 40, marginBottom: 40, borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
      <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        {clause}
      </p>
      <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 22, fontWeight: 600, color: '#1E2227', marginBottom: 18, lineHeight: 1.3 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.85 }}>
      {children}
    </p>
  )
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.8)', lineHeight: 1.75, display: 'flex', gap: 12 }}>
          <span style={{ color: '#1F4E79', flexShrink: 0, fontWeight: 700 }}>—</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            LEGAL · PRIVACY POLICY
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(244,244,240,0.45)', marginTop: 16, letterSpacing: '0.04em' }}>
            Effective date: {today} · Last updated: {today}
          </p>
        </div>
      </div>

      <section className="px-6 md:px-16 lg:px-24 py-20">
        <div style={{ maxWidth: 800 }}>

          {/* Disclaimer notice */}
          <div className="grid-paper" style={{ border: '1px solid rgba(217,154,6,0.4)', background: 'rgba(217,154,6,0.06)', padding: '20px 24px', marginBottom: 48, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: '#D99A06', flexShrink: 0 }}>⚠</span>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)', lineHeight: 1.7 }}>
              This policy is written to be clear and honest, not as exhaustive legal documentation. For full compliance with applicable Indian and international privacy law, consult a qualified legal professional. We reference the Digital Personal Data Protection Act, 2023 (DPDP Act) in general terms and will update this policy as implementing rules are notified.
            </p>
          </div>

          <Section clause="§ 1.0 — DATA CONTROLLER" title="Who we are">
            <P>NirmanShastra is operated by Sudip Jhawar, an individual civil engineer based in Vrindavan, Uttar Pradesh, India. When you use NirmanShastra tools, you are sharing your data with us as the data controller.</P>
            <P>Contact for privacy concerns: <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>reports@nirmanshastra.in</a></P>
          </Section>

          <Section clause="§ 2.0 — DATA WE COLLECT" title="What data we collect">
            <P>We collect the following categories of personal data:</P>
            <UL items={[
              'Name, mobile number, and email address — collected at registration for each tool',
              'Property address, city, pin code, and state — collected to contextualise your estimate',
              'Property type and approximate plot size — used in calculations',
              'Project details you enter in tool forms — floor plans, material specifications, quantities entered by you',
              'Payment information — we do not store card details; Razorpay processes payments directly',
              'Usage data — pages visited, tool steps completed, browser type, device type (collected automatically by our hosting provider, Vercel)',
            ]} />
            <P>We do not collect Aadhaar numbers, PAN, bank account details, or any other sensitive financial or government identification.</P>
          </Section>

          <Section clause="§ 3.0 — HOW WE USE YOUR DATA" title="How we use your data">
            <UL items={[
              'Generating your construction cost estimate and BOQ report',
              'Sending your PDF report by email via Resend',
              'Following up with useful construction timing reminders related to your phase (you can opt out at any time)',
              'Improving our IS code calculations and material rate databases',
              'Responding to support and contact requests',
              'Internal analytics to understand which tools are used most (aggregate, not individual)',
            ]} />
            <P>We do not use your data for targeted advertising. We do not sell your project information to contractors, builders, or material suppliers. Your estimate is your property.</P>
          </Section>

          <Section clause="§ 4.0 — DATA STORAGE" title="Where your data is stored">
            <P>Your data is stored in Supabase, a PostgreSQL database service. Supabase hosting region may vary; we select regions that comply with applicable data residency considerations. As India-specific Supabase regions become available, we will migrate to them.</P>
            <P>PDF reports are stored temporarily in Supabase Storage and are accessible only to you via a secure link. We do not make your reports publicly accessible.</P>
          </Section>

          <Section clause="§ 5.0 — THIRD PARTIES" title="Third parties we use">
            <UL items={[
              'Razorpay — payment processing. Razorpay is PCI-DSS compliant. Your payment card data never passes through NirmanShastra servers.',
              'Resend — transactional email delivery (your PDF report, contact confirmations). Resend processes your email address to deliver messages on our behalf.',
              'Supabase — database and authentication. Supabase processes your registration data to provide the service.',
              'Vercel — hosting and deployment. Vercel may log request metadata (IP address, browser agent) as part of standard infrastructure logging.',
            ]} />
            <P>We do not integrate with advertising networks, social media trackers, or data brokers. We do not share your data with any party not listed above.</P>
          </Section>

          <Section clause="§ 6.0 — COOKIES" title="Cookies and session data">
            <P>NirmanShastra uses cookies for session management only — to keep you logged in during your session. We do not use advertising cookies, cross-site tracking cookies, or analytics cookies from third parties.</P>
            <P>The admin session cookie (adminSession) is used for site administration only and expires after 24 hours.</P>
          </Section>

          <Section clause="§ 7.0 — YOUR RIGHTS" title="Your rights (DPDP Act 2023)">
            <P>Under the Digital Personal Data Protection Act, 2023 (DPDP Act), and applicable privacy principles, you have the right to:</P>
            <UL items={[
              'Request a summary of the personal data we hold about you',
              'Request correction of inaccurate personal data',
              'Request deletion of your personal data and all associated estimates',
              'Withdraw consent to marketing emails at any time via the unsubscribe link in any email we send',
              'Lodge a complaint with the Data Protection Board of India once the Board is constituted under the Act',
            ]} />
            <P>To exercise any of these rights, email <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>reports@nirmanshastra.in</a> with the subject line &quot;Privacy Request — [your name]&quot;. We will respond within 30 days.</P>
          </Section>

          <Section clause="§ 8.0 — DATA RETENTION" title="How long we keep your data">
            <P>Registration and estimate data is retained for up to 3 years from the date of last activity, to allow you to retrieve historical reports. After that, data is deleted unless you request earlier deletion.</P>
            <P>Email delivery logs are retained by Resend per their own retention policy (typically 30 days).</P>
          </Section>

          <Section clause="§ 9.0 — UPDATES TO THIS POLICY" title="Changes to this policy">
            <P>We may update this policy as our services change or as implementing rules under the DPDP Act 2023 are notified. Material changes will be communicated via email to registered users. The effective date at the top of this page reflects the most recent update.</P>
          </Section>

          <div style={{ paddingTop: 20 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
              Questions? Write to reports@nirmanshastra.in · See also{' '}
              <Link href="/terms-of-use" style={{ color: '#1F4E79' }}>Terms of Use</Link>{' '}and{' '}
              <Link href="/disclaimer" style={{ color: '#1F4E79' }}>Disclaimer</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

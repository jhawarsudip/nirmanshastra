import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use — NirmanShastra',
  description: 'NirmanShastra terms of use — service description, payment terms, accuracy disclaimer, and governing law.',
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

export default function TermsOfUsePage() {
  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            LEGAL · TERMS OF USE
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            Terms of Use
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(244,244,240,0.45)', marginTop: 16, letterSpacing: '0.04em' }}>
            Effective date: {today}
          </p>
        </div>
      </div>

      <section className="px-6 md:px-16 lg:px-24 py-20">
        <div style={{ maxWidth: 800 }}>

          <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '20px 24px', marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75 }}>
              By using NirmanShastra, you agree to these terms. If you do not agree, please do not use the service. These terms are governed by Indian law.
            </p>
          </div>

          <Section clause="§ 1.0 — SERVICE DESCRIPTION" title="What NirmanShastra provides">
            <P>NirmanShastra provides construction cost estimation tools for residential projects in India. Our tools calculate material quantities and costs using Indian Standards (IS codes) published by the Bureau of Indian Standards (BIS).</P>
            <P>NirmanShastra is a cost estimation and budgeting tool. It is NOT:</P>
            <UL items={[
              'A licensed structural engineering service',
              'A substitute for site-specific structural design by a qualified engineer',
              'A guarantee of actual construction costs',
              'A substitute for geotechnical investigation',
              'A replacement for local municipal approvals and building plan sanction',
            ]} />
            <P>All estimates produced by NirmanShastra are for budgeting and contractor comparison purposes only. Construction must be designed, supervised, and certified by a licensed structural engineer registered with the relevant state or central authority.</P>
          </Section>

          <Section clause="§ 2.0 — PAYMENT TERMS" title="Payment and refund policy">
            <P>Our current pricing (as of June 2026):</P>
            <UL items={[
              'VastuPro — Free forever, no payment required',
              'StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro — ₹499 per report',
              'Complete bundle (all 5 paid tools) — ₹1,999',
              'Grand Total Report (combines all 5 phases) — ₹999, or free if all 5 tools purchased individually',
            ]} />
            <P>Payments are processed by Razorpay and are subject to their terms and conditions. NirmanShastra does not store your payment card details.</P>
            <P><strong>Refund policy:</strong> Once a PDF report is successfully generated and delivered to your registered email, the payment is non-refundable. This is because the estimate is calculated and the PDF is generated at the time of payment — there is no physical inventory to return. If a PDF fails to generate due to a technical fault on our end and cannot be delivered within 48 hours of payment, we will issue a full refund. To request a refund for a failed delivery, email <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>reports@nirmanshastra.in</a> within 7 days of payment.</P>
          </Section>

          <Section clause="§ 3.0 — ACCURACY DISCLAIMER" title="Accuracy of estimates">
            <P>NirmanShastra estimates are calculated using IS code formulas applied to the inputs you provide. The accuracy of any estimate depends on:</P>
            <UL items={[
              'The accuracy of the dimensions and specifications you enter',
              'The current local market prices for materials and labour (we pre-fill India averages; you are responsible for entering your actual local rates)',
              'The specific soil conditions, site access, and other local factors that no software can assess remotely',
              'Whether the IS code values in effect at the time of your report remain current (IS codes are periodically revised by BIS)',
            ]} />
            <P>Material rates pre-filled in the tool are India city averages as of the last quarterly update. Actual local pricing may differ by 15–40% depending on location, season, and market conditions. You are strongly advised to verify rates with local dealers before finalising your budget.</P>
            <P>NirmanShastra does not certify, approve, or guarantee the structural adequacy of any building based on our estimates. Structural design for your specific site, soil conditions, and seismic zone must be completed by a licensed structural engineer.</P>
          </Section>

          <Section clause="§ 4.0 — ACCOUNT TERMS" title="Your account and data">
            <P>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.</P>
            <P>You agree to provide accurate information during registration. Providing false information, including a false email or phone number, may result in your account being suspended.</P>
            <P>You may not create multiple accounts to circumvent payment requirements for the same project.</P>
          </Section>

          <Section clause="§ 5.0 — PROHIBITED USES" title="What you may not do">
            <UL items={[
              'Use NirmanShastra to generate estimates for projects you do not own or have no legitimate interest in, for the purpose of competitive intelligence or market research at scale',
              'Reverse-engineer, copy, or redistribute our IS code calculation logic, BOQ templates, or rate databases',
              'Use automated scripts or bots to access or scrape our tools',
              'Represent NirmanShastra estimates as certified structural engineering documents or building plan submissions',
              'Resell access to our tools without express written permission',
            ]} />
          </Section>

          <Section clause="§ 6.0 — LIMITATION OF LIABILITY" title="Limitation of liability">
            <P>To the maximum extent permitted by applicable law, NirmanShastra and its operator (Sudip Jhawar) shall not be liable for:</P>
            <UL items={[
              'Any construction outcome, structural failure, cost overrun, or defect that arises from reliance on our estimates without independent structural engineering review',
              'Any loss of data, revenue, or profit arising from use of or inability to use the service',
              'Any damages arising from third-party services (Razorpay, Resend, Supabase, Vercel) that we use to deliver the service',
              'Indirect, incidental, consequential, or punitive damages of any kind',
            ]} />
            <P>Our total liability to you for any claim arising from your use of NirmanShastra shall not exceed the amount you paid for the specific report that is the subject of the claim.</P>
          </Section>

          <Section clause="§ 7.0 — GOVERNING LAW" title="Governing law and disputes">
            <P>These terms are governed by the laws of India. Any dispute arising from your use of NirmanShastra shall be subject to the exclusive jurisdiction of the courts of Uttar Pradesh, India.</P>
            <P>We encourage you to contact us at <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)', fontSize: 13 }}>reports@nirmanshastra.in</a> before pursuing any formal legal action. Most issues can be resolved directly.</P>
          </Section>

          <Section clause="§ 8.0 — CHANGES TO TERMS" title="Changes to these terms">
            <P>We may update these terms as the service evolves. Material changes will be communicated by email to registered users. Continued use of NirmanShastra after such notification constitutes acceptance of the updated terms.</P>
          </Section>

          <div style={{ paddingTop: 20 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
              See also:{' '}
              <Link href="/privacy-policy" style={{ color: '#1F4E79' }}>Privacy Policy</Link>{' '}·{' '}
              <Link href="/disclaimer" style={{ color: '#1F4E79' }}>Disclaimer</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

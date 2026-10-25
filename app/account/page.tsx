import { redirect } from 'next/navigation'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { createSupabaseClient } from '@/lib/supabase/server'
import { ToolHead } from '@/components/v2/inner/kit'
import ConsentToggle from './ConsentToggle'
import GuestUpgradeCard from './GuestUpgradeCard'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default async function AccountPage() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/account')

  const meta = user.user_metadata ?? {}
  const isGuest = user.is_anonymous === true
  const consentInitial: boolean = meta.consent_material_partners === true
  const consentContactInitial: boolean = meta.consent_material_partners_contact === true

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap ns-ac" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow="Account" name="Your account" blurb="The details we hold for you, and the choices you can change." />

        {/* Guest sessions can turn into a permanent account here */}
        {isGuest ? <GuestUpgradeCard /> : null}

        <section className="ns-plate ns-r-sec" aria-labelledby="ac-profile">
          <h2 id="ac-profile" style={H2}>Your profile</h2>
          <dl className="ns-ac-dl">
            <div>
              <dt>Name</dt>
              <dd>{meta.full_name || meta.name || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || (isGuest ? 'Guest session, no email on file' : '—')}</dd>
            </div>
            {meta.city ? (
              <div>
                <dt>City</dt>
                <dd>{meta.city}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <ConsentToggle initialCity={consentInitial} initialContact={consentContactInitial} />

        <p className="ns-r-tblnote">
          To delete your account or ask for a copy of your data, email{' '}
          <a href="mailto:nirmanshastraindia@gmail.com" style={{ textDecoration: 'underline' }}>nirmanshastraindia@gmail.com</a>{' '}
          with the subject &ldquo;Privacy request: [your name]&rdquo;.
        </p>
      </div>
    </div>
  )
}

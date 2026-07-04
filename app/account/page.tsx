import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseClient } from '@/lib/supabase/server'
import ConsentToggle from './ConsentToggle'

export const metadata: Metadata = {
  title: 'Account Settings — NirmanShastra',
  description: 'Manage your NirmanShastra account preferences and data-sharing settings.',
}

export default async function AccountPage() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/account')

  const meta = user.user_metadata ?? {}
  const consentInitial: boolean = meta.consent_material_partners === true

  return (
    <main className="min-h-screen" style={{ background: '#F4F4F0' }}>
      {/* Header */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-14">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
            NIRMANSHASTRA · ACCOUNT SETTINGS
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.15 }}>
            Your Account
          </h1>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-xl mx-auto px-6">

          {/* Profile info card */}
          <div style={{ border: '1px solid rgba(30,34,39,0.14)', borderRadius: 2, background: '#fff', padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              YOUR PROFILE
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.42)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Name
                </p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: '#1E2227' }}>
                  {meta.full_name || meta.name || '—'}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.42)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Email
                </p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: '#1E2227' }}>
                  {user.email}
                </p>
              </div>
              {meta.city && (
                <div>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.42)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    City
                  </p>
                  <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: '#1E2227' }}>
                    {meta.city}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Consent toggle */}
          <ConsentToggle initial={consentInitial} />

          <div style={{ marginTop: 32 }}>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.38)', letterSpacing: '0.04em', lineHeight: 1.75 }}>
              To delete your account or request a full data export, email{' '}
              <a href="mailto:reports@nirmanshastra.in" style={{ color: '#1F4E79' }}>
                reports@nirmanshastra.in
              </a>{' '}
              with subject &quot;Privacy Request — [your name]&quot;.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { asLocale, type LocaleParams } from '@/lib/i18n/paths'
import '@/styles/v2/results.css'
import '@/styles/v2/content.css'
import { createSupabaseClient } from '@/lib/supabase/server'
import { ToolHead } from '@/components/v2/inner/kit'
import ConsentToggle from './ConsentToggle'
import GuestUpgradeCard from './GuestUpgradeCard'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import { ACCOUNT } from '@/lib/i18n/labels/pages-account'
import { placesHi } from '@/lib/i18n/labels/structopro-places'

const H2 = { fontFamily: 'var(--ns-display)', fontWeight: 400, fontSize: 'clamp(22px, 2.2vw, 29px)', lineHeight: 1.15, margin: 0 } as const

export default async function AccountPage({ params }: LocaleParams) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = ACCOUNT[asLocale(locale)]
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect({ href: '/auth?redirect=/account', locale: asLocale(locale) })

  const meta = user.user_metadata ?? {}
  const isGuest = user.is_anonymous === true
  const consentInitial: boolean = meta.consent_material_partners === true
  const consentContactInitial: boolean = meta.consent_material_partners_contact === true

  return (
    <div className="ns-i-page">
      <div className="ns-i-wrap ns-ac" style={{ display: 'grid', gap: 'clamp(18px, 2.4vw, 28px)' }}>
        <ToolHead eyebrow={t.eyebrow} name={t.name} blurb={t.blurb} />

        {/* Guest sessions can turn into a permanent account here */}
        {isGuest ? <GuestUpgradeCard /> : null}

        <section className="ns-plate ns-r-sec" aria-labelledby="ac-profile">
          <h2 id="ac-profile" style={H2}>{t.profileH}</h2>
          <dl className="ns-ac-dl">
            <div>
              <dt>{t.nameK}</dt>
              <dd>{meta.full_name || meta.name || '—'}</dd>
            </div>
            <div>
              <dt>{t.emailK}</dt>
              <dd>{user.email || (isGuest ? t.guestNoEmail : '—')}</dd>
            </div>
            {meta.city ? (
              <div>
                <dt>{t.cityK}</dt>
                <dd>{asLocale(locale) === 'hi' && typeof meta.city === 'string' ? placesHi(meta.city) : meta.city}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <ConsentToggle initialCity={consentInitial} initialContact={consentContactInitial} />

        <p className="ns-r-tblnote">
          {t.privacyA}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: 'underline' }}>{CONTACT_EMAIL}</a>{' '}
          {t.privacyB}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import AdminGate3 from './AdminGate3'
import { Arrow, BrandMark, Burger, Cross, Moon, Sun } from './Icons'
import { NAV, pick, type Loc } from '@/lib/v3/copy'
import { toggleTheme, useTheme } from '@/lib/v2/store'

export default function Header({ locale }: { locale: Loc }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const theme = useTheme()
  const t = (k: keyof typeof NAV) => pick(NAV[k], locale)

  const [user, setUser] = useState<User | null>(null)
  const [menu, setMenu] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [stuck, setStuck] = useState(false)
  const clicks = useRef<number[]>([])

  const home = locale === 'hi' ? '/hi' : '/'
  const hash = (id: string) => `${home}#${id}`

  // A silent anonymous session is not an account: treat it as signed out (same rule as the old navbar).
  useEffect(() => {
    const asAccount = (u: User | null) => (u && u.is_anonymous !== true ? u : null)
    supabase.auth.getUser().then(({ data }) => setUser(asAccount(data.user ?? null)))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(asAccount(s?.user ?? null)))
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menu])

  function brandClick(e: React.MouseEvent) {
    const now = Date.now()
    clicks.current = [...clicks.current, now].filter(x => now - x < 2000)
    if (clicks.current.length >= 5) {
      e.preventDefault()
      clicks.current = []
      setAdmin(true)
    }
  }

  function night(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }

  async function logout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  const close = () => setMenu(false)

  const lang = (
    <div className="s3-lang" role="group" aria-label={t('lang')}>
      <Link href="/" prefetch={false} lang="en" hrefLang="en" aria-current={locale === 'en' ? 'true' : undefined}>EN</Link>
      <Link href="/hi" prefetch={false} lang="hi" hrefLang="hi" aria-current={locale === 'hi' ? 'true' : undefined}>हि</Link>
    </div>
  )

  const toggles = (
    <>
      <button type="button" className="s3-iconbtn" aria-pressed={theme === 'dark'} aria-label={t('night')} title={t('night')} onClick={night}>
        {theme === 'dark' ? <Moon /> : <Sun />}
      </button>
    </>
  )

  const links: [string, string, string?][] = [
    [hash('how'), t('how')],
    ['/compare-quote', t('quote')],
    [hash('pricing'), t('pricing')],
    ['/faq', t('faq')],
    [hash('pros'), t('prosShort'), 'pros'],
  ]

  return (
    <>
      <a className="s3-skip" href="#main">{t('skip')}</a>
      <header className={`s3-header${stuck ? ' is-stuck' : ''}`}>
        <div className="s3-header__bar">
          <Link href={home} className="s3-brand" onClick={brandClick} aria-label="NirmanShastra">
            <BrandMark className="s3-brand__mark" />
            <span className="s3-brand__name">
              <span className="s3-brand__latin">Nirman<b>Shastra</b></span>
              <span className="s3-brand__hi" lang="hi">निर्माणशास्त्र</span>
            </span>
          </Link>

          <nav className="s3-nav" aria-label="Primary">
            {links.map(([href, label, kind]) => (
              <Link key={href} href={href} className={kind ? `s3-nav__${kind}` : undefined}>{label}</Link>
            ))}
          </nav>

          <div className="s3-header__tools">
            {lang}
            {toggles}
            {user ? (
              <>
                <Link href="/reports" className="s3-header__login">{t('reports')}</Link>
                <button type="button" className="s3-btn s3-btn--ghost s3-btn--sm s3-header__cta" onClick={logout}>{t('logout')}</button>
              </>
            ) : (
              <>
                <Link href="/auth" className="s3-header__login">{t('login')}</Link>
                <Link href="/tools/vastu-pro" className="s3-btn s3-btn--sm s3-header__cta">{t('start')}</Link>
              </>
            )}
            <button type="button" className="s3-iconbtn s3-burger" aria-label={t('menu')} aria-expanded={menu} onClick={() => setMenu(true)}>
              <Burger />
            </button>
          </div>
        </div>
      </header>

      <div className={`s3-menu${menu ? ' is-open' : ''}`} aria-hidden={!menu} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="s3-menu__top">
          <Link href={home} className="s3-brand" onClick={close} tabIndex={menu ? 0 : -1}>
            <BrandMark className="s3-brand__mark" />
            <span className="s3-brand__name"><span className="s3-brand__latin">Nirman<b>Shastra</b></span></span>
          </Link>
          <button type="button" className="s3-iconbtn" aria-label={t('close')} onClick={close} tabIndex={menu ? 0 : -1}>
            <Cross />
          </button>
        </div>
        <div className="s3-menu__body">
          {links.map(([href, label, kind], i) => (
            <Link
              key={href}
              href={href}
              className={`s3-menu__link${kind ? ' is-pros' : ''}`}
              style={{ ['--i' as string]: i }}
              onClick={close}
              tabIndex={menu ? 0 : -1}
            >
              {label}<Arrow />
            </Link>
          ))}
          <div className="s3-menu__row">
            {lang}
            {toggles}
          </div>
          <div className="s3-menu__row">
            {user ? (
              <>
                <Link href="/reports" className="s3-btn s3-btn--indigo" onClick={close} tabIndex={menu ? 0 : -1}>{t('reports')}</Link>
                <button type="button" className="s3-btn s3-btn--ghost" onClick={() => { close(); void logout() }} tabIndex={menu ? 0 : -1}>{t('logout')}</button>
              </>
            ) : (
              <>
                <Link href="/tools/vastu-pro" className="s3-btn" onClick={close} tabIndex={menu ? 0 : -1}>{t('start')}</Link>
                <Link href="/auth" className="s3-btn s3-btn--ghost" onClick={close} tabIndex={menu ? 0 : -1}>{t('login')}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {admin && <AdminGate3 loc={locale} onClose={() => setAdmin(false)} />}
    </>
  )
}

'use client'

import SocialLinks from '@/components/social/SocialLinks'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import CutLink from './CutLink'
import AdminGate from './AdminGate'
import Pour from './Pour'
import { Arrow, BrandMark, BubbleIcon, Burger, Caret, Cross, LampIcon } from './Icons'
import { CALCULATORS } from '@/lib/v2/calculators'
import { SITE_TEMPLATES, TEMPLATES_BUNDLE, TOOLS, PACK_TOOL } from '@/lib/v2/content'
import { NAV, TOOL_PLAIN, pick } from '@/lib/v2/copy'
import { setCalm, toggleTheme, useCalm, useTheme } from '@/lib/v2/store'

type Loc = 'en' | 'hi'

const L = {
  en: {
    reports: 'My reports', logout: 'Log out', sheets: 'sheets', free: 'FREE', allKits: 'All six toolkits',
    calmOn: 'Calm on · motion off', calmOff: 'Motion on', blog: 'Blog', faq: 'Questions',
    lamp: 'Day / night', home: 'NirmanShastra home',
  },
  hi: {
    reports: 'मेरी रिपोर्ट', logout: 'लॉग आउट', sheets: 'शीट', free: 'मुफ़्त', allKits: 'सभी छह टूलकिट',
    calmOn: 'शांत मोड चालू · हलचल बंद', calmOff: 'हलचल चालू', blog: 'ब्लॉग', faq: 'सवाल',
    lamp: 'दिन / रात', home: 'NirmanShastra होम',
  },
} as const

export default function Header({ locale }: { locale: Loc }) {
  const t = L[locale]
  const n = (k: keyof typeof NAV) => pick(NAV[k], locale)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const calm = useCalm()
  const theme = useTheme()

  const [user, setUser] = useState<User | null>(null)
  const [mega, setMega] = useState(false)
  const [menu, setMenu] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const clicks = useRef<number[]>([])
  const toastTimer = useRef<number | undefined>(undefined)
  const headerRef = useRef<HTMLElement>(null)

  const home = locale === 'hi' ? '/hi' : '/'
  const hash = (id: string) => `${home}#${id}`

  // A silent anonymous session is not an account — treat it as signed out (same rule as the legacy Navbar).
  useEffect(() => {
    const asAccount = (u: User | null) => (u && u.is_anonymous !== true ? u : null)
    supabase.auth.getUser().then(({ data }) => setUser(asAccount(data.user ?? null)))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(asAccount(s?.user ?? null)))
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMega(false)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMega(false); setMenu(false) } }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menu])

  function say(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }

  function brandClick(e: React.MouseEvent) {
    const now = Date.now()
    clicks.current = [...clicks.current, now].filter(x => now - x < 2000)
    if (clicks.current.length >= 5) {
      e.preventDefault()
      clicks.current = []
      setAdmin(true)
    }
  }

  function lamp(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }

  function calmToggle() {
    setCalm(!calm)
    say(!calm ? t.calmOn : t.calmOff)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  const close = () => { setMega(false); setMenu(false) }

  const langSwitch = (
    <div className="ns-lang" role="group" aria-label={n('lang')}>
      <Link href="/" prefetch={false} lang="en" aria-current={locale === 'en'} hrefLang="en">EN</Link>
      <Link href="/hi" prefetch={false} lang="hi" aria-current={locale === 'hi'} hrefLang="hi">हि</Link>
    </div>
  )

  const toggles = (
    <>
      <button type="button" className="ns-iconbtn" aria-pressed={theme === 'dark'} aria-label={n('night')} title={n('night')} onClick={lamp}>
        <LampIcon on={theme === 'dark'} />
      </button>
      <button type="button" className="ns-iconbtn" aria-pressed={calm} aria-label={n('calm')} title={n('calm')} onClick={calmToggle}>
        <BubbleIcon calm={calm} />
      </button>
    </>
  )

  return (
    <>
      <a className="ns-skip" href="#main">{n('skip')}</a>
      <header className="ns-header" ref={headerRef} onPointerLeave={e => { if (e.pointerType === 'mouse') setMega(false) }}>
        <div className="ns-header__bar">
          <Link href={home} className="ns-brand" onClick={brandClick} aria-label={t.home}>
            <BrandMark className="ns-brand__mark" />
            <span className="ns-brand__name">
              <span className="ns-brand__latin">Nirman<b>Shastra</b></span>
              <span className="ns-brand__hi" lang="hi">निर्माणशास्त्र</span>
            </span>
          </Link>

          <nav className="ns-nav" aria-label="Primary">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="ns-mega"
              onClick={() => setMega(v => !v)}
              onPointerEnter={e => { if (e.pointerType === 'mouse') setMega(true) }}
            >
              {n('tools')} <Caret className="ns-nav__caret" />
            </button>
            <Link href={hash('how-it-works')}>{n('how')}</Link>
            <CutLink href="/compare-quote">{n('quote')}</CutLink>
            <Link href={hash('pricing')}>{n('pricing')}</Link>
            <Link href={hash('builders')} className="ns-nav__pro">{n('pros')}</Link>
          </nav>

          <div className="ns-header__tools">
            {langSwitch}
            {toggles}
            {user ? (
              <>
                <CutLink href="/reports" className="ns-header__login">{t.reports}</CutLink>
                <button type="button" className="ns-btn ns-btn--paper ns-btn--sm ns-header__cta" onClick={logout}>{t.logout}</button>
              </>
            ) : (
              <>
                <CutLink href="/auth" className="ns-header__login">{n('login')}</CutLink>
                <CutLink href="/tools/vastu-pro" className="ns-btn ns-btn--sm ns-header__cta" data-snap>{n('start')}</CutLink>
              </>
            )}
            <button type="button" className="ns-iconbtn ns-burger" aria-label={n('menu')} aria-expanded={menu} onClick={() => setMenu(true)}>
              <Burger />
            </button>
          </div>
        </div>

        <Pour kind="lip" tone="header" v={1} />

        {mega && (
          <div className="ns-megawrap" id="ns-mega">
            <div className="ns-mega" role="menu">
              <div className="ns-mega__col">
                <p className="ns-mega__title">{n('forHome')}</p>
                {TOOLS.map(tool => (
                  <CutLink key={tool.key} href={tool.href} onClick={close} role="menuitem" style={{ ['--tc' as string]: `var(${tool.accent})` }}>
                    <span className="ns-mega__bar" aria-hidden="true" />
                    <span>
                      <span className="ns-mega__name">{tool.name}</span>
                      <span className="ns-mega__sub">{pick(TOOL_PLAIN[tool.key], locale)}</span>
                    </span>
                    <span className={`ns-mega__price${tool.free ? ' is-free' : ''}`}>{tool.free ? t.free : tool.price}</span>
                  </CutLink>
                ))}
                <CutLink href={PACK_TOOL.href} onClick={close} role="menuitem" style={{ ['--tc' as string]: 'var(--ns-laterite)' }}>
                  <span className="ns-mega__bar" aria-hidden="true" />
                  <span>
                    <span className="ns-mega__name">{pick(PACK_TOOL.name, locale)}</span>
                    <span className="ns-mega__sub">{pick(PACK_TOOL.plain, locale)}</span>
                  </span>
                  <span className="ns-mega__price">{PACK_TOOL.price}</span>
                </CutLink>
              </div>
              <div className="ns-mega__col">
                <p className="ns-mega__title">{n('freeCalcs')}</p>
                {CALCULATORS.map(c => (
                  <CutLink key={c.href} href={c.href} onClick={close} role="menuitem">
                    <span className="ns-mega__bar" aria-hidden="true" />
                    <span><span className="ns-mega__name">{c.title[locale]}</span></span>
                    <span className="ns-mega__price is-free">{t.free}</span>
                  </CutLink>
                ))}
              </div>
              <div className="ns-mega__col">
                <p className="ns-mega__title">{n('siteKits')}</p>
                {SITE_TEMPLATES.map(k => (
                  <CutLink key={k.href} href={k.href} onClick={close} role="menuitem">
                    <span className="ns-mega__bar" aria-hidden="true" />
                    <span>
                      <span className="ns-mega__name">{k.title}</span>
                      <span className="ns-mega__sub ns-mono">{k.sheets} {t.sheets}</span>
                    </span>
                    <span className="ns-mega__price">{k.price}</span>
                  </CutLink>
                ))}
                <CutLink href={TEMPLATES_BUNDLE.href} onClick={close} role="menuitem">
                  <span className="ns-mega__bar" aria-hidden="true" style={{ background: 'var(--ns-marigold)' }} />
                  <span><span className="ns-mega__name">{t.allKits}</span></span>
                  <span className="ns-mega__price">{TEMPLATES_BUNDLE.price}</span>
                </CutLink>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* mobile menu sheet */}
      <div className={`ns-menu${menu ? ' is-open' : ''}`} aria-hidden={!menu} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="ns-menu__top">
          <Link href={home} className="ns-brand" onClick={close} tabIndex={menu ? 0 : -1}>
            <BrandMark className="ns-brand__mark" />
            <span className="ns-brand__name"><span className="ns-brand__latin">Nirman<b>Shastra</b></span></span>
          </Link>
          <button type="button" className="ns-iconbtn" aria-label={n('close')} onClick={close} tabIndex={menu ? 0 : -1}>
            <Cross />
          </button>
        </div>
        <div className="ns-menu__body">
          <details>
            <summary>{n('tools')}</summary>
            {TOOLS.map(tool => (
              <CutLink key={tool.key} href={tool.href} onClick={close} tabIndex={menu ? 0 : -1}>
                <span>{tool.name}</span><span>{tool.free ? t.free : tool.price}</span>
              </CutLink>
            ))}
            <CutLink href={PACK_TOOL.href} onClick={close} tabIndex={menu ? 0 : -1}>
              <span>{pick(PACK_TOOL.name, locale)}</span><span>{PACK_TOOL.price}</span>
            </CutLink>
          </details>
          <Link className="ns-menu__link" href={hash('how-it-works')} onClick={close} tabIndex={menu ? 0 : -1}>{n('how')}<Arrow /></Link>
          <CutLink className="ns-menu__link" href="/compare-quote" onClick={close} tabIndex={menu ? 0 : -1}>{n('quote')}<Arrow /></CutLink>
          <Link className="ns-menu__link" href={hash('pricing')} onClick={close} tabIndex={menu ? 0 : -1}>{n('pricing')}<Arrow /></Link>
          <details>
            <summary>{n('prosLong')}</summary>
            <Link href={hash('builders')} onClick={close} tabIndex={menu ? 0 : -1}><span>{n('freeCalcs')}</span><span>{t.free}</span></Link>
            {SITE_TEMPLATES.map(k => (
              <CutLink key={k.href} href={k.href} onClick={close} tabIndex={menu ? 0 : -1}>
                <span>{k.title}</span><span>{k.price}</span>
              </CutLink>
            ))}
            <CutLink href={TEMPLATES_BUNDLE.href} onClick={close} tabIndex={menu ? 0 : -1}>
              <span>{t.allKits}</span><span>{TEMPLATES_BUNDLE.price}</span>
            </CutLink>
          </details>
          <CutLink className="ns-menu__link" href="/blog" onClick={close} tabIndex={menu ? 0 : -1}>{t.blog}<Arrow /></CutLink>
          <CutLink className="ns-menu__link" href="/faq" onClick={close} tabIndex={menu ? 0 : -1}>{t.faq}<Arrow /></CutLink>
          <div className="ns-menu__row">
            <div className="ns-lang" style={{ display: 'inline-flex' }} role="group" aria-label={n('lang')}>
              <Link href="/" prefetch={false} lang="en" aria-current={locale === 'en'} hrefLang="en" onClick={close}>EN</Link>
              <Link href="/hi" prefetch={false} lang="hi" aria-current={locale === 'hi'} hrefLang="hi" onClick={close}>हि</Link>
            </div>
            {toggles}
          </div>
          <SocialLinks hi={locale === 'hi'} where="mobile_menu" />
          <div className="ns-menu__row">
            {user ? (
              <>
                <CutLink href="/reports" className="ns-btn ns-btn--paper" onClick={close}>{t.reports}</CutLink>
                <button type="button" className="ns-btn ns-btn--ink" onClick={() => { close(); void logout() }}>{t.logout}</button>
              </>
            ) : (
              <>
                <CutLink href="/tools/vastu-pro" className="ns-btn" onClick={close}>{n('start')}</CutLink>
                <CutLink href="/auth" className="ns-btn ns-btn--paper" onClick={close}>{n('login')}</CutLink>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="ns-toast" role="status">{toast}</div>}
      {admin && <AdminGate onClose={() => setAdmin(false)} />}
    </>
  )
}

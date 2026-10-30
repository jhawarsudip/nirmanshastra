'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { META_PIXEL_ID } from '@/lib/analytics/config'
import { localeFromPath, localizePath } from '@/lib/i18n/paths'
import { onOpenConsentBanner, useConsent, writeConsent } from '@/lib/analytics/consent'
import './consent.css'

type Lang = 'en' | 'hi'

const WHO = META_PIXEL_ID ? 'Google Analytics, Microsoft Clarity and the Meta Pixel' : 'Google Analytics and Microsoft Clarity'
const WHO_HI = META_PIXEL_ID ? 'Google Analytics, Microsoft Clarity और Meta Pixel' : 'Google Analytics और Microsoft Clarity'

const COPY: Record<Lang, { title: string; body: string; policy: string; yes: string; no: string; switchTo: string; switchLabel: string; label: string }> = {
  en: {
    title: 'Can we count how the site is used?',
    body: `With your OK we use ${WHO} to see which pages help and which ad or reel brought you here. Clarity never records what you type. Nothing loads until you choose, and you can change your mind any time under "Privacy choices" in the footer.`,
    policy: 'Privacy Policy',
    yes: 'Accept',
    no: 'Decline',
    switchTo: 'हिन्दी',
    switchLabel: 'हिन्दी में पढ़ें',
    label: 'Analytics choice',
  },
  hi: {
    title: 'क्या हम गिन सकते हैं कि साइट कैसे इस्तेमाल होती है?',
    body: `आपकी अनुमति से हम ${WHO_HI} का उपयोग करते हैं, ताकि पता चले कि कौन से पन्ने काम आते हैं और किस विज्ञापन या रील से आप यहाँ आए। Clarity आपके टाइप किए हुए को कभी रिकॉर्ड नहीं करता। आपके चुनने से पहले कुछ भी लोड नहीं होता, और आप अपना फ़ैसला कभी भी फ़ुटर में "गोपनीयता विकल्प" से बदल सकते हैं।`,
    policy: 'गोपनीयता नीति',
    yes: 'स्वीकार करें',
    no: 'मना करें',
    switchTo: 'English',
    switchLabel: 'Read in English',
    label: 'एनालिटिक्स का चुनाव',
  },
}

/**
 * A small bar at the bottom of the page. It does not block the page and it does not trap focus.
 * It shows until the visitor chooses, and again when they press "Privacy choices" in the footer.
 */
export default function ConsentBanner() {
  const consent = useConsent()
  const pathname = usePathname()
  const [reopened, setReopened] = useState(false)
  const [lang, setLang] = useState<Lang | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const language: Lang = lang ?? localeFromPath(pathname)
  const t = COPY[language]

  useEffect(() => onOpenConsentBanner(() => {
    setReopened(true)
    // move focus to the banner so keyboard and screen-reader users land on it
    window.setTimeout(() => ref.current?.focus(), 30)
  }), [])

  const visible = consent === null || reopened
  if (consent === undefined || !visible) return null

  function choose(choice: 'granted' | 'denied') {
    setReopened(false)
    writeConsent(choice)
  }

  return (
    <div
      ref={ref}
      className="ns-consent"
      role="dialog"
      aria-modal="false"
      aria-label={t.label}
      tabIndex={-1}
      lang={language === 'hi' ? 'hi' : 'en'}
    >
      <div className="ns-consent__head">
        <h2 className="ns-consent__title">{t.title}</h2>
        <button type="button" className="ns-consent__lang" lang={language === 'hi' ? 'en' : 'hi'} aria-label={t.switchLabel} onClick={() => setLang(language === 'hi' ? 'en' : 'hi')}>
          {t.switchTo}
        </button>
      </div>
      <p className="ns-consent__text">
        {t.body} <Link href={localizePath('/privacy-policy', language)}>{t.policy}</Link>
      </p>
      <div className="ns-consent__row">
        <button type="button" className="ns-consent__btn ns-consent__btn--yes" onClick={() => choose('granted')}>{t.yes}</button>
        <button type="button" className="ns-consent__btn" onClick={() => choose('denied')}>{t.no}</button>
      </div>
    </div>
  )
}

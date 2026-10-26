'use client'

import { openConsentBanner } from '@/lib/analytics/consent'

/** The footer link that reopens the consent banner, so agreeing can be undone as easily as it was given */
export default function PrivacyChoices({ children = 'Privacy choices', className }: { children?: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={`ns-privacy-choices${className ? ` ${className}` : ''}`} onClick={openConsentBanner}>
      {children}
    </button>
  )
}

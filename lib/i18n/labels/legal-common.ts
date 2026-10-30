/*
  Hindi legal pages: shared pieces.

  The five legal pages (Privacy Policy, Terms of Use, Refund Policy, Disclaimer, Site Templates Terms) keep their English
  text exactly as it was written in each page file; that is the binding text. On /hi the same page is drawn from a Hindi
  "document" built here (see the legal-*.ts files next to this one) and drawn by components/policy/LegalHiPage.tsx. A
  Hindi document has the same sections, in the same order, with the same number of paragraphs, list items and links as the
  English page. Numbers (prices, hours, days) are never typed in the Hindi: they come from the same constants the English
  page reads (lib/policy.ts, lib/tool-pricing.ts).

  Small markup inside a string, read by components/policy/LegalHiPage.tsx:
    **bold**                 bold text
    {en|personal data}       a word or name that stays English on purpose, marked lang="en" (an English gloss in brackets, the name
                             of an Act or an authority, a cookie name, a subject line to type)
    {mail}                   the contact e-mail address as a mailto link (CONTACT_EMAIL); {mail|subject=Report%20not%20delivered} adds a subject
    {email}                  the same, for the Site Templates wording that already uses this placeholder
    {link|/refund-policy|रिफ़ंड नीति}    an internal link (the language prefix is added by the Link component)
    {ext|https://...|Google}              an outside link that opens in a new tab
    {choices|गोपनीयता विकल्प}              the button that reopens the analytics banner
*/

import { MONTHS_HI } from '@/lib/i18n/labels/pages-common'

/** The notice at the top of every Hindi legal page (SJ to approve or drop). Shown on /hi only. */
export const HI_NOTICE = 'यह पन्ना सुविधा के लिए हिंदी में दिया गया है। दोनों में कोई अंतर होने पर अंग्रेज़ी पाठ ही मान्य होगा।'

/** "Legal" in the page head. */
export const LEGAL_EYEBROW_HI = 'क़ानूनी'

export type LegalBlock =
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  /** the "See a sample report" link; `sample` is a tool's app_type or slug */
  | { sample: string; where: string }

export interface LegalSection {
  /** the id of the heading, as in the English page (aria-labelledby points at it) */
  id: string
  /** the heading; a section with none is named by `aria` instead */
  h?: string
  aria?: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  eyebrow: string
  name: string
  blurb: string
  /** a note box between the head and the first section (Privacy Policy, Disclaimer) */
  head?: { kind: 'info' | 'warn'; title?: string; text: string }
  sections: LegalSection[]
  /** the closing line: a note box ('note') or a small line ('fine') */
  foot?: { kind: 'note' | 'fine'; text: string }
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
  "29 October 2026" -> "29 अक्टूबर 2026". The date stays typed once, in the English page; the Hindi page converts it.
  An unreadable string is returned unchanged (so a reworded date can never silently disappear).
*/
export function dateFromEn(s: string): string {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(s.trim())
  if (!m) return s
  const mi = MONTHS_EN.indexOf(m[2])
  return mi < 0 ? s : `${Number(m[1])} ${MONTHS_HI[mi]} ${m[3]}`
}

/** "Last updated" in front of the date, in the Hindi blurbs. */
export const LAST_UPDATED_HI = 'आख़िरी अपडेट'

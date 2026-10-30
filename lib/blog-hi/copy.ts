/*
  The words around the blog (index heading, card labels, "Published / Updated", "Related guides", the call to action, aria-labels)
  in both languages. The article texts themselves are in articles-a.ts / articles-b.ts; this file only holds the page chrome.

  English is exactly what the blog pages said before they were made bilingual. Hindi follows docs/NirmanShastra_Hindi_Guide.md.
*/
import type { Copy } from '@/lib/i18n/copy'
import type { HiMeta } from '@/lib/i18n/meta'
import { isoDateHi } from '@/lib/i18n/labels/pages-common'
import type { Locale } from '@/lib/i18n/paths'

const STRUCTOPRO_PITCH_EN =
  'StructurePro works out the concrete, steel and cement for the frame of your house from a few answers, with the IS clause behind each rule. The first look at your zone, grades and frame is free.'
const STRUCTOPRO_PITCH_HI =
  'StructurePro कुछ जवाबों से आपके घर के ढाँचे का कंक्रीट, स्टील और सीमेंट निकाल देता है, और हर नियम के पीछे का IS क्लॉज़ साथ दिखाता है। आपके ज़ोन, ग्रेड और ढाँचे की पहली झलक मुफ़्त है।'

const en = {
  eyebrow: 'Guides',
  name: 'IS code guides',
  blurb: (n: number) =>
    `${n} plain-English articles on what the Indian Standards say about concrete, steel, earthquakes, wiring and water, and what that means for the quantities in your house.`,
  indexCta: { kicker: 'Apply what you read', text: STRUCTOPRO_PITCH_EN, label: 'Open StructurePro' },
  articleCta: { kicker: 'Apply this to your house', text: STRUCTOPRO_PITCH_EN, label: 'Open StructurePro' },
  allGuides: 'All guides',
  published: 'Published',
  updated: 'Updated',
  minRead: (n: number) => `${n} min read`,
  read: 'Read',
  hinglish: 'Hinglish',
  faqHeading: 'Frequently asked questions',
  whoWrote: 'Who wrote this',
  related: 'Related guides',
  swipe: 'Swipe sideways to see every column',
  crumbHome: 'Home',
  crumbBlog: 'Blog',
  indexSchemaName: 'Construction Knowledge — IS Code Guides',
  notFoundTitle: 'Article Not Found',
}

const hi: typeof en = {
  eyebrow: 'गाइड',
  name: 'IS कोड गाइड',
  blurb: (n) =>
    `${n} सीधी-सरल भाषा के लेख: भारतीय मानक कंक्रीट, स्टील, भूकंप, वायरिंग और पानी के बारे में क्या कहते हैं, और इसका आपके घर की मात्राओं पर क्या असर पड़ता है।`,
  indexCta: { kicker: 'जो पढ़ा, उसे लगाइए', text: STRUCTOPRO_PITCH_HI, label: 'StructurePro खोलिए' },
  articleCta: { kicker: 'इसे अपने घर पर लगाइए', text: STRUCTOPRO_PITCH_HI, label: 'StructurePro खोलिए' },
  allGuides: 'सभी गाइड',
  published: 'प्रकाशित',
  updated: 'अपडेट',
  minRead: (n) => `${n} मिनट में पढ़िए`,
  read: 'पढ़िए',
  hinglish: 'हिंग्लिश',
  faqHeading: 'अक्सर पूछे जाने वाले सवाल',
  whoWrote: 'यह किसने लिखा',
  related: 'संबंधित गाइड',
  swipe: 'सारे कॉलम देखने के लिए बगल में सरकाइए',
  crumbHome: 'होम',
  crumbBlog: 'ब्लॉग',
  indexSchemaName: 'निर्माण ज्ञान: IS कोड गाइड',
  notFoundTitle: 'लेख नहीं मिला',
}

export const BLOG_COPY: Copy<typeof en> = { en, hi }

/** The words used for the category names, so every Hindi edition spells them the same way. */
export const BLOG_CATEGORY_HI: Record<string, string> = {
  Structural: 'स्ट्रक्चरल',
  'Cost & Transparency': 'लागत और पारदर्शिता',
  Electrical: 'इलेक्ट्रिकल',
  Plumbing: 'प्लंबिंग',
  Vastu: 'वास्तु',
}

/** Hindi title, description and share-image text of the blog index (the brand name and IS numbers stay in Latin letters). */
export const BLOG_INDEX_HI: HiMeta = {
  title: 'IS कोड गाइड: भारतीय मानक क्या कहते हैं, सीधी-सरल भाषा में',
  description:
    'IS 456:2000, IS 1786:2008, IS 1893:2016 और अन्य मानकों पर सीधी-सरल भाषा के गाइड: हर मानक क्या तय करता है, कौन-से आँकड़े इस्तेमाल करता है, और ठेकेदार की मात्राएँ उनसे कैसे जाँचें।',
  imageAlt: 'NirmanShastra: IS कोड गाइड',
}

const enShort = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const enLong = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "25 Oct 2026" on the English cards, "25 अक्टूबर 2026" on the Hindi ones. */
export function shortDate(iso: string, locale: Locale): string {
  return locale === 'hi' ? isoDateHi(iso) : enShort(iso)
}

/** "25 October 2026" in English, "25 अक्टूबर 2026" in Hindi. */
export function longDate(iso: string, locale: Locale): string {
  return locale === 'hi' ? isoDateHi(iso) : enLong(iso)
}

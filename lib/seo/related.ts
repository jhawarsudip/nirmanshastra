// Cross-links from each tool page to the guides and glossary entries that explain it.
// Labels are resolved from the live blog and glossary data, so a renamed post or term
// cannot leave a stale link title behind.

import { BLOG_ARTICLES } from '@/lib/blog-content'
import { GLOSSARY } from '@/lib/seo/glossary'

export interface RelatedLink {
  label: string
  href: string
}

type Ref = { blog: string } | { term: string }

const MAP: Record<string, Ref[]> = {
  '/tools/bar-bending-schedule-calculator': [{ blog: 'steel-required-per-sq-ft' }, { blog: 'steel-theft-construction-sites' }, { term: 'bbs' }],
  '/tools/water-tank-size-calculator': [{ blog: 'water-requirements-is-1172-1993' }, { blog: 'how-to-check-contractor-quote' }, { term: 'lpcd' }],
  '/tools/concrete-mix-ratio-calculator': [{ blog: 'cement-sand-aggregate-for-1000-sq-ft-house' }, { blog: 'm20-vs-m25-concrete-grade' }, { term: 'concrete-grade' }],
  '/tools/brick-calculator': [{ blog: 'bricks-per-sq-ft' }, { blog: 'how-to-check-contractor-quote' }, { term: 'modular-brick' }],
  '/tools/wire-size-calculator': [{ blog: 'rccb-electrical-safety-is-732-2019' }, { blog: 'how-to-check-contractor-quote' }, { term: 'wire-size' }],
  '/tools/ra-bill-retention-tds-calculator': [{ blog: 'how-to-check-contractor-quote' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'ra-bill' }],
  '/tools/concrete-cube-test-calculator': [{ blog: 'verify-contractor-quote-is-456-2000' }, { blog: 'how-to-check-contractor-quote' }, { term: 'cube-test' }],
  '/tools/daily-wage-pf-esi-calculator': [{ term: 'pf-esi' }, { blog: 'how-to-check-contractor-quote' }],
  '/tools/paint-tile-calculator': [{ blog: 'construction-cost-per-sq-ft-india' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'quality-tier' }],
  '/tools/earned-value-calculator': [{ term: 'earned-value' }, { blog: 'ghar-banane-ka-sahi-cost-is-code' }],
  '/tools/structopro': [{ blog: 'cement-sand-aggregate-for-1000-sq-ft-house' }, { blog: 'steel-required-per-sq-ft' }, { blog: 'seismic-zones-india-is-1893' }, { blog: 'construction-cost-per-sq-ft-india' }],
  '/tools/masonpro': [{ blog: 'bricks-per-sq-ft' }, { blog: 'how-to-check-contractor-quote' }, { term: 'aac-block' }],
  '/tools/electropro': [{ blog: 'rccb-electrical-safety-is-732-2019' }, { term: 'wire-size' }, { term: 'mcb-rccb' }],
  '/tools/plumbpro': [{ blog: 'water-requirements-is-1172-1993' }, { term: 'lpcd' }],
  '/tools/interiorpro': [{ blog: 'construction-cost-per-sq-ft-india' }, { blog: 'per-sqft-pricing-contractor-fraud' }, { term: 'quality-tier' }],
  '/tools/grand-total': [{ blog: 'how-to-check-contractor-quote' }, { term: 'boq' }],
  '/tools/complete-house-pack': [{ blog: 'how-to-check-contractor-quote' }, { term: 'boq' }],
}

/** Hindi link titles for the guides and glossary entries above (the pages they open follow the visitor's language as it gets translated). */
const HI_BLOG: Record<string, string> = {
  'steel-required-per-sq-ft': 'प्रति वर्ग फ़ुट कितना स्टील? अंगूठे का नियम, प्रकाशित सीमा और डिलीवरी कैसे जाँचें',
  'steel-theft-construction-sites': 'निर्माण साइटों पर स्टील की चोरी: इसे कैसे पकड़ें',
  'water-requirements-is-1172-1993': 'आपके परिवार को कितना पानी चाहिए? IS 1172:1993 की व्याख्या',
  'how-to-check-contractor-quote': 'ठेकेदार का कोटेशन कैसे जाँचें: 7 जाँचें जो आप ख़ुद कर सकते हैं',
  'cement-sand-aggregate-for-1000-sq-ft-house': '1,000 वर्ग फ़ुट के घर के लिए सीमेंट, रेत और गिट्टी: अंगूठे का नियम और वह कहाँ चूकता है',
  'm20-vs-m25-concrete-grade': 'M20 बनाम M25 कंक्रीट: आपकी इमारत को कौन-सा ग्रेड चाहिए?',
  'bricks-per-sq-ft': 'प्रति वर्ग फ़ुट दीवार में ईंटें: लाल ईंट और मॉड्यूलर ईंट, पूरी और आधी मोटाई',
  'rccb-electrical-safety-is-732-2019': 'RCCB और बिजली की सुरक्षा: IS 732:2019 क्या माँगता है',
  'per-sqft-pricing-contractor-fraud': 'प्रति वर्ग फ़ुट का रेट: यह ठेकेदार की धोखाधड़ी क्यों छिपाता है',
  'verify-contractor-quote-is-456-2000': 'ठेकेदार का कोटेशन IS 456:2000 से कैसे जाँचें',
  'construction-cost-per-sq-ft-india': 'भारत में निर्माण की प्रति वर्ग फ़ुट लागत: रेट आपको क्या नहीं बताता',
  'ghar-banane-ka-sahi-cost-is-code': 'घर बनाने में कितना माल लगेगा: रेट से पहले क्वांटिटी निकालिए',
  'seismic-zones-india-is-1893': 'भारत के भूकंप ज़ोन: IS 1893:2016 आपके घर के लिए क्या मायने रखता है',
}

const HI_TERM: Record<string, string> = {
  bbs: 'BBS (बार बेंडिंग शेड्यूल)',
  lpcd: 'LPCD (प्रति व्यक्ति प्रति दिन लीटर)',
  'concrete-grade': 'कंक्रीट ग्रेड (M20, M25)',
  'modular-brick': 'मॉड्यूलर ईंट',
  'wire-size': 'वायर साइज़ (वर्ग mm)',
  'ra-bill': 'RA बिल (रनिंग अकाउंट बिल)',
  'cube-test': 'क्यूब टेस्ट',
  'pf-esi': 'PF और ESI',
  'quality-tier': 'क्वालिटी टियर',
  'earned-value': 'अर्नड वैल्यू (PV, EV, AC, BAC, SPI, CPI, EAC)',
  'aac-block': 'AAC ब्लॉक',
  'mcb-rccb': 'MCB, RCCB और RCBO',
  boq: 'BOQ (बिल ऑफ़ क्वांटिटीज़)',
}

/** The links for a tool page. `locale` only changes the titles (Hindi when the page is /hi); the targets are the same. */
export function relatedLinksFor(path: string, locale: string = 'en'): RelatedLink[] {
  const hi = locale === 'hi'
  const out: RelatedLink[] = []
  for (const ref of MAP[path] ?? []) {
    if ('blog' in ref) {
      const a = BLOG_ARTICLES.find((x) => x.slug === ref.blog)
      if (a) out.push({ label: (hi && HI_BLOG[a.slug]) || a.title, href: `/blog/${a.slug}` })
    } else {
      const t = GLOSSARY.flatMap((g) => g.terms).find((x) => x.id === ref.term)
      if (t) out.push({ label: hi ? `शब्दावली: ${HI_TERM[t.id] ?? t.term}` : `Glossary: ${t.term}`, href: `/glossary#${t.id}` })
    }
  }
  return out
}

/*
  Hindi for /site-templates/terms (app/[locale]/site-templates/terms/page.tsx).

  The Hindi wording sits next to the English in lib/site-templates-terms.ts (one record per section, so the two cannot drift).
  This file only adds the page chrome and lays the records out as a LegalDoc: the intro, the nine sections in the English order,
  and the one-line summary with its "see also" links.
*/
import { ST_TERMS_INTRO_HI, ST_TERMS_SECTIONS, ST_TERMS_SUMMARY_HI, ST_TERMS_UPDATED } from '@/lib/site-templates-terms'
import { dateFromEn, LAST_UPDATED_HI, LEGAL_EYEBROW_HI, type LegalDoc } from '@/lib/i18n/labels/legal-common'

export function templatesTermsDocHi(): LegalDoc {
  return {
    eyebrow: `${LEGAL_EYEBROW_HI} · साइट टेम्पलेट`,
    name: 'साइट टेम्पलेट की शर्तें और लाइसेंस',
    blurb: `/site-templates पर बिकने वाली Excel फ़ाइलों की लाइसेंस, डिलीवरी और रिफ़ंड की शर्तें। ${LAST_UPDATED_HI}: ${dateFromEn(ST_TERMS_UPDATED)}।`,
    sections: [
      { id: 'stt-scope', aria: 'दायरा', blocks: [{ p: ST_TERMS_INTRO_HI }] },
      ...ST_TERMS_SECTIONS.map((s) => ({
        id: `stt-${s.id}`,
        h: s.hi.heading,
        blocks: s.hi.paragraphs.map((p) => ({ p })),
      })),
    ],
    foot: {
      kind: 'note',
      text: `${ST_TERMS_SUMMARY_HI} {link|/terms-of-use|उपयोग की शर्तें}, {link|/privacy-policy|गोपनीयता नीति} और {link|/site-templates|साइट टेम्पलेट} भी देखिए।`,
    },
  }
}

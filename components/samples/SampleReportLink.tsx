import type { SVGProps } from 'react'
import { sampleHref, sampleKeyFor, SAMPLES, SAMPLE_HOUSE } from '@/lib/samples/catalogue'
import '@/styles/v2/assure.css'

/*
  "See a sample report (free PDF)". A plain link to a real example report in /public/samples: no email, no sign-up.
  Opens in a new tab. The click is counted as `sample_report_download` by components/analytics/Analytics.tsx.
  `sample` takes a tool's app_type or slug; the Complete House Pack points to the Grand Total sample, which is the pack's summary.
*/

const IcPdf = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M6 3h8l5 5v13H6V3z" /><path d="M14 3v5h5" /><path d="M9 14h6M9 17.5h4" />
  </svg>
)

export default function SampleReportLink({ sample, hi = false, where, className = '' }: {
  sample: string
  hi?: boolean
  /** where on the page this link sits, for the click report */
  where: string
  className?: string
}) {
  const key = sampleKeyFor(sample)
  if (!key) return null
  const isPack = sample === 'completepack'
  const label = hi ? 'नमूना रिपोर्ट देखिए (मुफ़्त PDF)' : 'See a sample report (free PDF)'
  const small = isPack
    ? (hi ? 'ग्रैंड टोटल, जो पैक के साथ आती है। एक उदाहरण-घर के लिए असली रिपोर्ट (अंग्रेज़ी में)।' : 'The Grand Total summary that comes with the pack: a real report for an example house.')
    : (hi ? `${SAMPLES[key].tool}: एक उदाहरण-घर (G+1, हर मंज़िल पर 1,000 वर्ग फ़ुट, लखनऊ) के लिए असली रिपोर्ट, अंग्रेज़ी में। ईमेल की ज़रूरत नहीं।` : `${SAMPLES[key].tool}: a real report for an example house (${SAMPLE_HOUSE.describe}). No email needed.`)
  return (
    <a
      className={`ns-sample ${className}`.trim()}
      href={sampleHref(key)}
      target="_blank"
      rel="noopener"
      data-ns-event="sample_report_download"
      data-ns-label={SAMPLES[key].file.replace(/\.pdf$/, '')}
      data-ns-where={where}
    >
      <IcPdf className="ns-sample__ic" width={22} height={22} />
      <span className="ns-sample__t">
        <b>{label}</b>
        <small>{small}</small>
      </span>
    </a>
  )
}

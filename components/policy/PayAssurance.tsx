import SampleReportLink from '@/components/samples/SampleReportLink'
import '@/styles/v2/assure.css'

/*
  Shown beside every pay button: the sample report, so the buyer can see exactly what they are paying for before they pay.
  (The refund line that used to sit here was removed on 29 Oct 2026; the terms are in the Terms of Use and on /refund-policy.)
*/
export default function PayAssurance({ sample, hi = false, where = 'pay_button', showSample = true }: {
  /** the app_type of what is being sold, to pick the sample */
  sample: string
  hi?: boolean
  where?: string
  showSample?: boolean
}) {
  if (!showSample) return null
  return (
    <div className="ns-assure" data-ns-where={where}>
      <SampleReportLink sample={sample} hi={hi} where={where} />
    </div>
  )
}

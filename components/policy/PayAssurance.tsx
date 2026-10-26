import Link from 'next/link'
import SampleReportLink from '@/components/samples/SampleReportLink'
import { REFUND_SHORT_EN, REFUND_SHORT_HI } from '@/lib/policy'
import '@/styles/v2/assure.css'

/*
  Shown beside every pay button: the refund promise in one line, a link to the full policy, and the sample report.
  The wording comes from lib/policy.ts, so the number of days is the same everywhere.
*/
export default function PayAssurance({ sample, hi = false, where = 'pay_button', showSample = true }: {
  /** the app_type of what is being sold, to pick the sample */
  sample: string
  hi?: boolean
  where?: string
  showSample?: boolean
}) {
  return (
    <div className="ns-assure" data-ns-where={where}>
      <p className="ns-assure__refund">
        <b>{hi ? 'रिफ़ंड का वादा।' : 'Refund promise.'}</b> {hi ? REFUND_SHORT_HI : REFUND_SHORT_EN}{' '}
        <Link href="/refund-policy">{hi ? 'रिफ़ंड नीति पढ़िए' : 'Read the refund policy'}</Link>
      </p>
      {showSample ? <SampleReportLink sample={sample} hi={hi} where={where} /> : null}
    </div>
  )
}

import Founder from '@/components/v2/Founder'

/* Homepage band: who builds it. Short on purpose; the full account is on /about. */
export default function FounderBand({ loc }: { loc: 'en' | 'hi' }) {
  return (
    <section className="ns-fdr-band" id="founder" aria-label={loc === 'hi' ? 'इसे कौन बनाता है' : 'Who builds it'}>
      <div className="ns-wrap">
        <Founder loc={loc} heading={loc === 'hi' ? 'इसे कौन बनाता है' : 'Who builds it'} link />
      </div>
    </section>
  )
}

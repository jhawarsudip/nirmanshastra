import { Link } from '@/i18n/navigation'
import type { ReactNode } from 'react'
import { FOUNDER_LINE, FOUNDER_PHOTO, FOUNDER_PHOTO_ALT } from '@/lib/founder'
import '@/styles/v2/founder.css'

/*
  The founder line, with the founder's photo when (and only when) one is supplied in lib/founder.ts.
  The founder's name is never shown. Used on the homepage, /about and under every guide.
*/
export default function Founder({ loc = 'en', heading, more, link = false }: {
  loc?: 'en' | 'hi'
  /** the small label above the line, for example "Who builds it" */
  heading?: string
  /** extra sentence(s) under the line */
  more?: ReactNode
  /** add a "More about us" link to /about */
  link?: boolean
}) {
  return (
    <aside className="ns-plate ns-fdr" aria-label={heading ?? FOUNDER_LINE.en}>
      {FOUNDER_PHOTO ? (
        // A plain img: the address is checked in lib/founder.ts and may be on any https host.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ns-fdr__photo" src={FOUNDER_PHOTO} alt={FOUNDER_PHOTO_ALT} width={92} height={92} loading="lazy" decoding="async" />
      ) : null}
      <div className="ns-fdr__body">
        {heading ? <p className="ns-fdr__k">{heading}</p> : null}
        <p className="ns-fdr__line" lang={loc === 'hi' ? 'hi' : undefined}>{FOUNDER_LINE[loc]}</p>
        {more ? <p className="ns-fdr__more">{more}</p> : null}
        {link ? <p className="ns-fdr__more"><Link href="/about">{loc === 'hi' ? 'हमारे बारे में और पढ़िए' : 'More about us'}</Link></p> : null}
      </div>
    </aside>
  )
}

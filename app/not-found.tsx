import type { Metadata } from 'next'
import Link from 'next/link'
import InnerShell from '@/components/v2/inner/InnerShell'
import { IcArrow } from '@/components/v2/inner/kit'
import '@/styles/v2/content.css'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

// The old site chrome is gone from the root layout, so a missing page needs its own frame.
// The page-head and card classes are the ones the sign-in page uses.
const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/tools/structopro', 'StructurePro: structure quantities'],
  ['/blog', 'IS code guides'],
  ['/site-templates', 'Excel templates'],
  ['/contact', 'Contact us'],
]

export default function NotFound() {
  return (
    <InnerShell>
      <div className="ns-i-page">
        <div className="ns-i-wrap">
          <div className="ns-au">
            <header className="ns-au-head">
              <p className="ns-au-eyebrow">Error 404</p>
              <h1>That page isn&apos;t here</h1>
              <p>The link may be old, or the address may have a typo. These will get you back on track.</p>
            </header>
            <nav className="ns-plate ns-au-card" aria-label="Useful pages">
              <ul className="ns-nf-list">
                {LINKS.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href}>
                      <span>{label}</span>
                      <IcArrow width={22} height={11} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </InnerShell>
  )
}

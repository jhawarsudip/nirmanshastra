import { Link } from '@/i18n/navigation'
import InnerShell from '@/components/v2/inner/InnerShell'
import { IcArrow } from '@/components/v2/inner/kit'
import type { Copy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/paths'
import '@/styles/v2/content.css'

// The page-head and card classes are the ones the sign-in page uses.
const en = {
  eyebrow: 'Error 404',
  title: "That page isn't here",
  body: 'The link may be old, or the address may have a typo. These will get you back on track.',
  nav: 'Useful pages',
  links: [
    ['/', 'Home'],
    ['/tools/structopro', 'StructurePro: structure quantities'],
    ['/blog', 'IS code guides'],
    ['/site-templates', 'Excel templates'],
    ['/contact', 'Contact us'],
  ] as [string, string][],
}
const hi: typeof en = {
  eyebrow: 'त्रुटि 404',
  title: 'यह पेज यहाँ नहीं है',
  body: 'लिंक पुराना हो सकता है, या पते में कोई ग़लती हो सकती है। इनसे आप सही जगह पहुँच जाएँगे।',
  nav: 'काम के पेज',
  links: [
    ['/', 'होम'],
    ['/tools/structopro', 'StructurePro: ढाँचे की मात्रा'],
    ['/blog', 'IS कोड गाइड'],
    ['/site-templates', 'Excel टेम्पलेट'],
    ['/contact', 'हमसे संपर्क करें'],
  ],
}
export const NOT_FOUND: Copy<typeof en> = { en, hi }

/** The "page not found" screen, in the visitor's language, inside the usual site frame. */
export default function NotFoundView({ locale }: { locale: Locale }) {
  const t = NOT_FOUND[locale]
  return (
    <InnerShell locale={locale}>
      <div className="ns-i-page">
        <div className="ns-i-wrap">
          <div className="ns-au">
            <header className="ns-au-head">
              <p className="ns-au-eyebrow">{t.eyebrow}</p>
              <h1>{t.title}</h1>
              <p>{t.body}</p>
            </header>
            <nav className="ns-plate ns-au-card" aria-label={t.nav}>
              <ul className="ns-nf-list">
                {t.links.map(([href, label]) => (
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

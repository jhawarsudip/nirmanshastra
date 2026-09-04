import type { Metadata } from 'next'

const title = 'Daily-Wage PF & ESI Calculator — Construction Site Muster Roll | Net Payable'
const description =
  'Free daily-wage PF & ESI calculator built for construction site labour — muster-roll style, not monthly office payroll. Enter the daily wage and payable days (decimals allowed, e.g. 23.5), optional overtime and advance, and get basic earned, gross wages, employee PF (12% capped at ₹1,800), employee ESI (0.75% of gross, only up to the ₹21,000 ceiling) and the final net payable. Net Payable = Gross − PF − ESI − Advance. Ported from NirmanShastra’s Labour & Statutory Compliance Wage Register. Permanently free, no login.'
const url = '/tools/daily-wage-pf-esi-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'Daily-Wage PF & ESI Calculator — Construction Site Muster Roll',
    description:
      'Daily rate × payable days (23.5 allowed) → basic, gross, PF (12% capped ₹1,800), ESI (0.75% up to ₹21,000) and net payable. Built for site labour, not monthly salary. Free, no login.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Daily-Wage PF & ESI Muster-Roll Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily-Wage PF & ESI Calculator — Site Muster Roll',
    description:
      'PF & ESI the way site wages actually work: daily rate, variable days (23.5 fine), 12% PF capped ₹1,800, 0.75% ESI up to ₹21,000, net payable out. Free, no login.',
    images: ['/og-image.png'],
  },
}

export default function DailyWagePfEsiCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

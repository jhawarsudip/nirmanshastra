import type { Metadata } from 'next'

const title = 'Earned Value Calculator — SV, CV, SPI, CPI, EAC, TCPI | EVM Analysis'
const description =
  'Free earned value (EVM) calculator for construction and project controls. Enter Budget at Completion (BAC), Planned Value (PV), Earned Value (EV) and Actual Cost (AC) to date, and get the full set: schedule variance (SV), cost variance (CV), SPI, CPI, estimate at completion (EAC), estimate to complete (ETC), variance at completion (VAC) and TCPI — plus a plain-language SPI/CPI reading guide. SV = EV − PV · CV = EV − AC · SPI = EV ÷ PV · CPI = EV ÷ AC · EAC = BAC ÷ CPI · TCPI = (BAC − EV) ÷ (BAC − AC). Ported from NirmanShastra’s Planning, Progress & Delay Control product. Permanently free, no login.'
const url = '/tools/earned-value-calculator'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'NirmanShastra',
    url,
    title: 'Earned Value Calculator — SV, CV, SPI, CPI, EAC & TCPI',
    description:
      'BAC, PV, EV and AC in — schedule variance, cost variance, SPI, CPI, EAC, ETC, VAC and TCPI out, with a plain SPI/CPI reading guide. Standard EVM formulas, free and no login.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — Earned Value (EVM) Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earned Value Calculator — SPI, CPI, EAC & TCPI',
    description:
      'Four inputs (BAC, PV, EV, AC) → the eight EVM metrics and a 2×2 SPI/CPI reading. Earned value measures value executed, not activities ticked. Free, no login.',
    images: ['/og-image.png'],
  },
}

export default function EarnedValueCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

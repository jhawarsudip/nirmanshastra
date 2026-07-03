import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "FAQ — Construction Cost Estimator | NirmanShastra",
  description: "Frequently asked questions about NirmanShastra's IS-code construction cost tools — report accuracy, payment process, material rates, and how calculations are done.",
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

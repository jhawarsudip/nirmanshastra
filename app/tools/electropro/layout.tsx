import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "ElectricalPro — House Wiring Cost Estimator | IS 732:2019",
  description: "Calculate wire lengths, DB panel circuits, and MCB costs using IS 732:2019. Know exact electrical quantities before your contractor quotes. ₹499/report.",
}

export default function ElectroProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

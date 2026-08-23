import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "InteriorPro — Home Interior Cost Estimator | Flooring, Kitchen & Paint",
  description: "Calculate flooring, kitchen, false ceiling, and paint costs across 4 quality grades — Basic to Luxury. Get exact interior BOQ for your home construction. ₹899/report.",
}

export default function InteriorProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

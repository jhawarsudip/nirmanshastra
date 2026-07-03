import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "VastuPro — Free Vastu Compliance Checker | 33-Room Analysis",
  description: "Free online Vastu analysis for your home. Upload floor plan, mark 33 rooms, get zone-by-zone compliance score and free PDF report. No payment needed.",
}

export default function VastuProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

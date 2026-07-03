import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "StructurePro — RCC Structure Cost Calculator | IS 456:2000",
  description: "Calculate exact concrete, steel, and structural costs for your building using IS 456:2000. Get itemised BOQ with material quantities.",
}

export default function StructoProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

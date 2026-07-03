import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "PlumbingPro — Plumbing Cost Calculator | IS 1172:1993",
  description: "Calculate pipe lengths, tank sizes, pump HP, and fixture costs per IS 1172:1993. Get itemised plumbing BOQ for your home construction. ₹499/report.",
}

export default function PlumbProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

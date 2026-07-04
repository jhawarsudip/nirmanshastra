import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "MasonryPro — Brickwork & Masonry Cost Calculator | IS 1077:1992",
  description: "Calculate exact brick counts, mortar quantities, and plastering costs for 8 wall types. IS 1077:1992 verified. Get itemised masonry BOQ for your home.",
}

export default function MasonryProLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

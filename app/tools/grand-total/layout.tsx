import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Grand Total Report — Complete Construction Cost Summary",
  description: "Merge all 5 construction phases into one Grand Total report. Complete BOQ covering RCC structure, masonry, electrical, plumbing, and interior. ₹999 or free with all 5 paid tools.",
}

export default function GrandTotalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

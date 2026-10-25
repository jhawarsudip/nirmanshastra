import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
export const metadata: Metadata = {
  title: 'My reports',
  description: 'Your saved NirmanShastra quantity reports. Download a paid PDF report again at any time.',
  robots: { index: false, follow: false },
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}

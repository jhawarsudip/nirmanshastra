import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
export const metadata: Metadata = {
  title: 'Account settings',
  description: 'Manage your NirmanShastra account preferences and data-sharing settings.',
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}

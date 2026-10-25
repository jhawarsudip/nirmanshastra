import type { Metadata } from 'next'
import InnerShell from '@/components/v2/inner/InnerShell'
import '@/styles/v2/content.css'

// A private page: kept out of search results. The root layout's title template appends " | NirmanShastra".
export const metadata: Metadata = {
  title: 'Log in or create an account',
  description: 'Log in to NirmanShastra to see your saved reports, or create an account.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}

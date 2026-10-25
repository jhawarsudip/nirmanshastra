import type { Metadata } from 'next'

// The parent layout supplies the page frame; this one only gives the page its own title.
export const metadata: Metadata = {
  title: 'Set a new password | NirmanShastra',
  description: 'Choose a new password for your NirmanShastra account.',
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}

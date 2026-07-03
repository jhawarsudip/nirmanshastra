import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact NirmanShastra — Civil Engineering Support",
  description: "Questions about your construction cost estimate? Contact the NirmanShastra team for technical support, IS-code clarification, and billing queries.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

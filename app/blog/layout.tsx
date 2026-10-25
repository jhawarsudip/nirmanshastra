import InnerShell from '@/components/v2/inner/InnerShell'

// Each blog page sets its own metadata; this layout only gives the whole section the v2 frame.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <InnerShell>{children}</InnerShell>
}

import type { Metadata } from 'next'
import NotFoundView from '@/components/v2/inner/NotFoundView'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

// Reached only for an address with no language segment that the page tree cannot place (for example an
// unknown first path segment that is not a language). Every other missing page is handled by
// app/[locale]/not-found.tsx, which answers in the visitor's language.
export default function NotFound() {
  return <NotFoundView locale="en" />
}

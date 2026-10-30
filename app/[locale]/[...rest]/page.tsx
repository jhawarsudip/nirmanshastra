import { notFound } from 'next/navigation'

// Any address under a language that no page claims lands here and is answered by app/[locale]/not-found.tsx,
// so a missing page still shows the site frame, in the right language, with a real 404 status.
export default function CatchAll() {
  notFound()
}

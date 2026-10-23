'use client'

import Header from './Header'
import Staff from './Staff'
import CadCursor from './CadCursor'
import { HatchDefs } from './Icons'

/** Page-level v2 chrome: header, level-staff progress, CAD cursor, shared hatch patterns, section-cut wipe layer. */
export default function Chrome({ locale }: { locale: 'en' | 'hi' }) {
  return (
    <>
      <HatchDefs />
      <Header locale={locale} />
      <Staff />
      <CadCursor />
      <div className="ns-cutwipe" aria-hidden="true" />
    </>
  )
}

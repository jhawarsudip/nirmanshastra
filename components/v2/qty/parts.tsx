'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Note } from '@/components/v2/inner/kit'
import { useCopy } from '@/lib/i18n/use-copy'
import { QTY_PARTS } from '@/lib/i18n/labels/qty-ui'

/* Small pieces every report page uses. */

/** One big total in "What to order". */
export function Tot({ k, v, unit, range }: { k: string; v: string; unit: string; range?: string }) {
  return (
    <div className="ns-r-tot">
      <span className="ns-r-tot__k">{k}</span>
      <span className="ns-r-tot__v">{v}<small>{unit}</small></span>
      {range ? <span className="ns-r-tot__r">{range}</span> : null}
    </div>
  )
}

/** A report table. Cells arrive already formatted. The first column is the row heading. */
export function ReportTable({ head, rows, foot, tight, num, stack, labelRow, sticky }: { head: string[]; rows: ReactNode[][]; foot?: ReactNode[]; tight?: boolean; num?: number[]; stack?: boolean; labelRow?: boolean; sticky?: boolean }) {
  const k = useCopy(QTY_PARTS)
  const isNum = (i: number) => (num ?? []).includes(i)
  // On a phone a table of up to five columns reads better as stacked rows, each cell carrying its column name, than as a sideways scroll.
  // Long schedules (the quantity tables) pass stack={false} and keep the swipe. A wide lookup grid (six or more columns) passes sticky so the row name stays put while the figures swipe.
  const stacked = stack ?? head.length <= 5
  // labelRow: the first column is itself a reading (SPI, CPI), not a name, so it keeps its column name when stacked
  const lab = (ci: number) => (ci > 0 || labelRow ? head[ci] : undefined)
  return (
    <>
    {!stacked ? <p className="ns-i-swipe" aria-hidden="true">{k.swipe} &rarr;</p> : null}
    <div className="ns-i-tblw">
      <table className={`ns-i-tbl ns-r-tbl${tight ? ' ns-r-tbl--tight' : ''}${stacked ? ' ns-r-tbl--stack' : ''}${sticky && !stacked ? ' ns-r-tbl--sticky' : ''}`}>
        <thead><tr>{head.map((h, i) => <th key={h + i} scope="col" className={isNum(i) ? 'ns-i-num' : undefined} style={isNum(i) ? { textAlign: 'right' } : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>{r.map((c, ci) => (ci === 0 ? <th key={ci} scope="row" data-label={lab(0)}>{c}</th> : <td key={ci} data-label={lab(ci)} className={isNum(ci) ? 'ns-i-num' : undefined}>{c}</td>))}</tr>
          ))}
        </tbody>
        {foot ? <tfoot><tr>{foot.map((c, ci) => (ci === 0 ? <th key={ci} scope="row" data-label={lab(0)}>{c}</th> : <td key={ci} data-label={lab(ci)} className={isNum(ci) ? 'ns-i-num' : undefined}>{c}</td>))}</tr></tfoot> : null}
      </table>
    </div>
    </>
  )
}

/**
 * Says plainly whether the report was emailed, and warns a guest that the email or the download is their only copy.
 * emailSent is true or false once the server has tried; null when it did not try this time (the PDF already existed).
 */
export function DeliveryNote({ emailSent }: { emailSent: boolean | null }) {
  const k = useCopy(QTY_PARTS)
  const [guest, setGuest] = useState(false)
  useEffect(() => {
    let off = false
    createClient().auth.getUser().then(({ data }) => { if (!off) setGuest(data.user?.is_anonymous === true) }).catch(() => {})
    return () => { off = true }
  }, [])

  if (emailSent === false) {
    return (
      <Note kind="warn" title={k.emailFailed}>
        {k.keepFile(guest)}
      </Note>
    )
  }
  if (!guest) return emailSent ? <Note kind="ok">{k.emailedToo}</Note> : null
  return (
    <Note kind="warn" title={k.keepTitle}>
      {k.guestBefore(!!emailSent)}<Link href="/account">{k.accountSettings}</Link>{k.guestAfter}
    </Note>
  )
}

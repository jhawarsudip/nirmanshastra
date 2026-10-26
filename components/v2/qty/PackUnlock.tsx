'use client'

import { Note, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { PACK_LABEL } from '@/lib/pack/shared'
import type { PaidAppType } from '@/lib/tool-pricing'
import { usePack } from './usePack'

/*
  "Use my Complete House Pack": shown above the pay button on a report that the visitor's pack can still unlock.
  It renders nothing for anyone without a paid pack, so the page for everyone else is unchanged.
  The server decides whether the pack can unlock this report (lib/pack/server.ts); this only asks.
*/
export default function PackUnlock({ appType, estimateId, onUnlocked }: { appType: PaidAppType; estimateId: string | null; onUnlocked: () => void }) {
  const pack = usePack(appType)
  if (!pack.available && !pack.exhausted) return null
  const label = PACK_LABEL[appType]

  if (pack.exhausted) {
    return (
      <Note kind="info" title="Your Complete House Pack">
        Your pack has already made the {pack.perReport} {label} {pack.perReport === 1 ? 'report' : 'reports'} it includes. You can pay for this one below.
      </Note>
    )
  }

  return (
    <div className="ns-r-pack" role="group" aria-label="Use your Complete House Pack">
      <p className="ns-r-hook__k"><IcCheck width={16} height={16} /> You have a Complete House Pack</p>
      <p className="ns-i-fine" style={{ margin: '4px 0 12px' }}>
        {pack.left} of {pack.perReport} {label} {pack.perReport === 1 ? 'report' : 'reports'} left in your pack. Nothing more to pay.
      </p>
      <button
        type="button"
        className="ns-btn"
        disabled={pack.busy || !estimateId}
        onClick={async () => { if (await pack.redeem(estimateId)) onUnlocked() }}
      >
        {pack.busy ? 'Unlocking…' : 'Use my Complete House Pack'}
        {!pack.busy && <IcArrow width={22} height={11} />}
      </button>
      {pack.error && <Note kind="err">{pack.error}</Note>}
      <p className="ns-i-fine" style={{ marginTop: 12 }}>Or pay for this report on its own:</p>
    </div>
  )
}

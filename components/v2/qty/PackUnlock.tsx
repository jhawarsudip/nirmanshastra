'use client'

import { Note, IcArrow, IcCheck } from '@/components/v2/inner/kit'
import { PACK_LABEL } from '@/lib/pack/shared'
import type { PaidAppType } from '@/lib/tool-pricing'
import { usePack } from './usePack'
import { useCopy } from '@/lib/i18n/use-copy'
import { useQtyTr } from '@/lib/i18n/use-qty-tr'
import { QTY_PACK } from '@/lib/i18n/labels/qty-ui'

/*
  "Use my Complete House Pack": shown above the pay button on a report that the visitor's pack can still unlock.
  It renders nothing for anyone without a paid pack, so the page for everyone else is unchanged.
  The server decides whether the pack can unlock this report (lib/pack/server.ts); this only asks.
*/
export default function PackUnlock({ appType, estimateId, onUnlocked }: { appType: PaidAppType; estimateId: string | null; onUnlocked: () => void }) {
  const pack = usePack(appType)
  const k = useCopy(QTY_PACK)
  const t = useQtyTr('none')
  if (!pack.available && !pack.exhausted) return null
  const label = PACK_LABEL[appType]

  if (pack.exhausted) {
    return (
      <Note kind="info" title={k.title}>
        {k.used(pack.perReport, label)}
      </Note>
    )
  }

  return (
    <div className="ns-r-pack" role="group" aria-label={k.group}>
      <p className="ns-r-hook__k"><IcCheck width={16} height={16} /> {k.have}</p>
      <p className="ns-i-fine" style={{ margin: '4px 0 12px' }}>
        {k.left(pack.left, pack.perReport, label)}
      </p>
      <button
        type="button"
        className="ns-btn"
        disabled={pack.busy || !estimateId}
        onClick={async () => { if (await pack.redeem(estimateId)) onUnlocked() }}
      >
        {pack.busy ? k.unlocking : k.use}
        {!pack.busy && <IcArrow width={22} height={11} />}
      </button>
      {pack.error && <Note kind="err">{t(pack.error)}</Note>}
      <p className="ns-i-fine" style={{ marginTop: 12 }}>{k.orPay}</p>
    </div>
  )
}

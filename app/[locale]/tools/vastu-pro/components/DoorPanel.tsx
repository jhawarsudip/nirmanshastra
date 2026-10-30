'use client'

import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { DOOR_KINDS } from '../vastu-catalogue'
import { kindLabelOf } from '../vastu-hi'
import { COPY } from '../copy'
import type { DoorMark } from '../vastu-model'

interface Props {
  doors: DoorMark[]
  active: string
  onActive: (kind: string) => void
  onRemove: (kind: string) => void
  notes: Record<string, string | undefined>
  /** the plot sits about 45 degrees to the compass, so the position along each side is not read */
  diagonal?: boolean
}

/*
  The doors. One tap on the outline puts the active door there. The coloured bars on the sheet show the eight positions
  along each side of the plot, as the old texts name them.
*/
export default function DoorPanel({ doors, active, onActive, onRemove, notes, diagonal }: Props) {
  const t = useCopy(COPY).doors
  const hi = useLocale() === 'hi'
  return (
    <div className="ns-plate ns-v-rooms ns-v-doors">
      <div className="ns-v-rooms__head">
        <h2>{t.title}</h2>
        <span className="ns-v-rooms__count">{t.onPlan(doors.length)}</span>
      </div>

      <div className="ns-v-doors__intro">
        <p>{t.intro}</p>
        {diagonal ? (
          <p className="ns-v-doors__diag">{t.diag}</p>
        ) : (
        <p className="ns-v-doors__key" aria-label={t.keyAria}>
          <span><i data-tone="favourable" /> {t.keyFav}</span>
          <span><i data-tone="mixed" /> {t.keyMixed}</span>
          <span><i data-tone="cautioned" /> {t.keyCaut}</span>
        </p>
        )}
      </div>

      <div className="ns-v-rooms__list">
        {DOOR_KINDS.map(k => {
          const placed = doors.some(d => d.kind === k.key)
          const note = notes[k.key]
          const label = kindLabelOf(hi, k.key, k.label)
          return (
            <div key={k.key} className="ns-v-doorrow">
              <button type="button" className="ns-v-room" aria-pressed={active === k.key} onClick={() => onActive(k.key)}>
                <span>
                  {label}
                  {note && <small> · {note}</small>}
                </span>
                {placed ? <span className="ns-v-room__n" aria-label={t.placed}>✓</span> : <span className="ns-v-room__add" aria-hidden="true">{t.tap}</span>}
              </button>
              {placed && (
                <button type="button" className="ns-v-sbtn ns-v-sbtn--danger ns-v-doorrow__x" onClick={() => onRemove(k.key)} aria-label={t.removeAria(label)}>{t.remove}</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

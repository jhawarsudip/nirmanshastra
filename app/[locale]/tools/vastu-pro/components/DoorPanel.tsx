'use client'

import { DOOR_KINDS } from '../vastu-catalogue'
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
  return (
    <div className="ns-plate ns-v-rooms ns-v-doors">
      <div className="ns-v-rooms__head">
        <h2>Doors</h2>
        <span className="ns-v-rooms__count">{doors.length} on the plan</span>
      </div>

      <div className="ns-v-doors__intro">
        <p>Choose a door, then tap the outline on the sheet where it is. Tap again to move it.</p>
        {diagonal ? (
          <p className="ns-v-doors__diag">Your plot sits about 45° to the compass, so the old texts’ positions along each side do not apply. A door here is read by its direction only.</p>
        ) : (
        <p className="ns-v-doors__key" aria-label="Key to the bars along the boundary">
          <span><i data-tone="favourable" /> named favourable</span>
          <span><i data-tone="mixed" /> mixed</span>
          <span><i data-tone="cautioned" /> cautioned</span>
        </p>
        )}
      </div>

      <div className="ns-v-rooms__list">
        {DOOR_KINDS.map(k => {
          const placed = doors.some(d => d.kind === k.key)
          const note = notes[k.key]
          return (
            <div key={k.key} className="ns-v-doorrow">
              <button type="button" className="ns-v-room" aria-pressed={active === k.key} onClick={() => onActive(k.key)}>
                <span>
                  {k.label}
                  {note && <small> · {note}</small>}
                </span>
                {placed ? <span className="ns-v-room__n" aria-label="placed">✓</span> : <span className="ns-v-room__add" aria-hidden="true">Tap the outline</span>}
              </button>
              {placed && (
                <button type="button" className="ns-v-sbtn ns-v-sbtn--danger ns-v-doorrow__x" onClick={() => onRemove(k.key)} aria-label={`Remove the ${k.label.toLowerCase()}`}>Remove</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

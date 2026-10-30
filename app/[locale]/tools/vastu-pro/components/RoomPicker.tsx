'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useCopy } from '@/lib/i18n/use-copy'
import { CATEGORY_ORDER, ROOM_KINDS, CATALOGUE, type CatalogueCategory } from '../vastu-catalogue'
import type { PlacedItem } from '../vastu-model'
import { categoryOf, kindLabelOf } from '../vastu-hi'
import { COPY } from '../copy'

export interface PlacementNote {
  /** e.g. "North-east (NE)" */
  where: string
  /** other zones the room also covers, e.g. "also NNE" */
  also?: string
  /** the room sits (partly) in the Brahmasthan */
  centre?: boolean
  borderline?: boolean
}

interface Props {
  items: PlacedItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (kind: string) => void
  onRemove: (id: string) => void
  onNudgeSize: (id: string, dw: number, dh: number) => void
  notes: Record<string, PlacementNote | undefined>
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3l5 5-5 5" />
  </svg>
)

/*
  The list of things that can go on the plan. "Add" puts a rectangle on the sheet, which the visitor then drags and
  resizes to match where that room really is. The panel under the list shows what the selected room covers.
*/
export default function RoomPicker({ items, selectedId, onSelect, onAdd, onRemove, onNudgeSize, notes }: Props) {
  const t = useCopy(COPY).rooms
  const hi = useLocale() === 'hi'
  const [open, setOpen] = useState<Set<CatalogueCategory>>(new Set(['Living', 'Bedrooms']))
  const countOf = (kind: string) => items.filter(i => i.kind === kind).length
  const sel = selectedId ? items.find(i => i.id === selectedId) : null
  const selNote = sel ? notes[sel.id] : undefined

  return (
    <div className="ns-plate ns-v-rooms">
      <div className="ns-v-rooms__head">
        <h2>{t.title}</h2>
        <span className="ns-v-rooms__count">{t.onPlan(items.length)}</span>
      </div>

      {sel && (
        <div className="ns-v-sel">
          <p className="ns-v-sel__k">{t.selected}</p>
          <p className="ns-v-sel__t">{kindLabelOf(hi, sel.kind, CATALOGUE[sel.kind]?.label ?? sel.kind)}</p>
          {selNote && (
            <p className="ns-v-sel__z">
              <span>{selNote.where}{selNote.also ? `, ${selNote.also}` : ''}</span>
              {selNote.centre && <span className="ns-v-tag">{t.inCentre}</span>}
              {selNote.borderline && <span className="ns-v-tag">{t.nearEdge}</span>}
            </p>
          )}
          <div className="ns-v-sel__b">
            <div className="ns-v-size" role="group" aria-label={t.sizeAria}>
              <span>{t.size}</span>
              <button type="button" className="ns-v-step" aria-label={t.narrower} onClick={() => onNudgeSize(sel.id, -8, 0)}>←</button>
              <button type="button" className="ns-v-step" aria-label={t.wider} onClick={() => onNudgeSize(sel.id, 8, 0)}>→</button>
              <button type="button" className="ns-v-step" aria-label={t.shorter} onClick={() => onNudgeSize(sel.id, 0, -8)}>↑</button>
              <button type="button" className="ns-v-step" aria-label={t.taller} onClick={() => onNudgeSize(sel.id, 0, 8)}>↓</button>
            </div>
            <button type="button" className="ns-v-sbtn ns-v-sbtn--danger" onClick={() => onRemove(sel.id)}>{t.removeFromPlan}</button>
            <button type="button" className="ns-v-sbtn" onClick={() => onSelect(null)}>{t.done}</button>
          </div>
        </div>
      )}

      <div className="ns-v-rooms__list">
        {CATEGORY_ORDER.map(cat => {
          const kinds = ROOM_KINDS.filter(k => k.category === cat)
          const isOpen = open.has(cat)
          const placed = kinds.filter(k => countOf(k.key) > 0).length
          return (
            <div key={cat}>
              <button
                type="button"
                className="ns-v-cat"
                aria-expanded={isOpen}
                onClick={() => setOpen(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n })}
              >
                <span>{categoryOf(hi, cat)}</span>
                <span className="ns-v-cat__r">
                  {placed > 0 && <span className="ns-v-cat__n" aria-label={t.placedAria(placed)}>{placed}</span>}
                  <Chevron />
                </span>
              </button>
              {isOpen && kinds.map(k => {
                const n = countOf(k.key)
                const disabled = !k.multi && n > 0
                return (
                  <button key={k.key} type="button" className="ns-v-room" disabled={disabled} onClick={() => onAdd(k.key)}>
                    <span>
                      {kindLabelOf(hi, k.key, k.label)}
                      {k.multi && <small>{t.canAddMore}</small>}
                    </span>
                    {n > 0 ? <span className="ns-v-room__n" aria-label={t.placedAria(n)}>{n}</span> : <span className="ns-v-room__add" aria-hidden="true">{t.add}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

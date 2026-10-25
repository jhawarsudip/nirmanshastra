'use client'

import { useState } from 'react'
import { ROOMS, ROOM_CATEGORIES, ZONES } from '../vastu-data'
import { type PlacedMarker } from '../vastu-engine'

interface Props {
  selectedRoomKey: string | null
  onSelectRoom: (key: string | null) => void
  roomCounts: Record<string, number>
  selectedMarkerKey: string | null
  markers: PlacedMarker[]
  onRemoveMarker: (key: string) => void
  onCloseMarker: () => void
}

const SEVERITY_LABEL = { CRITICAL: 'Critical', MODERATE: 'Moderate', NEUTRAL: 'Neutral', POSITIVE: 'Positive' } as const

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3l5 5-5 5" />
  </svg>
)

export default function RoomPanel({
  selectedRoomKey,
  onSelectRoom,
  roomCounts,
  selectedMarkerKey,
  markers,
  onRemoveMarker,
  onCloseMarker,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Entrances']))

  function toggleCat(cat: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const selectedMarker = selectedMarkerKey ? markers.find(m => m.key === selectedMarkerKey) : null
  const selectedMarkerRoom = selectedMarker ? ROOMS.find(r => r.key === selectedMarker.roomKey) : null
  const selectedZone = selectedMarker ? ZONES[selectedMarker.zoneIndex] : null
  const totalPlaced = Object.values(roomCounts).reduce((s, v) => s + v, 0)

  return (
    <div className="ns-plate ns-v-rooms">
      <div className="ns-v-rooms__head">
        <h2>Rooms</h2>
        <span className="ns-v-rooms__count">{totalPlaced} placed</span>
      </div>

      {selectedMarker && selectedMarkerRoom && selectedZone && (
        <div className="ns-v-sel" data-sev={selectedMarker.severity}>
          <p className="ns-v-sel__k">Selected on the plan</p>
          <p className="ns-v-sel__t">{selectedMarkerRoom.label}</p>
          <p className="ns-v-sel__z">
            <span>{selectedZone.full} zone ({selectedZone.name})</span>
            <span className="ns-v-badge" data-sev={selectedMarker.severity}>{SEVERITY_LABEL[selectedMarker.severity]}</span>
          </p>
          <div className="ns-v-sel__b">
            <button type="button" className="ns-v-sbtn ns-v-sbtn--danger" onClick={() => onRemoveMarker(selectedMarker.key)}>
              Remove from plan
            </button>
            <button type="button" className="ns-v-sbtn" onClick={onCloseMarker}>Done</button>
          </div>
        </div>
      )}

      <div className="ns-v-rooms__list">
        {ROOM_CATEGORIES.map(cat => {
          const catRooms = ROOMS.filter(r => r.category === cat)
          const isExpanded = expanded.has(cat)
          const placedInCat = catRooms.filter(r => (roomCounts[r.key] ?? 0) > 0).length

          return (
            <div key={cat}>
              <button
                type="button"
                className="ns-v-cat"
                aria-expanded={isExpanded}
                onClick={() => toggleCat(cat)}
              >
                <span>{cat}</span>
                <span className="ns-v-cat__r">
                  {placedInCat > 0 && <span className="ns-v-cat__n" aria-label={`${placedInCat} placed`}>{placedInCat}</span>}
                  <Chevron />
                </span>
              </button>

              {isExpanded &&
                catRooms.map(room => {
                  const count = roomCounts[room.key] ?? 0
                  const isSelected = selectedRoomKey === room.key
                  const isDisabled = !room.multiInstance && count > 0

                  return (
                    <button
                      key={room.key}
                      type="button"
                      className="ns-v-room"
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                      onClick={() => onSelectRoom(isSelected ? null : room.key)}
                    >
                      <span>
                        {room.label}
                        {room.multiInstance && <small> · can add more</small>}
                      </span>
                      {count > 0 && <span className="ns-v-room__n" aria-label={`${count} placed`}>{count}</span>}
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

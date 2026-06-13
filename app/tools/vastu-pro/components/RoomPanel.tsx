'use client'

import { useState } from 'react'
import { ROOMS, ROOM_CATEGORIES } from '../vastu-data'
import { type PlacedMarker } from '../vastu-engine'

interface Props {
  selectedRoomKey: string | null
  onSelectRoom: (key: string | null) => void
  roomCounts: Record<string, number>
  selectedMarkerKey: string | null
  markers: PlacedMarker[]
  onRemoveMarker: (key: string) => void
}

export default function RoomPanel({
  selectedRoomKey,
  onSelectRoom,
  roomCounts,
  selectedMarkerKey,
  markers,
  onRemoveMarker,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Entrances']))
  const [showTips, setShowTips] = useState(false)

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
  const totalPlaced = Object.values(roomCounts).reduce((s, v) => s + v, 0)

  return (
    <div
      className="flex flex-col rounded-[2px] overflow-hidden h-full"
      style={{ background: '#1E2227', border: '1px solid rgba(201,168,76,0.3)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-plex-mono)' }}
        >
          ROOMS ·{' '}
          <span style={{ color: '#C9A84C' }}>{totalPlaced}</span>{' '}
          PLACED
        </p>
      </div>

      {/* Selected marker action panel */}
      {selectedMarker && selectedMarkerRoom && (
        <div
          className="px-3 py-3 shrink-0"
          style={{
            borderBottom: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(201,168,76,0.07)',
          }}
        >
          <p
            className="text-[9px] uppercase tracking-widest mb-1.5"
            style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-plex-mono)' }}
          >
            SELECTED
          </p>
          <p
            className="text-[13px] mb-2.5"
            style={{ color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}
          >
            {selectedMarkerRoom.label}
          </p>
          {showTips ? (
            <div>
              <p
                className="text-[11px] leading-relaxed mb-1.5"
                style={{ color: 'rgba(244,244,240,0.6)', fontFamily: 'var(--font-plex-sans)' }}
              >
                Complete Vastu guidelines for this room are in your free PDF report.
              </p>
              <button
                onClick={() => setShowTips(false)}
                className="text-[10px]"
                style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'var(--font-plex-mono)' }}
              >
                ← Back
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onRemoveMarker(selectedMarker.key)}
                className="flex-1 py-1.5 rounded-[4px] text-[11px] font-medium"
                style={{ background: '#8C3A22', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
              >
                🗑 Remove
              </button>
              <button
                onClick={() => setShowTips(true)}
                className="flex-1 py-1.5 rounded-[4px] text-[11px]"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.25)',
                  fontFamily: 'var(--font-plex-mono)',
                }}
              >
                ✦ Tips in PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category accordion */}
      <div className="flex-1 overflow-y-auto">
        {ROOM_CATEGORIES.map(cat => {
          const catRooms = ROOMS.filter(r => r.category === cat)
          const isExpanded = expanded.has(cat)
          const placedInCat = catRooms.filter(r => (roomCounts[r.key] ?? 0) > 0).length

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCat(cat)}
                className="w-full px-3 py-2 flex items-center justify-between text-left"
                style={{
                  background: isExpanded ? 'rgba(201,168,76,0.06)' : 'transparent',
                  borderBottom: '1px solid rgba(201,168,76,0.1)',
                }}
              >
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{
                    color: isExpanded ? '#C9A84C' : 'rgba(201,168,76,0.55)',
                    fontFamily: 'var(--font-plex-mono)',
                  }}
                >
                  {cat}
                </span>
                <div className="flex items-center gap-1.5">
                  {placedInCat > 0 && (
                    <span
                      className="text-[9px] w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
                    >
                      {placedInCat}
                    </span>
                  )}
                  <span style={{ color: 'rgba(201,168,76,0.35)', fontSize: 9 }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {isExpanded &&
                catRooms.map(room => {
                  const count = roomCounts[room.key] ?? 0
                  const isSelected = selectedRoomKey === room.key
                  const isDisabled = !room.multiInstance && count > 0

                  return (
                    <button
                      key={room.key}
                      disabled={isDisabled}
                      onClick={() => onSelectRoom(isSelected ? null : room.key)}
                      className="w-full px-4 py-2 flex items-center justify-between text-left"
                      style={{
                        background: isSelected ? 'rgba(201,168,76,0.13)' : 'transparent',
                        borderBottom: '1px solid rgba(201,168,76,0.07)',
                        opacity: isDisabled ? 0.4 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span
                        className="text-[12px]"
                        style={{
                          color: isSelected ? '#C9A84C' : 'rgba(244,244,240,0.75)',
                          fontFamily: 'var(--font-plex-sans)',
                        }}
                      >
                        {room.label}
                        {room.multiInstance && (
                          <span
                            className="ml-1 text-[9px]"
                            style={{ color: 'rgba(201,168,76,0.4)' }}
                          >
                            +
                          </span>
                        )}
                      </span>
                      {count > 0 && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-[2px]"
                          style={{ background: '#14532D', color: '#fff', fontFamily: 'var(--font-plex-mono)' }}
                        >
                          {count}
                        </span>
                      )}
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

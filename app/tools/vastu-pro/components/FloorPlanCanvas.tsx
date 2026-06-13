'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { drawVastuCanvas, hitTestMarker, type PlacedMarker } from '../vastu-engine'

const CANVAS_SIZE = 480

interface Props {
  northDeg: number
  markers: PlacedMarker[]
  selectedMarkerKey: string | null
  selectedRoomKey: string | null
  onPlace: (x: number, y: number) => void
  onSelectMarker: (key: string | null) => void
}

export default function FloorPlanCanvas({
  northDeg,
  markers,
  selectedMarkerKey,
  selectedRoomKey,
  onPlace,
  onSelectMarker,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [floorPlanImage, setFloorPlanImage] = useState<HTMLImageElement | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawVastuCanvas({ canvas, northDeg, markers, selectedMarkerKey, floorPlanImage })
  }, [northDeg, markers, selectedMarkerKey, floorPlanImage])

  useEffect(() => { redraw() }, [redraw])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setFloorPlanImage(img)
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
    // reset so same file can be re-selected
    e.target.value = ''
  }

  function toCanvasCoords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
    }
  }

  function handleInteraction(clientX: number, clientY: number) {
    const { x, y } = toCanvasCoords(clientX, clientY)
    const hit = hitTestMarker(x, y, markers)
    if (hit) {
      onSelectMarker(hit.key === selectedMarkerKey ? null : hit.key)
    } else if (selectedRoomKey) {
      onSelectMarker(null)
      onPlace(x, y)
    } else {
      onSelectMarker(null)
    }
  }

  function handleClick(e: React.MouseEvent) {
    handleInteraction(e.clientX, e.clientY)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    e.preventDefault()
    const t = e.changedTouches[0]
    handleInteraction(t.clientX, t.clientY)
  }

  const statusText = selectedRoomKey
    ? '✦ Click anywhere on the plan to place this room'
    : markers.length === 0
    ? 'Select a room from the panel, then click on the plan to place it'
    : `${markers.length} room${markers.length !== 1 ? 's' : ''} placed · Click a marker to select it`

  return (
    <div className="flex flex-col gap-2">
      {/* Upload floor plan button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload floor plan image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-[6px] text-[12px] border transition-opacity hover:opacity-80"
          style={{
            borderColor: floorPlanImage ? '#1F4E79' : 'rgba(30,34,39,0.35)',
            color: floorPlanImage ? '#1F4E79' : '#1E2227',
            fontFamily: 'var(--font-plex-mono)',
            background: floorPlanImage ? 'rgba(31,78,121,0.06)' : 'transparent',
          }}
        >
          {floorPlanImage ? '↑ Change Floor Plan' : '↑ Upload Floor Plan'}
        </button>
        {floorPlanImage && (
          <button
            type="button"
            onClick={() => setFloorPlanImage(null)}
            className="px-3 py-1.5 rounded-[6px] text-[12px] border transition-opacity hover:opacity-80"
            style={{
              borderColor: 'rgba(140,58,34,0.35)',
              color: '#8C3A22',
              fontFamily: 'var(--font-plex-mono)',
            }}
          >
            Remove
          </button>
        )}
        {floorPlanImage && (
          <span
            className="text-[11px]"
            style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}
          >
            Shown at 35% opacity behind the grid
          </span>
        )}
      </div>

      {/* Canvas */}
      <div
        className="rounded-[2px] overflow-hidden w-full"
        style={{ background: '#1E2227', border: '1px solid rgba(201,168,76,0.3)' }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}
        >
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: 'rgba(201,168,76,0.6)', fontFamily: 'var(--font-plex-mono)' }}
          >
            FLOOR PLAN · BRAHMASTHAN AT CENTRE
          </p>
          {selectedRoomKey && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-[2px]"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', fontFamily: 'var(--font-plex-mono)' }}
            >
              ✦ PLACING
            </span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'block',
            width: '100%',
            aspectRatio: '1 / 1',
            cursor: selectedRoomKey ? 'crosshair' : 'pointer',
            touchAction: 'none',
          }}
          aria-label={`Vastu floor plan canvas. ${markers.length} rooms placed. ${selectedRoomKey ? 'Click to place selected room.' : 'Select a room to place.'}`}
        />

        <div
          className="px-3 py-2 text-center"
          style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}
        >
          <p
            className="text-[11px]"
            style={{ color: 'rgba(201,168,76,0.45)', fontFamily: 'var(--font-plex-sans)' }}
          >
            {statusText}
          </p>
        </div>
      </div>
    </div>
  )
}

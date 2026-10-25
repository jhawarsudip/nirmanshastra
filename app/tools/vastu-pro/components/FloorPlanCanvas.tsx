'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { drawVastuCanvas, hitTestMarker, ROOMS, type PlacedMarker } from '../vastu-engine'

// Logical size of the sheet. Zones and clicks are worked out in this space whatever size the screen shows it at.
export const CANVAS_SIZE = 480

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
  const pressRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const [floorPlanImage, setFloorPlanImage] = useState<HTMLImageElement | null>(null)

  const selectedRoom = selectedRoomKey ? ROOMS.find(r => r.key === selectedRoomKey) : null

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Device pixels, so the sheet stays sharp on a phone. Everything is still drawn in the 480-unit space.
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const px = Math.round(CANVAS_SIZE * dpr)
    if (canvas.width !== px) {
      canvas.width = px
      canvas.height = px
    }
    drawVastuCanvas({ canvas, size: CANVAS_SIZE, northDeg, markers, selectedMarkerKey, floorPlanImage })
  }, [northDeg, markers, selectedMarkerKey, floorPlanImage])

  useEffect(() => { redraw() }, [redraw])

  // Draw again once the page fonts are ready, so the labels use them from the first look.
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts?.ready) document.fonts.ready.then(redraw).catch(() => {})
  }, [redraw])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // The picture is shown from this browser only; it is never uploaded.
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setFloorPlanImage(img)
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => URL.revokeObjectURL(objectUrl)
    img.src = objectUrl
    // reset so the same file can be chosen again
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

  // A tap or click places or selects. A swipe that scrolls the page does not: the browser cancels the pointer then.
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    pressRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = pressRef.current
    pressRef.current = null
    if (!p || p.id !== e.pointerId) return
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return
    handleInteraction(e.clientX, e.clientY)
  }
  function onPointerCancel() { pressRef.current = null }

  const status = selectedRoom ? (
    <>Tap the plan where the <b>{selectedRoom.label}</b> is.</>
  ) : markers.length === 0 ? (
    <>Pick a room from the list, then tap the plan where it sits.</>
  ) : (
    <><b>{markers.length}</b> room{markers.length !== 1 ? 's' : ''} placed. Tap a marker to select it.</>
  )

  return (
    <div className="ns-plate ns-v-sheet">
      <div className="ns-v-sheet__head">
        <h2>Your plan</h2>
        {selectedRoom ? (
          <span className="ns-v-placing">Placing: {selectedRoom.label}</span>
        ) : (
          <span className="ns-i-fine">The circle in the middle is the Brahmasthan, the centre of the house.</span>
        )}
      </div>

      <div className="ns-v-canvaswrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="ns-v-canvas"
          data-placing={selectedRoomKey ? '1' : '0'}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          role="img"
          aria-label={`Vastu plan sheet with the 16 zones. ${markers.length} rooms placed. ${selectedRoom ? `Tap to place the ${selectedRoom.label}.` : 'Select a room to place.'}`}
        />
      </div>

      <div className="ns-v-sheet__foot">
        <p className="ns-v-sheet__status" aria-live="polite">{status}</p>
        <div className="ns-v-sheet__up">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="ns-v-file"
            tabIndex={-1}
            aria-label="Upload a picture of your floor plan"
          />
          <button type="button" className="ns-v-sbtn ns-v-sbtn--tc" onClick={() => fileInputRef.current?.click()}>
            {floorPlanImage ? 'Change plan picture' : 'Add a picture of your plan'}
          </button>
          {floorPlanImage && (
            <button type="button" className="ns-v-sbtn ns-v-sbtn--danger" onClick={() => setFloorPlanImage(null)}>
              Remove
            </button>
          )}
          <small>{floorPlanImage ? 'Shown faintly behind the grid. It stays in your browser.' : 'Optional. It stays in your browser.'}</small>
        </div>
      </div>
    </div>
  )
}

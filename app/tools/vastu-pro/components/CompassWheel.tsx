'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  northDeg: number
  onChange: (deg: number) => void
}

// Logical size in CSS pixels. The canvas itself is drawn at device resolution so it stays sharp on a phone.
const SIZE = 200
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 6

const FACE = '#F2ECDD'
const INK = '#2A2622'
const NORTH = '#B5502D'
const GREEN = '#2F7A4F'

/*
  The dial turns with the North angle: the red N sits where North lies on your drawing,
  and the green arrow (fixed, pointing up) is the top of your drawing.
  Drag the dial, use the arrow keys, or type the angle beside it.
*/
export default function CompassWheel({ northDeg, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = canvas.width / SIZE
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    let sans = 'system-ui, sans-serif'
    try { sans = getComputedStyle(canvas).fontFamily || sans } catch { /* keep the default */ }

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Face
    ctx.beginPath()
    ctx.arc(CX, CY, R, 0, Math.PI * 2)
    ctx.fillStyle = FACE
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.stroke()

    // 16 tick marks, turned with the North angle
    const faceRot = (northDeg * Math.PI) / 180
    for (let i = 0; i < 16; i++) {
      const angle = faceRot + (i * Math.PI * 2) / 16
      const isCardinal = i % 4 === 0
      const inner = R - (isCardinal ? 16 : 9)
      const outer = R - 3
      ctx.beginPath()
      ctx.moveTo(CX + inner * Math.sin(angle), CY - inner * Math.cos(angle))
      ctx.lineTo(CX + outer * Math.sin(angle), CY - outer * Math.cos(angle))
      ctx.strokeStyle = isCardinal ? INK : 'rgba(42,38,34,0.45)'
      ctx.lineWidth = isCardinal ? 2 : 1
      ctx.stroke()
    }

    // N, E, S, W turn with the face but stay upright
    const cardinals = ['N', 'E', 'S', 'W']
    const labelR = R - 31
    cardinals.forEach((label, i) => {
      const angle = faceRot + (i * Math.PI) / 2
      ctx.font = `800 ${label === 'N' ? 19 : 15}px ${sans}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = label === 'N' ? NORTH : INK
      ctx.fillText(label, CX + labelR * Math.sin(angle), CY - labelR * Math.cos(angle))
    })

    // The top of the drawing: fixed, pointing up
    const arrowLen = R * 0.5
    ctx.save()
    ctx.strokeStyle = GREEN
    ctx.fillStyle = GREEN
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(CX, CY + arrowLen * 0.28)
    ctx.lineTo(CX, CY - arrowLen)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(CX, CY - arrowLen - 3)
    ctx.lineTo(CX - 7, CY - arrowLen + 11)
    ctx.lineTo(CX + 7, CY - arrowLen + 11)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Centre dot
    ctx.beginPath()
    ctx.arc(CX, CY, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = GREEN
    ctx.fill()

  }, [northDeg])

  // Size the canvas for the screen's pixel density, then draw.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const px = Math.round(SIZE * dpr)
    if (canvas.width !== px) {
      canvas.width = px
      canvas.height = px
    }
    draw()
  }, [draw])

  function angleAt(clientX: number, clientY: number): number {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    const x = clientX - (rect.left + rect.width / 2)
    const y = clientY - (rect.top + rect.height / 2)
    return Math.round(((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360) % 360
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    onChange(angleAt(e.clientX, e.clientY))
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging.current) return
    onChange(angleAt(e.clientX, e.clientY))
  }
  function onPointerEnd(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const step = e.shiftKey ? 10 : 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = northDeg + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = northDeg - step
    else if (e.key === 'PageUp') next = northDeg + 15
    else if (e.key === 'PageDown') next = northDeg - 15
    else if (e.key === 'Home') next = 0
    if (next === null) return
    e.preventDefault()
    onChange(((Math.round(next) % 360) + 360) % 360)
  }

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      tabIndex={0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(northDeg)}
      aria-valuetext={`North is ${Math.round(northDeg)} degrees clockwise from the top of the drawing`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      aria-label="North direction dial. Drag the dial or use the arrow keys."
    />
  )
}

'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  northDeg: number
  onChange: (deg: number) => void
}

const SIZE = 160
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 8

export default function CompassWheel({ northDeg, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Dark brown gradient background
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R)
    grad.addColorStop(0, '#2A1F14')
    grad.addColorStop(1, '#1A1008')
    ctx.beginPath()
    ctx.arc(CX, CY, R, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    // Outer ring
    ctx.beginPath()
    ctx.arc(CX, CY, R, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(201,168,76,0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 16 tick marks (rotated by northDeg so compass face rotates with northDeg)
    const faceRot = (northDeg * Math.PI) / 180
    for (let i = 0; i < 16; i++) {
      const angle = faceRot + (i * Math.PI * 2) / 16
      const isCardinal = i % 4 === 0
      const inner = R - (isCardinal ? 14 : 8)
      const outer = R - 3
      ctx.beginPath()
      ctx.moveTo(CX + inner * Math.sin(angle), CY - inner * Math.cos(angle))
      ctx.lineTo(CX + outer * Math.sin(angle), CY - outer * Math.cos(angle))
      ctx.strokeStyle = isCardinal ? 'rgba(201,168,76,0.9)' : 'rgba(201,168,76,0.4)'
      ctx.lineWidth = isCardinal ? 1.5 : 0.8
      ctx.stroke()
    }

    // Cardinal labels (N/E/S/W) — rotate with face
    const cardinals = ['N', 'E', 'S', 'W']
    const labelR = R - 22
    cardinals.forEach((label, i) => {
      const angle = faceRot + (i * Math.PI) / 2
      const x = CX + labelR * Math.sin(angle)
      const y = CY - labelR * Math.cos(angle)
      ctx.font = `700 11px "IBM Plex Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = label === 'N' ? '#E8C85A' : 'rgba(201,168,76,0.7)'
      ctx.fillText(label, x, y)
    })

    // North gold arrow (fixed, pointing up — the face rotates around it)
    const arrowLen = R * 0.55
    ctx.save()
    ctx.strokeStyle = '#C9A84C'
    ctx.fillStyle = '#C9A84C'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(CX, CY + arrowLen * 0.3)
    ctx.lineTo(CX, CY - arrowLen)
    ctx.stroke()
    // Arrowhead
    ctx.beginPath()
    ctx.moveTo(CX, CY - arrowLen)
    ctx.lineTo(CX - 5, CY - arrowLen + 10)
    ctx.lineTo(CX + 5, CY - arrowLen + 10)
    ctx.closePath()
    ctx.fill()
    // South grey tail
    ctx.strokeStyle = 'rgba(201,168,76,0.25)'
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.lineTo(CX, CY + arrowLen * 0.3)
    ctx.stroke()
    ctx.restore()

    // Centre dot
    ctx.beginPath()
    ctx.arc(CX, CY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#C9A84C'
    ctx.fill()

    // Degree readout
    ctx.font = `500 10px "IBM Plex Mono", monospace`
    ctx.fillStyle = 'rgba(201,168,76,0.6)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(northDeg)}°`, CX, CY + R - 11)
  }, [northDeg])

  useEffect(() => { draw() }, [draw])

  function getAngle(clientX: number, clientY: number): number {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left - CX
    const y = clientY - rect.top - CY
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360
  }

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    onChange(getAngle(e.clientX, e.clientY))
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    onChange(getAngle(e.clientX, e.clientY))
  }
  function onMouseUp() { dragging.current = false }

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true
    const t = e.touches[0]
    onChange(getAngle(t.clientX, t.clientY))
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    e.preventDefault()
    const t = e.touches[0]
    onChange(getAngle(t.clientX, t.clientY))
  }
  function onTouchEnd() { dragging.current = false }

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
      aria-label={`Compass. North is at ${Math.round(northDeg)} degrees. Drag to rotate.`}
    />
  )
}

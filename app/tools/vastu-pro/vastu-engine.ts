import {
  ZONES,
  ROOMS,
  ZONE_SCORE,
  getImpact,
  type Severity,
  type RoomDefinition,
  type ZoneDefinition,
} from './vastu-data'

export interface PlacedMarker {
  key: string          // unique: roomKey or roomKey_2, roomKey_3, ...
  roomKey: string
  x: number            // canvas pixel coords
  y: number
  zoneIndex: number
  severity: Severity
}

export interface VastuFinding {
  markerKey: string
  roomKey: string
  roomLabel: string
  zoneIndex: number
  zoneName: string
  zoneFull: string
  severity: Severity
  impact: string
}

export interface VastuAnalysis {
  findings: VastuFinding[]
  score: number
  criticalCount: number
  moderateCount: number
  positiveCount: number
  neutralCount: number
}

// Determine zone index from canvas position + northDeg
// northDeg = angle (clockwise from canvas-up) where True North lies
// Returns zone index 0-15 (0=N, 1=NNE, ... 15=NNW)
export function getZoneIndex(
  clickX: number,
  clickY: number,
  centreX: number,
  centreY: number,
  northDeg: number
): number {
  const dx = clickX - centreX
  const dy = clickY - centreY
  // Angle clockwise from canvas "up" (visual north, before rotation)
  const canvasAngle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
  // Rotate by northDeg to get angle relative to True North
  const trueAngle = (canvasAngle - northDeg + 360) % 360
  // Each zone spans 22.5°. Zone 0 (N) is centred on 0°, spanning ±11.25°
  return Math.floor((trueAngle + 11.25) / 22.5) % 16
}

export function getRoomByKey(roomKey: string): RoomDefinition | undefined {
  return ROOMS.find(r => r.key === roomKey)
}

export function getSeverity(roomKey: string, zoneIndex: number): Severity {
  const room = getRoomByKey(roomKey)
  if (!room) return 'NEUTRAL'
  return room.zoneSeverity[zoneIndex]
}

export function analyseLayout(markers: PlacedMarker[]): VastuAnalysis {
  const findings: VastuFinding[] = markers.map(marker => {
    const room = getRoomByKey(marker.roomKey)!
    const zone = ZONES[marker.zoneIndex]
    return {
      markerKey: marker.key,
      roomKey: marker.roomKey,
      roomLabel: room.label,
      zoneIndex: marker.zoneIndex,
      zoneName: zone.name,
      zoneFull: zone.full,
      severity: marker.severity,
      impact: getImpact(room, zone, marker.severity),
    }
  })

  // Sort: CRITICAL first, then MODERATE, NEUTRAL, POSITIVE
  const severityOrder: Record<Severity, number> = { CRITICAL: 0, MODERATE: 1, NEUTRAL: 2, POSITIVE: 3 }
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length
  const moderateCount = findings.filter(f => f.severity === 'MODERATE').length
  const positiveCount = findings.filter(f => f.severity === 'POSITIVE').length
  const neutralCount = findings.filter(f => f.severity === 'NEUTRAL').length

  const score =
    findings.length === 0
      ? 0
      : Math.round(
          findings.reduce((sum, f) => sum + ZONE_SCORE[f.severity], 0) / findings.length
        )

  return { findings, score, criticalCount, moderateCount, positiveCount, neutralCount }
}

// Canvas drawing helpers
export interface CanvasDrawParams {
  canvas: HTMLCanvasElement
  northDeg: number
  markers: PlacedMarker[]
  selectedMarkerKey: string | null
  floorPlanImage?: HTMLImageElement | null
}

const GOLD = '#C9A84C'
const INK  = '#1E2227'

export function drawVastuCanvas(params: CanvasDrawParams) {
  const { canvas, northDeg, markers, selectedMarkerKey, floorPlanImage } = params
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = '#F4F4F0'
  ctx.fillRect(0, 0, W, H)

  // ── Floor plan image at 35% opacity (drawn behind the grid) ────────────
  if (floorPlanImage) {
    const img = floorPlanImage
    const scale = Math.min(W / img.width, H / img.height)
    const imgW = img.width * scale
    const imgH = img.height * scale
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.drawImage(img, (W - imgW) / 2, (H - imgH) / 2, imgW, imgH)
    ctx.restore()
  }

  // ── 8×8 gold dashed grid ────────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = 'rgba(201,168,76,0.25)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  const cellW = W / 8
  const cellH = H / 8
  for (let i = 1; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cellW, 0)
    ctx.lineTo(i * cellW, H)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * cellH)
    ctx.lineTo(W, i * cellH)
    ctx.stroke()
  }
  ctx.restore()

  // ── Centre crosshair ─────────────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = 'rgba(201,168,76,0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(cx, 0); ctx.lineTo(cx, H)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, cy); ctx.lineTo(W, cy)
  ctx.stroke()
  ctx.restore()

  // ── Brahmasthan circle ───────────────────────────────────────────────────
  const brahmaR = Math.min(W, H) * 0.11
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, brahmaR, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(201,168,76,0.12)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.85)'
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.stroke()

  // "ब" symbol at centre
  ctx.font = `bold ${Math.round(brahmaR * 0.85)}px "IBM Plex Sans Devanagari", serif`
  ctx.fillStyle = GOLD
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ब', cx, cy - brahmaR * 0.05)

  // "Brahmasthan" label below circle
  ctx.font = `500 11px "IBM Plex Mono", monospace`
  ctx.fillStyle = 'rgba(201,168,76,0.75)'
  ctx.textBaseline = 'top'
  ctx.fillText('BRAHMASTHAN', cx, cy + brahmaR + 6)
  ctx.restore()

  // ── North arrow ──────────────────────────────────────────────────────────
  drawNorthArrow(ctx, cx, cy, northDeg, Math.min(W, H) * 0.22)

  // ── Placed markers ────────────────────────────────────────────────────────
  markers.forEach(m => drawMarker(ctx, m, m.key === selectedMarkerKey, brahmaR))
}

function drawNorthArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  northDeg: number,
  arrowLen: number
) {
  const rad = (northDeg * Math.PI) / 180
  const nx = cx + arrowLen * Math.sin(rad)
  const ny = cy - arrowLen * Math.cos(rad)

  ctx.save()
  ctx.strokeStyle = GOLD
  ctx.fillStyle = GOLD
  ctx.lineWidth = 2
  ctx.setLineDash([])

  // Shaft
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(nx, ny)
  ctx.stroke()

  // Arrowhead
  const headLen = arrowLen * 0.15
  const angle = Math.atan2(ny - cy, nx - cx)
  ctx.beginPath()
  ctx.moveTo(nx, ny)
  ctx.lineTo(
    nx - headLen * Math.cos(angle - Math.PI / 6),
    ny - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    nx - headLen * Math.cos(angle + Math.PI / 6),
    ny - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()

  // "N" label
  ctx.font = `700 13px "IBM Plex Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const labelDist = arrowLen + 14
  ctx.fillText(
    'N',
    cx + labelDist * Math.sin(rad),
    cy - labelDist * Math.cos(rad)
  )
  ctx.restore()
}

const SEVERITY_COLOURS: Record<Severity, string> = {
  POSITIVE: '#14532D',
  NEUTRAL:  'rgba(30,34,39,0.6)',
  MODERATE: '#D99A06',
  CRITICAL: '#8C3A22',
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: PlacedMarker,
  isSelected: boolean,
  brahmaR: number
) {
  const room = getRoomByKey(marker.roomKey)
  if (!room) return
  const r = 18
  const colour = SEVERITY_COLOURS[marker.severity]

  ctx.save()

  // Outer ring (selection highlight)
  if (isSelected) {
    ctx.beginPath()
    ctx.arc(marker.x, marker.y, r + 4, 0, Math.PI * 2)
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Fill circle
  ctx.beginPath()
  ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2)
  ctx.fillStyle = colour
  ctx.globalAlpha = isSelected ? 1 : 0.88
  ctx.fill()
  ctx.globalAlpha = 1

  // Stroke
  ctx.beginPath()
  ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Room abbreviation
  ctx.font = `600 10px "IBM Plex Mono", monospace`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(room.abbrev, marker.x, marker.y)

  // Label below
  ctx.font = `400 9px "IBM Plex Sans", sans-serif`
  ctx.fillStyle = INK
  ctx.textBaseline = 'top'
  const shortLabel = room.label.length > 12 ? room.label.slice(0, 11) + '…' : room.label
  ctx.fillText(shortLabel, marker.x, marker.y + r + 3)

  ctx.restore()
}

// Hit-test: returns the first marker within 28px of click, or null
export function hitTestMarker(
  x: number,
  y: number,
  markers: PlacedMarker[]
): PlacedMarker | null {
  for (const m of [...markers].reverse()) {
    const dist = Math.hypot(x - m.x, y - m.y)
    if (dist <= 28) return m
  }
  return null
}

// Build a unique key for a multi-instance room placement
export function buildMarkerKey(
  roomKey: string,
  roomCounts: Record<string, number>
): string {
  const count = (roomCounts[roomKey] ?? 0) + 1
  return count === 1 ? roomKey : `${roomKey}_${count}`
}

export { ZONES, ROOMS, type ZoneDefinition }

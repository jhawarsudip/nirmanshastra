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
  /** Logical size of the square sheet. The canvas itself can be bigger (device pixels, for a sharp picture). Default: the canvas width. */
  size?: number
}

// The drawing sheet is light paper in both site themes, like a sheet pinned to a drawing board.
export const SHEET = {
  paper: '#FAF6EC',
  grid: 'rgba(42,38,34,0.12)',
  zone: 'rgba(42,38,34,0.24)',
  axis: 'rgba(47,122,79,0.45)',
  green: '#2F7A4F',
  greenFill: 'rgba(47,122,79,0.12)',
  north: '#B5502D',
  ink: '#2A2622',
  ink2: '#5B544B',
}

export const SEVERITY_COLOURS: Record<Severity, string> = {
  POSITIVE: '#2F7D5B',
  NEUTRAL:  '#7A7266',
  MODERATE: '#9A6A12',
  CRITICAL: '#A3322A',
}

// The canvas has no CSS variables, so it reads the page's own font stack once per draw.
function fontOf(canvas: HTMLCanvasElement): string {
  try {
    const f = getComputedStyle(canvas).fontFamily
    return f || 'system-ui, sans-serif'
  } catch {
    return 'system-ui, sans-serif'
  }
}

// Distance from the centre to the edge of the square, along a direction (dx, dy).
function reach(dx: number, dy: number, half: number): number {
  const tx = Math.abs(dx) < 1e-9 ? Infinity : half / Math.abs(dx)
  const ty = Math.abs(dy) < 1e-9 ? Infinity : half / Math.abs(dy)
  return Math.min(tx, ty)
}

// Text with a paper-coloured halo, so it stays readable over grid lines and the plan image.
function haloText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = SHEET.paper
  ctx.strokeText(text, x, y)
  ctx.restore()
  ctx.fillText(text, x, y)
}

export function drawVastuCanvas(params: CanvasDrawParams) {
  const { canvas, northDeg, markers, selectedMarkerKey, floorPlanImage } = params
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = params.size ?? canvas.width
  const dpr = canvas.width / size
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const W = size
  const H = size
  const cx = W / 2
  const cy = H / 2
  const sans = fontOf(canvas)
  const brahmaR = Math.min(W, H) * 0.11
  const northRad = (northDeg * Math.PI) / 180

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = SHEET.paper
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

  // ── 8×8 dashed grid: a guide for sketching the plan, not the zones ────────
  ctx.save()
  ctx.strokeStyle = SHEET.grid
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
  ctx.strokeStyle = SHEET.axis
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(cx, 0); ctx.lineTo(cx, H)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, cy); ctx.lineTo(W, cy)
  ctx.stroke()
  ctx.restore()

  // ── The 16 zones: a ray at every zone edge, turned by the North angle, with its name at the rim ──
  ctx.save()
  ctx.strokeStyle = SHEET.zone
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])
  for (let i = 0; i < 16; i++) {
    const a = northRad + ((i * 22.5 - 11.25) * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(dx, dy, W / 2)
    ctx.beginPath()
    ctx.moveTo(cx + dx * brahmaR, cy + dy * brahmaR)
    ctx.lineTo(cx + dx * t, cy + dy * t)
    ctx.stroke()
  }
  ctx.restore()
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 16; i++) {
    const a = northRad + (i * 22.5 * Math.PI) / 180
    const dx = Math.sin(a)
    const dy = -Math.cos(a)
    const t = reach(dx, dy, W / 2) - 17
    ctx.font = `700 ${i % 2 === 0 ? 14 : 12}px ${sans}`
    ctx.fillStyle = i === 0 ? SHEET.north : SHEET.ink2
    haloText(ctx, ZONES[i].name, cx + dx * t, cy + dy * t)
  }
  ctx.restore()

  // ── Brahmasthan circle ───────────────────────────────────────────────────
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, brahmaR, 0, Math.PI * 2)
  ctx.fillStyle = SHEET.greenFill
  ctx.fill()
  ctx.strokeStyle = SHEET.green
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.stroke()

  // "ब" symbol at centre
  ctx.font = `700 ${Math.round(brahmaR * 0.9)}px ${sans}`
  ctx.fillStyle = SHEET.green
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ब', cx, cy - brahmaR * 0.05)

  // "Brahmasthan" label below circle
  ctx.font = `700 12px ${sans}`
  ctx.textBaseline = 'top'
  haloText(ctx, 'Brahmasthan', cx, cy + brahmaR + 6)
  ctx.restore()

  // ── North arrow ──────────────────────────────────────────────────────────
  drawNorthArrow(ctx, cx, cy, northDeg, Math.min(W, H) * 0.22, sans)

  // ── Placed markers ────────────────────────────────────────────────────────
  markers.forEach(m => drawMarker(ctx, m, m.key === selectedMarkerKey, sans))
}

function drawNorthArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  northDeg: number,
  arrowLen: number,
  sans: string
) {
  const rad = (northDeg * Math.PI) / 180
  const nx = cx + arrowLen * Math.sin(rad)
  const ny = cy - arrowLen * Math.cos(rad)

  ctx.save()
  ctx.strokeStyle = SHEET.north
  ctx.fillStyle = SHEET.north
  ctx.lineWidth = 2.5
  ctx.setLineDash([])

  // Shaft
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(nx, ny)
  ctx.stroke()

  // Arrowhead
  const headLen = arrowLen * 0.17
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
  ctx.font = `700 15px ${sans}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const labelDist = arrowLen + 15
  haloText(
    ctx,
    'N',
    cx + labelDist * Math.sin(rad),
    cy - labelDist * Math.cos(rad)
  )
  ctx.restore()
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: PlacedMarker,
  isSelected: boolean,
  sans: string
) {
  const room = getRoomByKey(marker.roomKey)
  if (!room) return
  const r = 18
  const colour = SEVERITY_COLOURS[marker.severity]

  ctx.save()

  // Outer ring (selection highlight)
  if (isSelected) {
    ctx.beginPath()
    ctx.arc(marker.x, marker.y, r + 5, 0, Math.PI * 2)
    ctx.strokeStyle = SHEET.ink
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Fill circle
  ctx.beginPath()
  ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2)
  ctx.fillStyle = colour
  ctx.globalAlpha = isSelected ? 1 : 0.92
  ctx.fill()
  ctx.globalAlpha = 1

  // Stroke
  ctx.beginPath()
  ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Room abbreviation
  ctx.font = `700 12px ${sans}`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(room.abbrev, marker.x, marker.y + 0.5)

  // Label below
  ctx.font = `600 12px ${sans}`
  ctx.fillStyle = SHEET.ink
  ctx.textBaseline = 'top'
  const shortLabel = room.label.length > 14 ? room.label.slice(0, 13) + '…' : room.label
  haloText(ctx, shortLabel, marker.x, marker.y + r + 3)

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

import React from 'react'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import VastuReportPDF from '@/lib/pdf/vastu-pdf'
import {
  ROOMS,
  analyseLayout,
  buildMarkerKey,
  getSeverity,
  getZoneIndex,
  type PlacedMarker,
} from '@/app/tools/vastu-pro/vastu-engine'

export const runtime = 'nodejs'

// The sheet the marks were placed on is 480 units square; the centre is the Brahmasthan.
const SHEET = 480
const MAX_MARKERS = 80

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

/*
  POST /api/vastu-pro/report: the free findings PDF.
  The page sends only where each room was marked and where North lies. The zone and the rating of every room are
  worked out again here, so the PDF always agrees with the engine. Nothing is stored.
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const name = typeof body?.name === 'string' ? body.name.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120) : ''
    const northRaw = Number(body?.northDeg)
    if (!Number.isFinite(northRaw)) return bad('The North angle is missing.')
    const northDeg = ((Math.round(northRaw) % 360) + 360) % 360

    const input = Array.isArray(body?.markers) ? body.markers : null
    if (!input || input.length === 0) return bad('Place at least one room on the plan first.')
    if (input.length > MAX_MARKERS) return bad('That is more rooms than the plan can hold.')

    const counts: Record<string, number> = {}
    const markers: PlacedMarker[] = []
    for (const m of input) {
      const room = ROOMS.find(r => r.key === m?.roomKey)
      const x = Number(m?.x)
      const y = Number(m?.y)
      if (!room || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > SHEET || y < 0 || y > SHEET) {
        return bad('One of the room marks is not valid.')
      }
      const count = counts[room.key] ?? 0
      if (!room.multiInstance && count >= 1) return bad(`${room.label} can be placed only once.`)
      const zoneIndex = getZoneIndex(x, y, SHEET / 2, SHEET / 2, northDeg)
      markers.push({
        key: buildMarkerKey(room.key, counts),
        roomKey: room.key,
        x,
        y,
        zoneIndex,
        severity: getSeverity(room.key, zoneIndex),
      })
      counts[room.key] = count + 1
    }

    const analysis = analyseLayout(markers)
    const date = new Date()
    // The date printed on the report is the Indian date, so the id and file name use it too.
    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date).replace(/-/g, '')
    const reportId = `VP-${stamp}-${randomBytes(2).toString('hex').toUpperCase()}`

    const buffer = await renderToBuffer(
      React.createElement(VastuReportPDF, { name, reportId, date, northDeg, markers, analysis }) as React.ReactElement<DocumentProps>,
    )

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VastuPro-findings-${stamp}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('VastuPro report error:', err)
    return bad('We could not make the PDF. Please try again.', 500)
  }
}

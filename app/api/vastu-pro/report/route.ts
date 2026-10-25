import React from 'react'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import VastuReportPDF from '@/lib/pdf/vastu-pdf'
import { readPlan } from '@/app/tools/vastu-pro/vastu-reading'
import { CATALOGUE, DOOR_KINDS } from '@/app/tools/vastu-pro/vastu-catalogue'
import { SHEET_UNITS, type DoorMark, type PlacedItem } from '@/app/tools/vastu-pro/vastu-model'
import type { Poly } from '@/app/tools/vastu-pro/vastu-geometry'

export const runtime = 'nodejs'

const MAX_ITEMS = 60
const MAX_CORNERS = 40

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

const num = (v: unknown, lo: number, hi: number): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null
}

/*
  POST /api/vastu-pro/report: the free findings PDF.
  The page sends the outline of the house, where North lies, and where each door and room was drawn. Every reading is
  worked out again here from the same rule table the page uses, so the PDF always agrees with the screen. The page
  never sends a verdict, and nothing is stored.
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const name = typeof body?.name === 'string' ? body.name.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120) : ''
    const northRaw = Number(body?.northDeg)
    if (!Number.isFinite(northRaw)) return bad('The North angle is missing.')
    const northDeg = ((Math.round(northRaw) % 360) + 360) % 360

    // the house outline
    const rawHouse = Array.isArray(body?.house) ? body.house : null
    if (!rawHouse || rawHouse.length < 3) return bad('The outline of the house is missing.')
    if (rawHouse.length > MAX_CORNERS) return bad('The outline of the house has too many corners.')
    const house: Poly = []
    for (const p of rawHouse) {
      const x = num(p?.x, 0, SHEET_UNITS)
      const y = num(p?.y, 0, SHEET_UNITS)
      if (x === null || y === null) return bad('One corner of the house outline is not valid.')
      house.push({ x, y })
    }

    // rooms
    const rawItems = Array.isArray(body?.items) ? body.items : []
    if (rawItems.length > MAX_ITEMS) return bad('That is more rooms than the plan can hold.')
    const items: PlacedItem[] = []
    const seen = new Set<string>()
    const perKind: Record<string, number> = {}
    for (const r of rawItems) {
      const entry = typeof r?.kind === 'string' ? CATALOGUE[r.kind] : undefined
      const id = typeof r?.id === 'string' ? r.id.slice(0, 60) : ''
      const x = num(r?.x, -SHEET_UNITS, 2 * SHEET_UNITS)
      const y = num(r?.y, -SHEET_UNITS, 2 * SHEET_UNITS)
      const w = num(r?.w, 1, SHEET_UNITS)
      const h = num(r?.h, 1, SHEET_UNITS)
      if (!entry || entry.category === 'Doors' || !id || seen.has(id) || x === null || y === null || w === null || h === null) {
        return bad('One of the rooms is not valid.')
      }
      perKind[entry.key] = (perKind[entry.key] ?? 0) + 1
      if (!entry.multi && perKind[entry.key] > 1) return bad(`${entry.label} can be placed only once.`)
      seen.add(id)
      items.push({ id, kind: entry.key, x, y, w, h })
    }

    // doors
    const rawDoors = Array.isArray(body?.doors) ? body.doors : []
    if (rawDoors.length > DOOR_KINDS.length) return bad('That is more doors than the plan can hold.')
    const doors: DoorMark[] = []
    const doorKinds = new Set<string>()
    for (const d of rawDoors) {
      const kind = DOOR_KINDS.find(k => k.key === d?.kind)?.key
      const x = num(d?.pt?.x, 0, SHEET_UNITS)
      const y = num(d?.pt?.y, 0, SHEET_UNITS)
      if (!kind || x === null || y === null || doorKinds.has(kind)) return bad('One of the doors is not valid.')
      doorKinds.add(kind)
      doors.push({ id: kind, kind, pt: { x, y } })
    }

    if (items.length + doors.length === 0) return bad('Mark at least one door or room on the plan first.')

    const reading = readPlan({ house, northDeg, items, doors })
    const date = new Date()
    // The date printed on the report is the Indian date, so the id and file name use it too.
    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date).replace(/-/g, '')
    const reportId = `VP-${stamp}-${randomBytes(2).toString('hex').toUpperCase()}`

    const buffer = await renderToBuffer(
      React.createElement(VastuReportPDF, { name, reportId, date, northDeg, house, items, doors, reading }) as React.ReactElement<DocumentProps>,
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

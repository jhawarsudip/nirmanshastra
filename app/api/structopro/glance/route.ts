import { NextRequest, NextResponse } from 'next/server'
import { runQuantityModel, toFree } from '@/lib/structopro-qty'

// The home page "what does the frame of your house look like" widget.
// Public, no database, no sign-in. It returns the SHAPE of the frame only (grid, counts, plan drawing).
// No quantity of any material and no rupee figure leaves here: those are in the paid report.
// The model runs on the server so the quantity code never ships to the browser.

export const runtime = 'nodejs'

const bad = (error: string) => NextResponse.json({ error }, { status: 400 })

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const area = Math.round(Number(sp.get('area')))
  const floors = Math.round(Number(sp.get('floors')))
  if (!Number.isFinite(area) || area < 300 || area > 3000) return bad('Area of one floor must be between 300 and 3,000 sq ft.')
  if (!Number.isFinite(floors) || floors < 1 || floors > 5) return bad('Floors must be between 1 and 5.')

  const result = runQuantityModel({
    floorAreasSqft: Array.from({ length: floors }, () => area),
    state: 'Maharashtra',
    city: 'Pune',
    site: 'flat',
    wall: 'brick',
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })

  const free = toFree(result)
  const p = free.preview
  return NextResponse.json(
    {
      floors,
      builtUpSqft: Math.round(free.builtUpSqft),
      foundation: free.foundation,
      glance: free.glance,
      // plan drawing of the ground floor: column points and beam lines in metres
      plan: {
        lengthM: p.lengthM,
        widthM: p.widthM,
        columns: p.columns.filter((c) => c.storey === 0).map((c) => ({ x: c.x, y: c.y })),
        beams: p.beams.filter((b) => b.floor === 0).map((b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })),
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}

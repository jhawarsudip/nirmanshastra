import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import StructoProQtyPDF from '@/lib/pdf/structopro-qty-pdf'
import { runQuantityModel, toPaid, savedInput } from '@/lib/structopro-qty'
import { buildStructoCalc } from '@/lib/structopro-qty/calc'

// TEMPORARY timing probe for the StructurePro report on Vercel. It lives on a throwaway test branch only.
// It never touches the database, storage or email, and it answers 404 anywhere except a Vercel preview deployment.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const CASES: Record<string, { name: string; input: Record<string, unknown> }> = {
  light: { name: 'G+0 1000 Pune flat', input: { floorAreasSqft: [1000], state: 'Maharashtra', city: 'Pune' } },
  typical: { name: 'G+2 3x1200 Delhi', input: { floorAreasSqft: [1200, 1200, 1200], state: 'Delhi', city: 'Delhi' } },
  heavy: {
    name: '10 floors stilt Delhi block',
    input: { floorAreasSqft: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000], state: 'Delhi', city: 'Delhi', stilt: true, wall: 'block' },
  },
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const sp = new URL(req.url).searchParams
  const key = sp.get('case') ?? 'typical'
  const noCalc = sp.get('nocalc') === '1'
  const c = CASES[key]
  if (!c) return NextResponse.json({ error: 'case must be light, typical or heavy' }, { status: 400 })

  const mb = (n: number) => Math.round(n / 1048576)
  const t0 = Date.now()
  const rss0 = process.memoryUsage().rss
  const run = runQuantityModel(savedInput(c.input))
  if (!run.ok) return NextResponse.json({ error: run.error }, { status: 422 })
  const report = toPaid(run)
  const t1 = Date.now()
  const calc = noCalc ? null : buildStructoCalc(c.input as never, report)
  const t2 = Date.now()
  const el = React.createElement(StructoProQtyPDF, {
    calc,
    report,
    contact: { name: 'Test Owner', email: '', mobile: '', address: '', city: 'Pune', state: 'Maharashtra' },
    reportId: 'NS-SP-DIAG0001',
    projectName: c.name,
    date: new Date(),
    where: 'Pune, Maharashtra',
    siteLabel: 'Flat ground',
    wallLabel: 'Burnt clay brick walls',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(el as any)
  const t3 = Date.now()
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  return NextResponse.json({
    case: key,
    name: c.name,
    sheetIncluded: !!calc,
    pages,
    bytes: buf.length,
    seconds: { model: (t1 - t0) / 1000, sheet: (t2 - t1) / 1000, render: (t3 - t2) / 1000, total: (t3 - t0) / 1000 },
    memoryMB: { rssBefore: mb(rss0), rssAfter: mb(process.memoryUsage().rss), peakRss: mb(process.resourceUsage().maxRSS * 1024) },
    functionMemoryMB: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE ?? null,
    region: process.env.VERCEL_REGION ?? null,
    node: process.version,
  })
}

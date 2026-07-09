import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export interface DrawingExtractionResult {
  floorArea:         number | null  // sqft
  numFloors:         number | null  // 1=G, 2=G+1, 3=G+2, etc.
  columnGridSpacing: string | null  // e.g. "5m x 4m"
  concreteGrade:     string | null  // e.g. "M20", "M25"
  steelGrade:        string | null  // e.g. "Fe500", "Fe500D"
  drawingNotes:      string | null  // quality or limitation notes
}

const DRAWING_PROMPT = `You are analysing a structural engineering drawing for an Indian residential or commercial building.

Extract ONLY what is explicitly visible or labeled on this drawing. Do not infer, estimate, or guess — if something is not clearly written or dimensioned, return null for that field.

Return ONLY a valid JSON object — no explanation, no markdown code fences:

{
  "floorArea": numeric floor area in sqft as a number (e.g. 1200), or null if not shown. If plan dimensions are labeled (e.g. 30ft x 40ft), calculate area as 30 x 40 = 1200. If labeled in sqm, convert: 1 sqm = 10.764 sqft. If labeled BUA or built-up area, use that value,
  "numFloors": total number of floors as an integer — 1 for Ground only, 2 for G+1, 3 for G+2, 4 for G+3 — derived from floor schedule, section drawing, or explicit text like "G+2". Return null if not stated,
  "columnGridSpacing": column grid spacing as a string (e.g. "5m x 5m", "4m x 3.5m", "15ft x 12ft") if the column grid is drawn and dimensioned. Return null if column positions are not shown or dimensioned,
  "concreteGrade": concrete grade as a string (e.g. "M20", "M25", "M30") ONLY if explicitly written in notes, schedule, or general notes section. Return null otherwise,
  "steelGrade": steel/TMT grade as a string (e.g. "Fe500", "Fe500D", "Fe415") ONLY if explicitly written. Return null otherwise,
  "drawingNotes": one or two sentences about what this drawing appears to be and any significant limitations in reading it (e.g. hand-drawn, partial view, low resolution, not a structural drawing). Return null if it is a clear machine-printed structural drawing with no issues
}

CRITICAL RULES:
- Never fabricate numbers. If dimensions are given in one direction only, return null for floor area rather than guessing.
- If this is not a structural drawing (e.g. a photo, a quotation document, an electrical drawing, a Vastu plan), return: {"error": "Not a structural drawing"}
- Keep all string values concise. This data will be shown to the user for review.`

export async function POST(req: NextRequest) {
  try {
    const { storagePath, fileType } = await req.json() as {
      storagePath: string
      fileType:    string
    }

    if (!storagePath || !fileType) {
      return NextResponse.json(
        { error: 'storagePath and fileType are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_key_here') {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const supabase = createServiceClient()

    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from('contractor-quotes')
      .download(storagePath)

    if (downloadErr || !fileBlob) {
      console.error('Storage download error:', downloadErr)
      return NextResponse.json({ error: 'Could not retrieve the uploaded file' }, { status: 500 })
    }

    const base64Data = Buffer.from(await fileBlob.arrayBuffer()).toString('base64')

    const isPdf     = fileType === 'application/pdf'
    const mediaType = isPdf
      ? ('application/pdf' as const)
      : fileType === 'image/png'
        ? ('image/png'  as const)
        : ('image/jpeg' as const)

    const fileContent = isPdf
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: mediaType, data: base64Data } }
      : { type: 'image'    as const, source: { type: 'base64' as const, media_type: mediaType, data: base64Data } }

    const requestHeaders: Record<string, string> = {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    }
    if (isPdf) requestHeaders['anthropic-beta'] = 'pdfs-2024-09-25'

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: requestHeaders,
      body:    JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role:    'user',
          content: [
            fileContent,
            { type: 'text', text: DRAWING_PROMPT },
          ],
        }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic API error (extract-drawing):', errText)
      return NextResponse.json({ error: 'AI extraction failed' }, { status: 502 })
    }

    const anthropicData = await anthropicRes.json()
    const rawText       = (anthropicData.content?.[0]?.text ?? '') as string

    const cleanText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/,           '')
      .trim()

    let extraction: DrawingExtractionResult | { error: string }
    try {
      extraction = JSON.parse(cleanText) as DrawingExtractionResult | { error: string }
    } catch {
      console.error('JSON parse failed (extract-drawing). Raw:', rawText)
      return NextResponse.json(
        { error: 'Could not read the drawing — it may be too low quality or not a structural plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, extraction })
  } catch (err) {
    console.error('compare-quote/extract-drawing error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

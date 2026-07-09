import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export interface ExtractedLineItem {
  description: string
  quantity:    string | null
  unit:        string | null
  unitRate:    string | null
  totalPrice:  string | null
}

export interface ExtractionResult {
  lineItems:   ExtractedLineItem[]
  scopeOfWork: string
  totalAmount: string | null
  currency:    string
  notes:       string | null
}

const EXTRACTION_PROMPT = `You are analysing a contractor's construction quote or estimate document for an Indian building project.

Extract the following and return ONLY a valid JSON object — no explanation, no markdown code fences:

{
  "lineItems": [
    {
      "description": "item name / description",
      "quantity": "numeric quantity as string, e.g. '150' or null if not stated",
      "unit": "unit of measure, e.g. 'sqft', 'bags', 'kg', 'nos', 'rft', 'cum', 'sqm' or null",
      "unitRate": "rate per unit in rupees as a plain number string, e.g. '450' or null if not stated",
      "totalPrice": "total price for this item in rupees as a plain number string, e.g. '67500' or null if not stated"
    }
  ],
  "scopeOfWork": "One concise sentence describing what work this quote covers — e.g. 'Full RCC structure including foundation, columns, beams and slabs for G+2 building' or 'Masonry and external plastering only'",
  "totalAmount": "Grand total in rupees as a plain number string, e.g. '2850000', or null if no total is stated",
  "currency": "INR",
  "notes": "One or two sentences noting anything important a homeowner should know — exclusions, conditions, vague items, suspicious patterns — or null if nothing notable"
}

Rules:
- Strip currency symbols (₹, Rs, INR) from number fields — store only the numeric value as a string.
- If a value is genuinely absent in the document, use null. Do not guess.
- If the document is not a construction quote at all, return: {"error": "Not a construction quote document"}
- Keep descriptions in the same language as the document (Hindi or English).`

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

    // Retrieve file from private storage using service-role key
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
        ? ('image/png' as const)
        : ('image/jpeg' as const)

    const fileContent = isPdf
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: mediaType, data: base64Data } }
      : { type: 'image'    as const, source: { type: 'base64' as const, media_type: mediaType, data: base64Data } }

    const requestHeaders: Record<string, string> = {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    }
    // PDF support beta header (harmless on stable releases)
    if (isPdf) requestHeaders['anthropic-beta'] = 'pdfs-2024-09-25'

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: requestHeaders,
      body:    JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 4096,
        messages:   [
          {
            role:    'user',
            content: [
              fileContent,
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic API error:', errText)
      return NextResponse.json({ error: 'AI extraction failed' }, { status: 502 })
    }

    const anthropicData = await anthropicRes.json()
    const rawText       = (anthropicData.content?.[0]?.text ?? '') as string

    // Strip markdown code fences if the model wraps them
    const cleanText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/,           '')
      .trim()

    let extraction: ExtractionResult | { error: string }
    try {
      extraction = JSON.parse(cleanText) as ExtractionResult | { error: string }
    } catch {
      console.error('JSON parse failed. Raw response:', rawText)
      return NextResponse.json(
        { error: 'Could not parse AI response — try a clearer image or PDF', rawText },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, extraction })
  } catch (err) {
    console.error('compare-quote/extract error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

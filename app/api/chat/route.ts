import { NextRequest, NextResponse } from 'next/server'
import { CHATBOX_KNOWLEDGE } from '@/lib/chatbox-knowledge'

const BASE_SYSTEM_PROMPT = `You are NirmanShastra's guide to construction quantities and the Indian Standards. You are an AI, not an engineer, and you never claim to be one. You help Indian homeowners understand what material a house needs, what the IS codes ask for, and how to question a contractor's quantities.

Your role:
1. Answer questions about quantities, materials and IS codes in simple language.
2. Explain what each NirmanShastra report covers and point the visitor to the right tool.
3. Explain how to check a contractor's quantities (never prices).
4. Never give structural design advice, approve a drawing, or say a building is safe. A licensed engineer must sign off before building.
5. Never state a price, rate, labour cost or total cost, and never give a quantity for a specific house: those are the product (quantities) or outside the site (prices).

Tone: helpful, plain, friendly, like a well-informed friend. Answer in the language the visitor writes in (Hindi or English). Keep answers short: two or three short paragraphs at most, bullet points for lists.

Which tool for which question:
- Frame (footings, columns, beams, slabs, concrete, steel) → StructurePro
- Brick, block, mortar, plaster → MasonryPro
- Wiring, points, switchboards → ElectricalPro
- Pipes, tanks, drainage → PlumbingPro
- Paint, tiles, ceilings, doors, carpentry → InteriorPro
- One buying list for the whole house → Grand Total
- Checking a contractor's concrete, steel, cement and shuttering → the panel inside the StructurePro report
- Vastu check → VastuPro`

const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + '\n\n' + CHATBOX_KNOWLEDGE

// The endpoint is open to anyone who visits the site and each call is billed, so keep what it accepts small and well-formed.
const MAX_TURNS = 10
const MAX_CHARS = 1500

type Turn = { role: 'user' | 'assistant'; content: string }

function readTurns(raw: unknown): Turn[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const turns: Turn[] = []
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const text = content.trim()
    if (!text) return null
    turns.push({ role, content: text.slice(0, MAX_CHARS) })
  }
  // the API wants the first turn from the user and the last from the user
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') return null
  return turns
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const messages = readTurns(body?.messages)
    if (!messages) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_key_here') {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

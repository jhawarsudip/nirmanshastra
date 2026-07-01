import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are NirmanShastra's construction advisor. You are a knowledgeable civil engineer who helps Indian homeowners understand construction costs, IS codes, and how to avoid contractor fraud. You have expertise in IS 456:2000 (concrete), IS 1786:2008 (steel), IS 732:2019 (electrical), IS 1172:1993 (plumbing), IS 1905:1987 (masonry), IS 4326:1993 (seismic), and NBC 2016.

Your role:
1. Answer questions about construction costs, materials, and IS codes in simple language
2. Help users understand what quantities they should expect for their project
3. Explain how to verify if a contractor quote is fair
4. Guide users to the right NirmanShastra tool for their need
5. Never give specific structural design advice that requires a licensed engineer
6. Always recommend professional supervision for actual construction

Tone: Helpful, authoritative, friendly. Like a trusted engineer friend, not a robot.
Language: Answer in the same language the user writes in (Hindi or English).

When users ask about specific tools, guide them:
- Structure/RCC cost → StructurePro
- Brick/masonry/plaster → MasonryPro
- Electrical wiring → ElectricalPro
- Plumbing/water → PlumbingPro
- Flooring/paint/interior → InteriorPro
- Vastu check → VastuPro

Keep responses concise — 2-3 paragraphs maximum. Use bullet points for lists.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
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
        messages: messages.slice(-10),
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

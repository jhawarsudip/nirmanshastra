import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set('adminSession', 'valid', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   60 * 60 * 24,
      path:     '/',
      sameSite: 'lax',
    })
    return res
  } catch {
    return NextResponse.json({ ok: false })
  }
}

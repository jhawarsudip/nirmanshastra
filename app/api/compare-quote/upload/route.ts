import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Normalise image/jpg → image/jpeg
    const mimeType = file.type === 'image/jpg' ? 'image/jpeg' : file.type

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only PDF, JPG, or PNG files are accepted' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size must be under 10 MB' },
        { status: 400 }
      )
    }

    // Identify the caller if logged in
    let userId = 'anon'
    try {
      const authClient = await createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      if (user) userId = user.id
    } catch { /* unauthenticated — userId stays 'anon' */ }

    const supabase = createServiceClient()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const storagePath = `contractor-quotes/${userId}/${timestamp}_${safeName}`

    // createBucket is idempotent — ignore "already exists" errors
    await supabase.storage.createBucket('contractor-quotes', {
      public:                false,
      fileSizeLimit:         MAX_SIZE_BYTES,
      allowedMimeTypes:      ALLOWED_TYPES,
    }).catch(() => null)

    const { error: uploadErr } = await supabase.storage
      .from('contractor-quotes')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert:      false,
      })

    if (uploadErr) {
      console.error('Supabase storage upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
    }

    return NextResponse.json({
      success:     true,
      storagePath,
      fileName:    file.name,
      fileType:    mimeType,
      fileSizeKb:  Math.round(file.size / 1024),
    })
  } catch (err) {
    console.error('compare-quote/upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

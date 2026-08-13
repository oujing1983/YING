import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!verifyToken(token)) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const { image, name } = await req.json()
    if (!image) return NextResponse.json({ ok: false }, { status: 400 })
    const m = image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!m) return NextResponse.json({ ok: false }, { status: 400 })
    const allowed = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
    const rawExt = m[1].toLowerCase()
    if (!allowed.has(rawExt)) return NextResponse.json({ ok: false }, { status: 400 })
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt
    const safeName = String(name || `img-${Date.now()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || `img-${Date.now()}`
    const filename = safeName + '.' + ext
    const fp = path.join(process.cwd(), 'public', 'uploads', filename)
    fs.mkdirSync(path.dirname(fp), { recursive: true })
    fs.writeFileSync(fp, Buffer.from(m[2], 'base64'))
    return NextResponse.json({ ok: true, url: '/uploads/' + filename })
  } catch { return NextResponse.json({ ok: false }, { status: 500 }) }
}

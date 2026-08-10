import { NextRequest, NextResponse } from 'next/server'
import { writeData } from '@/lib/data'
import { verifyToken } from '@/lib/auth'
import { getSiteConfig } from '@/lib/siteDefaults'

export async function GET() {
  return NextResponse.json(getSiteConfig(), { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!verifyToken(token)) return NextResponse.json({ ok: false }, { status: 401 })
  const data = await req.json()
  writeData('site', data)
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const data = readData('site', { factoryImages: [] })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!verifyToken(token)) return NextResponse.json({ ok: false }, { status: 401 })
  const data = await req.json()
  writeData('site', data)
  return NextResponse.json({ ok: true })
}

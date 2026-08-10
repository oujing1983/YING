import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (verifyPassword(password)) {
      const token = createToken()
      return NextResponse.json({ ok: true, token })
    }
    return NextResponse.json({ ok: false, message: '密码错误' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, message: '请求错误' }, { status: 400 })
  }
}

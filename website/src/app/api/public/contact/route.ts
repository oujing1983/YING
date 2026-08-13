import { NextResponse } from 'next/server'
import { readData } from '@/lib/data'

export async function GET() {
  const fallback = {
    phone: '18005770078',
    wechat: '13868685802',
    email: '309985325@qq.com',
    address: '',
    company: '至微包装有限公司',
    wechatQr: '/brand/wechat-qr.jpg',
    csPhone: '18005770078',
  }
  const data = readData('contact', fallback)
  return NextResponse.json(data)
}

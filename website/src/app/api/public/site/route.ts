import { NextResponse } from 'next/server'
import { readData } from '@/lib/data'
import { getSiteConfig } from '@/lib/siteDefaults'

export async function GET() {
  const data: any = getSiteConfig()
  data.carouselImages = readData('carousel', [])
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const KV_URL = process.env.KV_REST_API_URL || ''
const KV_TOKEN = process.env.KV_REST_API_TOKEN || ''
const useKV = !!(KV_URL && KV_TOKEN)

const fallback = [
  { id: "carton", name: "纸箱", desc: "三层、五层瓦楞纸箱，按需定制尺寸、厚度、材质，支持定制印刷。", image: "/products/carton.jpg" },
  { id: "epe-foam", name: "珍珠棉", desc: "按产品结构开槽、冲型、粘合，适合精密件、仪器、电子产品内托防护。", image: "/products/epe-foam.png" },
  { id: "epe-bag", name: "珍珠棉袋", desc: "EPE珍珠棉柔韧防震，适合表面防刮和缓冲保护，可按尺寸热合成袋。", image: "/products/epe-bag.jpg" },
  { id: "bubble-bag", name: "气泡袋", desc: "轻便缓冲，适合电商、小家电、玻璃制品发货，可做自粘口、防静电袋。", image: "/products/bubble-bag.png" },
]

export async function GET() {
  if (useKV) {
    try {
      const res = await fetch(`${KV_URL}/get/zw:products`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      })
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          if (Array.isArray(data) && data.length > 0) return NextResponse.json(data)
        }
      }
    } catch {}
  }
  try {
    const p = path.join(DATA_DIR, 'products.json')
    return NextResponse.json(JSON.parse(fs.readFileSync(p, 'utf8')))
  } catch {
    return NextResponse.json(fallback)
  }
}

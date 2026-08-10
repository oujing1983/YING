import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const INQUIRY = path.join(process.cwd(), 'data', 'inquiries.jsonl')

export async function GET() {
  try {
    const content = fs.readFileSync(INQUIRY, 'utf8').trim()
    const records = content ? content.split('\n').filter(Boolean).reverse().map(l => JSON.parse(l)) : []
    return NextResponse.json(records)
  } catch { return NextResponse.json([]) }
}

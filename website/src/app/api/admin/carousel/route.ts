import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const data = readData('carousel', [])
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!verifyToken(token)) return NextResponse.json({ ok: false }, { status: 401 })

  const newItem = await req.json()

  // 后台一次提交完整列表；旧版接口只接受单项，导致界面看似更新但文件没有保存。
  if (Array.isArray(newItem)) {
    writeData('carousel', newItem)
    return NextResponse.json({ ok: true, count: newItem.length })
  }
  if (!newItem || typeof newItem.id === 'undefined') {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  }

  const currentData: any[] = readData('carousel', [])
  
  // 查找是否已存在相同 id 的项
  const existingIndex = currentData.findIndex(item => item.id == newItem.id)
  
  if (existingIndex >= 0) {
    // 更新现有项（只覆盖传入的字段，保留其他字段）
    currentData[existingIndex] = { ...currentData[existingIndex], ...newItem }
  } else {
    // 新增项
    currentData.push(newItem)
  }

  writeData('carousel', currentData)
  return NextResponse.json({ ok: true })
}

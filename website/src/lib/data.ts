import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

export function readData<T>(name: string, fallback: T): T {
  try {
    const p = path.join(DATA_DIR, name + '.json')
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch { return fallback }
}

export function writeData(name: string, data: unknown) {
  const p = path.join(DATA_DIR, name + '.json')
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
}

// Async wrappers (just call sync versions)
export async function readDataAsync<T>(name: string, fallback: T): Promise<T> {
  return readData(name, fallback)
}

export async function writeDataAsync(name: string, data: unknown): Promise<boolean> {
  try { writeData(name, data); return true }
  catch { return false }
}

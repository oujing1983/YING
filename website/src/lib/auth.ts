import crypto from 'crypto'

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASS
}

export function createToken(): string {
  const time = Date.now().toString(36)
  const random = crypto.randomBytes(16).toString('hex')
  const sig = crypto.createHmac('sha256', ADMIN_PASS).update(time + '.' + random).digest('hex')
  return time + '.' + random + '.' + sig
}

export function verifyToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [timeB36, random, sig] = parts
  const ts = parseInt(timeB36, 36)
  if (Date.now() - ts > TOKEN_EXPIRY) return false
  const expected = crypto.createHmac('sha256', ADMIN_PASS).update(timeB36 + '.' + random).digest('hex')
  return sig === expected
}

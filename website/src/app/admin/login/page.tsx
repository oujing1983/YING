'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('admin_token', data.token)
        router.push('/admin')
      } else {
        setError(data.message || '密码错误')
      }
    } catch {
      setError('登录失败，请重试')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px', margin: '0 auto 12px' }}>ZW</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>至微包装后台</h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '4px 0 0' }}>请输入管理密码</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="管理密码"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
          autoFocus
        />
        {error && <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>登录</button>
      </form>
    </div>
  )
}

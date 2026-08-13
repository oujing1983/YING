"use client"
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'products' | 'carousel' | 'site' | 'contact' | 'inquiries'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('products')
  const router = useRouter()
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) router.push('/admin/login')
    else setAuthed(true)
  }, [router])
  if (!authed) return null

  const nav = [
    { key: 'products' as Tab, label: '产品管理', icon: '\📦' },
    { key: 'carousel' as Tab, label: '轮播图', icon: '\🖼️\ufe0f' },
    { key: 'site' as Tab, label: '网站设置', icon: '\u2699\ufe0f' },
    { key: 'contact' as Tab, label: '公司信息', icon: '\📞' },
    { key: 'inquiries' as Tab, label: '询盘记录', icon: '\u2709\ufe0f' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <nav style={{ width: 220, background: '#0F172A', color: '#fff', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>至微包装</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>管理后台</div>
        </div>
        {nav.map(item => (
          <button key={item.key} onClick={() => setTab(item.key)} style={{
            display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
            background: tab === item.key ? 'rgba(37,99,235,0.15)' : 'transparent',
            border: 'none', color: tab === item.key ? '#60A5FA' : 'rgba(255,255,255,0.6)',
            fontSize: 14, cursor: 'pointer'
          }}>{item.icon} {item.label}</button>
        ))}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 16 }}>
          <button onClick={() => window.location.href = '/'} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{'\u2190'} 返回网站</button>
        </div>
      </nav>
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {tab === 'products' && <ProductsTab />}
        {tab === 'carousel' && <CarouselTab />}
        {tab === 'contact' && <ContactTab />}
        {tab === 'site' && <SiteTab />}
        {tab === 'inquiries' && <InquiriesTab />}
      </div>
    </div>
  )
}

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', desc: '', image: '', specs: [] as {k:string,v:string}[], apps: [] as string[] })

  useEffect(() => { fetch('/api/admin/products').then(r => r.json()).then(setProducts) }, [])

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'
  }

  async function saveAll(updated: any[]) {
    await fetch('/api/admin/products', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') },
      body: JSON.stringify(updated)
    })
    setProducts(updated)
  }

  function startEdit(p: any) {
    const specsArr = p.specs ? Object.entries(p.specs).map(([k,v]) => ({k, v: String(v)})) : []
    const appsArr = p.applications ? [...p.applications] : []
    setEditId(p.id)
    setForm({ name: p.name, desc: p.desc, image: p.image, specs: specsArr, apps: appsArr })
  }

  async function saveEdit() {
    const specs: Record<string,string> = {}
    form.specs.forEach(s => { if (s.k.trim()) specs[s.k.trim()] = s.v })
    const updated = products.map(p => p.id === editId ? {
      ...p, name: form.name, desc: form.desc, image: form.image || p.image,
      specs, applications: form.apps.filter(Boolean)
    } : p)
    await saveAll(updated)
    setEditId(null)
  }

  async function addProduct() {
    if (!form.name) return
    const specs: Record<string,string> = {}
    form.specs.forEach(s => { if (s.k.trim()) specs[s.k.trim()] = s.v })
    const newProduct = {
      id: slugify(form.name), name: form.name, desc: form.desc,
      image: form.image || 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&q=80',
      specs, applications: form.apps.filter(Boolean)
    }
    await saveAll([...products, newProduct])
    setForm({ name: '', desc: '', image: '', specs: [], apps: [] })
    setAdding(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('确定要删除这个产品吗？')) return
    await saveAll(products.filter(p => p.id !== id))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, cb: (url: string) => void) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) })
      const d = await r.json()
      if (d.ok) cb(d.url)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>产品管理</h2>
        <button onClick={() => { setAdding(true); setForm({ name: '', desc: '', image: '', specs: [], apps: [] }); setEditId(null) }}
          style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 添加产品</button>
      </div>

      {adding && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>添加新产品</h3>
          <input placeholder="产品名称 *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
          <textarea placeholder="产品描述" value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
          <input type="file" accept="image/*" onChange={e => handleUpload(e, (url) => setForm(f => ({...f, image: url})))} style={{ fontSize: 13, marginBottom: 8 }} />
          {form.image && <img src={form.image} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />}
          <div style={{ marginTop: 12, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>规格参数</div>
            {form.specs.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={s.k} onChange={e => { const n = [...form.specs]; n[i] = {...n[i], k: e.target.value}; setForm(f => ({...f, specs: n})) }}
                  placeholder="参数名" style={{ width: '35%', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
                <input value={s.v} onChange={e => { const n = [...form.specs]; n[i] = {...n[i], v: e.target.value}; setForm(f => ({...f, specs: n})) }}
                  placeholder="参数值" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
                <button onClick={() => setForm(f => ({...f, specs: form.specs.filter((_,j) => j !== i)}))}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, cursor: 'pointer', lineHeight: '20px' }}>×</button>
              </div>
            ))}
            <button onClick={() => setForm(f => ({...f, specs: [...form.specs, {k:'',v:''}]}))}
              style={{ padding: '4px 12px', borderRadius: 6, border: '1px dashed #94A3B8', background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>+ 添加规格</button>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '12px 0 8px' }}>适用行业</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {form.apps.map((a, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontSize: 12 }}>
                  {a}
                  <button onClick={() => setForm(f => ({...f, apps: form.apps.filter((_,j) => j !== i)}))}
                    style={{ border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: '14px' }}>×</button>
                </span>
              ))}
            </div>
            <input placeholder="输入行业名称按回车添加" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) { setForm(f => ({...f, apps: [...f.apps, v]})); (e.target as HTMLInputElement).value = '' } } }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={addProduct} disabled={!form.name} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: !form.name ? '#94A3B8' : '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>添加</button>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {products.map((p: any) => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
            {editId === p.id ? (
              <div>
                <img src={form.image || p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
                <textarea value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
                <input type="file" accept="image/*" onChange={e => handleUpload(e, (url) => setForm(f => ({...f, image: url})))} style={{ fontSize: 13, marginBottom: 12 }} />
                <div style={{ marginTop: 8, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>规格参数</div>
                  {form.specs.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input value={s.k} onChange={e => { const n = [...form.specs]; n[i] = {...n[i], k: e.target.value}; setForm(f => ({...f, specs: n})) }}
                        placeholder="参数名" style={{ width: '35%', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
                      <input value={s.v} onChange={e => { const n = [...form.specs]; n[i] = {...n[i], v: e.target.value}; setForm(f => ({...f, specs: n})) }}
                        placeholder="参数值" style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
                      <button onClick={() => setForm(f => ({...f, specs: form.specs.filter((_,j) => j !== i)}))}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, cursor: 'pointer', lineHeight: '20px' }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({...f, specs: [...form.specs, {k:'',v:''}]}))}
                    style={{ padding: '4px 12px', borderRadius: 6, border: '1px dashed #94A3B8', background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>+ 添加规格</button>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '12px 0 8px' }}>适用行业</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {form.apps.map((a, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontSize: 12 }}>
                        {a}
                        <button onClick={() => setForm(f => ({...f, apps: form.apps.filter((_,j) => j !== i)}))}
                          style={{ border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: '14px' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <input placeholder="输入行业名称按回车添加" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) { setForm(f => ({...f, apps: [...f.apps, v]})); (e.target as HTMLInputElement).value = '' } } }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={saveEdit} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>保存</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>取消</button>
                </div>
              </div>
            ) : (
              <div>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px', lineHeight: 1.5 }}>{p.desc}</p>
                {p.specs && Object.keys(p.specs).length > 0 && (
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#64748B' }}>
                    {Object.entries(p.specs).slice(0, 3).map(([k,v]) => (
                      <div key={k as string} style={{ lineHeight: 1.6 }}><strong>{k as string}:</strong> {String(v).substring(0, 24)}</div>
                    ))}
                    {Object.keys(p.specs).length > 3 && <div style={{ color: '#94A3B8' }}>...</div>}
                  </div>
                )}
                {p.applications && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {p.applications.map((a: string) => (
                      <span key={a} style={{ padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontSize: 11 }}>{a}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(p)} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>编辑</button>
                  <button onClick={() => deleteProduct(p.id)} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}>删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CarouselTab() {
  const [slides, setSlides] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [newImage, setNewImage] = useState('')
  const [primaryLabel, setPrimaryLabel] = useState('')
  const [primaryUrl, setPrimaryUrl] = useState('')
  useEffect(() => { fetch('/api/admin/carousel').then(r => r.json()).then(setSlides) }, [])

  function updateSlide(id: number, key: string, value: string) {
    setSlides(current => current.map(slide => slide.id === id ? { ...slide, [key]: value } : slide))
  }

  async function saveSlides(nextSlides = slides) {
    const response = await fetch('/api/admin/carousel', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify(nextSlides) })
    if (!response.ok) { alert('轮播图保存失败，请重新登录后再试'); return false }
    return true
  }

  async function uploadSlideImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) })
      const d = await r.json()
      if (d.ok) setNewImage(d.url)
    }
    reader.readAsDataURL(file)
  }

  async function addSlide() {
    if (!title) { alert('请填写标题'); return }
    const img = newImage || 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=1920&q=80'
    const updated = [...slides, { id: Date.now(), image: img, title, subtitle, primaryLabel, primaryUrl, external: /^https?:\/\//.test(primaryUrl) }]
    if (!await saveSlides(updated)) return
    setSlides(updated); setTitle(''); setSubtitle(''); setNewImage(''); setPrimaryLabel(''); setPrimaryUrl(''); alert('轮播图已保存，前台刷新后即可看到')
  }

  async function removeSlide(id: number) {
    const updated = slides.filter((s: any) => s.id !== id)
    if (!await saveSlides(updated)) return
    setSlides(updated)
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>轮播图管理</h2>
      <p style={{ margin: '-12px 0 20px', color: '#64748B', fontSize: 13 }}>首页首屏启用轮播后，标题、副标题和按钮以这里每一张轮播图的内容为准。</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', marginBottom: 24 }}>
        <input placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
        <input placeholder="副标题" value={subtitle} onChange={e => setSubtitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
        <input placeholder="按钮文字，例如：进入在线工具" value={primaryLabel} onChange={e => setPrimaryLabel(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
        <input placeholder="按钮链接，例如：/tools 或 https://example.com" value={primaryUrl} onChange={e => setPrimaryUrl(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }} />
        <div style={{ marginBottom: 8 }}>
          <input type="file" accept="image/*" onChange={uploadSlideImage} style={{ fontSize: 13 }} />
          {newImage && <img src={newImage} alt="" style={{ width: 120, height: 70, objectFit: 'cover', borderRadius: 6, marginTop: 6, display: 'block' }} />}
        </div>
        <button onClick={addSlide} disabled={!title} style={{ padding: '10px', borderRadius: 6, border: 'none', background: !title ? '#94A3B8' : '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}>添加轮播图</button>
      </div>
      {slides.map((s: any) => (
        <div key={s.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E2E8F0', marginBottom: 8, alignItems: 'center' }}>
          <img src={s.image} alt={s.title} style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 8 }} />
          <div style={{ flex: 1, display: 'grid', gap: 6 }}>
            <input value={s.title || ''} onChange={e => updateSlide(s.id, 'title', e.target.value)} placeholder="轮播标题" style={{ width: '100%', padding: '7px 9px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
            <textarea value={s.subtitle || ''} onChange={e => updateSlide(s.id, 'subtitle', e.target.value)} placeholder="轮播副标题" rows={2} style={{ width: '100%', padding: '7px 9px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
            <input value={s.primaryLabel || ''} onChange={e => updateSlide(s.id, 'primaryLabel', e.target.value)} placeholder="按钮文字" style={{ width: '100%', padding: '7px 9px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box' }} />
            <input value={s.primaryUrl || ''} onChange={e => setSlides(current => current.map(slide => slide.id === s.id ? { ...slide, primaryUrl: e.target.value, external: /^https?:\/\//.test(e.target.value) } : slide))} placeholder="按钮链接" style={{ width: '100%', padding: '7px 9px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box' }} />
          </div>
          <button onClick={async () => { if (await saveSlides()) alert('轮播图文案已保存') }} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 12, cursor: 'pointer' }}>保存</button>
          <button onClick={() => removeSlide(s.id)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>删除</button>
        </div>
      ))}
    </div>
  )
}

function SiteTab() {
  const [data, setData] = useState<any>({ logo: 'ZW', logoImage: '/assets/logo.jpg', heroTitle: '', heroSubtitle: '', heroEyebrow: '', advantagesEyebrow: '', advantagesTitle: '', advantagesDesc: '', industriesEyebrow: '', industriesTitle: '', industriesDesc: '', processEyebrow: '', processTitle: '', processDesc: '', factoryEyebrow: '', factoryTitle: '', factoryDesc: '', productsEyebrow: '', productsTitle: '', productsDesc: '', contactEyebrow: '', contactTitle: '', contactDesc: '', factoryImages: [], advantagesImages: [], industriesImages: [], processImages: [], productsImages: [], contactsectionImages: [] })
  const [saved, setSaved] = useState(false)
  useEffect(() => { fetch('/api/admin/site').then(r => r.json()).then(setData) }, [])
  
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, cb: (url: string) => void) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) })
      const d = await r.json()
      if (d.ok) cb(d.url)
    }
    reader.readAsDataURL(file)
  }

  function set(key: string, val: string) { setData({...data, [key]: val}) }

  function section(title: string, fields: {key:string, label:string, rows?:number}[]) {
    return <>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '24px 0 16px', paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>{title}</h3>
      {fields.map(f => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>{f.label}</label>
          {f.rows ? (
            <textarea value={data[f.key] || ''} onChange={e => set(f.key, e.target.value)} rows={f.rows} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
          ) : (
            <input value={data[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box' }} />
          )}
        </div>
      ))}
    </>
  }

  async function save() {
    const r = await fetch('/api/admin/site', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify(data) })
    const d = await r.json()
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    else { alert('保存失败，请重试') }
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>网站设置</h2>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', maxWidth: 700 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 16px' }}>Logo</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Logo 文字</label>
          <input value={data.logo || ''} onChange={e => set('logo', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#64748B', marginBottom: 4, display: 'block' }}>Logo 图片（可选，上传后替代文字）</label>
          <input type="file" accept="image/*" onChange={e => handleUpload(e, (url) => setData({...data, logoImage: url}))} style={{ fontSize: 13 }} />
          {data.logoImage && <img src={data.logoImage} alt="" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6, marginTop: 8 }} />}
        </div>

        {section('Hero 区域', [
          {key:'heroEyebrow', label:'顶部标签'},
          {key:'heroTitle', label:'大标题'},
          {key:'heroSubtitle', label:'副标题', rows:2},
        ])}
        <p style={{ margin: '-4px 0 18px', padding: '10px 12px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, lineHeight: 1.6 }}>提示：当“轮播图”中存在内容时，首页首屏标题和副标题以轮播图管理中的文案为准；这里的 Hero 文案作为没有轮播图时的备用内容。</p>

        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showAdvantages: data.showAdvantages === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showAdvantages === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showAdvantages === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>优势板块</span>
                <span style={{ fontSize: 11, color: data.showAdvantages === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showAdvantages === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['advantagesEyebrow'] || ''} onChange={e => setData({...data, 'advantagesEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['advantagesTitle'] || ''} onChange={e => setData({...data, 'advantagesTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['advantagesDesc'] || ''} onChange={e => setData({...data, 'advantagesDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['advantagesImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['advantagesImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['advantagesImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'advantagesImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'advantagesImages': (data['advantagesImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show优势'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'advantagesImages': [...(data['advantagesImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show优势'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showIndustries: data.showIndustries === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showIndustries === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showIndustries === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>行业覆盖</span>
                <span style={{ fontSize: 11, color: data.showIndustries === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showIndustries === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['industriesEyebrow'] || ''} onChange={e => setData({...data, 'industriesEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['industriesTitle'] || ''} onChange={e => setData({...data, 'industriesTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['industriesDesc'] || ''} onChange={e => setData({...data, 'industriesDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['industriesImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['industriesImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['industriesImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'industriesImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'industriesImages': (data['industriesImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show行业覆盖'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'industriesImages': [...(data['industriesImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show行业覆盖'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showProcess: data.showProcess === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showProcess === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showProcess === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>合作流程</span>
                <span style={{ fontSize: 11, color: data.showProcess === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showProcess === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['processEyebrow'] || ''} onChange={e => setData({...data, 'processEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['processTitle'] || ''} onChange={e => setData({...data, 'processTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['processDesc'] || ''} onChange={e => setData({...data, 'processDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['processImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['processImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['processImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'processImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'processImages': (data['processImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show合作流程'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'processImages': [...(data['processImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show合作流程'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showFactory: data.showFactory === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showFactory === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showFactory === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>工厂实力</span>
                <span style={{ fontSize: 11, color: data.showFactory === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showFactory === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['factoryEyebrow'] || ''} onChange={e => setData({...data, 'factoryEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['factoryTitle'] || ''} onChange={e => setData({...data, 'factoryTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['factoryDesc'] || ''} onChange={e => setData({...data, 'factoryDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['factoryImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['factoryImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['factoryImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'factoryImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'factoryImages': (data['factoryImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show工厂实力'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'factoryImages': [...(data['factoryImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show工厂实力'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showProducts: data.showProducts === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showProducts === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showProducts === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>产品中心</span>
                <span style={{ fontSize: 11, color: data.showProducts === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showProducts === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['productsEyebrow'] || ''} onChange={e => setData({...data, 'productsEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['productsTitle'] || ''} onChange={e => setData({...data, 'productsTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['productsDesc'] || ''} onChange={e => setData({...data, 'productsDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['productsImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['productsImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['productsImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'productsImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'productsImages': (data['productsImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show产品中心'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'productsImages': [...(data['productsImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show产品中心'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>        <div style={{ marginBottom: 16, padding: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}
                onClick={() => setData({...data, showContact: data.showContact === false ? true : false})}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: data.showContact === false ? '#CBD5E1' : '#2563EB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: data.showContact === false ? 2 : 20, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, userSelect: 'none' }}>联系我们</span>
                <span style={{ fontSize: 11, color: data.showContact === false ? '#EF4444' : '#22C55E', fontWeight: 500 }}>{data.showContact === false ? '已隐藏' : '显示中'}</span>
              </div>
              <input value={data['contactEyebrow'] || ''} onChange={e => setData({...data, 'contactEyebrow': e.target.value})}
                placeholder="小标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <input value={data['contactTitle'] || ''} onChange={e => setData({...data, 'contactTitle': e.target.value})}
                placeholder="大标题"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }} />
              <textarea value={data['contactDesc'] || ''} onChange={e => setData({...data, 'contactDesc': e.target.value})}
                placeholder="描述文字" rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '8px 0 6px' }}>展示图片：</div>
              {(data['contactsectionImages'] || []).length === 0 && <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>暂无图片</p>}
              {(data['contactsectionImages'] || []).map((img: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                  <img src={img.src} alt={img.label} style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  <input value={img.label} onChange={e => { const n = [...(data['contactsectionImages'] || [])]; n[i] = {...n[i], label: e.target.value}; setData({...data, 'contactsectionImages': n}) }}
                    placeholder="标签" style={{ flex: 1, padding: '3px 6px', borderRadius: 3, border: '1px solid #E2E8F0', fontSize: 11 }} />
                  <button onClick={() => setData({...data, 'contactsectionImages': (data['contactsectionImages'] || []).filter((_:any,j:number) => j !== i)})}
                    style={{ padding: '1px 6px', borderRadius: 3, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>删除</button>
                </div>
              ))}
              <input id={'img-show联系我们'} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) }); const d = await r.json(); if (d.ok) setData({...data, 'contactsectionImages': [...(data['contactsectionImages'] || []), {src: d.url, label: ''}]}) }; reader.readAsDataURL(file) } } />
              <label htmlFor={'img-show联系我们'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 4, border: '1px dashed #94A3B8', color: '#64748B', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>+ 添加</label>
        </div>

        <button onClick={save} style={{ marginTop: 24, padding: '10px 32px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saved ? '✓ 已保存' : '保存'}</button>
      </div>
    </div>
  )
}
function ContactTab() {
  const [data, setData] = useState<Record<string,string>>({ company: '', phone: '', wechat: '', email: '', address: '', wechatQr: '', csPhone: '' })
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { fetch('/api/admin/contact').then(r => r.json()).then(setData) }, [])

  async function handleQrUpload(file: File) {
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify({ image: reader.result }) })
        const d = await r.json()
        if (d.ok) {
          setData(prev => ({...prev, wechatQr: d.url}))
        } else {
          alert('上传失败 (HTTP ' + r.status + ')。请先刷新页面重新登录后再试')
        }
      } catch {
        alert('网络错误，请检查网络连接后重试')
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function save() {
    await fetch('/api/admin/contact', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('admin_token') }, body: JSON.stringify(data) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  const fields: { key: string; label: string }[] = [
    { key: 'company', label: '公司名称' },
    { key: 'phone', label: '联系电话' },
    { key: 'csPhone', label: '客服电话（悬浮按钮使用）' },
    { key: 'wechat', label: '微信' },
    { key: 'email', label: '邮箱' },
    { key: 'address', label: '地址' },
  ]
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>公司信息</h2>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', maxWidth: 600 }}>
        <div style={{ marginBottom: 20, padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>微信二维码</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 10px' }}>上传后将在网站底部和联系页面展示</p>

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleQrUpload(f) }} />

          {!data.wechatQr && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #2563EB', background: '#EFF6FF', color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? '上传中...' : '选择图片上传'}
            </button>
          )}

          {data.wechatQr && (
            <div>
              <img src={data.wechatQr} alt="微信二维码" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #2563EB', background: '#EFF6FF', color: '#2563EB', fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? '替换中...' : '替换'}
                </button>
                <button onClick={() => setData(prev => ({...prev, wechatQr: ''}))}
                  style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>删除</button>
              </div>
            </div>
          )}
        </div>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 4 }}>{f.label}</label>
            <input value={data[f.key] || ''} onChange={e => setData(d => ({...d, [f.key]: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        ))}
        <button onClick={save} style={{ padding: '10px 32px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saved ? '\u2713 已保存' : '保存'}</button>
      </div>
    </div>
  )
}

function InquiriesTab() {
  const [inquiries, setInquiries] = useState<any[]>([])
  useEffect(() => { fetch('/api/admin/inquiries').then(r => r.json()).then(setInquiries) }, [])
  if (inquiries.length === 0) return <div><h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>询盘记录</h2><p style={{ color: '#94A3B8' }}>暂无询盘记录。</p></div>
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>询盘记录</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ background: '#F1F5F9' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>时间</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>姓名</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>电话</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>公司</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>产品</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>需求</th>
          </tr></thead>
          <tbody>
            {inquiries.map((q: any, i: number) => (
              <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 12 }}>{new Date(q.createdAt).toLocaleString('zh-CN')}</td>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{q.name}</td>
                <td style={{ padding: '10px 14px' }}>{q.phone}</td>
                <td style={{ padding: '10px 14px', color: '#64748B' }}>{q.company || '-'}</td>
                <td style={{ padding: '10px 14px' }}><span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{q.product}</span></td>
                <td style={{ padding: '10px 14px', color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

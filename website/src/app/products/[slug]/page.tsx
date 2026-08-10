"use client"
/* eslint-disable @next/next/no-img-element */
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Container from "@/components/ui/Container"

export default function ProductDetail() {
  const params = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then((products) => {
      setProduct(products.find((x: any) => x.id === params.slug) || null)
      setLoading(false)
    })
  }, [params.slug])

  if (loading) return <div><Header /><main className="pt-24"><Container><p className="py-20">加载中...</p></Container></main><Footer /></div>
  if (!product) return <div><Header /><main className="pt-24"><Container><div className="text-center py-20"><h1 className="text-2xl font-bold text-navy-500">产品未找到</h1><Link href="/" className="btn-primary inline-flex mt-6">返回首页</Link></div></Container></main><Footer /></div>

  const specs = product.specs || { "规格": "按需定制", "起订量": "单规格100平方", "交期": "约6天" }
  const applications = product.applications || ["电商", "工业", "物流"]

  return (
    <>
      <Header />
      <main className="pt-24">
        <section className="bg-navy-500 py-16 md:py-20">
          <Container>
            <Link href="/#products" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6">
              ← 返回产品列表
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{product.name}</h1>
                <p className="mt-4 text-lg text-white/60 leading-relaxed">{product.desc}</p>
                <div className="mt-8"><Link href="/contact" className="btn-primary text-base px-8 py-3.5">立即询价</Link></div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={product.image} alt={product.name} className="w-full aspect-[4/3] object-cover" />
              </motion.div>
            </div>
          </Container>
        </section>

        <section className="section-padding">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-navy-500 mb-6">规格参数</h2>
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(specs).map(([key, val], i) => (
                        <tr key={key} className={i % 2 === 0 ? "bg-surface" : "bg-white"}>
                          <td className="px-6 py-4 text-sm font-semibold text-navy-500 w-28">{key}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-500 mb-6">适用行业</h2>
                <div className="flex flex-wrap gap-2">
                  {applications.map((a: string) => (
                    <span key={a} className="px-4 py-2 rounded-lg bg-tech-blue/5 text-tech-blue text-sm font-medium">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-surface section-padding">
          <Container className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-navy-500 mb-4">需要定制{product.name}？</h2>
            <p className="text-gray-500 mb-8">请联系我们，获取专业报价和技术方案。</p>
            <Link href="/contact" className="btn-primary">立即询价</Link>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}

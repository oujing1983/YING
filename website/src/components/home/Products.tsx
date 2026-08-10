"use client"
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Container from "@/components/ui/Container"
import SectionTitle from "@/components/ui/SectionTitle"
import { useSite } from "@/components/SiteProvider"

const fallback = [
  { id: "carton", name: "纸箱", desc: "三层、五层瓦楞纸箱，按需定制尺寸、厚度、材质，支持定制印刷。", image: "https://images.unsplash.com/photo-1542751110-97427f03a806?w=600&q=80" },
  { id: "bubble-bag", name: "气泡袋", desc: "轻便缓冲，适合电商、小家电、玻璃制品发货，可做自粘口、防静电袋。", image: "https://images.unsplash.com/photo-1602615576773-70a68b5b3c26?w=600&q=80" },
  { id: "epe-bag", name: "珍珠棉袋", desc: "EPE珍珠棉柔韧防震，适合表面防刮和缓冲保护，可按尺寸热合成袋。", image: "https://images.unsplash.com/photo-1620793839769-4d2d1c845a04?w=600&q=80" },
  { id: "epe-foam", name: "珍珠棉异形件", desc: "按产品结构开槽、冲型、粘合，适合精密件、仪器、电子产品内托防护。", image: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=600&q=80" },
]

export default function Products() {
  const [products, setProducts] = useState(fallback);
  const site = useSite();
  useEffect(() => {
    fetch('/api/public/products').then(r => r.json()).then(data => { if (Array.isArray(data) && data.length > 0) setProducts(data) }).catch(() => {});
  }, []);
  return (
    <section id="products" className="section-padding bg-white">
      <Container>
        <SectionTitle eyebrow={site.productsEyebrow || "产品中心"} title={site.productsTitle || "主营产品"} description={site.productsDesc || "四大核心包装产品，全部支持按需定制，满足不同行业需求。"} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product: any, i: number) => (
            <motion.div key={product.id || i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Link href={"/products/" + (product.id || "").toLowerCase()} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-tech-blue/20 hover:shadow-xl hover:shadow-tech-blue/5 transition-all duration-500">
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy-500 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{product.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-tech-blue group-hover:gap-2.5 transition-all">了解详情 <ArrowRight size={14} /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

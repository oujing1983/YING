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
  { id: "carton", name: "纸箱", desc: "三层、五层瓦楞纸箱，按需定制尺寸、厚度、材质，支持定制印刷。", image: "/products/carton.jpg" },
  { id: "epe-foam", name: "珍珠棉", desc: "按产品结构开槽、冲型、粘合，适合精密件、仪器、电子产品内托防护。", image: "/products/epe-foam.png" },
  { id: "epe-bag", name: "珍珠棉袋", desc: "EPE珍珠棉柔韧防震，适合表面防刮和缓冲保护，可按尺寸热合成袋。", image: "/products/epe-bag.jpg" },
  { id: "bubble-bag", name: "气泡袋", desc: "轻便缓冲，适合电商、小家电、玻璃制品发货，可做自粘口、防静电袋。", image: "/products/bubble-bag.png" },
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
        <SectionTitle eyebrow={site.productsEyebrow} title={site.productsTitle} description={site.productsDesc} centered={false} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: any, i: number) => (
            <motion.div key={product.id || i} className="h-full" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Link href={"/products/" + (product.id || "").toLowerCase()} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-[border-color,box-shadow] duration-300 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/5">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                  <div><h3 className="mb-2 text-lg font-bold text-navy-500">{product.name}</h3><p className="text-sm leading-6 text-slate-500">{product.desc}</p></div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tech-blue">了解详情 <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

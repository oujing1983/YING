"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSite } from "@/components/SiteProvider";

export default function Hero() {
  const site = useSite();
  const slides = site.carouselImages?.length ? site.carouselImages : [{
    image: site.heroBgImage,
    title: site.heroTitle,
    subtitle: site.heroSubtitle,
  }];
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const slide = slides[active] || slides[0];

  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden bg-navy-500">
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${slide.image || site.heroBgImage || '/assets/logo.jpg'})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-500/95 via-navy-500/80 to-navy-500/60" />
      <div className="relative container-wide pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-2xl">
          <span className="inline-block text-xs font-semibold text-tech-light uppercase tracking-[0.2em] mb-5">{site.heroEyebrow || "至微包装 · ZW PACK"}</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
            {slide.title || site.heroTitle || "一站式包装解决方案"}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
            {slide.subtitle || site.heroSubtitle || "专注纸箱、气泡袋、珍珠棉包装产品定制，为客户提供高品质包装解决方案。"}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {slide.primaryUrl ? <a href={slide.primaryUrl} target={slide.external ? "_blank" : undefined} rel={slide.external ? "noopener noreferrer" : undefined} className="btn-primary text-base px-8 py-3.5">{slide.primaryLabel || "了解更多"}</a> : <Link href="/contact" className="btn-primary text-base px-8 py-3.5">立即询价</Link>}
            {!slide.external && <Link href="/#products" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-white border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all duration-300 text-base">查看产品</Link>}
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
      {slides.length > 1 && (
        <div className="absolute bottom-8 right-5 md:right-10 z-20 flex items-center gap-3 rounded-full border border-white/20 bg-black/25 px-3 py-2 backdrop-blur-md">
          <button type="button" aria-label="上一张轮播图" onClick={() => setActive((active - 1 + slides.length) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"><ChevronLeft size={20} /></button>
          <span className="min-w-12 text-center text-sm font-semibold tabular-nums text-white">{active + 1} / {slides.length}</span>
          <button type="button" aria-label="下一张轮播图" onClick={() => setActive((active + 1) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"><ChevronRight size={20} /></button>
        </div>
      )}
    </section>
  );
}

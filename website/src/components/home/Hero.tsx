"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const slide = slides[active] || slides[0];

  return (
    <section id="top" className="relative flex min-h-[100dvh] items-center overflow-hidden bg-[#0b1830]">
      <AnimatePresence mode="wait">
        <motion.div key={slide.image || active} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} className="absolute inset-y-0 right-0 w-full bg-cover bg-center md:w-[62%]" style={{ backgroundImage: slide.image || site.heroBgImage ? `url(${slide.image || site.heroBgImage})` : undefined }} />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b1830_0%,rgba(11,24,48,.97)_42%,rgba(11,24,48,.58)_72%,rgba(11,24,48,.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0b1830]/70 to-transparent" />
      <div className="relative container-wide pb-24 pt-24 md:pb-20">
        <AnimatePresence mode="wait">
        <motion.div key={slide.title || active} initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-[640px]">
          <span className="mb-5 inline-block text-[18px] font-semibold leading-[30px] tracking-[0.08em] text-blue-300 md:text-[22px]">{site.heroEyebrow}</span>
          <h1 className="max-w-[12ch] text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
            {slide.title ?? site.heroTitle}
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-7 text-slate-300 md:text-lg">
            {slide.subtitle ?? site.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {slide.primaryUrl ? <a href={slide.primaryUrl} target={slide.external ? "_blank" : undefined} rel={slide.external ? "noopener noreferrer" : undefined} className="btn-primary text-base px-8 py-3.5">{slide.primaryLabel || "了解更多"}</a> : <Link href="/contact" className="btn-primary text-base px-8 py-3.5">立即询价</Link>}
            {!slide.external && <Link href="/#products" className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]">查看产品</Link>}
          </div>
        </motion.div>
        </AnimatePresence>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-7 right-4 z-20 flex items-center gap-3 rounded-full border border-white/15 bg-[#081224]/85 px-3 py-2 shadow-lg shadow-black/10 md:bottom-10 md:right-10">
          <button type="button" aria-label="上一张轮播图" onClick={() => setActive((active - 1 + slides.length) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"><ChevronLeft size={20} /></button>
          <span className="min-w-12 text-center text-sm font-semibold tabular-nums text-white">{active + 1} / {slides.length}</span>
          <button type="button" aria-label="下一张轮播图" onClick={() => setActive((active + 1) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"><ChevronRight size={20} /></button>
        </div>
      )}
    </section>
  );
}

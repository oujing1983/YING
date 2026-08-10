"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import Container from "@/components/ui/Container";
import SectionTitle from "@/components/ui/SectionTitle";

const fallbackImgs = [
  { src: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&q=80", label: "工厂外景" },
  { src: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800&q=80", label: "生产线" },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80", label: "仓储" },
  { src: "https://images.unsplash.com/photo-1576765608866-5b51046452be?w=800&q=80", label: "发货" },
];

const stats = [
  { label: "年产量", value: "5000万+" },
  { label: "服务客户", value: "1000+" },
  { label: "交期", value: "约6天" },
  { label: "起订量", value: "100㎡" },
];

export default function Factory() {
  const site2 = useSite();
  const images = site2.factoryImages?.length ? site2.factoryImages : fallbackImgs;

  return (
    <section id="factory" className="section-padding bg-white">
      <Container>
        <SectionTitle eyebrow={site2.factoryEyebrow} title={site2.factoryTitle} description={site2.factoryDesc} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-surface border border-gray-100">
              <div className="text-3xl md:text-4xl font-bold text-tech-blue mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group overflow-hidden rounded-2xl aspect-[4/3] bg-gray-100">
              <img src={img.src} alt={img.label || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">{img.label || ''}</span>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

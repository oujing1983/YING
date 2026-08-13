"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Box, ChevronLeft, ChevronRight, Layers3 } from "lucide-react";

const tools = [
  {
    eyebrow: "纸箱结构",
    title: "在线纸箱刀版预览",
    description: "输入长、宽、高，实时查看 FEFCO 0201 理论展开结构、尺寸标注与计价面积，并导出 SVG 或 PDF。",
    note: "适合前期结构沟通与询价，生产尺寸仍需人工确认。",
    href: "/tools/carton-dieline",
    action: "打开纸箱刀版",
    Icon: Box,
    preview: "/tools/carton-dieline/index.html",
    accent: "blue",
  },
  {
    eyebrow: "珍珠棉结构",
    title: "珍珠棉分层设计",
    description: "绘制矩形、圆形、多边形与曲线轮廓，标记真实尺寸，并同步查看珍珠棉粘合层的三维结构。",
    note: "当前为几何验证版，不包含刀缝、压缩与粘合损失补偿。",
    href: "/tools/epe-designer",
    action: "打开珍珠棉设计",
    Icon: Layers3,
    preview: "/tools/epe-designer/index.html",
    accent: "amber",
  },
] as const;

export default function ToolsCarousel() {
  const [active, setActive] = useState(0);
  const tool = tools[active];
  const Icon = tool.Icon;
  const previous = () => setActive((active - 1 + tools.length) % tools.length);
  const next = () => setActive((active + 1) % tools.length);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <section aria-roledescription="carousel" aria-label="在线包装工具" className="relative overflow-hidden rounded-[2rem] bg-[#0b1830] text-white shadow-2xl shadow-slate-950/15">
      <div className="absolute inset-0 opacity-70" aria-hidden="true">
        <div className={`absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl ${tool.accent === "blue" ? "bg-blue-500/35" : "bg-amber-400/30"}`} />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <div className="relative grid min-h-[480px] gap-8 p-7 md:grid-cols-[1.05fr_.95fr] md:p-12 lg:p-16">
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-blue-300">{tool.eyebrow}</span>
            <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{tool.title}</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{tool.description}</p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">{tool.note}</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href={tool.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/10 transition-transform active:scale-[0.98]">
              {tool.action}<ArrowRight size={17} />
            </Link>
            <span className="text-xs text-slate-400">无需安装，浏览器直接使用</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/20">
            <iframe src={tool.preview} title={`${tool.title}页面预览`} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[900px] w-[1280px] origin-top-left scale-[.4] border-0" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-white/10 px-7 py-5 md:px-12">
        <div className="flex items-center gap-2">
          {tools.map((item, index) => (
            <button key={item.title} onClick={() => setActive(index)} aria-label={`查看${item.title}`} aria-current={index === active}
              className={`h-2.5 rounded-full transition-[width,background-color] ${index === active ? "w-8 bg-white" : "w-2.5 bg-white/30 hover:bg-white/60"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={previous} aria-label="上一个工具" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 active:bg-white/15"><ChevronLeft size={19} /></button>
          <button onClick={next} aria-label="下一个工具" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 active:bg-white/15"><ChevronRight size={19} /></button>
        </div>
      </div>
    </section>
  );
}

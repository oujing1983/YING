"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSite } from "@/components/SiteProvider";

const navLinks = [
  { label: "首页", href: "/" },
  { label: "产品中心", href: "/#products" },
  { label: "在线刀版", href: "/tools/carton-dieline" },
  { label: "关于我们", href: "/about" },
  { label: "联系我们", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const site = useSite();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100" : "bg-transparent"
    }`}>
      <div className="container-wide flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-3 group">
          {site.logoImage ? (
            <img src={site.logoImage} alt="Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />
          ) : (
            <span className="w-10 h-10 rounded-xl bg-tech-blue flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
              {site.logo || "ZW"}
            </span>
          )}
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold text-navy-500 leading-tight">至微包装</span>
            <span className="block text-xs text-gray-400 font-medium">ZW PACK</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-navy-500 rounded-lg hover:bg-gray-50 transition-all">{link.label}</Link>
          ))}
          <Link href="/contact" className="ml-4 btn-primary text-sm py-2 px-5">立即询价</Link>
        </nav>
        <button className="md:hidden p-2 text-navy-500" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="container-wide py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-navy-500 hover:bg-gray-50 rounded-lg transition-all">{link.label}</Link>
              ))}
              <Link href="/contact" onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-white bg-tech-blue rounded-lg text-center mt-3">立即询价</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

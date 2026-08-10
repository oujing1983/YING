"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Products from "@/components/home/Products";
import Advantages from "@/components/home/Advantages";
import Industries from "@/components/home/Industries";
import Process from "@/components/home/Process";
import Factory from "@/components/home/Factory";
import Contact from "@/components/home/Contact";
import { useSite } from "@/components/SiteProvider";

export default function Home() {
  const toggles = useSite();

  return (
    <>
      <Header />
      <main>
        {toggles.showHero !== false && <Hero />}
        {toggles.showProducts !== false && <Products />}
        {toggles.showAdvantages !== false && <Advantages />}
        {toggles.showIndustries !== false && <Industries />}
        {toggles.showProcess !== false && <Process />}
        {toggles.showFactory !== false && <Factory />}
        {toggles.showContact !== false && <Contact />}
      </main>
      <Footer />
    </>
  );
}

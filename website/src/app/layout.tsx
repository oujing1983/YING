import type { Metadata } from "next";
import "./globals.css";
import { readData } from "@/lib/data";
import { SiteProvider } from "@/components/SiteProvider";
import { getSiteConfig } from "@/lib/siteDefaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site: any = getSiteConfig()
  const title = site.seoTitle || '至微包装 | 一站式包装解决方案'
  const description = site.seoDescription || '至微包装专注纸箱、气泡袋、珍珠棉包装产品定制，为客户提供高品质包装解决方案。'
  return {
    title,
    description,
    keywords: site.seoKeywords || '',
    openGraph: { title, description, type: "website", locale: "zh_CN" },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site: any = getSiteConfig()
  const carousel: any[] = readData('carousel', [])
  site.carouselImages = carousel
  const baiduId = site.baiduAnalytics || ''
  const headScript = site.headScript || ''

  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {baiduId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?${baiduId}";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
`.trim()
            }}
          />
        )}
        {headScript && (
          <script
            dangerouslySetInnerHTML={{ __html: headScript }}
          />
        )}
      </head>
      <body><SiteProvider site={site}>{children}</SiteProvider></body>
    </html>
  );
}

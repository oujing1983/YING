import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Lead-AI | AI 获客系统',
  description: 'AI 驱动的包装行业获客系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
        </ToastProvider>
      </body>
    </html>
  );
}

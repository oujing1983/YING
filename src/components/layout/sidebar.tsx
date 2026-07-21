'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Upload,
  Brain,
  MessageSquare,
  Kanban,
  Bell,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: '销售看板', icon: LayoutDashboard },
  { href: '/enterprises', label: '企业数据库', icon: Building2 },
  { href: '/enterprises/import', label: '导入企业', icon: Upload },
  { href: '/screening', label: 'AI 筛选中心', icon: Brain },
  { href: '/crm', label: '客户跟进', icon: Kanban },
  { href: '/crm/reminders', label: '提醒列表', icon: Bell },
  { href: '/letters', label: '开发信', icon: MessageSquare },
  { href: '/templates', label: '模板管理', icon: FileText },
  { href: '/settings', label: '系统设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinks = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">📦 Lead-AI</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI 获客系统</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navLinks}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
          <span>包装行业专用</span>
          <span>v{process.env.NEXT_PUBLIC_VERSION || '1.0.0'}</span>
        </div>
      </aside>
    </>
  );
}

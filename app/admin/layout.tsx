// app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, Users, Layers, FileText, Shield, Sparkles } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Equipment', href: '/admin/equipment', icon: Wrench },
    { name: 'Category Assignments', href: '/admin/categories', icon: Layers },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Reports & Logs', href: '/admin/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950/20 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Sleek Enterprise Top Nav Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 shadow-lg shadow-slate-950/20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">PPM OPS</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">Enterprise Asset & Audit Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/admin');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden md:inline tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main View Area */}
      <main className="bg-slate-50/60 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
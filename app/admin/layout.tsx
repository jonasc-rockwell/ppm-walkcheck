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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Mesh Gradient (Makes Glassmorphism Effect Visible) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-60 left-1/3 w-[600px] h-[400px] bg-sky-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Glassmorphic Floating Top Nav Bar */}
      <header className="sticky top-0 z-50 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border border-white/10 rounded-2xl shadow-2xl shadow-slate-950/50 px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/30">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">PPM OPS</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">Enterprise Asset & Audit Portal</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/admin');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-1 ring-white/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
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

      {/* Main View Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
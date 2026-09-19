// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Wrench,
  Users,
  Layers,
  FileText,
  Shield,
  Sparkles,
  LogOut,
  Eye,
  User,
  Building,
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'root' | 'admin' | 'rlc' | 'contractor';
  company_name?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [previewRole, setPreviewRole] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setPreviewRole(data.role);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Determine effective role (uses root override preview if set)
  const activeRole = profile?.role === 'root' ? previewRole || 'root' : profile?.role;

  const navItems = [
    { name: 'Equipment', href: '/admin/equipment', icon: Wrench, roles: ['root', 'admin', 'rlc'] },
    { name: 'Category Assignments', href: '/admin/categories', icon: Layers, roles: ['root', 'admin', 'rlc'] },
    { name: 'User Management', href: '/admin/users', icon: Users, roles: ['root', 'admin'] },
    { name: 'Reports & Logs', href: '/admin/reports', icon: FileText, roles: ['root', 'admin', 'rlc'] },
  ];

  // Filter menu items based on active preview role
  const visibleNavItems = navItems.filter((item) =>
    activeRole ? item.roles.includes(activeRole) : true
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased relative overflow-x-hidden">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Floating Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand & Logged-In User Profile */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
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
                <p className="text-[10px] font-medium text-slate-400">Enterprise Facility Portal</p>
              </div>
            </div>

            {/* Profile Info Badge */}
            {profile && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {profile.full_name || 'Logged User'}
                    <span className="px-1.5 py-0.2 uppercase text-[9px] font-extrabold rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
                      {profile.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-500" /> {profile.company_name || 'Internal'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-1 ring-white/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: Root Role Switcher & Sign Out */}
          <div className="flex items-center gap-2">
            {/* Root Role Impersonation Dropdown */}
            {profile?.role === 'root' && (
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1.5 rounded-xl text-xs">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-300 hidden xl:inline">View As:</span>
                <select
                  value={previewRole || 'root'}
                  onChange={(e) => setPreviewRole(e.target.value)}
                  className="bg-slate-800 text-purple-200 text-xs font-bold rounded-lg px-2 py-0.5 outline-none border border-purple-500/30 cursor-pointer"
                >
                  <option value="root">Root (Full)</option>
                  <option value="admin">Admin</option>
                  <option value="rlc">RLC</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Log out of system"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main View Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
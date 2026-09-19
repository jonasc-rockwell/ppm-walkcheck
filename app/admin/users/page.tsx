// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Search,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'root' | 'admin' | 'rlc' | 'contractor';
  company_name?: string;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Invite Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'admin' | 'rlc' | 'contractor'>('contractor');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUsersAndRole();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.company_name?.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsersAndRole = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setCurrentUserRole(currentProfile?.role || 'contractor');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profiles) {
      setUsers(profiles);
      setFilteredUsers(profiles);
    }
    setLoading(false);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('profiles').insert([
        {
          full_name: fullName,
          email,
          company_name: role === 'contractor' ? companyName : 'Internal Team',
          role,
        },
      ]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Successfully registered profile for ${fullName} (${role.toUpperCase()})`,
      });
      setFullName('');
      setEmail('');
      setCompanyName('');
      setRole('contractor');
      fetchUsersAndRole();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!['root', 'admin'].includes(currentUserRole || '')) return;

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

    if (error) {
      alert(`Failed to update role: ${error.message}`);
    } else {
      fetchUsersAndRole();
    }
  };

  const canManageUsers = ['root', 'admin'].includes(currentUserRole || '');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading user directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-1">
          <Users className="w-3.5 h-3.5" /> Access & Directory
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          User Management & Permissions
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Manage internal personnel access rights, invite facility coordinators, and register contractor accounts.
        </p>
      </div>

      {!canManageUsers && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-300 text-xs font-medium backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            RLC role has read-only access to user directory. Role modifications and user registration require <strong>Root</strong> or <strong>Admin</strong> privileges.
          </span>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold backdrop-blur-md ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Form */}
        {canManageUsers && (
          <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" /> Register / Invite User
            </h2>

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="contractor">Contractor (Field Walkchecks)</option>
                  <option value="rlc">RLC (Facility Coordinator)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              {role === 'contractor' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Maintenance Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? 'Creating Profile...' : 'Add User Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: Users Table */}
        <div
          className={`${
            canManageUsers ? 'lg:col-span-2' : 'lg:col-span-3'
          } bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <span className="text-xs font-bold text-slate-400">
              Total Profiles: <span className="text-white font-mono">{filteredUsers.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Organization</th>
                  {canManageUsers && <th className="p-3 text-right">Role Control</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No user profiles match search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{u.full_name || 'Unnamed User'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 font-bold rounded-lg text-[10px] uppercase border ${
                            u.role === 'root'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : u.role === 'rlc'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{u.company_name || 'Internal Team'}</td>
                      {canManageUsers && (
                        <td className="p-3 text-right">
                          {u.role !== 'root' ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                              <option value="contractor">contractor</option>
                              <option value="rlc">rlc</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-semibold italic">
                              Protected Root
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
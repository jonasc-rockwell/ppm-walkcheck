// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, UserPlus, Shield, Building, Mail, Search, CheckCircle, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // 1. Fetch logged-in user role
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const myRole = currentProfile?.role || 'contractor';
    setCurrentUserRole(myRole);

    // 2. Fetch all user profiles
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
      // Create user record or insert profile invitation
      const { error } = await supabase.from('profiles').insert([
        {
          full_name: fullName,
          email,
          company_name: role === 'contractor' ? companyName : 'Internal Team',
          role,
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: `Successfully registered profile for ${fullName} (${role.toUpperCase()})` });
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

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert(`Failed to update role: ${error.message}`);
    } else {
      fetchUsersAndRole();
    }
  };

  const canManageUsers = ['root', 'admin'].includes(currentUserRole || '');

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading user directory...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Management & Permissions</h1>
            <p className="text-xs text-slate-500">Manage internal personnel roles and third-party contractor accounts</p>
          </div>
        </div>
      </div>

      {!canManageUsers && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            RLC role has view-only access to user directory. Role modifications and user invitations require <strong>Root</strong> or <strong>Admin</strong> privileges.
          </span>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Invite / Register Form */}
        {canManageUsers && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" /> Register / Invite User
            </h2>

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="contractor">Contractor (Field Walkchecks)</option>
                  <option value="rlc">RLC (Facility Coordinator)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              {role === 'contractor' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contractor Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Maintenance Services"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? 'Creating Profile...' : 'Add User Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Right Column: User Directory Table */}
        <div className={`${canManageUsers ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Users: <span className="text-slate-900 font-bold">{filteredUsers.length}</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Company / Dept</th>
                  {canManageUsers && <th className="p-3 text-right">Role Control</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.full_name || 'Unnamed User'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 font-bold rounded-lg text-[10px] uppercase border ${
                          u.role === 'root'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : u.role === 'rlc'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {u.company_name || 'Internal Team'}
                      </td>
                      {canManageUsers && (
                        <td className="p-3 text-right">
                          {u.role !== 'root' ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="contractor">contractor</option>
                              <option value="rlc">rlc</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold italic">Protected Root</span>
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
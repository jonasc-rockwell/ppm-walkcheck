'use client';

import { useState } from 'react';
import { UserPlus, Shield, Building, Mail } from 'lucide-react';

export default function RootAdminPanel() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'rlc' | 'contractor'>('contractor');
  const [company, setCompany] = useState('');
  const [assignedEquipmentIds, setAssignedEquipmentIds] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: false });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: false });

    // Parse comma-separated equipment IDs (e.g. "1, 2, 5")
    const eqIds = assignedEquipmentIds
      ? assignedEquipmentIds.split(',').map((id) => parseInt(id.trim()))
      : [];

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          role,
          company: role === 'rlc' ? 'RLC Organic' : company,
          assignedEquipmentIds: eqIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send invite');

      setStatus({ loading: false, message: 'Invite email sent successfully!', error: false });
      setEmail('');
      setFullName('');
      setCompany('');
      setAssignedEquipmentIds('');
    } catch (err: any) {
      setStatus({ loading: false, message: err.message, error: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <Shield className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Root Admin Panel</h1>
          <p className="text-xs text-slate-400">User Onboarding & System Access Control</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="bg-slate-800 p-6 rounded-xl space-y-4 border border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" /> Send Account Invitation
        </h2>

        {status.message && (
          <div className={`p-3 rounded-lg text-sm ${status.error ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'}`}>
            {status.message}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-9 text-sm focus:outline-none focus:border-blue-500"
              placeholder="technician@contractor.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Assign System Role</label>
          <select
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="contractor">Contractor (Technician / Engineer)</option>
            <option value="rlc">RLC (Organic Supervisor / Boss)</option>
          </select>
        </div>

        {role === 'contractor' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contractor Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-9 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="KONE Elevators / Trane Chillers"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Assigned Equipment IDs (Comma separated)
              </label>
              <input
                type="text"
                value={assignedEquipmentIds}
                onChange={(e) => setAssignedEquipmentIds(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                placeholder="1, 2, 5, 8"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter equipment ID numbers from the equipment database that this contractor is allowed to see.
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={status.loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {status.loading ? 'Sending Invite Link...' : 'Send Magic Link Invite'}
        </button>
      </form>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { UserPlus, Shield, CheckCircle, AlertCircle, Key, Layers } from 'lucide-react';

const CATEGORIES = ['HVAC', 'Plumbing', 'Electrical', 'FDAS'];

export default function RootDashboard() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<'root' | 'rlc' | 'contractor'>('rlc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; tempPass?: string } | null>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (role === 'contractor' && selectedCategories.length === 0) {
      setMessage({ type: 'error', text: 'Please assign at least one category to the contractor.' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          company,
          role,
          assignedCategories: role === 'contractor' ? selectedCategories : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setMessage({
        type: 'success',
        text: `Account created for ${fullName}!`,
        tempPass: data.tempPassword,
      });

      setEmail('');
      setFullName('');
      setCompany('');
      setSelectedCategories([]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Root User Management</h1>
          <p className="text-xs text-slate-500">Create new user accounts and configure contractor category privileges.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
          {message.tempPass && (
            <div className="mt-2 p-3 bg-white border border-emerald-300 rounded-lg flex items-center justify-between">
              <span className="text-slate-600 font-medium">Temporary Password:</span>
              <code className="bg-slate-100 px-2.5 py-1 rounded text-slate-900 font-mono text-sm font-bold select-all">
                {message.tempPass}
              </code>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleInvite} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="user@domain.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Department</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="RLC / Contractor Firm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="rlc">RLC Supervisor / Manager</option>
              <option value="contractor">Contractor Technician</option>
              <option value="root">Root Administrator</option>
            </select>
          </div>
        </div>

        {/* Category Checkboxes: Only display when Contractor is selected */}
        {role === 'contractor' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Assigned Categories</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">Select which technical domains this contractor technician can access.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? 'Creating Account...' : 'Generate Account & Issue Temporary Key'}
        </button>
      </form>
    </div>
  );
}
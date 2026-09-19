// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Layers, User, Check, Save, AlertCircle, RefreshCw, Shield } from 'lucide-react';

interface Contractor {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
}

const CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Mechanical'];

export default function CategoryAssignmentsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setUserRole(profile?.role || 'contractor');

    const { data: contractorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, email')
      .eq('role', 'contractor')
      .order('full_name');

    if (contractorProfiles && contractorProfiles.length > 0) {
      setContractors(contractorProfiles);
      setSelectedContractorId(contractorProfiles[0].id);
      fetchCategoryAssignments(contractorProfiles[0].id);
    } else {
      setLoading(false);
    }
  };

  const fetchCategoryAssignments = async (userId: string) => {
    setLoading(true);
    setMessage(null);

    const { data } = await supabase
      .from('contractor_category_assignments')
      .select('category_name')
      .eq('user_id', userId);

    if (data) {
      setAssignedCategories(data.map((c) => c.category_name));
    } else {
      setAssignedCategories([]);
    }
    setLoading(false);
  };

  const handleContractorChange = (userId: string) => {
    setSelectedContractorId(userId);
    fetchCategoryAssignments(userId);
  };

  const toggleCategory = (cat: string) => {
    if (assignedCategories.includes(cat)) {
      setAssignedCategories(assignedCategories.filter((c) => c !== cat));
    } else {
      setAssignedCategories([...assignedCategories, cat]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedContractorId) return;
    setSaving(true);
    setMessage(null);

    try {
      await supabase
        .from('contractor_category_assignments')
        .delete()
        .eq('user_id', selectedContractorId);

      if (assignedCategories.length > 0) {
        const payload = assignedCategories.map((cat) => ({
          user_id: selectedContractorId,
          category_name: cat,
        }));

        await supabase.from('contractor_category_assignments').insert(payload);
      }

      setMessage({ type: 'success', text: 'Category mappings updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update category mappings.' });
    } finally {
      setSaving(false);
    }
  };

  const canManageCategories = ['root', 'admin', 'rlc'].includes(userRole || '');

  if (loading && contractors.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading contractor category mapping...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-1">
          <Layers className="w-3.5 h-3.5" /> Domain Assignment
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Contractor Category Mapping</h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Assign inspection domains to contractor personnel. Contractors only see equipment matching enabled domains.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold backdrop-blur-md ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contractor Selection Pane */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" /> Select Contractor
          </h2>

          <div className="space-y-2">
            {contractors.map((contractor) => (
              <button
                key={contractor.id}
                onClick={() => handleContractorChange(contractor.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all text-xs flex items-center justify-between ${
                  selectedContractorId === contractor.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-bold">{contractor.full_name}</div>
                  <div className="text-[11px] text-slate-500">{contractor.company_name || 'Contractor'}</div>
                </div>
                {selectedContractorId === contractor.id && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Domain Category Toggles */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Operational Domains</h2>
            <p className="text-xs text-slate-400">Toggle domain permissions for the selected contractor.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const isChecked = assignedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  disabled={!canManageCategories}
                  onClick={() => toggleCategory(cat)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="text-xs font-bold">{cat}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isChecked ? 'bg-white border-white text-blue-600' : 'bg-slate-700 border-slate-600'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {canManageCategories && (
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSaveAssignments}
                disabled={saving || !selectedContractorId}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Mappings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
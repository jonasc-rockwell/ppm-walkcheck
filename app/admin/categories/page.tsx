// app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Layers, User, Check, Save, AlertCircle, RefreshCw } from 'lucide-react';

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

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role || 'contractor';
    setUserRole(role);

    // Fetch contractors list
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
      // 1. Clear existing assignments for this contractor
      const { error: deleteError } = await supabase
        .from('contractor_category_assignments')
        .delete()
        .eq('user_id', selectedContractorId);

      if (deleteError) throw deleteError;

      // 2. Insert new category assignments
      if (assignedCategories.length > 0) {
        const payload = assignedCategories.map((cat) => ({
          user_id: selectedContractorId,
          category_name: cat,
        }));

        const { error: insertError } = await supabase
          .from('contractor_category_assignments')
          .insert(payload);

        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'Category assignments updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update category assignments.' });
    } finally {
      setSaving(false);
    }
  };

  const canManageCategories = ['root', 'admin', 'rlc'].includes(userRole || '');

  if (loading && contractors.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading category assignments...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contractor Category Mapping</h1>
            <p className="text-xs text-slate-500">Assign operational inspection domains to third-party contractor personnel</p>
          </div>
        </div>
      </div>

      {!canManageCategories && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>You have read-only access to category assignments.</span>
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
        {/* Contractor Selection List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Select Contractor
          </h2>

          {contractors.length === 0 ? (
            <p className="text-xs text-slate-400">No contractors found. Invite a contractor in User Management first.</p>
          ) : (
            <div className="space-y-2">
              {contractors.map((contractor) => (
                <button
                  key={contractor.id}
                  onClick={() => handleContractorChange(contractor.id)}
                  className={`w-full p-3 rounded-xl text-left border transition-all text-xs flex items-center justify-between ${
                    selectedContractorId === contractor.id
                      ? 'bg-blue-50 border-blue-300 font-bold text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold">{contractor.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{contractor.company_name || 'Independent Contractor'}</div>
                  </div>
                  {selectedContractorId === contractor.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Domain Checkboxes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Domain Categories</h2>
            <p className="text-xs text-slate-500">
              The contractor will only see equipment matching checked categories in their mobile inspection portal.
            </p>
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{cat}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-white border-white text-blue-600' : 'bg-white border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {canManageCategories && (
            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveAssignments}
                disabled={saving || !selectedContractorId}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Category Assignments
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
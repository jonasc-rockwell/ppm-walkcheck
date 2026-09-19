// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wrench, Plus, Edit2, Trash2, Search, AlertCircle, Shield, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  category_name: string;
  location: string;
  status: string;
}

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredList, setFilteredList] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [equipmentCode, setEquipmentCode] = useState('');
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('HVAC');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkRoleAndFetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredList(equipmentList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        equipmentList.filter(
          (eq) =>
            eq.equipment_code.toLowerCase().includes(q) ||
            eq.name.toLowerCase().includes(q) ||
            eq.category_name.toLowerCase().includes(q) ||
            eq.location.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, equipmentList]);

  const checkRoleAndFetchData = async () => {
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
    fetchEquipment();
  };

  const fetchEquipment = async () => {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .order('equipment_code', { ascending: true });

    if (data) {
      setEquipmentList(data);
      setFilteredList(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditingId(eq.id);
      setEquipmentCode(eq.equipment_code);
      setName(eq.name);
      setCategoryName(eq.category_name);
      setLocation(eq.location);
    } else {
      setEditingId(null);
      setEquipmentCode('');
      setName('');
      setCategoryName('HVAC');
      setLocation('');
    }
    setIsModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      equipment_code: equipmentCode,
      name,
      category_name: categoryName,
      location,
    };

    if (editingId) {
      await supabase.from('equipment').update(payload).eq('id', editingId);
    } else {
      await supabase.from('equipment').insert([payload]);
    }

    setSubmitting(false);
    setIsModalOpen(false);
    fetchEquipment();
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment item?')) return;
    await supabase.from('equipment').delete().eq('id', id);
    fetchEquipment();
  };

  const canModifyEquipment = ['root', 'admin', 'rlc'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading equipment registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-2">
            <Wrench className="w-3.5 h-3.5" /> Facility Inventory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Equipment Registry</h1>
          <p className="text-xs text-slate-300 font-normal max-w-xl">
            Configure machinery assets, register serial tags, and set inspection categories across facilities.
          </p>
        </div>

        {canModifyEquipment && (
          <button
            onClick={() => handleOpenModal()}
            className="relative z-10 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Asset
          </button>
        )}
      </div>

      {/* Access Restriction Notice */}
      {!canModifyEquipment && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Read-only mode active. Contractor submission logs are located in the field walkcheck view.</span>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search equipment tag, name, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            {filteredList.length} Total Items
          </span>
        </div>
      </div>

      {/* Equipment Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Equipment Tag</th>
                <th className="p-4">Asset Name</th>
                <th className="p-4">Domain Category</th>
                <th className="p-4">Location / Zone</th>
                {canModifyEquipment && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canModifyEquipment ? 5 : 4} className="p-12 text-center text-slate-400 font-medium">
                    No equipment matches the search criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {eq.equipment_code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{eq.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] border border-slate-200/60 uppercase tracking-wide">
                        {eq.category_name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{eq.location}</td>
                    {canModifyEquipment && (
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(eq)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Edit Equipment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Update Equipment Item' : 'Register New Equipment'}
              </h2>
              <p className="text-xs text-slate-500">Provide machine identification tags and functional placement.</p>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Equipment Code Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HVAC-CH-01"
                  value={equipmentCode}
                  onChange={(e) => setEquipmentCode(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Equipment Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centrifugal Chiller Unit A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Domain Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                >
                  <option value="HVAC">HVAC</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location / Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement Level 2, Plant Room B"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  {submitting ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
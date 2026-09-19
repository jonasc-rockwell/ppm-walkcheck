// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wrench, Plus, Edit2, Trash2, Search, AlertCircle, SlidersHorizontal, Layers, MapPin } from 'lucide-react';

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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading equipment registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dark Glass Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-1">
            <Wrench className="w-3.5 h-3.5" /> Asset Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Equipment Inventory</h1>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            Configure machinery assets, register serial tags, and set operational categories across facilities.
          </p>
        </div>

        {canModifyEquipment && (
          <button
            onClick={() => handleOpenModal()}
            className="relative z-10 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Equipment
          </button>
        )}
      </div>

      {!canModifyEquipment && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-300 text-xs font-medium backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>Read-only permissions. Contractor submissions are executed in the mobile field view.</span>
        </div>
      )}

      {/* Filter Toolbar & Count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search code, name, domain, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-medium transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          Total Records: <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-white/5">{filteredList.length}</span>
        </div>
      </div>

      {/* Glassmorphic Table Container */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/60 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Equipment Tag</th>
                <th className="p-4">Name</th>
                <th className="p-4">Domain</th>
                <th className="p-4">Location</th>
                {canModifyEquipment && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canModifyEquipment ? 5 : 4} className="p-12 text-center text-slate-500 font-medium">
                    No equipment found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {eq.equipment_code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{eq.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] border border-white/10 uppercase tracking-wide">
                        {eq.category_name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {eq.location}
                    </td>
                    {canModifyEquipment && (
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(eq)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
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

      {/* Glassmorphic Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-white">
            <div>
              <h2 className="text-lg font-bold">{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h2>
              <p className="text-xs text-slate-400">Specify unique asset code, category domain, and location.</p>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Equipment Code Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HVAC-CH-01"
                  value={equipmentCode}
                  onChange={(e) => setEquipmentCode(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Equipment Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centrifugal Chiller Unit 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Domain Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                >
                  <option value="HVAC">HVAC</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Location Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plant Room B2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
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
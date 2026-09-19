// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wrench, Plus, Edit2, Trash2, Search, AlertCircle, SlidersHorizontal, MapPin, RefreshCw } from 'lucide-react';
import { useRole } from '../RoleContext';

interface Category {
  id: number;
  name: string;
}

interface Equipment {
  id: number;
  equipment_number: string;
  name: string;
  category_id?: number;
  subcategory_id?: number;
  location: string;
  qr_code?: string;
  created_at: string;
  categories?: { name: string } | null;
}

export default function EquipmentPage() {
  const { activeRole } = useRole();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredList, setFilteredList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [equipmentNumber, setEquipmentNumber] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Feedback Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredList(equipmentList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        equipmentList.filter(
          (eq) =>
            eq.equipment_number?.toLowerCase().includes(q) ||
            eq.name?.toLowerCase().includes(q) ||
            eq.location?.toLowerCase().includes(q) ||
            eq.categories?.name?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, equipmentList]);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMessage(null);

    // Fetch categories for dropdown selection
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (catData) setCategories(catData);

    // Fetch equipment inventory
    const { data: eqData, error: eqError } = await supabase
      .from('equipment')
      .select('*, categories(name)')
      .order('id', { ascending: false });

    if (eqError) {
      setErrorMessage(`Error fetching equipment: ${eqError.message}`);
    } else if (eqData) {
      setEquipmentList(eqData);
      setFilteredList(eqData);
    }

    setLoading(false);
  };

  const handleOpenModal = (eq?: Equipment) => {
    setErrorMessage(null);
    if (eq) {
      setEditingId(eq.id);
      setEquipmentNumber(eq.equipment_number || '');
      setName(eq.name || '');
      setCategoryId(eq.category_id || '');
      setLocation(eq.location || '');
    } else {
      setEditingId(null);
      setEquipmentNumber('');
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setLocation('');
    }
    setIsModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      equipment_number: equipmentNumber,
      name,
      category_id: categoryId ? Number(categoryId) : null,
      location,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('equipment').update(payload).eq('id', editingId);
        if (error) throw error;
        setSuccessMessage('Equipment updated successfully!');
      } else {
        const { error } = await supabase.from('equipment').insert([payload]);
        if (error) throw error;
        setSuccessMessage('New equipment item saved successfully!');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setErrorMessage(`Failed to save asset: ${err.message || 'Unknown database error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment item?')) return;
    setErrorMessage(null);

    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) {
      setErrorMessage(`Delete failed: ${error.message}`);
    } else {
      setSuccessMessage('Equipment item deleted.');
      fetchInitialData();
    }
  };

  const canModifyEquipment = ['root', 'admin', 'rlc'].includes(activeRole || '');

  if (loading && equipmentList.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading equipment inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-1">
            <Wrench className="w-3.5 h-3.5" /> Asset Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Equipment Inventory</h1>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            Configure facility machinery assets, register equipment tags, and link operational domains.
          </p>
        </div>

        {canModifyEquipment && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Equipment
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-xs font-bold backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-300 text-xs font-bold backdrop-blur-md">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">×</button>
        </div>
      )}

      {!canModifyEquipment && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-300 text-xs font-medium backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>Read-only mode active. Field walkcheck logs are managed in <code className="font-mono bg-slate-800 px-1 py-0.5 rounded">/main</code>.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search equipment number, name, domain, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40 font-medium"
          />
        </div>

        <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
          Total Records: <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-white/5">{filteredList.length}</span>
        </div>
      </div>

      {/* Equipment Inventory Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/60 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Equipment Number</th>
                <th className="p-4">Name</th>
                <th className="p-4">Domain Category</th>
                <th className="p-4">Location Zone</th>
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
                        {eq.equipment_number || `EQ-${eq.id}`}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{eq.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] border border-white/10 uppercase tracking-wide">
                        {eq.categories?.name || 'General'}
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

      {/* Edit / Add Asset Modal */}
      {isModalOpen && canModifyEquipment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-white">
            <div>
              <h2 className="text-lg font-bold">{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h2>
              <p className="text-xs text-slate-400">Provide equipment tag number, asset description, and location zone.</p>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Equipment Number / Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HVAC-CH-01"
                  value={equipmentNumber}
                  onChange={(e) => setEquipmentNumber(e.target.value)}
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
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                >
                  <option value="">Select Domain Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
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
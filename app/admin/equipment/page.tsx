// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Wrench, Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

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

    // Fetch user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role || 'contractor';
    setUserRole(role);

    // Fetch equipment data
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

  // Role permissions check
  const canModifyEquipment = ['root', 'admin', 'rlc'].includes(userRole || '');

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading equipment management...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment Inventory</h1>
            <p className="text-xs text-slate-500">Manage facility machinery and inspection items</p>
          </div>
        </div>

        {canModifyEquipment && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Equipment
          </button>
        )}
      </div>

      {/* Role Notice Banner */}
      {!canModifyEquipment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            You have read-only permissions for equipment list. Contractor logging is available under <code className="font-mono bg-amber-100 px-1 rounded">/main</code>.
          </span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search code, name, category, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Equipment: <span className="text-slate-900 font-bold">{filteredList.length}</span>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Code</th>
                <th className="p-4">Equipment Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                {canModifyEquipment && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canModifyEquipment ? 5 : 4} className="p-8 text-center text-slate-400">
                    No equipment records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{eq.equipment_code}</td>
                    <td className="p-4 font-bold text-slate-800">{eq.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[10px] border border-slate-200">
                        {eq.category_name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{eq.location}</td>
                    {canModifyEquipment && (
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(eq)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(eq.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* Add / Edit Equipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>

            <form onSubmit={handleSaveEquipment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Equipment Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HVAC-CH-01"
                  value={equipmentCode}
                  onChange={(e) => setEquipmentCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centrifugal Chiller Unit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Domain</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="HVAC">HVAC</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Fire Safety">Fire Safety</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement Plant Room B2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
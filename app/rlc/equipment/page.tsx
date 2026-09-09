'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { PlusCircle, Cpu, FolderPlus, MapPin, Tag, Layers, RefreshCw } from 'lucide-react';

const CATEGORIES = ['HVAC', 'Plumbing', 'Electrical', 'FDAS'];

interface Subcategory {
  id: number;
  category_name: string;
  name: string;
}

interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  category_name: string;
  subcategory_id: number;
  subcategories?: { name: string };
  location: string;
  equipment_type: string;
}

export default function EquipmentManagementPage() {
  const [categories] = useState<string[]>(CATEGORIES);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states - Subcategory
  const [newSubcatCategory, setNewSubcatCategory] = useState('HVAC');
  const [newSubcatName, setNewSubcatName] = useState('');

  // Form states - Equipment
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('HVAC');
  const [eqSubcatId, setEqSubcatId] = useState<string>('');
  const [eqLocation, setEqLocation] = useState('');
  const [eqType, setEqType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Subcategories
    const { data: subData } = await supabase.from('subcategories').select('*').order('name');
    if (subData) setSubcategories(subData);

    // Fetch Equipment with Subcategory relation
    const { data: eqData } = await supabase
      .from('equipment')
      .select('*, subcategories(name)')
      .order('created_at', { ascending: false });

    if (eqData) setEquipmentList(eqData as any);
    setLoading(false);
  };

  // Helper to filter subcategories for selected equipment category
  const filteredSubcategories = subcategories.filter(s => s.category_name === eqCategory);

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim()) return;

    const { error } = await supabase
      .from('subcategories')
      .insert({ category_name: newSubcatCategory, name: newSubcatName.trim() });

    if (error) {
      alert(`Error adding subcategory: ${error.message}`);
    } else {
      setNewSubcatName('');
      fetchData();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Auto-generate code prefix e.g., 'HVAC-042'
    const categoryCount = equipmentList.filter(e => e.category_name === eqCategory).length + 1;
    const generatedCode = `${eqCategory.toUpperCase()}-${String(categoryCount).padStart(3, '0')}`;

    const { error } = await supabase.from('equipment').insert({
      equipment_code: generatedCode,
      name: eqName,
      category_name: eqCategory,
      subcategory_id: eqSubcatId ? parseInt(eqSubcatId) : null,
      location: eqLocation,
      equipment_type: eqType,
    });

    if (error) {
      setMessage(`Failed: ${error.message}`);
    } else {
      setMessage(`Equipment registered successfully as code ${generatedCode}`);
      setEqName('');
      setEqLocation('');
      setEqType('');
      setEqSubcatId('');
      fetchData();
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment & Subcategory Management</h1>
            <p className="text-xs text-slate-500">Configure mall facility equipment inventory and dynamic subcategories.</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Create Subcategory & Create Equipment Forms */}
        <div className="space-y-6">
          {/* Form 1: Subcategory Creation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b pb-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>Add Subcategory</span>
            </div>
            <form onSubmit={handleAddSubcategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Main Category</label>
                <select
                  value={newSubcatCategory}
                  onChange={(e) => setNewSubcatCategory(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Subcategory Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exhaust Fans"
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
              >
                Create Subcategory
              </button>
            </form>
          </div>

          {/* Form 2: Register Equipment */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b pb-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Register New Equipment</span>
            </div>

            {message && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] rounded-lg">
                {message}
              </div>
            )}

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Chiller Unit A"
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Main Category</label>
                <select
                  value={eqCategory}
                  onChange={(e) => {
                    setEqCategory(e.target.value);
                    setEqSubcatId('');
                  }}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Subcategory</label>
                <select
                  value={eqSubcatId}
                  onChange={(e) => setEqSubcatId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                >
                  <option value="">-- Optional / None --</option>
                  {filteredSubcategories.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement 1 - Mechanical Room"
                  value={eqLocation}
                  onChange={(e) => setEqLocation(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Type / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Centrifugal 500 Ton"
                  value={eqType}
                  onChange={(e) => setEqType(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : 'Add Equipment to Registry'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Master Equipment Registry Table */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Registered Mall Assets ({equipmentList.length})</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading equipment registry...</div>
          ) : equipmentList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No equipment registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Subcategory</th>
                    <th className="p-2.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {equipmentList.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-blue-600">{eq.equipment_code}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{eq.name}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {eq.category_name}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {eq.subcategories?.name || '-'}
                      </td>
                      <td className="p-2.5 text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {eq.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
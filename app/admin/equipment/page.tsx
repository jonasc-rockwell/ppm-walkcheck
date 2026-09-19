// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Plus, Search, ShieldCheck, ChevronDown, ChevronUp, 
  RefreshCw, Layers, X, AlertCircle
} from 'lucide-react';

interface EquipmentItem {
  id: number;
  qr_code: string;
  name: string;
  model: string;
  serial_number: string;
  location: string;
  equipment_category_id: number;
  category_name?: string;
  status?: string;
  checklist_data?: Record<string, any>;
}

interface QuestionField {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  options?: string[];
  required: boolean;
}

export default function EquipmentListPage() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [templates, setTemplates] = useState<Record<number, QuestionField[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Adding Equipment
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newEquipment, setNewEquipment] = useState({
    qr_code: '',
    name: '',
    model: '',
    serial_number: '',
    location: '',
    equipment_category_id: 1,
    status: 'Operational',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // 1. Fetch categories
    const { data: catData } = await supabase
      .from('equipment_categories')
      .select('id, name')
      .order('id', { ascending: true });

    const categoriesList = catData || [
      { id: 1, name: 'HVAC' },
      { id: 2, name: 'Plumbing' },
      { id: 3, name: 'Electrical' },
      { id: 4, name: 'FDAS' },
    ];
    setCategories(categoriesList);

    const categoryMap = new Map(categoriesList.map((c) => [c.id, c.name]));

    // 2. Fetch raw equipment list without complex joins to prevent query failures
    const { data: eqData, error: eqErr } = await supabase
      .from('equipment')
      .select('*')
      .order('id', { ascending: true });

    if (eqErr) console.error('Equipment fetch error:', eqErr);

    // 3. Fetch checklist templates schema
    const { data: tmplData } = await supabase
      .from('checklist_templates')
      .select('equipment_category_id, schema');

    const tmplMap: Record<number, QuestionField[]> = {};
    if (tmplData) {
      tmplData.forEach((t) => {
        if (Array.isArray(t.schema)) {
          tmplMap[t.equipment_category_id] = t.schema as QuestionField[];
        }
      });
    }

    if (eqData) {
      const formatted = eqData.map((item: any) => ({
        ...item,
        category_name: categoryMap.get(item.equipment_category_id) || 'General',
      }));
      setEquipmentList(formatted);
    } else {
      setEquipmentList([]);
    }

    setTemplates(tmplMap);
    setLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);

    try {
      if (!newEquipment.name || !newEquipment.qr_code) {
        throw new Error('Equipment Name and QR Code are required.');
      }

      const payload = {
        ...newEquipment,
        equipment_category_id: Number(newEquipment.equipment_category_id),
      };

      const { error } = await supabase.from('equipment').insert([payload]);

      if (error) throw error;

      setShowAddModal(false);
      setNewEquipment({
        qr_code: '',
        name: '',
        model: '',
        serial_number: '',
        location: '',
        equipment_category_id: categories[0]?.id || 1,
        status: 'Operational',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add equipment.');
    } font-medium {
      setCreating(false);
    }
  };

  const filteredEquipment = equipmentList.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.qr_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-white">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Equipment List</h1>
          <p className="text-xs text-slate-400 font-medium max-w-lg mt-1">
            Click any row to drop down and inspect its associated category checklist questions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search equipment by name, QR code, or location..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Equipment List Container */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Loading equipment assets...</span>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700 text-xs text-slate-500">
            No equipment assets found. Click <strong className="text-blue-400">Add Equipment</strong> above to create your first asset.
          </div>
        ) : (
          filteredEquipment.map((item) => {
            const isExpanded = expandedId === item.id;
            const schema = templates[item.equipment_category_id] || [];

            return (
              <div
                key={item.id}
                className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl cursor-pointer select-none ${
                  isExpanded
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                    : 'border-white/10 hover:border-white/20 hover:bg-slate-900'
                }`}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Entire Main Row - Clickable Target */}
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {item.qr_code}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {item.category_name} Domain
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-0.5">{item.name}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Location: <span className="text-slate-300">{item.location || 'Unspecified'}</span> • Model:{' '}
                        <span className="text-slate-300">{item.model || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status Badge & Arrow */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                        item.status === 'Operational'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}
                    >
                      {item.status || 'Operational'}
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Section containing Checklist Fields */}
                {isExpanded && (
                  <div
                    className="p-5 bg-slate-950/60 border-t border-white/10 space-y-4 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Checklist Questions ({item.category_name})
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {schema.length} Total Fields
                      </span>
                    </div>

                    {schema.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-500 text-center">
                        No checklist template schema defined for {item.category_name} domain.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {schema.map((field, idx) => (
                          <div
                            key={field.id}
                            className="p-3 bg-slate-900/90 rounded-xl border border-white/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400">
                                Q{idx + 1} • {field.type}
                              </span>
                              {field.required && (
                                <span className="text-[9px] font-bold text-amber-400/80 bg-amber-400/10 px-1.5 py-0.2 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-200">{field.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white">Add New Equipment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEquipment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  placeholder="e.g. Chiller Unit #1"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">QR Code *</label>
                  <input
                    type="text"
                    required
                    value={newEquipment.qr_code}
                    onChange={(e) => setNewEquipment({ ...newEquipment, qr_code: e.target.value })}
                    placeholder="e.g. EQ-001"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Domain Category</label>
                  <select
                    value={newEquipment.equipment_category_id}
                    onChange={(e) => setNewEquipment({ ...newEquipment, equipment_category_id: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Model</label>
                  <input
                    type="text"
                    value={newEquipment.model}
                    onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                    placeholder="e.g. Carrier 30XA"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Location</label>
                  <input
                    type="text"
                    value={newEquipment.location}
                    onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                    placeholder="e.g. Roof Deck"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? 'Saving...' : 'Create Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
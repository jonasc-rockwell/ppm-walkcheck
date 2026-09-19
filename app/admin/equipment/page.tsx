// app/admin/equipment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Plus, Search, ShieldCheck, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Layers 
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
  const [templates, setTemplates] = useState<Record<number, QuestionField[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // 1. Fetch equipment with category joins
    const { data: eqData } = await supabase
      .from('equipment')
      .select(`
        id,
        qr_code,
        name,
        model,
        serial_number,
        location,
        equipment_category_id,
        status,
        checklist_data,
        equipment_categories ( name )
      `)
      .order('id', { ascending: true });

    // 2. Fetch all checklist templates mapped by category ID
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
        category_name: item.equipment_categories?.name || 'General',
      }));
      setEquipmentList(formatted);
    }

    setTemplates(tmplMap);
    setLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredEquipment = equipmentList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-white">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Equipment List</h1>
          <p className="text-xs text-slate-400 font-medium max-w-lg mt-1">
            Click any row to drop down and inspect its associated category checklist.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
            No equipment assets found matching your query.
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
                        Location: <span className="text-slate-300">{item.location}</span> • Model:{' '}
                        <span className="text-slate-300">{item.model || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Status Badge and Dropdown Arrow */}
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
                    onClick={(e) => e.stopPropagation()} // Keeps interaction inside inputs from closing row
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
                        {schema.map((field, idx) => {
                          const val = item.checklist_data?.[field.id];

                          return (
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

                              {/* Field Type Preview */}
                              <div className="pt-1">
                                {field.type === 'boolean' && (
                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/5">
                                      {val !== undefined ? (val ? 'Yes' : 'No') : 'Yes / No Toggle'}
                                    </span>
                                  </div>
                                )}

                                {field.type === 'select' && (
                                  <div className="text-[11px] text-slate-400">
                                    <span className="font-medium text-slate-500">Choices: </span>
                                    {field.options?.join(', ') || 'None'}
                                  </div>
                                )}

                                {field.type === 'number' && (
                                  <div className="text-[11px] font-mono text-blue-400">
                                    Numeric Value Input
                                  </div>
                                )}

                                {field.type === 'text' && (
                                  <div className="text-[11px] font-sans text-slate-400 italic">
                                    Text Remarks Field
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
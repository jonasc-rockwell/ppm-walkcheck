// app/admin/checklists/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Save, CheckSquare, Hash, ToggleLeft, Type, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuestionField {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  options?: string[];
  required: boolean;
}

export default function ChecklistBuilderPage() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [fields, setFields] = useState<QuestionField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      const { data } = await supabase
        .from('equipment_categories')
        .select('id, name')
        .order('id', { ascending: true });

      if (data && data.length > 0) {
        setCategories(data);
        setSelectedCategoryId(Number(data[0].id));
      } else {
        const defaults = [
          { id: 1, name: 'HVAC' },
          { id: 2, name: 'Plumbing' },
          { id: 3, name: 'Electrical' },
          { id: 4, name: 'FDAS' },
        ];
        setCategories(defaults);
        setSelectedCategoryId(1);
      }
    }
    loadCategories();
  }, []);

  // 2. Fetch template whenever selectedCategoryId changes
  const fetchExistingTemplate = useCallback(async (catId: number) => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from('checklist_templates')
      .select('schema')
      .eq('equipment_category_id', Number(catId))
      .maybeSingle();

    if (error) {
      console.error('Error loading template:', error);
      setFields([]);
    } else if (data && Array.isArray(data.schema)) {
      setFields(data.schema as QuestionField[]);
    } else {
      setFields([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      fetchExistingTemplate(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchExistingTemplate]);

  const addField = (type: 'number' | 'boolean' | 'select' | 'text') => {
    const newField: QuestionField = {
      id: `field_${Date.now()}`,
      label:
        type === 'number'
          ? 'Pressure Reading (PSI)'
          : type === 'boolean'
          ? 'Is Valve Intact?'
          : type === 'select'
          ? 'Operational Status'
          : 'Inspector Remarks',
      type,
      options: type === 'select' ? ['Normal', 'Needs Service', 'Replaced'] : [],
      required: true,
    };
    setFields((prev) => [...prev, newField]);
  };

  const updateField = (id: string, key: keyof QuestionField, value: any) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const saveTemplate = async () => {
    if (!selectedCategoryId) return;
    setSaving(true);
    setMessage(null);

    try {
      const catId = Number(selectedCategoryId);
      const catName = categories.find((c) => c.id === catId)?.name || 'Domain';

      const payload = {
        equipment_category_id: catId,
        title: `Inspection Checklist for ${catName}`,
        schema: fields,
      };

      const { error } = await supabase
        .from('checklist_templates')
        .upsert(payload, { onConflict: 'equipment_category_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: `Checklist template for ${catName} saved to database!` });
    } catch (err: any) {
      console.error('Save checklist error:', err);
      setMessage({ type: 'error', text: `Failed to save template: ${err.message || 'Unknown database error'}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Checklist Builder</h1>
          <p className="text-xs text-slate-400 font-medium max-w-lg mt-1">
            Build Google Forms-style dynamic inspection checklists per domain category.
          </p>
        </div>
        <button
          onClick={saveTemplate}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Alert Messaging */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold backdrop-blur-md flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Domain Category Selector */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl space-y-2">
        <label className="text-xs font-bold text-slate-300 block">Select Domain Category</label>
        <select
          value={selectedCategoryId ?? ''}
          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} Domain
            </option>
          ))}
        </select>
      </div>

      {/* Input Type Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Add Field Type</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => addField('number')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5 transition-all"
          >
            <Hash className="w-4 h-4 text-blue-400" /> Number Input
          </button>
          <button
            onClick={() => addField('boolean')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5 transition-all"
          >
            <ToggleLeft className="w-4 h-4 text-emerald-400" /> Yes / No Toggle
          </button>
          <button
            onClick={() => addField('select')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5 transition-all"
          >
            <CheckSquare className="w-4 h-4 text-amber-400" /> Choice List
          </button>
          <button
            onClick={() => addField('text')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5 transition-all"
          >
            <Type className="w-4 h-4 text-purple-400" /> Text Note
          </button>
        </div>
      </div>

      {/* Form Questions */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Loading saved domain template...</span>
          </div>
        ) : fields.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700 text-xs text-slate-500 font-medium">
            No checklist questions added yet for this domain category. Click an input type above to start building.
          </div>
        ) : (
          fields.map((field, idx) => (
            <div key={field.id} className="p-5 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20 uppercase">
                  Q{idx + 1} • {field.type}
                </span>
                <button
                  onClick={() => removeField(field.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Question / Input Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, 'label', e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {field.type === 'select' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Dropdown Choices (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={field.options?.join(', ')}
                    onChange={(e) =>
                      updateField(
                        field.id,
                        'options',
                        e.target.value.split(',').map((s) => s.trim())
                      )
                    }
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// app/admin/checklists/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Trash2, Save, FileText, CheckSquare, Hash, ToggleLeft, Type } from 'lucide-react';

interface QuestionField {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  options?: string[]; // For multi-choice/checklist
  required: boolean;
}

export default function ChecklistBuilderPage() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [fields, setFields] = useState<QuestionField[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchExistingTemplate(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('equipment_categories').select('id, name').order('id');
    if (data) {
      setCategories(data);
      if (data.length > 0) setSelectedCategoryId(data[0].id);
    }
  };

  const fetchExistingTemplate = async (catId: number) => {
    const { data } = await supabase
      .from('checklist_templates')
      .select('schema')
      .eq('equipment_category_id', catId)
      .single();

    if (data?.schema) {
      setFields(data.schema as QuestionField[]);
    } else {
      setFields([]);
    }
  };

  const addField = (type: 'number' | 'boolean' | 'select' | 'text') => {
    const newField: QuestionField = {
      id: `field_${Date.now()}`,
      label: type === 'number' ? 'Pressure Reading (PSI)' : type === 'boolean' ? 'Is Valve Intact?' : 'Checklist Item',
      type,
      options: type === 'select' ? ['Normal', 'Needs Service', 'Replaced'] : [],
      required: true,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, key: keyof QuestionField, value: any) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const saveTemplate = async () => {
    setSaving(true);
    setMessage(null);

    const { data: existing } = await supabase
      .from('checklist_templates')
      .select('id')
      .eq('equipment_category_id', selectedCategoryId)
      .single();

    if (existing) {
      await supabase
        .from('checklist_templates')
        .update({ schema: fields })
        .eq('id', existing.id);
    } else {
      await supabase.from('checklist_templates').insert([
        {
          equipment_category_id: selectedCategoryId,
          title: `Inspection Checklist for ${categories.find((c) => c.id === selectedCategoryId)?.name}`,
          schema: fields,
        },
      ]);
    }

    setSaving(false);
    setMessage('Checklist template saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Checklist Form Builder</h1>
          <p className="text-xs text-slate-400">Build custom Google Forms-style inspection inputs per domain category.</p>
        </div>
        <button
          onClick={saveTemplate}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-2xl">
          {message}
        </div>
      )}

      {/* Select Domain Category */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/10 space-y-2">
        <label className="text-xs font-bold text-slate-300">Select Equipment Domain Category</label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold outline-none"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} Domain
            </option>
          ))}
        </select>
      </div>

      {/* Input Field Type Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 space-y-2">
        <span className="text-xs font-bold text-slate-400">Add Question Type:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => addField('number')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5"
          >
            <Hash className="w-4 h-4 text-blue-400" /> Number Input
          </button>
          <button
            onClick={() => addField('boolean')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5"
          >
            <ToggleLeft className="w-4 h-4 text-emerald-400" /> Yes / No Toggle
          </button>
          <button
            onClick={() => addField('select')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5"
          >
            <CheckSquare className="w-4 h-4 text-amber-400" /> Choice List
          </button>
          <button
            onClick={() => addField('text')}
            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-white/5"
          >
            <Type className="w-4 h-4 text-purple-400" /> Text Note
          </button>
        </div>
      </div>

      {/* Dynamic Question List */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700 text-xs text-slate-500 font-medium">
            No inspection questions added yet for this domain. Click an input type above to start building.
          </div>
        ) : (
          fields.map((field, idx) => (
            <div key={field.id} className="p-5 bg-slate-900/80 rounded-2xl border border-white/10 space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                  Q{idx + 1} • {field.type}
                </span>
                <button onClick={() => removeField(field.id)} className="text-slate-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Question / Prompt Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, 'label', e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {field.type === 'select' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Dropdown Options (Comma separated)</label>
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
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none"
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
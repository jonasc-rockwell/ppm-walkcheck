// app/admin/checklists/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Plus, Trash2, Save, RefreshCw, ShieldCheck, 
  Layers, Tag, Check, AlertCircle 
} from 'lucide-react';

interface QuestionField {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  options?: string[];
  required: boolean;
}

interface TemplateItem {
  id: number;
  title?: string;
  equipment_prefix: string;
  schema: QuestionField[];
}

export default function ChecklistBuilderPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Editor Form State
  const [equipmentPrefix, setEquipmentPrefix] = useState('');
  const [questions, setQuestions] = useState<QuestionField[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching checklist templates:', error);
    } else if (data) {
      const formatted: TemplateItem[] = data.map((t) => ({
        id: t.id,
        equipment_prefix: t.equipment_prefix || 'GENERAL',
        schema: Array.isArray(t.schema) ? t.schema : [],
      }));
      setTemplates(formatted);

      if (formatted.length > 0 && !selectedTemplateId) {
        selectTemplate(formatted[0]);
      }
    }
    setLoading(false);
  };

  const selectTemplate = (tmpl: TemplateItem) => {
    setSelectedTemplateId(tmpl.id);
    setEquipmentPrefix(tmpl.equipment_prefix || '');
    setQuestions(tmpl.schema || []);
    setMessage(null);
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplateId(null);
    setEquipmentPrefix('NEW');
    setQuestions([
      {
        id: `q_${Date.now()}`,
        label: 'Is the equipment visually undamaged?',
        type: 'boolean',
        required: true,
      },
    ]);
    setMessage(null);
  };

  const handleAddQuestion = () => {
    const newQ: QuestionField = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: '',
      type: 'boolean',
      required: true,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleUpdateQuestion = (index: number, updatedField: Partial<QuestionField>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedField };
      return copy;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = async () => {
    if (!equipmentPrefix.trim()) {
      setMessage({ type: 'error', text: 'Equipment prefix is required (e.g. AHU, PUMP, SOLAR).' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const cleanPrefix = equipmentPrefix.trim().toUpperCase();

    const payload = {
      equipment_prefix: cleanPrefix,
      schema: questions,
    };

    try {
      if (selectedTemplateId) {
        // Update Existing Template
        const { error } = await supabase
          .from('checklist_templates')
          .update(payload)
          .eq('id', selectedTemplateId);

        if (error) throw error;
      } else {
        // Create New Template
        const { data, error } = await supabase
          .from('checklist_templates')
          .insert([payload])
          .select('id')
          .single();

        if (error) throw error;
        if (data) setSelectedTemplateId(data.id);
      }

      setMessage({ type: 'success', text: `Checklist template for prefix "${cleanPrefix}" saved successfully!` });
      await loadTemplates();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save template.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-white">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Checklist Builder</h1>
          <p className="text-xs text-slate-400 font-medium max-w-xl mt-1">
            Map checklist questions directly to equipment code prefixes (e.g., <span className="text-blue-400 font-bold">AHU</span>, <span className="text-blue-400 font-bold">PUMP</span>, <span className="text-blue-400 font-bold">SOLAR</span>).
          </p>
        </div>
        <button
          onClick={handleCreateNewTemplate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Prefix Template
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          {message.text}
        </div>
      )}

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: List of Templates / Prefixes */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Configured Prefixes ({templates.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              Loading templates...
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => selectTemplate(tmpl)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30'
                        : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                        {tmpl.equipment_prefix}
                      </span>
                      <span className="text-xs font-bold text-slate-200">Prefix Template</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {tmpl.schema?.length || 0} Questions
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Template Question Editor */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {selectedTemplateId ? 'Edit Checklist Template' : 'New Checklist Template'}
            </h3>
            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>

          {/* Metadata Controls */}
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-400" />
              Target Equipment Prefix Code *
            </label>
            <input
              type="text"
              value={equipmentPrefix}
              onChange={(e) => setEquipmentPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. AHU, PUMP, SOLAR, BOILER"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-blue-400 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Matches any equipment code starting with this prefix (e.g. <span className="text-slate-300">{equipmentPrefix || 'AHU'}-01</span>).
            </span>
          </div>

          {/* Question List Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Checklist Questions ({questions.length})
              </h4>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs rounded-lg border border-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
                No questions added to this prefix template yet. Click <strong className="text-blue-400">Add Question</strong> to start.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Question Label</label>
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => handleUpdateQuestion(idx, { label: e.target.value })}
                          placeholder="e.g. Check belt tension and alignment"
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Answer Type</label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              type: e.target.value as QuestionField['type'],
                            })
                          }
                          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="boolean">Boolean Check (Pass / Fail)</option>
                          <option value="number">Numeric Value Input</option>
                          <option value="text">Free Text Response</option>
                          <option value="select">Dropdown Choice Options</option>
                        </select>
                      </div>
                    </div>

                    {/* Options for Select Type */}
                    {q.type === 'select' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Dropdown Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={q.options ? q.options.join(', ') : ''}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              options: e.target.value.split(',').map((s) => s.trim()),
                            })
                          }
                          placeholder="e.g. Normal, Worn, Critical, Replaced"
                          className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
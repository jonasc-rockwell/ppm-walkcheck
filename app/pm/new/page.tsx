// app/pm/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { matchTemplateByPrefix, extractEquipmentPrefix } from '@/lib/equipmentPrefix';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuestionField {
  id: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  options?: string[];
  required: boolean;
}

const DEFAULT_FALLBACK_QUESTIONS: QuestionField[] = [
  { id: 'gen_1', label: 'Is the equipment physically undamaged?', type: 'boolean', required: true },
  { id: 'gen_2', label: 'Operational Status', type: 'select', options: ['Normal', 'Needs Attention', 'Critical'], required: true },
  { id: 'gen_3', label: 'General Inspection Notes', type: 'text', required: false },
];

export default function NewInspectionPage() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [matchedPrefix, setMatchedPrefix] = useState<string>('');
  const [activeQuestions, setActiveQuestions] = useState<QuestionField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    
    // Fetch equipment and checklist templates in parallel
    const [equipRes, tmplRes] = await Promise.all([
      supabase.from('equipment').select('*').order('name', { ascending: true }),
      supabase.from('checklist_templates').select('*'),
    ]);

    if (equipRes.data) setEquipmentList(equipRes.data);
    if (tmplRes.data) setTemplates(tmplRes.data);

    setLoading(false);
  };

  // Handle Equipment Selection and Auto-Match Prefix Template
  const handleSelectEquipment = (equipId: string) => {
    const equip = equipmentList.find((e) => String(e.id) === equipId);
    if (!equip) {
      setSelectedEquipment(null);
      setActiveQuestions([]);
      return;
    }

    setSelectedEquipment(equip);

    // Get the code or name to extract the prefix from
    const equipCode = equip.code || equip.equipment_code || equip.name || '';
    const prefix = extractEquipmentPrefix(equipCode);
    setMatchedPrefix(prefix);

    // Match template dynamically by prefix
    const matchedTemplate = matchTemplateByPrefix(equipCode, templates);

    if (matchedTemplate && Array.isArray(matchedTemplate.schema) && matchedTemplate.schema.length > 0) {
      setActiveQuestions(matchedTemplate.schema);
    } else {
      // Fallback to GENERAL or built-in questions if prefix isn't configured yet
      const generalTemplate = templates.find((t) => t.equipment_prefix?.toUpperCase() === 'GENERAL');
      if (generalTemplate && Array.isArray(generalTemplate.schema) && generalTemplate.schema.length > 0) {
        setActiveQuestions(generalTemplate.schema);
      } else {
        setActiveQuestions(DEFAULT_FALLBACK_QUESTIONS);
      }
    }

    // Reset answer form
    setAnswers({});
  };

  return (
    <div className="max-w-4xl mx-auto text-white space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10">
        <h1 className="text-2xl font-black">Perform Equipment Inspection</h1>
        <p className="text-xs text-slate-400 mt-1">Select an equipment item to load its prefix-matched checklist.</p>
      </div>

      {/* Equipment Selector */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-4">
        <label className="text-xs font-bold text-slate-300 block">Select Equipment Item</label>
        <select
          onChange={(e) => handleSelectEquipment(e.target.value)}
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose Equipment --</option>
          {equipmentList.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code || item.name} {item.location ? `(${item.location})` : ''}
            </option>
          ))}
        </select>

        {selectedEquipment && (
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Detected Prefix:</span>
              <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                {matchedPrefix || 'GENERAL'}
              </span>
            </div>
            <div className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{activeQuestions.length} Checklist Items</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Checklist Questions Form */}
      {selectedEquipment && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 border-b border-white/10 pb-3">
            Inspection Questions
          </h3>

          <div className="space-y-4">
            {activeQuestions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  {idx + 1}. {q.label} {q.required && <span className="text-rose-400">*</span>}
                </label>

                {q.type === 'boolean' && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: true })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        answers[q.id] === true
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: false })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        answers[q.id] === false
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      FAIL
                    </button>
                  </div>
                )}

                {q.type === 'select' && (
                  <select
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Option --</option>
                    {(q.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {q.type === 'text' && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Enter observation notes..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {q.type === 'number' && (
                  <input
                    type="number"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
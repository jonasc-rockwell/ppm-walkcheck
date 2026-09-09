'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ClipboardCheck, Camera, CheckCircle, AlertTriangle, XCircle, Send, Layers, RefreshCw } from 'lucide-react';

interface AssignedCategory {
  category_name: string;
}

interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  category_name: string;
  location: string;
}

export default function ContractorDashboard() {
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Inspection Form State
  const [status, setStatus] = useState<'pass' | 'fail' | 'flagged'>('pass');
  const [remarks, setRemarks] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchContractorData();
  }, []);

  const fetchContractorData = async () => {
    setLoading(true);
    setMessage(null);

    // 1. Get logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 2. Fetch contractor assigned categories
    const { data: catData } = await supabase
      .from('contractor_category_assignments')
      .select('category_name')
      .eq('user_id', user.id);

    if (catData && catData.length > 0) {
      const categoryNames = catData.map((c: AssignedCategory) => c.category_name);
      setAssignedCategories(categoryNames);

      // 3. Fetch equipment matching assigned categories
      const { data: eqData } = await supabase
        .from('equipment')
        .select('id, equipment_code, name, category_name, location')
        .in('category_name', categoryNames)
        .order('equipment_code');

      if (eqData) setEquipmentList(eqData);
    }
    setLoading(false);
  };

  const handleSubmitWalkcheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session expired');

      let photoUrl = null;

      // Upload photo if attached
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('walkcheck-photos')
          .upload(filePath, photo);

        if (uploadError) {
          console.warn('Storage upload error (ignoring if bucket missing):', uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('walkcheck-photos')
            .getPublicUrl(filePath);
          photoUrl = publicUrlData.publicUrl;
        }
      }

      // Insert Walkcheck record
      const { error: insertError } = await supabase.from('walkchecks').insert({
        equipment_id: selectedEquipment.id,
        contractor_id: user.id,
        status,
        remarks,
        photo_url: photoUrl,
      });

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: `Walkcheck submitted for ${selectedEquipment.equipment_code}!` });
      setSelectedEquipment(null);
      setRemarks('');
      setPhoto(null);
      setStatus('pass');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 max-w-lg mx-auto space-y-4">
      {/* Mobile Top Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Contractor Walkcheck</h1>
            <p className="text-[11px] text-slate-500">PPM Field Inspection Portal</p>
          </div>
        </div>
        <button
          onClick={fetchContractorData}
          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Assigned Domain Badges */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Assigned Domains</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assignedCategories.length === 0 ? (
            <span className="text-xs text-slate-400">No categories assigned yet.</span>
          ) : (
            assignedCategories.map((cat) => (
              <span key={cat} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-lg text-[11px] border border-blue-200">
                {cat}
              </span>
            ))
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Select Equipment */}
      {!selectedEquipment ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Equipment to Inspect</h2>
          
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading assigned equipment...</div>
          ) : equipmentList.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No equipment found for your assigned categories.</div>
          ) : (
            <div className="space-y-2">
              {equipmentList.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => setSelectedEquipment(eq)}
                  className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">{eq.equipment_code}</span>
                      <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-semibold">
                        {eq.category_name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{eq.name}</div>
                    <div className="text-[11px] text-slate-500">{eq.location}</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">Start &rarr;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Perform Inspection Form */
        <form onSubmit={handleSubmitWalkcheck} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="font-mono font-bold text-xs text-blue-600">{selectedEquipment.equipment_code}</span>
              <h2 className="text-sm font-bold text-slate-900">{selectedEquipment.name}</h2>
              <p className="text-[11px] text-slate-500">{selectedEquipment.location}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEquipment(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Change
            </button>
          </div>

          {/* Status Selection Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Inspection Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pass')}
                className={`py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  status === 'pass' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Pass
              </button>

              <button
                type="button"
                onClick={() => setStatus('flagged')}
                className={`py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  status === 'flagged' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Flagged
              </button>

              <button
                type="button"
                onClick={() => setStatus('fail')}
                className={`py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  status === 'fail' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" /> Fail
              </button>
            </div>
          </div>

          {/* Remarks Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Field Remarks / Findings</label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Pressure gauges normal, clean filter replaced."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Optional Photo Attachment */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-500" /> Attach Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting Inspection...' : 'Submit Inspection Log'}
          </button>
        </form>
      )}
    </div>
  );
}
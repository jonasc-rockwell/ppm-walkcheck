'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

export default function RLCDashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadSubmissions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('checklist_submissions')
      .select(`
        id, status, rlc_remarks, created_at,
        equipment ( name, location ),
        profiles ( full_name, company )
      `)
      .order('created_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    const remarks = prompt(`Add optional remarks for ${status.toUpperCase()}:`) || '';
    
    await supabase
      .from('checklist_submissions')
      .update({ status, rlc_remarks: remarks })
      .eq('id', id);

    loadSubmissions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <ShieldCheck className="w-7 h-7 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">RLC Supervisor Dashboard</h1>
          <p className="text-xs text-gray-500">Contractor Walkcheck Review & Approval Portal</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 text-center py-8">Loading submissions...</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    sub.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {sub.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(sub.created_at).toLocaleString()}
                  </span>
                </div>

                <h2 className="font-bold text-gray-900">{sub.equipment?.name || 'Equipment'}</h2>
                <p className="text-xs text-gray-500">{sub.equipment?.location}</p>

                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">{sub.profiles?.full_name}</span> ({sub.profiles?.company})
                </div>

                {sub.rlc_remarks && (
                  <p className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 italic">
                    RLC Note: "{sub.rlc_remarks}"
                  </p>
                )}
              </div>

              {sub.status === 'pending_review' && (
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  <button
                    onClick={() => handleReview(sub.id, 'approved')}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReview(sub.id, 'rejected')}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
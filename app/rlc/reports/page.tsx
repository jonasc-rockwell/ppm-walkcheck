'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Calendar, Filter, Printer, Download, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All Categories', 'HVAC', 'Plumbing', 'Electrical', 'FDAS'];

interface WalkcheckReport {
  id: number;
  status: 'pass' | 'fail' | 'flagged';
  remarks: string;
  submitted_at: string;
  photo_url: string;
  equipment: {
    equipment_code: string;
    name: string;
    category_name: string;
    location: string;
  };
  contractor: {
    full_name: string;
    company: string;
  };
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [reports, setReports] = useState<WalkcheckReport[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, selectedCategory]);

  const fetchReportData = async () => {
    setLoading(true);

    let query = supabase
      .from('walkchecks')
      .select(`
        id,
        status,
        remarks,
        submitted_at,
        photo_url,
        equipment:equipment_id (
          equipment_code,
          name,
          category_name,
          location
        ),
        contractor:contractor_id (
          full_name,
          company
        )
      `)
      .gte('submitted_at', `${startDate}T00:00:00.000Z`)
      .lte('submitted_at', `${endDate}T23:59:59.999Z`)
      .order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching walkcheck reports:', error.message);
    } else if (data) {
      let filtered = data as unknown as WalkcheckReport[];
      if (selectedCategory !== 'All Categories') {
        filtered = filtered.filter((r) => r.equipment?.category_name === selectedCategory);
      }
      setReports(filtered);
    }
    setLoading(false);
  };

  // Metrics
  const totalInspections = reports.length;
  const passedCount = reports.filter((r) => r.status === 'pass').length;
  const failedCount = reports.filter((r) => r.status === 'fail').length;
  const flaggedCount = reports.filter((r) => r.status === 'flagged').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return;

    const headers = ['Inspection ID', 'Submitted Date', 'Equipment Code', 'Equipment Name', 'Category', 'Location', 'Contractor', 'Status', 'Remarks'];
    const rows = reports.map((r) => [
      r.id,
      new Date(r.submitted_at).toLocaleString(),
      `"${r.equipment?.equipment_code || ''}"`,
      `"${r.equipment?.name || ''}"`,
      `"${r.equipment?.category_name || ''}"`,
      `"${r.equipment?.location || ''}"`,
      `"${r.contractor?.full_name || ''} (${r.contractor?.company || ''})"`,
      r.status.toUpperCase(),
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PPM_Walkcheck_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 max-w-7xl mx-auto print:bg-white print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:border-b-2 print:border-black">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600 print:text-black" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment Walkcheck & Inspection Summary</h1>
            <p className="text-xs text-slate-500">Audit logs and PPM operational compliance reports.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={fetchReportData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Date & Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Category Filter
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:border">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Inspections</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalInspections}</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm print:border">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase">Passed</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{passedCount}</p>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-sm print:border">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-rose-800 uppercase">Failed</p>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-1">{failedCount}</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm print:border">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-800 uppercase">Flagged / Pending</p>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{flaggedCount}</p>
        </div>
      </div>

      {/* Main Inspection Audit Log Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Detailed Log ({startDate} to {endDate})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Generating report data...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No inspection records found for the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase print:bg-slate-100">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Contractor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.submitted_at).toLocaleDateString()} {new Date(r.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-600">{r.equipment?.equipment_code}</div>
                      <div className="text-slate-800 font-medium">{r.equipment?.name}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {r.equipment?.category_name}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{r.equipment?.location}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{r.contractor?.full_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{r.contractor?.company}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          r.status === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'fail'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{r.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
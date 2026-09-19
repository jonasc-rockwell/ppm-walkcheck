// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface InspectionLog {
  id: number;
  equipment_code: string;
  category_name: string;
  inspector_name: string;
  status: 'Pass' | 'Flagged';
  remarks: string;
  created_at: string;
}

export default function ReportsPage() {
  const [logs, setLogs] = useState<InspectionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<InspectionLog[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedStatus, selectedCategory, startDate, endDate, logs]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inspection_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setLogs(data);
      setFilteredLogs(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let result = [...logs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.equipment_code.toLowerCase().includes(q) ||
          log.inspector_name.toLowerCase().includes(q) ||
          log.remarks.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== 'ALL') {
      result = result.filter((log) => log.status === selectedStatus);
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((log) => log.category_name === selectedCategory);
    }

    if (startDate) {
      result = result.filter((log) => new Date(log.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((log) => new Date(log.created_at) <= end);
    }

    setFilteredLogs(result);
  };

  const totalLogs = filteredLogs.length;
  const passedLogs = filteredLogs.filter((l) => l.status === 'Pass').length;
  const flaggedLogs = filteredLogs.filter((l) => l.status === 'Flagged').length;
  const passRate = totalLogs > 0 ? ((passedLogs / totalLogs) * 100).toFixed(1) : '0.0';

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Equipment Code', 'Category', 'Inspector', 'Status', 'Remarks', 'Date'];
    const rows = filteredLogs.map((log) => [
      log.id,
      `"${log.equipment_code}"`,
      `"${log.category_name}"`,
      `"${log.inspector_name}"`,
      log.status,
      `"${log.remarks.replace(/"/g, '""')}"`,
      new Date(log.created_at).toLocaleString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inspection_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading audit log summaries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/20 mb-1">
            <FileText className="w-3.5 h-3.5" /> Analytics & Reports
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Reports & Audit Logs</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Review walkcheck logs, inspect flagged operational issues, and export CSV audit reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-white/5"
          >
            <Printer className="w-4 h-4" /> Print Summary
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inspections</div>
          <div className="text-2xl font-black text-white">{totalLogs}</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Passed Checks
          </div>
          <div className="text-2xl font-black text-emerald-400">{passedLogs}</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-1">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Issues
          </div>
          <div className="text-2xl font-black text-rose-400">{flaggedLogs}</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-1">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Compliance Rate</div>
          <div className="text-2xl font-black text-blue-300">{passRate}%</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-white/10 pb-2">
          <Filter className="w-4 h-4 text-blue-400" /> Filter Logs
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pass">Pass Only</option>
            <option value="Flagged">Flagged Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="ALL">All Domains</option>
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Fire Safety">Fire Safety</option>
            <option value="Mechanical">Mechanical</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/60 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Equipment Tag</th>
                <th className="p-4">Domain</th>
                <th className="p-4">Inspector</th>
                <th className="p-4">Status</th>
                <th className="p-4">Field Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No inspection logs match search parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-400">{log.equipment_code}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] border border-white/10">
                        {log.category_name}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{log.inspector_name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          log.status === 'Pass'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {log.status === 'Pass' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{log.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
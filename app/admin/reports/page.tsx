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
  Clock,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';

interface InspectionLog {
  id: number;
  equipment_code: string;
  category_name: string;
  inspector_name: string;
  status: 'Pass' | 'Flagged';
  remarks: string;
  photo_url?: string;
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

    // Text search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.equipment_code.toLowerCase().includes(q) ||
          log.inspector_name.toLowerCase().includes(q) ||
          log.remarks.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((log) => log.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((log) => log.category_name === selectedCategory);
    }

    // Date range filter
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

  // KPI Calculations
  const totalLogs = filteredLogs.length;
  const passedLogs = filteredLogs.filter((l) => l.status === 'Pass').length;
  const flaggedLogs = filteredLogs.filter((l) => l.status === 'Flagged').length;
  const passRate = totalLogs > 0 ? ((passedLogs / totalLogs) * 100).toFixed(1) : '0.0';

  // Export to CSV
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
    link.setAttribute('download', `PPM_Inspection_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading inspection audit logs...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Quick Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports & Audit Logs</h1>
            <p className="text-xs text-slate-500">Review walkchecks, flagged issues, and generate executive reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Printer className="w-4 h-4" /> Print Summary
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inspections</div>
          <div className="text-2xl font-black text-slate-900">{totalLogs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
          </div>
          <div className="text-2xl font-black text-emerald-700">{passedLogs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Issues
          </div>
          <div className="text-2xl font-black text-rose-700">{flaggedLogs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Compliance Rate</div>
          <div className="text-2xl font-black text-blue-900">{passRate}%</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b pb-2">
          <Filter className="w-4 h-4 text-blue-600" /> Filter Logs
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Code, inspector, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pass">Pass Only</option>
            <option value="Flagged">Flagged Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Domains</option>
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Fire Safety">Fire Safety</option>
            <option value="Mechanical">Mechanical</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Equipment</th>
                <th className="p-4">Domain</th>
                <th className="p-4">Inspector</th>
                <th className="p-4">Status</th>
                <th className="p-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No inspection logs match the selected filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900">{log.equipment_code}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[10px] border border-slate-200">
                        {log.category_name}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{log.inspector_name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          log.status === 'Pass'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
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
                    <td className="p-4 text-slate-600 max-w-xs truncate">{log.remarks || '—'}</td>
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
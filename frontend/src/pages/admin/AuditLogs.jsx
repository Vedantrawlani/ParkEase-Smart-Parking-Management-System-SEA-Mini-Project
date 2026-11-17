import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Search, Filter, ShieldCheck, Clock, User } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/engineering/audit-logs?limit=100';
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.record_id?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Audit Trail & Activity Logging</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance logging of authentication, reservations, gate entries, allocations, and administrative actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="FACULTY_REGISTRATION">Faculty Registration</option>
            <option value="BOOKING_CREATED">Booking Created</option>
            <option value="BOOKING_CANCELLED">Booking Cancelled</option>
            <option value="VEHICLE_ENTRY_RECORDED">Vehicle Entry</option>
            <option value="VEHICLE_EXIT_RECORDED">Vehicle Exit</option>
            <option value="ADMIN_DIRECT_ALLOCATION">Admin Allocation</option>
            <option value="SLOT_CREATED">Slot Created</option>
            <option value="SLOT_UPDATED">Slot Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading audit trail...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No audit records found</h4>
          <p className="text-xs text-slate-500 mt-1">No activities match your current search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor / User</th>
                  <th className="px-6 py-3.5">Action Code</th>
                  <th className="px-6 py-3.5">Record Target</th>
                  <th className="px-6 py-3.5">Operation Details</th>
                  <th className="px-6 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{log.user_name || 'System Service'}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{log.user_role || 'system'}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-brand-600 font-bold">
                      {log.record_id || '--'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-sm truncate" title={log.details}>
                      {log.details || '--'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


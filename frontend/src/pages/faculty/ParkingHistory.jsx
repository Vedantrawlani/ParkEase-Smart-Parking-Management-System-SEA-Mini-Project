import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Search, Calendar, Clock, Car, MapPin } from 'lucide-react';

export default function ParkingHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await api.get('/sessions/history');
        if (res.data.success) {
          setHistory(res.data.history);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((h) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      h.booking_id?.toLowerCase().includes(query) ||
      h.slot_number?.toLowerCase().includes(query) ||
      h.area_name?.toLowerCase().includes(query) ||
      h.vehicle_number?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Parking History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of your past parking sessions and departure logs.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bay, Area, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* History Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading parking history...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <History className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No completed sessions found</h4>
          <p className="text-xs text-slate-500 mt-1">Your completed parking checkouts will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Booking / Slot</th>
                  <th className="px-6 py-3.5">Area</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Entry Time</th>
                  <th className="px-6 py-3.5">Exit Time</th>
                  <th className="px-6 py-3.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((row) => {
                  const entryDate = new Date(row.entry_time);
                  const exitDate = row.exit_time ? new Date(row.exit_time) : new Date();
                  const durationMins = Math.max(1, Math.round((exitDate - entryDate) / (1000 * 60)));
                  const durationHours = (durationMins / 60).toFixed(1);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-100">
                            {row.slot_number}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">{row.booking_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.area_name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800">{row.vehicle_number || '--'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {entryDate.toLocaleDateString()} {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {row.exit_time
                          ? `${new Date(row.exit_time).toLocaleDateString()} ${new Date(row.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : '--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {durationHours} hrs ({durationMins}m)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


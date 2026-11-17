import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Calendar, Download } from 'lucide-react';

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await api.get('/admin/reports');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // Status Color Mapping strictly from SRS
  const STATUS_COLORS = {
    available: '#10b981', // green
    occupied: '#ef4444',  // red
    reserved: '#3b82f6',  // blue
    unavailable: '#94a3b8' // slate/grey
  };

  const distribution = data?.distribution || [];
  const weeklyTrends = data?.weeklyTrends || [];
  const areaComparison = data?.areaComparison || [];
  const peakHours = data?.peakHours || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Parking Reports & Utilization Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data insights, capacity distributions, peak occupancy hours, and weekly utilization metrics.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Computing analytics and rendering charts...</div>
      ) : (
        <>
          {/* Top Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Slot Status Distribution Donut Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <PieIcon className="h-4 w-4 text-brand-500" />
                    Slot Status Distribution
                  </h3>
                  <p className="text-[11px] text-slate-400">Campus-wide breakdown by live occupancy</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} slots`, name.toUpperCase()]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs font-bold capitalize text-slate-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: 7-Day Booking Trends */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    Weekly Reservation Volume
                  </h3>
                  <p className="text-[11px] text-slate-400">Daily bookings vs verified parking sessions</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrends} barGap={4}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs font-semibold capitalize text-slate-700">{value}</span>}
                    />
                    <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Reservations" />
                    <Bar dataKey="sessions" fill="#10b981" radius={[6, 6, 0, 0]} name="Sessions Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Campus Area Capacity Comparison */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-brand-500" />
                    Area Utilization Comparison
                  </h3>
                  <p className="text-[11px] text-slate-400">Occupied, Reserved, and Free bays per Zone</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaComparison} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="code" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs font-semibold capitalize text-slate-700">{value}</span>}
                    />
                    <Bar dataKey="occupied" stackId="a" fill="#ef4444" name="Occupied" />
                    <Bar dataKey="reserved" stackId="a" fill="#3b82f6" name="Reserved" />
                    <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Peak Hours Occupancy Heatmap Curve */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-brand-500" />
                    Hourly Peak Occupancy Curve
                  </h3>
                  <p className="text-[11px] text-slate-400">Campus occupancy percentage across working hours</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peakHours}>
                    <defs>
                      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#026fc6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#026fc6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Occupancy']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancyPercent"
                      stroke="#026fc6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorOccupancy)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/common/StatCard';
import QRScannerModal from '../../components/common/QRScannerModal';
import {
  Grid,
  Car,
  Clock,
  Users,
  ShieldCheck,
  QrCode,
  CalendarCheck,
  Sliders,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGateScanner, setShowGateScanner] = useState(false);
  const { socket } = useSocket();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Listen to socket updates for real-time dashboard refresh
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchDashboard();
    socket.on('slot_updated', handleUpdate);
    return () => socket.off('slot_updated', handleUpdate);
  }, [socket]);

  const stats = data?.stats;
  const areas = data?.areas || [];
  const recentAudit = data?.recentAudit || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Gate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Campus Central Admin
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Live Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Parking Control Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time occupancy management, gate verification, faculty allocations, and quality monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowGateScanner(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <QrCode className="h-4 w-4 text-brand-400" />
            Open Gate Scanner
          </button>
          <Link
            to="/admin/allocations"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="h-4 w-4" />
            Allocate Slot
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Parking Bays"
          value={stats?.total_slots ?? '--'}
          subtitle={`${areas.length} Campus Parking Zones`}
          icon={Grid}
          color="slate"
        />
        <StatCard
          title="Available Bays"
          value={stats?.available_slots ?? '--'}
          subtitle="Ready for reservation"
          icon={Car}
          color="green"
        />
        <StatCard
          title="Occupied Bays"
          value={stats?.occupied_slots ?? '--'}
          subtitle="Vehicles inside campus"
          icon={Clock}
          color="red"
        />
        <StatCard
          title="Overall Utilization"
          value={`${stats?.utilization_rate ?? 0}%`}
          subtitle="Occupied + Reserved capacity"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* 3. Second Row Stats: Reserved, Unavailable, Active Sessions, Total Faculty */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Reserved Slots"
          value={stats?.reserved_slots ?? '--'}
          subtitle="Confirmed bookings & passes"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Unavailable / Maintenance"
          value={stats?.unavailable_slots ?? '--'}
          subtitle="Offline or disabled bays"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.active_sessions ?? '--'}
          subtitle="Vehicles currently parked"
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Registered Faculty"
          value={stats?.total_faculty ?? '--'}
          subtitle="Authorized campus accounts"
          icon={Users}
          color="slate"
        />
      </div>

      {/* 4. Campus Areas Capacity & Occupancy Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Campus Areas Occupancy</h3>
            <p className="text-xs text-slate-500">Live breakdown by area capacity and floor level</p>
          </div>
          <Link
            to="/admin/areas"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage Areas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {areas.map((a) => {
            const total = a.total_slots || 0;
            const occ = a.occupied_slots || 0;
            const res = a.reserved_slots || 0;
            const avail = a.available_slots || 0;
            const unavail = a.unavailable_slots || 0;
            const rate = total > 0 ? Math.round(((occ + res) / total) * 100) : 0;

            return (
              <div key={a.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    {a.code}
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {total} Total Bays
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{a.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.floor}</p>

                {/* Status Pills */}
                <div className="grid grid-cols-4 gap-1 text-center my-3 text-[10px] font-bold">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-800">
                    {avail} Free
                  </div>
                  <div className="p-1 rounded bg-rose-100 text-rose-800">
                    {occ} Parked
                  </div>
                  <div className="p-1 rounded bg-blue-100 text-blue-800">
                    {res} Rsrvd
                  </div>
                  <div className="p-1 rounded bg-slate-200 text-slate-700">
                    {unavail} Off
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Capacity Utilized</span>
                  <span className="font-bold">{rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Audit Trail & Activity Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Recent Audit Activities</h3>
            <p className="text-xs text-slate-500">Live trail of gate operations, allocations, and user events</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Full Audit Logs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentAudit.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No recent audit events logged.</div>
          ) : (
            recentAudit.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">• by {log.user_name || 'System'} ({log.user_role || 'system'})</span>
                  </div>
                  <p className="text-slate-600 mt-1 font-medium">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gate Scanner Modal */}
      {showGateScanner && (
        <QRScannerModal
          isOpen={showGateScanner}
          onClose={() => setShowGateScanner(false)}
          defaultMode="entry"
          onVerificationSuccess={() => {
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import QRCodeModal from '../../components/parking/QRCodeModal';
import {
  Car,
  CalendarCheck,
  Clock,
  Grid,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [availability, setAvailability] = useState(null);
  const [areas, setAreas] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [availRes, areasRes, sessionRes, bookingsRes] = await Promise.all([
        api.get('/parking/availability'),
        api.get('/parking/areas'),
        api.get('/sessions/active'),
        api.get('/parking/bookings?limit=4')
      ]);

      if (availRes.data.success) setAvailability(availRes.data.summary);
      if (areasRes.data.success) setAreas(areasRes.data.areas);
      if (sessionRes.data.success) setActiveSession(sessionRes.data.activeSession);
      if (bookingsRes.data.success) setRecentBookings(bookingsRes.data.bookings);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to socket updates to keep stats live
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on('slot_updated', handleUpdate);
    return () => socket.off('slot_updated', handleUpdate);
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-brand-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-brand-300 border border-white/10 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Faculty Member
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, {user?.full_name || 'Faculty Member'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            {user?.department} • ID: <span className="font-mono text-brand-300 font-bold">{user?.faculty_id}</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/availability"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25"
            >
              <Grid className="h-4 w-4" />
              Reserve a Slot
            </Link>
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-md border border-white/10"
            >
              <QrCode className="h-4 w-4" />
              My Digital Passes
            </Link>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Ongoing Active Parking Session Alert (if vehicle is inside) */}
      {activeSession && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  Active Parking Session Ongoing
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                Parked in Bay <span className="font-mono text-brand-600 font-black">{activeSession.slot_number}</span> ({activeSession.area_name})
              </h4>
              <p className="text-xs text-slate-600">
                Vehicle: {activeSession.vehicle_number || 'Registered'} • Checked in at{' '}
                {new Date(activeSession.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedPass(activeSession)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 hover:bg-slate-50 transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <QrCode className="h-4 w-4 text-brand-600" />
              Show Exit Pass
            </button>
            <Link
              to="/active-session"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs text-center"
            >
              Session Details
            </Link>
          </div>
        </div>
      )}

      {/* 3. Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Slots"
          value={availability?.available_slots ?? '--'}
          subtitle={`Out of ${availability?.total_slots || 0} total college slots`}
          icon={Grid}
          color="green"
        />
        <StatCard
          title="Occupied Slots"
          value={availability?.occupied_slots ?? '--'}
          subtitle="Vehicles currently parked"
          icon={Car}
          color="red"
        />
        <StatCard
          title="Campus Utilization"
          value={`${availability?.utilization_rate ?? 0}%`}
          subtitle="Live parking occupancy rate"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Registered Vehicle"
          value={user?.vehicle?.vehicle_number || 'Active'}
          subtitle={user?.vehicle?.vehicle_model || 'Primary Car'}
          icon={Car}
          color="slate"
        />
      </div>

      {/* 4. College Parking Areas Live Capacity */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Campus Parking Areas</h3>
            <p className="text-xs text-slate-500">Live availability across college campus zones</p>
          </div>
          <Link
            to="/availability"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Full Map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {areas.map((area) => (
            <div
              key={area.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                  {area.code}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {area.available_slots || 0} Free
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{area.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{area.floor}</p>

              {/* Occupancy Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Occupancy</span>
                  <span className="font-bold">{area.utilization_rate || 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, area.utilization_rate || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Bookings Preview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Recent Parking Reservations</h3>
            <p className="text-xs text-slate-500">Your latest parking passes and history</p>
          </div>
          <Link
            to="/my-bookings"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No reservations found. Click "Reserve a Slot" to book your parking bay.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-brand-100">
                    {b.slot_number}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{b.area_name || b.area_code}</h5>
                    <p className="text-[11px] text-slate-400 font-mono">{b.booking_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    b.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    b.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {b.status}
                  </span>

                  <button
                    onClick={() => setSelectedPass(b)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    title="View QR Gate Pass"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Pass Modal */}
      {selectedPass && (
        <QRCodeModal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          booking={selectedPass}
        />
      )}
    </div>
  );
}


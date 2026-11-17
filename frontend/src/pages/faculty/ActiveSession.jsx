import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import QRCodeModal from '../../components/parking/QRCodeModal';
import { Clock, MapPin, Car, ShieldCheck, QrCode, LogOut, AlertCircle, CheckCircle } from 'lucide-react';

export default function ActiveSession() {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitSuccess, setExitSuccess] = useState(null);
  const [exiting, setExiting] = useState(false);

  const fetchActive = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sessions/active');
      if (res.data.success && res.data.activeSession) {
        setActiveSession(res.data.activeSession);
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  // Live timer for ongoing session
  useEffect(() => {
    if (!activeSession?.entry_time) return;

    const entryMs = new Date(activeSession.entry_time).getTime();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - entryMs) / 1000));
      setElapsedSeconds(diffSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.entry_time]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Shortcut to simulate vehicle exit verification directly
  const handleSimulateExit = async () => {
    if (!activeSession) return;
    setExiting(true);
    try {
      const res = await api.post('/sessions/exit', {
        booking_id: activeSession.booking_id,
        remarks: 'Faculty checked out via portal'
      });
      if (res.data.success) {
        setExitSuccess(res.data.summary);
        setActiveSession(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Exit verification failed');
    } finally {
      setExiting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Checking active parking session...</div>;
  }

  if (exitSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Vehicle Exit Confirmed!</h2>
        <p className="text-xs text-slate-500">
          Your parking session has ended and Slot <span className="font-mono font-bold text-slate-800">{exitSuccess.slot_number}</span> has been freed.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left space-y-2 border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-500">Booking Reference:</span>
            <span className="font-mono font-bold text-slate-800">{exitSuccess.booking_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Entry Timestamp:</span>
            <span className="text-slate-800">{new Date(exitSuccess.entry_time).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Exit Timestamp:</span>
            <span className="text-slate-800">{new Date(exitSuccess.exit_time).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
            <span className="text-slate-700">Total Duration:</span>
            <span className="text-emerald-600">{exitSuccess.duration_hours} hours ({exitSuccess.duration_minutes} mins)</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/parking-history"
            className="inline-block px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            View Completed Parking History
          </Link>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-10 border border-slate-100 shadow-xs text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
          <Car className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">No Vehicle Currently Parked</h3>
        <p className="text-xs text-slate-500">
          You do not have an active ongoing parking session right now. Once your vehicle enters through the campus gate, your live session will appear here.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/availability"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition"
          >
            Reserve a Parking Slot
          </Link>
          <Link
            to="/my-bookings"
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
          >
            My Reservations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Active Session Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              Active In-Campus Session
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
            {activeSession.booking_id}
          </span>
        </div>

        {/* Big Timer Display */}
        <div className="text-center py-4 bg-slate-900 text-white rounded-2xl shadow-inner relative overflow-hidden">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Elapsed Parking Duration
          </p>
          <h2 className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-brand-400">
            {formatTimer(elapsedSeconds)}
          </h2>
          <p className="text-[10px] text-slate-400 mt-2">
            Checked in at {new Date(activeSession.entry_time).toLocaleTimeString()}
          </p>
        </div>

        {/* Slot & Location Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Allocated Bay
            </span>
            <h4 className="text-2xl font-black font-mono text-slate-900 mt-0.5">
              {activeSession.slot_number}
            </h4>
            <span className="text-[11px] font-semibold text-slate-500 capitalize">
              {activeSession.slot_type?.replace('_', ' ')} bay
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Parking Zone
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5 truncate">
              {activeSession.area_name}
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              {activeSession.area_floor}
            </span>
          </div>
        </div>

        {/* Vehicle & Verification info */}
        <div className="bg-slate-50/70 rounded-2xl p-4 text-xs space-y-2 border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-400">Parked Vehicle:</span>
            <span className="font-mono font-bold text-slate-800">
              {activeSession.vehicle_number || 'Registered Primary'} ({activeSession.vehicle_model || 'Vehicle'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Entry Verification:</span>
            <span className="font-medium text-emerald-600 capitalize">
              Verified by {activeSession.verified_by_method?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
          >
            <QrCode className="h-4 w-4" />
            Show Exit QR Gate Pass
          </button>

          <button
            onClick={handleSimulateExit}
            disabled={exiting}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/15 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {exiting ? 'Processing...' : 'Complete Vehicle Exit'}
          </button>
        </div>
      </div>

      {/* QR Code Pass Modal */}
      {showExitModal && (
        <QRCodeModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          booking={activeSession}
        />
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import QRCodeModal from '../../components/parking/QRCodeModal';
import Modal from '../../components/common/Modal';
import { CalendarCheck, QrCode, XCircle, AlertCircle, Clock, MapPin, Car, CheckCircle } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parking/bookings');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/parking/bookings/${cancellingBooking.id}/cancel`, {
        reason: cancelReason || 'Faculty cancelled'
      });
      if (res.data.success) {
        setCancellingBooking(null);
        setCancelReason('');
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Parking Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your confirmed reservations, view QR gate entry passes, and track history.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 text-xs shadow-xs">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No reservations found</h4>
          <p className="text-xs text-slate-500 mt-1">You have no bookings matching the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Top Badge: Booking ID & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-100">
                    {b.booking_id}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      b.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : b.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : b.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Slot Bay Title */}
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 font-mono">
                    Bay {b.slot_number}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {b.area_name || b.area_code} ({b.area_floor || 'Ground Level'})
                  </p>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/60 rounded-2xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Scheduled Start:
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(b.start_time).toLocaleDateString()} {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Scheduled End:
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(b.end_time).toLocaleDateString()} {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {b.vehicle_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Car className="h-3 w-3" /> Vehicle:
                      </span>
                      <span className="font-mono font-bold text-slate-800">{b.vehicle_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedPass(b)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <QrCode className="h-4 w-4" />
                  View Gate QR Pass
                </button>

                {b.status === 'confirmed' && (
                  <button
                    onClick={() => setCancellingBooking(b)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="Cancel Booking"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Pass Modal */}
      {selectedPass && (
        <QRCodeModal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          booking={selectedPass}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          title="Cancel Parking Reservation"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Cancel reservation for Bay {cancellingBooking.slot_number}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                The slot will be instantly freed up for other faculty members.
              </p>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Schedule changed, work from home"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


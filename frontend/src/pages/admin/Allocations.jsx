import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import QRCodeModal from '../../components/parking/QRCodeModal';
import { CalendarCheck, Plus, QrCode, XCircle, Search, User, MapPin, Clock } from 'lucide-react';

export default function Allocations() {
  const [bookings, setBookings] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  // New allocation form state
  const [newAllocation, setNewAllocation] = useState({
    faculty_id: '',
    slot_id: '',
    start_time: '',
    end_time: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, facultyRes, slotsRes] = await Promise.all([
        api.get('/parking/bookings'),
        api.get('/admin/faculty'),
        api.get('/parking/slots?status=available')
      ]);

      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
      if (facultyRes.data.success) {
        setFaculty(facultyRes.data.faculty);
        if (facultyRes.data.faculty.length > 0 && !newAllocation.faculty_id) {
          setNewAllocation(prev => ({ ...prev, faculty_id: facultyRes.data.faculty[0].id }));
        }
      }
      if (slotsRes.data.success) {
        setSlots(slotsRes.data.slots);
        if (slotsRes.data.slots.length > 0 && !newAllocation.slot_id) {
          setNewAllocation(prev => ({ ...prev, slot_id: slotsRes.data.slots[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default start & end time
    const now = new Date();
    const startStr = new Date(now.getTime() + 1800000).toISOString().slice(0, 16);
    const endStr = new Date(now.getTime() + 14400000).toISOString().slice(0, 16);
    setNewAllocation(prev => ({ ...prev, start_time: startStr, end_time: endStr }));
  }, []);

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/admin/allocate', newAllocation);
      if (res.data.success) {
        setShowAllocateModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAllocation = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this allocation? The slot will be freed immediately.')) return;
    try {
      const res = await api.put(`/parking/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by Administrator'
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel allocation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Booking & Allocation Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administer reservations, directly allocate reserved bays to faculty, and prevent scheduling conflicts.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowAllocateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Direct Allocate to Faculty
        </button>
      </div>

      {/* Bookings / Allocations Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading allocations...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No active bookings found</h4>
          <p className="text-xs text-slate-500 mt-1">Create a direct allocation to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Booking ID</th>
                  <th className="px-6 py-3.5">Faculty Member</th>
                  <th className="px-6 py-3.5">Allocated Bay</th>
                  <th className="px-6 py-3.5">Area</th>
                  <th className="px-6 py-3.5">Scheduled Window</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {b.booking_id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{b.faculty_name}</p>
                      <span className="font-mono text-[10px] text-slate-400">{b.faculty_id}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-brand-600 text-sm">
                      {b.slot_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {b.area_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{new Date(b.start_time).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          b.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          b.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          b.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPass(b)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="View QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelAllocation(b.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                            title="Cancel Allocation"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <Modal
          isOpen={showAllocateModal}
          onClose={() => setShowAllocateModal(false)}
          title="Direct Slot Allocation to Faculty"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateAllocation} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{error}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Faculty Member</label>
              <select
                value={newAllocation.faculty_id}
                onChange={(e) => setNewAllocation({ ...newAllocation, faculty_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.full_name} ({f.faculty_id}) - {f.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Bay</label>
              <select
                value={newAllocation.slot_id}
                onChange={(e) => setNewAllocation({ ...newAllocation, slot_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
              >
                {slots.map(s => (
                  <option key={s.id} value={s.id}>
                    Slot {s.slot_number} ({s.area_name || s.area_code}) - {s.slot_type}
                  </option>
                ))}
                {slots.length === 0 && (
                  <option value="">No available slots</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newAllocation.start_time}
                  onChange={(e) => setNewAllocation({ ...newAllocation, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newAllocation.end_time}
                  onChange={(e) => setNewAllocation({ ...newAllocation, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Remarks</label>
              <input
                type="text"
                placeholder="e.g. Reserved for Guest Seminar / Dean Meeting"
                value={newAllocation.remarks}
                onChange={(e) => setNewAllocation({ ...newAllocation, remarks: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || slots.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {saving ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Pass Modal */}
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


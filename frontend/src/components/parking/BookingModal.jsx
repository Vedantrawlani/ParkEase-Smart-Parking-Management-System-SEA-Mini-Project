import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import { Calendar, Clock, Car, AlertCircle, CheckCircle, QrCode } from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  onBookingSuccess
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch faculty registered vehicles
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user.vehicles?.length > 0) {
          setVehicles(res.data.user.vehicles);
          const primary = res.data.user.vehicles.find(v => v.is_primary) || res.data.user.vehicles[0];
          setSelectedVehicleId(primary.id);
        }
      } catch (e) {
        // ignore
      }
    }
    if (isOpen) {
      setError('');
      setConfirmedBooking(null);
      fetchVehicles();
    }
  }, [isOpen]);

  if (!slot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      setError('End time must be after the start time.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        slot_id: slot.id,
        vehicle_id: selectedVehicleId || null,
        start_time: startDateTime,
        end_time: endDateTime
      };

      const res = await api.post('/parking/bookings', payload);

      if (res.data.success) {
        setConfirmedBooking(res.data.booking);

        // Burst celebratory confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });

        if (onBookingSuccess) {
          onBookingSuccess(res.data.booking);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={confirmedBooking ? 'Reservation Confirmed!' : `Reserve Slot ${slot.slot_number}`}
      maxWidth="max-w-md"
    >
      {confirmedBooking ? (
        // Confirmation View with QR Code
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>

          <div>
            <h4 className="text-base font-extrabold text-slate-900">Your Parking Slot is Reserved!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Booking Reference: <span className="font-mono font-bold text-brand-600">{confirmedBooking.booking_id}</span>
            </p>
          </div>

          {/* QR Code Presentation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-xs">
            {confirmedBooking.qr_code_image ? (
              <img
                src={confirmedBooking.qr_code_image}
                alt="Parking Entry QR Code"
                className="w-48 h-48 mx-auto object-contain rounded-lg shadow-xs"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-200 rounded-lg">
                <QrCode className="h-12 w-12 text-slate-400" />
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-2">
              Scan at Campus Entry Gate
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50/80 rounded-xl p-3 text-left text-xs space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Parking Area:</span>
              <span className="font-bold text-slate-800">{slot.area_name || slot.area_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Allocated Slot:</span>
              <span className="font-bold text-brand-600 font-mono">{slot.slot_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Window:</span>
              <span className="font-medium text-slate-800">{date} ({startTime} - {endTime})</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition shadow-sm"
            >
              Done & View My Bookings
            </button>
          </div>
        </div>
      ) : (
        // Reservation Form
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot Highlight Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50 border border-brand-100">
            <div>
              <p className="text-[11px] font-semibold text-brand-700 uppercase">Selected Slot</p>
              <h4 className="text-lg font-black text-brand-900 font-mono">{slot.slot_number}</h4>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700">{slot.area_name || slot.area_code}</p>
              <p className="text-[10px] text-slate-500 capitalize">{slot.slot_type?.replace('_', ' ')} bay</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parking Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* Start & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Registered Vehicle</label>
            <div className="relative">
              <Car className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.vehicle_model || v.vehicle_type})
                  </option>
                ))}
                {vehicles.length === 0 && (
                  <option value="">Default Faculty Vehicle</option>
                )}
              </select>
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}


import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import ParkingSlotGrid from '../../components/parking/ParkingSlotGrid';
import BookingModal from '../../components/parking/BookingModal';
import { Grid, Sparkles, RefreshCw, Info } from 'lucide-react';

export default function ParkingAvailability() {
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchParkingData = useCallback(async () => {
    try {
      setLoading(true);
      const [slotsRes, areasRes] = await Promise.all([
        api.get('/parking/slots'),
        api.get('/parking/areas')
      ]);

      if (slotsRes.data.success) {
        setSlots(slotsRes.data.slots);
      }
      if (areasRes.data.success) {
        setAreas(areasRes.data.areas);
      }
    } catch (err) {
      console.error('Failed to fetch parking data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingData();
  }, [fetchParkingData]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (updatedSlot) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === updatedSlot.slotId ? { ...s, status: updatedSlot.status } : s))
      );
    };

    socket.on('slot_updated', handleSlotUpdate);
    return () => socket.off('slot_updated', handleSlotUpdate);
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Campus Parking Availability</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="h-3 w-3" /> Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual map of faculty parking bays across campus areas.
          </p>
        </div>

        {/* Color Legend Quick Reference */}
        <div className="flex flex-wrap items-center gap-3 p-2 bg-white rounded-2xl border border-slate-100 text-xs shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
            <span className="font-semibold text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
            <span className="font-semibold text-slate-700">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
            <span className="font-semibold text-slate-700">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-400 ring-2 ring-slate-200"></span>
            <span className="font-semibold text-slate-700">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Slot Grid */}
      <ParkingSlotGrid
        slots={slots}
        areas={areas}
        selectedAreaId={selectedAreaId}
        onSelectArea={setSelectedAreaId}
        onSelectSlot={(slot) => setSelectedSlotForBooking(slot)}
        loading={loading}
        onRefresh={fetchParkingData}
      />

      {/* Slot Reservation Dialogue Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          isOpen={!!selectedSlotForBooking}
          onClose={() => setSelectedSlotForBooking(null)}
          slot={selectedSlotForBooking}
          onBookingSuccess={() => {
            fetchParkingData();
          }}
        />
      )}
    </div>
  );
}


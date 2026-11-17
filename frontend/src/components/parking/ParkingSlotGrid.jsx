import React, { useState, useMemo } from 'react';
import SlotCard from './SlotCard';
import { Search, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ParkingSlotGrid({
  slots = [],
  areas = [],
  selectedAreaId,
  onSelectArea,
  onSelectSlot,
  loading,
  onRefresh
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Count distribution across all slots
  const counts = useMemo(() => {
    const res = { all: slots.length, available: 0, occupied: 0, reserved: 0, unavailable: 0 };
    slots.forEach(s => {
      if (res[s.status] !== undefined) res[s.status]++;
    });
    return res;
  }, [slots]);

  // Filtered slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Area filter
      if (selectedAreaId && selectedAreaId !== 'all' && Number(slot.area_id) !== Number(selectedAreaId)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && slot.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && slot.slot_type !== typeFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = slot.slot_number.toLowerCase().includes(query);
        const matchesNotes = slot.notes && slot.notes.toLowerCase().includes(query);
        if (!matchesNumber && !matchesNotes) return false;
      }
      return true;
    });
  }, [slots, selectedAreaId, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Parking Areas Selector Tabs */}
      {areas.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onSelectArea && onSelectArea('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              !selectedAreaId || selectedAreaId === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Campus Areas ({slots.length})
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectArea && onSelectArea(a.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                Number(selectedAreaId) === Number(a.id)
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{a.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                Number(selectedAreaId) === Number(a.id) ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {a.total_slots || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 2. Controls Bar: Search, Status Filter Pills & Legend */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Available ({counts.available})
          </button>
          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'occupied' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400"></span>
            Occupied ({counts.occupied})
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'reserved' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400"></span>
            Reserved ({counts.reserved})
          </button>
          <button
            onClick={() => setStatusFilter('unavailable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'unavailable' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            Unavailable ({counts.unavailable})
          </button>
        </div>

        {/* Search & Slot Type */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search slot (e.g. A-102)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Types</option>
            <option value="standard">Standard Car</option>
            <option value="ev_charging">EV Charging</option>
            <option value="disabled">Accessible</option>
            <option value="vip_faculty">Faculty VIP</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
              title="Refresh parking status"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Slot Cards Grid */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Filter className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No parking slots found</h4>
          <p className="text-xs text-slate-500 mt-1">Try modifying your area, status, or search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onSelect={onSelectSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
}


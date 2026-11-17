import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useSocket } from '../../context/SocketContext';
import { Sliders, Plus, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ParkingSlots() {
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    area_id: '',
    slot_type: 'standard',
    status: 'available',
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, areasRes] = await Promise.all([
        api.get('/parking/slots'),
        api.get('/parking/areas')
      ]);
      if (slotsRes.data.success) setSlots(slotsRes.data.slots);
      if (areasRes.data.success) {
        setAreas(areasRes.data.areas);
        if (areasRes.data.areas.length > 0 && !newSlot.area_id) {
          setNewSlot(prev => ({ ...prev, area_id: areasRes.data.areas[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket updates
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

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);
    try {
      const res = await api.post('/admin/slots', newSlot);
      if (res.data.success) {
        setShowAddModal(false);
        setNewSlot({ slot_number: '', area_id: areas[0]?.id || '', slot_type: 'standard', status: 'available', notes: '' });
        fetchData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setModalError('');
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/slots/${editingSlot.id}`, {
        slot_type: editingSlot.slot_type,
        status: editingSlot.status,
        notes: editingSlot.notes
      });
      if (res.data.success) {
        setEditingSlot(null);
        fetchData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (slotId, newStatus) => {
    try {
      await api.put(`/admin/slots/${slotId}`, { status: newStatus });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: newStatus } : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!window.confirm(`Are you sure you want to delete Slot ${slot.slot_number}? This cannot be undone.`)) return;

    try {
      const res = await api.delete(`/admin/slots/${slot.id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete slot: it is currently booked or in use.');
    }
  };

  const filteredSlots = slots.filter((s) => {
    if (areaFilter !== 'all' && Number(s.area_id) !== Number(areaFilter)) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Parking Slot Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Add new parking bays, edit configurations, toggle manual occupancy, and maintain inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Parking Slot
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Campus Areas ({slots.length})</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Slots Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading slot catalog...</div>
      ) : filteredSlots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <Sliders className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No parking slots found</h4>
          <p className="text-xs text-slate-500 mt-1">Try modifying your filter selections or add a new slot.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Slot Number</th>
                  <th className="px-6 py-3.5">Parking Area</th>
                  <th className="px-6 py-3.5">Bay Type</th>
                  <th className="px-6 py-3.5">Live Status</th>
                  <th className="px-6 py-3.5">Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-black text-slate-900 text-sm">
                      {s.slot_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block">{s.area_name || s.area_code}</span>
                      <span className="text-[10px] text-slate-400">{s.area_floor}</span>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-600 font-medium">
                      {s.slot_type?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      {/* Manual Quick Toggle Select */}
                      <select
                        value={s.status}
                        onChange={(e) => handleQuickStatusChange(s.id, e.target.value)}
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                          s.status === 'available' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          s.status === 'occupied' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                          s.status === 'reserved' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="available">Available (Green)</option>
                        <option value="occupied">Occupied (Red)</option>
                        <option value="reserved">Reserved (Blue)</option>
                        <option value="unavailable">Unavailable (Grey)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {s.notes || '--'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setModalError('');
                            setEditingSlot(s);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Edit Slot"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(s)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Parking Slot"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateSlot} className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{modalError}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot Number / Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. A-113"
                value={newSlot.slot_number}
                onChange={(e) => setNewSlot({ ...newSlot, slot_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parking Area</label>
              <select
                value={newSlot.area_id}
                onChange={(e) => setNewSlot({ ...newSlot, area_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Type</label>
                <select
                  value={newSlot.slot_type}
                  onChange={(e) => setNewSlot({ ...newSlot, slot_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="standard">Standard Car</option>
                  <option value="ev_charging">EV Charging</option>
                  <option value="disabled">Accessible / ADA</option>
                  <option value="vip_faculty">Faculty VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={newSlot.status}
                  onChange={(e) => setNewSlot({ ...newSlot, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="available">Available (Green)</option>
                  <option value="occupied">Occupied (Red)</option>
                  <option value="reserved">Reserved (Blue)</option>
                  <option value="unavailable">Unavailable (Grey)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
              <input
                type="text"
                placeholder="e.g. Near West Staircase"
                value={newSlot.notes}
                onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
              >
                {actionLoading ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <Modal
          isOpen={!!editingSlot}
          onClose={() => setEditingSlot(null)}
          title={`Edit Slot ${editingSlot.slot_number}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateSlot} className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{modalError}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot Type</label>
              <select
                value={editingSlot.slot_type}
                onChange={(e) => setEditingSlot({ ...editingSlot, slot_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="standard">Standard Car</option>
                <option value="ev_charging">EV Charging</option>
                <option value="disabled">Accessible / ADA</option>
                <option value="vip_faculty">Faculty VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Occupancy Status</label>
              <select
                value={editingSlot.status}
                onChange={(e) => setEditingSlot({ ...editingSlot, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="available">Available (Green)</option>
                <option value="occupied">Occupied (Red)</option>
                <option value="reserved">Reserved (Blue)</option>
                <option value="unavailable">Unavailable (Grey)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={editingSlot.notes || ''}
                onChange={(e) => setEditingSlot({ ...editingSlot, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


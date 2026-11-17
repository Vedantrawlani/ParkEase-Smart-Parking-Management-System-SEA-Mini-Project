import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { MapPin, Plus, Sliders, CheckCircle, Car } from 'lucide-react';

export default function ParkingAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArea, setNewArea] = useState({
    name: '',
    code: '',
    floor: 'Ground Level',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parking/areas');
      if (res.data.success) {
        setAreas(res.data.areas);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleCreateArea = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/admin/areas', newArea);
      if (res.data.success) {
        setShowAddModal(false);
        setNewArea({ name: '', code: '', floor: 'Ground Level', description: '' });
        fetchAreas();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create area.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Campus Parking Areas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure parking buildings, wings, open canopies, and zone floor designations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Parking Area
        </button>
      </div>

      {/* Areas Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading areas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {areas.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-100">
                    {a.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {a.available_slots || 0} Available
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{a.name}</h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {a.floor}
                </p>

                {a.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.description}</p>
                )}

                {/* Capacity breakdown pills */}
                <div className="grid grid-cols-4 gap-1.5 my-4 text-center text-[10px] font-bold">
                  <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                    <span className="block text-xs font-extrabold">{a.available_slots || 0}</span>
                    <span>Free</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
                    <span className="block text-xs font-extrabold">{a.occupied_slots || 0}</span>
                    <span>Parked</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                    <span className="block text-xs font-extrabold">{a.reserved_slots || 0}</span>
                    <span>Reserved</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    <span className="block text-xs font-extrabold">{a.unavailable_slots || 0}</span>
                    <span>Offline</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Occupancy Rate</span>
                    <span className="font-bold text-slate-800">{a.utilization_rate || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, a.utilization_rate || 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-right">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Total Capacity: {a.total_slots || 0} bays
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Area Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Campus Parking Area"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateArea} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{error}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Science & Innovation Block"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area Code</label>
                <input
                  type="text"
                  required
                  placeholder="AREA-D"
                  value={newArea.code}
                  onChange={(e) => setNewArea({ ...newArea, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Floor Level</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Level"
                  value={newArea.floor}
                  onChange={(e) => setNewArea({ ...newArea, floor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Adjacent to library, covered parking"
                value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
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
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
              >
                {saving ? 'Creating...' : 'Create Area'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


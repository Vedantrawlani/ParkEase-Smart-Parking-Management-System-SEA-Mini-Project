import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { Users, Search, Filter, CheckCircle, XCircle, Car, History, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedFacultyHistory, setSelectedFacultyHistory] = useState(null);
  const [facultyHistoryList, setFacultyHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/faculty');
      if (res.data.success) {
        setFaculty(res.data.faculty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleToggleStatus = async (facultyMember) => {
    const newStatus = facultyMember.is_active ? 0 : 1;
    const confirmMsg = facultyMember.is_active
      ? `Are you sure you want to deactivate ${facultyMember.full_name}'s account? They will not be able to log in or book parking.`
      : `Activate ${facultyMember.full_name}'s account?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/faculty/${facultyMember.id}/toggle-status`, {
        is_active: newStatus
      });
      if (res.data.success) {
        fetchFaculty();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update faculty status');
    }
  };

  const handleViewHistory = async (facultyMember) => {
    setSelectedFacultyHistory(facultyMember);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/parking/bookings?limit=20`);
      if (res.data.success) {
        // filter for this faculty member
        const userBookings = res.data.bookings.filter(b => b.user_id === facultyMember.id);
        setFacultyHistoryList(userBookings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    if (departmentFilter !== 'all' && f.department !== departmentFilter) return false;
    if (statusFilter !== 'all' && String(f.is_active) !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = f.full_name.toLowerCase().includes(q);
      const matchEmail = f.email.toLowerCase().includes(q);
      const matchId = f.faculty_id.toLowerCase().includes(q);
      const matchVeh = f.vehicle_number && f.vehicle_number.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId && !matchVeh) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Faculty Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            View, search, filter, and manage faculty member accounts, vehicles, and access status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty name, ID, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science & Engineering">CS & Engineering</option>
            <option value="Electronics & Communication">Electronics & Comm</option>
            <option value="Mechanical Engineering">Mechanical Eng</option>
            <option value="Civil Engineering">Civil Eng</option>
            <option value="School of Management">Management</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading faculty directory...</div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No faculty members found</h4>
          <p className="text-xs text-slate-500 mt-1">Try modifying your search or department filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3.5">Faculty Member</th>
                  <th className="px-6 py-3.5">Faculty ID</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Primary Vehicle</th>
                  <th className="px-6 py-3.5">Bookings</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {f.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{f.full_name}</p>
                          <p className="text-[11px] text-slate-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{f.faculty_id}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{f.department}</td>
                    <td className="px-6 py-4">
                      {f.vehicle_number ? (
                        <div>
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {f.vehicle_number}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">
                            {f.vehicle_model || f.vehicle_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{f.total_bookings || 0}</span>
                      {f.active_sessions > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                          PARKED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          f.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${f.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {f.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewHistory(f)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <History className="h-3 w-3" />
                          History
                        </button>
                        <button
                          onClick={() => handleToggleStatus(f)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            f.is_active
                              ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {f.is_active ? 'Deactivate' : 'Activate'}
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

      {/* History Modal for Faculty Member */}
      {selectedFacultyHistory && (
        <Modal
          isOpen={!!selectedFacultyHistory}
          onClose={() => setSelectedFacultyHistory(null)}
          title={`Parking Record: ${selectedFacultyHistory.full_name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Department:</span>{' '}
                <span className="font-bold text-slate-800">{selectedFacultyHistory.department}</span>
              </div>
              <div>
                <span className="text-slate-400">Faculty ID:</span>{' '}
                <span className="font-mono font-bold text-brand-600">{selectedFacultyHistory.faculty_id}</span>
              </div>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading records...</div>
            ) : facultyHistoryList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No parking bookings recorded for this faculty member.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {facultyHistoryList.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-600">{b.slot_number}</span>
                        <span className="text-slate-700 font-medium">({b.area_name || b.area_code})</span>
                        <span className="font-mono text-[10px] text-slate-400">{b.booking_id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(b.start_time).toLocaleDateString()} {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      b.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                      b.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      b.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedFacultyHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


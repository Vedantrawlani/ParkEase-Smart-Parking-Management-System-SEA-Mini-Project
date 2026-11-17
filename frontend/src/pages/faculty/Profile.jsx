import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Building, Mail, CreditCard, Car, CheckCircle, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateCurrentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleModel, setVehicleModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const u = res.data.user;
          setProfileData(u);
          setPhone(u.phone || '');
          setDepartment(u.department || '');
          if (u.vehicles && u.vehicles.length > 0) {
            const v = u.vehicles[0];
            setVehicleNumber(v.vehicle_number || '');
            setVehicleType(v.vehicle_type || 'car');
            setVehicleModel(v.vehicle_model || '');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.put('/auth/profile', {
        phone,
        department,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel
      });

      if (res.data.success) {
        setSuccessMsg('Profile and vehicle details updated successfully!');
        updateCurrentUser({
          phone,
          department,
          vehicle: {
            vehicle_number: vehicleNumber.toUpperCase(),
            vehicle_type: vehicleType,
            vehicle_model: vehicleModel
          }
        });
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Loading faculty profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Faculty Profile & Vehicles</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details and registered campus vehicle authorization.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">
        {/* User Card Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            {profileData?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{profileData?.full_name}</h3>
            <p className="text-xs text-slate-500">{profileData?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {profileData?.faculty_id}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                {profileData?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Academic & Contact Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & Academic Department
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Department</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="School of Management">School of Management</option>
                  <option value="Applied Sciences & Humanities">Applied Sciences & Humanities</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Vehicle Section */}
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Campus Registered Vehicle
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">License Plate Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="MH-12-AB-1234"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="car">Car (Sedan/Hatch/SUV)</option>
                <option value="ev_car">Electric Car (EV)</option>
                <option value="motorcycle">Two-Wheeler</option>
                <option value="ev_motorcycle">Electric Two-Wheeler</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model Description</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Honda City / Tata Nexon"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}


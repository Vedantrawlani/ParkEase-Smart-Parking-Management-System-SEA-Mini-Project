import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Grid,
  CalendarCheck,
  Clock,
  History,
  User,
  Users,
  MapPin,
  Sliders,
  QrCode,
  BarChart3,
  FileText,
  Activity,
  Layers,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth();

  const facultyNavItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Parking Availability', to: '/availability', icon: Grid },
    { label: 'My Bookings', to: '/my-bookings', icon: CalendarCheck },
    { label: 'Active Session', to: '/active-session', icon: Clock },
    { label: 'Parking History', to: '/parking-history', icon: History },
    { label: 'Profile & Vehicles', to: '/profile', icon: User }
  ];

  const adminNavItems = [
    { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Faculty Management', to: '/admin/faculty', icon: Users },
    { label: 'Parking Areas', to: '/admin/areas', icon: MapPin },
    { label: 'Parking Slots', to: '/admin/slots', icon: Sliders },
    { label: 'Allocations', to: '/admin/allocations', icon: CalendarCheck },
    { label: 'Entry/Exit Gate Terminal', to: '/admin/gate', icon: QrCode },
    { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: FileText },
    { label: 'Quality & Testing (RTM)', to: '/admin/quality', icon: Activity, highlight: true }
  ];

  const navItems = isAdmin ? adminNavItems : facultyNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between border-r border-slate-800 shadow-xl`}
      >
        <div className="py-6 px-4 overflow-y-auto flex-1">
          {/* User Role Tag */}
          <div className="mb-6 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'}`}>
              {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.department || (isAdmin ? 'Campus Admin' : 'Faculty')}</p>
            </div>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {isAdmin ? 'System Administration' : 'Faculty Services'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? item.highlight
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                          : 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                        : item.highlight
                        ? 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SRS
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info: College Mini Project badge */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-300">ParkEase v1.0</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Software Engineering & Architecture Mini Project
          </p>
        </div>
      </aside>
    </>
  );
}


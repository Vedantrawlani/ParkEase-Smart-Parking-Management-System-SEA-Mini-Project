import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ParkingAvailability from './pages/faculty/ParkingAvailability';
import MyBookings from './pages/faculty/MyBookings';
import ActiveSession from './pages/faculty/ActiveSession';
import ParkingHistory from './pages/faculty/ParkingHistory';
import Profile from './pages/faculty/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import ParkingAreas from './pages/admin/ParkingAreas';
import ParkingSlots from './pages/admin/ParkingSlots';
import Allocations from './pages/admin/Allocations';
import EntryExitGate from './pages/admin/EntryExitGate';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import AuditLogs from './pages/admin/AuditLogs';
import QualityDashboard from './pages/admin/QualityDashboard';

import NotFound from './pages/NotFound';

/**
 * Route protection wrapper for authenticated users
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400 font-bold">
        Loading ParkEase...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Route protection wrapper for admin-only routes
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400 font-bold">
        Loading ParkEase...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Main application dashboard layout with Sidebar & Navbar
 */
function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-64 flex flex-col transition-all duration-200">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>

          <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white/50">
            ParkEase – Smart Parking Management System • Software Engineering & Architecture Mini Project
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Faculty Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <FacultyDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/availability"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ParkingAvailability />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MyBookings />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/active-session"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ActiveSession />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parking-history"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ParkingHistory />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Profile />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminDashboard />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/faculty"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <FacultyManagement />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/areas"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ParkingAreas />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/slots"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ParkingSlots />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/allocations"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <Allocations />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/gate"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <EntryExitGate />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ReportsAnalytics />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AuditLogs />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/quality"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <QualityDashboard />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route
                path="*"
                element={
                  <DashboardLayout>
                    <NotFound />
                  </DashboardLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}


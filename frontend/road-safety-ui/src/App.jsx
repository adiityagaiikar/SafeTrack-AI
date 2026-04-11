import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import Auth from "./pages/auth/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ModelConfigPanel from "./pages/admin/ModelConfigPanel";
import DispatchRouting from "./pages/admin/DispatchRouting";
import ReportAuditQueue from "./pages/admin/ReportAuditQueue";
import { UserManagement } from "./pages/admin/UserManagement";
import Overview from "./pages/dashboard/Overview";
import LiveStream from "./pages/dashboard/LiveStream";
import VideoUpload from "./pages/dashboard/VideoUpload";
import IncidentLog from "./pages/incidents/IncidentLog";
import BehaviorAnalytics from "./pages/dashboard/BehaviorAnalytics";
import Settings from "./pages/settings/Settings";
import Billing from "./pages/billing/Billing";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="config" element={<ModelConfigPanel />} />
              <Route path="dispatch" element={<DispatchRouting />} />
              <Route path="reports" element={<ReportAuditQueue />} />
              <Route path="users" element={<UserManagement />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="stream" element={<LiveStream />} />
              <Route path="upload" element={<VideoUpload />} />
              <Route path="incidents" element={<IncidentLog />} />
              <Route path="analytics" element={<BehaviorAnalytics />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
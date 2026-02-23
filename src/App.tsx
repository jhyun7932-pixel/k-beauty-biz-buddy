import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import PartnerLayout from "@/layouts/PartnerLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import MyDataPage from "@/pages/MyDataPage";
import ExportProjectsPage from "@/pages/ExportProjectsPage";
import ComplianceChecklistPage from "@/pages/ComplianceChecklistPage";
import SettingsPage from "@/pages/SettingsPage";
import ExpertConnectionPage from "@/pages/ExpertConnectionPage";
import SharePage from "@/pages/SharePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminInquiriesPage from "@/pages/admin/AdminInquiriesPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminRulepacksPage from "@/pages/admin/AdminRulepacksPage";
import PartnerDashboardPage from "@/pages/partner/PartnerDashboardPage";
import PartnerLeadsPage from "@/pages/partner/PartnerLeadsPage";
import PartnerActivePage from "@/pages/partner/PartnerActivePage";
import PartnerProfilePage from "@/pages/partner/PartnerProfilePage";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { PartnerProtectedRoute } from "@/components/auth/PartnerProtectedRoute";
import { AuthProvider } from "@/components/auth/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* AuthProvider: Supabase 세션 ↔ Zustand store 동기화 */}
        <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes with Layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Main 3-menu user routes */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/my-data" element={<MyDataPage />} />
            <Route path="/export-projects" element={<ExportProjectsPage />} />
            <Route path="/compliance" element={<ComplianceChecklistPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/expert-connection" element={<ExpertConnectionPage />} />

            {/* Legacy route redirects */}
            <Route path="/projects" element={<Navigate to="/export-projects" replace />} />
            <Route path="/buyers" element={<Navigate to="/my-data?tab=buyers" replace />} />
            <Route path="/products" element={<Navigate to="/my-data?tab=products" replace />} />
            <Route path="/crm" element={<Navigate to="/my-data" replace />} />
            <Route path="/documents" element={<Navigate to="/export-projects" replace />} />
            <Route path="/workspace" element={<Navigate to="/export-projects" replace />} />
            <Route path="/compliance" element={<Navigate to="/export-projects" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/rulepacks" element={<AdminRulepacksPage />} />
          </Route>

          {/* Partner Routes */}
          <Route element={
            <PartnerProtectedRoute>
              <PartnerLayout />
            </PartnerProtectedRoute>
          }>
            <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
            <Route path="/partner-dashboard/leads" element={<PartnerLeadsPage />} />
            <Route path="/partner-dashboard/active" element={<PartnerActivePage />} />
            <Route path="/partner-dashboard/profile" element={<PartnerProfilePage />} />
          </Route>
          
          {/* Standalone Pages */}
          <Route path="/share/:token" element={<SharePage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

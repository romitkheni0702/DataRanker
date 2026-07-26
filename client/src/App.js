import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";
import "./App.css";

import StockDashboard from "./StockDashboard";
import KPILibraryEditor from "./KPILibraryEditor";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PricingPage from "./pages/PricingPage";
import DemoPage from "./pages/DemoPage";
import AboutPage from "./pages/AboutPage";
import ScreenerPage from "./pages/ScreenerPage";
import ComparisonPage from "./pages/ComparisonPage";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AccountPage from "./pages/AccountPage";
import NotFoundPage from "./pages/NotFoundPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import PremiumPage from "./pages/PremiumPage";
import AdminPlansPage from "./pages/AdminPlansPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminContentPage from "./pages/AdminContentPage";
import UpgradePage from "./pages/UpgradePage";
import { apiUrl, getAuthHeaders } from "./api";
import { AppConfigContext, DEFAULT_APP_CONFIG } from "./AppConfigContext";

export default function App() {
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG);
  const [appConfigReady, setAppConfigReady] = useState(false);

  // Re-fetch app-wide feature flags (called by AppShell after auth is confirmed).
  const refreshAppConfig = useCallback(() => {
    fetch(apiUrl("/app-config"), {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setAppConfig((prev) => ({ ...prev, ...data }));
        setAppConfigReady(true);
      })
      .catch(() => { setAppConfigReady(true); });
  }, []);

  return (
    <AppConfigContext.Provider value={{ config: appConfig, ready: appConfigReady, refresh: refreshAppConfig }}>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected app shell */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/screener" replace />} />
          <Route path="column-mapper" element={<Navigate to="/app/screener" replace />} />
          <Route path="results" element={<StockDashboard resultFile={null} />} />
          <Route path="kpi-editor" element={<KPILibraryEditor />} />
          <Route path="screener" element={<ScreenerPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="company/:symbol" element={<CompanyDetailPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="upgrade" element={<UpgradePage />} />
          <Route path="admin/plans" element={<AdminPlansPage />} />
          <Route path="admin/logs" element={<AdminLogsPage />} />
          <Route path="admin/content" element={<AdminContentPage />} />
        </Route>

        {/* 404 - must be last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </AppConfigContext.Provider>
  );
}

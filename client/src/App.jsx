import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SafetyProvider } from './context/SafetyContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SafetySessionPage from './pages/SafetySessionPage';
import MapPage from './pages/MapPage';
import ContactsPage from './pages/ContactsPage';
import SafetyHistoryPage from './pages/SafetyHistoryPage';
import SettingsPage from './pages/SettingsPage';
import ChildMonitorPage from './pages/ChildMonitorPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F6F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0D3833] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Securing Connection...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafetyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />

              {/* Protected Core Application Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/child"
                element={
                  <ProtectedRoute>
                    <ChildMonitorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session"
                element={
                  <ProtectedRoute>
                    <SafetySessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <ContactsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <SafetyHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SafetyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

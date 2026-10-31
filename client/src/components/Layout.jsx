import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, ChevronDown, LogOut, User, Settings, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';
import { useTheme } from '../context/ThemeContext';
import SosButton from './SosButton';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { activeIncident, resolveIncident } = useSafety();
  const { theme, isDark, toggleTheme } = useTheme();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Child (Catty)', path: '/child' },
    { label: 'Safe Map', path: '/map' },
    { label: 'History', path: '/history' },
    { label: 'Contacts', path: '/contacts' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F3F6F5] text-slate-800 flex flex-col font-sans">
      {/* Top Floating White Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D3833] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-black tracking-wider text-[#0D3833]">ESTELA</span>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-semibold transition-all relative py-1 ${
                    isActive
                      ? 'text-[#0D3833] font-bold'
                      : 'text-slate-500 hover:text-[#0D3833]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D3833] rounded-full"></span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Icons & User Avatar */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick SOS Trigger in Header */}
            <div className="hidden sm:block">
              <SosButton size="compact" />
            </div>

            {/* Dark Mode Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <Link
              to="/history"
              className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition relative"
              title="Activity & Notifications"
            >
              <Bell className="w-5 h-5" />
              {activeIncident && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-ping"></span>
              )}
            </Link>

            {/* User Profile Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200/60"
              >
                <div className="w-8 h-8 rounded-full bg-[#0D3833] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.name ? user.name.slice(0, 2) : 'AL'}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">
                  {user?.name || 'Alex'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Alex Chen'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile & Settings
                  </Link>
                  <Link
                    to="/contacts"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Trusted Contacts
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition font-medium text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Active Alert Banner if Incident is Ongoing */}
      {activeIncident && (
        <div className="bg-red-500 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>EMERGENCY ALERT ACTIVE: Incident #{activeIncident.id}</span>
          <button
            onClick={() => resolveIncident(activeIncident.id, 'User marked safe from header')}
            className="px-3 py-1 bg-white text-red-600 rounded-full text-[11px] font-extrabold hover:bg-red-50 transition shadow-xs"
          >
            I Am Safe (Resolve)
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 z-40 flex justify-around items-center">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`text-xs font-bold py-1 px-3 rounded-full transition ${
                isActive ? 'bg-[#0D3833] text-white' : 'text-slate-500'
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

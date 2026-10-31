import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, ChevronDown, LogOut, User, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';
import SosButton from './SosButton';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { activeIncident, resolveIncident } = useSafety();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Parent Portal (Tanish)', path: '/child' },
    { label: "Catty's App", path: '/catty' },
    { label: 'Live Map', path: '/map' },
    { label: 'Contacts', path: '/contacts' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Linear-Style Blur Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/80 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-sm group-hover:scale-105 transition">
              <Shield className="w-4 h-4 fill-slate-950 stroke-none" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white">ESTELA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-emerald-400 border border-white/[0.08]">
                v2.4
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Icons & User Avatar */}
          <div className="flex items-center gap-3">
            {/* Quick SOS Trigger in Header */}
            <div className="hidden sm:block">
              <SosButton size="compact" />
            </div>

            {/* Notification Bell */}
            <Link
              to="/history"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition relative border border-transparent hover:border-white/[0.06]"
              title="Activity & Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeIncident && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B0F17] animate-ping"></span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.08]"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold text-[10px] uppercase">
                  {user?.name ? user.name.slice(0, 2) : 'TA'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline-block">
                  {user?.name?.split(' ')[0] || 'Tanish'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#121824] rounded-2xl shadow-2xl border border-white/[0.1] py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Tanish'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'tanish@estela.app'}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Profile & Settings
                  </Link>
                  <Link
                    to="/contacts"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/[0.05] transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Trusted Contacts
                  </Link>
                  <div className="border-t border-white/[0.06] my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition font-medium text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
        <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-3 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>EMERGENCY ALERT BROADCAST ACTIVE: Incident #{activeIncident.id}</span>
          <button
            onClick={() => resolveIncident(activeIncident.id, 'User marked safe from header')}
            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-[11px] font-extrabold transition shadow-xs"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0F17]/90 backdrop-blur-xl border-t border-white/[0.08] py-2.5 px-4 z-40 flex justify-around items-center">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`text-xs font-semibold py-1.5 px-3 rounded-full transition ${
                isActive ? 'bg-white/[0.1] text-white border border-white/[0.12]' : 'text-slate-400'
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

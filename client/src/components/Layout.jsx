import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, ChevronDown, LogOut, User, Sparkles } from 'lucide-react';
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
    { label: 'Ride Safety (Rapido)', path: '/ride' },
    { label: 'Parent Portal (Tanish)', path: '/child' },
    { label: 'Live Map', path: '/map' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0D0B14] text-[#F3EEFA] flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Soothing Lavender Frosted Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0D0B14]/85 backdrop-blur-xl border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-purple-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-950 group-hover:scale-105 transition">
              <Shield className="w-4 h-4 fill-white stroke-none" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white">ESTELA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                lavender
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-purple-950/30 border border-purple-900/30">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-200 shadow-xs font-semibold border border-purple-500/30'
                      : 'text-purple-300/70 hover:text-white hover:bg-purple-900/20'
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
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/20 transition relative border border-transparent hover:border-purple-800/40"
              title="Activity & Notifications"
            >
              <Bell className="w-4 h-4" />
              {activeIncident && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0D0B14] animate-ping"></span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-purple-950/40 hover:bg-purple-900/30 transition border border-purple-800/40"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-xs">
                  {user?.name ? user.name.slice(0, 2) : 'TA'}
                </div>
                <span className="text-xs font-medium text-purple-200 hidden sm:inline-block">
                  {user?.name?.split(' ')[0] || 'Tanish'}
                </span>
                <ChevronDown className="w-3 h-3 text-purple-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#171326] rounded-2xl shadow-2xl border border-purple-800/40 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-purple-900/40">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Tanish'}</p>
                    <p className="text-[11px] text-purple-300/60 truncate">{user?.email || 'tanish@estela.app'}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-purple-200 hover:bg-purple-900/20 transition"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Profile & Settings
                  </Link>
                  <Link
                    to="/contacts"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-purple-200 hover:bg-purple-900/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    Trusted Contacts
                  </Link>
                  <div className="border-t border-purple-900/40 my-1"></div>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-28 md:pb-8">
        {children}
      </main>

      {/* Floating Bottom Handy SOS Bar for Mobile & Fast Emergency Access */}
      <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-8 z-50 animate-in fade-in">
        <button
          onClick={() => {
            const el = document.querySelector('[aria-label="Emergency SOS Button"]') || document.querySelector('.sos-pulse-ring');
            if (el) {
              el.click();
            } else {
              const navSos = document.querySelector('header button');
              if (navSos) navSos.click();
            }
          }}
          className="px-5 py-3.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-sm tracking-wide shadow-2xl shadow-rose-950/80 border-2 border-white/30 flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer hover:shadow-rose-600/50 hover:scale-105"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
          <span>🚨 SOS QUICK TAP</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D0B14]/90 backdrop-blur-xl border-t border-purple-900/40 py-2.5 px-4 z-40 flex justify-around items-center">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`text-xs font-semibold py-1.5 px-3 rounded-full transition ${
                isActive ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40' : 'text-purple-300/60'
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

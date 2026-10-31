import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle2, Clock, Users, MapPin, 
  ChevronRight, ArrowRight, Sparkles, Navigation, Baby, Siren, Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';
import ActiveSessionView from '../components/ActiveSessionView';
import SosButton from '../components/SosButton';
import AiDistressMonitor from '../components/AiDistressMonitor';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeSession, contacts, latestLocation } = useSafety();
  const navigate = useNavigate();

  if (activeSession) {
    return (
      <div className="space-y-6">
        <ActiveSessionView />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      
      {/* 1. Linear-Grade Hero Banner */}
      <div className="relative rounded-3xl linear-card p-6 sm:p-10 overflow-hidden">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Hero Overview */}
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ESTELA Active Protection Active
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Good evening, <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {user?.name?.split(' ')[0] || 'Tanish'}
              </span>
            </h1>

            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Real-time spatial geofencing, encrypted telemetry, and instant 30-second escalating dual siren dispatch.
            </p>

            {/* Quick Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/session"
                className="linear-btn-primary px-5 py-3 rounded-xl text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2"
              >
                <span>Start Safety Session</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/child"
                className="linear-btn-secondary px-5 py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-2"
              >
                <Baby className="w-4 h-4 text-emerald-400" />
                <span>Parent Portal (Tanish)</span>
              </Link>

              <Link
                to="/catty"
                className="px-5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <Siren className="w-4 h-4 text-rose-400" />
                <span>Open Catty's App</span>
              </Link>
            </div>
          </div>

          {/* Right Status Pill Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md max-w-xs w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Telemetry Engine</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ONLINE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Protected Child:</span>
                <span className="font-bold text-white">Catty (14 yrs)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Parent / Guardian:</span>
                <span className="font-bold text-emerald-400">Tanish (+91 9306617122)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Escalation Timer:</span>
                <span className="font-mono text-amber-300 font-bold">30 Seconds Auto</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Linear Feature Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Trusted Contacts */}
        <Link
          to="/contacts"
          className="linear-card p-5 rounded-2xl flex flex-col justify-between group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition mb-4 border border-white/[0.06]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition">
              Trusted Contacts
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {contacts.length} configured
            </p>
          </div>
        </Link>

        {/* Live Map */}
        <Link
          to="/map"
          className="linear-card p-5 rounded-2xl flex flex-col justify-between group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-400 flex items-center justify-center transition mb-4 border border-white/[0.06]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition">
              Live Safe Map
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {latestLocation ? 'GPS Sync 4s' : 'Tap to view'}
            </p>
          </div>
        </Link>

        {/* Parent Portal */}
        <Link
          to="/child"
          className="linear-card p-5 rounded-2xl flex flex-col justify-between group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition mb-4 border border-white/[0.06]">
            <Baby className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition">
              Catty Monitor
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Parent telemetry</p>
          </div>
        </Link>

        {/* Safety Tips / History */}
        <Link
          to="/history"
          className="linear-card p-5 rounded-2xl flex flex-col justify-between group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] group-hover:bg-purple-500/20 text-slate-300 group-hover:text-purple-400 flex items-center justify-center transition mb-4 border border-white/[0.06]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-400 transition">
              Activity Log
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Audit trail</p>
          </div>
        </Link>

      </div>

      {/* 3. Emergency Dispatch & AI Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="linear-card p-6 rounded-3xl space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                Emergency Priority Dispatch
              </span>
              <span className="text-[10px] font-mono text-slate-400">Telegram Bot Synced</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Instant SOS Assistance</h3>
            <p className="text-xs text-slate-400">
              Immediately alerts Tanish (+91 9306617122) and rings synchronized emergency siren alarm.
            </p>
          </div>
          <SosButton size="bar" />
        </div>

        <div>
          <AiDistressMonitor />
        </div>
      </div>

    </div>
  );
}

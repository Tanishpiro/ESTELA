import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle2, Clock, Users, MapPin, 
  ChevronRight, ArrowRight, Sparkles, Navigation 
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

  // If there's an active session, show the dedicated Active Session Dial screen
  if (activeSession) {
    return (
      <div className="space-y-6">
        <ActiveSessionView />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      
      {/* 1. Main Warm Greeting Hero Banner */}
      <div className="relative rounded-3xl bg-white border border-slate-100 p-6 sm:p-10 shadow-xs overflow-hidden">
        
        {/* Scenic Warm Landscape Image in Right Curved Cutout */}
        <div 
          className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80')`,
            clipPath: 'ellipse(90% 100% at 85% 50%)'
          }}
        >
          {/* Subtle Warm Sunset Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-black/30"></div>
          <div className="absolute bottom-6 right-8 text-right text-white drop-shadow-md">
            <span className="text-xl font-light italic font-serif block">
              "Safer.
            </span>
            <span className="text-xl font-bold italic font-serif">
              Brighter You"
            </span>
          </div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 max-w-md space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Welcome back
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-0.5">
              Good evening,<br />
              {user?.name?.split(' ')[0] || 'Alex'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Stay aware. Stay safe. You've got this.
            </p>
          </div>

          {/* "You're safe" Status Card */}
          <div className="p-4 rounded-2xl bg-[#F4F8F6] border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D3833] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">You're safe</h4>
                <p className="text-[11px] text-slate-500">No active session</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Primary CTA: Start a Safety Session */}
          <div className="pt-2">
            <Link
              to="/session"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0D3833] hover:bg-[#164E46] text-white font-bold text-sm transition shadow-sm group"
            >
              Start a Safety Session
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Quick-Action Bottom Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Trusted Contacts Card */}
        <Link
          to="/contacts"
          className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-300 transition shadow-xs flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-emerald-50 text-slate-700 group-hover:text-[#0D3833] flex items-center justify-center transition mb-4">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Trusted Contacts</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {contacts.length} configured
            </p>
          </div>
        </Link>

        {/* Location Sharing Card */}
        <Link
          to="/map"
          className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-300 transition shadow-xs flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-teal-50 text-slate-700 group-hover:text-teal-700 flex items-center justify-center transition mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Location Sharing</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {latestLocation ? 'Live GPS ready' : 'Tap to view'}
            </p>
          </div>
        </Link>

        {/* Safety Tips / Advice Card */}
        <Link
          to="/history"
          className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-300 transition shadow-xs flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 flex items-center justify-center transition mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Safety Tips</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Stay prepared</p>
          </div>
        </Link>

        {/* Session History Card */}
        <Link
          to="/history"
          className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-300 transition shadow-xs flex flex-col justify-between group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-purple-50 text-slate-700 group-hover:text-purple-700 flex items-center justify-center transition mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Session History</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">View past activity</p>
          </div>
        </Link>
      </div>

      {/* 3. Emergency SOS Bar & AI Distress Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Emergency Dispatch</span>
            <h3 className="text-lg font-bold text-slate-900">Instant SOS Assistance</h3>
            <p className="text-xs text-slate-400">
              Immediately alerts all primary and backup guardians with live GPS coordinates.
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

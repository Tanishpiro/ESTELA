import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Clock, Users, MapPin, Sparkles, 
  ArrowRight, Play, Heart, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F3F6F5] text-slate-800 flex flex-col font-sans selection:bg-emerald-100">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D3833] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-black tracking-wider text-[#0D3833]">ESTELA</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#home" className="text-[#0D3833] font-bold">Home</a>
            <a href="#features" className="hover:text-[#0D3833] transition">Features</a>
            <a href="#safety-tips" className="hover:text-[#0D3833] transition">Safety Tips</a>
            <a href="#about" className="hover:text-[#0D3833] transition">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-full bg-[#0D3833] text-white font-bold text-xs sm:text-sm hover:bg-[#164E46] transition shadow-xs flex items-center gap-1.5"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full bg-[#0D3833] text-white font-bold text-xs sm:text-sm hover:bg-[#164E46] transition shadow-xs flex items-center gap-1.5"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Panoramic Mountain Sunrise Hero Banner */}
      <section id="home" className="relative w-full overflow-hidden">
        
        {/* Full-width scenic background container with rounded card look */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
          <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 min-h-[520px] sm:min-h-[580px] flex items-center">
            
            {/* Background scenic photo: Young woman traveler looking out over mountain sunrise */}
            <div
              className="absolute inset-0 bg-cover bg-center sm:bg-[center_top_-40px]"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85')`,
              }}
            >
              {/* Soft Warm Morning Glow Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 sm:via-white/60 to-transparent"></div>
            </div>

            {/* Floating Top Right Badge "Stay Safe Wherever You Go" */}
            <div className="absolute top-6 right-6 sm:top-10 sm:right-12 hidden md:block z-20">
              <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/60 max-w-[200px] text-right">
                <p className="text-xs font-bold text-slate-800">Stay Safe Wherever You Go</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Plan • Share • Stay Connected</p>
              </div>
            </div>

            {/* Floating Quote Right "Safety is freedom to be you" */}
            <div className="absolute bottom-12 right-8 sm:bottom-16 sm:right-16 hidden lg:block z-20 text-right text-white drop-shadow-md">
              <p className="font-serif italic text-xl sm:text-2xl font-light">
                "Safety is freedom<br />to be you."
              </p>
            </div>

            {/* Left Content Card */}
            <div className="relative z-20 max-w-xl p-6 sm:p-12 lg:p-16 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#0D3833] text-xs font-bold">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Your Safety, Always
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                A Safer,<br />
                <span className="text-[#0D3833]">Brighter You</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-md leading-relaxed">
                ESTELA helps you stay connected, share your safety status and get help when it matters.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="px-7 py-3.5 rounded-full bg-[#0D3833] hover:bg-[#164E46] text-white font-bold text-sm transition shadow-sm flex items-center gap-2"
                >
                  Open Web App <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="px-6 py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-800 font-bold text-sm transition shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-800" /> Watch Demo
                </Link>
              </div>

              {/* Feature Bullet Strip */}
              <div className="pt-6 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0D3833]" />
                  <span>Real-time location sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0D3833]" />
                  <span>Trusted contacts alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0D3833]" />
                  <span>Safety sessions & check-ins</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 3. Core Highlights Grid */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Intuitive & Reliable
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-3">
            Designed to Keep You Confident Anywhere
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every screen and action in ESTELA is built for ease of use during everyday commutes or urgent situations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D3833] flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Timed Check-in Dial</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Start a safety journey with customizable checkpoints. Confirm safety with a single tap on the interactive dial.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Autonomous Server Escalation</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              If a check-in is missed, our server-side engine automatically dispatches factual advisories to your primary and backup contacts.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Privacy-First GPS Sharing</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Coordinates are only tracked during active sessions or distress triggers. No background surveillance when you're off-duty.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-100 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">ESTELA</span>
            <span>— Your Safety, Always.</span>
          </div>
          <p>© {new Date().getFullYear()} ESTELA. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

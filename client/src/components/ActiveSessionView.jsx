import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Send, AlertCircle, Share2, Sparkles } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from './SafetyMap';
import confetti from 'canvas-confetti';

export default function ActiveSessionView() {
  const { activeSession, confirmSafe, endSession, latestLocation, contacts } = useSafety();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, isOverdue: false, totalSeconds: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!activeSession) return;

    const calculateTime = () => {
      const deadline = new Date(activeSession.next_checkin_deadline).getTime();
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isOverdue: true, totalSeconds: 0 });
      } else {
        const mins = Math.floor(difference / 1000 / 60);
        const secs = Math.floor((difference / 1000) % 60);
        setTimeLeft({
          minutes: mins,
          seconds: secs,
          isOverdue: false,
          totalSeconds: Math.floor(difference / 1000)
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCheckin = async () => {
    try {
      setIsSubmitting(true);
      await confirmSafe('User pressed I\'m Safe on circular dial');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0D3833', '#164E46', '#20B486', '#34D399']
        });
      } catch (e) {}
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyShare = () => {
    if (latestLocation) {
      const osmUrl = `https://www.openstreetmap.org/?mlat=${latestLocation.latitude}&mlon=${latestLocation.longitude}#map=16/${latestLocation.latitude}/${latestLocation.longitude}`;
      navigator.clipboard.writeText(osmUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!activeSession) return null;

  const isOverdue = timeLeft.isOverdue || activeSession.status === 'overdue';
  const totalIntervalSecs = (activeSession.checkin_interval_minutes || 15) * 60;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft.totalSeconds / totalIntervalSecs) * 100));
  const strokeDashoffset = 377 - (377 * progressPercent) / 100;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs relative overflow-hidden">
        
        {/* Decorative Nature Leaf Accent */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-50 via-teal-50 to-transparent rounded-bl-full pointer-events-none opacity-70"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Left Column: Session Status & Meta details */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                Safety Session Active
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {activeSession.title || 'Evening Safety Journey'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ESTELA is actively monitoring your journey and guarding your safety.
              </p>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-lg">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D3833] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Live Location On</p>
                  <p className="text-[11px] text-slate-400">Sharing with {contacts.length || 2} contacts</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0D3833] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Check-in Interval</p>
                  <p className="text-[11px] text-slate-400">Every {activeSession.checkin_interval_minutes} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Big Circular Check-in Dial */}
          <div className="flex flex-col items-center justify-center relative">
            <div className="text-center mb-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                {isOverdue ? 'Overdue - Escalate' : 'Next Check-in in'}
              </p>
            </div>

            {/* Circular Progress & "I'm Safe" Tap Button */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full circle-progress-ring" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  className={`${isOverdue ? 'text-red-500' : 'text-emerald-500'} transition-all duration-1000`}
                  strokeWidth="8"
                  strokeDasharray="377"
                  strokeDashoffset={isOverdue ? 0 : strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <button
                onClick={handleCheckin}
                disabled={isSubmitting}
                className={`absolute w-36 h-36 rounded-full text-white flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                  isOverdue
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#0D3833] hover:bg-[#164E46]'
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="font-extrabold text-base tracking-wide">
                  {isSubmitting ? 'Updating...' : "I'm Safe"}
                </span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest font-semibold mt-0.5">
                  Confirm
                </span>
              </button>
            </div>

            {isOverdue && (
              <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full animate-bounce">
                Deadline Exceeded! Missed check-in alert dispatched.
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyShare}
              className="px-4 py-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              {copiedLink ? 'Map Link Copied!' : 'Share Live Location'}
            </button>

            <button
              onClick={endSession}
              className="px-4 py-2.5 rounded-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition border border-slate-200"
            >
              End Session
            </button>
          </div>

          {/* Quick Contact Avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {contacts.slice(0, 3).map((c, i) => (
                <div
                  key={c.id || i}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#0D3833] text-white text-[11px] font-bold flex items-center justify-center uppercase shadow-xs"
                >
                  {c.name.slice(0, 2)}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium ml-1">
              {contacts.length} Trusted Contacts notified if missed
            </span>
          </div>
        </div>
      </div>

      {/* Map Section Embedded */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <SafetyMap location={latestLocation} title="Your Active Position" zoom={15} />
      </div>
    </div>
  );
}

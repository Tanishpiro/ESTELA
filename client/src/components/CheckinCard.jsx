import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export default function CheckinCard() {
  const { activeSession, confirmSafe, latestLocation } = useSafety();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, isOverdue: false, totalSeconds: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

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
        setTimeLeft({ minutes: mins, seconds: secs, isOverdue: false, totalSeconds: Math.floor(difference / 1000) });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCheckin = async () => {
    try {
      setIsSubmitting(true);
      await confirmSafe('User confirmed safe via Check-in button');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeSession) {
    return null;
  }

  const isOverdue = timeLeft.isOverdue || activeSession.status === 'overdue';

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 shadow-md border ${
      isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200/80'
    }`}>
      {/* Session Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Safety Session
          </span>
          <h3 className="text-lg font-bold text-[#101C2C] flex items-center gap-2">
            {activeSession.title}
          </h3>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            isOverdue 
              ? 'bg-red-100 text-[#E53945] animate-pulse' 
              : 'bg-emerald-50 text-[#20B486]'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isOverdue ? 'bg-[#E53945]' : 'bg-[#20B486]'}`}></span>
            {isOverdue ? 'CHECK-IN OVERDUE' : 'MONITORING ACTIVE'}
          </span>
        </div>
      </div>

      {/* Countdown & Timer */}
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
          {isOverdue ? 'Deadline Exceeded by' : 'Next Check-in Required In'}
        </span>

        <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight my-1 ${
          isOverdue ? 'text-[#E53945]' : 'text-[#101C2C]'
        }`}>
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </div>

        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Interval: Every {activeSession.checkin_interval_minutes} minutes
        </p>

        {isOverdue && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#E53945] bg-red-100 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Backend Escalation has dispatched missed check-in advisory to contacts!
          </div>
        )}
      </div>

      {/* Primary Action Button: "I AM SAFE" */}
      <div className="mt-2">
        <button
          onClick={handleCheckin}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg tracking-wide shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 ${
            isOverdue
              ? 'bg-[#E53945] hover:bg-[#cf2b36] shadow-red-200'
              : 'bg-[#20B486] hover:bg-[#1b9a72] shadow-emerald-200 pulse-safe'
          }`}
        >
          <ShieldCheck className="w-6 h-6" />
          {isSubmitting ? 'Confirming...' : 'I AM SAFE'}
        </button>

        {successToast && (
          <div className="mt-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-lg transition-all animate-in fade-in">
            ✓ Safety confirmed! Next check-in deadline has been reset.
          </div>
        )}
      </div>

      {/* Location Status Meta */}
      {latestLocation && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#4A90E2]" />
            <span>GPS Tracking Active</span>
          </div>
          <span className="font-mono text-[11px]">
            {latestLocation.latitude.toFixed(4)}, {latestLocation.longitude.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

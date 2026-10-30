import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, MapPin, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export default function SafetySessionPage() {
  const { startSession, contacts } = useSafety();
  const navigate = useNavigate();

  // Duration selection
  const [selectedDuration, setSelectedDuration] = useState(60); // 60 minutes default
  // Checkin interval selection
  const [selectedInterval, setSelectedInterval] = useState(15); // 15 mins default
  // Toggles
  const [shareLocation, setShareLocation] = useState(true);
  const [notifyContacts, setNotifyContacts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const durationOptions = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: 'Custom', value: 45 }
  ];

  const intervalOptions = [
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every 1 hour', value: 60 },
    { label: 'Every 1 minute (Fast test)', value: 1 }
  ];

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      await startSession({
        title: 'Safety Journey',
        duration_minutes: Number(selectedDuration),
        checkin_interval_minutes: Number(selectedInterval),
        location_sharing_enabled: shareLocation ? 1 : 0
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-8">
        
        {/* Title Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Start a Safety Session
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Set your duration and check-in interval. We'll keep you on track.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Section 1: How long will you be out? */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            How long will you be out?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDuration(opt.value)}
                className={`py-3 px-3 rounded-2xl text-xs font-semibold border transition text-center flex items-center justify-center gap-1.5 ${
                  selectedDuration === opt.value
                    ? 'border-[#0D3833] bg-[#0D3833]/5 text-[#0D3833] font-bold ring-1 ring-[#0D3833]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  selectedDuration === opt.value ? 'border-[#0D3833]' : 'border-slate-300'
                }`}>
                  {selectedDuration === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#0D3833]"></span>}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Check-in interval */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Check-in interval
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedInterval(opt.value)}
                className={`py-3 px-4 rounded-2xl text-xs font-semibold border transition text-left flex items-center gap-2.5 ${
                  selectedInterval === opt.value
                    ? 'border-[#0D3833] bg-[#0D3833]/5 text-[#0D3833] font-bold ring-1 ring-[#0D3833]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  selectedInterval === opt.value ? 'border-[#0D3833]' : 'border-slate-300'
                }`}>
                  {selectedInterval === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#0D3833]"></span>}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Permission & Notification Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          
          {/* Share my live location */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">Share my live location</p>
                <p className="text-[11px] text-slate-400">Your trusted contacts will see your location during this session.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShareLocation(!shareLocation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareLocation ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                shareLocation ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Notify trusted contacts */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">Notify trusted contacts</p>
                <p className="text-[11px] text-slate-400">Alerts will be sent if you miss a check-in or trigger SOS.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyContacts(!notifyContacts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifyContacts ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifyContacts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

        </div>

        {/* Start Session CTA Button */}
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 rounded-full bg-[#0D3833] hover:bg-[#164E46] text-white font-extrabold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Initializing Session...' : 'Start Session'}
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}

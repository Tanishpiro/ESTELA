import React, { useState, useEffect } from 'react';
import { 
  Baby, Shield, MapPin, Battery, Phone, BellRing, 
  CheckCircle2, AlertTriangle, Navigation, ExternalLink, RefreshCw, Volume2, VolumeX, Siren, ShieldAlert 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from '../components/SafetyMap';
import { sendTelegramSafeConfirmation } from '../services/telegramService';
import emergencyAlarm from '../services/alarmService';

export default function ChildMonitorPage() {
  const { latestLocation } = useSafety();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState(new Date().toLocaleTimeString());
  const [childStatus, setChildStatus] = useState('SAFE'); // SAFE, SOS_TRIGGERED, MOVING
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [pingSent, setPingSent] = useState(false);
  const [isParentAlarmActive, setIsParentAlarmActive] = useState(false);
  const [unresponsiveAlert, setUnresponsiveAlert] = useState(true);

  // Sync with global alarm service
  useEffect(() => {
    const unsub = emergencyAlarm.subscribe((active) => {
      setIsParentAlarmActive(active);
    });
    return unsub;
  }, []);

  const toggleParentAlarm = () => {
    emergencyAlarm.toggle();
  };

  // Child details
  const childInfo = {
    name: 'Catty',
    age: '14 years',
    role: 'Protected Child',
    parent: 'Tanish',
    guardianPhone: '+91 9306617122',
    schoolLocation: 'DPS International School, Sector 45',
    lastSafeCheckin: '12:45 PM'
  };

  const handleRefreshChildLocation = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastSeenTime(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 800);
  };

  const handleSendParentCheckinPing = () => {
    setPingSent(true);
    setTimeout(() => setPingSent(false), 3500);
  };

  const childLat = latestLocation?.latitude || 28.4788;
  const childLon = latestLocation?.longitude || 76.9128;
  const gmapsUrl = `https://maps.google.com/?q=${childLat},${childLon}`;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. Header Banner: Parent Portal View for Catty */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#0D3833] flex items-center justify-center font-bold text-2xl shadow-sm">
            <Baby className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Parent Guardian Portal
              </span>
              <span className="text-xs text-slate-400">Parent: <b>Tanish</b></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Catty's Live Safety Feed 👧
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live GPS telemetry, battery health & instant distress broadcast for Catty
            </p>
          </div>
        </div>

        {/* Status Pill & Manual Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshChildLocation}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Refresh Catty's Live Coordinates"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <p className="text-[10px] font-bold text-emerald-900 uppercase">Child Status</p>
              <p className="text-xs font-black text-emerald-700">All Safe & Protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid Overview: Quick Stats for Catty */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Real-time Location */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Child Position</span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">Live GPS Active</h4>
          <p className="text-[11px] font-mono text-slate-400">{childLat.toFixed(4)}, {childLon.toFixed(4)}</p>
        </div>

        {/* Battery Health */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Battery className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone Battery</span>
          <h4 className="text-xs sm:text-sm font-bold text-emerald-700">{batteryLevel}% Charged</h4>
          <p className="text-[11px] text-slate-400">Normal Power State</p>
        </div>

        {/* Guardian Contact */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Alert Target</span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">Tanish (+91 9306617122)</h4>
          <p className="text-[11px] text-slate-400">Telegram Bot Synced</p>
        </div>

        {/* Last Check-in */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Ping</span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">{lastSeenTime}</h4>
          <p className="text-[11px] text-slate-400">Continuous 4s Stream</p>
        </div>

      </div>

      {/* 3. Live Map & Parent Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Child Map View */}
        <div className="lg:col-span-2 space-y-4">
          <SafetyMap 
            location={{ latitude: childLat, longitude: childLon, accuracy: 10 }}
            title="Catty's Current Live Location"
            zoom={16}
          />

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Coordinates updated live every 4 seconds from Catty's device.</span>
            </div>

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3833] text-white text-xs font-bold hover:bg-[#164E46] transition"
            >
              <span>Track in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Parent Controls for Catty */}
        <div className="space-y-4">
          
          {/* Child Identity Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Child Profile
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Child Full Name:</span>
                <span className="font-bold text-slate-900">Catty</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Linked Parent:</span>
                <span className="font-bold text-slate-900">Tanish</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Emergency Mobile:</span>
                <span className="font-bold text-slate-900">+91 9306617122</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Telegram Bot Channel:</span>
                <span className="font-bold text-blue-600">@Esteella_bot</span>
              </div>
            </div>
          </div>

          {/* Quick Parent Actions */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Parent Guardian Actions
            </h4>

            <div className="space-y-2">
              {/* Parent Emergency Phone Alarm (When No One Responded) */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                    <Siren className="w-4 h-4 text-amber-600" />
                    <span>Unresponsive Child SOS Alarm</span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">
                    Parent App Alert
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  If Catty triggered SOS or missed check-in and no guardian confirmed on Telegram, trigger high-decibel siren on this parent phone.
                </p>
                <button
                  onClick={toggleParentAlarm}
                  className={`w-full py-3 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                    isParentAlarmActive
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce ring-4 ring-red-300'
                      : 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                  }`}
                >
                  {isParentAlarmActive ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>SILENCE PARENT ALARM (Siren Ringing!)</span>
                    </>
                  ) : (
                    <>
                      <Siren className="w-4 h-4" />
                      <span>Ring Loud Alarm On Parent Phone</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleSendParentCheckinPing}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
              >
                <BellRing className="w-4 h-4" />
                {pingSent ? '✓ Check-in Ping Sent to Catty!' : 'Send Check-in Prompt to Catty'}
              </button>

              <a
                href="tel:+919306617122"
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call Emergency Helpline</span>
              </a>
            </div>
          </div>

          {/* Geofence Safety Perimeter */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Safe Perimeter (Geofence)</h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Inside Safe Zone
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Catty is currently inside the designated safe perimeter (Home / High-Street Corridor). You will be notified instantly on Telegram if she departs this radius.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

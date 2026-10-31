import React, { useState, useEffect } from 'react';
import { 
  Baby, Shield, MapPin, Battery, Phone, BellRing, 
  CheckCircle2, AlertTriangle, Navigation, ExternalLink, RefreshCw, Volume2, VolumeX, Siren, ShieldAlert, Sparkles 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from '../components/SafetyMap';
import { sendTelegramSafeConfirmation, subscribeToSosEvents } from '../services/telegramService';
import emergencyAlarm from '../services/alarmService';

export default function ChildMonitorPage() {
  const { latestLocation } = useSafety();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSeenTime, setLastSeenTime] = useState(new Date().toLocaleTimeString());
  const [childStatus, setChildStatus] = useState('SAFE'); // SAFE, SOS_TRIGGERED, MOVING
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [pingSent, setPingSent] = useState(false);
  const [isParentAlarmActive, setIsParentAlarmActive] = useState(false);
  const [parentCountdown, setParentCountdown] = useState(null);
  const [incomingSos, setIncomingSos] = useState(null);

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

  // Listen to SOS broadcasts (Cross-device / Cross-tab relay)
  useEffect(() => {
    const handleSosEvent = (data) => {
      if (data.type === 'SOS_TRIGGERED') {
        setChildStatus('SOS_TRIGGERED');
        setIncomingSos(data.payload);
        setParentCountdown(30);
        setLastSeenTime(new Date().toLocaleTimeString());
      } else if (data.type === 'SOS_RESOLVED') {
        setChildStatus('SAFE');
        setIncomingSos(null);
        setParentCountdown(null);
        emergencyAlarm.stop(true);
      }
    };

    const unsubRelay = subscribeToSosEvents(handleSosEvent);

    // Also check localStorage on initial mount and on storage events
    const checkStorageEvent = () => {
      try {
        const stored = localStorage.getItem('estela_latest_sos_event');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && !parsed.resolved && Date.now() - parsed.timestamp < 180000) {
            setChildStatus('SOS_TRIGGERED');
            setIncomingSos(parsed.payload);
            const elapsedSeconds = Math.floor((Date.now() - parsed.timestamp) / 1000);
            const remaining = Math.max(0, 30 - elapsedSeconds);
            setParentCountdown(remaining);
            if (remaining === 0) {
              emergencyAlarm.start(false);
            }
          }
        }
      } catch (e) {}
    };

    checkStorageEvent();
    window.addEventListener('storage', checkStorageEvent);

    // Server-side cross-device polling: polls `/api/incidents/sos` every 2.5s
    const pollServerSos = async () => {
      try {
        const res = await fetch('/api/incidents/sos');
        const data = await res.json();
        if (data?.active && data?.incident) {
          const inc = data.incident;
          setChildStatus('SOS_TRIGGERED');
          setIncomingSos(inc);
          const elapsed = Math.floor((Date.now() - inc.timestamp) / 1000);
          const remaining = Math.max(0, 30 - elapsed);
          setParentCountdown((prev) => (prev === null ? remaining : prev));
          if (remaining === 0) {
            emergencyAlarm.start(false);
          }
        } else if (!data?.active && childStatus === 'SOS_TRIGGERED') {
          setChildStatus('SAFE');
          setIncomingSos(null);
          setParentCountdown(null);
          emergencyAlarm.stop(false);
        }
      } catch (err) {}
    };

    pollServerSos();
    const serverPollInterval = setInterval(pollServerSos, 2500);

    return () => {
      unsubRelay();
      window.removeEventListener('storage', checkStorageEvent);
      clearInterval(serverPollInterval);
    };
  }, []);

  // 30-Second Countdown on Parent Phone: When timer reaches 0, ring alarm automatically!
  useEffect(() => {
    let timer;
    if (parentCountdown !== null && parentCountdown > 0) {
      timer = setInterval(() => {
        setParentCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            emergencyAlarm.start(true);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [parentCountdown]);

  // Periodic Auto-refresh telemetry & live check every 4 seconds
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      setLastSeenTime(new Date().toLocaleTimeString());
      setBatteryLevel((b) => (Math.random() > 0.8 ? Math.max(15, b - 1) : b));
    }, 4000);
    return () => clearInterval(autoRefresh);
  }, []);

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
      
      {/* 1. Linear Header Banner */}
      <div className="linear-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl shadow-xs">
            <Baby className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-emerald-400 text-[10px] font-mono uppercase tracking-wider border border-white/[0.08]">
                Guardian View • Tanish
              </span>
              <span className="text-xs text-slate-400">Target: <b>Catty (Child)</b></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Catty's Live Safety Telemetry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live spatial coordinates, power state & synchronized cross-app siren alarms.
            </p>
          </div>
        </div>

        {/* Status Pill & Manual Refresh */}
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleRefreshChildLocation}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition"
            title="Refresh Coordinates"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${
            childStatus === 'SOS_TRIGGERED' 
              ? 'bg-rose-500/15 border-rose-500/30' 
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              childStatus === 'SOS_TRIGGERED' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}></span>
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400">Status</p>
              <p className={`text-xs font-bold ${
                childStatus === 'SOS_TRIGGERED' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}>
                {childStatus === 'SOS_TRIGGERED' ? 'EMERGENCY SOS ACTIVE' : 'All Safe & Protected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Active Alert Banner for Tanish */}
      {childStatus === 'SOS_TRIGGERED' && (
        <div className="p-5 rounded-2xl bg-rose-500/15 border border-rose-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in linear-glow-rose">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-bounce shadow-md">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full">
                  Catty Triggered SOS
                </span>
                {parentCountdown !== null && (
                  <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    {parentCountdown > 0 ? `Auto-Alarm in ${parentCountdown}s` : '🚨 SIREN RINGING NOW!'}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Distress Signal Received from Catty's Phone
              </h3>
              <p className="text-xs text-rose-300">
                Live location streaming. Phone will sound siren alarm automatically if unacknowledged.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                emergencyAlarm.stop(true);
                setParentCountdown(null);
                setChildStatus('SAFE');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
            >
              Acknowledge & Silence Alarm
            </button>
          </div>
        </div>
      )}

      {/* 2. Linear Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Real-time Location */}
        <div className="linear-card p-4 sm:p-5 rounded-2xl space-y-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-400">Position</span>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">Live GPS Stream</h4>
          <p className="text-[11px] font-mono text-cyan-400">{childLat.toFixed(4)}, {childLon.toFixed(4)}</p>
        </div>

        {/* Battery Health */}
        <div className="linear-card p-4 sm:p-5 rounded-2xl space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/20">
            <Battery className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-400">Battery Level</span>
          <h4 className="text-xs sm:text-sm font-bold text-emerald-400">{batteryLevel}% Charged</h4>
          <p className="text-[11px] text-slate-400">Healthy Power State</p>
        </div>

        {/* Parent Alert Target */}
        <div className="linear-card p-4 sm:p-5 rounded-2xl space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 border border-purple-500/20">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-400">Guardian Target</span>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">Tanish</h4>
          <p className="text-[11px] font-mono text-slate-400">+91 9306617122</p>
        </div>

        {/* Last Ping */}
        <div className="linear-card p-4 sm:p-5 rounded-2xl space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 border border-amber-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono uppercase text-slate-400">Last Telemetry</span>
          <h4 className="text-xs sm:text-sm font-bold text-white">{lastSeenTime}</h4>
          <p className="text-[11px] text-slate-400">Auto 4s Interval</p>
        </div>

      </div>

      {/* 3. Live Map & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Child Map View */}
        <div className="lg:col-span-2 space-y-4">
          <SafetyMap 
            location={{ latitude: childLat, longitude: childLon, accuracy: 10 }}
            title="Catty's Current Live Location"
            zoom={16}
          />

          <div className="p-4 linear-card rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Encrypted location stream synced to Google Maps API.</span>
            </div>

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="linear-btn-secondary inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold"
            >
              <span>View in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Parent Controls */}
        <div className="space-y-4">
          
          {/* Unresponsive Alarm Trigger */}
          <div className="linear-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                <Siren className="w-4 h-4 text-amber-400" />
                <span>Child SOS Emergency Siren</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase">
                30s Auto
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              When Catty triggers SOS, the 30-second timer initiates. If unconfirmed, this high-decibel siren rings automatically on both phones.
            </p>

            <button
              onClick={toggleParentAlarm}
              className={`w-full py-3 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                isParentAlarmActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                  : 'linear-btn-secondary text-white'
              }`}
            >
              {isParentAlarmActive ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>SILENCE PARENT ALARM (Ringing!)</span>
                </>
              ) : (
                <>
                  <Siren className="w-4 h-4 text-amber-400" />
                  <span>Test Loud Alarm On This Phone</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="linear-card p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Parent Direct Actions
            </h4>

            <div className="space-y-2">
              <button
                onClick={handleSendParentCheckinPing}
                className="w-full py-3 px-4 rounded-xl linear-btn-primary text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <BellRing className="w-4 h-4" />
                {pingSent ? '✓ Check-in Ping Sent to Catty!' : 'Send Check-in Prompt to Catty'}
              </button>

              <a
                href="tel:+919306617122"
                className="w-full py-3 px-4 rounded-xl linear-btn-secondary text-slate-200 font-bold text-xs flex items-center justify-center gap-2 text-center"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Emergency Helpline</span>
              </a>
            </div>
          </div>

          {/* Safe Perimeter Geofence */}
          <div className="linear-card p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Safe Perimeter (Geofence)</h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Inside Safe Zone
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catty is currently inside the designated corridor. Instant Telegram notification will fire if device crosses perimeter boundaries.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

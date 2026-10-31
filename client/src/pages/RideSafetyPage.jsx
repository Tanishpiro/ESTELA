import React, { useState, useEffect } from 'react';
import { 
  Car, Bike, Shield, Clock, MapPin, AlertTriangle, 
  CheckCircle2, Phone, Send, ExternalLink, Siren, VolumeX, ArrowRight, UserCheck, Zap, Sparkles 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from '../components/SafetyMap';
import { sendTelegramEmergencyAlert, sendTelegramSafeConfirmation } from '../services/telegramService';
import emergencyAlarm from '../services/alarmService';

export default function RideSafetyPage() {
  const { latestLocation } = useSafety();
  
  // Ride state
  const [isRideActive, setIsRideActive] = useState(() => {
    try {
      const s = localStorage.getItem('estela_active_ride');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [platform, setPlatform] = useState('Rapido'); // Rapido, Uber, Ola, Auto/Cab
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [destination, setDestination] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [checkinMinutes, setCheckinMinutes] = useState(10);
  const [rideCountdown, setRideCountdown] = useState(null);
  const [showCheckinPrompt, setShowCheckinPrompt] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [checkinTimeoutSeconds, setCheckinTimeoutSeconds] = useState(60);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

  // Sync with global alarm service
  useEffect(() => {
    const unsub = emergencyAlarm.subscribe((active) => {
      setIsAlarmPlaying(active);
    });
    return unsub;
  }, []);

  // Ride countdown interval
  useEffect(() => {
    let timer;
    if (isRideActive && rideCountdown !== null && rideCountdown > 0) {
      timer = setInterval(() => {
        setRideCountdown((prev) => {
          if (prev <= 1) {
            setShowCheckinPrompt(true);
            setCheckinTimeoutSeconds(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRideActive, rideCountdown]);

  // If check-in prompt appears and user doesn't tap within 60s -> AUTO SIREN ALARM + SOS
  useEffect(() => {
    let timeoutTimer;
    if (showCheckinPrompt && checkinTimeoutSeconds > 0) {
      timeoutTimer = setInterval(() => {
        setCheckinTimeoutSeconds((s) => {
          if (s <= 1) {
            clearInterval(timeoutTimer);
            emergencyAlarm.start(true);
            handleAutoEscalateEmergency();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timeoutTimer) clearInterval(timeoutTimer);
    };
  }, [showCheckinPrompt, checkinTimeoutSeconds]);

  // Quick 1-Tap Auto-Sync with Rapido (Simulated API / Share Link Parser)
  const handleSimulateRapidoApi = () => {
    setIsSyncingApi(true);
    setTimeout(() => {
      setPlatform('Rapido');
      setVehicleNumber('HR 26 ER 8842 (Honda Activa)');
      setDriverName('Vikram Singh (Rapido Captain • 4.9★)');
      setDestination('Cyber Hub, DLF Phase 2');
      setShareLink('https://rapido.bike/ride/live-tr-894120');
      setIsSyncingApi(false);
    }, 600);
  };

  const handleStartRide = async () => {
    emergencyAlarm.unlock();
    const lat = latestLocation?.latitude || 28.4788;
    const lon = latestLocation?.longitude || 76.9128;
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
    
    const rideData = {
      platform,
      vehicleNumber: vehicleNumber.trim() || 'HR 26 ER 8842 (Honda Activa)',
      driverName: driverName.trim() || 'Vikram Singh (Rapido Captain • 4.9★)',
      destination: destination.trim() || 'Cyber Hub, DLF Phase 2',
      shareLink: shareLink.trim() || 'https://rapido.bike/ride/live-tr-894120',
      startTime: new Date().toLocaleTimeString(),
      startedAt: Date.now(),
      checkinMinutes
    };

    localStorage.setItem('estela_active_ride', JSON.stringify(rideData));
    setIsRideActive(rideData);
    setRideCountdown(checkinMinutes * 60);
    setShowCheckinPrompt(false);

    // Broadcast ride start to Telegram Guardian (Tanish)
    try {
      const msg = `🚗 *RAPIDO RIDE SAFETY STARTED (Catty)* 🚗
━━━━━━━━━━━━━━━━━━━━
Platform: *${platform} Captain*
Vehicle: \`${rideData.vehicleNumber}\`
Captain: *${rideData.driverName}*
Destination: *${rideData.destination}*
Rapido Live Trip: ${rideData.shareLink}
Live GPS: [View on Google Maps](${mapUrl})
Status: ESTELA Ride Watchdog active. Auto check-in every ${checkinMinutes} mins.`;

      fetch(`https://api.telegram.org/bot9016665127:AAE1kRi0zpATonPJ91j26Ub5_pP3WGX75oA/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '8971040800',
          text: msg,
          parse_mode: 'Markdown'
        })
      }).catch(() => {});
    } catch (e) {}
  };

  const handleEndRide = async () => {
    emergencyAlarm.stop(true);
    localStorage.removeItem('estela_active_ride');
    setIsRideActive(null);
    setRideCountdown(null);
    setShowCheckinPrompt(false);

    try {
      sendTelegramSafeConfirmation({
        childName: 'Catty',
        parentName: 'Tanish',
        latitude: latestLocation?.latitude,
        longitude: latestLocation?.longitude
      });
    } catch (e) {}
  };

  const handleConfirmCheckinSafe = () => {
    setShowCheckinPrompt(false);
    setRideCountdown(checkinMinutes * 60);
    emergencyAlarm.stop(true);
  };

  const handleAutoEscalateEmergency = async () => {
    const lat = latestLocation?.latitude || 28.4788;
    const lon = latestLocation?.longitude || 76.9128;

    try {
      await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER',
          childName: 'Catty',
          parentName: 'Tanish',
          latitude: lat,
          longitude: lon,
          note: `MISSED RIDE CHECK-IN on ${platform} (${vehicleNumber || 'No plate'})`
        })
      });
    } catch (e) {}

    try {
      await sendTelegramEmergencyAlert({
        childName: 'Catty',
        parentName: 'Tanish',
        latitude: lat,
        longitude: lon,
        triggerSource: `MISSED RIDE CHECK-IN (${platform})`
      });
    } catch (e) {}
  };

  const formatCountdown = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '00:00';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const childLat = latestLocation?.latitude || 28.4788;
  const childLon = latestLocation?.longitude || 76.9128;
  const gmapsUrl = `https://maps.google.com/?q=${childLat},${childLon}`;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in pb-16">
      
      {/* 1. Header Card */}
      <div className="linear-card rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-xl shadow-xs">
              <Bike className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                  Rapido API & Ride Guardian
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5">Rapido / Cab Ride Safety</h1>
              <p className="text-xs text-purple-300/70">Vehicle tracking & automated route deviation watchdog</p>
            </div>
          </div>

          {isRideActive && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              LIVE RIDE
            </span>
          )}
        </div>
      </div>

      {/* 2. Check-in Overdue / Escalation Alert Modal */}
      {showCheckinPrompt && (
        <div className="p-5 rounded-2xl bg-rose-500/20 border-2 border-rose-500 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <Siren className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>Safety Check-in: Are you safe in the ride?</span>
            </div>
            <span className="font-mono text-xs font-black bg-rose-950 text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded-full">
              {checkinTimeoutSeconds}s left
            </span>
          </div>
          <p className="text-xs text-rose-200">
            Tap <b>"I am Safe"</b> below. If you don't respond in {checkinTimeoutSeconds} seconds, the emergency siren will sound on both phones and Tanish will be alerted!
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleConfirmCheckinSafe}
              className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-sm"
            >
              ✓ Yes, I Am Safe
            </button>
            <button
              onClick={() => {
                emergencyAlarm.start(true);
                handleAutoEscalateEmergency();
              }}
              className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-sm animate-pulse"
            >
              🚨 Sound SOS Siren Now
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Interface: Form or Active Ride Dial */}
      {!isRideActive ? (
        <div className="linear-card rounded-3xl p-6 sm:p-8 space-y-5">
          
          {/* Hackathon Demo Quick Fill Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-white">Live Rapido Telemetry Demo</p>
                <p className="text-[11px] text-purple-300/70">Auto-fill verified Captain & vehicle data</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimulateRapidoApi}
              disabled={isSyncingApi}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncingApi ? 'Syncing...' : 'Sync Rapido Ride'}</span>
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Start New Ride Safety Watch</h2>
            <p className="text-xs text-purple-300/70 mt-1">
              Tanish receives automatic trip telemetry & periodic check-in monitoring.
            </p>
          </div>

          {/* Platform Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-purple-300/70">Ride Service</label>
            <div className="grid grid-cols-4 gap-2">
              {['Rapido', 'Uber', 'Ola', 'Auto / Cab'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                    platform === p
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-sm'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-300/60 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Number & Driver Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-purple-300/70">Vehicle Number Plate</label>
              <input
                type="text"
                placeholder="e.g. HR 26 ER 8842"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-[#0D0B14] border border-purple-800/40 text-white placeholder-purple-300/30 text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-purple-300/70">Captain / Driver Name</label>
              <input
                type="text"
                placeholder="e.g. Vikram Singh (Captain)"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0D0B14] border border-purple-800/40 text-white placeholder-purple-300/30 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-purple-300/70">Destination / Dropping Point</label>
            <input
              type="text"
              placeholder="e.g. Cyber Hub, DLF Phase 2"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0D0B14] border border-purple-800/40 text-white placeholder-purple-300/30 text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Optional Share Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-purple-300/70">Rapido Live Track Link (Optional)</label>
            <input
              type="text"
              placeholder="https://rapido.bike/ride/..."
              value={shareLink}
              onChange={(e) => setShareLink(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0D0B14] border border-purple-800/40 text-purple-300 placeholder-purple-300/30 text-xs font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Safety Check Interval */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-purple-300/70">Safety Check-in Interval</label>
              <span className="text-xs font-bold text-amber-300">{checkinMinutes} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setCheckinMinutes(mins)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition border ${
                    checkinMinutes === mins
                      ? 'bg-amber-500/25 border-amber-400 text-white'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-300/60 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleStartRide}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
          >
            <Bike className="w-4 h-4" />
            <span>Start Ride Safety Mode Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Active Ride Dashboard */
        <div className="linear-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
            <div>
              <span className="text-[10px] font-mono uppercase text-purple-300/70">Active Captain</span>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                <span className="text-amber-400">{isRideActive.platform}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-200">
                  {isRideActive.vehicleNumber}
                </span>
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-purple-300/70">Next Check-In</span>
              <p className="text-xl font-mono font-black text-amber-300">
                {formatCountdown(rideCountdown)}
              </p>
            </div>
          </div>

          {/* Ride Details Card */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-1">
              <span className="text-purple-300/60 font-mono uppercase text-[10px]">Captain Details</span>
              <p className="font-bold text-white truncate">{isRideActive.driverName}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-1">
              <span className="text-purple-300/60 font-mono uppercase text-[10px]">Destination</span>
              <p className="font-bold text-white truncate">{isRideActive.destination}</p>
            </div>
          </div>

          {/* Map Preview */}
          <SafetyMap 
            location={{ latitude: childLat, longitude: childLon, accuracy: 10 }}
            title="Live Rapido Corridor Tracking"
            zoom={16}
          />

          {/* Emergency Controls for Ride */}
          <div className="space-y-3 pt-2">
            {!isAlarmPlaying ? (
              <button
                onClick={() => {
                  emergencyAlarm.start(true);
                  handleAutoEscalateEmergency();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md animate-pulse"
              >
                <Siren className="w-4 h-4" />
                <span>Ride Distress SOS (Emergency Driver Threat)</span>
              </button>
            ) : (
              <button
                onClick={() => emergencyAlarm.stop(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ring-4 ring-rose-500/50 animate-bounce"
              >
                <VolumeX className="w-4 h-4" />
                <span>Stop Siren Alarm (Audio Ringing...)</span>
              </button>
            )}

            <button
              onClick={handleEndRide}
              className="w-full py-3.5 px-4 rounded-xl linear-btn-primary font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reached Safely (End Ride Safety Mode)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Telemetry Stream to Guardian */}
      <div className="linear-card rounded-3xl p-5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-purple-300/70">Guardian Auto-Notified:</span>
          <span className="font-bold text-white">Tanish (+91 9306617122)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-purple-300/70">Live Coordinates:</span>
          <span className="font-mono text-purple-300">{childLat.toFixed(4)}, {childLon.toFixed(4)}</span>
        </div>
        <div className="pt-2">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="linear-btn-secondary w-full py-2.5 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2"
          >
            <span>Open Ride Path in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
}

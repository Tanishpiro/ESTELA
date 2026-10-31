import React, { useState, useEffect } from 'react';
import { 
  Baby, Shield, AlertTriangle, Siren, VolumeX, CheckCircle2, 
  MapPin, Clock, Phone, Send, ExternalLink, ShieldCheck, Heart 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { sendTelegramEmergencyAlert, sendTelegramSafeConfirmation } from '../services/telegramService';
import emergencyAlarm from '../services/alarmService';

export default function ChildAppPage() {
  const { latestLocation } = useSafety();
  const [sosActive, setSosActive] = useState(false);
  const [countdown30s, setCountdown30s] = useState(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [parentAckStatus, setParentAckStatus] = useState('WAITING'); // WAITING, CONFIRMED
  const [isSending, setIsSending] = useState(false);

  // Sync with global alarm service
  useEffect(() => {
    const unsub = emergencyAlarm.subscribe((active) => {
      setIsSirenPlaying(active);
    });
    return unsub;
  }, []);

  // 30-Second Countdown Timer when SOS is activated by Catty
  useEffect(() => {
    let timer;
    if (sosActive && countdown30s !== null && countdown30s > 0 && !isSirenPlaying) {
      timer = setInterval(() => {
        setCountdown30s((c) => {
          if (c <= 1) {
            clearInterval(timer);
            // 30 seconds elapsed and no response! Ring loud alarm on Catty's phone and Parent's phone!
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
  }, [sosActive, countdown30s, isSirenPlaying]);

  const handleTriggerCattySos = async () => {
    emergencyAlarm.unlock(); // Ensure audio context is ready on user tap
    setIsSending(true);
    setSosActive(true);
    setCountdown30s(30);
    setParentAckStatus('WAITING');

    const lat = latestLocation?.latitude || 28.4788;
    const lon = latestLocation?.longitude || 76.9128;

    // 1. Post to Server Relay endpoint so Tanish's parent phone immediately triggers
    try {
      await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER',
          childName: 'Catty',
          parentName: 'Tanish',
          latitude: lat,
          longitude: lon
        })
      });
    } catch (e) {}

    // 2. Dispatch Telegram alert directly to Tanish
    try {
      await sendTelegramEmergencyAlert({
        childName: 'Catty',
        parentName: 'Tanish',
        userName: 'Catty',
        latitude: lat,
        longitude: lon,
        triggerSource: "Catty's Child SOS Screen"
      });
    } catch (e) {}

    setIsSending(false);
  };

  const handleResolveCattySafe = async () => {
    emergencyAlarm.stop(true);
    setSosActive(false);
    setCountdown30s(null);
    setParentAckStatus('CONFIRMED');

    // Notify server to resolve
    try {
      await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE' })
      });
    } catch (e) {}

    // Send Telegram reassurance that Catty is safe
    try {
      await sendTelegramSafeConfirmation({
        childName: 'Catty',
        parentName: 'Tanish',
        latitude: latestLocation?.latitude,
        longitude: latestLocation?.longitude
      });
    } catch (e) {}
  };

  const childLat = latestLocation?.latitude || 28.4788;
  const childLon = latestLocation?.longitude || 76.9128;
  const gmapsUrl = `https://maps.google.com/?q=${childLat},${childLon}`;

  return (
    <div className="max-w-md mx-auto space-y-5 animate-in fade-in pb-12">
      
      {/* 1. Catty Child Profile Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black text-xl shadow-xs">
            👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                Child Device
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">Catty's Phone</h1>
            <p className="text-xs text-slate-500">Linked to Parent: <b>Tanish</b> (+91 9306617122)</p>
          </div>
        </div>
      </div>

      {/* 2. Main SOS Trigger Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm text-center space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">Emergency SOS</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tap button below to alert Tanish with live GPS coordinates.
          </p>
        </div>

        {/* Large One-Tap SOS Button for Catty */}
        <div className="flex justify-center py-2">
          {!sosActive ? (
            <button
              onClick={handleTriggerCattySos}
              disabled={isSending}
              className="w-44 h-44 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-3xl shadow-xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 border-6 border-white sos-pulse-ring cursor-pointer"
            >
              <span>{isSending ? 'SENDING' : 'SOS'}</span>
              <span className="text-[11px] font-bold tracking-normal uppercase opacity-90 mt-1">
                {isSending ? 'Alerting...' : 'Tap for Help'}
              </span>
            </button>
          ) : (
            <div className="w-44 h-44 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-2xl border-4 border-red-200 animate-pulse">
              <Siren className="w-10 h-10 mb-1" />
              <span className="text-base font-black uppercase">SOS SENT</span>
              <span className="text-[11px] font-bold opacity-90">Tanish Alerted</span>
            </div>
          )}
        </div>

        {/* 3. Live 30-Second Alarm Countdown Box */}
        {sosActive && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-left space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-amber-600 animate-bounce" />
                <span className="text-xs font-black text-amber-950 uppercase">
                  Auto-Escalation Timer
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-sm font-mono">
                {countdown30s > 0 ? `${countdown30s}s` : '0s - RINGING!'}
              </span>
            </div>

            <p className="text-xs text-amber-800 leading-relaxed">
              {countdown30s > 0 ? (
                <>
                  SOS notification sent to Tanish. If no guardian confirms within <b>{countdown30s} seconds</b>, the loud siren will automatically ring on Catty's phone and Tanish's phone.
                </>
              ) : (
                <>
                  🚨 <b>30 seconds passed without parent response!</b> The emergency siren alarm is now ringing loud on both phones!
                </>
              )}
            </p>

            {/* Loud Alarm Ringing Action Button */}
            {!isSirenPlaying ? (
              <button
                onClick={() => emergencyAlarm.start(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm animate-pulse"
              >
                <Siren className="w-4 h-4" />
                <span>Ring Loud Alarm Now On Catty & Parent Phone</span>
              </button>
            ) : (
              <button
                onClick={() => emergencyAlarm.stop(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ring-4 ring-red-300 animate-bounce"
              >
                <VolumeX className="w-4 h-4" />
                <span>STOP LOUD SIREN ALARM (Ringing Now!)</span>
              </button>
            )}
          </div>
        )}

        {/* 4. "I Am Safe" Resolution Button */}
        {sosActive && (
          <button
            onClick={handleResolveCattySafe}
            className="w-full py-3.5 rounded-2xl bg-[#0D3833] hover:bg-[#164E46] text-white font-black text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>I Am Safe Now (Cancel Alert)</span>
          </button>
        )}
      </div>

      {/* 5. Catty Location & Guardian Contact */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Catty Device Status
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Live GPS Coordinates:</span>
            <span className="font-mono font-bold text-slate-900">{childLat.toFixed(4)}, {childLon.toFixed(4)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Guardian Parent:</span>
            <span className="font-bold text-slate-900">Tanish</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Guardian Mobile:</span>
            <a href="tel:+919306617122" className="font-bold text-emerald-700 underline">+91 9306617122</a>
          </div>
        </div>

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200 mt-2"
        >
          <span>View Catty Location on Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}

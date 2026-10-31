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
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsub = emergencyAlarm.subscribe((active) => {
      setIsSirenPlaying(active);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let timer;
    if (sosActive && countdown30s !== null && countdown30s > 0 && !isSirenPlaying) {
      timer = setInterval(() => {
        setCountdown30s((c) => {
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
  }, [sosActive, countdown30s, isSirenPlaying]);

  const handleTriggerCattySos = async () => {
    emergencyAlarm.unlock();
    setIsSending(true);
    setSosActive(true);
    setCountdown30s(30);

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
          longitude: lon
        })
      });
    } catch (e) {}

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

    try {
      await fetch('/api/incidents/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE' })
      });
    } catch (e) {}

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
    <div className="max-w-md mx-auto space-y-5 animate-in fade-in pb-16">
      
      {/* 1. Soothing Lavender Child Header */}
      <div className="linear-card rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xl">
            👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                Protected Child Device
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">Catty's Phone</h1>
            <p className="text-xs text-purple-300/70">Parent: <b className="text-purple-300">Tanish</b> (+91 9306617122)</p>
          </div>
        </div>
      </div>

      {/* 2. Soothing Lavender Main SOS Box */}
      <div className="linear-card rounded-3xl p-6 sm:p-8 text-center space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Emergency SOS</h2>
          <p className="text-xs text-purple-300/70 mt-1">
            Tap button below to immediately broadcast coordinates to Tanish.
          </p>
        </div>

        {/* Large SOS Button for Catty */}
        <div className="flex justify-center py-2">
          {!sosActive ? (
            <button
              onClick={handleTriggerCattySos}
              disabled={isSending}
              className="w-44 h-44 rounded-full bg-gradient-to-b from-rose-500 to-red-700 text-white font-black text-3xl shadow-2xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-rose-300/40 sos-pulse-ring cursor-pointer"
            >
              <span>{isSending ? 'SENDING' : 'SOS'}</span>
              <span className="text-[10px] font-mono font-semibold tracking-normal uppercase opacity-90 mt-1">
                {isSending ? 'Alerting...' : 'Tap for Help'}
              </span>
            </button>
          ) : (
            <div className="w-44 h-44 rounded-full bg-gradient-to-b from-red-600 to-rose-800 text-white flex flex-col items-center justify-center shadow-2xl border-4 border-red-400/50 animate-pulse">
              <Siren className="w-10 h-10 mb-1 text-white" />
              <span className="text-base font-black uppercase tracking-wider">SOS SENT</span>
              <span className="text-[10px] font-mono opacity-90 text-rose-200">Tanish Alerted</span>
            </div>
          )}
        </div>

        {/* 3. Live 30-Second Alarm Countdown Box */}
        {sosActive && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Siren className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                  Auto-Escalation Timer
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                {countdown30s > 0 ? `${countdown30s}s` : '0s - RINGING!'}
              </span>
            </div>

            <p className="text-xs text-purple-200/90 leading-relaxed">
              {countdown30s > 0 ? (
                <>
                  SOS notification sent to Tanish. If unconfirmed within <b className="text-amber-400">{countdown30s} seconds</b>, the loud siren will automatically ring on Catty's phone and Tanish's phone.
                </>
              ) : (
                <>
                  🚨 <b>30 seconds passed without parent response!</b> The emergency siren alarm is now ringing loud on both phones!
                </>
              )}
            </p>

            {/* Siren Control Button */}
            {!isSirenPlaying ? (
              <button
                onClick={() => emergencyAlarm.start(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm animate-pulse"
              >
                <Siren className="w-4 h-4" />
                <span>Ring Loud Alarm Now On Both Phones</span>
              </button>
            ) : (
              <button
                onClick={() => emergencyAlarm.stop(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ring-4 ring-rose-500/40 animate-bounce"
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
            className="w-full py-3.5 rounded-xl linear-btn-primary font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Am Safe Now (Cancel Alert)</span>
          </button>
        )}
      </div>

      {/* 5. Catty Location Status */}
      <div className="linear-card rounded-3xl p-5 space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300/70">
          Device Telemetry
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-purple-300/70">Live GPS Coordinates:</span>
            <span className="font-mono font-bold text-purple-300">{childLat.toFixed(4)}, {childLon.toFixed(4)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-purple-300/70">Guardian Parent:</span>
            <span className="font-bold text-white">Tanish</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-purple-300/70">Guardian Phone:</span>
            <a href="tel:+919306617122" className="font-mono font-bold text-purple-300 underline">+91 9306617122</a>
          </div>
        </div>

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="linear-btn-secondary inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-xs font-bold mt-2"
        >
          <span>View Coordinates in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, X, ShieldAlert, CheckCircle2, Phone, BellRing, 
  MessageSquare, Send, Check, ShieldCheck, Clock, ShieldX, Volume2, VolumeX, Siren 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { useAuth } from '../context/AuthContext';
import { sendTelegramEmergencyAlert, processGuardianAcknowledgment } from '../services/telegramService';
import emergencyAlarm from '../services/alarmService';

export default function SosButton({ size = 'large' }) {
  const { triggerSOS, activeIncident, resolveIncident, contacts, latestLocation } = useSafety();
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isTriggering, setIsTriggering] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  React.useEffect(() => {
    let timer;
    if (showConfirmModal && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (showConfirmModal && countdown === 0 && !isTriggering && !sosResult) {
      executeSos();
    }
    return () => clearTimeout(timer);
  }, [showConfirmModal, countdown]);

  const handleOpenSos = () => {
    setErrorMsg(null);
    setSosResult(null);
    setGuardianAck(null);
    setTelegramStatus(null);
    setCountdown(3);
    setShowConfirmModal(true);
  };

  const executeSos = async () => {
    try {
      setIsTriggering(true);
      const nowTs = Date.now();
      setIncidentCreatedAt(nowTs);
      setGuardianAck(null);
      const res = await triggerSOS(nowTs);
      setSosResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch SOS alert');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleCancel = () => {
    stopSirenAlarm();
    setShowConfirmModal(false);
    setCountdown(3);
    setIsTriggering(false);
  };

  const handleManualResolve = async () => {
    stopSirenAlarm();
    try {
      const incidentId = activeIncident?.id || 'sos_current';
      await resolveIncident(incidentId, 'User clicked I Am Now Safe');
    } catch (e) {
      console.warn('Error resolving incident:', e);
    }
    setShowConfirmModal(false);
    setSosResult(null);
  };

  const [telegramStatus, setTelegramStatus] = useState(null);
  const [guardianAck, setGuardianAck] = useState(null);
  const [incidentCreatedAt, setIncidentCreatedAt] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [autoAlarmCountdown, setAutoAlarmCountdown] = useState(null);

  // Subscribe to shared alarm service
  useEffect(() => {
    const unsub = emergencyAlarm.subscribe((active) => {
      setIsSirenActive(active);
    });
    return unsub;
  }, []);

  const startSirenAlarm = () => {
    emergencyAlarm.start();
  };

  const stopSirenAlarm = () => {
    emergencyAlarm.stop();
  };

  useEffect(() => {
    return () => stopSirenAlarm();
  }, []);

  // 30-Second Automatic Alarm Timer after SOS message dispatched
  useEffect(() => {
    let countdownInterval;
    if (sosResult && !guardianAck?.accepted && !isSirenActive) {
      setAutoAlarmCountdown(30);
      countdownInterval = setInterval(() => {
        setAutoAlarmCountdown((prev) => {
          if (prev === null) return 30;
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // 30 seconds elapsed and no response from parent -> Ring alarm across child and parent
            emergencyAlarm.start(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (guardianAck?.accepted || isSirenActive) {
      setAutoAlarmCountdown(null);
      if (guardianAck?.accepted) {
        emergencyAlarm.stop(true);
      }
    }
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [sosResult, guardianAck?.accepted, isSirenActive]);

  // Poll for parent acknowledgment when alert is active
  React.useEffect(() => {
    let pollInterval;
    if (sosResult) {
      const checkAck = async () => {
        const ack = await processGuardianAcknowledgment(incidentCreatedAt);
        if (ack) {
          setGuardianAck(ack);
          if (ack.accepted) {
            emergencyAlarm.stop(true);
          }
        }
      };
      checkAck();
      pollInterval = setInterval(checkAck, 1500);
    }
    return () => clearInterval(pollInterval);
  }, [sosResult, incidentCreatedAt]);

  const handleSendTelegram = async () => {
    try {
      setTelegramStatus('sending');
      const lat = latestLocation?.latitude || 28.4788;
      const lon = latestLocation?.longitude || 76.9128;
      const nowTs = incidentCreatedAt || Date.now();
      const res = await sendTelegramEmergencyAlert({
        userName: user?.name || 'Alex Chen',
        phone: user?.phone || '',
        latitude: lat,
        longitude: lon,
        accuracy: latestLocation?.accuracy || 10,
        triggerSource: 'User Triggered SOS',
        alertTimestamp: nowTs
      });
      if (res.success) {
        setTelegramStatus('sent');
      } else {
        setTelegramStatus('error');
      }
    } catch {
      setTelegramStatus('error');
    }
  };

  // Helper to open real phone SMS app pre-filled with location link & primary phone number
  const handleOpenNativeSms = () => {
    const primary = contacts.find(c => c.role === 'primary') || contacts[0];
    const phone = primary?.phone || '+91 9306617122';
    const cleanPhone = phone.replace(/\s+/g, '');
    const lat = latestLocation?.latitude || 28.4788;
    const lon = latestLocation?.longitude || 76.9128;
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
    const smsBody = encodeURIComponent(
      `🚨 EMERGENCY SOS from ESTELA: ${user?.name || 'I'} need immediate help! Live Location: ${mapUrl}`
    );
    window.location.href = `sms:${cleanPhone}?body=${smsBody}`;
  };

  return (
    <>
      {size === 'compact' && (
        <button
          onClick={handleOpenSos}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition border border-red-200/80"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          SOS
        </button>
      )}

      {size === 'bar' && (
        <button
          onClick={handleOpenSos}
          className="w-full py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200/80 text-left flex items-center justify-between transition group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xs">
              SOS
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Emergency SOS</p>
              <p className="text-[11px] text-slate-400">Tap to instantly alert contacts</p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 group-hover:translate-x-0.5 transition">
            Trigger Alert →
          </span>
        </button>
      )}

      {size === 'large' && (
        <div className="flex flex-col items-center">
          <button
            onClick={handleOpenSos}
            aria-label="Emergency SOS Button"
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-3xl sm:text-4xl shadow-xl flex flex-col items-center justify-center transition-transform active:scale-95 border-4 border-white sos-pulse-ring cursor-pointer"
          >
            <span>SOS</span>
            <span className="text-[11px] font-semibold tracking-normal uppercase opacity-90 mt-1">
              Emergency
            </span>
          </button>
          <p className="text-xs text-slate-400 font-medium mt-3 text-center">
            Tap for instant emergency dispatch with live GPS
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 overflow-hidden relative m-auto"
            style={{ margin: 'auto' }}
          >
            
            {!sosResult && !errorMsg && (
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <ShieldAlert className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Trigger Emergency SOS?
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xs mx-auto">
                  ESTELA will immediately broadcast your GPS location and emergency notification to your trusted contacts.
                </p>

                <div className="my-6">
                  <div className="inline-flex items-center justify-center w-18 h-18 rounded-full border-4 border-red-500 text-3xl font-black text-red-500 bg-red-50">
                    {countdown}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Dispatching automatically in {countdown}s
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={handleCancel}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel Alert
                  </button>
                  <button
                    onClick={executeSos}
                    disabled={isTriggering}
                    className="w-full py-3 px-4 rounded-xl bg-red-500 text-white font-bold text-xs sm:text-sm hover:bg-red-600 transition shadow-sm"
                  >
                    {isTriggering ? 'Sending...' : 'Send NOW'}
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">SOS Dispatch Failed</h3>
                <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={executeSos}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold"
                  >
                    Retry SOS
                  </button>
                </div>
              </div>
            )}

            {sosResult && (
              <div className="py-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold text-red-600 uppercase tracking-wider text-xs">
                      Alert Dispatched
                    </span>
                  </div>
                  <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mb-4">
                  <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Emergency Broadcast Dispatched
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Emergency notification with live GPS coordinates has been transmitted to your Telegram guardian bot (@Esteella_bot).
                  </p>
                </div>

                {/* Parent / Guardian Responsibility Confirmation Tag */}
                <div className={`p-4 rounded-2xl border mb-4 transition-all duration-300 ${
                  guardianAck?.accepted
                    ? 'bg-emerald-50 border-emerald-200'
                    : guardianAck?.rejected
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        guardianAck?.accepted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : guardianAck?.rejected 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-blue-100 text-blue-600 animate-pulse'
                      }`}>
                        {guardianAck?.accepted ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        ) : guardianAck?.rejected ? (
                          <ShieldX className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Parent Responsibility Status (Tanish)
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {guardianAck?.accepted 
                            ? `Accepted by Tanish for child catty via Telegram`
                            : guardianAck?.rejected
                            ? `Declined / Unable to respond (Tanish)`
                            : 'Waiting for parent Tanish to confirm on Telegram...'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      guardianAck?.accepted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : guardianAck?.rejected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {guardianAck?.accepted ? 'Responsibility Taken ✓' : guardianAck?.rejected ? 'Rejected / Unable' : 'Pending Response'}
                    </span>
                  </div>
                </div>

                {/* Emergency Phone Siren Alarm Option (With 30s Auto Escalation) */}
                <div className="mb-4">
                  {autoAlarmCountdown !== null && autoAlarmCountdown > 0 && !isSirenActive && (
                    <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs animate-pulse">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Auto-Escalation to Loud Alarm:</span>
                      </div>
                      <span className="font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono">
                        {autoAlarmCountdown}s
                      </span>
                    </div>
                  )}

                  {!isSirenActive ? (
                    <button
                      onClick={startSirenAlarm}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm animate-pulse"
                    >
                      <Siren className="w-4 h-4" />
                      Sound Loud Alarm Now (Rings Child & Parent App)
                    </button>
                  ) : (
                    <button
                      onClick={stopSirenAlarm}
                      className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg ring-4 ring-red-300 animate-bounce"
                    >
                      <VolumeX className="w-4 h-4" />
                      Stop Siren Alarm (Audio Playing On Both Apps...)
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Automatically triggers on both phones in 30 seconds if parent hasn't confirmed
                  </p>
                </div>

                {/* Direct Telegram & Mobile Action Buttons */}
                <div className="space-y-2 mb-4">
                  <button
                    onClick={handleSendTelegram}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {telegramStatus === 'sending' ? 'Broadcasting to Telegram...' : telegramStatus === 'sent' ? '✓ Re-Sent to Telegram (@Esteella_bot)' : 'Re-send Alert to Telegram'}
                  </button>

                  <button
                    onClick={handleOpenNativeSms}
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Open Native Messages App (Direct SMS)
                  </button>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {sosResult.notifiedContacts?.map((contact) => (
                    <div key={contact.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{contact.name}</p>
                        <p className="text-slate-400 text-[11px]">{contact.phone}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                        Delivered
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleManualResolve}
                  className="w-full py-3 rounded-xl bg-[#0D3833] text-white font-bold text-xs sm:text-sm hover:bg-[#164E46] transition shadow-sm"
                >
                  I Am Now Safe (Resolve Alert)
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

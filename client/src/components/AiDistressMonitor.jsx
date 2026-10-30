import React, { useState } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export default function AiDistressMonitor() {
  const {
    aiMonitoring,
    speechRecognitionSupported,
    toggleAiMonitoring,
    distressPhrases,
    handleDistressTrigger,
    lastDetectedPhrase
  } = useSafety();

  const [simulatedPhrase, setSimulatedPhrase] = useState(distressPhrases[0] || 'help me');
  const [showSimNotice, setShowSimNotice] = useState(false);

  const handleSimulate = async () => {
    setShowSimNotice(true);
    await handleDistressTrigger(simulatedPhrase, true);
    setTimeout(() => setShowSimNotice(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#101C2C] text-sm">AI Distress Audio Monitor</h4>
            <p className="text-xs text-slate-500">
              {speechRecognitionSupported ? 'Vosk / Web Speech Integration' : 'Demo Simulation Mode'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => toggleAiMonitoring(!aiMonitoring)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            aiMonitoring ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              aiMonitoring ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Monitoring Status Badge */}
      <div className="mb-4">
        {aiMonitoring ? (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
            </span>
            <span className="font-semibold">Microphone Listening (App Active):</span>
            <span className="text-indigo-700">Awaiting distress voice triggers...</span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Voice detection is currently inactive. Enable to listen for configured trigger phrases while the app is open.
          </p>
        )}
      </div>

      {/* Active Trigger Phrases */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Configured Distress Phrases:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {distressPhrases.map((phrase, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              "{phrase}"
            </span>
          ))}
        </div>
      </div>

      {/* Simulation Section */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">Test AI Recognition:</span>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
            Clearly Labelled Simulation
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={simulatedPhrase}
            onChange={(e) => setSimulatedPhrase(e.target.value)}
            className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-800"
          >
            {distressPhrases.map((p, i) => (
              <option key={i} value={p}>"{p}"</option>
            ))}
          </select>
          <button
            onClick={handleSimulate}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
          >
            Simulate Voice Trigger
          </button>
        </div>

        {showSimNotice && (
          <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-indigo-600" />
            Distress event registered: "{simulatedPhrase}". Safety escalation logged.
          </div>
        )}
      </div>
    </div>
  );
}

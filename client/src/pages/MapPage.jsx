import React, { useState } from 'react';
import { MapPin, Navigation, Share2, Compass, Layers, Shield } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from '../components/SafetyMap';

export default function MapPage() {
  const { latestLocation, contacts } = useSafety();
  const [shareActive, setShareActive] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0D3833] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Location Sharing & Live Map</h2>
            <p className="text-xs text-slate-400">
              Sharing active with {contacts.length} trusted contacts
            </p>
          </div>
        </div>

        {/* Toggle Live Sharing */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Live GPS Sharing</span>
          <button
            type="button"
            onClick={() => setShareActive(!shareActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              shareActive ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              shareActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map View */}
        <div className="lg:col-span-2">
          <SafetyMap location={latestLocation} title="Your Live Location" zoom={16} />
        </div>

        {/* Right Info Cards */}
        <div className="space-y-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Telemetry Status
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Compass className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Current Position</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {latestLocation
                      ? `${latestLocation.latitude.toFixed(5)}, ${latestLocation.longitude.toFixed(5)}`
                      : 'Acquiring GPS fix...'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Accuracy Radius</p>
                  <p className="text-[11px] text-slate-500">
                    ±{Math.round(latestLocation?.accuracy || 10)} meters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Viewers */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Authorized Guardians
            </h4>
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0D3833] text-white text-[10px] font-bold flex items-center justify-center uppercase">
                      {c.name.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-slate-800">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">Authorized</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

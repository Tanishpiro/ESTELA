import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Share2, Compass, Layers, Shield, 
  Search, Store, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Clock, ExternalLink 
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import SafetyMap from '../components/SafetyMap';
import { searchDestinationPlaces, computeSafeRoutes } from '../services/safeRouteService';

export default function MapPage() {
  const { latestLocation, contacts } = useSafety();
  const [shareActive, setShareActive] = useState(true);

  // Destination & Safe Route State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('route_safe');

  const originLat = latestLocation?.latitude || 28.4788;
  const originLon = latestLocation?.longitude || 76.9128;

  // Handle Search Input
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchDestinationPlaces(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute Safe Routes when Destination is Selected
  const handleSelectDestination = (dest) => {
    setSelectedDestination(dest);
    setSearchQuery(dest.name);
    setSearchResults([]);

    const routes = computeSafeRoutes(
      { lat: originLat, lon: originLon },
      { lat: dest.lat, lon: dest.lon }
    );
    setAvailableRoutes(routes);
    setSelectedRouteId('route_safe');
  };

  // Quick preset destinations for one-click testing
  const presets = [
    { name: 'City Metro Station & Plaza', lat: originLat + 0.015, lon: originLon + 0.018 },
    { name: 'Central Commercial Market', lat: originLat + 0.022, lon: originLon + 0.009 },
    { name: 'University Campus Gate', lat: originLat - 0.016, lon: originLon + 0.014 }
  ];

  const currentRoute = availableRoutes.find(r => r.id === selectedRouteId) || availableRoutes[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. Destination Input & Smart Safe Navigation Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0D3833] flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Safe Route Navigator</h2>
              <p className="text-xs text-slate-500">
                Routes dynamically optimized by open utilities, 24/7 pharmacies & well-lit shops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Live GPS:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Active ({Math.round(latestLocation?.accuracy || 12)}m)
            </span>
          </div>
        </div>

        {/* Search Bar for Destination */}
        <div className="relative">
          <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#0D3833] focus-within:bg-white transition">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination (e.g. Metro Station, Office, Cafe, Market)..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {isSearching && (
              <span className="text-[11px] text-slate-400 animate-pulse font-medium">Searching...</span>
            )}
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 divide-y divide-slate-100 z-50 overflow-hidden">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDestination(item)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">Quick destinations:</span>
          {presets.map((preset, i) => (
            <button
              key={i}
              onClick={() => handleSelectDestination(preset)}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-[#0D3833] text-slate-600 text-[11px] font-medium transition flex-shrink-0"
            >
              📍 {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Map Container with Active Safe Route & Open Utilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map View */}
        <div className="lg:col-span-2 space-y-4">
          <SafetyMap 
            location={latestLocation} 
            title="Your Position" 
            zoom={15} 
            destination={selectedDestination}
            activeRoute={currentRoute}
            utilities={currentRoute ? currentRoute.utilities : []}
          />

          {/* Route Selector Cards (Safe Route vs Shortest Route) */}
          {availableRoutes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableRoutes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? route.isSafest
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500'
                          : 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {route.isSafest ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600" />
                          )}
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{route.name}</h4>
                        </div>
                        <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-black uppercase ${
                          route.isSafest ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {route.tag}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{route.estimatedMins} min</span>
                        <p className="text-[10px] text-slate-500">{route.distanceKm} km</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Store className="w-3.5 h-3.5 text-slate-500" />
                        {route.openUtilitiesCount} Open Utilities
                      </span>
                      <span className={`font-bold ${route.isSafest ? 'text-emerald-700' : 'text-amber-700'}`}>
                        Safety Score: {route.safetyScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Open Utilities & Safety Highlights */}
        <div className="space-y-4">
          
          {currentRoute ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Route Safety Features
                </h4>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {currentRoute.safetyScore}% Safe
                </span>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                {currentRoute.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Verified Open Utilities Along the Road */}
              <div className="pt-2">
                <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  Open Utilities on this path:
                </h5>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {currentRoute.utilities.map((u) => (
                    <div key={u.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 truncate max-w-[170px]">{u.name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          u.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">💡 {u.lighting}</p>
                      <p className="text-[10px] text-slate-500">👥 {u.crowdDensity}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* One-Click Google Maps Turn-by-Turn Navigation Button */}
              {currentRoute.googleMapsUrl && (
                <div className="pt-2">
                  <a
                    href={currentRoute.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#0D3833] hover:bg-[#164E46] text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm text-center"
                  >
                    <span>Start Live Navigation in Google Maps</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Locks in {currentRoute.name} with verified commercial waypoints on Google Maps
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Prompt to select a destination */
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Navigation className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Choose a Destination</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter where you want to go above or tap one of the quick suggestions. ESTELA will calculate the safest route guided by open shops and active streetlights.
              </p>
            </div>
          )}

          {/* Telemetry Status Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Telemetry
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Origin Latitude:</span>
                <span className="font-mono font-semibold">{originLat.toFixed(5)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Origin Longitude:</span>
                <span className="font-mono font-semibold">{originLon.toFixed(5)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Guardians Tracking:</span>
                <span className="font-semibold text-emerald-600">{contacts.length} Configured</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

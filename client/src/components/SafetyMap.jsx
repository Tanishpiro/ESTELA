import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Share2, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function SafetyMap({ location, title = "Current Position", zoom = 15 }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const lat = location?.latitude || 28.4788;
    const lon = location?.longitude || 76.9128;

    if (!mapInstanceRef.current) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([lat, lon], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(`<b>${title}</b><br/>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force Leaflet to recalculate container dimensions once rendered
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
      setTimeout(() => {
        map.invalidateSize();
      }, 600);
    } else {
      const map = mapInstanceRef.current;
      map.invalidateSize();
      if (location) {
        map.setView([lat, lon], zoom);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lon]);
          markerRef.current.setPopupContent(`<b>${title}</b><br/>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
        }
      }
    }

    // Resize observer to ensure the map always fills 100% of the container dynamically
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [location, title, zoom]);

  const osmUrl = location
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`
    : '#';

  const copyShareLink = () => {
    if (location) {
      navigator.clipboard.writeText(osmUrl);
      alert('Map location link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4A90E2] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#101C2C] text-sm">Real-time Location</h4>
            <p className="text-xs text-slate-500">
              {location ? `Accuracy: ±${Math.round(location.accuracy || 15)}m` : 'Awaiting GPS coordinates...'}
            </p>
          </div>
        </div>

        {location && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              title="Copy shareable link"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-[#4A90E2] hover:underline"
            >
              Open Map <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Map Element */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0"
        style={{ minHeight: '260px', height: '260px', width: '100%' }}
      />

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Powered by OpenStreetMap & Geolocation API</span>
        <span className="font-mono">
          {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Location idle'}
        </span>
      </div>
    </div>
  );
}

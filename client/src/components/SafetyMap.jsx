import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, Share2, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function SafetyMap({ 
  location, 
  title = "Current Position", 
  zoom = 15,
  destination = null,
  activeRoute = null,
  utilities = []
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const utilityMarkersRef = useRef([]);

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

      // User Marker
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #0D3833; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(`<b>${title}</b><br/>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);

      mapInstanceRef.current = map;
      userMarkerRef.current = userMarker;

      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 600);
    } else {
      const map = mapInstanceRef.current;
      map.invalidateSize();
      if (location && userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lon]);
        userMarkerRef.current.setPopupContent(`<b>${title}</b><br/>Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}<br/><small style="color:#059669;">● Live GPS Streaming</small>`);
        if (!destination && !activeRoute) {
          map.panTo([lat, lon], { animate: true });
        }
      }
    }

    const map = mapInstanceRef.current;

    // Handle Destination Marker
    if (destination && destination.lat && destination.lon) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([destination.lat, destination.lon]);
        destMarkerRef.current.bindPopup(`<b>🏁 Destination: ${destination.name}</b>`);
      } else {
        const destIcon = L.divIcon({
          className: 'custom-dest-marker',
          html: `<div style="background-color: #EF4444; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        destMarkerRef.current = L.marker([destination.lat, destination.lon], { icon: destIcon }).addTo(map);
        destMarkerRef.current.bindPopup(`<b>🏁 Destination: ${destination.name}</b>`);
      }
    } else if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    // Handle Active Polyline Route
    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0) {
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
      }
      routePolylineRef.current = L.polyline(activeRoute.waypoints, {
        color: activeRoute.color || '#10B981',
        weight: 6,
        opacity: 0.85,
        dashArray: activeRoute.isSafest ? null : '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Fit bounds to show entire route neatly
      const bounds = L.latLngBounds(activeRoute.waypoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Handle Utility Markers along route (Shops, Pharmacy, Police, Cafe)
    // Clear old markers
    utilityMarkersRef.current.forEach(m => map.removeLayer(m));
    utilityMarkersRef.current = [];

    if (utilities && utilities.length > 0) {
      utilities.forEach(u => {
        const iconEmoji = u.type === 'pharmacy' ? '💊' : u.type === 'police' ? '👮' : u.type === 'cafe' ? '☕' : '🏪';
        const uIcon = L.divIcon({
          className: 'utility-marker',
          html: `<div style="background-color: white; border: 2px solid ${u.isOpen ? '#10B981' : '#F59E0B'}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.18);">${iconEmoji}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const uMarker = L.marker([u.lat, u.lon], { icon: uIcon }).addTo(map);
        uMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
            <b style="color: #0D3833; font-size: 13px;">${u.name}</b>
            <div style="margin-top: 4px; display: inline-block; padding: 2px 6px; border-radius: 6px; font-weight: bold; font-size: 10px; background-color: ${u.isOpen ? '#D1FAE5' : '#FEF3C7'}; color: ${u.isOpen ? '#065F46' : '#92400E'};">
              ${u.status}
            </div>
            <p style="margin: 4px 0 0; color: #475569; font-size: 11px;">💡 ${u.lighting}</p>
            <p style="margin: 2px 0 0; color: #475569; font-size: 11px;">👥 ${u.crowdDensity}</p>
          </div>
        `);
        utilityMarkersRef.current.push(uMarker);
      });
    }

    // Resize observer
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
  }, [location, title, zoom, destination, activeRoute, utilities]);

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
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D3833] flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[#101C2C] text-sm">
              {destination ? `Safe Route Navigation: ${destination.name}` : 'Real-time Safety Map'}
            </h4>
            <p className="text-xs text-slate-500">
              {activeRoute 
                ? `${activeRoute.openUtilitiesCount} verified open shops & safety utilities on route`
                : location ? `Accuracy: ±${Math.round(location.accuracy || 15)}m` : 'Awaiting GPS coordinates...'}
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
              className="flex items-center gap-1 text-xs font-semibold text-[#0D3833] hover:underline"
            >
              Open Map <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0"
        style={{ minHeight: '340px', width: '100%' }}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Safe Lit Corridor
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Shortcut (Quiet)
          </span>
        </div>
        <span className="font-mono">
          {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Location idle'}
        </span>
      </div>
    </div>
  );
}

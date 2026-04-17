import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ZONE_DATA = {
  'Koramangala':   { lat: 12.9352, lng: 77.6245, risk: 'High',   riskScore: 87, color: '#e05c5c' },
  'HSR Layout':    { lat: 12.9116, lng: 77.6389, risk: 'High',   riskScore: 78, color: '#e05c5c' },
  'Andheri East':  { lat: 19.1136, lng: 72.8697, risk: 'High',   riskScore: 81, color: '#e05c5c' },
  'Anna Nagar':    { lat: 13.0827, lng: 80.2187, risk: 'Low',    riskScore: 38, color: '#00d4a8' },
  'Banjara Hills': { lat: 17.4123, lng: 78.4480, risk: 'Medium', riskScore: 54, color: '#f5a623' },
};

const CITY_CENTERS = {
  'Bengaluru':  { lat: 12.9716, lng: 77.5946, zoom: 13 },
  'Chennai':    { lat: 13.0827, lng: 80.2707, zoom: 13 },
  'Mumbai':     { lat: 19.0760, lng: 72.8777, zoom: 13 },
  'Hyderabad':  { lat: 17.3850, lng: 78.4867, zoom: 13 },
  'Delhi NCR':  { lat: 28.6139, lng: 77.2090, zoom: 12 },
};

export default function ZoneMap({ city, zone, workerName, showAll = false }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const center   = CITY_CENTERS[city] || { lat: 20.5937, lng: 78.9629, zoom: 5 };
    const zoneData = ZONE_DATA[zone];
    const mapCenter = zoneData ? [zoneData.lat, zoneData.lng] : [center.lat, center.lng];

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
      .setView(mapCenter, center.zoom || 13);
    mapInst.current = map;

    // Dark-tinted OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add risk-zone circles + markers
    const toRender = showAll
      ? Object.entries(ZONE_DATA)
      : zoneData ? [[zone, zoneData]] : [];

    toRender.forEach(([z, d]) => {
      const isActive = z === zone;

      // Glowing risk circle
      L.circle([d.lat, d.lng], {
        radius:      800,
        color:       d.color,
        fillColor:   d.color,
        fillOpacity: 0.15,
        weight:      isActive ? 2 : 1,
        dashArray:   isActive ? '' : '4,4',
      }).addTo(map);

      // Custom div icon
      const iconHtml = `
        <div style="
          width:${isActive ? 38 : 28}px;height:${isActive ? 38 : 28}px;
          border-radius:50%;
          background:${isActive ? d.color : 'rgba(96,165,250,0.75)'};
          border:${isActive ? '3px' : '2px'} solid rgba(255,255,255,0.7);
          box-shadow:0 0 ${isActive ? 20 : 10}px ${d.color}90;
          display:flex;align-items:center;justify-content:center;
          font-size:${isActive ? 16 : 12}px;
        ">🏍️</div>`;

      const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
      L.marker([d.lat, d.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Outfit,sans-serif;min-width:130px;padding:4px 2px">
            <strong style="font-size:13px">${z}</strong><br/>
            <span style="color:${d.color};font-weight:600;font-size:12px">⚠ Risk: ${d.risk} (${d.riskScore}%)</span><br/>
            ${isActive ? `<span style="font-size:11px;color:#888">📍 ${workerName || 'Your zone'}</span>` : ''}
          </div>
        `);
    });

    return () => { map.remove(); mapInst.current = null; };
  }, [city, zone, showAll]);

  return (
    <div>
      <div ref={mapRef} style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border2)' }} />
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, flexWrap: 'wrap' }}>
        {[['High Risk','#e05c5c'],['Medium Risk','#f5a623'],['Low Risk','#00d4a8']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>© OpenStreetMap contributors</span>
      </div>
    </div>
  );
}

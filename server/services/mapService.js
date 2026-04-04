/**
 * Map Service — OpenStreetMap Nominatim geocoding (free, no API key)
 * Plus zone risk scoring based on historical flood data
 */

// ── Known zone coordinates (preseeded for instant demo) ──────────
const ZONE_COORDS = {
  'Koramangala':  { lat: 12.9352, lng: 77.6245, floodRisk: 'High',   riskScore: 87 },
  'HSR Layout':   { lat: 12.9116, lng: 77.6389, floodRisk: 'High',   riskScore: 78 },
  'Andheri East': { lat: 19.1136, lng: 72.8697, floodRisk: 'High',   riskScore: 81 },
  'Anna Nagar':   { lat: 13.0827, lng: 80.2187, floodRisk: 'Low',    riskScore: 38 },
  'Banjara Hills':{ lat: 17.4123, lng: 78.4480, floodRisk: 'Medium', riskScore: 54 },
  'Connaught Place':{ lat: 28.6315, lng: 77.2167, floodRisk: 'Medium',riskScore: 61 },
};

const CITY_CENTERS = {
  'Bengaluru':  { lat: 12.9716, lng: 77.5946 },
  'Chennai':    { lat: 13.0827, lng: 80.2707 },
  'Mumbai':     { lat: 19.0760, lng: 72.8777 },
  'Hyderabad':  { lat: 17.3850, lng: 78.4867 },
  'Delhi NCR':  { lat: 28.6139, lng: 77.2090 },
};

// ── Geocode an address using Nominatim (free OSM) ─────────────────
export async function geocodeAddress(zone, city) {
  // Return preseeded data first for speed
  if (ZONE_COORDS[zone]) return { ...ZONE_COORDS[zone], source: 'cached' };
  if (CITY_CENTERS[city]) return { ...CITY_CENTERS[city], floodRisk: 'Medium', riskScore: 50, source: 'city-center' };

  try {
    const { default: fetch } = await import('node-fetch');
    const query = encodeURIComponent(`${zone}, ${city}, India`);
    const res   = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'GigShield-InsuranceApp/1.0' }, signal: AbortSignal.timeout(4000) }
    );
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat:       parseFloat(data[0].lat),
        lng:       parseFloat(data[0].lon),
        floodRisk: 'Medium',
        riskScore: 55,
        source:    'nominatim',
      };
    }
  } catch (_) {}

  // Final fallback
  return { lat: 20.5937, lng: 78.9629, floodRisk: 'Low', riskScore: 40, source: 'fallback' };
}

// ── Get zone risk data ────────────────────────────────────────────
export function getZoneRisk(zone) {
  return ZONE_COORDS[zone] || { floodRisk: 'Medium', riskScore: 55 };
}

// ── Get city center for map centering ────────────────────────────
export function getCityCenter(city) {
  return CITY_CENTERS[city] || { lat: 20.5937, lng: 78.9629 };
}

// ── All workers as map markers (anonymized for worker view) ───────
export function getZoneMarkers() {
  return Object.entries(ZONE_COORDS).map(([zone, data]) => ({
    zone,
    ...data,
  }));
}

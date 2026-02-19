/* =======================
   Utils: Geo / Distance
======================= */

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Distance entre deux points GPS en mètres (Haversine)
 * a = { lat, lng }
 * b = { lat, lng }
 */
export function distanceMeters(a, b) {
  const R = 6371000; // rayon Terre en mètres

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

// src/utils/reports.js

/* =======================
   Time helpers
======================= */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// Fenêtre "info récente" / décisions
export const RECENT_WINDOW_MS = 1 * HOUR_MS; // 1 heure

/**
 * Retourne un texte "à l’instant", "12 min", "2 h", "3 j"
 */
export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);

  if (!Number.isFinite(min) || min < 0) return "—";
  if (min < 1) return "à l’instant";
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h`;

  const d = Math.floor(h / 24);
  return `${d} j`;
}

/* =======================
   24h counters
======================= */
export function countsFromReports(reports) {
  const counts = { green: 0, orange: 0, red: 0 };
  for (const r of reports) {
    if (r.level === 1) counts.green += 1;
    else if (r.level === 2) counts.orange += 1;
    else if (r.level === 3) counts.red += 1;
  }
  return counts;
}

/**
 * Agrège les reports des dernières 24h pour une plage donnée.
 */
export function getBeachStatsFromReports(allReports, beachId) {
  const now = Date.now();
  const recent = allReports.filter(
    (r) => r.beachId === beachId && now - r.ts <= DAY_MS
  );

  const lastTs = recent.length ? Math.max(...recent.map((r) => r.ts)) : null;

  // HARMONISATION : on utilise sun et crowd au lieu de rain
  const sarg = recent.filter((r) => r.type === "sargasses");
  const sun = recent.filter((r) => r.type === "sun");
  const swim = recent.filter((r) => r.type === "swim");
  const crowd = recent.filter((r) => r.type === "crowd");

  return {
    updatedAgo: lastTs ? timeAgo(lastTs) : "—",
    sargasses: countsFromReports(sarg),
    sun: countsFromReports(sun),
    swim: countsFromReports(swim),
    crowd: countsFromReports(crowd),
  };
}

/* =======================
   Decision + reliability (window = 1h)
======================= */
export function computeDecision(beachReports, type, windowMs = RECENT_WINDOW_MS) {
  const now = Date.now();
  const recent = beachReports.filter(
    (r) => r.type === type && now - r.ts <= windowMs
  );

  const windowLabel =
    windowMs === RECENT_WINDOW_MS
      ? "1 h"
      : `${Math.round(windowMs / HOUR_MS)} h`;

  if (recent.length === 0) {
    return {
      level: 0,
      reliability: "faible",
      count: 0,
      windowLabel,
    };
  }

  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const r of recent) {
      if (r.level) counts[r.level]++;
  }

  // Dominante + prudence en cas d'égalité : 3 > 2 > 1
  let dominant = 1;
  if (counts[3] >= counts[2] && counts[3] >= counts[1]) dominant = 3;
  else if (counts[2] >= counts[1]) dominant = 2;

  let reliability = "faible";
  if (recent.length >= 4) reliability = "élevée";
  else if (recent.length >= 2) reliability = "moyenne";

  return {
    level: dominant,
    reliability,
    count: recent.length,
    windowLabel,
  };
}

/* =======================
   Marker color (map dots)
======================= */
export function getRecentReportsForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const now = Date.now();
  return allReports.filter(
    (r) => r.beachId === beachId && now - r.ts <= windowMs
  );
}

export const MARKER_COLORS = {
  gray: "#bdbdbd",
  green: "#2e7d32",
  orange: "#f9a825",
  red: "#d32f2f",
};

export function markerColorForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const recent = getRecentReportsForBeach(allReports, beachId, windowMs);

  if (recent.length === 0) return MARKER_COLORS.gray;

  if (recent.some((r) => r.level === 3)) return MARKER_COLORS.red;

  const validLevels = recent.filter(r => r.level);
  if (validLevels.length === 0) return MARKER_COLORS.green; // Si que des photos sans niveau, on met vert par défaut

  const avg = validLevels.reduce((sum, r) => sum + r.level, 0) / validLevels.length;

  return avg < 1.5 ? MARKER_COLORS.green : MARKER_COLORS.orange;
}

export function markerStatusForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const recent = getRecentReportsForBeach(allReports, beachId, windowMs);
  if (recent.length === 0) return "none";
  if (recent.some((r) => r.level === 3)) return "red";

  const validLevels = recent.filter(r => r.level);
  if (validLevels.length === 0) return "green";

  const avg = validLevels.reduce((sum, r) => sum + r.level, 0) / validLevels.length;
  return avg < 1.5 ? "green" : "orange";
}

/* =======================
   Normalization helpers
======================= */
export function normalizeReports(inputReports) {
  if (!Array.isArray(inputReports)) return [];
  return inputReports
    .map((r) => ({
      ...r, // <-- C'est ici que l'imageUrl et le comment sont conservés !
      beachId: typeof r.beachId === "string" ? Number(r.beachId) : r.beachId,
      ts: typeof r.ts === "string" ? Number(r.ts) : r.ts,
      level: typeof r.level === "string" ? Number(r.level) : r.level,
    }))
    .filter(
      (r) =>
        Number.isFinite(r.beachId) &&
        Number.isFinite(r.ts) &&
        typeof r.type === "string"
        // On a retiré l'obligation absolue d'avoir un niveau 1, 2 ou 3 
        // pour ne pas bloquer les simples commentaires/photos
    );
}
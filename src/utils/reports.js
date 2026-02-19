// src/utils/reports.js

/* =======================
   Time helpers
======================= */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

// Fenêtre "info récente" / décisions
export const RECENT_WINDOW_MS = 1 * HOUR_MS; // 1 heure (comme tu l'as demandé)

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
 * - updatedAgo: "12 min", "2 h", etc.
 * - sargasses/rain/swim: {green,orange,red}
 */
export function getBeachStatsFromReports(allReports, beachId) {
  const now = Date.now();
  const recent = allReports.filter(
    (r) => r.beachId === beachId && now - r.ts <= DAY_MS
  );

  const lastTs = recent.length ? Math.max(...recent.map((r) => r.ts)) : null;

  const sarg = recent.filter((r) => r.type === "sargasses");
  const rain = recent.filter((r) => r.type === "rain");
  const swim = recent.filter((r) => r.type === "swim");

  return {
    updatedAgo: lastTs ? timeAgo(lastTs) : "—",
    sargasses: countsFromReports(sarg),
    rain: countsFromReports(rain),
    swim: countsFromReports(swim),
  };
}

/* =======================
   Decision + reliability (window = 1h)
======================= */
/**
 * Calcule une "décision" pour un type ("sargasses" | "rain" | "swim")
 * sur la fenêtre recentWindow (par défaut 1h).
 *
 * Retour:
 * {
 *   level: 0|1|2|3,
 *   reliability: "faible"|"moyenne"|"élevée",
 *   count: number,
 *   windowLabel: "1 h"
 * }
 */
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
  for (const r of recent) counts[r.level]++;

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
   Règle demandée :
   - si au moins un évènement est rouge => rouge
   - sinon moyenne des signalements => vert/orange
   - si aucun signalement => gris
======================= */

/**
 * Retourne les reports récents (fenêtre 1h par défaut) pour une plage.
 * Utile si tu veux debugger/afficher des détails.
 */
export function getRecentReportsForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const now = Date.now();
  return allReports.filter(
    (r) => r.beachId === beachId && now - r.ts <= windowMs
  );
}

/**
 * Couleurs par défaut (tu peux les changer facilement ici)
 */
export const MARKER_COLORS = {
  gray: "#bdbdbd",
  green: "#2e7d32",
  orange: "#f9a825",
  red: "#d32f2f",
};

/**
 * Calcule une couleur (hex) pour le point de la plage sur la carte.
 * Basé sur TOUS les types (swim/rain/sargasses) sur la fenêtre 1h.
 */
export function markerColorForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const recent = getRecentReportsForBeach(allReports, beachId, windowMs);

  if (recent.length === 0) return MARKER_COLORS.gray;

  // Si au moins un signalement rouge sur n'importe quel type => rouge
  if (recent.some((r) => r.level === 3)) return MARKER_COLORS.red;

  // Sinon on fait la moyenne des niveaux (1..2 ici, car pas de 3)
  const avg = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;

  // avg < 1.5 => majoritairement 1 => vert, sinon orange
  return avg < 1.5 ? MARKER_COLORS.green : MARKER_COLORS.orange;
}

/**
 * Optionnel : renvoie directement un "status" plutôt qu'une couleur.
 * Pratique si tu veux afficher une légende/texte.
 */
export function markerStatusForBeach(allReports, beachId, windowMs = RECENT_WINDOW_MS) {
  const recent = getRecentReportsForBeach(allReports, beachId, windowMs);
  if (recent.length === 0) return "none";
  if (recent.some((r) => r.level === 3)) return "red";

  const avg = recent.reduce((sum, r) => sum + r.level, 0) / recent.length;
  return avg < 1.5 ? "green" : "orange";
}

/* =======================
   Normalization helpers
   (utile quand beachId peut être string ou number)
======================= */

/**
 * Convertit beachId en Number et filtre les reports invalides.
 * À utiliser quand tu lis depuis localStorage / Firestore.
 */
export function normalizeReports(inputReports) {
  if (!Array.isArray(inputReports)) return [];
  return inputReports
    .map((r) => ({
      ...r,
      beachId: typeof r.beachId === "string" ? Number(r.beachId) : r.beachId,
      ts: typeof r.ts === "string" ? Number(r.ts) : r.ts,
      level: typeof r.level === "string" ? Number(r.level) : r.level,
    }))
    .filter(
      (r) =>
        Number.isFinite(r.beachId) &&
        Number.isFinite(r.ts) &&
        (r.level === 1 || r.level === 2 || r.level === 3) &&
        typeof r.type === "string"
    );
}

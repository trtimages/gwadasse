// Chaque report = un signalement
// type: "sargasses" | "rain" | "swim"
// level: 1 (vert) | 2 (orange) | 3 (rouge)
// ts: timestamp en ms (Date.now())

const now = Date.now();
const min = 60 * 1000;
const hour = 60 * min;

export const mockReports = [
  // Perle : sargasses
  { beachId: "perle", type: "sargasses", level: 1, ts: now - 20 * min },
  { beachId: "perle", type: "sargasses", level: 2, ts: now - 35 * min },
  { beachId: "perle", type: "sargasses", level: 3, ts: now - 70 * min },

  // Perle : pluie
  { beachId: "perle", type: "rain", level: 1, ts: now - 25 * min },
  { beachId: "perle", type: "rain", level: 2, ts: now - 90 * min },

  // Perle : baignade
  { beachId: "perle", type: "swim", level: 1, ts: now - 15 * min },
  { beachId: "perle", type: "swim", level: 2, ts: now - 120 * min },

  // Malendure : sargasses
  { beachId: "malendure", type: "sargasses", level: 1, ts: now - 40 * min },
  { beachId: "malendure", type: "sargasses", level: 1, ts: now - 2 * hour },

  // Sainte-Anne : sargasses
  { beachId: "bourg-sainte-anne", type: "sargasses", level: 3, ts: now - 10 * min },
  { beachId: "bourg-sainte-anne", type: "sargasses", level: 3, ts: now - 18 * min },
];

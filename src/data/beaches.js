export const BEACH_RADIUS = 500; // mètres

export const beaches = [
  { id: 1, slug: "clugny", name: "Plage de Clugny", town: "Sainte-Rose", island: "Basse-Terre", lat: 16.3396, lng: -61.7610, radius: BEACH_RADIUS, map: { x: 17.03, y: 31.9 }, parking: "Oui", douche: "Non" },
  { id: 2, slug: "perle", name: "Plage de la Perle", town: "Sainte-Rose", island: "Basse-Terre", lat: 16.3345, lng: -61.7839, radius: BEACH_RADIUS, map: { x: 13.78, y: 37.3 }, parking: "Oui", douche: "Non" },
  { id: 3, slug: "grande-anse-deshaies", name: "Plage de Grande Anse", town: "Deshaies", island: "Basse-Terre", lat: 16.3126, lng: -61.7958, radius: BEACH_RADIUS, map: { x: 13.3, y: 42.86 }, parking: "Oui", douche: "Non" },
  { id: 4, slug: "Leroux", name: "Plage de Leroux", town: "Deshaies", island: "Basse-Terre", lat: 16.2735, lng: -61.8015, radius: BEACH_RADIUS, map: { x: 14.27, y: 48.41 }, parking: "Oui (petit)", douche: "Non" },
  { id: 5, slug: "malendure", name: "Plage de Malendure", town: "Bouillante", island: "Basse-Terre", lat: 16.1628, lng: -61.7770, radius: BEACH_RADIUS, map: { x: 15.71, y: 54.93 }, parking: "Oui", douche: "Oui" },
  
  { id: 6, slug: "anse-du-souffleur", name: "Plage de l’Anse du Souffleur", town: "Port-Louis", island: "Grande-Terre", lat: 16.4250, lng: -61.5330, radius: BEACH_RADIUS, map: { x: 40.53, y: 25.19 }, parking: "Oui", douche: "Oui" },
  { id: 7, slug: "chapelle", name: "Plage de la Chapelle", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4750, lng: -61.5110, radius: BEACH_RADIUS, map: { x: 40.95, y: 23.09 }, parking: "Oui", douche: "Oui" },
  { id: 8, slug: "anse-laborde", name: "Plage de l’Anse Laborde", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4850, lng: -61.5200, radius: BEACH_RADIUS, map: { x: 43.32, y: 18.43 }, parking: "Oui", douche: "Non" },
  { id: 9, slug: "porte-d-enfer", name: "Plage de la Porte d’Enfer", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4940, lng: -61.4440, radius: BEACH_RADIUS, map: { x: 49.79, y: 16.93 }, parking: "Oui", douche: "Non" },

  { id: 10, slug: "salines-saint-francois", name: "Plage des Salines", town: "Saint-François", island: "Grande-Terre", lat: 16.2520, lng: -61.1860, radius: BEACH_RADIUS, map: { x: 75.06, y: 42.04 }, parking: "Oui", douche: "Non" },
  { id: 11, slug: "anse-a-la-gourde", name: "Plage de l’Anse à la Gourde", town: "Saint-François", island: "Grande-Terre", lat: 16.2520, lng: -61.2050, radius: BEACH_RADIUS, map: { x: 73.17, y: 41.09 }, parking: "Oui", douche: "Non" },
  { id: 12, slug: "raisins-clairs", name: "Plage des Raisins Clairs", town: "Saint-François", island: "Grande-Terre", lat: 16.2500, lng: -61.2840, radius: BEACH_RADIUS, map: { x: 67.40, y: 42.59 }, parking: "Oui", douche: "Oui" },

  { id: 13, slug: "bois-jolan", name: "Plage de Bois Jolan", town: "Sainte-Anne", island: "Grande-Terre", lat: 16.2110, lng: -61.3440, radius: BEACH_RADIUS, map: { x: 60.69, y: 43.70 }, parking: "Oui", douche: "Non" },
  { id: 14, slug: "caravelle", name: "Plage de la Caravelle", town: "Sainte-Anne", island: "Grande-Terre", lat: 16.2210, lng: -61.3830, radius: BEACH_RADIUS, map: { x: 55.40, y: 45.59 }, parking: "Oui", douche: "Oui" },

  { id: 15, slug: "grande-anse-trois-rivieres", name: "Plage de Grande Anse (Trois-Rivières)", town: "Trois-Rivières", island: "Basse-Terre", lat: 15.9656, lng: -61.6472, radius: BEACH_RADIUS, map: { x: 26.50, y: 73.70 }, parking: "Oui", douche: "Non" },
  { id: 16, slug: "rouleaux", name: "Plage des Rouleaux", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0350, lng: -61.5560, radius: BEACH_RADIUS, parking: "Oui", douche: "Non" },
  { id: 17, slug: "bananier", name: "Plage du Bananier", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0130, lng: -61.5630, radius: BEACH_RADIUS, map: { x:34.32, y: 69.04 }, parking: "Oui", douche: "Non" },
  { id: 18, slug: "roseau", name: "Plage de Roseau", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0820, lng: -61.5590, radius: BEACH_RADIUS, map: { x: 37.64, y: 57.51 }, parking: "Oui", douche: "Non" },

  { id: 19, slug: "saint-claire", name: "Plage de Saint-Claire", town: "Gourbeyre", island: "Basse-Terre", lat: 16.1360, lng: -61.5730, radius: BEACH_RADIUS, map: { x: 37.32, y: 56.57 },parking: "Oui", douche: "Non" },
  { id: 20, slug: "riviere-sens", name: "Plage de Rivière Sens", town: "Gourbeyre", island: "Basse-Terre", lat: 15.9790, lng: -61.7180, radius: BEACH_RADIUS, map: { x: 22.32, y: 72.52 }, parking: "Oui", douche: "Oui" },

  { id: 21, slug: "viard", name: "Plage de Viard", town: "Petit-Bourg", island: "Basse-Terre", lat: 16.1830, lng: -61.5830, radius: BEACH_RADIUS, map: { x: 35.74, y: 50.49 }, parking: "Oui", douche: "Non" },
  { id: 22, slug: "grand-baie", name: "Plage de Grand Baie", town: "Le Moule", island: "Grande-Terre", lat: 16.3370, lng: -61.3520, radius: BEACH_RADIUS, parking: "Oui", douche: "Non" },
  { id: 23, slug: "autre-bord", name: "Plage de l’Autre Bord", town: "Le Moule", island: "Grande-Terre", lat: 16.3330, lng: -61.3360, radius: BEACH_RADIUS, map: { x: 61.80, y: 33.91 }, parking: "Oui", douche: "Oui" },

  { id: 24, slug: "bas-du-fort", name: "Plage de Bas-du-Fort", town: "Le Gosier", island: "Grande-Terre", lat: 16.2200, lng: -61.5260, radius: BEACH_RADIUS, map: { x: 42.88, y: 46.38 }, parking: "Oui", douche: "Oui" },
  { id: 25, slug: "ilet-du-gosier", name: "Plage de l’Îlet du Gosier", town: "Le Gosier", island: "Grande-Terre", lat: 16.1980, lng: -61.4930, radius: BEACH_RADIUS, map: { x: 44.44, y: 47.86 }, parking: "Non", douche: "Non" },
  { id: 26, slug: "saint-felix", name: "Plage de Saint-Félix", town: "Le Gosier", island: "Grande-Terre", lat: 16.2050, lng: -61.4640, radius: BEACH_RADIUS, map: { x: 47.13, y: 47.08 }, parking: "Oui", douche: "Non" },
  { id: 27, slug: "petit-havre", name: "Plage de Petit-Havre", town: "Le Gosier", island: "Grande-Terre", lat: 16.2030, lng: -61.4390, radius: BEACH_RADIUS, map: { x: 49.65, y: 47.34 }, parking: "Oui (petit)", douche: "Oui" },
  { id: 28, slug: "datcha", name: "Plage de la Datcha", town: "Le Gosier", island: "Grande-Terre", lat: 16.2050, lng: -61.4950, radius: BEACH_RADIUS, map: { x: 44.79, y: 47.16 }, parking: "Oui", douche: "Oui" },

  // Les Saintes
  { id: 29, slug: "crawen", name: "Plage de Crawen", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8570, lng: -61.5950, radius: BEACH_RADIUS, map: { x: 33.85, y: 84.34 }, parking: "Oui", douche: "Non" },
  { id: 30, slug: "pompierre", name: "Plage de Pompierre", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8750, lng: -61.5720, radius: BEACH_RADIUS, map: { x: 35.67, y: 82.95 }, parking: "Oui", douche: "Oui" },
  { id: 31, slug: "pain-de-sucre", name: "Plage du Pain de Sucre", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8630, lng: -61.5900, radius: BEACH_RADIUS, map: { x: 34.19, y: 83.12 }, parking: "Oui (petit)", douche: "Non" },
  { id: 32, slug: "petite-anse-terre-de-bas", name: "Plage de Petite Anse", town: "Terre-de-Bas", island: "Les Saintes", lat: 15.8450, lng: -61.6210, radius: BEACH_RADIUS, map: { x: 29.33, y: 85.64 }, parking: "Oui", douche: "Non" },
  { id: 33, slug: "anse-a-dos", name: "Plage de l’Anse à Dos", town: "Terre-de-Bas", island: "Les Saintes", lat: 15.8460, lng: -61.6420, radius: BEACH_RADIUS, map: { x: 29.00, y: 84.07 }, parking: "Oui", douche: "Non" },

  // Marie-Galante
  { id: 34, slug: "anse-feuillard", name: "Plage de l’Anse Feuillard", town: "Grand-Bourg", island: "Marie-Galante", lat: 15.9650, lng: -61.2290, radius: BEACH_RADIUS, map: { x: 73.45, y: 78.34 }, parking: "Oui", douche: "Non" },
  { id: 35, slug: "anse-canot", name: "Plage de l’Anse Canot", town: "Saint-Louis", island: "Marie-Galante", lat: 15.9610, lng: -61.3060, radius: BEACH_RADIUS, map: { x: 61.54, y: 73.04 }, parking: "Oui", douche: "Non" },
  { id: 36, slug: "vieux-fort", name: "Plage de Vieux-Fort", town: "Vieux-Fort", island: "Marie-Galante", lat: 15.9700, lng: -61.3060, radius: BEACH_RADIUS, map: { x: 64.76, y: 69.92 }, parking: "Oui", douche: "Non" },
  { id: 37, slug: "feuillere", name: "Plage de la Feuillère", town: "Capesterre-de-Marie-Galante", island: "Marie-Galante", lat: 15.8820, lng: -61.2670, radius: BEACH_RADIUS, map: { x: 72.93, y: 80.43 }, parking: "Oui", douche: "Oui" },

  // La Désirade
  { id: 38, slug: "fifi", name: "Plage de Fifi", town: "La Désirade", island: "La Désirade", lat: 16.3020, lng: -61.0740, radius: BEACH_RADIUS, map: { x: 86.47, y: 38 }, parking: "Oui", douche: "Non" },
  { id: 39, slug: "souffleur-desirade", name: "Plage du Souffleur", town: "La Désirade", island: "La Désirade", lat: 16.3050, lng: -61.0600, radius: BEACH_RADIUS, map: { x: 88.21, y: 37.09 }, parking: "Oui", douche: "Non" },
  { id: 40, slug: "fanfan", name: "Plage de Fanfan", town: "La Désirade", island: "La Désirade", lat: 16.3070, lng: -61.0550, radius: BEACH_RADIUS, map: { x: 85.44, y: 38.04 }, parking: "Oui", douche: "Non" },
  { id: 41, slug: "petite-riviere-desirade", name: "Plage de Petite Rivière", town: "La Désirade", island: "La Désirade", lat: 16.3150, lng: -61.0180, radius: BEACH_RADIUS, map: { x: 90.65, y: 35.44 }, parking: "Oui", douche: "Non" },
];
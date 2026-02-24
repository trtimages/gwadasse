export const BEACH_RADIUS = 500; // mètres

export const beaches = [
  { id: 1, slug: "clugny", name: "Plage de Clugny", town: "Sainte-Rose", island: "Basse-Terre", lat: 16.3352, lng: -61.7215, radius: BEACH_RADIUS, map: { x: 17.03, y: 31.9 }, parking: "Oui", douche: "Non" },
  { id: 2, slug: "perle", name: "Plage de la Perle", town: "Sainte-Rose", island: "Basse-Terre", lat: 16.3346, lng: -61.7142, radius: BEACH_RADIUS, map: { x: 13.78, y: 37.3 }, parking: "Oui", douche: "Non" },
  { id: 3, slug: "grande-anse-deshaies", name: "Plage de Grande Anse", town: "Deshaies", island: "Basse-Terre", lat: 16.3059, lng: -61.7976, radius: BEACH_RADIUS, map: { x: 13.3, y: 42.86 }, parking: "Oui", douche: "Non" },
  { id: 4, slug: "Leroux", name: "Plage de Leroux", town: "Deshaies", island: "Basse-Terre", lat: 16.3137, lng: -61.7894, radius: BEACH_RADIUS, map: { x: 14.27, y: 48.41 }, parking: "Oui (petit)", douche: "Non" },
  { id: 5, slug: "malendure", name: "Plage de Malendure", town: "Bouillante", island: "Basse-Terre", lat: 16.1519, lng: -61.7763, radius: BEACH_RADIUS, map: { x: 15.71, y: 54.93 }, parking: "Oui", douche: "Oui" },
    { id: 6, slug: "anse-du-souffleur", name: "Plage de l’Anse du Souffleur", town: "Port-Louis", island: "Grande-Terre", lat: 16.4244, lng: -61.5314, radius: BEACH_RADIUS, map: { x: 40.53, y: 25.19 }, parking: "Oui", douche: "Oui" },

    { id: 7, slug: "chapelle", name: "Plage de la Chapelle", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4733, lng: -61.5098, radius: BEACH_RADIUS, map: { x: 40.95, y: 23.09 }, parking: "Oui", douche: "Oui" },
    { id: 8, slug: "anse-laborde", name: "Plage de l’Anse Laborde", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4616, lng: -61.5033, radius: BEACH_RADIUS, map: { x: 43.32, y: 18.43 }, parking: "Oui", douche: "Non" },
    { id: 9, slug: "porte-d-enfer", name: "Plage de la Porte d’Enfer", town: "Anse-Bertrand", island: "Grande-Terre", lat: 16.4791, lng: -61.5162, radius: BEACH_RADIUS, map: { x: 49.79, y: 16.93 }, parking: "Oui", douche: "Non" },

    { id: 10, slug: "salines-saint-francois", name: "Plage des Salines", town: "Saint-François", island: "Grande-Terre", lat: 16.2139, lng: -61.2606, radius: BEACH_RADIUS, map: { x: 75.06, y: 42.04 }, parking: "Oui", douche: "Non" },
    { id: 11, slug: "anse-a-la-gourde", name: "Plage de l’Anse à la Gourde", town: "Saint-François", island: "Grande-Terre", lat: 16.2454, lng: -61.2049, radius: BEACH_RADIUS, map: { x: 73.17, y: 41.09 }, parking: "Oui", douche: "Non" },
    { id: 12, slug: "raisins-clairs", name: "Plage des Raisins Clairs", town: "Saint-François", island: "Grande-Terre", lat: 16.2497, lng: -61.2687, radius: BEACH_RADIUS, map: { x: 67.40, y: 42.59 }, parking: "Oui", douche: "Oui" },

    { id: 13, slug: "bois-jolan", name: "Plage de Bois Jolan", town: "Sainte-Anne", island: "Grande-Terre", lat: 16.2197, lng: -61.3228, radius: BEACH_RADIUS, map: { x: 60.69, y: 43.70 }, parking: "Oui", douche: "Non" },
    { id: 14, slug: "caravelle", name: "Plage de la Caravelle", town: "Sainte-Anne", island: "Grande-Terre", lat: 16.2068, lng: -61.3366, radius: BEACH_RADIUS, map: { x: 55.40, y: 45.59 }, parking: "Oui", douche: "Oui" },

    { id: 15, slug: "grande-anse-trois-rivieres", name: "Plage de Grande Anse (Trois-Rivières)", town: "Trois-Rivières", island: "Basse-Terre", lat: 15.9656, lng: -61.6472, radius: BEACH_RADIUS, map: { x: 26.50, y: 73.70 }, parking: "Oui", douche: "Non" },
    { id: 16, slug: "rouleaux", name: "Plage des Rouleaux", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0487, lng: -61.5634, radius: BEACH_RADIUS, parking: "Oui", douche: "Non" },
    { id: 17, slug: "bananier", name: "Plage du Bananier", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0453, lng: -61.5658, radius: BEACH_RADIUS, map: { x:34.32, y: 69.04 }, parking: "Oui", douche: "Non" },
    { id: 18, slug: "roseau", name: "Plage de Roseau", town: "Capesterre-Belle-Eau", island: "Basse-Terre", lat: 16.0424, lng: -61.5679, radius: BEACH_RADIUS, map: { x: 37.64, y: 57.51 }, parking: "Oui", douche: "Non" },

    { id: 19, slug: "saint-claire", name: "Plage de Saint-Claire", town: "Gourbeyre", island: "Basse-Terre", lat: 15.9912, lng: -61.7013, radius: BEACH_RADIUS, map: { x: 37.32, y: 56.57 },parking: "Oui", douche: "Non" },
    { id: 20, slug: "riviere-sens", name: "Plage de Rivière Sens", town: "Gourbeyre", island: "Basse-Terre", lat: 15.9886, lng: -61.6958, radius: BEACH_RADIUS, map: { x: 22.32, y: 72.52 }, parking: "Oui", douche: "Oui" },

    { id: 21, slug: "viard", name: "Plage de Viard", town: "Petit-Bourg", island: "Basse-Terre", lat: 16.1917, lng: -61.6008, radius: BEACH_RADIUS, map: { x: 35.74, y: 50.49 }, parking: "Oui", douche: "Non" },
    { id: 22, slug: "grand-baie", name: "Plage de Grand Baie", town: "Le Moule", island: "Grande-Terre", lat: 16.3374, lng: -61.3519, radius: BEACH_RADIUS, parking: "Oui", douche: "Non" },
    { id: 23, slug: "autre-bord", name: "Plage de l’Autre Bord", town: "Le Moule", island: "Grande-Terre", lat: 16.3338, lng: -61.3481, radius: BEACH_RADIUS, map: { x: 61.80, y: 33.91 }, parking: "Oui", douche: "Oui" },

    { id: 24, slug: "bas-du-fort", name: "Plage de Bas-du-Fort", town: "Le Gosier", island: "Grande-Terre", lat: 16.2161, lng: -61.5269, radius: BEACH_RADIUS, map: { x: 42.88, y: 46.38 }, parking: "Oui", douche: "Oui" },
    { id: 25, slug: "ilet-du-gosier", name: "Plage de l’Îlet du Gosier", town: "Le Gosier", island: "Grande-Terre", lat: 16.2096, lng: -61.5006, radius: BEACH_RADIUS, map: { x: 44.44, y: 47.86 }, parking: "Non", douche: "Non" },
    { id: 26, slug: "saint-felix", name: "Plage de Saint-Félix", town: "Le Gosier", island: "Grande-Terre", lat: 16.1947, lng: -61.4938, radius: BEACH_RADIUS, map: { x: 47.13, y: 47.08 }, parking: "Oui", douche: "Non" },
    { id: 27, slug: "petit-havre", name: "Plage de Petit-Havre", town: "Le Gosier", island: "Grande-Terre", lat: 16.1931, lng: -61.4912, radius: BEACH_RADIUS, map: { x: 49.65, y: 47.34 }, parking: "Oui (petit)", douche: "Oui" },
  { id: 28, slug: "datcha", name: "Plage de la Datcha", town: "Le Gosier", island: "Grande-Terre", lat: 16.2069, lng: -61.4921, radius: BEACH_RADIUS, map: { x: 44.79, y: 47.16 }, parking: "Oui", douche: "Oui" },

  // Les Saintes
    { id: 29, slug: "crawen", name: "Plage de Crawen", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8648, lng: -61.5802, radius: BEACH_RADIUS, map: { x: 33.85, y: 84.34 }, parking: "Oui", douche: "Non" },
    { id: 30, slug: "pompierre", name: "Plage de Pompierre", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8709, lng: -61.5856, radius: BEACH_RADIUS, map: { x: 35.67, y: 82.95 }, parking: "Oui", douche: "Oui" },
    { id: 31, slug: "pain-de-sucre", name: "Plage du Pain de Sucre", town: "Terre-de-Haut", island: "Les Saintes", lat: 15.8726, lng: -61.5791, radius: BEACH_RADIUS, map: { x: 34.19, y: 83.12 }, parking: "Oui (petit)", douche: "Non" },
    { id: 32, slug: "petite-anse-terre-de-bas", name: "Plage de Petite Anse", town: "Terre-de-Bas", island: "Les Saintes", lat: 15.8469, lng: -61.6212, radius: BEACH_RADIUS, map: { x: 29.33, y: 85.64 }, parking: "Oui", douche: "Non" },
    { id: 33, slug: "anse-a-dos", name: "Plage de l’Anse à Dos", town: "Terre-de-Bas", island: "Les Saintes", lat: 15.8447, lng: -61.6174, radius: BEACH_RADIUS, map: { x: 29.00, y: 84.07 }, parking: "Oui", douche: "Non" },

  // Marie-Galante
    { id: 34, slug: "anse-feuillard", name: "Plage de l’Anse Feuillard", town: "Grand-Bourg", island: "Marie-Galante", lat: 15.8846, lng: -61.2893, radius: BEACH_RADIUS, map: { x: 73.45, y: 78.34 }, parking: "Oui", douche: "Non" },
    { id: 35, slug: "anse-canot", name: "Plage de l’Anse Canot", town: "Saint-Louis", island: "Marie-Galante", lat: 15.9614, lng: -61.3319, radius: BEACH_RADIUS, map: { x: 61.54, y: 73.04 }, parking: "Oui", douche: "Non" },
    { id: 36, slug: "vieux-fort", name: "Plage de Vieux-Fort", town: "Vieux-Fort", island: "Marie-Galante", lat: 15.9706, lng: -61.6509, radius: BEACH_RADIUS, map: { x: 64.76, y: 69.92 }, parking: "Oui", douche: "Non" },
    { id: 37, slug: "feuillere", name: "Plage de la Feuillère", town: "Capesterre-de-Marie-Galante", island: "Marie-Galante", lat: 15.9124, lng: -61.2287, radius: BEACH_RADIUS, map: { x: 72.93, y: 80.43 }, parking: "Oui", douche: "Oui" },

  // La Désirade
  { id: 38, slug: "fifi", name: "Plage de Fifi", town: "La Désirade", island: "La Désirade", lat: 16.3164, lng: -61.0614, radius: BEACH_RADIUS, map: { x: 86.47, y: 38 }, parking: "Oui", douche: "Non" },
    { id: 39, slug: "souffleur-desirade", name: "Plage du Souffleur", town: "La Désirade", island: "La Désirade", lat: 16.3216, lng: -61.0547, radius: BEACH_RADIUS, map: { x: 88.21, y: 37.09 }, parking: "Oui", douche: "Non" },
    { id: 40, slug: "fanfan", name: "Plage de Fanfan", town: "La Désirade", island: "La Désirade", lat: 16.3198, lng: -61.0583, radius: BEACH_RADIUS, map: { x: 85.44, y: 38.04 }, parking: "Oui", douche: "Non" },
    { id: 41, slug: "petite-riviere-desirade", name: "Plage de Petite Rivière", town: "La Désirade", island: "La Désirade", lat: 16.3251, lng: -61.0492, radius: BEACH_RADIUS, map: { x: 90.65, y: 35.44 }, parking: "Oui", douche: "Non" },
];

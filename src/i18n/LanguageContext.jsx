import React, { createContext, useState, useContext } from 'react';

const translations = {
  fr: {
    // Interface de base
    back: "Retour",
    yes: "Oui",
    no: "Non",
    on_site: "Sur place",
    search_beach: "Chercher une plage",
    explore: "Explorer",
    search_placeholder: "Plage, commune...",
    sort_by: "Trier par",
    popular: "Populaires",
    nearby: "Proches",
    state: "État",
    no_beach_found: "Aucune plage trouvée.",
    
    // Titres des catégories
    weather: "Météo",
    weather_sea: "Mer",
    crowd: "Affluence",
    sargassum: "Sargasses",
    
    // États de la mer (Swim)
    sea_calm: "Calme",
    sea_rough: "Agitée",
    sea_dangerous: "Dangereuse",
    
    // États du ciel (Sun)
    sun_bright: "Grand soleil",
    sun_cloudy: "Voilé",
    sun_rain: "Averses",
    
    // États de l'affluence (Crowd)
    crowd_empty: "Déserte",
    crowd_medium: "Animée",
    crowd_full: "Bondée",
    
    // États des sargasses
    sargassum_none: "Absentes",
    sargassum_low: "Modérées",
    sargassum_high: "Massives",
    
    // Infos et alertes
    no_report: "Aucun signalement",
    waiting: "En attente",
    old: "Ancien",
    reliable: "Fiable",
    confirm_choice: "Choisir et confirmer",
    slow_down: "Doucement !",
    spam_msg: "Vous avez déjà envoyé un signalement. Merci de patienter 30 min.",
    understood: "Compris",
    beach_desc: "Cette plage est magnifique. Profitez bien de votre moment au bord de l'eau !"
  },
  en: {
    back: "Back",
    yes: "Yes",
    no: "No",
    on_site: "On site",
    search_beach: "Search a beach",
    explore: "Explore",
    search_placeholder: "Beach, town...",
    sort_by: "Sort by",
    popular: "Popular",
    nearby: "Nearby",
    state: "Status",
    no_beach_found: "No beach found.",
    weather: "Weather",
    weather_sea: "Sea",
    crowd: "Crowd",
    sargassum: "Sargassum",
    sea_calm: "Calm",
    sea_rough: "Rough",
    sea_dangerous: "Dangerous",
    sun_bright: "Sunny",
    sun_cloudy: "Cloudy",
    sun_rain: "Rainy",
    crowd_empty: "Quiet",
    crowd_medium: "Busy",
    crowd_full: "Crowded",
    sargassum_none: "None",
    sargassum_low: "Moderate",
    sargassum_high: "Massive",
    no_report: "No reports yet",
    waiting: "Waiting",
    old: "Outdated",
    reliable: "Reliable",
    confirm_choice: "Confirm choice",
    slow_down: "Slow down!",
    spam_msg: "You already sent a report. Please wait 30 min.",
    understood: "Got it",
    beach_desc: "This beach is beautiful. Enjoy your time by the water!"
  },
  cr: {
    back: "Déyè",
    yes: "Wi",
    no: "Awa",
    on_site: "Anlè-y",
    search_beach: "Chèché on plaj",
    explore: "Dékouvè",
    search_placeholder: "Plaj, komin...",
    sort_by: "Triyé",
    popular: "Konni",
    nearby: "Pré",
    state: "Léta",
    no_beach_found: "Ponyon plaj la.",
    weather: "Tan-la",
    weather_sea: "Lanmè",
    crowd: "Moun",
    sargassum: "Sargas",
    sea_calm: "Kalm",
    sea_rough: "Ajité",
    sea_dangerous: "Danjéré",
    sun_bright: "Gran solèy",
    sun_cloudy: "Bouyay",
    sun_rain: "Lapli",
    crowd_empty: "Tousèl",
    crowd_medium: "Moun",
    crowd_full: "Blandé",
    sargassum_none: "Minyen",
    sargassum_low: "On ti pé",
    sargassum_high: "An lo",
    no_report: "Pon signalman",
    waiting: "An atant",
    old: "Ansyen",
    reliable: "Fyab",
    confirm_choice: "Vidé sa",
    slow_down: "Dousman !",
    spam_msg: "Atann 30 minit avan ou wou-voté.",
    understood: "Ókay",
    beach_desc: "Plaj-la sa bèl menm. Pran plézi a-w bò dlo-la !"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr'); 
  const t = (key) => {
    return translations[language][key] || translations['fr'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
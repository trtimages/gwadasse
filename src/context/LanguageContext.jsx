import React, { createContext, useState, useContext } from 'react';

// 1. Le dictionnaire de l'interface (boutons, titres, menus)
const translations = {
  fr: {
    back: "Retour",
    weather: "Météo",
    crowd: "Affluence",
    sargassum: "Sargasses",
    parking: "Parking",
    shower: "Douche",
    yes: "Oui",
    no: "Non"
  },
  en: {
    back: "Back",
    weather: "Weather",
    crowd: "Crowd",
    sargassum: "Sargassum",
    parking: "Parking",
    shower: "Shower",
    yes: "Yes",
    no: "No"
  },
  cr: {
    back: "Déyè", // ou "Rétou", tu pourras ajuster !
    weather: "Tan-la",
    crowd: "Moun",
    sargassum: "Sargas",
    parking: "Pakin",
    shower: "Douch",
    yes: "Wi",
    no: "Awa"
  }
};

// 2. Création du contexte React
const LanguageContext = createContext();

// 3. Le "Fournisseur" qui englobera ton application
export const LanguageProvider = ({ children }) => {
  // Par défaut, l'application s'ouvre en français
  const [language, setLanguage] = useState('fr'); 

  // La fonction magique "t" (pour translate) qui ira chercher le bon mot
  const t = (key) => {
    // Si le mot n'existe pas dans la langue choisie, on met le français par sécurité
    return translations[language][key] || translations['fr'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 4. Le Hook personnalisé pour appeler la langue depuis n'importe quel écran
export const useLanguage = () => useContext(LanguageContext);
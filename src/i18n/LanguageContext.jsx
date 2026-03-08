// src/i18n/LanguageContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    // La langue par défaut est le français
    const [language, setLanguage] = useState('fr'); 

    // Notre fonction magique "t" qui va chercher le bon mot
    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Petit raccourci pour utiliser le contexte facilement dans nos écrans
export const useLanguage = () => useContext(LanguageContext);
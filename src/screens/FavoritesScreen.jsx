// src/screens/FavoritesScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";
import { markerColorForBeach } from "../utils/reports.js";
import { ArrowLeft, Heart, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

function getLocalizedText(dataObj, lang) {
    if (!dataObj) return "";
    if (typeof dataObj === 'string') return dataObj;
    return (lang === 'cr' && dataObj.cr) ? dataObj.cr : (dataObj.fr || "");
}

function cleanBeachName(textName) {
    if (!textName) return "";
    let cleaned = textName.replace(/^plage (de la |de l'|des |du |d'|de )?|^des /i, "").trim();
    if (/^caravelle/i.test(cleaned)) return "La Caravelle";
    if (/^perle/i.test(cleaned)) return "La Perle";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function FavoritesScreen({ userProfile, reports }) {
    const navigate = useNavigate();
    const { language } = useLanguage();

    // On récupère la liste des IDs favoris depuis le profil (ou un tableau vide si aucun)
    const favoriteIds = userProfile?.favorites || [];
    
    // On filtre les plages pour ne garder que celles qui sont dans les favoris
    const favoriteBeaches = beaches.filter(b => favoriteIds.includes(b.id));

    return (
        <Layout>
            {/* EN-TÊTE */}
            <div className="flex items-center justify-between mb-6 mt-1 px-1">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-red-500">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">Mes Favoris</h1>
                </div>
                <Heart size={20} className="text-red-500 fill-red-500 drop-shadow-sm" />
            </div>

            {/* SI AUCUN FAVORI */}
            {favoriteBeaches.length === 0 ? (
                <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 text-center mt-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Heart size={30} className="text-red-300" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">Aucun favori</h2>
                    <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                        Tu n'as pas encore ajouté de plage à tes favoris. Clique sur le petit cœur sur la page d'une plage pour la retrouver ici !
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-3.5 bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-md active:scale-95 transition-transform text-sm"
                    >
                        Explorer la carte
                    </button>
                </div>
            ) : (
                /* LISTE DES FAVORIS */
                <div className="space-y-3 pb-6">
                    {favoriteBeaches.map(b => (
                        <button 
                            key={b.id} 
                            onClick={() => navigate(`/beach/${b.id}`)} 
                            className="w-full bg-white p-3 rounded-[20px] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-transform text-left"
                        >
                            <img 
                                src={`/${b.id}.png`} 
                                alt="" 
                                className="w-14 h-14 rounded-[12px] object-cover bg-slate-50 border border-slate-100 shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                            />
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-black text-[14px] text-slate-800 uppercase tracking-tight truncate">
                                    {cleanBeachName(getLocalizedText(b.name, language))}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    {getLocalizedText(b.town, language)}
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-2 shrink-0 px-2">
                                <div 
                                    className="h-4 w-4 rounded-full border-[2px] border-white shadow-sm" 
                                    style={{ backgroundColor: markerColorForBeach(reports, b.id) }} 
                                />
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Layout>
    );
}
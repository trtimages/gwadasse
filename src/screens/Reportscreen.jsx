// src/screens/ReportScreen.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";
import { MapPin, Send } from "lucide-react";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

// --- FONCTIONS UTILITAIRES POUR LES ICÔNES ET NOMS ---
function getVoteCount(allReports, beachId, type, level) {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    return (allReports || []).filter(
        (r) => r.beachId === beachId && r.type === type && r.level === level && (now - r.ts) <= dayInMs
    ).length;
}

function optionLabels(kind, language) {
    const isEn = language === 'en';
    const defaults = {
        sargasses: isEn ? ["None", "Low", "High"] : ["Aucune", "Faible", "Forte"],
        swim: isEn ? ["Calm", "Rough", "Very rough"] : ["Calme", "Agitée", "Très agitée"],
        sun: isEn ? ["Sunny", "Cloudy", "Rainy"] : ["Soleil", "Ciel voilé", "Pluvieux"],
        crowd: isEn ? ["Empty", "Medium", "Full"] : ["Vide", "Moyenne", "Pleine"]
    };
    return defaults[kind] || [];
}

function iconForState(kind, level) {
    const suffix = level === 1 ? "vert" : level === 2 ? "orange" : level === 3 ? "rouge" : "gris";
    if (kind === "sargasses") return `/icone_sarg${suffix}.png`;
    if (kind === "swim") return `/icone_interdiction${suffix}.png`;
    if (kind === "sun") return `/icone_meteo${suffix}.png`;
    if (kind === "crowd") return `/icone_affluence${suffix}.png`;
    return `/icone_${suffix}.png`;
}

// --- COMPOSANT DE LA GRILLE DE CHOIX ---
function MiniGrid({ title, current, onChange, reports, beachId, kind, language }) {
    const labels = optionLabels(kind, language);

    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-2 px-1">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{title}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">24H</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((lvl) => {
                    const active = current === lvl;
                    const votes = getVoteCount(reports, beachId, kind, lvl);
                    const iconPath = iconForState(kind, lvl);

                    // Attribution de la bonne couleur selon le niveau
                    let activeBgClass = "";
                    if (lvl === 1) activeBgClass = "bg-green-500 border-green-500 text-white shadow-md scale-105";
                    else if (lvl === 2) activeBgClass = "bg-orange-500 border-orange-500 text-white shadow-md scale-105";
                    else if (lvl === 3) activeBgClass = "bg-red-500 border-red-500 text-white shadow-md scale-105";

                    return (
                        <button
                            key={lvl}
                            type="button"
                            onClick={() => onChange(active ? 0 : lvl)}
                            className={`relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border-2 transition-all active:scale-95 ${
                                active
                                    ? activeBgClass
                                    : "bg-white border-slate-100 text-slate-500 shadow-sm hover:bg-slate-50"
                            }`}
                        >
                            <img 
                                src={iconPath} 
                                alt="" 
                                // Fini le noir et blanc, juste l'opacité baissée quand inactif
                                className={`w-8 h-8 mb-1.5 object-contain transition-all duration-200 ${active ? 'opacity-100' : 'opacity-50'}`} 
                            />
                            <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${active ? 'text-white' : 'text-slate-700'}`}>
                                    {labels[lvl - 1]}
                                </span>
                                <span className={`text-[8px] font-bold ${active ? "text-white/90" : "text-slate-400"}`}>
                                    {votes} avis
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReportScreen({ reports = [], addReports, userPosition }) {
    const { beachId } = useParams();
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    
    const beachIdNum = Number(beachId);
    const beach = beaches.find((b) => b.id === beachIdNum);

    const [sargasses, setSargasses] = useState(0);
    const [sun, setSun] = useState(0);
    const [swim, setSwim] = useState(0);
    const [crowd, setCrowd] = useState(0);

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage inconnue</div></Layout>;

    const submit = () => {
        if (!(sargasses || sun || swim || crowd)) return;
        const ts = Date.now();
        const batch = [];
        if (sargasses) batch.push({ beachId: beachIdNum, type: "sargasses", level: sargasses, ts });
        if (sun) batch.push({ beachId: beachIdNum, type: "sun", level: sun, ts });
        if (swim) batch.push({ beachId: beachIdNum, type: "swim", level: swim, ts });
        if (crowd) batch.push({ beachId: beachIdNum, type: "crowd", level: crowd, ts });

        addReports(batch);
        navigate(`/beach/${beachIdNum}`);
    };

    const beachNameDisplay = typeof beach.name === 'object' ? (language === 'cr' && beach.name.cr ? beach.name.cr : beach.name.fr) : beach.name;

    // Traduction des titres des catégories
    const titleMap = {
        sun: t("weather") || "Météo",
        swim: t("weather_sea") || "Baignade",
        crowd: t("crowd") || "Affluence",
        sargasses: t("sargassum") || "Sargasses"
    };

    return (
        <Layout>
            {/* Header Radar de Proximité */}
            <div className="flex flex-col items-center justify-center mb-6 mt-1">
                <span className="text-[11px] font-bold text-slate-500 mb-1.5">Vous êtes proche de :</span>
                <div className="text-[13px] font-black text-[#1f7c8a] uppercase italic flex items-center gap-1.5 bg-[#1f7c8a]/10 px-3.5 py-2 rounded-full shadow-sm border border-[#1f7c8a]/20">
                    <MapPin size={14} className={userPosition ? "text-green-500 animate-pulse" : "text-[#1f7c8a]"} />
                    {beachNameDisplay}
                </div>
            </div>

            <div className="space-y-1 pb-4">
                <MiniGrid title={titleMap.sargasses} kind="sargasses" reports={reports} beachId={beachIdNum} current={sargasses} onChange={setSargasses} language={language} />
                <MiniGrid title={titleMap.sun} kind="sun" reports={reports} beachId={beachIdNum} current={sun} onChange={setSun} language={language} />
                <MiniGrid title={titleMap.swim} kind="swim" reports={reports} beachId={beachIdNum} current={swim} onChange={setSwim} language={language} />
                <MiniGrid title={titleMap.crowd} kind="crowd" reports={reports} beachId={beachIdNum} current={crowd} onChange={setCrowd} language={language} />
            </div>

            <button
                onClick={submit}
                disabled={!(sargasses || sun || swim || crowd)}
                className={`mt-1 mb-4 w-full py-4 rounded-[16px] font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    (sargasses || sun || swim || crowd) ? "bg-[#1f7c8a] text-white" : "bg-gray-100 text-gray-400 shadow-none"
                }`}
            >
                <Send size={16} /> Envoyer
            </button>

            {/* --- PUB CLIQUABLE AGRANDIE (h-20 au lieu de h-16) --- */}
            <div className="mb-4 mt-6">
                <p className="text-[8px] text-slate-300 text-right uppercase tracking-widest mb-1 pr-1 font-medium">
                    Partenaire local
                </p>
                <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform">
                    <img 
                        src="/pub_hamac.png" 
                        alt="Partenaire local"
                        className="w-full h-20 object-cover rounded-[18px] opacity-95 shadow-sm border border-slate-100"
                    />
                </a>
            </div>
        </Layout>
    );
}
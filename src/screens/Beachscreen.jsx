import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { beaches } from "@/data/beaches.js";
import { computeDecision } from "@/utils/reports.js";
import { Megaphone, Info, AlertTriangle, MapPin, ArrowDown } from "lucide-react";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const WINDOW_MS = 3 * 60 * 60 * 1000;
const SPAM_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

// --- UTILS DE SÉCURITÉ TEXTE ---
function getLocalizedText(dataObj, lang) {
    if (!dataObj) return "";
    if (typeof dataObj === 'string') return dataObj;
    return (lang === 'cr' && dataObj.cr) ? dataObj.cr : (dataObj.fr || "");
}

// --- NETTOYEUR DE NOM DE PLAGE ---
function cleanBeachName(textName) {
    if (!textName) return "";
    let cleaned = textName.replace(/^plage (de la |de l'|des |du |d'|de )?|^des /i, "").trim();
    if (/^caravelle/i.test(cleaned)) return "La Caravelle";
    if (/^perle/i.test(cleaned)) return "La Perle";
    return cleaned;
}

// --- TRADUCTION DES ÉTATS ---
function decisionText(kind, level, language) {
    if (!level) return ""; 
    const isEn = language === 'en';
    const defaults = {
        sargasses: isEn ? ["None", "Low", "High"] : ["Aucune", "Faible", "Forte"],
        swim: isEn ? ["Calm", "Rough", "Very rough"] : ["Calme", "Agitée", "Très agitée"],
        sun: isEn ? ["Sunny", "Cloudy", "Rainy"] : ["Soleil", "Ciel voilé", "Pluvieux"],
        crowd: isEn ? ["Empty", "Medium", "Full"] : ["Vide", "Moyenne", "Pleine"]
    };
    return defaults[kind]?.[level - 1] || "";
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

function formatTimeAgo(ts, t, language) {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${language === 'en' ? 'ago' : 'il y a'} ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${language === 'en' ? 'ago' : 'il y a'} ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${language === 'en' ? 'ago' : 'il y a'} ${diffDays}j`;
}

function getLatestReport(reports, kind) {
    const relevant = reports.filter(r => r.type === kind);
    if (relevant.length === 0) return null;
    return relevant.reduce((latest, current) => current.ts > latest.ts ? current : latest);
}

// COMPOSANT EVENTITEM
function EventItem({ value, title, kind, activeDecision, allBeachReports, apiFallback, selectedLevel, onPick, onSubmit, recentCount, t, language }) {
    let level = activeDecision?.level || 0;
    let isOutdated = false;
    let timeAgoText = "";

    if (level === 0) {
        if (kind === 'sun' && apiFallback) level = apiFallback;
        else if (kind === 'swim' && apiFallback) level = apiFallback;
        else if (kind === 'crowd') level = 1; 
        else {
            const latest = getLatestReport(allBeachReports, kind);
            if (latest) {
                level = latest.level;
                isOutdated = true;
                timeAgoText = formatTimeAgo(latest.ts, t, language);
            }
        }
    }

    const labels = optionLabels(kind, language);
    const reliability = Math.min(100, Math.round(recentCount * 33.33));

    return (
        <AccordionItem value={value} className="border-b border-slate-100 last:border-none">
            <AccordionTrigger className="px-3 py-3 hover:no-underline transition-all [&>svg]:hidden">
                <div className="flex items-center gap-3 w-full text-left">
                    <div className="relative shrink-0">
                        <img 
                            src={iconForState(kind, level)} 
                            alt="" 
                            className={`w-[53px] h-[53px] object-contain drop-shadow-sm transition-all ${isOutdated ? 'grayscale opacity-50' : ''}`} 
                        />
                        <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-white ${
                            level === 0 ? 'bg-gray-200' :
                            isOutdated ? 'bg-gray-400' :
                            level === 1 ? 'bg-green-500' : 
                            level === 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                    </div>
                    
                    <div className="flex flex-col flex-1 justify-center">
                        <div className="flex justify-between items-center pr-1">
                            <span className={`text-[12px] font-black uppercase tracking-tighter ${isOutdated ? 'text-slate-400' : 'text-[#1f7c8a]'}`}>
                                {title}
                            </span>
                            {(recentCount > 0 || isOutdated) && (
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    {isOutdated ? t("old") : `${t("reliable")} ${reliability}%`}
                                </span>
                            )}
                        </div>

                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className={`text-[14px] font-black leading-tight ${isOutdated ? 'text-slate-500' : 'text-slate-800'}`}>
                                {decisionText(kind, level, language)}
                            </span>
                            {isOutdated && (
                                <span className="text-[9px] font-bold text-slate-400 italic">
                                    ({timeAgoText})
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center shrink-0 w-8 ${isOutdated ? 'text-slate-400' : 'text-[#1f7c8a]'} opacity-80`}>
                        <Megaphone size={18} strokeWidth={2.5} className="drop-shadow-sm" />
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-3 pb-4 pt-1 bg-slate-50/30 border-t border-slate-50">
                <div className="space-y-3 mt-1">
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => onPick(lvl)}
                                className={`py-2.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${
                                    selectedLevel === lvl 
                                        ? (lvl === 1 ? 'bg-green-500 border-green-500 text-white shadow-md scale-105 opacity-100' 
                                         : lvl === 2 ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-105 opacity-100' 
                                         : 'bg-red-500 border-red-500 text-white shadow-md scale-105 opacity-100') 
                                        : (lvl === 1 ? 'bg-green-500 border-green-500 text-white opacity-50' 
                                         : lvl === 2 ? 'bg-orange-500 border-orange-500 text-white opacity-50' 
                                         : 'bg-red-500 border-red-500 text-white opacity-50')
                                }`}
                            >
                                {labels[lvl - 1]}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!selectedLevel}
                        className={`w-full py-3 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 ${
                            selectedLevel ? "bg-[#068db3] text-white shadow-lg" : "bg-gray-200 text-gray-400"
                        }`}
                    >
                        CONFIRMER
                    </button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export default function BeachScreen({ reports = [], addReports, userPosition }) {
    const { beachId } = useParams();
    const navigate = useNavigate();
    const { language, t } = useLanguage(); 
    
    const beach = beaches.find(b => b.id === Number(beachId));
    const [openItem, setOpenItem] = useState("");
    const [picked, setPicked] = useState({ sargasses: 0, swim: 0, sun: 0, crowd: 0 });
    const [showSpamModal, setShowSpamModal] = useState(false);
    const [apiData, setApiData] = useState({ sun: 0, swim: 0 });

    useEffect(() => {
        if (!beach || !beach.lat || !beach.lng) return;

        const fetchMeteoData = async () => {
            const now = new Date();
            const logicalDate = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
            const cacheKey = `meteo_cache_${beach.id}_${logicalDate}`;

            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                setApiData(JSON.parse(cachedData));
                return; 
            }

            try {
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${beach.lat}&longitude=${beach.lng}&current=weather_code&models=meteofrance_seamless`);
                const weatherData = await weatherRes.json();
                const codeWMO = weatherData.current?.weather_code || 0;
                
                let sunLevel = 1; 
                if (codeWMO > 0 && codeWMO <= 48) sunLevel = 2; 
                if (codeWMO >= 50) sunLevel = 3; 

                const marineRes = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${beach.lat}&longitude=${beach.lng}&current=wave_height`);
                const marineData = await marineRes.json();
                const waveHeight = marineData.current?.wave_height || 0;

                let swimLevel = 1; 
                if (waveHeight >= 1.5 && waveHeight < 2.5) swimLevel = 2; 
                if (waveHeight >= 2.5) swimLevel = 3; 

                const finalApiData = { sun: sunLevel, swim: swimLevel };
                setApiData(finalApiData);
                localStorage.setItem(cacheKey, JSON.stringify(finalApiData));
            } catch (error) {
                console.error("Impossible de récupérer la météo Open-Meteo :", error);
            }
        };

        fetchMeteoData();
    }, [beach]);

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage introuvable</div></Layout>;

    const handleAction = (kind) => {
        const now = Date.now();
        const isAdmin = userPosition?.lat && userPosition.lat > 40;
        const lockKey = `lock_${beach.id}_${kind}`;
        const lastReport = localStorage.getItem(lockKey);

        if (!isAdmin && lastReport && now - Number(lastReport) < SPAM_LIMIT_MS) {
            setShowSpamModal(true);
            return;
        }

        if (typeof addReports === "function") {
            addReports([{ beachId: beach.id, type: kind, level: picked[kind], ts: now }]);
            if (!isAdmin) localStorage.setItem(lockKey, now.toString());
            setPicked(p => ({ ...p, [kind]: 0 }));
            setOpenItem("");
        }
    };

    return (
        <Layout>
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-4 mt-0">
                
                {/* 1. L'EN-TÊTE DE LA PLAGE */}
                <div className="p-3.5 flex items-center gap-3.5 text-left bg-white">
                    <img
                        src={`/${beach.id}.png`}
                        alt={getLocalizedText(beach.name, language)}
                        className="w-18 h-18 rounded-[18px] object-cover bg-slate-50 shadow-inner shrink-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                    />

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            {/* TITRE ÉPURÉ ET RÉDUIT (text-[13px] au lieu de text-[15px]) */}
                            <h1 className="text-[13px] font-black text-black leading-tight uppercase tracking-tight line-clamp-2 pr-2">
                                {cleanBeachName(getLocalizedText(beach.name, language))}
                            </h1>

                            <div className="flex items-center pl-2 shrink-0">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
                                            <Info size={16} className="text-slate-500" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[92vw] max-w-[380px] rounded-[35px] border-none shadow-2xl p-0 bg-white overflow-hidden">
                                        <img
                                            src={`/${beach.id}.jpg`}
                                            alt=""
                                            className="w-full h-40 object-cover shadow-md"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                                        />
                                        <div className="p-6">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-black uppercase text-slate-800 text-center mb-1">
                                                    {cleanBeachName(getLocalizedText(beach.name, language))}
                                                </DialogTitle>
                                                <div className="text-center text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest">
                                                    {getLocalizedText(beach.town, language)}
                                                </div>
                                            </DialogHeader>
                                            <div className="flex gap-2 justify-center mb-5">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-base">🚗</span>
                                                    <span className="text-[11px] font-black text-slate-700">{(beach.parking || "").includes("Oui") ? t("yes") : t("no")}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-base">🚿</span>
                                                    <span className="text-[11px] font-black text-slate-700">{(beach.douche || "").includes("Oui") ? t("yes") : t("no")}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-600 leading-relaxed text-center font-medium mb-6 px-2">
                                                {t("beach_desc")}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <p className="text-slate-400 font-bold text-[9px] uppercase mt-1">
                            {getLocalizedText(beach.town, language)}
                        </p>

                        <div className="flex gap-1.5 mt-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[13px]">🚗</span>
                                <span className="text-[9px] font-black text-slate-700">{(beach.parking || "").includes("Oui") ? t("yes") : t("no")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[13px]">🚿</span>
                                <span className="text-[9px] font-black text-slate-700">{(beach.douche || "").includes("Oui") ? t("yes") : t("no")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. LE BANDEAU "SIGNALER" (Intégré avec la couleur bleue et texte blanc) */}
                <div className="w-full py-2.5 bg-[#068db3] flex items-center justify-center gap-2">
                    <MapPin size={14} className="text-white" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest mt-0.5">
                        Vous êtes sur place ? Signalez
                    </span>
                    <ArrowDown size={14} className="text-white animate-bounce" />
                </div>

                {/* 3. L'ACCORDÉON DES ÉVÉNEMENTS */}
                <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
                    {["sargasses", "swim", "sun", "crowd"].map((kind) => {
                        const allBeachReports = reports.filter(r => r.beachId === beach.id);
                        const recentReports = allBeachReports.filter(r => r.type === kind && (Date.now() - r.ts) <= WINDOW_MS);
                        
                        const titleMap = {
                            sun: t("weather"),
                            swim: t("weather_sea") || t("weather"),
                            crowd: t("crowd"),
                            sargasses: t("sargassum")
                        };

                        return (
                            <EventItem
                                key={kind}
                                value={kind}
                                title={titleMap[kind]}
                                kind={kind}
                                activeDecision={computeDecision(allBeachReports, kind, WINDOW_MS)}
                                allBeachReports={allBeachReports}
                                apiFallback={apiData[kind]} 
                                recentCount={recentReports.length}
                                selectedLevel={picked[kind]}
                                onPick={(lvl) => setPicked(p => ({ ...p, [kind]: p[kind] === lvl ? 0 : lvl }))}
                                onSubmit={() => handleAction(kind)}
                                t={t}
                                language={language}
                            />
                        );
                    })}
                </Accordion>
            </div>

            <Dialog open={showSpamModal} onOpenChange={setShowSpamModal}>
                <DialogContent className="w-[85vw] max-w-[320px] rounded-[30px] border-none p-6 bg-white text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic text-slate-800">{t("slow_down")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 font-medium my-4">{t("spam_msg")}</p>
                    <button
                        onClick={() => setShowSpamModal(false)}
                        className="w-full py-3 bg-[#1f7c8a] text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        {t("understood")}
                    </button>
                </DialogContent>
            </Dialog>

            {/* BANDEAU PUB AVEC IMAGE */}
            <div className="mb-4">
                <p className="text-[8px] text-slate-300 text-right uppercase tracking-widest mb-1 pr-1 font-medium">
                    Partenaire local
                </p>
                <img 
                    src="/pub_hamac.png" 
                    alt="Partenaire local"
                    className="w-full h-[100px] object-cover rounded-2xl shadow-sm border border-slate-100"
                />
            </div>

        </Layout>
    );
}
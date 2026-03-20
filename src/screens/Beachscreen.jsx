// src/screens/BeachScreen.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { beaches } from "@/data/beaches.js";
import { computeDecision } from "@/utils/reports.js";
import { Megaphone, Info, MapPin, Heart, MessageSquare } from "lucide-react";

// --- IMPORT DES TEXTES DESCRIPTIFS ---
import { beachContent } from "../i18n/beachcontent.js";

// --- IMPORT FIREBASE ---
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

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

    if (lang === 'en' && dataObj.en) return dataObj.en;
    if (lang === 'cr' && dataObj.cr) return dataObj.cr;
    
    return dataObj.fr || ""; 
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
        swim: isEn ? ["Calm", "Rough", "Very rough"] : ["Calme", "Agitée", "Très agit."],
        sun: isEn ? ["Sunny", "Cloudy", "Rainy"] : ["Soleil", "Voilé", "Pluvieux"],
        crowd: isEn ? ["Empty", "Medium", "Full"] : ["Vide", "Moyenne", "Pleine"]
    };
    return defaults[kind]?.[level - 1] || "";
}

function optionLabels(kind, language) {
    const isEn = language === 'en';
    const defaults = {
        sargasses: isEn ? ["None", "Low", "High"] : ["Aucune", "Faible", "Forte"],
        swim: isEn ? ["Calm", "Rough", "Very rough"] : ["Calme", "Agitée", "Très agit."],
        sun: isEn ? ["Sunny", "Cloudy", "Rainy"] : ["Soleil", "Voilé", "Pluvieux"],
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

// --- COMPOSANT EVENTITEM ---
function EventItem({ title, kind, activeDecision, allBeachReports, apiFallback, selectedLevel, onPick, recentCount, t, language, setShowSpamModal, userPosition, SPAM_LIMIT_MS, addReports, beachId }) {
    const [isOpen, setIsOpen] = useState(false);
    
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

    const handleTriggerClick = () => {
        const now = Date.now();
        const isAdmin = userPosition?.lat && userPosition.lat > 40;
        const lockKey = `lock_${beachId}_${kind}`;
        const lastReport = localStorage.getItem(lockKey);

        if (!isAdmin && lastReport && now - Number(lastReport) < SPAM_LIMIT_MS) {
            setShowSpamModal(true);
            return;
        }
        setIsOpen(true);
    };

    const handleConfirm = () => {
        const now = Date.now();
        const isAdmin = userPosition?.lat && userPosition.lat > 40;
        const lockKey = `lock_${beachId}_${kind}`;
        
        if (typeof addReports === "function") {
            addReports([{ beachId: Number(beachId), type: kind, level: selectedLevel, ts: now }]);
            if (!isAdmin) localStorage.setItem(lockKey, now.toString());
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button 
                    onClick={handleTriggerClick}
                    className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden relative w-full h-full flex flex-col items-center justify-center px-2 py-2 active:scale-95 transition-transform"
                >
                    
                    <div className={`absolute top-2 right-2 ${isOutdated ? 'text-slate-300' : 'text-[#1f7c8a]/30'} z-10 pointer-events-none`}>
                        <Megaphone size={12} strokeWidth={2.5} />
                    </div>

                    <div className="relative shrink-0 w-[65px] h-[65px] flex items-center justify-center mt-1">
                        <img 
                            src={iconForState(kind, level)} 
                            alt="" 
                            className={`w-full h-full object-contain drop-shadow-md transition-all ${isOutdated ? 'grayscale opacity-50' : ''}`} 
                        />
                        <div className={`absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full border-[2px] border-white shadow-sm ${
                            level === 0 ? 'bg-gray-200' :
                            isOutdated ? 'bg-gray-400' :
                            level === 1 ? 'bg-green-500' : 
                            level === 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                    </div>
                    
                    <div className="flex flex-col items-center text-center w-full mt-0">
                        <div className="text-[11px] font-black uppercase tracking-tighter leading-tight flex flex-wrap justify-center gap-1">
                            <span className={isOutdated ? 'text-slate-400' : 'text-[#1f7c8a]'}>
                                {title} :
                            </span>
                            <span className={isOutdated ? 'text-slate-500' : 'text-slate-800'}>
                                {decisionText(kind, level, language) || "Inconnu"}
                            </span>
                        </div>

                        {isOutdated && (
                            <span className="text-[8px] font-bold text-slate-400 italic mt-0.5 leading-none">
                                ({timeAgoText})
                            </span>
                        )}
                    </div>
                </button>
            </DialogTrigger>

            <DialogContent className="w-[90vw] max-w-[340px] rounded-[30px] p-5 bg-white border-none shadow-2xl flex flex-col gap-4 z-[200]">
                <DialogHeader>
                    <DialogTitle className="text-center font-black uppercase text-[#1f7c8a] tracking-widest text-lg">
                        Mettre à jour : {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 w-full mt-2">
                    {[1, 2, 3].map((lvl) => {
                        const isSelected = selectedLevel === lvl;
                        
                        let colors = "";
                        if (lvl === 1) colors = isSelected ? "bg-green-500 border-green-500 text-white shadow-md scale-[1.02]" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100";
                        if (lvl === 2) colors = isSelected ? "bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]" : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100";
                        if (lvl === 3) colors = isSelected ? "bg-red-500 border-red-500 text-white shadow-md scale-[1.02]" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100";

                        return (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => onPick(lvl)}
                                className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-wider px-1 ${colors}`}
                            >
                                {labels[lvl - 1]}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedLevel}
                    className={`w-full py-3.5 mt-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                        selectedLevel ? "bg-[#068db3] text-white shadow-md" : "bg-gray-200 text-gray-400"
                    }`}
                >
                    CONFIRMER
                </button>
            </DialogContent>
        </Dialog>
    );
}

// --- COMPOSANT BULLE DE COMMENTAIRE (AVEC IMAGE) ---
function CommentBubble({ report, t, language }) {
    const [authorName, setAuthorName] = useState("Marin Anonyme");
    
    useEffect(() => {
        if (report.userId && report.userId !== "anonymous") {
            const fetchName = async () => {
                try {
                    const userDoc = await getDoc(doc(db, "users", report.userId));
                    if (userDoc.exists() && userDoc.data().displayName) {
                        setAuthorName(userDoc.data().displayName);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            fetchName();
        }
    }, [report.userId]);

    return (
        <div className="bg-white p-3.5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col gap-1.5 shrink-0 w-[240px] snap-center">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-[#1f7c8a] truncate pr-2">
                    {authorName}
                </span>
                <span className="text-[9px] font-bold text-slate-400 shrink-0 bg-slate-50 px-1.5 py-0.5 rounded-md">
                    {formatTimeAgo(report.ts, t, language)}
                </span>
            </div>
            
            {/* AFFICHAGE DE LA PHOTO SI ELLE EXISTE */}
            {report.imageUrl && (
                <div className="w-full rounded-[12px] overflow-hidden bg-slate-100 mb-1 shrink-0">
                    <img 
                        src={report.imageUrl} 
                        alt="Observation" 
                        className="w-full h-[120px] object-cover"
                        loading="lazy"
                    />
                </div>
            )}

            {/* AFFICHAGE DU TEXTE S'IL Y EN A UN */}
            {report.comment && (
                <p className="text-[12px] text-slate-600 font-medium leading-snug">
                    "{report.comment}"
                </p>
            )}
        </div>
    );
}

export default function BeachScreen({ reports = [], addReports, userPosition, user, userProfile }) {
    const { beachId } = useParams();
    const navigate = useNavigate();
    const { language, t } = useLanguage(); 
    
    const beachIdNum = Number(beachId);
    const beach = beaches.find(b => b.id === beachIdNum);
    
    // --- LECTURE SÉCURISÉE DU DICTIONNAIRE ---
    const extraContent = beachContent ? beachContent[beachIdNum] : null;

    const [picked, setPicked] = useState({ sargasses: 0, swim: 0, sun: 0, crowd: 0 });
    const [showSpamModal, setShowSpamModal] = useState(false);
    const [apiData, setApiData] = useState({ sun: 0, swim: 0 });

    const isFavorite = userProfile?.favorites?.includes(beach?.id);

    const toggleFavorite = async () => {
        if (!user) {
            alert("Connectez-vous à votre profil pour ajouter des favoris !");
            return navigate("/profile");
        }
        
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                favorites: isFavorite ? arrayRemove(beach.id) : arrayUnion(beach.id)
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour des favoris:", error);
        }
    };

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
                console.error("Impossible de récupérer la météo :", error);
            }
        };

        fetchMeteoData();
    }, [beach]);

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage introuvable</div></Layout>;

    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // --- NOUVEAU FILTRE POUR GARDER CEUX QUI ONT UN COMMENTAIRE OU UNE PHOTO ---
    const commentsList = reports
        .filter(r => r.beachId === beach.id && (r.comment || r.imageUrl) && r.ts > twentyFourHoursAgo)
        .sort((a, b) => b.ts - a.ts); 

    return (
        <Layout>
            {/* BLOC 1: EN-TÊTE AVEC IMAGE EN MÉDAILLON */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden mb-4 mt-0">
                <div className="p-3.5 flex items-center gap-3.5 text-left bg-white">
                    <img
                        src={`/${beach.id}.png`}
                        alt={getLocalizedText(beach.name, language)}
                        className="w-18 h-18 rounded-[18px] object-cover bg-slate-50 shadow-inner shrink-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                    />

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h1 className="text-[13px] font-black text-black leading-tight uppercase tracking-tight line-clamp-2 pr-2">
                                {cleanBeachName(getLocalizedText(beach.name, language))}
                            </h1>

                            <div className="flex items-center gap-1.5 pl-2 shrink-0">
                                <button 
                                    onClick={toggleFavorite}
                                    className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-red-50 active:scale-90 transition-all shadow-sm"
                                >
                                    <Heart 
                                        size={15} 
                                        className={`transition-colors ${isFavorite ? "text-red-500 fill-red-500" : "text-slate-400"}`} 
                                    />
                                </button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
                                            <Info size={16} className="text-slate-500" />
                                        </button>
                                    </DialogTrigger>
                                    
                                    {/* --- POP-UP D'INFORMATION --- */}
                                    <DialogContent className="w-[92vw] max-w-[380px] rounded-[35px] border-none shadow-2xl p-0 bg-white overflow-hidden z-[200]">
                                        <div className="relative w-full h-64">
                                            {/* Image de fond */}
                                            <img
                                                src={`/${beach.id}.png`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                                            />
                                            {/* Dégradé sombre en bas pour la lisibilité */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                            
                                            {/* Textes et Badges par-dessus l'image */}
                                            <div className="absolute bottom-0 left-0 right-0 p-5">
                                                <DialogHeader className="text-left mb-3">
                                                    <DialogTitle className="text-2xl font-black uppercase text-white leading-tight drop-shadow-md">
                                                        {cleanBeachName(getLocalizedText(beach.name, language))}
                                                    </DialogTitle>
                                                    <div className="text-[11px] font-bold uppercase tracking-widest text-white/80 drop-shadow-sm">
                                                        {getLocalizedText(beach.town, language)}
                                                    </div>
                                                </DialogHeader>

                                                <div className="flex gap-2">
                                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/20">
                                                        <span className="text-[13px]">🚗</span>
                                                        <span className="text-[10px] font-black text-white">{(beach.parking || "").includes("Oui") ? t("yes") : t("no")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/20">
                                                        <span className="text-[13px]">🚿</span>
                                                        <span className="text-[10px] font-black text-white">{(beach.douche || "").includes("Oui") ? t("yes") : t("no")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Texte personnalisé récupéré depuis le dictionnaire */}
                                        <div className="p-6 bg-white">
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium text-justify">
                                                {getLocalizedText(extraContent, language) || "Aucune description détaillée n'est encore disponible pour cette plage. N'hésitez pas à la découvrir par vous-même !"}
                                            </p>
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

                <button 
                    onClick={() => navigate(`/beach/${beach.id}/report`)}
                    className="w-full py-3 bg-[#068db3] flex items-center justify-center gap-2 hover:bg-[#057a9b] transition-colors active:bg-[#046884]"
                >
                    <MapPin size={14} className="text-white" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest mt-0.5">
                        Sur place ? Signalez ou Commentez
                    </span>
                </button>
            </div>

            {/* LA GRILLE DES ÉVÉNEMENTS (2x2) */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
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
                            title={titleMap[kind]}
                            kind={kind}
                            activeDecision={computeDecision(allBeachReports, kind, WINDOW_MS)}
                            allBeachReports={allBeachReports}
                            apiFallback={apiData[kind]} 
                            recentCount={recentReports.length}
                            selectedLevel={picked[kind]}
                            onPick={(lvl) => setPicked(p => ({ ...p, [kind]: p[kind] === lvl ? 0 : lvl }))}
                            t={t}
                            language={language}
                            setShowSpamModal={setShowSpamModal}
                            userPosition={userPosition}
                            SPAM_LIMIT_MS={SPAM_LIMIT_MS}
                            addReports={addReports}
                            beachId={beach.id}
                        />
                    );
                })}
            </div>

            {/* L'ESPACE DERNIERS COMMENTAIRES ET PHOTOS */}
            {commentsList.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <MessageSquare size={16} className="text-[#1f7c8a]" />
                        <h2 className="text-[12px] font-black text-slate-700 uppercase tracking-widest">
                            En direct de la plage
                        </h2>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-3 pb-2 snap-x px-1 custom-scrollbar">
                        {commentsList.map((report) => (
                            <CommentBubble 
                                key={report.id} 
                                report={report} 
                                t={t} 
                                language={language} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* MODALE ANTI-SPAM */}
            <Dialog open={showSpamModal} onOpenChange={setShowSpamModal}>
                <DialogContent className="w-[85vw] max-w-[320px] rounded-[30px] border-none p-6 bg-white text-center z-[300]">
                    <div className="text-4xl mb-4">⏳</div>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic text-slate-800">{t("slow_down") || "Doucement le pro !"}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 font-medium my-4">
                        {t("spam_msg") || "Vous avez déjà signalé cet état récemment. Merci de patienter un peu pour éviter les abus."}
                    </p>
                    <button
                        onClick={() => setShowSpamModal(false)}
                        className="w-full py-3 bg-[#1f7c8a] text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        {t("understood") || "J'ai compris"}
                    </button>
                </DialogContent>
            </Dialog>

            {/* BANDEAU PUB RÉDUIT ET CENTRÉ (-20%) */}
            <div className="mb-4 flex flex-col items-center">
                <div className="w-[80%]">
                    <p className="text-[7px] text-slate-300 text-right uppercase tracking-widest mb-1 pr-1 font-medium">
                        Partenaire local
                    </p>
                    <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform w-full">
                        <img 
                            src="/pub_hamac.png" 
                            alt="Partenaire local"
                            className="w-full h-[64px] object-cover rounded-[16px] opacity-95 shadow-sm border border-slate-100"
                        />
                    </a>
                </div>
            </div>

        </Layout>
    );
}
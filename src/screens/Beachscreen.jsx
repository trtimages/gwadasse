// src/screens/BeachScreen.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { beaches } from "@/data/beaches.js";
import { computeDecision } from "@/utils/reports.js";
import { Plus } from "lucide-react";

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

// --- UTILS ---
function decisionText(kind, level) {
    if (!level) return "Aucun signalement";
    if (kind === "sargasses") return level === 1 ? "Absentes" : level === 2 ? "Modérées" : "Massives";
    if (kind === "swim") return level === 1 ? "Calme" : level === 2 ? "Agitée" : "Dangereuse";
    if (kind === "sun") return level === 1 ? "Grand soleil" : level === 2 ? "Voilé" : "Averses";
    if (kind === "crowd") return level === 1 ? "Déserte" : level === 2 ? "Animée" : "Bondée";
    return "";
}

function optionLabels(kind) {
    if (kind === "sargasses") return ["Absentes", "Modérées", "Massives"];
    if (kind === "swim") return ["Calme", "Agitée", "Dangereuse"];
    if (kind === "sun") return ["Grand soleil", "Voilé", "Averses"];
    if (kind === "crowd") return ["Déserte", "Animée", "Bondée"];
    return ["Vert", "Orange", "Rouge"];
}

function iconForState(kind, level) {
    const suffix = level === 1 ? "vert" : level === 2 ? "orange" : level === 3 ? "rouge" : "gris";
    if (kind === "sargasses") return `/icone_sarg${suffix}.png`;
    if (kind === "swim") return `/icone_interdiction${suffix}.png`;
    if (kind === "sun") return `/icone_meteo${suffix}.png`;
    if (kind === "crowd") return `/icone_affluence${suffix}.png`;
    return `/icone_${suffix}.png`;
}

// FORMATAGE DU TEMPS (ex: "il y a 4h")
function formatTimeAgo(ts) {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays}j`;
}

// RECHERCHE DU DERNIER SIGNALEMENT ABSOLU
function getLatestReport(reports, kind) {
    const relevant = reports.filter(r => r.type === kind);
    if (relevant.length === 0) return null;
    return relevant.reduce((latest, current) => current.ts > latest.ts ? current : latest);
}

// COMPOSANT EVENTITEM (AVEC GESTION DU TEMPS)
function EventItem({ value, title, kind, activeDecision, allBeachReports, selectedLevel, onPick, onSubmit, recentCount }) {
    // On regarde s'il y a une décision "fraîche" (< 3h)
    let level = activeDecision?.level || 0;
    let isOutdated = false;
    let timeAgoText = "";

    // S'il n'y a pas de décision fraîche, on cherche la plus récente dans l'historique
    if (level === 0) {
        const latest = getLatestReport(allBeachReports, kind);
        if (latest) {
            level = latest.level;
            isOutdated = true;
            timeAgoText = formatTimeAgo(latest.ts);
        }
    }

    const labels = optionLabels(kind);
    const reliability = Math.min(100, Math.round(recentCount * 33.33));

    return (
        <AccordionItem value={value} className="border-b border-gray-50 last:border-none">
            <AccordionTrigger className="px-4 py-4 hover:no-underline transition-all">
                <div className="flex items-center gap-3.5 w-full text-left">
                    <div className="relative shrink-0">
                        {/* Si obsolète, on applique un filtre gris et on baisse l'opacité */}
                        <img 
                            src={iconForState(kind, level)} 
                            alt="" 
                            className={`w-14 h-14 object-contain drop-shadow-sm transition-all ${isOutdated ? 'grayscale opacity-50' : ''}`} 
                        />
                        <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2px] border-white ${
                            level === 0 ? 'bg-gray-200' :
                            isOutdated ? 'bg-gray-400' :
                            level === 1 ? 'bg-green-500' : 
                            level === 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                    </div>
                    
                    <div className="flex flex-col flex-1 justify-center">
                        <div className="flex justify-between items-center pr-1 mb-1">
                            <span className={`text-[13px] font-black uppercase tracking-tighter ${isOutdated ? 'text-slate-400' : 'text-[#1f7c8a]'}`}>
                                {title}
                            </span>
                            
                            {/* Indice de fiabilité ou mention d'ancienneté */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {level === 0 ? "En attente" : 
                                     isOutdated ? "Ancien" : 
                                     `Fiable ${reliability}%`}
                                </span>
                                {!isOutdated && level > 0 && (
                                    <div className="flex items-end gap-[2px] h-2.5 pb-[1px]">
                                        <div className={`w-1 rounded-sm transition-colors ${recentCount >= 1 ? 'bg-[#1f7c8a] h-1.5' : 'bg-slate-200 h-1'}`} />
                                        <div className={`w-1 rounded-sm transition-colors ${recentCount >= 2 ? 'bg-[#1f7c8a] h-2' : 'bg-slate-200 h-1'}`} />
                                        <div className={`w-1 rounded-sm transition-colors ${recentCount >= 3 ? 'bg-[#1f7c8a] h-2.5' : 'bg-slate-200 h-1'}`} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statut avec affichage du temps si c'est vieux */}
                        <div className="flex items-baseline gap-2">
                            <span className={`text-[18px] font-black leading-tight ${isOutdated ? 'text-slate-500' : 'text-slate-800'}`}>
                                {decisionText(kind, level)}
                            </span>
                            {isOutdated && (
                                <span className="text-[10px] font-bold text-slate-400 italic">
                                    ({timeAgoText})
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <Plus size={22} className={`${isOutdated ? 'text-slate-400' : 'text-[#1f7c8a]'} mr-2 opacity-80 shrink-0`} />
                </div>
            </AccordionTrigger>

            {/* Contenu de l'accordéon */}
            <AccordionContent className="px-4 pb-5 pt-1 bg-slate-50/30">
                <div className="space-y-3.5">
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => onPick(lvl)}
                                className={`py-3 rounded-xl border-2 transition-all font-black text-[12px] ${
                                    selectedLevel === lvl 
                                        ? (lvl === 1 ? 'bg-green-500 border-green-500 text-white shadow-md scale-105' 
                                         : lvl === 2 ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-105' 
                                         : 'bg-red-500 border-red-500 text-white shadow-md scale-105') 
                                        : "bg-white border-gray-100 text-gray-500 active:bg-slate-50"
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
                        className={`w-full py-3.5 rounded-xl font-black text-[13px] uppercase tracking-widest transition-all active:scale-95 ${
                            selectedLevel ? "bg-black text-white shadow-lg" : "bg-gray-200 text-gray-400"
                        }`}
                    >
                        Choisir et confirmer
                    </button>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

export default function BeachScreen({ reports = [], addReports, userPosition }) {
    const { beachId } = useParams();
    const beach = beaches.find(b => b.id === Number(beachId));
    const [openItem, setOpenItem] = useState("");
    const [picked, setPicked] = useState({ sargasses: 0, swim: 0, sun: 0, crowd: 0 });
    const [showSpamModal, setShowSpamModal] = useState(false);

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
            <div className="bg-white rounded-[22px] shadow-sm border border-gray-100 p-3.5 mb-3 mt-1.5">
                <div className="flex items-center gap-3.5 text-left">
                    <img
                        src={`/${beach.id}.png`}
                        alt={beach.name}
                        className="w-14 h-14 rounded-[16px] object-cover bg-slate-50 shadow-inner shrink-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                    />

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h1 className="text-[17px] font-black text-black leading-none uppercase tracking-tight">
                                {beach.name}
                            </h1>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="h-7 w-7 rounded-full bg-black border-2 border-black flex items-center justify-center active:scale-90 transition-transform shadow-sm shrink-0">
                                        <span className="text-[12px] font-black text-white">i</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="w-[92vw] max-w-[380px] rounded-[35px] border-none shadow-2xl p-0 bg-white overflow-hidden">
                                    <img
                                        src={`/${beach.id}.jpg`}
                                        alt={beach.name}
                                        className="w-full h-40 object-cover shadow-md"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                                    />
                                    <div className="p-6">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-black uppercase text-slate-800 text-center mb-1">{beach.name}</DialogTitle>
                                            <div className="text-center text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest">{beach.town}</div>
                                        </DialogHeader>
                                        <div className="flex gap-2 justify-center mb-5">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100"><span className="text-base">🚗</span><span className="text-[11px] font-black text-slate-700">{beach.parking || "Non"}</span></div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100"><span className="text-base">🚿</span><span className="text-[11px] font-black text-slate-700">{beach.douche || "Non"}</span></div>
                                        </div>
                                        <div className="text-sm text-slate-600 leading-relaxed text-center font-medium mb-6 px-2">
                                            Cette plage est réputée pour son sable fin et ses eaux cristallines. {beach.name} offre un cadre idéal pour la détente.
                                        </div>
                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-2 text-center">Partenaire Local</div>
                                            <img src="/pub_hamac.png" alt="" className="w-full h-20 object-cover rounded-2xl shadow-inner opacity-90" />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <p className="text-slate-400 font-bold text-[9px] uppercase mt-1">{beach.town}</p>

                        <div className="flex gap-1.5 mt-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100"><span className="text-[15px]">🚗</span><span className="text-[10px] font-black text-slate-700">{beach.parking || "Non"}</span></div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100"><span className="text-[15px]">🚿</span><span className="text-[10px] font-black text-slate-700">{beach.douche || "Non"}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={showSpamModal} onOpenChange={setShowSpamModal}>
                <DialogContent className="w-[85vw] max-w-[320px] rounded-[30px] border-none p-6 bg-white text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic text-slate-800">Doucement !</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 font-medium my-4">
                        Vous avez déjà envoyé un signalement pour cette catégorie. Merci de patienter 30 minutes avant le prochain vote.
                    </p>
                    <button
                        onClick={() => setShowSpamModal(false)}
                        className="w-full py-3 bg-[#1f7c8a] text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        Compris
                    </button>
                </DialogContent>
            </Dialog>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-4">
                <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
                    {["sargasses", "swim", "sun", "crowd"].map((kind) => {
                        const allBeachReports = reports.filter(r => r.beachId === beach.id);
                        const recentReports = allBeachReports.filter(r => r.type === kind && (Date.now() - r.ts) <= WINDOW_MS);
                        
                        return (
                            <EventItem
                                key={kind}
                                value={kind}
                                // Mise à jour des titres ici
                                title={kind === "sun" ? "Soleil" : kind === "swim" ? "Mer" : kind === "crowd" ? "Affluence" : "Sargasses"}
                                kind={kind}
                                activeDecision={computeDecision(allBeachReports, kind, WINDOW_MS)}
                                allBeachReports={allBeachReports}
                                reportCount={recentReports.length}
                                selectedLevel={picked[kind]}
                                onPick={(lvl) => setPicked(p => ({ ...p, [kind]: p[kind] === lvl ? 0 : lvl }))}
                                onSubmit={() => handleAction(kind)}
                            />
                        );
                    })}
                </Accordion>
            </div>

            <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform mb-2">
                <img src="/pub_hamac.png" alt="Pub Le Hamac" className="w-full h-16 object-cover rounded-[18px] opacity-90 shadow-inner" />
            </a>
        </Layout>
    );
}
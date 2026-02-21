// src/screens/BeachScreen.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { beaches } from "@/data/beaches.js";
import { computeDecision } from "@/utils/reports.js";
import { Plus } from "lucide-react"; // Ajout de l'icône Plus

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
    if (!level) return "Pas d'info";
    if (kind === "sargasses") return level === 1 ? "Aucune" : level === 2 ? "Modérée" : "Importante";
    if (kind === "swim") return level === 1 ? "Autorisée" : level === 2 ? "Déconseillée" : "Interdite";
    if (kind === "sun") return level === 1 ? "Soleil" : level === 2 ? "Couvert" : "Pluie";
    if (kind === "crowd") return level === 1 ? "Vide" : level === 2 ? "Moyen" : "Bondé";
    return "";
}

function optionLabels(kind) {
    if (kind === "sargasses") return ["Aucune", "Modérée", "Forte"];
    if (kind === "swim") return ["OK", "Bof", "Non"];
    if (kind === "sun") return ["Soleil", "Nuage", "Pluie"];
    if (kind === "crowd") return ["Vide", "Moyen", "Bondé"];
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

function EventItem({ value, title, kind, decision, selectedLevel, onPick, onSubmit }) {
    const level = decision?.level || 0;
    const labels = optionLabels(kind);

    return (
        <AccordionItem value={value} className="border-b border-gray-50 last:border-none">
            <AccordionTrigger className="px-3 py-3 hover:no-underline transition-all">
                <div className="flex items-center gap-3 w-full text-left">
                    <div className="relative shrink-0">
                        <img src={iconForState(kind, level)} alt="" className="w-10 h-10 object-contain" />
                        <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${level === 1 ? 'bg-green-500' : level === 2 ? 'bg-orange-500' : level === 3 ? 'bg-red-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-[11px] font-black text-[#1f7c8a] uppercase tracking-tighter mb-0.5">{title}</span>
                        <span className="text-[14px] font-black text-slate-800 leading-tight">{decisionText(kind, level)}</span>
                    </div>
                    {/* ICÔNE PLUS EN #1f7c8a */}
                    <Plus size={18} className="text-[#1f7c8a] mr-2 opacity-80" />
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-3 pb-4 pt-1 bg-slate-50/30">
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => onPick(lvl)}
                                className={`py-2 rounded-xl border transition-all font-black text-[11px] ${selectedLevel === lvl ? "bg-slate-800 border-slate-800 text-white shadow-md" : "bg-white border-gray-100 text-gray-500"}`}
                            >
                                {labels[lvl - 1]}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!selectedLevel}
                        className={`w-full py-3 rounded-xl font-black text-black text-xs uppercase tracking-widest transition-all ${selectedLevel ? (selectedLevel === 1 ? 'bg-green-600' : selectedLevel === 2 ? 'bg-orange-500' : selectedLevel === 3 ? 'bg-red-600' : 'bg-gray-400') : "bg-gray-200 text-gray-400"}`}
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
    const [showSpamModal, setShowSpamModal] = useState(false); // Pop-up anti-spam perso

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage introuvable</div></Layout>;

    const handleAction = (kind) => {
        const now = Date.now();
        const isAdmin = userPosition?.lat && userPosition.lat > 40;
        const lockKey = `lock_${beach.id}_${kind}`;
        const lastReport = localStorage.getItem(lockKey);

        // NOUVELLE LIMITE : 30 MINUTES
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
            {/* --- HEADER PRINCIPAL --- */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 mb-3 mt-2">
                <div className="flex items-center gap-4 text-left">
                    <img
                        src={`/${beach.id}.png`}
                        alt={beach.name}
                        className="w-17 h-17 rounded-[20px] object-cover bg-slate-50 shadow-inner"
                        onError={(e) => { e.target.onerror = null; e.target.src = "/logoplage.png"; }}
                    />

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            {/* NOM DE LA PLAGE EN #1f7c8a */}
                            <h1 className="text-lg font-black text-[#1f7c8a] leading-none italic uppercase tracking-tighter">
                                {beach.name}
                            </h1>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="h-7 w-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center active:scale-90 transition-transform shadow-sm">
                                        <span className="text-xs font-black text-[#1f7c8a] italic">i</span>
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
                                            <DialogTitle className="text-xl font-black italic uppercase text-slate-800 text-center mb-1">{beach.name}</DialogTitle>
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

                        <p className="text-slate-400 font-bold text-[10px] uppercase">{beach.town}</p>

                        <div className="flex gap-2 mt-2.5">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100"><span className="text-lg">🚗</span><span className="text-[11px] font-black text-slate-700">{beach.parking || "Non"}</span></div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100"><span className="text-lg">🚿</span><span className="text-[11px] font-black text-slate-700">{beach.douche || "Non"}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL PERSO ANTI-SPAM --- */}
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

            {/* --- ACCORDÉONS --- */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
                    {["sargasses", "swim", "sun", "crowd"].map((kind) => (
                        <EventItem
                            key={kind}
                            value={kind}
                            title={kind === "sun" ? "Météo" : kind === "swim" ? "Baignade" : kind === "crowd" ? "Affluence" : "Sargasses"}
                            kind={kind}
                            decision={computeDecision(reports.filter(r => r.beachId === beach.id), kind, WINDOW_MS)}
                            selectedLevel={picked[kind]}
                            onPick={(lvl) => setPicked(p => ({ ...p, [kind]: p[kind] === lvl ? 0 : lvl }))}
                            onSubmit={() => handleAction(kind)}
                        />
                    ))}
                </Accordion>
            </div>

            <Link
                to={`/beach/${beach.id}/report`}
                className="mt-4 flex items-center justify-center w-full py-4 rounded-[20px] bg-[#1f7c8a] text-white font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
                Signaler un problème
            </Link>

            <div className="mt-4">
                <img src="/pub_hamac.png" alt="Pub" className="w-full h-16 object-cover rounded-[18px] opacity-90 shadow-inner" />
            </div>
        </Layout>
    );
}
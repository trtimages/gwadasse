// src/screens/MapScreen.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { beaches } from "../data/beaches.js";
import { markerColorForBeach } from "../utils/reports.js";
import { Search, List, User, LocateFixed, Crosshair, Apple, Mail, Info } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- FONCTION DE NETTOYAGE PRÉCISE ---
function cleanBeachName(name) {
    if (!name) return "";
    let cleaned = name.replace(/^plage (de la |de l'|des |du |d'|de )?|^des /i, "").trim();
    if (/^caravelle/i.test(cleaned)) return "La Caravelle";
    if (/^perle/i.test(cleaned)) return "La Perle";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function MapScreen({ userPosition, gpsError, reports }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [scale, setScale] = useState(1);
    const [calibMode, setCalibMode] = useState(false);
    const [tempCoords, setTempCoords] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // --- LOGIQUE RECHERCHE ---
    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        if (!q) return [];
        return beaches
            .filter((b) => b.name.toLowerCase().includes(q) || b.town.toLowerCase().includes(q))
            .slice(0, 5);
    }, [q]);

    const markers = useMemo(() => beaches.filter((b) => b.map), []);
    const goBeach = (id) => navigate(`/beach/${id}`);

    const handleMapClick = (e) => {
        if (!calibMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setTempCoords({ x: x.toFixed(2), y: y.toFixed(2) });
    };

    return (
        <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#6bb0e0] font-sans">

            {/* 1. CARTE INTERACTIVE */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <TransformWrapper
                    initialScale={1}
                    minScale={0.4}
                    maxScale={12}
                    centerOnInit={true}
                    limitToBounds={false}
                    disabled={calibMode}
                    alignmentAnimation={{ disabled: true }}
                    panning={{ velocityDisabled: true }}
                    onTransformed={(ref) => setScale(ref.state.scale)}
                >
                    <TransformComponent
                        wrapperStyle={{ width: "100vw", height: "100dvh" }}
                        contentStyle={{ width: "100vw", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <div className="relative flex shrink-0" onClick={handleMapClick}>
                            <img src="/map2.svg" alt="Carte" className="h-[90dvh] w-auto block select-none pointer-events-none" style={{ touchAction: "none" }} />

                            <div className="absolute inset-0 pointer-events-none">
                                {!calibMode && markers.map((b) => (
                                    <div
                                        key={b.id}
                                        style={{
                                            position: "absolute",
                                            left: `${b.map.x}%`,
                                            top: `${b.map.y}%`,
                                            transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            zIndex: 10
                                        }}
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); goBeach(b.id); }}
                                            className="pointer-events-auto shadow-md shrink-0 w-2 h-2 rounded-full border border-white"
                                            style={{ backgroundColor: markerColorForBeach(reports, b.id) }}
                                        />
                                        <span className="mt-1 font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] whitespace-nowrap italic uppercase text-[8px] tracking-tight leading-none text-center">
                                            {cleanBeachName(b.name)}
                                        </span>
                                    </div>
                                ))}

                                {calibMode && tempCoords && (
                                    <div className="absolute flex flex-col items-center" style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%`, transform: "translate(-50%, -50%)" }}>
                                        <Crosshair className="text-red-600 w-8 h-8 animate-pulse" />
                                        <div className="bg-black text-white text-[9px] p-1 rounded mt-1 font-mono">x:{tempCoords.x} y:{tempCoords.y}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* 2. HEADER : LOGO GAUCHE + ICÔNES DROITE */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-40 pointer-events-none flex justify-between items-center">
                <img src="/logo_titre.png" alt="Logo" className="h-12 sm:h-16 w-auto object-contain pointer-events-auto drop-shadow-lg" />

                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button className="h-8 w-8 bg-white/90 rounded-full shadow-lg flex items-center justify-center overflow-hidden active:scale-90 transition-transform">
                        <img src="https://flagcdn.com/w40/fr.png" alt="FR" className="w-full h-full object-cover scale-150" />
                    </button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="h-8 w-8 bg-white/90 rounded-full shadow-lg border border-white/50 flex items-center justify-center">
                                <Info size={16} className="text-[#2c3e50]" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-[400px] rounded-[30px] border-none shadow-2xl p-8 bg-white">
                            <DialogHeader><DialogTitle className="text-center text-xl font-black italic uppercase text-[#2c3e50] mb-4">À propos</DialogTitle></DialogHeader>
                            <div className="text-sm text-gray-600 leading-relaxed text-center font-medium">Application communautaire pour l'état des plages.</div>
                        </DialogContent>
                    </Dialog>
                    <button onClick={() => setIsLoginOpen(true)} className="h-10 w-10 bg-white/95 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                        <User size={20} className="text-[#2c3e50]" />
                    </button>
                </div>
            </div>

            {/* 3. RECHERCHE (Z-INDEX 50) */}
            <div className="absolute top-24 left-0 right-0 px-8 z-50 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto relative">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl flex items-center px-3 h-10 border border-black/5">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher une plage..."
                            className="flex-1 bg-transparent outline-none text-[14px] appearance-none text-slate-900"
                        />
                    </div>
                    {q && (
                        <div className="absolute mt-2 w-full max-h-[40vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-black/5 p-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                            {filtered.map((b) => (
                                <button
                                    key={b.id}
                                    onMouseDown={(e) => { e.preventDefault(); setQuery(""); goBeach(b.id); }}
                                    className="w-full flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                                >
                                    <div className="text-left leading-tight">
                                        <div className="font-black text-[13px] text-slate-800">{b.name}</div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase">{b.town}</div>
                                    </div>
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. CALIBRATION UI */}
            <div className="absolute top-4 left-4 z-[60]">
                <button onClick={() => setCalibMode(!calibMode)} className={`px-3 py-2 rounded-lg text-[10px] font-bold shadow-xl border ${calibMode ? 'bg-red-600 text-white' : 'bg-white'}`}>
                    {calibMode ? "✖ Finir" : "🔧 Calibrer"}
                </button>
            </div>

            {/* 5. POPUP CONNEXION */}
            {isLoginOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsLoginOpen(false)}>
                    <div className="bg-white rounded-[40px] w-full max-w-sm p-10 flex flex-col gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-center font-black italic text-2xl uppercase tracking-tighter text-[#2c3e50] mb-2 leading-none">Bienvenue dans la communauté</h2>
                        <button className="w-full py-4 border border-gray-100 rounded-2xl font-bold text-sm">Google</button>
                        <button className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm">Apple</button>
                        <button onClick={() => setIsLoginOpen(false)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Fermer</button>
                    </div>
                </div>
            )}

            {/* 6. FOOTER : LISTE DES PLAGES (BLANC ET #1F7C8A) */}
            <div className="absolute bottom-10 left-0 right-0 px-8 z-30 pointer-events-none flex flex-col items-center">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="pointer-events-auto flex items-center gap-3 bg-white text-[#1f7c8a] px-10 py-5 rounded-full font-black shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-widest border border-gray-100">
                            <List size={18} strokeWidth={3} /> Liste des Plages
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-[45px] bg-white border-none p-0 overflow-hidden shadow-2xl">
                        <div className="p-7 pb-3 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                            <SheetHeader><SheetTitle className="text-2xl font-black text-[#1f7c8a] italic uppercase tracking-tighter">Explorer</SheetTitle></SheetHeader>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto h-full pb-32 bg-slate-50">
                            {beaches.map(b => (
                                <button key={b.id} onClick={() => goBeach(b.id)} className="w-full flex justify-between items-center p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm active:scale-95 transition-transform">
                                    <div className="text-left leading-tight">
                                        <div className="font-black text-sm text-gray-800">{b.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{b.town}</div>
                                    </div>
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                                </button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

        </div>
    );
}
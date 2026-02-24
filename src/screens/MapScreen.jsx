// src/screens/MapScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { beaches } from "../data/beaches.js";
import { markerColorForBeach } from "../utils/reports.js";
import { Search, List, User, LocateFixed, Navigation } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- MÉMOIRE GLOBALE ---
let globalGPSMemory = {
    isFocused: false,
    hasInitialized: false
};

// --- LIMITES DE LA CARTE (GEOFENCING) ---
const mapBounds = { north: 16.55, south: 15.80, west: -61.85, east: -61.00 };

function gpsToMap(lat, lng) {
    const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;
    return { x, y };
}

// Nouvelle fonction pour vérifier si l'utilisateur est physiquement en Guadeloupe
function isPointInGuadeloupe(lat, lng) {
    return lat <= mapBounds.north && lat >= mapBounds.south && lng >= mapBounds.west && lng <= mapBounds.east;
}

function cleanBeachName(name) {
    if (!name) return "";
    let cleaned = name.replace(/^plage (de la |de l'|des |du |d'|de )?|^des /i, "").trim();
    if (/^caravelle/i.test(cleaned)) return "La Caravelle";
    if (/^perle/i.test(cleaned)) return "La Perle";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function MapScreen({ userPosition, gpsError, reports }) {
    const navigate = useNavigate();
    const transformRef = useRef(null);
    const [query, setQuery] = useState("");
    const [scale, setScale] = useState(1);
    const [calibMode, setCalibMode] = useState(false);
    const [tempCoords, setTempCoords] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    
    const [isFocusedOnUser, setIsFocusedOnUser] = useState(globalGPSMemory.isFocused);

    // --- LE TEST DE PRÉSENCE ---
    // True seulement si on a le GPS ET qu'on est dans la zone définie
    const isUserInGwada = userPosition && isPointInGuadeloupe(userPosition.lat, userPosition.lng);

    // --- ZOOM AUTO ET MÉMOIRE ---
    useEffect(() => {
        // On ne zoome auto que si l'utilisateur est EN GUADELOUPE
        if (isUserInGwada && transformRef.current) {
            const timer = setTimeout(() => {
                const element = document.getElementById("user-halo");
                if (element) {
                    if (!globalGPSMemory.hasInitialized) {
                        transformRef.current.zoomToElement("user-halo", 3, 1000);
                        setIsFocusedOnUser(true);
                        globalGPSMemory.isFocused = true;
                        globalGPSMemory.hasInitialized = true;
                    } else if (globalGPSMemory.isFocused) {
                        transformRef.current.zoomToElement("user-halo", 3, 0);
                    }
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isUserInGwada]);

    const q = query.trim().toLowerCase();
    const filtered = useMemo(() => {
        if (!q) return [];
        return beaches
            .filter((b) => b.name.toLowerCase().includes(q) || b.town.toLowerCase().includes(q))
            .slice(0, 8);
    }, [q]);

    const markers = useMemo(() => beaches.filter((b) => b.map), []);

    return (
        <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#6bb0e0] font-sans">

            {/* 1. CARTE (Z-INDEX 0) */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.4}
                    maxScale={12}
                    centerOnInit={true}
                    limitToBounds={false}
                    onTransformed={(ref) => setScale(ref.state.scale)}
                    onPanningStop={() => {
                        if (isFocusedOnUser) {
                            setIsFocusedOnUser(false);
                            globalGPSMemory.isFocused = false;
                        }
                    }}
                >
                    <TransformComponent wrapperStyle={{ width: "100vw", height: "100dvh" }}>
                        <div id="svg-map" className="relative flex shrink-0" onClick={(e) => {
                            if (calibMode) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y = ((e.clientY - rect.top) / rect.height) * 100;
                                setTempCoords({ x: x.toFixed(2), y: y.toFixed(2) });
                            }
                        }}>
                            <img src="/map2.svg" alt="Carte" className="h-[90dvh] w-auto block select-none pointer-events-none" />

                            <div className="absolute inset-0 pointer-events-none">
                                {/* Affichage du Halo SEULEMENT si en Guadeloupe */}
                                {isUserInGwada && !calibMode && (
                                    <div id="user-halo" style={{ 
                                        position: "absolute", 
                                        left: `${gpsToMap(userPosition.lat, userPosition.lng).x}%`, 
                                        top: `${gpsToMap(userPosition.lat, userPosition.lng).y}%`,
                                        transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                        zIndex: 5
                                    }}>
                                        <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-pulse border border-blue-500/30 flex items-center justify-center">
                                            <Navigation className="text-blue-600 w-3 h-3 fill-blue-600 rotate-[45deg]" />
                                        </div>
                                    </div>
                                )}

                                {!calibMode && markers.map((b) => (
                                    <div key={b.id} style={{
                                        position: "absolute",
                                        left: `${b.map.x}%`,
                                        top: `${b.map.y}%`,
                                        transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                        zIndex: 20
                                    }} className="flex flex-col items-center">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/beach/${b.id}`); }}
                                            className="pointer-events-auto shadow-md shrink-0 w-3 h-3 rounded-full border border-white"
                                            style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                                        <span className="mt-1 font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] whitespace-nowrap italic uppercase text-[8px] leading-none text-center">
                                            {cleanBeachName(b.name)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* 2. HEADER : LOGO & GPS (Z-INDEX 120) */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-[120] pointer-events-none flex justify-between items-center">
                <img src="/logo_titre.png" alt="Logo" className="h-12 sm:h-16 w-auto object-contain pointer-events-auto drop-shadow-lg" />

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* BOUTON GPS MÉMORISÉ */}
                    <button 
                        onClick={() => {
                            // Si l'utilisateur est hors zone, le bouton agit comme un simple "Reset" vers la carte globale
                            if (!isUserInGwada) {
                                transformRef.current?.zoomToElement("svg-map", 1, 800);
                                setIsFocusedOnUser(false);
                                globalGPSMemory.isFocused = false;
                                return;
                            }

                            const element = document.getElementById("user-halo");
                            if (isFocusedOnUser || !element) {
                                transformRef.current?.zoomToElement("svg-map", 1, 800);
                                setIsFocusedOnUser(false);
                                globalGPSMemory.isFocused = false;
                            } else {
                                transformRef.current?.zoomToElement("user-halo", 3, 800);
                                setIsFocusedOnUser(true);
                                globalGPSMemory.isFocused = true;
                            }
                        }}
                        className={`h-11 w-11 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all duration-200 border-2 ${
                            isFocusedOnUser && isUserInGwada ? "bg-[#1f7c8a] text-white border-[#1f7c8a]" : "bg-white text-[#1f7c8a] border-white"
                        }`}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <LocateFixed size={22} />
                    </button>

                    <button 
                        onClick={() => setIsLoginOpen(true)} 
                        className="h-11 w-11 bg-white rounded-full shadow-xl flex items-center justify-center active:scale-95 text-[#2c3e50] border-2 border-white"
                        style={{ touchAction: 'manipulation' }}
                    >
                        <User size={22} />
                    </button>
                </div>
            </div>

            {/* 3. RECHERCHE COMPACTE (Z-INDEX 100) */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[80%] max-w-sm z-[100] pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg flex items-center px-3 h-10 border border-black/5 pointer-events-auto">
                    <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Trouver une plage..."
                        className="flex-1 bg-transparent outline-none text-[16px] appearance-none text-slate-900 h-full w-full"
                    />
                </div>
                
                {q && (
                    <div className="absolute mt-1.5 w-full max-h-[40vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-slate-100 p-1.5 space-y-0.5 pointer-events-auto">
                        {filtered.length > 0 ? filtered.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => { setQuery(""); navigate(`/beach/${b.id}`); }}
                                className="w-full flex justify-between items-center p-3 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors text-left border-b border-slate-50 last:border-0"
                            >
                                <div>
                                    <div className="font-black text-[13px] text-slate-800 uppercase italic">{b.name}</div>
                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{b.town}</div>
                                </div>
                                <div className="h-2 w-2 rounded-full shrink-0 ml-2" style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                            </button>
                        )) : (
                            <div className="p-3 text-center text-gray-400 text-xs italic">Aucune plage trouvée</div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. FOOTER : LISTE DES PLAGES */}
            <div className="absolute bottom-10 left-0 right-0 px-8 z-40 pointer-events-none flex flex-col items-center">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="pointer-events-auto flex items-center gap-3 bg-white text-[#1f7c8a] px-10 py-5 rounded-full font-black shadow-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform">
                            <List size={18} strokeWidth={3} /> Liste des Plages
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-[45px] bg-white border-none p-0 overflow-hidden shadow-2xl">
                        <div className="p-7 pb-3 border-b sticky top-0 bg-white z-10">
                            <SheetHeader><SheetTitle className="text-2xl font-black text-[#1f7c8a] italic uppercase">Explorer</SheetTitle></SheetHeader>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto h-full pb-32 bg-slate-50">
                            {beaches.map(b => (
                                <button key={b.id} onClick={() => navigate(`/beach/${b.id}`)} className="w-full flex justify-between items-center p-5 bg-white rounded-[24px] shadow-sm">
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

            {/* OUTIL DE CALIBRATION */}
            <div className="absolute top-24 left-4 z-[130] pointer-events-auto">
                {!q && (
                    <button onClick={() => setCalibMode(!calibMode)} className={`p-2 rounded-lg text-[10px] font-bold shadow-xl border ${calibMode ? 'bg-red-600 text-white border-red-600' : 'bg-white/90 text-black border-white'}`}>
                        {calibMode ? "✖" : "🔧"}
                    </button>
                )}
            </div>
            {calibMode && tempCoords && (
                <div className="fixed top-36 left-4 z-[130] bg-black text-white text-[9px] p-2 rounded font-mono shadow-2xl">
                    x:{tempCoords.x} y:{tempCoords.y}
                </div>
            )}

            {/* POPUP DE CONNEXION */}
            {isLoginOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto" onClick={() => setIsLoginOpen(false)}>
                    <div className="bg-white rounded-[40px] w-full max-w-sm p-10 flex flex-col gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-center font-black italic text-2xl uppercase tracking-tighter text-[#2c3e50] mb-2 leading-none">Bienvenue</h2>
                        <button className="w-full py-4 border border-gray-100 rounded-2xl font-bold text-sm">Google</button>
                        <button className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm">Apple</button>
                        <button onClick={() => setIsLoginOpen(false)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Fermer</button>
                    </div>
                </div>
            )}
        </div>
    );
}
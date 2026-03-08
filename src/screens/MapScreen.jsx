// src/screens/MapScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { beaches } from "../data/beaches.js";
import { markerColorForBeach } from "../utils/reports.js";
import { Search, User, LocateFixed, Navigation, Star, MapPin } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

// --- MÉMOIRE GLOBALE ---
let globalGPSMemory = {
    isFocused: false,
    hasInitialized: false
};

// --- LIMITES DE LA CARTE & GÉOMÉTRIE ---
const mapBounds = { north: 16.55, south: 15.80, west: -61.85, east: -61.00 };

function gpsToMap(lat, lng) {
    const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;
    return { x, y };
}

function mapToGps(x, y) {
    const lng = (x / 100) * (mapBounds.east - mapBounds.west) + mapBounds.west;
    const lat = mapBounds.north - (y / 100) * (mapBounds.north - mapBounds.south);
    return { lat, lng };
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// On passe 't' à la fonction pour traduire "Sur place"
function formatDist(km, t) {
    if (km < 1) {
        const m = Math.round((km * 1000) / 100) * 100;
        return m === 0 ? t("on_site") : `${m} m`;
    }
    return `${km.toFixed(1)} km`;
}

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
    // --- ON RÉCUPÈRE LA LANGUE ET LA FONCTION DE TRADUCTION ---
    const { language, setLanguage, t } = useLanguage();

    const navigate = useNavigate();
    const transformRef = useRef(null);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [scale, setScale] = useState(1);
    const [calibMode, setCalibMode] = useState(false);
    const [tempCoords, setTempCoords] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    
    const [isFocusedOnUser, setIsFocusedOnUser] = useState(globalGPSMemory.isFocused);

    const isUserInGwada = userPosition && isPointInGuadeloupe(userPosition.lat, userPosition.lng);

    useEffect(() => {
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
    const displayedBeaches = useMemo(() => {
        let result = beaches;

        if (q) {
            result = result.filter((b) => b.name.toLowerCase().includes(q) || b.town.toLowerCase().includes(q));
        }

        if (isUserInGwada) {
            result = result.map(b => {
                const beachGps = b.lat && b.lng ? { lat: b.lat, lng: b.lng } : mapToGps(b.map?.x || 0, b.map?.y || 0);
                const dist = calcDistanceKm(userPosition.lat, userPosition.lng, beachGps.lat, beachGps.lng);
                return { ...b, dist };
            });
        }

        if (sortBy === 'popular') {
            result = [...result].sort((a, b) => {
                const popA = (a.id * 17) % 100;
                const popB = (b.id * 17) % 100;
                return popB - popA; 
            });
        } else if (sortBy === 'distance' && isUserInGwada) {
            result = [...result].sort((a, b) => (a.dist || 0) - (b.dist || 0));
        }

        return result;
    }, [q, sortBy, userPosition, isUserInGwada]);

    const markers = useMemo(() => beaches.filter((b) => b.map), []);

    const toggleSort = (type) => {
        if (sortBy === type) setSortBy(null);
        else setSortBy(type);
    };

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
                                {isUserInGwada && !calibMode && (
                                    <div id="user-halo" style={{ 
                                        position: "absolute", 
                                        left: `${gpsToMap(userPosition.lat, userPosition.lng).x}%`, 
                                        top: `${gpsToMap(userPosition.lat, userPosition.lng).y}%`,
                                        transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                        zIndex: 5
                                    }}>
                                        <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-pulse border border-blue-500/30 flex items-center justify-center">
                                            <span className="text-blue-600 w-3 h-3 block rotate-[45deg]">▲</span>
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

            {/* 2. HEADER : LOGO & BOUTONS OUTILS */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-[120] pointer-events-none flex justify-between items-start">
                <img src="/logo_titre.png" alt="Logo" className="h-12 sm:h-16 w-auto object-contain pointer-events-auto drop-shadow-lg" />

                <div className="flex flex-col items-end gap-3 pointer-events-auto">
                    {/* BOUTONS OUTILS (GPS + Profil) */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
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
                        >
                            <LocateFixed size={22} />
                        </button>

                        <button 
                            onClick={() => setIsLoginOpen(true)} 
                            className="h-11 w-11 bg-white rounded-full shadow-xl flex items-center justify-center active:scale-95 text-[#2c3e50] border-2 border-white"
                        >
                            <User size={22} />
                        </button>
                    </div>

                    {/* SÉLECTEUR DE LANGUE (Les 3 drapeaux) */}
                    <div className="flex bg-white/90 rounded-[20px] shadow-lg p-1 border border-white/50 backdrop-blur-md">
                        <button onClick={() => setLanguage('fr')} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-all ${language === 'fr' ? 'bg-[#1f7c8a] scale-105 shadow-md' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}>🇫🇷</button>
                        <button onClick={() => setLanguage('en')} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-all ${language === 'en' ? 'bg-[#1f7c8a] scale-105 shadow-md' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}>🇬🇧</button>
                        <button onClick={() => setLanguage('cr')} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-all ${language === 'cr' ? 'bg-[#1f7c8a] scale-105 shadow-md' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}>🇬🇵</button>
                    </div>
                </div>
            </div>

            {/* 3. FOOTER : LE MENU MIXTE */}
            <div className="absolute bottom-10 left-0 right-0 px-8 z-40 pointer-events-none flex flex-col items-center">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="pointer-events-auto flex items-center gap-3 bg-white text-[#1f7c8a] px-10 py-5 rounded-full font-black shadow-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform">
                            {/* TRADUCTION ICI */}
                            <Search size={18} strokeWidth={3} /> {t("search_beach")}
                        </button>
                    </SheetTrigger>
                    
                    <SheetContent side="bottom" className="h-[85vh] rounded-t-[45px] bg-[#e0f4f9] border-none p-0 overflow-hidden shadow-2xl flex flex-col">
                        
                        <div className="p-7 pb-4 border-b border-[#c8eaf3] sticky top-0 bg-[#e0f4f9] z-10 shrink-0">
                            {/* TRADUCTION ICI */}
                            <SheetHeader className="mb-4"><SheetTitle className="text-2xl font-black text-[#1f7c8a] italic uppercase">{t("explore")}</SheetTitle></SheetHeader>
                            
                            <div className="bg-white rounded-xl shadow-sm flex items-center px-4 h-12 border border-black/5 mb-4">
                                <Search size={18} className="text-gray-400 mr-3 shrink-0" />
                                {/* TRADUCTION ICI */}
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t("search_placeholder")}
                                    className="flex-1 bg-transparent outline-none text-[15px] font-medium appearance-none text-slate-900 h-full w-full"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* TRADUCTION ICI */}
                                <span className="text-[10px] font-black uppercase text-[#1f7c8a] tracking-widest opacity-70">{t("sort_by")}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleSort('popular')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                            sortBy === 'popular' ? 'bg-[#1f7c8a] text-white shadow-md' : 'bg-white/60 text-[#1f7c8a] hover:bg-white'
                                        }`}
                                    >
                                        <Star size={14} className={sortBy === 'popular' ? "fill-white" : ""} /> {t("popular")}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (!isUserInGwada) alert("Activez votre localisation !");
                                            else toggleSort('distance');
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                            sortBy === 'distance' ? 'bg-[#1f7c8a] text-white shadow-md' : 'bg-white/60 text-[#1f7c8a] hover:bg-white'
                                        }`}
                                    >
                                        <MapPin size={14} className={sortBy === 'distance' ? "fill-white" : ""} /> {t("nearby")}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-10">
                            {displayedBeaches.length > 0 ? (
                                displayedBeaches.map(b => (
                                    <button key={b.id} onClick={() => navigate(`/beach/${b.id}`)} className="w-full flex justify-between items-center p-4 bg-[#fdf5dd] border border-yellow-600/10 rounded-[24px] shadow-sm active:scale-95 transition-transform">
                                        <div className="text-left leading-tight">
                                            <div className="font-black text-[15px] text-gray-800">{b.name}</div>
                                            
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-2.5 flex items-center gap-2">
                                                <span>{b.town}</span>
                                                {b.dist !== undefined && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-yellow-600/30" />
                                                        <span className="text-[#1f7c8a] flex items-center gap-0.5">
                                                            {/* TRADUCTION DE LA DISTANCE ICI */}
                                                            <MapPin size={10} /> {formatDist(b.dist, t)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-lg text-[10px] font-black text-slate-700">
                                                    {/* TRADUCTION OUI/NON ICI */}
                                                    <span className="text-sm">🚗</span> {b.parking.includes("Oui") ? t("yes") : t("no")}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-lg text-[10px] font-black text-slate-700">
                                                    <span className="text-sm">🚿</span> {b.douche.includes("Oui") ? t("yes") : t("no")}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-center gap-1.5 shrink-0 ml-3">
                                            {/* TRADUCTION ICI */}
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t("state")}</span>
                                            <div className="h-5 w-5 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center p-8 text-[#1f7c8a] font-bold opacity-60">
                                    {/* TRADUCTION ICI */}
                                    {t("no_beach_found")}
                                </div>
                            )}
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
        </div>
    );
}
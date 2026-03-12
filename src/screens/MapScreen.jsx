import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { beaches } from "../data/beaches.js";
import { markerColorForBeach } from "../utils/reports.js";
import { Search, User, LocateFixed, Star, MapPin, ChevronDown, X } from "lucide-react"; // Info retiré d'ici

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

// --- MÉMOIRE GLOBALE & GÉOMÉTRIE ---
let globalGPSMemory = { isFocused: false, hasInitialized: false, hasDoneVisualCenter: false };
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

function cleanBeachName(nameData) {
    const textName = (nameData && typeof nameData === 'object' && nameData.fr) ? nameData.fr : (typeof nameData === 'string' ? nameData : "");
    if (!textName) return "";
    let cleaned = textName.replace(/^plage (de la |de l'|des |du |d'|de )?|^des /i, "").trim();
    if (/^caravelle/i.test(cleaned)) return "La Caravelle";
    if (/^perle/i.test(cleaned)) return "La Perle";
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getLocalizedText(dataObj, lang) {
    if (!dataObj) return "";
    if (typeof dataObj === 'string') return dataObj;
    return (lang === 'cr' && dataObj.cr) ? dataObj.cr : (dataObj.fr || "");
}

export default function MapScreen({ userPosition, gpsError, reports }) {
    const langContext = useLanguage();
    const { language = 'fr', setLanguage = () => {}, t = (k) => k } = langContext || {};

    const navigate = useNavigate();
    const transformRef = useRef(null);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [scale, setScale] = useState(1);
    const [calibMode, setCalibMode] = useState(false);
    const [tempCoords, setTempCoords] = useState(null);
    
    // Le menu des langues
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    
    // État pour l'ouverture de la liste des plages
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // État pour le Pop-up d'Information ('main', 'guide', 'terms', ou null si fermé)
    const [infoModalView, setInfoModalView] = useState(null);

    const [isFocusedOnUser, setIsFocusedOnUser] = useState(globalGPSMemory.isFocused);

    // --- ÉTAT DE LA VIGILANCE ---
    const [vigilanceAlert, setVigilanceAlert] = useState("⚠️ Vigilance orange en cours - Soyez prudents ⚠️");

    useEffect(() => {
        const fetchVigilance = async () => {
            try {
                // Remplacer l'URL ci-dessous par l'URL Météo-France API
            } catch (error) {
                console.error("Erreur API Vigilance:", error);
            }
        };
        fetchVigilance();
    }, []);

    const isUserInGwada = userPosition && isPointInGuadeloupe(userPosition.lat, userPosition.lng);

    useEffect(() => {
        if (isUserInGwada && transformRef.current) {
            const timer = setTimeout(() => {
                const element = document.getElementById("user-halo");
                if (element) {
                    if (!globalGPSMemory.hasInitialized) {
                        transformRef.current.zoomToElement("user-halo", 3, 1000);
                        setIsFocusedOnUser(true);
                        globalGPSMemory.hasInitialized = true;
                    } else if (globalGPSMemory.isFocused) {
                        transformRef.current.zoomToElement("user-halo", 3, 0);
                    }
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isUserInGwada]);

    useEffect(() => {
        if (globalGPSMemory.hasInitialized || globalGPSMemory.hasDoneVisualCenter) return;

        if (transformRef.current) {
            const timer = setTimeout(() => {
                if (transformRef.current) {
                    transformRef.current.centerView(1, 0);
                    const state = transformRef.current.state || transformRef.current.instance?.transformState;
                    if (state) {
                        const { positionX } = state;
                        const visualOffsetX = -15; 
                        transformRef.current.setTransform(positionX + visualOffsetX, 0, 1, 0);
                    }
                    globalGPSMemory.hasDoneVisualCenter = true;
                }
            }, 100); 
            return () => clearTimeout(timer);
        }
    }, [transformRef]);

    const q = query.trim().toLowerCase();
    const displayedBeaches = useMemo(() => {
        let result = beaches;

        if (q) {
            result = result.filter((b) => {
                const frName = (b.name?.fr || b.name || "").toLowerCase();
                const crName = (b.name?.cr || "").toLowerCase();
                const frTown = (b.town?.fr || b.town || "").toLowerCase();
                const crTown = (b.town?.cr || "").toLowerCase();
                return frName.includes(q) || crName.includes(q) || frTown.includes(q) || crTown.includes(q);
            });
        }

        if (isUserInGwada) {
            result = result.map(b => {
                const beachGps = b.lat && b.lng ? { lat: b.lat, lng: b.lng } : mapToGps(b.map?.x || 0, b.map?.y || 0);
                const dist = calcDistanceKm(userPosition.lat, userPosition.lng, beachGps.lat, beachGps.lng);
                return { ...b, dist };
            });
        }

        if (sortBy === 'popular') {
            result = [...result].sort((a, b) => ((b.id * 17) % 100) - ((a.id * 17) % 100));
        } else if (sortBy === 'distance' && isUserInGwada) {
            result = [...result].sort((a, b) => (a.dist || 0) - (b.dist || 0));
        }

        return result;
    }, [q, sortBy, userPosition, isUserInGwada]);

    const toggleSort = (type) => {
        if (sortBy === type) setSortBy(null);
        else setSortBy(type);
    };

    const getFlagIcon = (lng) => {
        if (lng === 'fr') return '🇫🇷';
        if (lng === 'en') return '🇬🇧';
        return <img src="/creole.png" alt="Créole" className="w-5 h-5 object-cover rounded-full shadow-sm" />;
    };

    const handleSignalClick = () => {
        if (!isUserInGwada || !userPosition) {
            alert("Activez votre localisation en Guadeloupe pour signaler autour de vous !");
            return;
        }
        
        let nearest = null;
        let minDist = Infinity;
        
        beaches.forEach(b => {
            const beachGps = b.lat && b.lng ? { lat: b.lat, lng: b.lng } : mapToGps(b.map?.x || 0, b.map?.y || 0);
            const dist = calcDistanceKm(userPosition.lat, userPosition.lng, beachGps.lat, beachGps.lng);
            if (dist < minDist) {
                minDist = dist;
                nearest = b;
            }
        });
        
        if (nearest) {
            navigate(`/beach/${nearest.id}/report`);
        }
    };

    return (
        <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#0e3868] font-sans">
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scrollMarquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: scrollMarquee 15s linear infinite;
                    white-space: nowrap;
                }
                .font-techno {
                    font-family: 'Courier New', Courier, monospace;
                    font-weight: 300;
                }
            `}} />

            <div className="absolute inset-0 z-0 h-full w-full">
                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.4}
                    maxScale={12}
                    centerOnInit={false} 
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
                        <div id="svg-map" className="relative shrink-0 inline-block" onClick={(e) => {
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

                                {!calibMode && beaches.filter(b => b.map).map((b) => {
                                    let showName = false;
                                    if (scale >= 2.8) {
                                        showName = true;
                                    } else if (scale >= 1.8) {
                                        showName = b.priority <= 2;
                                    } else {
                                        showName = b.priority === 1;
                                    }

                                    const hasRecentReports = reports.some(r => r.beachId === b.id && (Date.now() - r.ts) <= 3 * 60 * 60 * 1000);
                                    const dotColor = hasRecentReports ? markerColorForBeach(reports, b.id) : "#facc15";

                                    return (
                                        <div key={b.id} style={{
                                            position: "absolute",
                                            left: `${b.map.x}%`,
                                            top: `${b.map.y}%`,
                                            transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                            zIndex: 20
                                        }} className="flex flex-col items-center">
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate(`/beach/${b.id}`); }}
                                                className="pointer-events-auto shadow-sm shrink-0 w-1.5 h-1.5 rounded-full border-[1px] border-black transition-transform active:scale-150"
                                                style={{ backgroundColor: dotColor }} 
                                            />
                                            
                                            <span 
                                                className={`mt-1 font-black text-white whitespace-nowrap italic uppercase text-[8px] tracking-wider leading-none text-center transition-opacity duration-300 ${showName ? 'opacity-100' : 'opacity-0'}`}
                                                style={{ 
                                                    textShadow: '0px 1px 2px rgba(0,0,0,0.8), 0px -1px 2px rgba(0,0,0,0.8), 1px 0px 2px rgba(0,0,0,0.8), -1px 0px 2px rgba(0,0,0,0.8)'
                                                }}
                                            >
                                                {cleanBeachName(b.name)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* EN-TÊTE CENTRÉE (LOGO + IMAGE INFO) */}
            <div className="absolute top-0 left-0 right-0 pt-6 px-4 z-[120] pointer-events-none flex justify-between items-start">
                <div className="w-10"></div> {/* Espace pour centrer parfaitement le logo */}
                <img src="/logo_titre.png" alt="Logo" className="h-14 w-auto object-contain drop-shadow-lg pointer-events-auto" />
                
                {/* NOUVEAU BOUTON INFO (Image PNG) */}
                <button 
                    onClick={() => setInfoModalView('main')}
                    className="h-10 w-10 mt-2 flex items-center justify-center pointer-events-auto active:scale-90 transition-transform"
                >
                    <img 
                        src="/info.png" 
                        alt="Informations" 
                        className="w-full h-full object-contain drop-shadow-md opacity-80 hover:opacity-100"
                    />
                </button>
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex flex-col items-center gap-3">
                
                {vigilanceAlert && (
                    <div className="pointer-events-auto w-[85vw] max-w-[320px] overflow-hidden bg-transparent flex items-center justify-center">
                        <div 
                            className="animate-marquee font-techno text-[11px] text-white font-black uppercase tracking-[0.2em] drop-shadow-lg"
                            style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
                        >
                            {vigilanceAlert}
                        </div>
                    </div>
                )}

                {/* Dock compact */}
                <div className="pointer-events-auto w-[90%] max-w-[340px] h-12 bg-[#e0f4f9]/40 backdrop-blur-md rounded-[24px] shadow-lg border border-white/30 flex items-center justify-between px-2.5">
                    <button 
                        onClick={() => {
                            if (!isUserInGwada) {
                                transformRef.current?.zoomToElement("svg-map", 1, 800);
                                setIsFocusedOnUser(false);
                                return;
                            }
                            const element = document.getElementById("user-halo");
                            if (isFocusedOnUser || !element) {
                                transformRef.current?.zoomToElement("svg-map", 1, 800);
                                setIsFocusedOnUser(false);
                            } else {
                                transformRef.current?.zoomToElement("user-halo", 3, 800);
                                setIsFocusedOnUser(true);
                            }
                        }}
                        className={`h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                            isFocusedOnUser && isUserInGwada ? "text-white" : "text-white/70 hover:text-white"
                        }`}
                    >
                        <LocateFixed size={18} strokeWidth={isFocusedOnUser ? 2.5 : 2} />
                    </button>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <button className="h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-transform text-white/70 hover:text-white">
                                <Search size={18} strokeWidth={2.5} />
                            </button>
                        </SheetTrigger>
                        
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-[45px] bg-[#e0f4f9] border-none p-0 overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-6 pb-4 border-b border-[#c8eaf3] sticky top-0 bg-[#e0f4f9] z-10">
                                <SheetHeader className="mb-4 flex flex-row items-center space-y-0">
                                    <button 
                                        onClick={() => setIsSheetOpen(false)} 
                                        className="p-2 -ml-2 rounded-full active:scale-90 transition-transform bg-white/50 text-[#1f7c8a] shadow-sm shrink-0"
                                    >
                                        <ChevronDown size={22} strokeWidth={3} />
                                    </button>
                                    <SheetTitle className="text-xl font-black text-[#1f7c8a] italic uppercase flex-1 text-center pr-8">
                                        {t("explore")}
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="bg-white rounded-xl shadow-sm flex items-center px-4 h-12 border border-black/5 mb-4 mt-2">
                                    <Search size={18} className="text-gray-400 mr-3" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t("search_placeholder")}
                                        className="flex-1 bg-transparent outline-none text-[15px] font-medium"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
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
                                {displayedBeaches.map(b => (
                                    <button key={b.id} onClick={() => navigate(`/beach/${b.id}`)} className="w-full flex justify-between items-center p-4 bg-[#fdf5dd] border border-yellow-600/10 rounded-[24px] shadow-sm active:scale-95 transition-transform">
                                        <div className="text-left leading-tight">
                                            <div className="font-black text-[15px] text-gray-800">{getLocalizedText(b.name, language)}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{getLocalizedText(b.town, language)}</div>
                                        </div>
                                        <div className="h-5 w-5 rounded-full border border-black/5" style={{ backgroundColor: markerColorForBeach(reports, b.id) }} />
                                    </button>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <button 
                        onClick={handleSignalClick}
                        className="h-14 w-14 rounded-full flex items-center justify-center active:scale-90 transition-transform z-50 relative -mt-5"
                    >
                        <img src="/signal.png" alt="Signaler" className="w-full h-full object-contain drop-shadow-md" />
                    </button>

                    <button 
                        onClick={() => navigate('/profile')} 
                        className="h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all text-white/70 hover:text-white"
                    >
                        <User size={18} strokeWidth={2.5} />
                    </button>

                    <div className="relative h-9 w-9 flex items-center justify-center">
                        <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="h-7 w-7 rounded-full flex items-center justify-center active:scale-90 transition-all"
                        >
                            <div className="text-[18px] leading-none drop-shadow-sm">{getFlagIcon(language)}</div>
                        </button>

                        {isLangMenuOpen && (
                            <div className="absolute bottom-[120%] right-0 w-10 py-2 bg-white/40 backdrop-blur-xl border border-white/30 rounded-[20px] shadow-2xl flex flex-col gap-2 items-center z-[150] animate-in slide-in-from-bottom-2">
                                {['fr', 'en', 'cr'].map(lng => (
                                    <button 
                                        key={lng}
                                        onClick={() => { setLanguage(lng); setIsLangMenuOpen(false); }} 
                                        className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${language === lng ? 'bg-white/60' : ''}`}
                                    >
                                        <div className="text-[18px] leading-none drop-shadow-sm">{getFlagIcon(lng)}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {isLangMenuOpen && (
                            <div 
                                className="fixed inset-0 z-[140]" 
                                onClick={() => setIsLangMenuOpen(false)}
                            />
                        )}
                    </div>

                </div>
            </div>

            {/* --- LA BULLE D'INFORMATION --- */}
            {infoModalView && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    {/* Fond sombre cliquable pour fermer totalement */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setInfoModalView(null)}
                    ></div>
                    
                    <div className="relative bg-[#e0f4f9] w-full max-w-[340px] rounded-[35px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        
                        {/* Bouton Fermer */}
                        <button 
                            onClick={() => setInfoModalView(null)}
                            className="absolute top-4 right-4 h-8 w-8 bg-white/50 text-[#1f7c8a] rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>

                        {/* VUE PRINCIPALE */}
                        {infoModalView === 'main' && (
                            <div className="flex flex-col items-center animate-in slide-in-from-left-4">
                                <img src="/logo_titre.png" alt="Logo" className="h-10 w-auto object-contain mb-4 mt-2" />
                                <h2 className="text-xl font-black text-[#1f7c8a] uppercase italic text-center mb-3">À propos</h2>
                                <p className="text-sm text-slate-600 font-medium text-center mb-6 leading-relaxed">
                                    Gwada Plages est votre radar météo communautaire en temps réel. Découvrez l'état des plages de Guadeloupe, repérez les sargasses avant de vous déplacer, et aidez la communauté en partageant vos propres observations !
                                </p>
                                <div className="w-full flex flex-col gap-3">
                                    <button 
                                        onClick={() => setInfoModalView('guide')}
                                        className="w-full py-3 bg-[#1f7c8a] text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
                                    >
                                        Mode d'emploi
                                    </button>
                                    <button 
                                        onClick={() => setInfoModalView('terms')}
                                        className="w-full py-3 bg-white text-[#1f7c8a] border border-[#1f7c8a]/20 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                    >
                                        Conditions d'utilisation
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VUE MODE D'EMPLOI */}
                        {infoModalView === 'guide' && (
                            <div className="flex flex-col animate-in slide-in-from-right-4">
                                <h2 className="text-lg font-black text-[#1f7c8a] uppercase italic text-center mb-4 mt-2">Mode d'emploi</h2>
                                <div className="space-y-4 mb-6 text-sm text-slate-600 font-medium max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="flex gap-3">
                                        <div className="text-xl">🗺️</div>
                                        <p><strong>Explorez :</strong> Naviguez sur la carte pour voir les points de couleur (Vert = OK, Rouge = Problème).</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-xl">🔍</div>
                                        <p><strong>Consultez :</strong> Cliquez sur une plage pour voir la météo, la mer et la présence de sargasses.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-xl">📢</div>
                                        <p><strong>Participez :</strong> Utilisez le bouton signalement quand vous êtes sur place pour informer les autres !</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-xl">🏆</div>
                                        <p><strong>Évoluez :</strong> Créez un profil pour gagner de l'expérience et débloquer des grades exclusifs.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setInfoModalView('main')}
                                    className="w-full py-3 bg-white text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm border border-slate-100"
                                >
                                    Retour
                                </button>
                            </div>
                        )}

                        {/* VUE CONDITIONS */}
                        {infoModalView === 'terms' && (
                            <div className="flex flex-col animate-in slide-in-from-right-4">
                                <h2 className="text-lg font-black text-[#1f7c8a] uppercase italic text-center mb-4 mt-2">Conditions</h2>
                                <div className="space-y-3 mb-6 text-[13px] text-slate-600 font-medium max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar text-justify leading-relaxed">
                                    <p>Gwada Plages est un outil collaboratif gratuit. Les informations affichées sont majoritairement basées sur les signalements de la communauté et sur des API publiques.</p>
                                    <p><strong>Responsabilité :</strong> L'éditeur de l'application ne saurait être tenu pour responsable de l'inexactitude des données (météo, sargasses, etc.) ou de tout incident survenant lors de la visite des lieux.</p>
                                    <p><strong>Modération :</strong> Tout comportement abusif (faux signalements répétés) entraînera une limitation de votre compte.</p>
                                </div>
                                <button 
                                    onClick={() => setInfoModalView('main')}
                                    className="w-full py-3 bg-white text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm border border-slate-100"
                                >
                                    Retour
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* CALIBRATION (Outil caché) */}
            <div className="absolute top-24 left-4 z-[130] pointer-events-auto opacity-20 hover:opacity-100">
                <button onClick={() => setCalibMode(!calibMode)} className="text-white"><Search size={16} /></button>
            </div>
            {calibMode && tempCoords && (
                <div className="fixed top-36 left-4 z-[130] bg-black text-white text-[8px] p-2 rounded font-mono shadow-2xl">
                    x:{tempCoords.x} y:{tempCoords.y}
                </div>
            )}
        </div>
    );
}
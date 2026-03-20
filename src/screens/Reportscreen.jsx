// src/screens/ReportScreen.jsx
import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";
import { MapPin, Send, MessageSquare, Search, ChevronDown, User, Camera, X, Loader2 } from "lucide-react";

// --- IMPORT DU CERVEAU DE TRADUCTION ---
import { useLanguage } from "../i18n/LanguageContext";

// --- IMPORT DU PANNEAU (SHEET) ET DE LA MODALE (DIALOG) ---
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SPAM_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

// --- FONCTION DE COMPRESSION D'IMAGE NATIVE ---
const compressImage = (file, maxWidth = 1000, quality = 0.7) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcul du nouveau ratio si l'image est trop grande
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Conversion du canvas en fichier JPEG compressé
                canvas.toBlob((blob) => {
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', quality);
            };
        };
    });
};

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
        <div className="mb-0">
            <div className="flex justify-between items-end px-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none pb-1">{title}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-t-md leading-none">24H</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((lvl) => {
                    const active = current === lvl;
                    const votes = getVoteCount(reports, beachId, kind, lvl);
                    const iconPath = iconForState(kind, lvl);

                    let activeBgClass = "";
                    if (lvl === 1) activeBgClass = "bg-green-500 border-green-500 text-white shadow-md";
                    else if (lvl === 2) activeBgClass = "bg-orange-500 border-orange-500 text-white shadow-md";
                    else if (lvl === 3) activeBgClass = "bg-red-500 border-red-500 text-white shadow-md";

                    return (
                        <button
                            key={lvl}
                            type="button"
                            onClick={() => onChange(active ? 0 : lvl)}
                            className={`relative flex flex-col items-center justify-between p-1 rounded-xl border-2 transition-all active:scale-95 overflow-hidden ${
                                active
                                    ? activeBgClass
                                    : "bg-white border-slate-100 text-slate-600 shadow-sm hover:bg-slate-50"
                            }`}
                        >
                            <div className="relative shrink-0 w-full h-[55px] flex items-center justify-center mt-0.5">
                                <img 
                                    src={iconPath} 
                                    alt="" 
                                    className={`w-[95%] h-[95%] object-contain drop-shadow-sm transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`} 
                                />
                            </div>
                            
                            <div className="flex flex-col items-center w-full leading-none pb-0.5 mt-1">
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-slate-700'}`}>
                                    {labels[lvl - 1]}
                                </span>
                                <span className={`text-[8px] font-bold mt-[2px] ${active ? "text-white/90" : "text-slate-400"}`}>
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

export default function ReportScreen({ reports = [], addReports, userPosition, user }) {
    const { beachId } = useParams();
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    
    const beachIdNum = Number(beachId);
    const beach = beaches.find((b) => b.id === beachIdNum);

    const [sargasses, setSargasses] = useState(0);
    const [sun, setSun] = useState(0);
    const [swim, setSwim] = useState(0);
    const [crowd, setCrowd] = useState(0);
    const [comment, setComment] = useState("");
    
    // --- ÉTATS POUR L'IMAGE ---
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSpamModal, setShowSpamModal] = useState(false);

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage inconnue</div></Layout>;

    const displayedBeaches = useMemo(() => {
        if (!searchQuery.trim()) return beaches;
        const q = searchQuery.trim().toLowerCase();
        return beaches.filter((b) => {
            const frName = (b.name?.fr || b.name || "").toLowerCase();
            const crName = (b.name?.cr || "").toLowerCase();
            const frTown = (b.town?.fr || b.town || "").toLowerCase();
            const crTown = (b.town?.cr || "").toLowerCase();
            return frName.includes(q) || crName.includes(q) || frTown.includes(q) || crTown.includes(q);
        });
    }, [searchQuery]);

    // --- GESTION & COMPRESSION DE LA SÉLECTION D'IMAGE ---
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsCompressing(true); // On affiche le loader
            try {
                // On compresse l'image (max 1000px de large, qualité JPEG à 70%)
                const compressedFile = await compressImage(file, 1000, 0.7);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error("Erreur de compression", error);
                alert("Impossible de compresser cette image.");
            } finally {
                setIsCompressing(false); // On retire le loader
            }
        }
    };

    const submit = () => {
        if (!(sargasses || sun || swim || crowd || comment.trim() || imageFile)) return;
        
        const now = Date.now();
        const isAdmin = userPosition?.lat && userPosition.lat > 40;
        
        const lockKey = `lock_report_global_${beachIdNum}`;
        const lastReport = localStorage.getItem(lockKey);

        if (!isAdmin && lastReport && now - Number(lastReport) < SPAM_LIMIT_MS) {
            setShowSpamModal(true);
            return;
        }

        const batch = [];
        let commentAdded = false;
        
        const addCommentIfAny = (reportObj) => {
            if ((comment.trim() || imageFile) && !commentAdded) {
                if (comment.trim()) reportObj.comment = comment.trim();
                if (imageFile) reportObj.imageFile = imageFile; 
                commentAdded = true;
            }
            return reportObj;
        };

        if (sargasses) batch.push(addCommentIfAny({ beachId: beachIdNum, type: "sargasses", level: sargasses, ts: now }));
        if (sun) batch.push(addCommentIfAny({ beachId: beachIdNum, type: "sun", level: sun, ts: now }));
        if (swim) batch.push(addCommentIfAny({ beachId: beachIdNum, type: "swim", level: swim, ts: now }));
        if (crowd) batch.push(addCommentIfAny({ beachId: beachIdNum, type: "crowd", level: crowd, ts: now }));

        if (!commentAdded && (comment.trim() || imageFile)) {
            batch.push({ 
                beachId: beachIdNum, 
                type: "comment_only", 
                level: 1, 
                ts: now, 
                comment: comment.trim(),
                imageFile: imageFile 
            });
        }

        if (typeof addReports === "function") {
            addReports(batch);
            if (!isAdmin) localStorage.setItem(lockKey, now.toString());
        }
        
        navigate(`/beach/${beachIdNum}`);
    };

    const beachNameDisplay = typeof beach.name === 'object' ? (language === 'cr' && beach.name.cr ? beach.name.cr : beach.name.fr) : beach.name;

    const titleMap = {
        sun: t("weather") || "Météo",
        swim: t("weather_sea") || "Baignade",
        crowd: t("crowd") || "Affluence",
        sargasses: t("sargassum") || "Sargasses"
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center mb-5 mt-1 w-full overflow-hidden">
                <div className="flex items-center justify-center gap-1.5 mb-2 px-1 w-full max-w-[100vw] overflow-hidden whitespace-nowrap">
                    <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                        Vous semblez proche de :
                    </span>
                    
                    <div className="text-[11px] font-black text-[#1f7c8a] uppercase italic flex items-center gap-1 bg-[#1f7c8a]/10 px-2 py-1.5 rounded-full shadow-sm border border-[#1f7c8a]/20 min-w-0">
                        <MapPin size={10} className={userPosition ? "text-green-500 animate-pulse shrink-0" : "text-[#1f7c8a] shrink-0"} />
                        <span className="truncate">{beachNameDisplay}</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsSheetOpen(true)}
                        className="flex items-center gap-1 bg-white text-slate-500 px-2 py-1.5 rounded-full text-[9px] font-bold shadow-sm border border-slate-200 active:scale-95 transition-all shrink-0"
                    >
                        <Search size={10} strokeWidth={3} />
                        Changer
                    </button>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliquez pour signaler</span>
            </div>

            <div className="space-y-2 pb-2">
                <MiniGrid title={titleMap.sargasses} kind="sargasses" reports={reports} beachId={beachIdNum} current={sargasses} onChange={setSargasses} language={language} />
                <MiniGrid title={titleMap.sun} kind="sun" reports={reports} beachId={beachIdNum} current={sun} onChange={setSun} language={language} />
                <MiniGrid title={titleMap.swim} kind="swim" reports={reports} beachId={beachIdNum} current={swim} onChange={setSwim} language={language} />
                <MiniGrid title={titleMap.crowd} kind="crowd" reports={reports} beachId={beachIdNum} current={crowd} onChange={setCrowd} language={language} />
            </div>

            <div className="mb-5 bg-white p-3 rounded-[16px] shadow-sm border border-slate-100 mt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Commentaire (Facultatif)</span>
                    </div>
                    {user && <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-1.5 py-0.5 rounded-md">Connecté</span>}
                </div>
                
                <div className="relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={200}
                        disabled={!user}
                        placeholder={user ? "Commentez, décrivez la plage..." : "Connectez-vous pour laisser un commentaire."}
                        className={`w-full rounded-xl p-3 text-sm outline-none transition-all resize-none h-16 custom-scrollbar ${
                            user 
                            ? "bg-slate-50 border border-slate-200 text-slate-700 focus:border-[#1f7c8a] focus:ring-1 focus:ring-[#1f7c8a]/20" 
                            : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                    />
                    <span className={`absolute bottom-2 right-2 text-[10px] font-bold ${comment.length >= 190 ? 'text-red-500' : 'text-slate-400'} ${!user && 'opacity-50'}`}>
                        {comment.length}/200
                    </span>
                </div>

                {/* --- BLOC APPAREIL PHOTO AVEC FEEDBACK DE COMPRESSION --- */}
                {user && (
                    <div className="mt-3 flex items-center gap-3">
                        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 bg-[#1f7c8a]/10 text-[#1f7c8a] border border-[#1f7c8a]/20 hover:bg-[#1f7c8a]/20">
                            {isCompressing ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" /> Compression...
                                </>
                            ) : (
                                <>
                                    <Camera size={14} strokeWidth={2.5} />
                                    {imagePreview ? "Changer la photo" : "Ajouter une photo"}
                                </>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onChange={handleImageChange} 
                                className="hidden" 
                                disabled={isCompressing}
                            />
                        </label>

                        {imagePreview && !isCompressing && (
                            <div className="relative">
                                <img src={imagePreview} alt="Aperçu" className="h-10 w-10 object-cover rounded-lg shadow-sm border border-slate-200" />
                                <button 
                                    onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(null); }}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md active:scale-90"
                                >
                                    <X size={10} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!user && (
                    <button 
                        onClick={() => navigate('/profile')}
                        className="w-full mt-2 py-2 bg-[#1f7c8a]/10 text-[#1f7c8a] rounded-[10px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <User size={14} /> Se connecter pour commenter
                    </button>
                )}
            </div>

            <div className="flex justify-center mb-4">
                <button
                    onClick={submit}
                    disabled={!(sargasses || sun || swim || crowd || comment.trim() || imageFile) || isCompressing}
                    className={`w-[40%] py-2.5 rounded-[12px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                        (sargasses || sun || swim || crowd || comment.trim() || imageFile) && !isCompressing ? "bg-[#1f7c8a] text-white" : "bg-gray-200 text-gray-400 shadow-none"
                    }`}
                >
                    <Send size={12} /> Envoyer
                </button>
            </div>

            <Dialog open={showSpamModal} onOpenChange={setShowSpamModal}>
                <DialogContent className="w-[85vw] max-w-[320px] rounded-[30px] border-none p-6 bg-white text-center z-[300]">
                    <div className="text-4xl mb-4">⏳</div>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase italic text-slate-800">{t("slow_down") || "Doucement le pro !"}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 font-medium my-4">
                        {t("spam_msg") || "Vous avez déjà signalé cette plage récemment. Merci de patienter un peu pour éviter les abus."}
                    </p>
                    <button
                        onClick={() => setShowSpamModal(false)}
                        className="w-full py-3 bg-[#1f7c8a] text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        {t("understood") || "J'ai compris"}
                    </button>
                </DialogContent>
            </Dialog>

            <div className="mb-4 mt-4 flex flex-col items-center">
                <div className="w-[80%]">
                    <p className="text-[7px] text-slate-300 text-right uppercase tracking-widest mb-1 pr-1 font-medium">
                        Partenaire local
                    </p>
                    <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform w-full">
                        <img 
                            src="/pub_hamac.png" 
                            alt="Partenaire local"
                            className="w-full h-[50px] object-cover rounded-[14px] opacity-95 shadow-sm border border-slate-100"
                        />
                    </a>
                </div>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[45px] bg-[#e0f4f9] border-none p-0 overflow-hidden shadow-2xl flex flex-col z-[200]">
                    <div className="p-6 pb-4 border-b border-[#c8eaf3] sticky top-0 bg-[#e0f4f9] z-10">
                        <SheetHeader className="mb-4 flex flex-row items-center space-y-0">
                            <button 
                                onClick={() => setIsSheetOpen(false)} 
                                className="p-2 -ml-2 rounded-full active:scale-90 transition-transform bg-white/50 text-[#1f7c8a] shadow-sm shrink-0"
                            >
                                <ChevronDown size={22} strokeWidth={3} />
                            </button>
                            <SheetTitle className="text-xl font-black text-[#1f7c8a] italic uppercase flex-1 text-center pr-8">
                                Choisir une plage
                            </SheetTitle>
                        </SheetHeader>

                        <div className="bg-white rounded-xl shadow-sm flex items-center px-4 h-12 border border-black/5">
                            <Search size={18} className="text-gray-400 mr-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher par nom, ville..."
                                className="flex-1 bg-transparent outline-none text-[15px] font-medium"
                            />
                        </div>
                    </div>
                    
                    <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-10 custom-scrollbar">
                        {displayedBeaches.map(b => (
                            <button 
                                key={b.id} 
                                onClick={() => {
                                    setIsSheetOpen(false);
                                    setSargasses(0); setSun(0); setSwim(0); setCrowd(0); setComment("");
                                    setImageFile(null); 
                                    setImagePreview(null);
                                    navigate(`/beach/${b.id}/report`);
                                }} 
                                className="w-full flex justify-between items-center p-4 bg-[#fdf5dd] border border-yellow-600/10 rounded-[24px] shadow-sm active:scale-95 transition-transform"
                            >
                                <div className="text-left leading-tight flex-1">
                                    <div className="font-black text-[15px] text-gray-800">
                                        {typeof b.name === 'object' ? (language === 'cr' && b.name.cr ? b.name.cr : b.name.fr) : b.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">
                                        {typeof b.town === 'object' ? (language === 'cr' && b.town.cr ? b.town.cr : b.town.fr) : b.town}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </Layout>
    );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { ArrowLeft, LogOut, Award, Star, MapPin, User, Edit2, Check, Camera, X } from "lucide-react"; 
import { auth, googleProvider, db } from "../firebase"; 
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

// --- LES GRADES MARINS ---
const RANKS = [
    { id: 1, name: "Étoile de Mer", min: 0, max: 99, icon: "⭐", color: "text-orange-500", bg: "bg-orange-100" },
    { id: 2, name: "Tortue Marine", min: 100, max: 499, icon: "🐢", color: "text-green-500", bg: "bg-green-100" },
    { id: 3, name: "Pélican", min: 500, max: 1999, icon: "🦤", color: "text-blue-500", bg: "bg-blue-100" },
    { id: 4, name: "Légende du Lagon", min: 2000, max: Infinity, icon: "👑", color: "text-purple-600", bg: "bg-purple-100" },
];

// --- LES AVATARS DISPONIBLES (Mise à jour avec les 9 avatars pour une grille 3x3 parfaite) ---
const AVATARS = [
    "/etoile.png",
    "/requin.png",
    "/globe.png",
    "/pirate.png",
    "/pirate2.png",
    "/paris1.png",
    "/hipster1.png",
    "/hipster2.png",
    "/barracuda.png"
];

export default function ProfileScreen({ user, userProfile }) {
    const navigate = useNavigate();
    
    // États pour le pseudo
    const [isEditing, setIsEditing] = useState(false);
    const [pseudo, setPseudo] = useState("");

    // État pour la fenêtre de choix d'avatar
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    // Définir l'avatar actuel (On ignore la photo Google qui commence par "http")
    const currentAvatar = (userProfile?.photoURL && !userProfile.photoURL.startsWith('http')) 
        ? userProfile.photoURL 
        : "/etoile.png";

    useEffect(() => {
        if (userProfile?.displayName) {
            setPseudo(userProfile.displayName);
        }
    }, [userProfile]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Erreur de connexion:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    const handleSavePseudo = async () => {
        if (!pseudo.trim() || !user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: pseudo.trim()
            });
            setIsEditing(false); 
        } catch (error) {
            console.error("Erreur lors de la mise à jour du pseudo:", error);
        }
    };

    const handleSaveAvatar = async (avatarPath) => {
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                photoURL: avatarPath
            });
            setShowAvatarModal(false);
        } catch (error) {
            console.error("Erreur lors du changement d'avatar:", error);
        }
    };

    const xp = userProfile?.xp || 0;
    const currentRankIndex = RANKS.findIndex(r => xp >= r.min && xp <= r.max);
    const currentRank = RANKS[currentRankIndex] || RANKS[0];
    const nextRank = RANKS[currentRankIndex + 1];

    const progress = nextRank 
        ? ((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100 
        : 100;

    return (
        <Layout>
            <div className="flex items-center gap-3 mb-6 mt-2">
                <button onClick={() => navigate(-1)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-[#1f7c8a]">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <h1 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Mon Profil</h1>
            </div>

            {!user ? (
                <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 text-center mt-10">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Rejoignez la communauté</h2>
                    <p className="text-slate-500 text-sm font-medium mb-8">
                        Connectez-vous pour cumuler des points (XP), débloquer des badges exclusifs et faire monter votre grade en signalant la météo des plages !
                    </p>
                    <button 
                        onClick={handleLogin}
                        className="w-full py-4 bg-[#1f7c8a] text-white font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                    >
                        <User size={20} />
                        Se connecter avec Google
                    </button>
                </div>
            ) : (
                <div className="space-y-4 pb-10">
                    
                    {/* CARTE D'IDENTITÉ */}
                    <div className="bg-gradient-to-br from-[#1f7c8a] to-[#0e3868] p-7 rounded-[30px] shadow-xl border border-white/10 flex items-center relative overflow-hidden h-40">
                        
                        {/* Filigrane (Garde l'étoile en fond pour la déco) */}
                        <img 
                            src="/etoile.png" 
                            alt="" 
                            className="absolute -right-6 -bottom-8 w-48 h-48 object-contain opacity-25 z-0 rotate-[15deg] pointer-events-none"
                        />
                        
                        {/* Zone de gauche : Avatar modifiable */}
                        <div className="shrink-0 z-10 mr-6 relative">
                            <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                                <img 
                                    src={currentAvatar} 
                                    alt="Avatar" 
                                    className="w-20 h-20 rounded-full border-4 border-white/70 shadow-lg object-contain bg-white transition-transform active:scale-95"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-[#facc15] w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[#0e3868] shadow-sm">
                                    <Camera size={14} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Zone de droite : Infos */}
                        <div className="flex-1 flex flex-col items-start z-10 pt-1">
                            <div className="w-full flex items-center min-h-[30px]">
                                {isEditing ? (
                                    <div className="flex items-center gap-1.5 w-full">
                                        <input 
                                            type="text" 
                                            value={pseudo}
                                            onChange={(e) => setPseudo(e.target.value)}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 font-black text-white text-base outline-none focus:border-white focus:bg-white/20 placeholder:text-white/40"
                                            placeholder="Ton pseudo..."
                                            maxLength={15}
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleSavePseudo}
                                            className="h-8 w-8 bg-white/20 text-white rounded-lg flex items-center justify-center active:scale-90 transition-transform shadow-sm shrink-0"
                                        >
                                            <Check size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-white drop-shadow-sm line-clamp-1">{userProfile?.displayName}</h2>
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="text-white/50 hover:text-white transition-colors p-1"
                                        >
                                            <Edit2 size={14} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-white/60 text-[10px] font-medium mt-0.5">Membre depuis le {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}</p>
                            
                            <div className={`mt-3 px-3.5 py-1 rounded-full ${currentRank.bg} ${currentRank.color} font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border border-white shadow-md z-10`}>
                                <span className="text-sm">{currentRank.icon}</span>
                                {currentRank.name}
                            </div>
                        </div>
                    </div>

                    {/* Jauge d'XP */}
                    <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Expérience</span>
                            <span className="text-xl font-black text-[#1f7c8a]">{xp} XP</span>
                        </div>
                        
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-[#1f7c8a] to-[#068db3] transition-all duration-1000 ease-out rounded-full relative"
                                style={{ width: `${Math.max(5, progress)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        {nextRank ? (
                            <p className="text-xs text-slate-500 font-medium text-center">
                                Plus que <strong className="text-slate-800">{nextRank.min - xp} XP</strong> pour devenir {nextRank.name} !
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 font-medium text-center">Niveau Maximum atteint !</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center">
                            <MapPin size={24} className="text-orange-500 mb-2" />
                            <span className="text-2xl font-black text-slate-800">{userProfile?.reportsCount || 0}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">Signalements</span>
                        </div>
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center">
                            <Star size={24} className="text-yellow-400 mb-2" />
                            <span className="text-2xl font-black text-slate-800">{xp}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1">Points gagnés</span>
                        </div>
                    </div>

                    {/* Déconnexion */}
                    <button 
                        onClick={handleLogout}
                        className="w-full py-4 mt-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs"
                    >
                        <LogOut size={16} />
                        Se déconnecter
                    </button>
                </div>
            )}

            {/* FENÊTRE MODALE DE CHOIX D'AVATAR */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAvatarModal(false)}
                    ></div>
                    
                    <div className="relative bg-[#e0f4f9] w-full max-w-[340px] rounded-[35px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute top-4 right-4 h-8 w-8 bg-white/50 text-[#1f7c8a] rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>
                        
                        <h2 className="text-xl font-black text-[#1f7c8a] uppercase italic text-center mb-6 mt-2">
                            Choisis ton Avatar
                        </h2>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {AVATARS.map((avatarPath) => (
                                <button
                                    key={avatarPath}
                                    onClick={() => handleSaveAvatar(avatarPath)}
                                    className={`relative aspect-square rounded-[20px] p-2 flex items-center justify-center transition-all active:scale-95 ${
                                        currentAvatar === avatarPath 
                                            ? "bg-white border-4 border-[#facc15] shadow-md scale-105" 
                                            : "bg-white/50 border-2 border-transparent hover:bg-white"
                                    }`}
                                >
                                    <img src={avatarPath} alt="Choix d'avatar" className="w-full h-full object-contain" />
                                    {currentAvatar === avatarPath && (
                                        <div className="absolute -top-2 -right-2 bg-[#facc15] text-[#0e3868] rounded-full p-1 shadow-sm">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { LogOut, Award, Star, MapPin, User, Edit2, Check, Camera, X } from "lucide-react"; 
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

// --- LES AVATARS DISPONIBLES ---
const AVATARS = [
    "/etoile.png",
    "/requin.png",
    "/globe.png",
    "/pirate.png",
    "/pirate2.png",
    "/paris1.png",
    "/hipster1.png",
    "/hipster2.png",
    "/barracuda.png",
    "/huitre.png",
    "/raie.png"
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
            {!user ? (
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 text-center mt-6">
                    <div className="text-5xl mb-3">🏆</div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">Rejoignez la communauté</h2>
                    <p className="text-slate-500 text-xs font-medium mb-6">
                        Connectez-vous pour cumuler des points (XP), débloquer des badges exclusifs et faire monter votre grade en signalant la météo des plages !
                    </p>
                    <button 
                        onClick={handleLogin}
                        className="w-full py-3.5 bg-[#088db1] text-white font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm"
                    >
                        <User size={18} />
                        Se connecter avec Google
                    </button>
                </div>
            ) : (
                <div className="space-y-4 pb-6 pt-2">
                    
                    {/* LE SUPER-BLOC CARTE D'IDENTITÉ INTÉGRÉE */}
                    <div className="bg-gradient-to-br from-[#088db1] to-[#0e3868] p-5 rounded-[30px] shadow-xl border border-white/10 flex flex-col items-center relative overflow-hidden">
                        
                        {/* Filigrane étoilé ajusté */}
                        <img 
                            src="/etoile.png" 
                            alt="" 
                            className="absolute -right-6 -bottom-8 w-64 h-64 object-contain opacity-20 z-0 rotate-[15deg] pointer-events-none"
                        />
                        
                        {/* PSEUDO ET BOUTONS D'ACTION (Édition + Déconnexion) */}
                        <div className="w-full flex justify-center items-center min-h-[36px] mb-3 z-10">
                            {isEditing ? (
                                <div className="flex items-center gap-1.5 w-full max-w-[220px]">
                                    <input 
                                        type="text" 
                                        value={pseudo}
                                        onChange={(e) => setPseudo(e.target.value)}
                                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 font-black text-white text-lg outline-none focus:border-white focus:bg-white/20 placeholder:text-white/40 text-center"
                                        placeholder="Ton pseudo..."
                                        maxLength={15}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSavePseudo}
                                        className="h-9 w-9 bg-white/20 text-white rounded-lg flex items-center justify-center active:scale-90 transition-transform shadow-sm shrink-0"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
                                    <h2 className="text-2xl font-black text-white drop-shadow-md line-clamp-1">{userProfile?.displayName}</h2>
                                    <div className="w-[1px] h-5 bg-white/20 mx-1"></div>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="text-white/50 hover:text-white transition-colors p-1"
                                        title="Modifier le pseudo"
                                    >
                                        <Edit2 size={16} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-white/50 hover:text-red-400 transition-colors p-1"
                                        title="Se déconnecter"
                                    >
                                        <LogOut size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* AVATAR GÉANT */}
                        <div className="z-10 relative mb-1">
                            <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                                <img 
                                    src={currentAvatar} 
                                    alt="Avatar" 
                                    className="w-64 h-64 rounded-full border-[8px] border-white/20 shadow-2xl object-contain bg-white transition-transform active:scale-95"
                                />
                                <div className="absolute bottom-4 right-4 bg-[#facc15] w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center text-[#0e3868] shadow-md">
                                    <Camera size={20} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                        
                        {/* INFOS MEMBRE ET GRADE DÉCAPSULÉ */}
                        <div className="w-full flex flex-col items-center z-10 mb-4">
                            <p className="text-white/60 text-[10px] font-medium mt-0.5">Membre depuis le {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString()}</p>
                            
                            {/* GRADE */}
                            <div className="mt-1 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 z-10 text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                                <span className="text-sm">{currentRank.icon}</span>
                                {currentRank.name}
                            </div>
                        </div>

                        {/* LE BLOC XP ET SIGNALEMENTS INTÉGRÉ */}
                        <div className="w-full bg-black/10 rounded-[20px] p-4 z-10 border border-white/10 backdrop-blur-md">
                            
                            {/* Section Signalements */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-[#facc15]" />
                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Signalements envoyés</span>
                                </div>
                                <span className="text-xl font-black text-white leading-none">{userProfile?.reportsCount || 0}</span>
                            </div>

                            {/* Séparateur discret */}
                            <div className="w-full h-[1px] bg-white/10 my-3"></div>

                            {/* Section Expérience globale */}
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Expérience globale</span>
                                <span className="text-lg font-black text-[#facc15] leading-none">{xp} XP</span>
                            </div>
                            
                            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden mb-1.5 shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#facc15] to-[#f97316] transition-all duration-1000 ease-out rounded-full relative"
                                    style={{ width: `${Math.max(5, progress)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>

                            {nextRank ? (
                                <p className="text-[9px] text-white/60 font-medium text-center">
                                    Plus que <strong className="text-white">{nextRank.min - xp} XP</strong> pour devenir {nextRank.name} !
                                </p>
                            ) : (
                                <p className="text-[9px] text-white/60 font-medium text-center">Niveau Maximum atteint !</p>
                            )}

                        </div>

                    </div>

                    {/* --- PUB CLIQUABLE AGRANDIE --- */}
                    <div className="pt-2">
                        <p className="text-[8px] text-slate-400 text-right uppercase tracking-widest mb-1 pr-1 font-medium">
                            Partenaire local
                        </p>
                        <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform">
                            <img 
                                src="/pub_hamac.png" 
                                alt="Partenaire local"
                                className="w-full h-[100px] object-cover rounded-[20px] opacity-95 shadow-sm border border-slate-100"
                            />
                        </a>
                    </div>
                </div>
            )}

            {/* FENÊTRE MODALE DE CHOIX D'AVATAR AVEC SCROLL */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAvatarModal(false)}
                    ></div>
                    
                    <div className="relative bg-[#e0f4f9] w-full max-w-[340px] rounded-[35px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute top-4 right-4 h-8 w-8 bg-white/50 text-[#088db1] rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>
                        
                        <h2 className="text-xl font-black text-[#088db1] uppercase italic text-center mb-4 mt-2">
                            Choisis ton Avatar
                        </h2>
                        
                        {/* Zone scrollable ajoutée ici */}
                        <div className="max-h-[55vh] overflow-y-auto pr-2 -mr-2 mb-2 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-4 pb-4">
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
                </div>
            )}
        </Layout>
    );
}
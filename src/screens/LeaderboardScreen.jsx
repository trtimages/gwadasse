// src/screens/LeaderboardScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// --- LES GRADES MARINS (pour afficher la bonne icône) ---
const RANKS = [
    { id: 1, name: "Étoile de Mer", min: 0, max: 99, icon: "⭐" },
    { id: 2, name: "Tortue Marine", min: 100, max: 499, icon: "🐢" },
    { id: 3, name: "Pélican", min: 500, max: 1999, icon: "🦤" },
    { id: 4, name: "Légende du Lagon", min: 2000, max: Infinity, icon: "👑" },
];

export default function LeaderboardScreen() {
    const navigate = useNavigate();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                // On va chercher les 20 utilisateurs avec le plus d'XP dans Firestore
                const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(20));
                const querySnapshot = await getDocs(q);
                
                const usersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setLeaders(usersData);
            } catch (error) {
                console.error("Erreur lors de la récupération du classement:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaders();
    }, []);

    const getRank = (xp) => RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0];

    return (
        <Layout>
            {/* EN-TÊTE */}
            <div className="flex items-center justify-between mb-6 mt-1 px-1">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-[#facc15]">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">Top Explorateurs</h1>
                </div>
                <Trophy size={20} className="text-[#facc15] drop-shadow-sm" />
            </div>

            {loading ? (
                <div className="text-center text-slate-500 font-medium py-10 animate-pulse">
                    Chargement du classement...
                </div>
            ) : (
                <div className="space-y-3 pb-6">
                    {leaders.map((user, index) => {
                        const rank = getRank(user.xp || 0);
                        
                        // Styles spécifiques pour le podium
                        let itemStyle = "bg-white border-slate-100";
                        let medalIcon = <span className="text-slate-400 text-sm font-black w-6 text-center">{index + 1}</span>;

                        if (index === 0) {
                            itemStyle = "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 scale-[1.02] shadow-md z-10 relative";
                            medalIcon = <span className="text-2xl drop-shadow-md w-6 text-center">🥇</span>;
                        } else if (index === 1) {
                            itemStyle = "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 shadow-sm";
                            medalIcon = <span className="text-xl drop-shadow-md w-6 text-center">🥈</span>;
                        } else if (index === 2) {
                            itemStyle = "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm";
                            medalIcon = <span className="text-xl drop-shadow-md w-6 text-center">🥉</span>;
                        }

                        // Avatar par défaut si non défini
                        const avatar = (user.photoURL && !user.photoURL.startsWith('http')) ? user.photoURL : "/etoile.png";

                        return (
                            <div 
                                key={user.id} 
                                className={`w-full p-3 rounded-[20px] border flex items-center gap-3 transition-transform ${itemStyle}`}
                            >
                                {/* Position */}
                                <div className="flex items-center justify-center shrink-0">
                                    {medalIcon}
                                </div>

                                {/* Avatar */}
                                <img 
                                    src={avatar} 
                                    alt="Avatar" 
                                    className={`w-12 h-12 rounded-full object-cover bg-white shrink-0 ${index === 0 ? 'border-2 border-yellow-400' : 'border border-slate-200'}`}
                                    onError={(e) => { e.target.onerror = null; e.target.src = "/etoile.png"; }}
                                />

                                {/* Infos Joueur */}
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black text-[14px] text-slate-800 uppercase tracking-tight truncate">
                                        {user.displayName || "Anonyme"}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>{rank.icon}</span>
                                        <span>{rank.name}</span>
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="flex flex-col items-end shrink-0 px-2">
                                    <span className={`text-lg font-black leading-none ${index === 0 ? 'text-yellow-600' : 'text-[#068db3]'}`}>
                                        {user.xp || 0}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">XP</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
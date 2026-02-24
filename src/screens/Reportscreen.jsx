// src/screens/ReportScreen.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";
import { ChevronLeft, MapPin, Send } from "lucide-react";

// Fonction interne pour compter les votes par niveau sur 24h
function getVoteCount(allReports, beachId, type, level) {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    return (allReports || []).filter(
        (r) => r.beachId === beachId && r.type === type && r.level === level && (now - r.ts) <= dayInMs
    ).length;
}

function MiniGrid({ title, options, current, onChange, reports, beachId, kind }) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-end mb-2 px-1">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{title}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">24H</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {options.map((opt) => {
                    const active = current === opt.lvl;
                    const votes = getVoteCount(reports, beachId, kind, opt.lvl);

                    return (
                        <button
                            key={opt.lvl}
                            type="button"
                            onClick={() => onChange(active ? 0 : opt.lvl)}
                            className={`relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border-2 transition-all active:scale-95 ${
                                active
                                    ? "bg-slate-800 border-slate-800 text-white shadow-md scale-105"
                                    : "bg-white border-slate-100 text-slate-500 shadow-sm hover:bg-slate-50"
                            }`}
                        >
                            <span className="text-2xl mb-1.5 drop-shadow-sm">{opt.icon}</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wide leading-none">{opt.label}</span>
                                <span className={`text-[8px] font-bold ${active ? "text-cyan-300" : "text-slate-400"}`}>
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

export default function ReportScreen({ reports = [], addReports, userPosition }) {
    const { beachId } = useParams();
    const navigate = useNavigate();
    const beachIdNum = Number(beachId);
    const beach = beaches.find((b) => b.id === beachIdNum);

    const [sargasses, setSargasses] = useState(0);
    const [sun, setSun] = useState(0);
    const [swim, setSwim] = useState(0);
    const [crowd, setCrowd] = useState(0);

    if (!beach) return <Layout><div className="p-10 text-center font-bold">Plage inconnue</div></Layout>;

    const submit = () => {
        if (!(sargasses || sun || swim || crowd)) return;
        const ts = Date.now();
        const batch = [];
        if (sargasses) batch.push({ beachId: beachIdNum, type: "sargasses", level: sargasses, ts });
        if (sun) batch.push({ beachId: beachIdNum, type: "sun", level: sun, ts });
        if (swim) batch.push({ beachId: beachIdNum, type: "swim", level: swim, ts });
        if (crowd) batch.push({ beachId: beachIdNum, type: "crowd", level: crowd, ts });

        addReports(batch);
        navigate(`/beach/${beachIdNum}`);
    };

    return (
        <Layout>
            {/* Header intermédiaire */}
            <div className="flex items-center justify-between mb-4 mt-1">
                <Link to={`/beach/${beachIdNum}`} className="flex items-center text-slate-500 font-black text-[10px] uppercase tracking-tighter active:scale-95 transition-transform p-2 -ml-2">
                    <ChevronLeft size={14} /> Retour
                </Link>
                <div className="text-[10px] font-black text-[#1f7c8a] uppercase italic flex items-center gap-1.5 bg-[#1f7c8a]/10 px-2.5 py-1 rounded-full">
                    <MapPin size={10} className={userPosition ? "text-green-500" : "text-[#1f7c8a]"} />
                    {beach.name}
                </div>
            </div>

            <div className="space-y-1 pb-4">
                <MiniGrid title="Sargasses" kind="sargasses" reports={reports} beachId={beachIdNum} current={sargasses} onChange={setSargasses}
                    options={[{ lvl: 1, label: "Tranquille", icon: "🟢" }, { lvl: 2, label: "Moyen", icon: "🟠" }, { lvl: 3, label: "Envahi", icon: "🔴" }]} />

                <MiniGrid title="Météo" kind="sun" reports={reports} beachId={beachIdNum} current={sun} onChange={setSun}
                    options={[{ lvl: 1, label: "Soleil", icon: "☀️" }, { lvl: 2, label: "Couvert", icon: "☁️" }, { lvl: 3, label: "Pluie", icon: "🌧️" }]} />

                <MiniGrid title="Baignade" kind="swim" reports={reports} beachId={beachIdNum} current={swim} onChange={setSwim}
                    options={[{ lvl: 1, label: "OK", icon: "✅" }, { lvl: 2, label: "Risque", icon: "⚠️" }, { lvl: 3, label: "Interdite", icon: "🚫" }]} />

                <MiniGrid title="Affluence" kind="crowd" reports={reports} beachId={beachIdNum} current={crowd} onChange={setCrowd}
                    options={[{ lvl: 1, label: "Vide", icon: "👥" }, { lvl: 2, label: "Moyen", icon: "👫" }, { lvl: 3, label: "Bondé", icon: "🔥" }]} />
            </div>

            <button
                onClick={submit}
                disabled={!(sargasses || sun || swim || crowd)}
                className={`mt-1 mb-4 w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    (sargasses || sun || swim || crowd) ? "bg-[#1f7c8a] text-white" : "bg-gray-100 text-gray-400 shadow-none"
                }`}
            >
                <Send size={14} /> Envoyer
            </button>

            {/* --- PUB CLIQUABLE --- */}
            <a href="https://le-hamac.com/" target="_blank" rel="noopener noreferrer" className="block active:scale-95 transition-transform mb-4">
                <img src="/pub_hamac.png" alt="Pub Le Hamac" className="w-full h-16 object-cover rounded-[18px] opacity-90 shadow-inner" />
            </a>
        </Layout>
    );
}
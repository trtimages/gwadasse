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
        <div className="mb-2">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 ml-1 flex justify-between">
                <span>{title}</span>
                <span className="opacity-50 italic">Dernières 24h</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
                {options.map((opt) => {
                    const active = current === opt.lvl;
                    const votes = getVoteCount(reports, beachId, kind, opt.lvl);

                    return (
                        <button
                            key={opt.lvl}
                            type="button"
                            onClick={() => onChange(active ? 0 : opt.lvl)}
                            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all ${active
                                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                                    : "bg-white border-gray-100 text-slate-500"
                                }`}
                        >
                            <span className="text-sm">{opt.icon}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] font-black uppercase truncate">{opt.label}</span>
                                <span className={`text-[8px] font-bold ${active ? "text-cyan-300" : "text-slate-400"}`}>
                                    {votes}
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

    if (!beach) return <Layout>Plage inconnue</Layout>;

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
            {/* Header ultra-compact */}
            <div className="flex items-center justify-between mb-2">
                <Link to={`/beach/${beachIdNum}`} className="flex items-center text-slate-400 font-black text-[8px] uppercase tracking-tighter">
                    <ChevronLeft size={10} /> Annuler
                </Link>
                <div className="text-[8px] font-black text-slate-400 uppercase italic flex items-center gap-1">
                    <MapPin size={8} className={userPosition ? "text-green-500" : ""} />
                    {beach.name}
                </div>
            </div>

            <div className="space-y-1">
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
                className={`mt-4 w-full py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all ${(sargasses || sun || swim || crowd) ? "bg-[#1f7c8a] text-white" : "bg-gray-100 text-gray-400"
                    }`}
            >
                <Send size={10} /> Envoyer
            </button>
        </Layout>
    );
}
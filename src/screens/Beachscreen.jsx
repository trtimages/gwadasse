// src/screens/BeachScreen.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout.jsx";
import { beaches } from "@/data/beaches.js";
import { computeDecision } from "@/utils/reports.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WINDOW_MS = 3 * 60 * 60 * 1000; // 3 h

function countsFromReports(list) {
  const counts = { green: 0, orange: 0, red: 0 };
  for (const r of list) {
    if (r.level === 1) counts.green += 1;
    else if (r.level === 2) counts.orange += 1;
    else if (r.level === 3) counts.red += 1;
  }
  return counts;
}

function get24hCountsForType(allReports, beachId, type) {
  const now = Date.now();
  const window24h = 24 * 60 * 60 * 1000;
  const recent = allReports.filter(
    (r) => r.beachId === beachId && r.type === type && now - r.ts <= window24h
  );
  return countsFromReports(recent);
}

function decisionText(kind, level) {
  if (!level) return "Pas assez d’infos";
  if (kind === "sargasses") return level === 1 ? "Aucune" : level === 2 ? "Modérée" : "Importante";
  if (kind === "swim") return level === 1 ? "Autorisée" : level === 2 ? "Déconseillée" : "Interdite";
  if (kind === "sun") return level === 1 ? "Soleil" : level === 2 ? "Couvert" : "Pluie";
  if (kind === "crowd") return level === 1 ? "Calme" : level === 2 ? "Modéré" : "Foule";
  return "";
}

function optionLabels(kind) {
  if (kind === "sargasses") return ["Aucune", "Modérée", "Importante"];
  if (kind === "swim") return ["Autorisée", "Déconseillée", "Interdite"];
  if (kind === "sun") return ["Soleil", "Couvert", "Pluie"];
  if (kind === "crowd") return ["Calme", "Modéré", "Foule"];
  return ["Vert", "Orange", "Rouge"];
}

function iconForState(kind, level) {
  const suffix = level === 1 ? "vert" : level === 2 ? "orange" : level === 3 ? "rouge" : "gris";
  if (kind === "sargasses") return `/icone_sarg${suffix}.png`;
  if (kind === "swim") return `/icone_interdiction${suffix}.png`;
  if (kind === "sun") return `/icone_meteo${suffix}.png`;
  if (kind === "crowd") return `/icone_affluence${suffix}.png`;
  return `/icone_${suffix}.png`;
}

function levelStyle(level, active = false) {
  if (level === 1) {
    return active
      ? "bg-green-600 text-white border-green-700"
      : "bg-green-50 text-green-900 border-green-200 hover:bg-green-100";
  }
  if (level === 2) {
    return active
      ? "bg-orange-500 text-white border-orange-600"
      : "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100";
  }
  return active
    ? "bg-red-600 text-white border-red-700"
    : "bg-red-50 text-red-900 border-red-200 hover:bg-red-100";
}

function submitButtonStyle(selectedLevel) {
  if (selectedLevel === 1) return "bg-green-600 hover:bg-green-700";
  if (selectedLevel === 2) return "bg-orange-500 hover:bg-orange-600";
  if (selectedLevel === 3) return "bg-red-600 hover:bg-red-700";
  return "bg-gray-300 cursor-not-allowed";
}

function EventItem({
  value,
  title,
  kind,
  decision,
  counts24h,
  selectedLevel,
  onPick,
  onSubmit,
}) {
  const level = decision.level || 0;

  const iconSrc = iconForState(kind, level);
  const summary = decisionText(kind, level);
  const labels = optionLabels(kind);

  const items = [
    { lvl: 1, label: labels[0], count: counts24h.green },
    { lvl: 2, label: labels[1], count: counts24h.orange },
    { lvl: 3, label: labels[2], count: counts24h.red },
  ];

  return (
    <AccordionItem value={value} className="bg-white">
      {/* Trigger 100% simple, aucun élément parasite => 1 clic ouvre / 1 clic ferme */}
      <AccordionTrigger className="px-3 py-2 no-underline hover:no-underline data-[state=open]:bg-gray-100 hover:bg-gray-100 transition">
        <div className="flex items-center gap-2 w-full">
          <img src={iconSrc} alt="" aria-hidden="true" className="w-10 h-10 flex-shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <div className="font-extrabold text-[14px] leading-tight">
              {title} — {summary}
            </div>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0 pointer-events-none">
  <div className="w-9 h-9 rounded-xl border border-gray-200 bg-white grid place-items-center">
    <img src="/icone_info.png" alt="" className="w-5 h-5" />
  </div>
</div>

      </AccordionTrigger>

      <AccordionContent className="px-3 pb-3">
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <div className="font-bold text-[13px] mb-2">Derniers signalements</div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((it) => {
              const active = selectedLevel === it.lvl;
              return (
                <button
                  key={it.lvl}
                  type="button"
                  onClick={() => onPick(it.lvl)}
                  className={[
                    "flex-shrink-0 rounded-lg border px-3 py-2 text-[13px] font-extrabold transition",
                    levelStyle(it.lvl, active),
                  ].join(" ")}
                >
                  <span className="mr-2">{it.label}</span>
                  <span className={active ? "text-white/90" : "text-gray-700"}>{it.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-[12px] text-gray-600">Clique un état puis “Signaler”.</div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!selectedLevel}
            className={[
              "mt-3 w-full rounded-xl py-2.5 font-extrabold text-white transition",
              submitButtonStyle(selectedLevel),
            ].join(" ")}
          >
            Signaler
          </button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function BeachScreen({ reports, addReports }) {
  const { beachId } = useParams();
  const beachIdNum = Number(beachId);
  const beach = beaches.find((b) => b.id === beachIdNum);

  // ✅ IMPORTANT : valeur contrôlée TOUJOURS string
  // "" = rien d'ouvert (sinon Radix fait parfois un “double clic”)
  const [openItem, setOpenItem] = React.useState("");

  const [picked, setPicked] = React.useState({
    sargasses: 0,
    swim: 0,
    sun: 0,
    crowd: 0,
  });

  if (!beach || !Number.isFinite(beachIdNum)) {
    return (
      <Layout>
        <p className="text-sm">Plage introuvable.</p>
        <Link to="/" className="text-sm text-gray-600">
          ← Retour
        </Link>
      </Layout>
    );
  }

  const beachReports = reports.filter((r) => r.beachId === beach.id);

  // décisions (3h)
  const sargDecision = computeDecision(beachReports, "sargasses", WINDOW_MS);
  const swimDecision = computeDecision(beachReports, "swim", WINDOW_MS);
  const sunDecision = computeDecision(beachReports, "sun", WINDOW_MS);
  const crowdDecision = computeDecision(beachReports, "crowd", WINDOW_MS);

  // compteurs (24h)
  const sarg24 = get24hCountsForType(reports, beach.id, "sargasses");
  const swim24 = get24hCountsForType(reports, beach.id, "swim");
  const sun24 = get24hCountsForType(reports, beach.id, "sun");
  const crowd24 = get24hCountsForType(reports, beach.id, "crowd");

  function submit(kind) {
    const level = picked[kind];
    if (!level) return;

    if (typeof addReports !== "function") {
      alert("addReports manquant (voir patch App.jsx).");
      return;
    }

    const type =
      kind === "sargasses"
        ? "sargasses"
        : kind === "swim"
        ? "swim"
        : kind === "sun"
        ? "sun"
        : "crowd";

    addReports([{ beachId: beach.id, type, level, ts: Date.now() }]);
    setPicked((p) => ({ ...p, [kind]: 0 }));
  }

  return (
    <Layout>
      {/* Header plage */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <img
            src="/logoplage.png"
            alt=""
            aria-hidden="true"
            className="w-14 h-14 rounded-full object-cover border border-gray-200 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[16px] font-extrabold leading-tight">{beach.name}</div>
            <div className="text-[12px] text-gray-600">
              {beach.town} • {beach.island}
            </div>
            <div className="mt-1 text-[12px] text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
              <span>
                🚗 Parking : <span className="font-semibold">{beach.parking ?? "—"}</span>
              </span>
              <span>
                🚿 Douche : <span className="font-semibold">{beach.douche ?? "—"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordéon compact (pas d’espace entre blocs) */}
      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
        <Accordion
          type="single"
          collapsible
          value={openItem}
          onValueChange={setOpenItem}
          className="bg-white"
        >
          <EventItem
            value="sargasses"
            title="Sargasses"
            kind="sargasses"
            decision={sargDecision}
            counts24h={sarg24}
            selectedLevel={picked.sargasses}
            onPick={(lvl) =>
              setPicked((p) => ({ ...p, sargasses: p.sargasses === lvl ? 0 : lvl }))
            }
            onSubmit={() => submit("sargasses")}
          />

          <EventItem
            value="swim"
            title="Baignade"
            kind="swim"
            decision={swimDecision}
            counts24h={swim24}
            selectedLevel={picked.swim}
            onPick={(lvl) =>
              setPicked((p) => ({ ...p, swim: p.swim === lvl ? 0 : lvl }))
            }
            onSubmit={() => submit("swim")}
          />

          <EventItem
            value="sun"
            title="Soleil"
            kind="sun"
            decision={sunDecision}
            counts24h={sun24}
            selectedLevel={picked.sun}
            onPick={(lvl) =>
              setPicked((p) => ({ ...p, sun: p.sun === lvl ? 0 : lvl }))
            }
            onSubmit={() => submit("sun")}
          />

          <EventItem
            value="crowd"
            title="Affluence"
            kind="crowd"
            decision={crowdDecision}
            counts24h={crowd24}
            selectedLevel={picked.crowd}
            onPick={(lvl) =>
              setPicked((p) => ({ ...p, crowd: p.crowd === lvl ? 0 : lvl }))
            }
            onSubmit={() => submit("crowd")}
          />
        </Accordion>
      </div>

      {/* Bouton report global */}
      <Link
        to={`/beach/${beach.id}/report`}
        className="mt-4 block w-full text-center rounded-xl py-3 font-extrabold text-white bg-red-600 hover:bg-red-700 transition"
      >
        Signaler
      </Link>

  {/* Pub bannière compacte */}
<div className="mt-3 flex justify-center">
  <img
    src="/pub_hamac.png"
    alt="Publicité"
    className="w-full max-w-md h-20 object-cover rounded-lg"
  />
</div>


      <div className="mt-4">
        <Link to="/" className="text-sm text-gray-600">
          ← Retour à la carte
        </Link>
      </div>
    </Layout>
  );
}

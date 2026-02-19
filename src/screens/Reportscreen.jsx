import React from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { beaches } from "../data/beaches.js";

/* =======================
   Utils: distance (Haversine)
======================= */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/* =======================
   Small UI components
======================= */
function Card({ title, children, hint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="font-extrabold text-gray-900">{title}</div>
      <div className="mt-3 grid gap-2">{children}</div>
      {hint ? <div className="mt-3 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function PickButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition",
        active
          ? "border-black bg-gray-50"
          : "border-gray-200 bg-white hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="font-extrabold text-gray-900">{label}</span>
      </span>
      <span className="text-xs text-gray-500">{active ? "Sélectionné" : ""}</span>
    </button>
  );
}

/* =======================
   Screen: Report
   - GPS check kept but NON-BLOCKING for dev
======================= */
export default function ReportScreen({ addReports, userPosition, gpsError }) {
  const { beachId } = useParams();
  const beachIdNum = Number(beachId);
  const beach = beaches.find((b) => b.id === beachIdNum);

  const [sargasses, setSargasses] = React.useState(0);
  const [rain, setRain] = React.useState(0);
  const [swim, setSwim] = React.useState(0);

  function toggle(setter, current, value) {
    setter(current === value ? 0 : value);
  }

  function submit() {
    if (!sargasses && !rain && !swim) {
      alert("Choisis au moins 1 info à signaler 🙂");
      return;
    }

    if (!Number.isFinite(beachIdNum) || !beach) {
      alert("Plage invalide.");
      return;
    }

    // GPS check (DEV non bloquant)
    if (
      userPosition &&
      Number.isFinite(userPosition.lat) &&
      Number.isFinite(userPosition.lng) &&
      Number.isFinite(beach.lat) &&
      Number.isFinite(beach.lng)
    ) {
      const d = distanceMeters(
        { lat: userPosition.lat, lng: userPosition.lng },
        { lat: beach.lat, lng: beach.lng }
      );

      const radius = beach.radius ?? 500;

      if (d > radius) {
        alert(
          `(DEV) Tu es à ~${Math.round(d)} m de cette plage (rayon ${radius} m). Signalement envoyé quand même.`
        );
      }
    }

    const ts = Date.now();
    const batch = [];

    if (sargasses) batch.push({ beachId: beachIdNum, type: "sargasses", level: sargasses, ts });
    if (rain) batch.push({ beachId: beachIdNum, type: "rain", level: rain, ts });
    if (swim) batch.push({ beachId: beachIdNum, type: "swim", level: swim, ts });

    addReports(batch);

    // retour fiche plage (simple)
    window.location.href = `/beach/${beachIdNum}`;
  }

  const canSend = !!(sargasses || rain || swim);

  return (
    <Layout>
      {/* Top block */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="text-lg font-extrabold text-gray-900">Signaler</div>
        <div className="mt-1 text-sm text-gray-600">
          {beach ? (
            <>
              <span className="font-semibold">{beach.name}</span> — {beach.town} • {beach.island}
            </>
          ) : (
            "Plage inconnue"
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          {userPosition ? (
            <>📍 Vérif GPS active (dev : non bloquante)</>
          ) : gpsError ? (
            <>📍 GPS indisponible ({gpsError})</>
          ) : (
            <>📍 GPS en attente…</>
          )}
        </div>

        <div className="mt-3">
          <Link to={`/beach/${beachIdNum}`} className="text-sm text-gray-700 underline">
            ← Retour fiche plage
          </Link>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <Card title="Sargasses" hint="Retape sur le même choix pour l’enlever.">
          <PickButton
            active={sargasses === 1}
            onClick={() => toggle(setSargasses, sargasses, 1)}
            icon="🟢"
            label="Aucune"
          />
          <PickButton
            active={sargasses === 2}
            onClick={() => toggle(setSargasses, sargasses, 2)}
            icon="🟠"
            label="Modérées"
          />
          <PickButton
            active={sargasses === 3}
            onClick={() => toggle(setSargasses, sargasses, 3)}
            icon="🔴"
            label="Importantes"
          />
        </Card>

        <Card title="Pluie sur place" hint="Retape sur le même choix pour l’enlever.">
          <PickButton
            active={rain === 1}
            onClick={() => toggle(setRain, rain, 1)}
            icon="☀️"
            label="Pas de pluie"
          />
          <PickButton
            active={rain === 2}
            onClick={() => toggle(setRain, rain, 2)}
            icon="🌦️"
            label="Averses"
          />
          <PickButton
            active={rain === 3}
            onClick={() => toggle(setRain, rain, 3)}
            icon="🌧️"
            label="Forte pluie"
          />
        </Card>

        <Card title="Baignade (drapeaux)" hint="Retape sur le même choix pour l’enlever.">
          <PickButton
            active={swim === 1}
            onClick={() => toggle(setSwim, swim, 1)}
            icon="🟢"
            label="Drapeau vert"
          />
          <PickButton
            active={swim === 2}
            onClick={() => toggle(setSwim, swim, 2)}
            icon="🟠"
            label="Drapeau jaune"
          />
          <PickButton
            active={swim === 3}
            onClick={() => toggle(setSwim, swim, 3)}
            icon="🔴"
            label="Drapeau rouge"
          />
        </Card>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        className={[
          "mt-4 w-full rounded-2xl px-4 py-3 font-extrabold transition",
          canSend
            ? "bg-black text-white hover:bg-gray-900 active:scale-[0.99]"
            : "bg-gray-300 text-gray-600 cursor-not-allowed",
        ].join(" ")}
      >
        Envoyer le signalement
      </button>

      <div className="h-6" />
    </Layout>
  );
}

import React from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { beaches } from "./data/beaches.js";
import { mockReports } from "./data/mockReports.js";
import Layout from "./components/Layout.jsx";
import MapScreen from "./screens/MapScreen.jsx";
import BeachScreen from "./screens/BeachScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";





import {
  computeDecision,
  getBeachStatsFromReports,
  markerColorForBeach,
  normalizeReports,
} from "./utils/reports.js";

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
   Components
======================= */
function DecisionBlockWithPlus({ title, decision, messages, icons, isOpen, onToggle, children }) {
  const hasDecision = decision.level !== 0;
  const icon = hasDecision ? icons[decision.level] : "";
  const text = hasDecision ? messages[decision.level] : `Pas assez d’infos récentes (${decision.windowLabel})`;

  return (
    <div style={decisionBox}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900 }}>
            {icon ? `${icon} ` : ""}
            {title} — {text}
          </div>
          <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
            Fiabilité {decision.reliability}
            {hasDecision ? ` — ${decision.count} signalement${decision.count > 1 ? "s" : ""} (${decision.windowLabel})` : ""}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          title="Voir détails"
          style={{
            border: "1px solid #ddd",
            background: "white",
            borderRadius: 12,
            width: 34,
            height: 34,
            cursor: "pointer",
            fontWeight: 900,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {isOpen ? "–" : "+"}
        </button>
      </div>

      {isOpen ? <div style={{ marginTop: 10 }}>{children}</div> : null}
    </div>
  );
}

function Details24h({ title, counts, icons }) {
  return (
    <div style={{ border: "1px dashed #ddd", borderRadius: 12, padding: 10, background: "white" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Stat icon={icons.g} value={counts.green} />
        <Stat icon={icons.o} value={counts.orange} />
        <Stat icon={icons.r} value={counts.red} />
      </div>
      <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
        Détail brut (prototype) — présentation améliorée plus tard.
      </div>
    </div>
  );
}

const decisionBox = {
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: 12,
  background: "#fafafa",
  marginBottom: 12,
};

function Card({ title, children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "white", marginBottom: 10 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
      <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
        (Retape sur le même choix pour l’enlever)
      </div>
    </div>
  );
}

function PickButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: active ? "2px solid black" : "1px solid #ddd",
        background: active ? "#f4f4f4" : "white",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 900 }}>{label}</span>
      </span>
      <span style={{ color: "#666", fontSize: 12 }}>{active ? "Sélectionné" : ""}</span>
    </button>
  );
}

function Stat({ icon, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 70 }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}

/* =======================
   App: state + routes + GPS
======================= */
export default function App() {
  const [userPosition, setUserPosition] = React.useState(null); // {lat,lng,accuracy}
  const [gpsError, setGpsError] = React.useState(null);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS non supporté");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setGpsError(err?.message || "GPS refusé");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const [reports, setReports] = React.useState(() => {
    const saved = localStorage.getItem("gwada_reports_v1");
    const fallback = mockReports;

    if (saved) {
      try {
        return normalizeReports(JSON.parse(saved));
      } catch {
        return normalizeReports(fallback);
      }
    }
    return normalizeReports(fallback);
  });

  React.useEffect(() => {
    localStorage.setItem("gwada_reports_v1", JSON.stringify(reports));
  }, [reports]);

  function addReports(newReports) {
    setReports((prev) => [...prev, ...newReports]);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapScreen userPosition={userPosition} gpsError={gpsError} reports={reports} />} />
        <Route
  path="/beach/:beachId"
  element={<BeachScreen reports={reports} addReports={addReports} />} />
        <Route
          path="/beach/:beachId/report"
          element={<ReportScreen addReports={addReports} userPosition={userPosition} gpsError={gpsError} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

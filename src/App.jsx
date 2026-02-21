// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { beaches } from "./data/beaches.js";
import { mockReports } from "./data/mockReports.js";
import MapScreen from "./screens/MapScreen.jsx";
import BeachScreen from "./screens/BeachScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";

import { normalizeReports } from "./utils/reports.js";

/* ============================================================
   Composant Principal : App
   Gère le GPS, l'état des rapports et la navigation
   ============================================================ */
export default function App() {
    const [userPosition, setUserPosition] = React.useState(null); // {lat, lng, accuracy}
    const [gpsError, setGpsError] = React.useState(null);

    // --- LOGIQUE GPS ---
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

    // --- LOGIQUE RAPPORTS (LocalStorage) ---
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

    // Fonction pour ajouter un nouveau signalement
    function addReports(newReports) {
        setReports((prev) => [...prev, ...newReports]);
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Écran Carte */}
                <Route
                    path="/"
                    element={<MapScreen userPosition={userPosition} gpsError={gpsError} reports={reports} />}
                />

                {/* Écran Détail Plage (CORRIGÉ : Ajout de userPosition) */}
                <Route
                    path="/beach/:beachId"
                    element={
                        <BeachScreen
                            reports={reports}
                            addReports={addReports}
                            userPosition={userPosition}
                        />
                    }
                />

                {/* Écran Formulaire de signalement */}
                <Route
                    path="/beach/:beachId/report"
                    element={
                        <ReportScreen
                            addReports={addReports}
                            userPosition={userPosition}
                            gpsError={gpsError}
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
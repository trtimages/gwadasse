// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapScreen from "./screens/MapScreen.jsx";
import BeachScreen from "./screens/BeachScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";

// IMPORTS FIREBASE
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

import { normalizeReports } from "./utils/reports.js";

// IMPORT TRADUCTION
import { LanguageProvider } from "./i18n/LanguageContext";

export default function App() {
    const [userPosition, setUserPosition] = useState(null);
    const [gpsError, setGpsError] = useState(null);
    const [reports, setReports] = useState([]); 

    // --- 1. LOGIQUE GPS (Le retour du temps réel fluide !) ---
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError("GPS non supporté");
            return;
        }

        // watchPosition suit l'utilisateur intelligemment
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setGpsError(null);
            },
            (err) => {
                setGpsError(err?.message || "GPS refusé");
            },
            { 
                enableHighAccuracy: true,
                timeout: 15000, 
                maximumAge: 0 
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // --- 2. LOGIQUE FIREBASE (Lecture 24h optimisée et sécurisée financièrement) ---
    useEffect(() => {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        const q = query(
            collection(db, "reports"),
            where("ts", ">", twentyFourHoursAgo)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firebaseReports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Tri local en JS pour éviter les erreurs d'Index Firebase
            const sortedReports = firebaseReports.sort((a, b) => b.ts - a.ts);
            
            setReports(normalizeReports(sortedReports));
        }, (error) => {
            console.error("Erreur d'écoute Firebase:", error);
        });

        return () => unsubscribe();
    }, []);

    // --- 3. FONCTION D'AJOUT (Écriture Firebase) ---
    const addReports = async (newReports) => {
        try {
            for (const report of newReports) {
                await addDoc(collection(db, "reports"), {
                    ...report,
                    ts: Date.now(),
                    serverDate: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Erreur Firebase:", e);
            alert("Erreur de connexion à la base de données.");
        }
    };

    return (
        <LanguageProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<MapScreen userPosition={userPosition} gpsError={gpsError} reports={reports} />}
                    />

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
        </LanguageProvider>
    );
}
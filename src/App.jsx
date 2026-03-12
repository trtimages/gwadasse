import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapScreen from "./screens/MapScreen.jsx";
import BeachScreen from "./screens/BeachScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx"; // NOUVEAU

// IMPORTS FIREBASE
import { db, auth } from "./firebase"; // Modifié
import { collection, addDoc, onSnapshot, query, where, doc, setDoc, updateDoc, increment, getDoc } from "firebase/firestore"; // Modifié
import { onAuthStateChanged } from "firebase/auth"; // NOUVEAU

import { normalizeReports } from "./utils/reports.js";
import { LanguageProvider } from "./i18n/LanguageContext";

export default function App() {
    const [userPosition, setUserPosition] = useState(null);
    const [gpsError, setGpsError] = useState(null);
    const [reports, setReports] = useState([]); 
    
    // --- NOUVEAU : ÉTAT UTILISATEUR & PROFIL ---
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // --- 0. LOGIQUE D'AUTHENTIFICATION & XP ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Va chercher ou crée le profil du joueur dans la collection "users"
                const userRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(userRef);
                
                if (!docSnap.exists()) {
                    const newProfile = {
                        displayName: currentUser.displayName || "Explorateur Anonyme",
                        photoURL: currentUser.photoURL || "",
                        xp: 0,
                        reportsCount: 0,
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userRef, newProfile);
                }
                
                // Écoute les changements d'XP en temps réel
                onSnapshot(userRef, (doc) => {
                    if (doc.exists()) setUserProfile(doc.data());
                });
            } else {
                setUserProfile(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // --- 1. LOGIQUE GPS ---
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError("GPS non supporté");
            return;
        }
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
                setGpsError(null);
            },
            (err) => setGpsError(err?.message || "GPS refusé"),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // --- 2. LOGIQUE FIREBASE (Lecture) ---
    useEffect(() => {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const q = query(collection(db, "reports"), where("ts", ">", twentyFourHoursAgo));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firebaseReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sortedReports = firebaseReports.sort((a, b) => b.ts - a.ts);
            setReports(normalizeReports(sortedReports));
        }, (error) => console.error("Erreur Firebase:", error));

        return () => unsubscribe();
    }, []);

    // --- 3. FONCTION D'AJOUT (+ DISTRIBUTION DES POINTS) ---
    const addReports = async (newReports) => {
        try {
            for (const report of newReports) {
                await addDoc(collection(db, "reports"), {
                    ...report,
                    userId: user ? user.uid : "anonymous",
                    ts: Date.now(),
                    serverDate: new Date().toISOString()
                });
            }
            
            // GAMIFICATION : +15 XP par signalement si l'utilisateur est connecté !
            if (user) {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    xp: increment(15 * newReports.length),
                    reportsCount: increment(newReports.length)
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
                    <Route path="/" element={<MapScreen userPosition={userPosition} gpsError={gpsError} reports={reports} />} />
                    <Route path="/beach/:beachId" element={<BeachScreen reports={reports} addReports={addReports} userPosition={userPosition} />} />
                    <Route path="/beach/:beachId/report" element={<ReportScreen addReports={addReports} userPosition={userPosition} gpsError={gpsError} />} />
                    
                    {/* NOUVELLE ROUTE POUR LE PROFIL */}
                    <Route path="/profile" element={<ProfileScreen user={user} userProfile={userProfile} />} />
                </Routes>
            </BrowserRouter>
        </LanguageProvider>
    );
}
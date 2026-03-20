// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapScreen from "./screens/MapScreen.jsx";
import BeachScreen from "./screens/BeachScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import FavoritesScreen from "./screens/FavoritesScreen.jsx";
import LeaderboardScreen from "./screens/LeaderboardScreen.jsx"; 

// IMPORTS FIREBASE BDD & AUTH
import { db, auth, storage } from "./firebase"; 
import { collection, addDoc, onSnapshot, query, where, doc, setDoc, updateDoc, increment, getDoc } from "firebase/firestore"; 
import { onAuthStateChanged } from "firebase/auth"; 
// IMPORTS FIREBASE STORAGE POUR LES IMAGES
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { normalizeReports } from "./utils/reports.js";
import { LanguageProvider } from "./i18n/LanguageContext";

export default function App() {
    const [userPosition, setUserPosition] = useState(null);
    const [gpsError, setGpsError] = useState(null);
    const [reports, setReports] = useState([]); 
    
    // --- ÉTAT UTILISATEUR & PROFIL ---
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // --- 0. LOGIQUE D'AUTHENTIFICATION & XP ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(userRef);
                
                if (!docSnap.exists()) {
                    const newProfile = {
                        displayName: currentUser.displayName || "Explorateur Anonyme",
                        photoURL: currentUser.photoURL || "",
                        xp: 0,
                        reportsCount: 0,
                        createdAt: new Date().toISOString(),
                        favorites: [] 
                    };
                    await setDoc(userRef, newProfile);
                }
                
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

    // --- 2. LOGIQUE FIREBASE (Lecture des signalements) ---
    useEffect(() => {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const q = query(collection(db, "reports"), where("ts", ">", twentyFourHoursAgo));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firebaseReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sortedReports = firebaseReports.sort((a, b) => b.ts - a.ts);
            setReports(normalizeReports(sortedReports));
        }, (error) => console.error("Erreur Firebase (Lecture Reports):", error));

        return () => unsubscribe();
    }, []);

    // --- 3. FONCTION D'AJOUT (+ DISTRIBUTION DES POINTS ET GESTION IMAGE) ---
    const addReports = async (newReports) => {
        try {
            for (let report of newReports) {
                let imageUrl = null;

                // --- GESTION DE L'IMAGE ---
                if (report.imageFile) {
                    try {
                        console.log("Image détectée, début de l'upload...");
                        const uniqueFileName = `${Date.now()}_${user ? user.uid : "anonymous"}_${report.imageFile.name}`;
                        const storageRef = ref(storage, `reports_images/${uniqueFileName}`);
                        
                        const uploadResult = await uploadBytes(storageRef, report.imageFile);
                        console.log("Upload réussi !");
                        
                        imageUrl = await getDownloadURL(uploadResult.ref);
                        console.log("URL de l'image :", imageUrl);
                    } catch (uploadError) {
                        console.error("Erreur lors de l'upload de l'image:", uploadError);
                        alert("Le signalement va être envoyé, mais l'image n'a pas pu être téléchargée.");
                    }
                }

                // --- PRÉPARATION DES DONNÉES FINALES ---
                const finalReportData = {
                    beachId: report.beachId,
                    type: report.type,
                    level: report.level,
                    ts: Date.now(), 
                    serverDate: new Date().toISOString(),
                    userId: user ? user.uid : "anonymous",
                };

                if (report.comment && report.comment.trim() !== "") {
                    finalReportData.comment = report.comment.trim();
                }
                
                if (imageUrl) {
                    finalReportData.imageUrl = imageUrl;
                }

                // --- ENREGISTREMENT DANS FIRESTORE ---
                console.log("Enregistrement du signalement dans la BDD...", finalReportData);
                await addDoc(collection(db, "reports"), finalReportData);
            }
            
            // GAMIFICATION
            if (user) {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    xp: increment(15 * newReports.length),
                    reportsCount: increment(newReports.length)
                });
            }
            console.log("Signalements envoyés avec succès !");
        } catch (e) {
            console.error("Erreur Firebase (Écriture Report):", e);
            alert("Erreur de connexion à la base de données lors de l'envoi du signalement.");
        }
    };

    return (
        <LanguageProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MapScreen userPosition={userPosition} gpsError={gpsError} reports={reports} userProfile={userProfile} />} />
                    
                    <Route path="/beach/:beachId" element={
                        <BeachScreen 
                            reports={reports} 
                            addReports={addReports} 
                            userPosition={userPosition} 
                            user={user} 
                            userProfile={userProfile} 
                        />
                    } />
                    
                    <Route path="/beach/:beachId/report" element={
                        <ReportScreen 
                            reports={reports} 
                            addReports={addReports} 
                            userPosition={userPosition} 
                            gpsError={gpsError}
                            user={user} 
                            userProfile={userProfile} 
                        />
                    } />
                    
                    <Route path="/profile" element={<ProfileScreen user={user} userProfile={userProfile} />} />

                    <Route path="/favorites" element={<FavoritesScreen userProfile={userProfile} reports={reports} />} />

                    <Route path="/leaderboard" element={<LeaderboardScreen currentUser={user} />} />
                </Routes>
            </BrowserRouter>
        </LanguageProvider>
    );
}
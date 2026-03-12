// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCoYeoSAHHIfGoQ2r8BpX_F8KOloS6QjqI",
  authDomain: "gwadasse.firebaseapp.com",
  projectId: "gwadasse",
  storageBucket: "gwadasse.firebasestorage.app",
  messagingSenderId: "592493147805",
  appId: "1:592493147805:web:2edd9c9179900fa236c674"
};

const app = initializeApp(firebaseConfig);

// Export de la base de données
export const db = getFirestore(app);

// Export de l'authentification et du fournisseur Google
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
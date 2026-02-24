// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoYeoSAHHIfGoQ2r8BpX_F8KOloS6QjqI",
  authDomain: "gwadasse.firebaseapp.com",
  projectId: "gwadasse",
  storageBucket: "gwadasse.firebasestorage.app",
  messagingSenderId: "592493147805",
  appId: "1:592493147805:web:2edd9c9179900fa236c674"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
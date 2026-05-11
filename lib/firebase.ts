import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxgCiIJ9gQP8aqW2qMhiVp7B7t8InGFKM",
  authDomain: "trabalho-calorias.firebaseapp.com",
  projectId: "trabalho-calorias",
  storageBucket: "trabalho-calorias.firebasestorage.app",
  messagingSenderId: "118665526476",
  appId: "1:118665526476:web:73e28bdd2d29b9c70ed669"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
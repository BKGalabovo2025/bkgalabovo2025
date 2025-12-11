
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtSQyDPUolZDDgtpwvUH02UZU2wynq1cQ",
  authDomain: "bkgalabovo2025.firebaseapp.com",
  projectId: "bkgalabovo2025",
  storageBucket: "bkgalabovo2025.appspot.com", // Corrected to a more standard format
  messagingSenderId: "580356814576",
  appId: "1:580356814576:web:7bf7d6847f6a8d9431b435",
  measurementId: "G-ZZ52PG2NMX"
};


// Инициализация на Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };

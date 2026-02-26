// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASTIKAN GANTI BAGIAN INI DENGAN MILIKMU DARI FIREBASE CONSOLE!
const firebaseConfig = {
  apiKey: "AIzaSyDmQAZ4zuDymr2QZiUsK9jaryVYrlnSlxQ",
  authDomain: "gdrive-multi-account.firebaseapp.com",
  projectId: "gdrive-multi-account",
  storageBucket: "gdrive-multi-account.firebasestorage.app",
  messagingSenderId: "116146836681",
  appId: "1:116146836681:web:1e0ec351c988556afca918"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
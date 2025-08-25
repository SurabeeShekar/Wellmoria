// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7xUZd3CwxA0lgTfERXf92oRO85R2S_FE",
  authDomain: "wellmoria-f1bec.firebaseapp.com",
  databaseURL: "https://wellmoria-f1bec-default-rtdb.firebaseio.com",
  projectId: "wellmoria-f1bec",
  storageBucket: "wellmoria-f1bec.firebasestorage.app",
  messagingSenderId: "732058847132",
  appId: "1:732058847132:web:be2f0fe3f26247d5116a59",
  measurementId: "G-K1NY04TZ0M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const database = getDatabase(app);

export { app };
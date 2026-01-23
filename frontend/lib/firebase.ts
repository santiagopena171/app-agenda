import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCK3NlwF2QX2bmuyQ8GMISK4He51QN5TyA",
  authDomain: "agenda-bc373.firebaseapp.com",
  projectId: "agenda-bc373",
  storageBucket: "agenda-bc373.firebasestorage.app",
  messagingSenderId: "580986689231",
  appId: "1:580986689231:web:b85b4bec16763304cc89ba",
  measurementId: "G-QTMZY8MGDV"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };

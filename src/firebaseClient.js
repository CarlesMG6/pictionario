// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2RXpV38i3SwqYRu4OliIwbslOThpoN40",
  authDomain: "pictionario-999d1.firebaseapp.com",
  projectId: "pictionario-999d1",
  storageBucket: "pictionario-999d1.firebasestorage.app",
  messagingSenderId: "420375737002",
  appId: "1:420375737002:web:870ec1aeaf891da7a316d3",
  measurementId: "G-L7FLF8DSMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);
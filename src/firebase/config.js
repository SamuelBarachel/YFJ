// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAN8IM1Cpxozw7QJNcN1uQpRfRzXiY6o5s",
  authDomain: "youthforjesusna.firebaseapp.com",
  projectId: "youthforjesusna",
  storageBucket: "youthforjesusna.firebasestorage.app",
  messagingSenderId: "162612207922",
  appId: "1:162612207922:web:46697ec9e917eb09f8372b",
  measurementId: "G-6CCS8XHGBL"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
// CRITICAL: Ensure 'export' is added here
export const auth = getAuth(app);
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEnB1Pk-isP_BOuCe9T1_Wwwyok_-ESt4",
  authDomain: "vueltadeinstalacion.firebaseapp.com",
  projectId: "vueltadeinstalacion",
  storageBucket: "vueltadeinstalacion.firebasestorage.app",
  messagingSenderId: "27572994236",
  appId: "1:27572994236:web:02dd631a48e517531990b9",
  measurementId: "G-ZN8WKEL9RM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwlw43Arx8_hQcOLzflcXEkpGt5A6yGmY",
  authDomain: "citizensync-5304f.firebaseapp.com",
  projectId: "citizensync-5304f",
  storageBucket: "citizensync-5304f.firebasestorage.app",
  messagingSenderId: "434864830189",
  appId: "1:434864830189:web:e430adcc6b535b1ca93ee4",
  measurementId: "G-5H4QHW1MD7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

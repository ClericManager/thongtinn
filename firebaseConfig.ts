import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: USER MUST FILL THIS IN
const firebaseConfig = {
  apiKey: "AIzaSyCmGjJgN0NLGttaDiacY8ne7IPEEDQH9xU",
  authDomain: "quanlyaos.firebaseapp.com",
  projectId: "quanlyaos",
  storageBucket: "quanlyaos.firebasestorage.app",
  messagingSenderId: "352755011248",
  appId: "1:352755011248:web:b45adecd6369fc3f527575"
};

// Helper to check if config is still default
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.apiKey !== "";

let db: any;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase not configured correctly. App will run but data won't sync.", error);
}

export { db };
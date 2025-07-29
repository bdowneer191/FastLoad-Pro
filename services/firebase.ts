import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Reads configuration from Vercel's Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: "YOUR_DATABASE_URL_HERE",
};

// Validate that all required environment variables are present.
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value) {
        // This will cause the build to fail if a variable is missing on Vercel
        throw new Error(`Firebase configuration error: Missing environment variable for key: "${key}". Please check your Vercel project settings.`);
    }
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export auth instances and methods
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };


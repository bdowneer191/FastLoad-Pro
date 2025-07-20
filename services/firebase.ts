import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that all required environment variables are present.
// This provides a much clearer error message if the root cause is missing env vars.
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value) {
        throw new Error(`Firebase configuration error: Missing environment variable for key: "${key}". Please ensure all VITE_FIREBASE_* variables are set correctly in your environment.`);
    }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instances
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();

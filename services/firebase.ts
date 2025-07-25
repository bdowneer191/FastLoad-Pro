import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCp9bpLPBW1n6WI6x7n5obQPcKPfZIqQqg",
  authDomain: "fastloadpro.firebaseapp.com",
  projectId: "fastloadpro",
  storageBucket: "fastloadpro.appspot.com",
  messagingSenderId: "1051238395821",
  appId: "1:1051238395821:web:6737342dcc9725ae527b24"
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
export const db = getFirestore(app);

// Export auth instances
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };

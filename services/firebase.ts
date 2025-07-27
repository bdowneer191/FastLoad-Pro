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

// Validate that all required configuration values are present.
// This provides a much clearer error message if something is missing.
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value) {
        throw new Error(`Firebase configuration error: Missing configuration value for key: "${key}".`);
    }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export auth instances and methods
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };

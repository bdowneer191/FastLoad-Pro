import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, githubProvider } from '../services/firebase.ts';
import Icon from './Icon.tsx';

const Login = () => {
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (error) {
            console.error("Authentication Error:", error);
            alert("Could not sign you in. Please check the console for details and ensure popups are enabled for this site.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
            <div className="max-w-md w-full">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-start to-brand-accent-end animate-glow mb-4">
                    FastLoad Pro
                </h1>
                <p className="text-lg text-brand-text-secondary mb-8">
                    Sign in to access your personalized performance dashboard.
                </p>
                <button
                    onClick={handleLogin}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-3 px-6 bg-white text-black rounded-lg font-semibold transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-white"
                >
                    <Icon name="github" className="w-6 h-6" />
                    Sign in with GitHub
                </button>
            </div>
        </div>
    );
};

export default Login;
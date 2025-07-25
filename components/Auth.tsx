import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, githubProvider } from '../services/firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Icon from './Icon';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async () => {
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                const user = userCredential.user;
                const db = getFirestore();
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    freeTrialUsage: 0,
                });
                setError('A verification email has been sent to your email address. Please verify your email before logging in.');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGitHubSignIn = async () => {
        setError('');
        try {
            await signInWithPopup(auth, githubProvider);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
            <div className="max-w-md w-full p-8 bg-brand-surface rounded-lg shadow-lg">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-start to-brand-accent-end animate-glow mb-4">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-lg text-brand-text-secondary mb-8">
                    {isLogin ? 'Sign in to access your dashboard' : 'Sign up to get started'}
                </p>

                <div className="space-y-4 mb-6">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full p-3 pl-4 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent-start focus:border-brand-accent-start focus:outline-none text-sm font-mono transition-colors"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-3 pl-4 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent-start focus:border-brand-accent-start focus:outline-none text-sm font-mono transition-colors"
                    />
                </div>

                {error && <p className="mb-4 text-sm text-brand-danger">{error}</p>}

                <button
                    onClick={handleAuthAction}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-brand-accent-start to-brand-accent-end text-white rounded-lg font-semibold transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-brand-accent-start mb-4"
                >
                    {isLogin ? 'Sign In' : 'Sign Up'}
                </button>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-brand-border"></div>
                    <span className="flex-shrink mx-4 text-brand-text-secondary">Or continue with</span>
                    <div className="flex-grow border-t border-brand-border"></div>
                </div>

                <button
                    onClick={handleGitHubSignIn}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-3 px-6 bg-gray-800 text-white rounded-lg font-semibold transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-gray-800"
                >
                    <Icon name="github" className="w-6 h-6" />
                    Sign in with GitHub
                </button>

                <p className="mt-8 text-sm text-brand-text-secondary">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-brand-accent-start hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;

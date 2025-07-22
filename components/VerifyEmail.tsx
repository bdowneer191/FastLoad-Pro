import React, { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase';

const VerifyEmail = () => {
    const [message, setMessage] = useState('');

    const handleResendVerification = async () => {
        setMessage('');
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setMessage('A new verification email has been sent to your email address.');
            }
        } catch (err: any) {
            setMessage(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
            <div className="max-w-md w-full p-8 bg-brand-surface rounded-lg shadow-lg">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-start to-brand-accent-end animate-glow mb-4">
                    Verify Your Email
                </h1>
                <p className="text-lg text-brand-text-secondary mb-8">
                    A verification email has been sent to your email address. Please check your inbox and click the link to verify your account.
                </p>

                {message && <p className="mb-4 text-sm text-brand-danger">{message}</p>}

                <button
                    onClick={handleResendVerification}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-brand-accent-start to-brand-accent-end text-white rounded-lg font-semibold transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background focus:ring-brand-accent-start mb-4"
                >
                    Resend Verification Email
                </button>
            </div>
        </div>
    );
};

export default VerifyEmail;

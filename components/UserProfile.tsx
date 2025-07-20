import React from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.ts';

interface UserProfileProps {
    user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    if (!user) return null;

    return (
        <div className="flex items-center gap-3">
            <img
                src={user.photoURL || undefined}
                alt={user.displayName || 'User Avatar'}
                className="w-10 h-10 rounded-full border-2 border-brand-border"
            />
            <div className="text-right">
                <p className="font-semibold text-sm text-brand-text-primary">{user.displayName}</p>
                <button
                    onClick={() => signOut(auth)}
                    className="text-xs text-brand-text-secondary hover:text-brand-accent-start transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
import React, { useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.ts';
import UserSettingsModal from './UserSettingsModal.tsx';

interface UserProfileProps {
    user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <img
                    src={user.photoURL || undefined}
                    alt={user.displayName || 'User Avatar'}
                    className="w-10 h-10 rounded-full border-2 border-brand-border"
                />
                <div className="text-right">
                    <p className="font-semibold text-sm text-brand-text-primary">{user.displayName}</p>
                </div>
            </div>
            <UserSettingsModal user={user} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default UserProfile;
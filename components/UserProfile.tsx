import { User } from 'firebase/auth';
import { useState } from 'react';
import Icon from './Icon';
import UserSettingsModal from './UserSettingsModal';

interface UserProfileProps {
    user: User;
    userData: { freeTrialUsage?: number };
    onOpenSettings: () => void;
    onLogout: () => void;
}

const UserProfile = ({ user, onLogout }: UserProfileProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    return (
        <>
            <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-brand-surface transition-colors">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} alt="User" className="w-8 h-8 rounded-full" />
                    <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-brand-surface rounded-lg shadow-lg py-1 z-50">
                        <button onClick={() => { setIsSettingsModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-background">Settings</button>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-background">Logout</button>
                    </div>
                )}
            </div>
            <UserSettingsModal user={user} isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
        </>
    );
};

export default UserProfile;

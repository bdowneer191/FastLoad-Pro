import { User } from 'firebase/auth';
import { useUserData } from '../hooks/useUserData'; // Make sure the path is correct

interface UserProfileProps {
    user: User;
    onOpenSettings: () => void;
    onLogout: () => void;
}

const UserProfile = ({ user, onOpenSettings, onLogout }: UserProfileProps) => {
    const { userData, loading } = useUserData(user);

    if (!user) return null;

    const freeTrialsRemaining = 2 - (userData?.freeTrialUsage || 0);

    return (
        <>
<div className="flex items-center gap-3">
                <img
        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                    alt={user.displayName || 'User Avatar'}
        className="w-10 h-10 rounded-full border-2 border-brand-border cursor-pointer"
        onClick={onOpenSettings}
                />
                <div className="text-right">
                    <p className="font-semibold text-sm text-brand-text-primary">{user.displayName}</p>
                    {!loading && (
                        <p className="text-xs text-brand-text-secondary">
                            {freeTrialsRemaining > 0 ? `${freeTrialsRemaining} free trials left` : 'No free trials'}
                        </p>
                    )}
        <button onClick={onOpenSettings} className="text-xs text-blue-500">Upgrade</button>
        <button onClick={onLogout} className="text-xs text-red-500 ml-2">Logout</button>
                </div>
            </div>
        </>
    );
};

export default UserProfile;
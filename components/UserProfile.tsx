import { User } from 'firebase/auth';

interface UserProfileProps {
    user: User;
    onOpenSettings: () => void;
}

const UserProfile = ({ user, onOpenSettings }: UserProfileProps) => {
    if (!user) return null;

    return (
        <>
            <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenSettings}>
                <img
                    src={user.photoURL || undefined}
                    alt={user.displayName || 'User Avatar'}
                    className="w-10 h-10 rounded-full border-2 border-brand-border"
                />
                <div className="text-right">
                    <p className="font-semibold text-sm text-brand-text-primary">{user.displayName}</p>
                </div>
            </div>
        </>
    );
};

export default UserProfile;
import { User } from 'firebase/auth';
import { useUserData } from '../hooks/useUserData';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getSubscriptionPlan, getSubscriptionStatus } from '../utils/subscriptionHelpers';

interface UserProfileProps {
    user: User;
    onOpenSettings: () => void;
    onLogout: () => void;
}

const UserProfile = ({ user, onOpenSettings, onLogout }: UserProfileProps) => {
    const { userData, loading: userDataLoading } = useUserData(user);
    const { hasActiveSubscription, subscriptions } = useSubscription();

    if (!user) return null;

    const freeTrialsRemaining = 2 - (userData?.freeTrialUsage || 0);
    const activeSubscription = subscriptions.find(sub => getSubscriptionStatus(sub) === 'active');

    const handleManageSubscription = async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/create-portal-link', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ return_url: window.location.href }),
            });
            if (!response.ok) {
                throw new Error('Failed to create Stripe portal link.');
            }
            const { url } = await response.json();
            window.location.assign(url);
        } catch (error) {
            console.error('Error redirecting to Stripe portal:', error);
            alert('Could not redirect to subscription management.');
        }
    };

    return (
        <div className="flex items-center gap-3">
            <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                alt={user.displayName || 'User Avatar'}
                className="w-10 h-10 rounded-full border-2 border-brand-border cursor-pointer"
                onClick={onOpenSettings}
            />
            <div className="text-right">
                <p className="font-semibold text-sm text-brand-text-primary">{user.displayName}</p>
                {hasActiveSubscription && activeSubscription ? (
                    <div>
                        <p className="text-xs text-brand-text-secondary">
                            {getSubscriptionPlan(activeSubscription)} ({getSubscriptionStatus(activeSubscription)})
                        </p>
                        <p className="text-xs text-brand-text-secondary">
                            Next payment: {new Date(activeSubscription.current_period_end * 1000).toLocaleDateString()}
                        </p>
                        <button onClick={handleManageSubscription} className="text-xs text-blue-500">Manage</button>
                    </div>
                ) : (
                    <div>
                        {!userDataLoading && (
                            <p className="text-xs text-brand-text-secondary">
                                {freeTrialsRemaining > 0 ? `${freeTrialsRemaining} free trials left` : 'No free trials'}
                            </p>
                        )}
                        <button onClick={onOpenSettings} className="text-xs text-blue-500">Upgrade</button>
                    </div>
                )}
                <button onClick={onLogout} className="text-xs text-red-500 ml-2">Logout</button>
            </div>
        </div>
    );
};

export default UserProfile;

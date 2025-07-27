import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';
import { getUserSubscriptions } from '../services/stripePayments';

const SuccessPage = () => {
    const [user] = useAuthState(auth);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (user) {
                try {
                    const subscriptions = await getUserSubscriptions();
                    if (subscriptions.length > 0) {
                        setSubscription(subscriptions[0]);
                    }
                } catch (error) {
                    console.error('Error fetching subscription:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        // Wait a moment for Stripe webhook to process
        const timer = setTimeout(fetchSubscription, 2000);
        return () => clearTimeout(timer);
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
                <div className="max-w-md w-full p-8 bg-brand-surface rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent-start mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-brand-text-primary mb-2">
                        Processing Your Subscription
                    </h1>
                    <p className="text-brand-text-secondary">
                        Please wait while we confirm your payment...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
            <div className="max-w-md w-full p-8 bg-brand-surface rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-brand-text-primary mb-4">
                    Welcome to Premium!
                </h1>

                <p className="text-brand-text-secondary mb-6">
                    Your subscription has been activated successfully. You now have access to all premium features.
                </p>

                {subscription && (
                    <div className="bg-brand-background rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-brand-text-primary mb-2">Subscription Details</h3>
                        <p className="text-sm text-brand-text-secondary">
                            Plan: {subscription.items?.[0]?.price?.nickname || 'Premium Plan'}
                        </p>
                        <p className="text-sm text-brand-text-secondary">
                            Status: {subscription.status}
                        </p>
                    </div>
                )}

                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-6 py-3 bg-brand-accent-start text-white rounded-lg font-semibold hover:bg-brand-accent-end transition-colors"
                >
                    Start Using Premium Features
                </button>
            </div>
        </div>
    );
};

export default SuccessPage;

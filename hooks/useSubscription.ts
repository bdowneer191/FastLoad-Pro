import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserSubscriptions, subscribeToSubscriptionUpdates } from '../services/stripePayments';
import { canAccessPremiumFeatures } from '../utils/subscriptionHelpers';

export const useSubscription = (user: User | null) => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setHasActiveSubscription(false);
      setLoading(false);
      setError(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initializeSubscriptions = async () => {
      try {
        setError(null);

        // Get initial subscriptions
        const initialSubscriptions = await getUserSubscriptions();
        setSubscriptions(initialSubscriptions);

        const hasActive = initialSubscriptions.some(sub => canAccessPremiumFeatures(sub));
        setHasActiveSubscription(hasActive);

        // Subscribe to real-time updates
        unsubscribe = subscribeToSubscriptionUpdates((updatedSubscriptions) => {
          setSubscriptions(updatedSubscriptions);
          const hasActiveUpdated = updatedSubscriptions.some(sub => canAccessPremiumFeatures(sub));
          setHasActiveSubscription(hasActiveUpdated);
        });
      } catch (error: any) {
        console.error("Error initializing subscriptions:", error);
        setError(error.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    initializeSubscriptions();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return {
    subscriptions,
    hasActiveSubscription,
    loading,
    error,
    canAccessPremium: hasActiveSubscription
  };
};

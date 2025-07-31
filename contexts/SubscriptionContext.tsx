import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserSubscriptions, subscribeToSubscriptionUpdates } from '../services/stripePayments';
import { canAccessPremiumFeatures } from '../utils/subscriptionHelpers';

interface SubscriptionContextType {
  user: User | null;
  subscriptions: any[];
  hasActiveSubscription: boolean;
  stripeRole: string | null;
  loading: boolean;
  error: string | null;
  canAccessPremium: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [stripeRole, setStripeRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setHasActiveSubscription(false);
      setStripeRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    let unsubscribeFromUpdates: (() => void) | null = null;

    const initialize = async () => {
      try {
        setError(null);

        // Get initial subscriptions
        const initialSubscriptions = await getUserSubscriptions();
        setSubscriptions(initialSubscriptions);
        const hasActive = initialSubscriptions.some(sub => canAccessPremiumFeatures(sub));
        setHasActiveSubscription(hasActive);

        // Get stripe role
        await user.getIdToken(true);
        const decodedToken = await user.getIdTokenResult();
        setStripeRole(decodedToken?.claims.stripeRole as string || null);

        // Subscribe to real-time updates
        unsubscribeFromUpdates = subscribeToSubscriptionUpdates((updatedSubscriptions) => {
          setSubscriptions(updatedSubscriptions);
          const hasActiveUpdated = updatedSubscriptions.some(sub => canAccessPremiumFeatures(sub));
          setHasActiveSubscription(hasActiveUpdated);
        });
      } catch (err: any) {
        console.error("Error initializing subscriptions:", err);
        setError(err.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (unsubscribeFromUpdates) {
        unsubscribeFromUpdates();
      }
    };
  }, [user]);

  const value = {
    user,
    subscriptions,
    hasActiveSubscription,
    stripeRole,
    loading,
    error,
    canAccessPremium: hasActiveSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

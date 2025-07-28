import { useState, useEffect } from 'react';
import { User, getAuth } from 'firebase/auth';

export const useAuth = (user: User | null) => {
  const [stripeRole, setStripeRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStripeRole(null);
      setLoading(false);
      return;
    }

    const getRole = async () => {
      setLoading(true);
      const auth = getAuth();
      await auth.currentUser?.getIdToken(true);
      const decodedToken = await auth.currentUser?.getIdTokenResult();
      setStripeRole(decodedToken?.claims.stripeRole as string || null);
      setLoading(false);
    };

    getRole();
  }, [user]);

  return { stripeRole, loading };
};

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../services/firebase-admin';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!auth || !db) {
    return res.status(500).json({ error: 'Firebase admin not initialized' });
  }

  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    const customerDoc = await db.collection('customers').doc(uid).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customerData = customerDoc.data();
    const stripeId = customerData?.stripeId;

    if (!stripeId) {
      return res.status(404).json({ error: 'Stripe customer ID not found' });
    }

    const { return_url } = req.body;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeId,
      return_url: return_url || `${req.headers.origin}`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating Stripe portal link:', error);
    return res.status(500).json({ error: error.message });
  }
}

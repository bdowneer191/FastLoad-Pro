import { fetchPageSpeedReport } from '../services/pageSpeedService';
import { generateOptimizationPlan } from '../services/geminiService';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';

export async function POST(request: Request): Promise<Response> {
  const { urlToScan } = await request.json();
  const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
  const geminiApiKey = process.env.DEFAULT_GEMINI_API_KEY;

  if (!pageSpeedApiKey || !geminiApiKey) {
    return new Response('Default API keys are not configured.', { status: 500 });
  }

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const db = getFirestore();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const freeTrialUsage = userData?.freeTrialUsage || 0;

    if (freeTrialUsage >= 2) {
      return new Response('Free trial limit exceeded.', { status: 403 });
    }

    const pageSpeedReport = await fetchPageSpeedReport(pageSpeedApiKey, urlToScan);
    const optimizationPlan = await generateOptimizationPlan(geminiApiKey, pageSpeedReport);

    await setDoc(userDocRef, { freeTrialUsage: freeTrialUsage + 1 }, { merge: true });

    return new Response(JSON.stringify({ pageSpeedReport, optimizationPlan }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

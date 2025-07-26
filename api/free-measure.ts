import * as admin from 'firebase-admin';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { generateOptimizationPlan } from '../services/geminiService';
import { fetchPageSpeedReport } from '../services/pageSpeedService';

// Initialize Firebase Admin if not already initialized
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const auth = admin.auth();

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== Free Measure API Called ===');

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { urlToScan } = requestBody;

    if (!urlToScan) {
      return new Response(JSON.stringify({ error: 'URL to scan is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check environment variables
    const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
    const geminiApiKey = process.env.DEFAULT_GEMINI_API_KEY;

    console.log('Environment check:', {
      hasPageSpeedKey: !!pageSpeedApiKey,
      hasGeminiKey: !!geminiApiKey,
      hasFirebaseConfig: !!process.env.FIREBASE_ADMIN_SDK_CONFIG
    });

    if (!pageSpeedApiKey || !geminiApiKey) {
      console.error('Missing API keys:', { pageSpeedApiKey: !!pageSpeedApiKey, geminiApiKey: !!geminiApiKey });
      return new Response(JSON.stringify({ error: 'Default API keys are not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split('Bearer ')[1];

    if (!idToken) {
      console.error('No authorization token provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = decodedToken.uid;

    // Check free trial usage
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const freeTrialUsage = userData?.freeTrialUsage || 0;

      console.log('User free trial usage:', freeTrialUsage);

      if (freeTrialUsage >= 2) {
        return new Response(JSON.stringify({ error: 'Free trial limit exceeded.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Fetch PageSpeed report
      console.log('Fetching PageSpeed report for:', urlToScan);
      const pageSpeedReport = await fetchPageSpeedReport(pageSpeedApiKey, urlToScan);
      console.log('PageSpeed report fetched successfully');

      // Generate optimization plan
      console.log('Generating optimization plan...');
      const optimizationPlan = await generateOptimizationPlan(geminiApiKey, pageSpeedReport);
      console.log('Optimization plan generated successfully');

      // Calculate scores
      const getScore = (report: any, strategy: any) => report?.[strategy]?.lighthouseResult?.categories?.performance?.score ?? 0;

      const session = {
        url: urlToScan,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        beforeScores: {
          mobile: getScore(pageSpeedReport, 'mobile'),
          desktop: getScore(pageSpeedReport, 'desktop'),
        },
        afterScores: {
          mobile: 0,
          desktop: 0,
        },
        userId: userId,
      };

      // Save session
      const sessionsCollectionRef = collection(db, 'sessions');
      await addDoc(sessionsCollectionRef, session);
      console.log('Session saved to Firestore');

      // Update user usage
      await setDoc(userDocRef, { freeTrialUsage: freeTrialUsage + 1 }, { merge: true });
      console.log('User usage updated');

      const responseData = { pageSpeedReport, optimizationPlan };

      return new Response(JSON.stringify(responseData), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

    } catch (firestoreError) {
      console.error('Firestore operation failed:', firestoreError);
      return new Response(JSON.stringify({ error: 'Database operation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Unhandled error in /api/free-measure:', error);
    console.error('Error stack:', error.stack);

    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

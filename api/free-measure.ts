import * as admin from 'firebase-admin';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { generateOptimizationPlan } from '../services/geminiService';
import { fetchPageSpeedReport } from '../services/pageSpeedService';

// Safely initialize Firebase Admin
try {
  if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    if (!serviceAccountString) {
      throw new Error("Firebase admin SDK config is not set in environment variables.");
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (e: any) {
  console.error("Failed to initialize Firebase Admin SDK:", e.message);
}

const auth = admin.apps.length ? admin.auth() : null;

export async function POST(request: Request): Promise<Response> {
  console.log('=== Free Measure API Endpoint Called ===');

  try {
    // 1. Check for Firebase initialization
    if (!auth) {
        console.error("Firebase Auth is not initialized. Check server logs for initialization errors.");
        return new Response(JSON.stringify({ error: 'Server configuration error: Firebase not initialized.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Request body parsed successfully.');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const { urlToScan } = requestBody;
    if (!urlToScan) {
      return new Response(JSON.stringify({ error: 'URL to scan is required.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log(`URL to scan: ${urlToScan}`);

    // 3. Verify Authentication Token
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split('Bearer ')[1];
    if (!idToken) {
      console.error('Authorization token not provided.');
      return new Response(JSON.stringify({ error: 'Unauthorized: No token provided.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(`Token verified for user UID: ${decodedToken.uid}`);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = decodedToken.uid;

    // 4. Check API Key Configuration
    const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
    const geminiApiKey = process.env.DEFAULT_GEMINI_API_KEY;
    if (!pageSpeedApiKey || !geminiApiKey) {
      console.error('One or more API keys are missing from environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error: API keys are not set.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('API keys are present.');

    // 5. Check Free Trial Usage in Firestore
    const db = getFirestore();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        console.log(`User document for UID ${userId} does not exist. Assuming 0 usage.`);
    }

    const userData = userDoc.data();
    const freeTrialUsage = userData?.freeTrialUsage || 0;
    console.log(`User free trial usage: ${freeTrialUsage}`);

    if (freeTrialUsage >= 2) {
      return new Response(JSON.stringify({ error: 'Free trial limit exceeded.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Execute Core Logic (API calls)
    console.log('Fetching PageSpeed report...');
    const pageSpeedReport = await fetchPageSpeedReport(pageSpeedApiKey, urlToScan);
    console.log('PageSpeed report fetched.');

    console.log('Generating optimization plan...');
    const optimizationPlan = await generateOptimizationPlan(geminiApiKey, pageSpeedReport);
    console.log('Optimization plan generated.');

    // 7. Save Session and Update User Data
    const getScore = (report, strategy) => report?.[strategy]?.lighthouseResult?.categories?.performance?.score ?? 0;
    const session = {
      url: urlToScan,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      beforeScores: {
        mobile: getScore(pageSpeedReport, 'mobile'),
        desktop: getScore(pageSpeedReport, 'desktop'),
      },
      userId: userId,
    };

    await addDoc(collection(db, 'sessions'), session);
    console.log('Session saved to Firestore.');

    await setDoc(userDocRef, { freeTrialUsage: freeTrialUsage + 1 }, { merge: true });
    console.log('User free trial usage updated.');

    // 8. Return Success Response
    return new Response(JSON.stringify({ pageSpeedReport, optimizationPlan }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('An unhandled error occurred in /api/free-measure:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected server error occurred.',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

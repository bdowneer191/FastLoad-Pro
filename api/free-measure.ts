import * as admin from 'firebase-admin';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { generateOptimizationPlan } from '../services/geminiService.js';
import { fetchPageSpeedReport } from '../services/pageSpeedService.js';

// Safely initialize Firebase Admin
let auth: admin.auth.Auth | null = null;

try {
  // Check if admin object and apps array exist
  if (!admin.apps || admin.apps.length === 0) {
    const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    if (!serviceAccountBase64) {
      throw new Error('The FIREBASE_ADMIN_SDK_CONFIG environment variable is not set.');
    }

    let serviceAccount;
    try {
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error('Failed to parse Firebase service account JSON:', parseError);
      throw new Error('Invalid Firebase service account configuration. Check the base64 encoding.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully');
  }

  // Set auth only after successful initialization
  auth = admin.auth();
} catch (e: any) {
  console.error("CRITICAL: Failed to initialize Firebase Admin SDK. Check the FIREBASE_ADMIN_SDK_CONFIG format.", e.message);
  // Don't set auth if initialization failed
  auth = null;
}

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== Free Measure API Endpoint Called ===');

    // 1. Check for Firebase initialization
    if (!auth) {
        console.error("API Error: Firebase Auth is not initialized. The server configuration is incorrect.");
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
      console.error('API Error: Failed to parse request body:', parseError);
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
      console.error('API Error: Authorization token not provided.');
      return new Response(JSON.stringify({ error: 'Unauthorized: No token provided.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(`Token verified for user UID: ${decodedToken.uid}`);
    } catch (authError) {
      console.error('API Error: Token verification failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = decodedToken.uid;

    // 4. Check API Key Configuration
    const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
    const geminiApiKey = process.env.DEFAULT_GEMINI_API_KEY;
    if (!pageSpeedApiKey || !geminiApiKey) {
      console.error('API Error: One or more API keys are missing from environment variables.');
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
    const getScore = (report: any, strategy: 'mobile' | 'desktop') => report?.[strategy]?.lighthouseResult?.categories?.performance?.score ?? 0;
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
    console.error('FATAL: An unhandled error occurred in the API function:', error);
    // Ensure that even in the case of a catastrophic error, a JSON response is returned.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({
      error: 'An unexpected server error occurred.',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

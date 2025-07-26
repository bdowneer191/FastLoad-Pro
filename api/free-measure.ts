import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../services/firebase-admin'; // IMPORT a single, initialized instance
import { generateOptimizationPlan } from '../../services/geminiService';
import { fetchPageSpeedReport } from '../../services/pageSpeedService';
import { doc, getDoc, setDoc, addDoc, collection, updateDoc, increment } from 'firebase/firestore';

// Helper function to extract the score from the report
const getScore = (report: any, strategy: 'mobile' | 'desktop'): number => {
  return report?.[strategy]?.lighthouseResult?.categories?.performance?.score ?? 0;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== Secure Measure API Endpoint Called ===');

  // 1. Verify Authentication Token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const idToken = authHeader?.split('Bearer ')[1];

  if (!idToken) {
    console.error('API Error: Authorization token not provided.');
    return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  let decodedToken;
  try {
    // The 'auth' instance is now reliably imported from firebase-admin.ts
    decodedToken = await auth.verifyIdToken(idToken);
    console.log(`Token verified for user UID: ${decodedToken.uid}`);
  } catch (authError) {
    console.error('API Error: Token verification failed:', authError);
    return NextResponse.json({ error: 'Invalid or expired authentication token.' }, { status: 401 });
  }

  const userId = decodedToken.uid;

  try {
    // 2. Parse request body
    const body = await request.json();
    const { urlToScan } = body;

    if (!urlToScan) {
      return NextResponse.json({ error: 'URL to scan is required.' }, { status: 400 });
    }
    console.log(`URL to scan: ${urlToScan}`);

    // 3. Check Free Trial Usage in Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    // Default to 0 if the document or field doesn't exist
    const freeTrialUsage = userDoc.exists() ? userDoc.data()?.freeTrialUsage || 0 : 0;
    console.log(`User free trial usage: ${freeTrialUsage}`);

    if (freeTrialUsage >= 2) {
      console.log(`Free trial limit exceeded for user: ${userId}`);
      return NextResponse.json({ error: 'Free trial limit exceeded.' }, { status: 403 });
    }
    
    // 4. Execute Core Logic (PageSpeed and Gemini API calls)
    // Note: API keys should be handled within these service functions
    // to keep this file clean.
    console.log('Fetching PageSpeed report...');
    const pageSpeedReport = await fetchPageSpeedReport(urlToScan);
    if (!pageSpeedReport) {
        return NextResponse.json({ error: 'Failed to fetch PageSpeed report' }, { status: 500 });
    }
    console.log('PageSpeed report fetched.');

    console.log('Generating optimization plan...');
    const optimizationPlan = await generateOptimizationPlan(pageSpeedReport);
    if (!optimizationPlan) {
        return NextResponse.json({ error: 'Failed to generate optimization plan' }, { status: 500 });
    }
    console.log('Optimization plan generated.');
    
    // 5. Save Session and Update User Data
    const sessionData = {
      url: urlToScan,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(), // Setting same as start, can be updated if needed
      beforeScores: {
        mobile: getScore(pageSpeedReport, 'mobile'),
        desktop: getScore(pageSpeedReport, 'desktop'),
      },
      userId: userId,
    };

    const sessionsCollectionRef = collection(db, 'sessions');
    await addDoc(sessionsCollectionRef, sessionData);
    console.log('Session saved to Firestore.');

    // Atomically update the user's free trial usage
    if (userDoc.exists()) {
        await updateDoc(userDocRef, { freeTrialUsage: increment(1) });
    } else {
        // If the user document doesn't exist, create it.
        await setDoc(userDocRef, { freeTrialUsage: 1, createdAt: new Date().toISOString() });
    }
    console.log('User free trial usage updated.');

    // 6. Return Success Response
    return NextResponse.json({ pageSpeedReport, optimizationPlan });

  } catch (error: any) {
    console.error('FATAL: An unhandled error occurred in the API function:', error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'An unexpected server error occurred.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

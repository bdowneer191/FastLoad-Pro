import { GoogleGenAI, Type } from "@google/genai";
import * as admin from 'firebase-admin';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase Admin if not already initialized
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const auth = admin.auth();

// PageSpeed Service Functions
const runPageSpeedForStrategy = async (apiKey: string, pageUrl: string, strategy: 'mobile' | 'desktop') => {
  if (!apiKey) {
      throw new Error("Google API Key has not been provided. Please add it in the configuration section.");
  }
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(pageUrl)}&key=${apiKey}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
      const errorData = await response.json();
      const message = errorData?.error?.message || `Failed to fetch PageSpeed data for ${strategy}. Status: ${response.status}. Please check your URL and API Key.`;
      throw new Error(message);
  }
  return response.json();
};

const fetchPageSpeedReport = async (apiKey: string, url: string) => {
    try {
        const [mobile, desktop] = await Promise.all([
            runPageSpeedForStrategy(apiKey, url, 'mobile'),
            runPageSpeedForStrategy(apiKey, url, 'desktop')
        ]);
        return { mobile, desktop };
    } catch (error) {
        console.error("Error fetching PageSpeed report:", error);
        throw error;
    }
};

// Gemini Service Functions
const generateOptimizationPlan = async (apiKey: string, pageSpeedReport: any) => {
  if (!apiKey) {
    return [{ title: 'Missing API Key', description: 'Please provide a Gemini API key to generate an AI optimization plan.', priority: 'High' }];
  }
  const ai = new GoogleGenAI({ apiKey });

  const relevantData = {
      categories: pageSpeedReport.mobile.lighthouseResult.categories,
      audits: pageSpeedReport.mobile.lighthouseResult.audits,
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a world-class web performance engineer specializing in WordPress and Core Web Vitals. Analyze this mobile PageSpeed Insights report. Create an extremely aggressive, high-impact, prioritized plan. Assume the user is willing to make significant changes for maximum speed. Focus on surgically eliminating render-blocking resources, optimizing the Critical Rendering Path, and crushing LCP, FID, and CLS scores. Be very specific (e.g., 'Use Perfmatters or a code snippet to disable these specific scripts on these pages,' 'Generate Critical CSS for your homepage and inline it, then load the main stylesheet asynchronously'). The goal is a perfect or near-perfect score. Provide a JSON array of objects with "title", "description", and "priority" ('High', 'Medium', 'Low'). Report: ${JSON.stringify(relevantData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ['title', 'description', 'priority']
            }
          }
        }
    });

    return JSON.parse(response.text.trim());

  } catch (error) {
    console.error("Error generating optimization plan:", error);
    return [{ title: 'Error', description: 'Failed to generate an AI optimization plan. The AI service may be temporarily unavailable or the API key is invalid.', priority: 'High' }];
  }
};

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

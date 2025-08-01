import { auth } from '../services/firebase-admin.js';
import { fetchPageSpeedReport } from '../services/pageSpeedService.js';

export async function POST(request: Request): Promise<Response> {
  try {
    if (!auth) {
        return new Response(JSON.stringify({ error: 'Server configuration error: Firebase not initialized.' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
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

    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split('Bearer ')[1];
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No token provided.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      await auth.verifyIdToken(idToken);
    } catch (authError) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
    if (!pageSpeedApiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: PageSpeed API key not set.' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const pageSpeedReport = await fetchPageSpeedReport(pageSpeedApiKey, urlToScan);

    return new Response(JSON.stringify({ pageSpeedReport }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
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

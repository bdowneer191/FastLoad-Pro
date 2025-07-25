import { fetchPageSpeedReport } from '../services/pageSpeedService';
import { generateOptimizationPlan } from '../services/geminiService';

export async function POST(request: Request): Promise<Response> {
  const { urlToScan } = await request.json();
  const pageSpeedApiKey = process.env.DEFAULT_PAGESPEED_API_KEY;
  const geminiApiKey = process.env.DEFAULT_GEMINI_API_KEY;

  if (!pageSpeedApiKey || !geminiApiKey) {
    return new Response('Default API keys are not configured.', { status: 500 });
  }

  try {
    const pageSpeedReport = await fetchPageSpeedReport(pageSpeedApiKey, urlToScan);
    const optimizationPlan = await generateOptimizationPlan(geminiApiKey, pageSpeedReport);

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

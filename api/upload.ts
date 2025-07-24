import { put } from '@vercel/blob';

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return new Response('Missing filename or body', { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return new Response(JSON.stringify(blob), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

import { put, list, del } from '@vercel/blob';

const emptyUserData = { geminiApiKey: '', pageSpeedApiKey: '' };

async function streamToString(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode(); // Flush the decoder
    return result;
}

export default async function handler(request: any) {
    const host = request.headers['x-forwarded-host'] || request.headers['host'];
    const proto = request.headers['x-forwarded-proto'] || 'http';
    const { searchParams } = new URL(request.url, `${proto}://${host}`);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ message: 'User ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is not configured.');
        return new Response(JSON.stringify({ message: 'Storage token is not configured.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const blobPath = `user-data/${userId}.json`;

    try {
        if (request.method === 'GET') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length === 0) {
                return new Response(JSON.stringify(emptyUserData), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            const response = await fetch(blobs[0].url);
            if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
            if (response.headers.get('content-length') === '0') {
                return new Response(JSON.stringify(emptyUserData), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            const blobContent = await response.json();
            return new Response(JSON.stringify(blobContent), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (request.method === 'POST') {
            if (!request.body) {
                return new Response(JSON.stringify({ message: 'Request body is empty.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            const body = await streamToString(request.body);
            const { geminiApiKey, pageSpeedApiKey } = JSON.parse(body);

            let existingData = { ...emptyUserData };
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                const response = await fetch(blobs[0].url);
                if (response.ok && response.headers.get('content-length') !== '0') {
                    try {
                        existingData = await response.json();
                    } catch (e) {
                        console.error(`Could not parse existing data for user ${userId}, starting fresh.`, e);
                    }
                }
            }

            const updatedData = {
                geminiApiKey: geminiApiKey !== undefined ? geminiApiKey : existingData.geminiApiKey,
                pageSpeedApiKey: pageSpeedApiKey !== undefined ? pageSpeedApiKey : existingData.pageSpeedApiKey,
            };

            await put(blobPath, JSON.stringify(updatedData), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return new Response(JSON.stringify({ success: true, message: 'API keys saved.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (request.method === 'DELETE') {
            await del(blobPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
            return new Response(JSON.stringify({ success: true, message: 'API keys deleted.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(`Method ${request.method} Not Allowed`, { status: 405 });
    } catch (error: any) {
        console.error('Error in /api/user-data:', error);
        return new Response(JSON.stringify({ message: 'An internal server error occurred.', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

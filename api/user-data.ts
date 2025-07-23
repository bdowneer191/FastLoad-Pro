import { put, list, del } from '@vercel/blob';

const emptyUserData = { geminiApiKey: '', pageSpeedApiKey: '' };

async function streamToString(stream: ReadableStream): Promise<string> {
    const chunks = [];
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(new Uint8Array(value));
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
}

export default async function handler(request: any) { // Changed to 'any' for simplicity with Vercel's request object
    // Correctly access headers using bracket notation
    const host = request.headers['host'];
    const proto = request.headers['x-forwarded-proto'] || 'http';

    // The rest of your logic remains the same
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
            try {
                const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });

                if (blobs.length === 0) {
                    return new Response(JSON.stringify(emptyUserData), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const response = await fetch(blobs[0].url);
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
                if (response.headers.get('content-length') === '0') {
                    return new Response(JSON.stringify(emptyUserData), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
                const blobContent = await response.json();
                return new Response(JSON.stringify(blobContent), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (e) {
                console.error(`Failed to read or parse user-data for user ${userId}:`, e);
                // If blob is corrupt or unreadable, return default data to not break the client.
                return new Response(JSON.stringify(emptyUserData), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (request.method === 'POST') {
            try {
                if (!request.body) {
                    return new Response(JSON.stringify({ message: 'Request body is empty.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                const body = await streamToString(request.body);
                const { geminiApiKey, pageSpeedApiKey } = JSON.parse(body);

                // Fetch existing data to perform a partial update
                let existingData = { ...emptyUserData };
                const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
                if (blobs.length > 0) {
                    const response = await fetch(blobs[0].url);
                    if (response.ok && response.headers.get('content-length') !== '0') {
                        try {
                            const blobContent = await response.json();
                            if (blobContent) {
                                existingData = blobContent;
                            }
                        } catch (e) {
                            console.error(`Could not parse existing user-data for user ${userId}, starting new data.`, e);
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
            } catch (e: any) {
                console.error(`Failed to save user-data for user ${userId}:`, e);
                return new Response(JSON.stringify({ message: 'An internal server error occurred.', error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (request.method === 'DELETE') {
            try {
                await del(blobPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
                return new Response(JSON.stringify({ success: true, message: 'API keys deleted.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (e: any) {
                console.error(`Failed to delete user-data for user ${userId}:`, e);
                return new Response(JSON.stringify({ message: 'An internal server error occurred.', error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }

        return new Response(`Method ${request.method} Not Allowed`, { status: 405 });
    } catch (error: any) {
        console.error('Error in /api/user-data:', error);
        return new Response(JSON.stringify({ message: 'An internal server error occurred.', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

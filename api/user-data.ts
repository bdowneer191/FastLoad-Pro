import { put, list, del } from '@vercel/blob';

const emptyUserData = { geminiApiKey: '', pageSpeedApiKey: '' };

export default async function handler(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ message: 'User ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN);
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
                const { geminiApiKey, pageSpeedApiKey } = await request.json();

                if (typeof geminiApiKey === 'undefined' || typeof pageSpeedApiKey === 'undefined') {
                     return new Response(JSON.stringify({ message: 'Both geminiApiKey and pageSpeedApiKey must be provided.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                await put(blobPath, JSON.stringify({ geminiApiKey, pageSpeedApiKey }), {
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

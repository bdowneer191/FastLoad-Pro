import { put, list, del } from '@vercel/blob';
import type { Session } from '../types';


export default async function handler(req: any) {
    const { method } = req;
    const host = req.headers['host'];
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const { searchParams } = new URL(req.url, `${proto}://${host}`);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ message: 'User ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return new Response(JSON.stringify({ message: 'Storage token is not configured.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
    
    const blobPath = `sessions/${userId}.json`;

    try {
        if (method === 'GET') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length === 0) {
                return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            
            try {
                const response = await fetch(blobs[0].url);
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
                if (response.headers.get('content-length') === '0') {
                     return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' }});
                }
                const data = await response.json();
                return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
            } catch (e) {
                console.error(`Failed to read or parse session data for user ${userId}:`, e);
                // If the blob is corrupt or unreadable, return an empty array to not break the client.
                return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
        }

        if (method === 'POST') {
            const newSession: Omit<Session, 'id'> = await req.json();
            
            let sessions: Session[] = [];
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                try {
                    const response = await fetch(blobs[0].url);
                    if (response.ok && response.headers.get('content-length') !== '0') {
                       const existingData = await response.json();
                       if (Array.isArray(existingData)) {
                          sessions = existingData;
                       }
                    }
                } catch (e) { 
                    console.error("Could not parse existing session data, starting new log.", e);
                }
            }
            
            const sessionWithId: Session = { ...newSession, id: new Date().toISOString() };
            const updatedSessions = [sessionWithId, ...sessions]
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            await put(blobPath, JSON.stringify(updatedSessions), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return new Response(JSON.stringify(sessionWithId), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        
        if (method === 'DELETE') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if(blobs.length > 0) {
               await del(blobs[0].url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
            return new Response(JSON.stringify({ success: true, message: 'History cleared.' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        return new Response(`Method ${method} Not Allowed`, { status: 405, headers: { 'Content-Type': 'application/json' }});

    } catch (error: any) {
        console.error('Error in /api/sessions:', error);
        return new Response(JSON.stringify({ message: 'An internal server error occurred.', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
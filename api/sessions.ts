import { put, list, del } from '@vercel/blob';
import type { Session } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ message: 'User ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return new Response(JSON.stringify({ message: 'Storage token is not configured.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
    
    const blobPath = `sessions/${userId}.json`;

    try {
        if (request.method === 'GET') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length === 0) {
                return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            const data = await fetch(blobs[0].url).then(res => res.json());
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (request.method === 'POST') {
            const newSession: Omit<Session, 'id'> = await request.json();
            
            let sessions: Session[] = [];
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                try {
                    const existingData = await fetch(blobs[0].url).then(res => res.json());
                    if (Array.isArray(existingData)) {
                       sessions = existingData;
                    }
                } catch (e) { /* File is empty or corrupt, start fresh */ }
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
        
        if (request.method === 'DELETE') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if(blobs.length > 0) {
               await del(blobs[0].url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
            return new Response(JSON.stringify({ success: true, message: 'History cleared.' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: { 'Content-Type': 'application/json' }});

    } catch (error: any) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
